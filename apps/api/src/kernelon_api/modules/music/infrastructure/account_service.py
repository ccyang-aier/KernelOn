"""Mineradio-compatible Netease account and write use cases."""

from __future__ import annotations

import base64
import re
from contextlib import suppress
from io import BytesIO
from typing import TYPE_CHECKING, Any
from urllib.parse import quote

import segno

from kernelon_api.modules.music.application import (
    MusicAccountSession,
    MusicJsonResult,
    MusicProviderError,
)

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence
    from uuid import UUID

    from kernelon_api.modules.music.application import (
        MusicAccountSessionPort,
        NeteaseAccountProviderPort,
    )

COOKIE_ATTRIBUTE_NAMES = frozenset(
    {"path", "domain", "expires", "max-age", "samesite", "secure", "httponly"}
)
DEFAULT_LOGIN_INFO: dict[str, Any] = {
    "loggedIn": False,
    "vipType": 0,
    "vipLevel": "none",
    "isVip": False,
    "isSvip": False,
    "vipLabel": "无VIP",
}
NETEASE_QUALITY_CANDIDATES = (
    {"level": "jymaster", "br": 1_999_000, "label": "超清母带", "svip": True},
    {"level": "hires", "br": 1_999_000, "label": "高清臻音"},
    {"level": "lossless", "br": 1_411_000, "label": "无损"},
    {"level": "exhigh", "br": 999_000, "label": "极高"},
    {"level": "standard", "br": 128_000, "label": "标准"},
)


class BaselineNeteaseAccountService:
    """Keep provider credentials behind a KernelOn-user-scoped session port."""

    def __init__(
        self,
        provider: NeteaseAccountProviderPort,
        sessions: MusicAccountSessionPort,
    ) -> None:
        self._provider = provider
        self._sessions = sessions

    async def import_cookie(self, user_id: UUID, raw_cookie: object) -> MusicJsonResult:
        cookie = normalize_cookie_header(raw_cookie)
        if "MUSIC_U" not in parse_cookie_string(cookie):
            return MusicJsonResult(
                payload={
                    "loggedIn": False,
                    "error": "INVALID_NETEASE_COOKIE",
                    "message": "网易云 cookie 缺少 MUSIC_U",
                },
                status_code=400,
            )
        await self._sessions.save_provider(user_id, "netease", cookie)
        info = await self._get_login_info(user_id)
        saved_cookie = (await self._sessions.load(user_id)).cookie
        if not info.get("loggedIn") and saved_cookie:
            info = {
                "loggedIn": True,
                "pendingProfile": True,
                "nickname": "网易云用户",
                "avatar": "",
                **vip_info(),
            }
        return MusicJsonResult(payload={**info, "saved": True, "hasCookie": bool(saved_cookie)})

    async def create_qr_key(self, user_id: UUID) -> MusicJsonResult:
        _ = user_id
        response = await self._provider.login_qr_key()
        data = as_mapping(response.payload.get("data"))
        return MusicJsonResult(
            payload={"key": data.get("unikey") or response.payload.get("unikey")}
        )

    async def create_qr_code(self, user_id: UUID, key: str) -> MusicJsonResult:
        _ = user_id
        qr_url = f"https://music.163.com/login?codekey={quote(key, safe='')}"
        return MusicJsonResult(payload={"img": qr_png_data_url(qr_url), "url": qr_url})

    async def check_qr_code(self, user_id: UUID, key: str) -> MusicJsonResult:
        current = await self._sessions.load(user_id)
        response = await self._provider.login_qr_check(key)
        body = response.payload
        code = api_code(body)
        message = api_message(body)
        cookie = response.cookie or cookie_from_payload(body)
        if code == 803 and not cookie:
            with suppress(MusicProviderError):
                retry = await self._provider.login_qr_check(key, cookie=current.cookie)
                retry_cookie = retry.cookie or cookie_from_payload(retry.payload)
                if retry_cookie:
                    response = retry
                    body = retry.payload
                    code = api_code(body) or code
                    message = api_message(body) or message
                    cookie = retry_cookie
        if code != 803:
            return MusicJsonResult(
                payload={
                    "code": code,
                    "message": message,
                    "nickname": body.get("nickname"),
                    "avatar": body.get("avatarUrl"),
                }
            )
        if cookie:
            await self._sessions.save_provider(user_id, "netease", cookie)
        info = await self._get_login_info(user_id)
        if not info.get("loggedIn"):
            data = as_mapping(body.get("data"))
            info = normalize_login_info(
                as_mapping(body.get("profile") or data.get("profile")),
                as_mapping(body.get("account") or data.get("account")),
                data or body,
            )
        if not info.get("loggedIn") and cookie:
            profile = as_mapping(body.get("profile"))
            info = {
                "loggedIn": True,
                "pendingProfile": True,
                "nickname": body.get("nickname") or profile.get("nickname") or "网易云用户",
                "avatar": body.get("avatarUrl") or profile.get("avatarUrl") or "",
                **vip_info(),
            }
        return MusicJsonResult(
            payload={"code": code, "message": message, **info, "hasCookie": bool(cookie)}
        )

    async def get_login_status(self, user_id: UUID) -> MusicJsonResult:
        return MusicJsonResult(payload=await self._get_login_info(user_id))

    async def logout(self, user_id: UUID) -> MusicJsonResult:
        session = await self._sessions.load(user_id)
        with suppress(MusicProviderError):
            await self._provider.logout(session.cookie)
        await self._sessions.save_provider(user_id, "netease", "")
        return MusicJsonResult(payload={"ok": True})

    async def get_user_playlists(self, user_id: UUID, limit: int) -> MusicJsonResult:
        info, session = await self._require_login(user_id)
        if info is None:
            return MusicJsonResult(payload={"loggedIn": False, "playlists": []})
        response = await self._provider.user_playlists(str(info["userId"]), limit, session.cookie)
        playlists = [
            {
                "id": playlist.get("id"),
                "name": playlist.get("name"),
                "cover": playlist.get("coverImgUrl") or "",
                "trackCount": playlist.get("trackCount") or 0,
                "playCount": playlist.get("playCount") or 0,
                "creator": as_mapping(playlist.get("creator")).get("nickname") or "",
                "subscribed": bool(playlist.get("subscribed")),
                "specialType": playlist.get("specialType") or 0,
            }
            for playlist in as_mapping_list(response.payload.get("playlist"))
        ]
        return MusicJsonResult(
            payload={"loggedIn": True, "userId": info["userId"], "playlists": playlists}
        )

    async def get_song_url(self, user_id: UUID, song_id: str, quality: str) -> MusicJsonResult:
        login_info = await self._get_login_info(user_id)
        session = await self._sessions.load(user_id)
        requested = normalize_quality_preference(quality)
        candidates = quality_candidates(requested)
        if not has_netease_svip(login_info):
            candidates = [item for item in candidates if not item.get("svip")]
        trial_fallback: dict[str, Any] | None = None
        last_data: Mapping[str, Any] = {}
        last_error = ""
        for candidate in candidates:
            try:
                try:
                    response = await self._provider.song_url_v1(
                        song_id, str(candidate["level"]), session.cookie
                    )
                except MusicProviderError:
                    response = await self._provider.song_url(
                        song_id, int(candidate["br"]), session.cookie
                    )
                data = first_mapping(response.payload.get("data"))
                if data:
                    last_data = data
                media_url = data.get("url")
                free_trial = data.get("freeTrialInfo")
                if media_url and not free_trial:
                    result = {
                        "url": media_url,
                        "trial": False,
                        "playable": True,
                        "level": candidate["level"],
                        "quality": candidate["label"],
                        "br": data.get("br"),
                        "requestedQuality": requested,
                    }
                    return MusicJsonResult(payload=with_login_info(result, login_info))
                if media_url and free_trial and trial_fallback is None:
                    trial_fallback = {
                        "url": media_url,
                        "trial": True,
                        "playable": True,
                        "level": candidate["level"],
                        "quality": candidate["label"],
                        "br": data.get("br"),
                        "requestedQuality": requested,
                        "trialInfo": free_trial,
                        "restriction": playback_restriction(data, login_info),
                    }
            except MusicProviderError as exc:
                last_error = str(exc)
        result = trial_fallback or unavailable_song_result(
            last_data, login_info, requested, last_error
        )
        return MusicJsonResult(payload=with_login_info(result, login_info))

    async def check_song_likes(self, user_id: UUID, song_ids: Sequence[str]) -> MusicJsonResult:
        info, session = await self._require_login(user_id)
        if info is None:
            return login_required()
        if not song_ids:
            return MusicJsonResult(
                payload={"error": "Missing song id", "liked": {}, "ids": []},
                status_code=400,
            )
        liked_ids: list[str] = []
        with suppress(MusicProviderError):
            direct = (await self._provider.song_like_check(song_ids, session.cookie)).payload
            data = direct.get("data") or direct.get("ids") or direct
            if isinstance(data, list):
                liked_ids = [str(item) for item in data]
            elif isinstance(data, dict):
                liked_ids = [song_id for song_id in song_ids if bool(data.get(song_id))]
        if not liked_ids:
            fallback = await self._provider.like_list(str(info["userId"]), session.cookie)
            liked_ids = [str(item) for item in fallback.payload.get("ids", [])]
        liked = {song_id: song_id in set(liked_ids) for song_id in song_ids}
        return MusicJsonResult(payload={"loggedIn": True, "ids": list(song_ids), "liked": liked})

    async def set_song_like(self, user_id: UUID, song_id: str, like: bool) -> MusicJsonResult:
        info, session = await self._require_login(user_id)
        if info is None:
            return login_required()
        if not song_id:
            return MusicJsonResult(payload={"error": "Missing song id"}, status_code=400)
        response = await self._provider.like_song(song_id, like, session.cookie)
        code = api_code(response.payload) or 200
        return MusicJsonResult(
            payload={
                "loggedIn": True,
                "id": song_id,
                "liked": like,
                "code": code,
                "body": dict(response.payload),
            }
        )

    async def create_playlist(self, user_id: UUID, name: str, privacy: str) -> MusicJsonResult:
        info, session = await self._require_login(user_id)
        if info is None:
            return login_required()
        normalized_name = name.strip()
        if not normalized_name:
            return MusicJsonResult(payload={"error": "Missing playlist name"}, status_code=400)
        response = await self._provider.create_playlist(normalized_name, privacy, session.cookie)
        created = as_mapping(response.payload.get("playlist") or response.payload.get("data"))
        return MusicJsonResult(
            payload={"loggedIn": True, "playlist": dict(created), "body": dict(response.payload)}
        )

    async def add_song_to_playlist(
        self, user_id: UUID, playlist_id: str, song_ids: str
    ) -> MusicJsonResult:
        info, session = await self._require_login(user_id)
        if info is None:
            return login_required()
        if not playlist_id or not song_ids:
            return MusicJsonResult(
                payload={"error": "Missing playlist id or song id"}, status_code=400
            )
        attempts: list[dict[str, Any]] = []
        response = await self._provider.add_playlist_tracks(playlist_id, song_ids, session.cookie)
        final = response.payload
        code = api_code(final)
        message = api_message(final)
        success = code == 200 and not final.get("error")
        attempts.append(
            {"api": "playlist_tracks", "code": code, "message": message, "body": dict(final)}
        )
        if not success:
            try:
                fallback = await self._provider.add_playlist_tracks_fallback(
                    playlist_id, song_ids, session.cookie
                )
                final = fallback.payload
                code = api_code(final)
                message = api_message(final)
                success = code == 200 and not final.get("error")
                attempts.append(
                    {
                        "api": "playlist_track_add",
                        "code": code,
                        "message": message,
                        "body": dict(final),
                    }
                )
            except MusicProviderError as exc:
                message = str(exc)
                attempts.append(
                    {"api": "playlist_track_add", "code": 0, "message": message, "body": {}}
                )
        if not success:
            return MusicJsonResult(
                payload={
                    "loggedIn": True,
                    "pid": playlist_id,
                    "id": song_ids,
                    "success": False,
                    "code": code,
                    "error": message or "PLAYLIST_ADD_FAILED",
                    "attempts": attempts,
                },
                status_code=401 if code == 401 else 409,
            )
        return MusicJsonResult(
            payload={
                "loggedIn": True,
                "pid": playlist_id,
                "id": song_ids,
                "success": True,
                "code": code,
                "body": dict(final),
                "attempts": attempts,
            }
        )

    async def _get_login_info(self, user_id: UUID) -> dict[str, Any]:
        session = await self._sessions.load(user_id)
        if not session.cookie:
            return dict(DEFAULT_LOGIN_INFO)
        with suppress(MusicProviderError):
            status = (await self._provider.login_status(session.cookie)).payload
            data = as_mapping(status.get("data") or status)
            info = normalize_login_info(
                as_mapping(data.get("profile") or status.get("profile")),
                as_mapping(data.get("account") or status.get("account")),
                data,
            )
            if info.get("loggedIn"):
                return info
        try:
            account = (await self._provider.user_account(session.cookie)).payload
            info = normalize_login_info(
                as_mapping(account.get("profile")),
                as_mapping(account.get("account")),
                account,
            )
            if info.get("loggedIn"):
                return info
            cookie_is_present = True
            if is_netease_auth_invalid_payload(account):
                await self._sessions.save_provider(user_id, "netease", "")
                cookie_is_present = False
            return {**DEFAULT_LOGIN_INFO, "hasCookie": cookie_is_present}
        except MusicProviderError:
            pass
        return {**DEFAULT_LOGIN_INFO, "hasCookie": bool(session.cookie)}

    async def _require_login(
        self, user_id: UUID
    ) -> tuple[dict[str, Any] | None, MusicAccountSession]:
        info = await self._get_login_info(user_id)
        session = await self._sessions.load(user_id)
        return (info if info.get("loggedIn") and info.get("userId") is not None else None, session)


def normalize_cookie_header(value: object) -> str:
    pairs: dict[str, str] = {}

    def collect(item: object) -> None:
        if item is None:
            return
        if isinstance(item, list):
            for child in item:
                collect(child)
            return
        if isinstance(item, dict):
            if item.get("name") and "value" in item:
                put(str(item["name"]), item["value"])
                return
            for key, child in item.items():
                if isinstance(child, dict) and "value" in child:
                    put(str(key), child["value"])
                elif not isinstance(child, (dict, list)):
                    put(str(key), child)
            return
        for line in str(item).splitlines():
            for part in line.split(";"):
                if "=" in part:
                    key, child = part.split("=", 1)
                    put(key, child)

    def put(key: str, value: object) -> None:
        normalized_key = key.strip()
        if (
            normalized_key
            and normalized_key.lower() not in COOKIE_ATTRIBUTE_NAMES
            and value is not None
            and str(value).strip()
        ):
            pairs[normalized_key] = str(value).strip()

    collect(value)
    return "; ".join(f"{key}={child}" for key, child in pairs.items())


def qr_png_data_url(value: str) -> str:
    """Match NeteaseCloudMusicApi's self-contained QR image response."""
    output = BytesIO()
    segno.make(value, error="L").save(output, kind="png", scale=6, border=2)
    return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode("ascii")


