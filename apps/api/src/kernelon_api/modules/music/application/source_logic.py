"""Pure mappings copied from Mineradio's server-side response logic."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence


def map_podcast_radio(value: Mapping[str, Any]) -> dict[str, Any]:
    dj = as_mapping(
        value.get("dj") or value.get("djSimple") or value.get("djUser") or value.get("creator")
    )
    radio_id = value.get("id") or value.get("rid") or value.get("radioId")
    return {
        "id": radio_id,
        "rid": radio_id,
        "name": value.get("name") or value.get("radioName") or "",
        "cover": (
            value.get("picUrl")
            or value.get("picURL")
            or value.get("coverUrl")
            or value.get("coverImgUrl")
            or value.get("avatarUrl")
            or ""
        ),
        "desc": value.get("desc") or value.get("description") or value.get("rcmdText") or "",
        "djName": dj.get("nickname") or value.get("djName") or value.get("nickname") or "",
        "category": value.get("category") or value.get("categoryName") or "",
        "programCount": value.get("programCount")
        or value.get("programNum")
        or value.get("programCnt")
        or 0,
        "subCount": value.get("subCount")
        or value.get("subedCount")
        or value.get("subscriberCount")
        or 0,
    }


def map_podcast_program(
    value: Mapping[str, Any], fallback_radio: Mapping[str, Any]
) -> dict[str, Any]:
    main_song = as_mapping(value.get("mainSong") or value.get("song") or value.get("mainTrack"))
    radio = as_mapping(value.get("radio") or fallback_radio)
    mapped_radio = map_podcast_radio(radio)
    artists = map_artists(main_song.get("ar") or main_song.get("artists"))
    album = as_mapping(main_song.get("al") or main_song.get("album"))
    dj = as_mapping(value.get("dj") or radio.get("dj"))
    return {
        "type": "podcast",
        "source": "podcast",
        "id": main_song.get("id") or value.get("mainSongId") or value.get("songId"),
        "programId": value.get("id") or value.get("programId"),
        "radioId": mapped_radio["id"],
        "name": value.get("name") or main_song.get("name") or "",
        "artist": (
            mapped_radio["name"]
            or dj.get("nickname")
            or " / ".join(str(artist["name"]) for artist in artists)
            or mapped_radio["djName"]
            or ""
        ),
        "artists": artists,
        "artistId": artists[0]["id"] if artists else None,
        "album": mapped_radio["name"] or album.get("name") or "Podcast",
        "cover": (
            value.get("coverUrl")
            or value.get("cover")
            or value.get("blurCoverUrl")
            or mapped_radio["cover"]
            or album.get("picUrl")
            or ""
        ),
        "duration": value.get("duration") or main_song.get("dt") or main_song.get("duration") or 0,
        "fee": main_song.get("fee"),
        "djName": mapped_radio["djName"] or dj.get("nickname") or "",
        "radioName": mapped_radio["name"] or "",
        "desc": value.get("description") or value.get("desc") or "",
        "createTime": value.get("createTime") or 0,
        "serialNum": value.get("serialNum") or value.get("serial") or 0,
    }


def open_meteo_weather_label(code: int) -> str:
    if code == 0:
        return "晴"
    if code in {1, 2}:
        return "少云"
    if code == 3:
        return "阴"
    if code in {45, 48}:
        return "雾"
    if code in {51, 53, 55}:
        return "毛毛雨"
    if code in {56, 57, 66, 67}:
        return "冻雨"
    if code in {61, 63, 65}:
        return "雨"
    if code in {71, 73, 75, 77}:
        return "雪"
    if code in {80, 81, 82}:
        return "阵雨"
    if code in {85, 86}:
        return "阵雪"
    if code in {95, 96, 99}:
        return "雷雨"
    return "天气"


def build_weather_mood(weather: Mapping[str, Any], hour: int | None = None) -> dict[str, Any]:
    current_hour = datetime.now(UTC).astimezone().hour if hour is None else hour
    code = number(weather.get("weatherCode"))
    temperature = number(weather.get("temperature"))
    apparent = number(weather.get("apparentTemperature"))
    rain = number(weather.get("precipitation"), 0)
    humidity = number(weather.get("humidity"), 0)
    wind = number(weather.get("windSpeed"), 0)
    is_night = weather.get("isDay") == 0 or current_hour < 6 or current_hour >= 20
    is_morning = 5 <= current_hour < 11
    is_dusk = 17 <= current_hour < 20
    is_rain = rain > 0 or code in {51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99}
    is_snow = code in {71, 73, 75, 77, 85, 86}
    is_cloud = code in {2, 3, 45, 48}
    is_storm = code in {95, 96, 99}
    feels = apparent if apparent == apparent else temperature
    mood: dict[str, Any] = {
        "key": "clear",
        "title": "晴朗电台",
        "tagline": "让节奏亮一点，像窗边的光",
        "energy": 0.62,
        "warmth": 0.58,
        "focus": 0.48,
        "melancholy": 0.24,
        "keywords": ["轻快 华语", "city pop", "indie pop", "chill pop", "阳光 歌单"],
    }
    if is_storm:
        mood.update(
            key="storm",
            title="雷雨电台",
            tagline="低频更厚，适合把世界关小一点",
            energy=0.46,
            warmth=0.34,
            focus=0.66,
            melancholy=0.62,
            keywords=["暗色 R&B", "trip hop", "夜晚 电子", "氛围 摇滚", "雨夜 歌单"],
        )
    elif is_rain:
        mood.update(
            key="rain",
            title="雨天电台",
            tagline="留一点潮湿的空间给旋律",
            energy=0.38,
            warmth=0.42,
            focus=0.64,
            melancholy=0.66,
            keywords=["雨天 R&B", "lofi rainy", "华语 慢歌", "dream pop", "雨夜 歌单"],
        )
    elif is_snow or feels <= 3:
        mood.update(
            key="snow",
            title="冷空气电台",
            tagline="干净、慢速、带一点冬天的颗粒感",
            energy=0.34,
            warmth=0.28,
            focus=0.72,
            melancholy=0.54,
            keywords=["冬天 民谣", "ambient piano", "日系 冬天", "indie folk", "安静 歌单"],
        )
    elif feels >= 31 or humidity >= 78:
        mood.update(
            key="humid",
            title="闷热电台",
            tagline="降低密度，留出一点呼吸",
            energy=0.48,
            warmth=0.76,
            focus=0.46,
            melancholy=0.30,
            keywords=["夏日 chill", "bossa nova", "city pop 夏天", "轻电子", "海边 歌单"],
        )
    elif is_cloud:
        mood.update(
            key="cloudy",
            title="阴天电台",
            tagline="不急着明亮，先让声音变软",
            energy=0.40,
            warmth=0.46,
            focus=0.58,
            melancholy=0.52,
            keywords=["阴天 华语", "indie rock mellow", "neo soul", "chillhop", "独立 民谣"],
        )
    if is_night:
        mood["key"] = f"{mood['key']}-night"
        mood["title"] = (
            "夜色电台"
            if str(mood["key"]).startswith("clear")
            else str(mood["title"]).replace("电台", "夜听")
        )
        mood["tagline"] = "音量放低一点，让夜色参与编曲"
        mood["energy"] = min(float(mood["energy"]), 0.42)
        mood["focus"] = max(float(mood["focus"]), 0.68)
        mood["melancholy"] = max(float(mood["melancholy"]), 0.52)
        mood["keywords"] = [
            "夜晚 R&B",
            "late night jazz",
            "ambient",
            "lofi sleep",
            "夜跑 歌单",
            *mood["keywords"][:3],
        ]
    elif is_morning:
        mood["title"] = "雨晨电台" if str(mood["key"]).startswith("rain") else "早晨电台"
        mood["energy"] = max(float(mood["energy"]), 0.52)
        mood["keywords"] = [
            "早晨 通勤",
            "morning acoustic",
            "清晨 indie",
            "轻快 华语",
            *mood["keywords"][:3],
        ]
    elif is_dusk:
        mood["title"] = "黄昏雨声" if str(mood["key"]).startswith("rain") else "黄昏电台"
        mood["melancholy"] = max(float(mood["melancholy"]), 0.48)
        mood["keywords"] = [
            "黄昏 city pop",
            "日落 歌单",
            "落日飞车",
            "soul pop",
            *mood["keywords"][:3],
        ]
    if wind >= 28:
        mood["energy"] = max(float(mood["energy"]), 0.56)
        mood["keywords"] = ["公路 摇滚", "windy day playlist", *mood["keywords"][:4]]
    mood["keywords"] = list(dict.fromkeys(mood["keywords"]))[:7]
    return mood


def weather_radio_seed_queries(mood: Mapping[str, Any]) -> list[str]:
    key = str(mood.get("key") or "")
    if "rain" in key or "storm" in key:
        return ["陈奕迅 阴天快乐", "周杰伦 雨下一整晚", "孙燕姿 遇见", "林宥嘉 说谎", "毛不易 消愁"]
    if "snow" in key or "cloudy" in key:
        return [
            "陈奕迅 好久不见",
            "莫文蔚 阴天",
            "李健 贝加尔湖畔",
            "朴树 平凡之路",
            "蔡健雅 达尔文",
        ]
    if "humid" in key:
        return [
            "落日飞车 My Jinji",
            "告五人 爱人错过",
            "夏日入侵企画 想去海边",
            "陈绮贞 旅行的意义",
            "王若琳 Lost in Paradise",
        ]
    if "night" in key:
        return [
            "方大同 特别的人",
            "陶喆 爱很简单",
            "Frank Ocean Pink + White",
            "林忆莲 夜太黑",
            "Norah Jones Don't Know Why",
        ]
    return ["孙燕姿 天黑黑", "周杰伦 晴天", "五月天 温柔", "陈奕迅 稳稳的幸福", "王菲"]


def order_weather_songs(
    songs: Sequence[Mapping[str, Any]], mood: Mapping[str, Any]
) -> list[Mapping[str, Any]]:
    unique: list[Mapping[str, Any]] = []
    seen_ids: set[str] = set()
    for song in songs:
        key = str(song.get("id") or f"{song.get('name', '')}|{song.get('artist', '')}").strip()
        if not key or key in seen_ids:
            continue
        seen_ids.add(key)
        if song.get("name") and song.get("id") and not is_low_signal_weather_song(song):
            unique.append(song)
    unique.sort(key=lambda song: score_weather_song(song, mood), reverse=True)
    seen_titles: set[str] = set()
    titles: list[Mapping[str, Any]] = []
    for song in unique:
        title = weather_title_key(song)
        if title and title in seen_titles:
            continue
        if title:
            seen_titles.add(title)
        titles.append(song)
    primary: list[Mapping[str, Any]] = []
    deferred: list[Mapping[str, Any]] = []
    counts: dict[str, int] = {}
    for song in titles:
        artist = weather_artist_key(song)
        count = counts.get(artist, 0)
        if count < 2:
            primary.append(song)
            counts[artist] = count + 1
        else:
            deferred.append(song)
    return primary if len(primary) >= 8 else [*primary, *deferred[: 8 - len(primary)]]


def is_low_signal_weather_song(song: Mapping[str, Any]) -> bool:
    text = " ".join(str(song.get(key) or "") for key in ("name", "artist", "album")).lower()
    if not text:
        return True
    patterns = (
        r"(^|[\s\-_/（(])ai(?:\s*(歌|歌曲|音乐|cover|翻唱|生成|作曲|演唱|女声|男声)|$|[\s\-_/）)])",
        r"suno|udio|人工智能|生成歌曲|ai歌曲|虚拟歌手|测试音频|demo|beat\s*maker",
        r"翻自|翻唱|cover|remix|伴奏|纯音乐|钢琴|dj|live\s*版|live版|唯美钢琴|karaoke|instrumental",
        r"白噪音|雨声|睡眠|助眠|冥想|疗愈频率|环境音|自然声音|asmr",
        r"[（(](r&b|lofi|jazz|dj|edm|trap|remix|伴奏|纯音乐|钢琴|电子|治愈|古风|女声|男声|英文|中文版|抖音|ai)[）)]",
    )
    if any(re.search(pattern, text, re.IGNORECASE) for pattern in patterns):
        return True
    return bool(
        re.fullmatch(
            r"纯音乐|轻音乐|治愈系|放松|睡眠|雨天|阴天|夜晚|夏日|海边",
            str(song.get("name") or "").strip(),
            re.IGNORECASE,
        )
    )


def score_weather_song(song: Mapping[str, Any], mood: Mapping[str, Any]) -> int:
    text = f"{song.get('name', '')} {song.get('artist', '')} {song.get('album', '')}".lower()
    score = 4 if song.get("cover") else 0
    score += 2 if song.get("duration") else 0
    score += 6 if song.get("weatherSource") == "daily" else 0
    score += 4 if song.get("weatherSource") == "private" else 0
    if re.search(
        r"周杰伦|陈奕迅|孙燕姿|五月天|王菲|陶喆|方大同|林宥嘉|蔡健雅|莫文蔚|李健|毛不易|告五人|落日飞车|陈绮贞|朴树",
        text,
    ):
        score += 10
    key = str(mood.get("key") or "")
    if "rain" in key and re.search(r"雨|阴|夜|慢|r&b|soul|陈奕迅|林宥嘉|孙燕姿", text):
        score += 5
    if "humid" in key and re.search(r"夏|海|city|pop|落日|告五人|方大同|陶喆", text):
        score += 5
    if "night" in key and re.search(r"夜|moon|jazz|soul|r&b|方大同|陶喆|王菲", text):
        score += 5
    if "cloudy" in key and re.search(r"阴|民谣|indie|陈绮贞|朴树|李健", text):
        score += 5
    return score


def weather_artist_key(song: Mapping[str, Any]) -> str:
    raw = str(song.get("artist") or song.get("name") or "")
    return re.split(r"\s*/\s*|、|,|&", raw)[0].strip().lower() or "unknown"


def weather_title_key(song: Mapping[str, Any]) -> str:
    title = re.sub(r"[（(][^）)]*[）)]", "", str(song.get("name") or "").lower())
    return re.sub(r"[\s._\-·'’\"“”「」《》:：/\\|]+", "", title).strip()


def map_artists(value: object) -> list[dict[str, Any]]:
    return [
        {"id": artist.get("id"), "name": artist.get("name") or ""}
        for artist in as_mapping_list(value)
        if artist.get("name")
    ]


def as_mapping(value: object) -> Mapping[str, Any]:
    return value if isinstance(value, dict) else {}


def as_mapping_list(value: object) -> list[Mapping[str, Any]]:
    return [item for item in value if isinstance(item, dict)] if isinstance(value, list) else []


def number(value: object, fallback: float = float("nan")) -> float:
    if not isinstance(value, (str, int, float)) or value == "":
        return fallback
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback
