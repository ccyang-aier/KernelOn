"""Mineradio's QQ Music and authenticated podcast use cases."""

from __future__ import annotations

import asyncio
import base64
import html
import random
import re
from contextlib import suppress
from typing import TYPE_CHECKING, Any
from urllib.parse import unquote_plus

from kernelon_api.modules.music.application import MusicJsonResult, MusicProviderError
from kernelon_api.modules.music.infrastructure.account_service import (
    normalize_login_info,
    normalize_quality_preference,
)

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence
    from uuid import UUID

    from kernelon_api.modules.music.application import (
        MusicAccountSessionPort,
        PodcastAccountProviderPort,
        QQMusicProviderPort,
    )

QQ_SMARTBOX_URL = "https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg"
QQ_PROFILE_URL = "https://c.y.qq.com/rsc/fcgi-bin/fcg_get_profile_homepage.fcg"
QQ_CREATED_URL = "https://c.y.qq.com/rsc/fcgi-bin/fcg_user_created_diss"
QQ_COLLECTED_URL = "https://c.y.qq.com/fav/fcgi-bin/fcg_get_profile_order_asset.fcg"
QQ_PLAYLIST_URL = "https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg"
QQ_COMMENTS_URL = "https://c.y.qq.com/base/fcgi-bin/fcg_global_comment_h5.fcg"
QQ_LYRIC_URL = "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg"
QQ_QUALITY = (
    ("RS01", ".flac", "hires", "Hi-Res FLAC"),
    ("F000", ".flac", "lossless", "无损 FLAC"),
    ("M800", ".mp3", "exhigh", "320k MP3"),
    ("M500", ".mp3", "standard", "128k MP3"),
    ("C400", ".m4a", "aac", "AAC/M4A"),
)