def parse_cookie_string(value: str) -> dict[str, str]:
    return {
        key.strip(): child.strip()
        for part in value.split(";")
        if "=" in part
        for key, child in [part.split("=", 1)]
        if key.strip()
    }


def cookie_from_payload(payload: Mapping[str, Any]) -> str:
    data = as_mapping(payload.get("data"))
    for candidate in (payload.get("cookie"), data.get("cookie"), data.get("cookies")):
        cookie = normalize_cookie_header(candidate)
        if cookie:
            return cookie
    return ""


def normalize_login_info(
    profile: Mapping[str, Any], account: Mapping[str, Any], extra: Mapping[str, Any]
) -> dict[str, Any]:
    user_id = (
        profile.get("userId")
        or profile.get("user_id")
        or profile.get("id")
        or account.get("userId")
        or account.get("id")
    )
    if user_id is None or user_id == "":
        return {"loggedIn": False}
    vip = vip_info(profile, account, extra)
    return {
        "loggedIn": True,
        "userId": user_id,
        "nickname": profile.get("nickname") or profile.get("userName") or "网易云用户",
        "avatar": profile.get("avatarUrl") or profile.get("avatar") or "",
        **vip,
    }


def vip_info(*values: Mapping[str, Any]) -> dict[str, Any]:
    keys = (
        "vipType",
        "vip_type",
        "musicVipType",
        "musicVipLevel",
        "redVipLevel",
        "blackVipLevel",
        "luxuryVipLevel",
        "svipType",
    )
    vip_type = 0
    for value in values:
        for key in keys:
            with suppress(TypeError, ValueError):
                vip_type = max(vip_type, int(value.get(key) or 0))
    is_svip = vip_type >= 10 or any(bool(value.get("isSvip")) for value in values)
    is_vip = is_svip or vip_type > 0 or any(bool(value.get("isVip")) for value in values)
    level = "svip" if is_svip else "vip" if is_vip else "none"
    return {
        "vipType": vip_type,
        "vipLevel": level,
        "isVip": is_vip,
        "isSvip": is_svip,
        "vipLabel": "SVIP" if is_svip else "VIP" if is_vip else "无VIP",
    }


def normalize_quality_preference(value: str) -> str:
    normalized = value.lower().strip()
    aliases = {
        "jymaster": {"jymaster", "master", "studio", "svip"},
        "hires": {"hires", "hi-res", "highres", "zhenyin", "spatial"},
        "lossless": {"lossless", "flac", "sq"},
        "exhigh": {"exhigh", "high", "320", "320k", "hq"},
        "standard": {"standard", "normal", "128", "128k", "std"},
    }
    return next((key for key, choices in aliases.items() if normalized in choices), "hires")