class BaselineQQMusicService:
    """Exact QQ route behavior with a user-scoped cookie, never global state."""

    def __init__(self, provider: QQMusicProviderPort, sessions: MusicAccountSessionPort) -> None:
        self._provider = provider
        self._sessions = sessions

    async def search(self, user_id: UUID, keywords: str, limit: int) -> MusicJsonResult:
        _ = user_id
        keyword = keywords.strip()
        if not keyword:
            return MusicJsonResult({"provider": "qq", "songs": []})
        body = await self._provider.qq_get(QQ_SMARTBOX_URL, qq_common(key=keyword))
        data = as_mapping(body.get("data"))
        song = as_mapping(data.get("song"))
        raw = mappings(song.get("itemlist"))[: max(1, min(limit or 6, 10))]
        base = [map_smart_song(item) for item in raw]
        detailed: list[dict[str, Any]] = []
        for item in base:
            try:
                detailed.append(await self._song_detail(str(item["mid"]), item))
            except MusicProviderError:
                detailed.append(item)
        seen: set[str] = set()
        songs = []
        for item in detailed:
            key = str(
                item.get("mid") or item.get("id") or f"{item.get('name')}|{item.get('artist')}"
            )
            if key and key not in seen and item.get("name"):
                seen.add(key)
                songs.append(item)
        return MusicJsonResult({"provider": "qq", "songs": songs})

    async def song_url(
        self, user_id: UUID, mid: str, media_mid: str, quality: str
    ) -> MusicJsonResult:
        song_mid = mid.strip()
        if not song_mid:
            return MusicJsonResult(
                {
                    "provider": "qq",
                    "url": "",
                    "error": "MISSING_MID",
                    "message": "Missing QQ song mid",
                }
            )
        session = await self._sessions.load(user_id)
        cookies = parse_cookie(session.qq_cookie)
        uin = qq_uin(cookies) or "0"
        music_key = qq_music_key(cookies)
        playback_key = qq_playback_key(cookies)
        requested = normalize_quality_preference(quality)
        start = next((i for i, item in enumerate(QQ_QUALITY) if item[2] == requested), 0)
        media_ids = list(dict.fromkeys(item for item in (media_mid.strip(), song_mid) if item))
        candidates = [
            {"level": level, "label": label, "filename": f"{prefix}{item}{ext}"}
            for item in media_ids
            for prefix, ext, level, label in QQ_QUALITY[start:]
        ]
        filenames = [str(item["filename"]) for item in candidates]
        comm: dict[str, Any] = {
            "uin": uin,
            "format": "json",
            "ct": 19 if music_key else 24,
            "cv": 0,
        }
        if music_key:
            comm["authst"] = music_key
        param: dict[str, Any] = {
            "guid": str(random.randint(10_000_000, 99_999_999)),  # noqa: S311
            "songmid": [song_mid] * len(filenames),
            "songtype": [0] * len(filenames),
            "uin": uin,
            "loginflag": 1,
            "platform": "20",
            "filename": filenames,
        }
        body = await self._provider.qq_musicu(
            {
                "comm": comm,
                "req_0": {"module": "vkey.GetVkeyServer", "method": "CgiGetVkey", "param": param},
            },
            session.qq_cookie,
        )
        data = as_mapping(as_mapping(body.get("req_0")).get("data"))
        infos = mappings(data.get("midurlinfo"))
        info = next((item for item in infos if item.get("purl")), infos[0] if infos else None)
        if info is not None and info.get("purl"):
            sip = next(
                (str(item) for item in values(data.get("sip")) if item),
                "https://ws.stream.qqmusic.qq.com/",
            )
            meta = next(
                (item for item in candidates if item["filename"] == info.get("filename")), {}
            )
            return MusicJsonResult(
                {
                    "provider": "qq",
                    "url": sip + str(info["purl"]),
                    "trial": False,
                    "playable": True,
                    "level": meta.get("level") or info.get("filename") or "",
                    "quality": meta.get("label") or info.get("filename") or "",
                    "filename": info.get("filename") or "",
                    "requestedQuality": requested,
                }
            )
        logged_in = bool(uin != "0" and music_key)
        playback_key_ready = bool(uin != "0" and playback_key)
        restriction = classify_qq_playback_restriction(
            info or {},
            has_session=logged_in,
            has_playback_key=playback_key_ready,
        )
        reason = str(restriction["category"])
        message = str(restriction["message"])
        payload: dict[str, Any] = {
            "provider": "qq",
            "url": "",
            "playable": False,
            "error": "QQ_URL_UNAVAILABLE",
            "loggedIn": logged_in,
            "playbackKeyReady": playback_key_ready,
            "restriction": restriction,
            "reason": reason,
            "message": message,
            "tried": [f"{item['label']} · {item['filename']}" for item in candidates],
            "requestedQuality": requested,
        }
        # In server.js these two values are read from `info && ...`. JSON.stringify
        # omits both when no midurlinfo exists, while an existing info object keeps
        # rawMessage's original (possibly non-string) edge shape.
        if info is not None:
            qq_code = info.get("result") or info.get("code") or info.get("errtype")
            if qq_code is not None:
                payload["qqCode"] = qq_code
            payload["rawMessage"] = info.get("msg") or info.get("tips") or info.get("errmsg") or ""
        return MusicJsonResult(payload)

    async def lyric(self, user_id: UUID, mid: str, song_id: str) -> MusicJsonResult:
        song_mid = mid.strip()
        numeric_id = number(re.sub(r"\D", "", song_id))
        session = await self._sessions.load(user_id)
        param: dict[str, Any] = {}
        if song_mid:
            param["songMID"] = song_mid
        if numeric_id:
            param["songID"] = numeric_id
        lyric = trans = qrc = roma = ""
        source = "qq-musicu"
        with suppress(MusicProviderError):
            body = await self._provider.qq_musicu(
                {
                    "comm": {"ct": 24, "cv": 0},
                    "lyric": {
                        "module": "music.musichallSong.PlayLyricInfo",
                        "method": "GetPlayLyricInfo",
                        "param": param,
                    },
                },
                session.qq_cookie,
            )
            data = as_mapping(as_mapping(body.get("lyric")).get("data"))
            lyric, trans, qrc, roma = (
                decode_lyric(data.get(key)) for key in ("lyric", "trans", "qrc", "roma")
            )
        if not lyric and song_mid:
            with suppress(MusicProviderError):
                body = await self._provider.qq_get(
                    QQ_LYRIC_URL,
                    qq_common(songmid=song_mid, songtype=0, nobase64=1),
                    session.qq_cookie,
                )
                lyric = decode_lyric(body.get("lyric"))
                trans = decode_lyric(body.get("trans") or body.get("tlyric")) or trans
                source = "qq-legacy"
        return MusicJsonResult(
            {
                "provider": "qq",
                "id": numeric_id or "",
                "mid": song_mid,
                "lyric": lyric,
                "tlyric": trans,
                "yrc": "",
                "qrc": qrc,
                "roma": roma,
                "source": source if lyric else "qq-empty",
            }
        )

    async def login_status(self, user_id: UUID) -> MusicJsonResult:
        return MusicJsonResult(await self._login_info(user_id))

    async def import_cookie(self, user_id: UUID, raw_cookie: object) -> MusicJsonResult:
        cookie = normalize_qq_cookie(raw_cookie)
        parsed = parse_cookie(cookie)
        if not qq_uin(parsed) or not qq_music_key(parsed):
            return MusicJsonResult(
                {
                    "provider": "qq",
                    "loggedIn": False,
                    "error": "INVALID_QQ_COOKIE",
                    "message": "QQ cookie 缺少 uin 或有效登录票据",
                },
                400,
            )
        await self._sessions.save_provider(user_id, "qq", cookie)
        return MusicJsonResult({**await self._login_info(user_id), "saved": True})

    async def logout(self, user_id: UUID) -> MusicJsonResult:
        await self._sessions.save_provider(user_id, "qq", "")
        return MusicJsonResult({"provider": "qq", "ok": True, "loggedIn": False})

    async def user_playlists(self, user_id: UUID) -> MusicJsonResult:
        info = await self._login_info(user_id)
        if not info.get("loggedIn") or not info.get("userId"):
            return MusicJsonResult({"loggedIn": False, "provider": "qq", "playlists": []})
        session = await self._sessions.load(user_id)
        uin = str(info["userId"])
        created_request = self._provider.qq_get(
            QQ_CREATED_URL,
            {
                **qq_common(),
                "hostuin": uin,
                "loginUin": uin,
                "sin": 0,
                "size": 200,
            },
            session.qq_cookie,
        )
        collected_request = self._provider.qq_get(
            QQ_COLLECTED_URL,
            {"ct": 20, "cid": 205360956, "userid": uin, "reqtype": 3, "sin": 0, "ein": 80},
            session.qq_cookie,
        )
        settled = await asyncio.gather(created_request, collected_request, return_exceptions=True)
        created_raw = settled[0]
        collected_raw = settled[1]
        created = (
            [
                map_playlist(item, "created")
                for item in mappings(as_mapping(created_raw.get("data")).get("disslist"))
            ]
            if isinstance(created_raw, dict)
            else []
        )
        collected = (
            [
                map_playlist(item, "collect")
                for item in mappings(as_mapping(collected_raw.get("data")).get("cdlist"))
            ]
            if isinstance(collected_raw, dict)
            else []
        )
        seen: set[str] = set()
        playlists = []
        for item in created + collected:
            if (
                item["id"]
                and item["name"]
                and item["id"] not in seen
                and not is_qzone_background_playlist(item)
            ):
                seen.add(item["id"])
                playlists.append(item)
        playlists.sort(key=is_qq_favorite_playlist, reverse=True)
        return MusicJsonResult(
            {"loggedIn": True, "provider": "qq", "userId": uin, "playlists": playlists}
        )

    async def playlist_tracks(self, user_id: UUID, playlist_id: str) -> MusicJsonResult:
        info = await self._login_info(user_id)
        if not info.get("loggedIn") or not info.get("userId"):
            return MusicJsonResult({"loggedIn": False, "provider": "qq", "tracks": []})
        if not playlist_id.strip():
            return MusicJsonResult(
                {
                    "loggedIn": True,
                    "provider": "qq",
                    "error": "Missing QQ playlist id",
                    "tracks": [],
                }
            )
        session = await self._sessions.load(user_id)
        body = await self._provider.qq_get(
            QQ_PLAYLIST_URL,
            {
                **qq_common(),
                "type": 1,
                "utf8": 1,
                "disstid": playlist_id,
                "loginUin": str(info["userId"]),
            },
            session.qq_cookie,
        )
        detail = mappings(body.get("cdlist"))
        data = detail[0] if detail else {}
        tracks = [map_playlist_track(item) for item in mappings(data.get("songlist"))]
        tracks = [
            item for item in tracks if item.get("name") and (item.get("mid") or item.get("id"))
        ]
        playlist = {
            "provider": "qq",
            "id": playlist_id,
            "name": data.get("dissname") or data.get("diss_name") or data.get("name") or "",
            "cover": data.get("logo") or data.get("diss_cover") or "",
            "trackCount": len(tracks),
        }
        return MusicJsonResult(
            {"loggedIn": True, "provider": "qq", "playlist": playlist, "tracks": tracks}
        )

    async def artist_detail(self, user_id: UUID, mid: str, limit: int) -> MusicJsonResult:
        session = await self._sessions.load(user_id)
        body = await self._provider.qq_musicu(
            {
                "comm": {"ct": 24, "cv": 0},
                "singer": {
                    "module": "music.web_singer_info_svr",
                    "method": "get_singer_detail_info",
                    "param": {"sort": 5, "singermid": mid, "sin": 0, "num": limit},
                },
            },
            session.qq_cookie,
        )
        block = as_mapping(body.get("singer"))
        if not block or number(block.get("code")) != 0:
            return MusicJsonResult(
                {
                    "provider": "qq",
                    "error": block.get("message")
                    or block.get("msg")
                    or block.get("code")
                    or "QQ_ARTIST_DETAIL_FAILED",
                    "artist": None,
                    "songs": [],
                }
            )
        data = as_mapping(block.get("data"))
        info = as_mapping(data.get("singer_info") or data.get("singerInfo"))
        songs = [
            map_track(
                as_mapping(
                    item.get("track_info")
                    or item.get("songInfo")
                    or item.get("songinfo")
                    or item.get("song")
                    or item
                ),
                {},
            )
            for item in mappings(data.get("songlist"))
        ]
        songs = [item for item in songs if item.get("name") and (item.get("mid") or item.get("id"))]
        artist_mid = str(info.get("mid") or mid)
        matched_song_artist = next(
            (
                artist
                for artist in mappings(songs[0].get("artists") if songs else [])
                if artist.get("mid") == mid
            ),
            {},
        )
        total = number(data.get("total_song") or data.get("song_count")) or len(songs)
        artist = {
            "provider": "qq",
            "id": info.get("id") or "",
            "mid": artist_mid,
            "name": info.get("name") or info.get("title") or matched_song_artist.get("name") or "",
            "avatar": info.get("pic") or info.get("avatar") or singer_avatar(artist_mid),
            "fans": number(info.get("fans")),
            "musicSize": total,
            "albumSize": number(data.get("total_album")),
            "mvSize": number(data.get("total_mv")),
        }
        return MusicJsonResult({"provider": "qq", "artist": artist, "total": total, "songs": songs})

    async def song_comments(
        self, user_id: UUID, song_id: str, mid: str, limit: int, offset: int
    ) -> MusicJsonResult:
        topid = re.sub(r"\D", "", song_id)
        if not topid and mid:
            with suppress(MusicProviderError):
                detail = await self._song_detail(mid, {"mid": mid})
                topid = re.sub(r"\D", "", str(detail.get("qqId") or detail.get("id") or ""))
        if not topid:
            return MusicJsonResult(
                {"provider": "qq", "error": "Missing QQ song id", "comments": []}
            )
        session = await self._sessions.load(user_id)
        uin = qq_uin(parse_cookie(session.qq_cookie)) or "0"
        page = max(0, offset // max(1, limit))
        body = await self._provider.qq_get(
            QQ_COMMENTS_URL,
            {
                **qq_common(),
                "loginUin": uin,
                "cid": 205360772,
                "reqtype": 2,
                "biztype": 1,
                "topid": topid,
                "cmd": 8,
                "needmusiccrit": 0,
                "pagenum": page,
                "pagesize": limit,
            },
            session.qq_cookie,
        )
        hot = mappings(as_mapping(body.get("hot_comment")).get("commentlist"))
        normal = mappings(as_mapping(body.get("comment")).get("commentlist"))
        use_hot = offset == 0 and bool(hot)
        comments = [map_comment(item) for item in (hot if use_hot else normal)]
        comments = [item for item in comments if item["content"]]
        total = number(
            as_mapping(body.get("comment")).get("commenttotal")
            or as_mapping(body.get("comment")).get("comment_total")
        ) or len(comments)
        return MusicJsonResult(
            {"provider": "qq", "id": topid, "total": total, "comments": comments, "hot": use_hot}
        )

    async def _song_detail(self, mid: str, fallback: Mapping[str, Any]) -> dict[str, Any]:
        body = await self._provider.qq_musicu(
            {
                "comm": {"ct": 24, "cv": 0},
                "songinfo": {
                    "module": "music.pf_song_detail_svr",
                    "method": "get_song_detail_yqq",
                    "param": {"song_mid": mid},
                },
            }
        )
        return map_track(
            as_mapping(as_mapping(as_mapping(body.get("songinfo")).get("data")).get("track_info")),
            fallback,
        )

    async def _login_info(self, user_id: UUID) -> dict[str, Any]:
        session = await self._sessions.load(user_id)
        cookies = parse_cookie(session.qq_cookie)
        uin = qq_uin(cookies)
        key = qq_music_key(cookies)
        if not uin or not key:
            return {"provider": "qq", "loggedIn": False, "hasCookie": bool(session.qq_cookie)}
        fallback = qq_profile({}, cookies, bool(session.qq_cookie))
        try:
            body = await self._provider.qq_get(
                QQ_PROFILE_URL,
                {**qq_common(), "cid": 205360838, "userid": uin, "reqfrom": 1},
                session.qq_cookie,
            )
            if body.get("code") == 1000 or body.get("result") == 301:
                return {**fallback, "profileUnavailable": True}
            return qq_profile(body, cookies, True)
        except MusicProviderError:
            return {**fallback, "profileUnavailable": True}


class BaselinePodcastAccountService:
    def __init__(
        self, provider: PodcastAccountProviderPort, sessions: MusicAccountSessionPort
    ) -> None:
        self._provider = provider
        self._sessions = sessions

    async def collections(self, user_id: UUID) -> MusicJsonResult:
        info = await self._login_info(user_id)
        if not info:
            return MusicJsonResult(
                {
                    "loggedIn": False,
                    "collections": [
                        collection_meta(key, []) for key in ("collect", "created", "liked")
                    ],
                }
            )
        result = []
        for key in ("collect", "created", "liked"):
            try:
                _, items = await self._items(user_id, key, 12, 0, info)
            except MusicProviderError:
                items = []
            result.append(collection_meta(key, items))
        return MusicJsonResult({"loggedIn": True, "collections": result})

    async def collection_items(
        self, user_id: UUID, key: str, limit: int, offset: int
    ) -> MusicJsonResult:
        info = await self._login_info(user_id)
        if not info:
            return MusicJsonResult({"loggedIn": False, "items": []})
        item_type, items = await self._items(user_id, key, limit, offset, info)
        return MusicJsonResult(
            {
                "loggedIn": True,
                "key": key,
                **collection_meta(key, items),
                "itemType": item_type,
                "items": items,
            }
        )

    async def _login_info(self, user_id: UUID) -> dict[str, Any] | None:
        session = await self._sessions.load(user_id)
        if not session.cookie:
            return None
        for call in (self._provider.login_status, self._provider.user_account):
            with suppress(MusicProviderError):
                body = (await call(session.cookie)).payload
                data = as_mapping(body.get("data") or body)
                info = normalize_login_info(
                    as_mapping(data.get("profile") or body.get("profile")),
                    as_mapping(data.get("account") or body.get("account")),
                    data,
                )
                if info.get("loggedIn") and info.get("userId") is not None:
                    return info
        return None

    async def _items(
        self, user_id: UUID, key: str, limit: int, offset: int, info: Mapping[str, Any]
    ) -> tuple[str, list[dict[str, Any]]]:
        session = await self._sessions.load(user_id)
        limit = max(8, min(60, limit or 30))
        offset = max(0, offset)
        if key == "collect":
            body = (await self._provider.podcast_sublist(limit, offset, session.cookie)).payload
            return "radio", [
                map_collection_radio(item, key)
                for item in first_array(body, ("djRadios", "djradios", "radios", "data"))
                if item.get("id") or item.get("rid") or item.get("radioId")
            ]
        if key == "created":
            body = (
                await self._provider.podcast_created(str(info["userId"]), session.cookie)
            ).payload
            return "radio", [
                map_collection_radio(item, key)
                for item in first_array(body, ("data", "djRadios", "djradios", "radios"))
                if item.get("id") or item.get("rid") or item.get("radioId")
            ]
        if key == "paid":
            body = (await self._provider.podcast_paid(limit, offset, session.cookie)).payload
            return "radio", [
                map_collection_radio(item, key)
                for item in first_array(body, ("data", "djRadios", "djradios", "radios"))
                if item.get("id") or item.get("rid") or item.get("radioId")
            ]
        if key == "liked":
            raw: list[Mapping[str, Any]] = []
            with suppress(MusicProviderError):
                raw = first_array(
                    (await self._provider.podcast_liked(session.cookie)).payload,
                    ("data", "resources", "list"),
                )
            if not raw:
                with suppress(MusicProviderError):
                    raw = first_array(
                        (await self._provider.podcast_recent_voices(limit, session.cookie)).payload,
                        ("data", "list", "resources"),
                    )
            items = [map_voice(item) for item in raw]
            return "voice", [item for item in items if item.get("id") and item.get("name")]
        return "radio", []


def qq_common(**extra: str | int) -> dict[str, str | int]:
    return {
        "format": "json",
        "g_tk": 5381,
        "loginUin": 0,
        "hostUin": 0,
        "inCharset": "utf8",
        "outCharset": "utf-8",
        "notice": 0,
        "platform": "yqq.json",
        "needNewCode": 0,
        **extra,
    }


def classify_qq_playback_restriction(
    info: Mapping[str, Any], *, has_session: bool, has_playback_key: bool
) -> dict[str, Any]:
    """Mirror Mineradio's ordered QQ playback restriction classification."""
    raw_message = js_string(
        info.get("msg") or info.get("tips") or info.get("errmsg") or info.get("message") or ""
    ).strip()
    code = number(info.get("result") or info.get("code") or info.get("errtype"))
    if not has_session:
        return {
            "provider": "qq",
            "category": "login_required",
            "message": "QQ 音乐需要登录或授权后才能获取播放地址",
            "action": "login",
            "code": code,
            "rawMessage": raw_message,
        }
    if not has_playback_key and code == 104003:
        return {
            "provider": "qq",
            "category": "login_required",
            "message": (
                "QQ 音乐当前只拿到了网页登录状态，还缺少播放授权，"
                "请重新打开官方 QQ 音乐登录窗口完成授权"
            ),
            "action": "login",
            "code": code,
            "rawMessage": raw_message,
            "missingPlaybackKey": True,
        }
    if code == 104003:
        return {
            "provider": "qq",
            "category": "copyright_unavailable",
            "message": (
                "QQ 音乐没有给当前版本返回播放地址，通常是版权、会员或官方版本限制，"
                "可以换一个搜索结果或切到网易云源"
            ),
            "action": "switch_source",
            "code": code,
            "rawMessage": raw_message,
        }
    if re.search(r"vip|会员|付费|购买|数字专辑|专辑|pay", raw_message, re.IGNORECASE):
        return {
            "provider": "qq",
            "category": "paid_required",
            "message": "QQ 音乐歌曲需要会员、购买或数字专辑权限",
            "action": "upgrade",
            "code": code,
            "rawMessage": raw_message,
        }
    if code:
        return {
            "provider": "qq",
            "category": "copyright_unavailable",
            "message": raw_message or "QQ 音乐版权暂不可播或仅官方客户端可播",
            "action": "switch_source",
            "code": code,
            "rawMessage": raw_message,
        }
    return {
        "provider": "qq",
        "category": "url_unavailable",
        "message": "QQ 音乐没有返回播放地址，可能受版权、会员或官方客户端限制",
        "action": "switch_source",
        "code": code,
        "rawMessage": raw_message,
    }


def parse_cookie(value: str) -> dict[str, str]:
    return {
        key.strip(): child.strip()
        for part in value.split(";")
        if "=" in part
        for key, child in [part.split("=", 1)]
        if key.strip()
    }


def normalize_qq_cookie(value: object) -> str:
    raw = value if isinstance(value, str) else ""
    obj = parse_cookie(raw)
    if obj.get("login_type") == "2" and obj.get("wxuin") and not obj.get("uin"):
        obj["uin"] = obj["wxuin"]
    if not obj.get("uin"):
        obj["uin"] = obj.get("qqmusic_uin") or obj.get("p_uin") or ""
    if obj.get("uin"):
        obj["uin"] = re.sub(r"\D", "", obj["uin"]).lstrip("0") or re.sub(r"\D", "", obj["uin"])
    return "; ".join(f"{key}={child}" for key, child in obj.items() if child)


def qq_uin(obj: Mapping[str, str]) -> str:
    raw = (
        obj.get("wxuin") or obj.get("uin") or obj.get("p_uin")
        if obj.get("login_type") == "2"
        else obj.get("uin") or obj.get("qqmusic_uin") or obj.get("wxuin") or obj.get("p_uin")
    )
    digits = re.sub(r"\D", "", raw or "")
    return digits.lstrip("0") or digits


def qq_music_key(obj: Mapping[str, str]) -> str:
    return next(
        (
            obj.get(key, "")
            for key in (
                "qm_keyst",
                "qqmusic_key",
                "music_key",
                "p_skey",
                "skey",
                "psrf_qqaccess_token",
                "psrf_qqrefresh_token",
                "wxrefresh_token",
                "wxskey",
            )
            if obj.get(key)
        ),
        "",
    )


def qq_playback_key(obj: Mapping[str, str]) -> str:
    return next(
        (
            obj.get(key, "")
            for key in ("qm_keyst", "qqmusic_key", "music_key", "wxskey")
            if obj.get(key)
        ),
        "",
    )


def qq_profile(
    body: Mapping[str, Any], cookies: Mapping[str, str], has_cookie: bool
) -> dict[str, Any]:
    uin = qq_uin(cookies)
    data = as_mapping(
        body.get("data") or body.get("profile") or body.get("creator") or body.get("result")
    )
    creator = as_mapping(data.get("creator") or data.get("user") or data.get("profile") or data)
    vip_info = as_mapping(
        data.get("vipInfo")
        or data.get("vipinfo")
        or data.get("vip")
        or creator.get("vipInfo")
        or creator.get("vipinfo")
    )
    profile_nick = (
        creator.get("nick")
        or creator.get("nickname")
        or creator.get("name")
        or creator.get("hostname")
        or creator.get("title")
        or ""
    )
    profile_avatar = (
        creator.get("headpic")
        or creator.get("avatar")
        or creator.get("avatarUrl")
        or creator.get("logo")
        or ""
    )
    cookie_nick = qq_cookie_nickname(cookies, uin)
    nick = profile_nick or cookie_nick or ""
    avatar = profile_avatar or qq_cookie_avatar(cookies, uin)
    vip_type = number(
        cookies.get("vipType")
        or cookies.get("vip_type")
        or data.get("vipType")
        or data.get("vip_type")
        or data.get("viptype")
        or data.get("music_vip_level")
        or data.get("green_vip_level")
        or data.get("luxury_vip_level")
        or creator.get("vipType")
        or creator.get("vip_type")
        or creator.get("music_vip_level")
        or creator.get("green_vip_level")
        or creator.get("luxury_vip_level")
        or vip_info.get("vipType")
        or vip_info.get("vip_type")
        or vip_info.get("music_vip_level")
        or vip_info.get("green_vip_level")
        or vip_info.get("luxury_vip_level")
    )
    if not vip_type:
        vip_flag = (
            data.get("isVip")
            or data.get("is_vip")
            or data.get("vipFlag")
            or data.get("vipflag")
            or creator.get("isVip")
            or creator.get("is_vip")
            or vip_info.get("isVip")
            or vip_info.get("is_vip")
            or vip_info.get("vipFlag")
        )
        if vip_flag is True or number(vip_flag) > 0 or str(vip_flag or "").lower() == "true":
            vip_type = 1
    return {
        "provider": "qq",
        "loggedIn": bool(uin and qq_music_key(cookies)),
        "preview": False,
        "userId": uin,
        "nickname": nick or (f"QQ {uin}" if uin else "QQ 音乐"),
        "avatar": avatar,
        "vipType": vip_type,
        "hasCookie": has_cookie,
        "playbackKeyReady": bool(qq_playback_key(cookies)),
        "profileSource": "qq-profile"
        if profile_nick or profile_avatar
        else "cookie"
        if cookie_nick or avatar
        else "fallback",
    }


def decode_qq_cookie_value(value: object) -> str:
    return unquote_plus(str(value or "")).strip()


def qq_cookie_nickname(cookies: Mapping[str, str], uin: str) -> str:
    padded = f"0{uin}" if uin else ""
    keys = [
        f"ptnick_{uin}" if uin else "",
        f"ptnick_{padded}" if padded else "",
        "ptnick",
        "nick",
        "nickname",
        "qq_nickname",
    ]
    for key in keys:
        if key and cookies.get(key):
            nick = decode_qq_cookie_value(cookies[key])
            if nick:
                return nick
    ptnick_key = next(
        (key for key, value in cookies.items() if key.lower().startswith("ptnick_") and value),
        "",
    )
    return decode_qq_cookie_value(cookies.get(ptnick_key)) if ptnick_key else ""


def qq_cookie_avatar(cookies: Mapping[str, str], uin: str) -> str:
    direct = (
        cookies.get("qqmusic_avatar")
        or cookies.get("avatar")
        or cookies.get("avatarUrl")
        or cookies.get("headpic")
        or ""
    )
    if direct:
        return decode_qq_cookie_value(direct)
    return f"https://q1.qlogo.cn/g?b=qq&nk={uin}&s=100" if uin else ""


def map_artists(raw: object) -> list[dict[str, Any]]:
    return [
        {
            "id": item.get("id"),
            "mid": item.get("mid"),
            "name": item.get("name") or item.get("title") or "",
        }
        for item in mappings(raw)
        if item.get("name") or item.get("title")
    ]


def map_smart_song(item: Mapping[str, Any]) -> dict[str, Any]:
    mid = item.get("mid") or item.get("songmid") or item.get("id") or ""
    return {
        "provider": "qq",
        "source": "qq",
        "type": "qq",
        "id": mid,
        "qqId": item.get("id") or item.get("docid") or "",
        "mid": mid,
        "songmid": mid,
        "name": item.get("name") or item.get("title") or "",
        "artist": item.get("singer") or "",
        "artists": [{"name": item["singer"]}] if item.get("singer") else [],
        "album": "",
        "cover": "",
        "duration": 0,
        "fee": 0,
        "playable": False,
    }


def album_cover(mid: object) -> str:
    return (
        f"https://y.qq.com/music/photo_new/T002R300x300M000{mid}.jpg?max_age=2592000" if mid else ""
    )


def singer_avatar(mid: object) -> str:
    return (
        f"https://y.qq.com/music/photo_new/T001R300x300M000{mid}.jpg?max_age=2592000" if mid else ""
    )


def map_track(track: Mapping[str, Any], fallback: Mapping[str, Any]) -> dict[str, Any]:
    album = as_mapping(track.get("album"))
    artists = map_artists(track.get("singer"))
    mid = track.get("mid") or fallback.get("mid") or fallback.get("songmid") or ""
    album_mid = album.get("mid") or album.get("pmid") or ""
    return {
        "provider": "qq",
        "source": "qq",
        "type": "qq",
        "id": mid,
        "qqId": track.get("id") or fallback.get("qqId") or fallback.get("id") or "",
        "mid": mid,
        "songmid": mid,
        "mediaMid": as_mapping(track.get("file")).get("media_mid"),
        "name": track.get("name") or track.get("title") or fallback.get("name") or "",
        "artist": " / ".join(str(item["name"]) for item in artists) or fallback.get("artist") or "",
        "artists": artists or fallback.get("artists") or [],
        "artistId": (artists[0].get("id") or artists[0].get("mid")) if artists else None,
        "artistMid": artists[0].get("mid") if artists else None,
        "album": album.get("name") or album.get("title") or fallback.get("album") or "",
        "albumMid": album_mid,
        "cover": album_cover(album_mid) or fallback.get("cover") or "",
        "duration": number(track.get("interval")) * 1000,
        "fee": 1 if number(as_mapping(track.get("pay")).get("pay_play")) else 0,
        "playable": False,
    }


def map_playlist(item: Mapping[str, Any], kind: str) -> dict[str, Any]:
    playlist_id = (
        item.get("dissid")
        or item.get("tid")
        or item.get("dirid")
        or item.get("id")
        or item.get("diss_id")
    )
    return {
        "provider": "qq",
        "source": "qq",
        "id": str(playlist_id) if playlist_id else "",
        "name": item.get("diss_name") or item.get("name") or item.get("title") or "",
        "cover": item.get("diss_cover")
        or item.get("logo")
        or item.get("picurl")
        or item.get("cover")
        or "",
        "trackCount": item.get("song_cnt")
        or item.get("songnum")
        or item.get("total_song_num")
        or item.get("song_count")
        or 0,
        "playCount": item.get("listen_num") or item.get("visitnum") or item.get("play_count") or 0,
        "creator": item.get("hostname") or item.get("nick") or item.get("creator") or "QQ 音乐",
        "subscribed": kind == "collect",
        "specialType": 0,
    }


def map_playlist_track(raw: Mapping[str, Any]) -> dict[str, Any]:
    track = (
        raw
        if raw.get("songid") or raw.get("songmid") or raw.get("mid") or raw.get("name")
        else as_mapping(
            raw.get("track_info") or raw.get("songInfo") or raw.get("songinfo") or raw.get("song")
        )
    )
    album = as_mapping(track.get("album"))
    artists = map_artists(track.get("singer") or track.get("singers"))
    mid = track.get("mid") or track.get("songmid") or raw.get("mid") or raw.get("songmid") or ""
    album_mid = album.get("mid") or track.get("albummid") or raw.get("albummid") or ""
    return {
        "provider": "qq",
        "source": "qq",
        "type": "qq",
        "id": mid
        or str(track.get("id") or track.get("songid") or raw.get("id") or raw.get("songid") or ""),
        "qqId": track.get("id") or track.get("songid") or raw.get("id") or raw.get("songid") or "",
        "mid": mid,
        "songmid": mid,
        "mediaMid": as_mapping(track.get("file")).get("media_mid")
        or track.get("strMediaMid")
        or track.get("media_mid")
        or raw.get("strMediaMid")
        or "",
        "name": track.get("name") or track.get("songname") or raw.get("songname") or "",
        "artist": " / ".join(str(item["name"]) for item in artists)
        or track.get("singername")
        or raw.get("singername")
        or "",
        "artists": artists,
        "artistId": (artists[0].get("id") or artists[0].get("mid")) if artists else None,
        "artistMid": artists[0].get("mid") if artists else None,
        "album": album.get("name")
        or album.get("title")
        or track.get("albumname")
        or raw.get("albumname")
        or "",
        "albumMid": album_mid,
        "cover": album_cover(album_mid),
        "duration": number(track.get("interval") or raw.get("interval")) * 1000,
        "fee": 1 if number(as_mapping(track.get("pay")).get("pay_play")) else 0,
        "playable": False,
    }


def is_qq_favorite_playlist(playlist: Mapping[str, Any]) -> bool:
    return bool(
        re.search(r"我喜欢|我的喜欢|喜欢的音乐", str(playlist.get("name") or "").strip(), re.I)
    )


def is_qzone_background_playlist(playlist: Mapping[str, Any]) -> bool:
    text = f"{playlist.get('name') or ''} {playlist.get('creator') or ''}".lower()
    return bool(re.search(r"qzone|空间|背景音乐", text, re.I))


def map_comment(raw: Mapping[str, Any]) -> dict[str, Any]:
    user = as_mapping(raw.get("user") or raw.get("uin"))
    timestamp = number(raw.get("time") or raw.get("commenttime") or raw.get("createTime"))
    timestamp = timestamp * 1000 if timestamp and timestamp < 10_000_000_000 else timestamp
    return {
        "id": raw.get("commentid") or raw.get("commentId") or raw.get("id") or "",
        "content": raw.get("rootcommentcontent") or raw.get("content") or raw.get("comment") or "",
        "likedCount": number(
            raw.get("praisenum") or raw.get("praise_num") or raw.get("likedCount")
        ),
        "time": timestamp,
        "user": {
            "id": raw.get("encrypt_uin") or raw.get("uin") or user.get("uin") or "",
            "nickname": raw.get("nick")
            or raw.get("nickname")
            or raw.get("encrypt_uin")
            or user.get("nick")
            or user.get("nickname")
            or user.get("name")
            or "QQ 音乐用户",
            "avatar": raw.get("avatarurl")
            or raw.get("avatar")
            or user.get("avatarurl")
            or user.get("avatar")
            or "",
        },
    }


def decode_lyric(value: object) -> str:
    raw = html.unescape(str(value or "").strip())
    compact = re.sub(r"\s+", "", raw)
    if (
        len(compact) >= 8
        and len(compact) % 4 == 0
        and re.fullmatch(r"[A-Za-z0-9+/]+={0,2}", compact)
        and not raw.lstrip().startswith("[")
    ):
        with suppress(ValueError, UnicodeDecodeError):
            decoded = base64.b64decode(compact).decode().lstrip("\ufeff")
            if "[" in decoded or re.search(r"[\u4e00-\u9fa5]", decoded):
                raw = decoded
    return html.unescape(raw).replace("\r\n", "\n").strip()


def map_radio(item: Mapping[str, Any]) -> dict[str, Any]:
    dj = as_mapping(
        item.get("dj") or item.get("djSimple") or item.get("djUser") or item.get("creator")
    )
    radio_id = item.get("id") or item.get("rid") or item.get("radioId")
    return {
        "id": radio_id,
        "rid": radio_id,
        "name": item.get("name") or item.get("radioName") or "",
        "cover": item.get("picUrl")
        or item.get("picURL")
        or item.get("coverUrl")
        or item.get("coverImgUrl")
        or item.get("avatarUrl")
        or "",
        "desc": item.get("desc") or item.get("description") or "",
        "category": item.get("category") or item.get("categoryName") or "",
        "programCount": item.get("programCount")
        or item.get("programcount")
        or item.get("programNum")
        or 0,
        "subCount": item.get("subCount")
        or item.get("subcount")
        or item.get("subscribedCount")
        or 0,
        "playCount": item.get("playCount") or item.get("playcount") or 0,
        "djName": dj.get("nickname") or dj.get("name") or "",
        "djAvatar": dj.get("avatarUrl") or dj.get("avatar") or "",
        "subscribed": bool(item.get("subed") or item.get("subscribed")),
    }


def map_collection_radio(item: Mapping[str, Any], key: str) -> dict[str, Any]:
    radio = map_radio(item)
    return {
        **radio,
        "type": "podcast-radio",
        "sourceType": "podcast-radio",
        "collectionKey": key,
        "radioId": radio["id"],
        "name": radio["name"],
        "artist": radio["djName"] or radio["category"] or "Podcast",
        "album": radio["category"] or "Podcast",
    }


def map_voice(value: Mapping[str, Any]) -> dict[str, Any]:
    raw = as_mapping(
        value.get("resource")
        or value.get("voice")
        or value.get("data")
        or value.get("program")
        or value
    )
    song = as_mapping(raw.get("mainSong") or raw.get("song") or raw.get("track"))
    radio = as_mapping(
        raw.get("radio") or raw.get("djRadio") or raw.get("voiceList") or raw.get("podcast")
    )
    playable = (
        raw.get("trackId")
        or raw.get("songId")
        or raw.get("mainSongId")
        or song.get("id")
        or raw.get("id")
    )
    return {
        "type": "podcast",
        "source": "podcast",
        "sourceType": "podcast-voice",
        "id": playable,
        "programId": raw.get("programId") or raw.get("voiceId") or raw.get("id"),
        "radioId": radio.get("id")
        or radio.get("radioId")
        or radio.get("voiceListId")
        or raw.get("radioId")
        or raw.get("voiceListId"),
        "name": raw.get("name")
        or raw.get("songName")
        or raw.get("title")
        or song.get("name")
        or "",
        "artist": radio.get("name")
        or radio.get("radioName")
        or radio.get("voiceListName")
        or raw.get("podcastName")
        or raw.get("djName")
        or "Voice",
        "album": radio.get("name") or radio.get("radioName") or raw.get("podcastName") or "Podcast",
        "cover": raw.get("coverUrl")
        or raw.get("cover")
        or raw.get("picUrl")
        or raw.get("coverImgUrl")
        or radio.get("picUrl")
        or radio.get("coverUrl")
        or "",
        "duration": raw.get("duration")
        or raw.get("durationMs")
        or song.get("dt")
        or song.get("duration")
        or 0,
        "djName": raw.get("djName") or as_mapping(radio.get("dj")).get("nickname") or "",
        "radioName": radio.get("name") or radio.get("radioName") or raw.get("podcastName") or "",
        "desc": raw.get("desc") or raw.get("description") or "",
    }


def collection_meta(key: str, items: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    meta = {
        "collect": {
            "key": "collect",
            "title": "收藏播客",
            "sub": "你收藏的播客",
            "itemType": "radio",
        },
        "created": {
            "key": "created",
            "title": "创建播客",
            "sub": "你创建的播客",
            "itemType": "radio",
        },
        "liked": {
            "key": "liked",
            "title": "喜欢的声音",
            "sub": "收藏或最近喜欢的声音",
            "itemType": "voice",
        },
    }.get(key, {"key": key, "title": key, "sub": "", "itemType": "radio"})
    first = items[0] if items else {}
    return {
        **meta,
        "count": len(items),
        "cover": first.get("cover") or first.get("picUrl") or first.get("coverUrl") or "",
    }


def first_array(body: Mapping[str, Any], keys: tuple[str, ...]) -> list[Mapping[str, Any]]:
    for key in keys:
        value = body.get(key)
        if isinstance(value, list):
            return mappings(value)
        nested = as_mapping(value)
        for child in ("list", "data", "resources"):
            if isinstance(nested.get(child), list):
                return mappings(nested[child])
    return []


def as_mapping(value: object) -> Mapping[str, Any]:
    return value if isinstance(value, dict) else {}


def mappings(value: object) -> list[Mapping[str, Any]]:
    return [item for item in value if isinstance(item, dict)] if isinstance(value, list) else []


def values(value: object) -> list[Any]:
    return value if isinstance(value, list) else []


def number(value: object) -> int:
    with suppress(TypeError, ValueError):
        return int(str(value or 0))
    return 0


def js_string(value: object) -> str:
    """Match JavaScript String() for provider message edge values used by server.js."""
    if value is None:
        return ""
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, dict):
        return "[object Object]"
    if isinstance(value, list):
        return ",".join(js_string(item) for item in value)
    return str(value)