def quality_candidates(target: str) -> list[Mapping[str, Any]]:
    index = next(
        (i for i, item in enumerate(NETEASE_QUALITY_CANDIDATES) if item["level"] == target),
        0,
    )
    return list(NETEASE_QUALITY_CANDIDATES[index:])


def has_netease_svip(info: Mapping[str, Any]) -> bool:
    return bool(
        info.get("loggedIn")
        and (
            info.get("vipLevel") == "svip"
            or info.get("isSvip")
            or int(info.get("vipType") or 0) >= 10
        )
    )


def playback_restriction(data: Mapping[str, Any], info: Mapping[str, Any]) -> dict[str, Any]:
    logged_in = bool(info.get("loggedIn"))
    fee = number_or_zero(data.get("fee"))
    code = number_or_zero(data.get("code"))
    if not logged_in:
        category, message, action = (
            "login_required",
            "网易云需要登录后尝试获取完整播放地址",
            "login",
        )
    elif data.get("freeTrialInfo"):
        category, message, action = (
            "trial_only",
            "网易云仅返回试听片段，完整播放需要会员或购买",
            "upgrade",
        )
    elif fee == 1:
        category, message, action = (
            "vip_required",
            "网易云歌曲需要 VIP 权限，当前无法获取完整播放地址",
            "upgrade",
        )
    elif fee in {4, 8}:
        category, message, action = (
            "paid_required",
            "网易云歌曲需要单曲、专辑购买或更高权限",
            "purchase",
        )
    elif code in {403, 404}:
        category, message, action = (
            "copyright_unavailable",
            "网易云版权暂不可播，换源或稍后重试会更稳",
            "switch_source",
        )
    else:
        category, message, action = (
            "url_unavailable",
            "网易云没有返回可播放地址，可能是版权、会员或地区限制",
            "switch_source" if logged_in else "login",
        )
    return {
        "provider": "netease",
        "category": category,
        "action": action,
        "message": message,
        "code": code,
        "fee": fee,
    }


def unavailable_song_result(
    data: Mapping[str, Any], info: Mapping[str, Any], quality: str, error: str
) -> dict[str, Any]:
    restriction = playback_restriction(data, info)
    return {
        "url": None,
        "trial": False,
        "playable": False,
        "reason": restriction["category"],
        "message": restriction["message"],
        "restriction": restriction,
        "lastCode": data.get("code"),
        "fee": data.get("fee"),
        "error": error or None,
        "requestedQuality": quality,
    }


def with_login_info(result: Mapping[str, Any], info: Mapping[str, Any]) -> dict[str, Any]:
    return {
        **result,
        "loggedIn": bool(info.get("loggedIn")),
        "vipType": info.get("vipType") or 0,
        "vipLevel": info.get("vipLevel") or "none",
        "isVip": bool(info.get("isVip")),
        "isSvip": bool(info.get("isSvip")),
        "vipLabel": info.get("vipLabel") or "无VIP",
    }


def login_required() -> MusicJsonResult:
    return MusicJsonResult(payload={"error": "LOGIN_REQUIRED", "loggedIn": False}, status_code=401)


def api_code(payload: Mapping[str, Any]) -> int:
    body = as_mapping(payload.get("body") or payload)
    with suppress(TypeError, ValueError):
        return int(body.get("code") or as_mapping(body.get("body")).get("code") or 0)
    return 0


def api_message(payload: Mapping[str, Any]) -> str:
    body = as_mapping(payload.get("body") or payload)
    nested = as_mapping(body.get("body"))
    return str(
        body.get("message")
        or body.get("msg")
        or body.get("error")
        or nested.get("message")
        or nested.get("msg")
        or nested.get("error")
        or ""
    )


def is_netease_auth_invalid_payload(payload: Mapping[str, Any]) -> bool:
    code = api_code(payload)
    if code in {301, 401}:
        return True
    return bool(
        code >= 300
        and re.search(r"未登录|需要登录|请先登录|login", api_message(payload), re.IGNORECASE)
    )


def as_mapping(value: object) -> Mapping[str, Any]:
    return value if isinstance(value, dict) else {}


def as_mapping_list(value: object) -> list[Mapping[str, Any]]:
    return [item for item in value if isinstance(item, dict)] if isinstance(value, list) else []


def first_mapping(value: object) -> Mapping[str, Any]:
    values = as_mapping_list(value)
    return values[0] if values else {}


def number_or_zero(value: object) -> int:
    with suppress(TypeError, ValueError):
        return int(str(value or 0))
    return 0
