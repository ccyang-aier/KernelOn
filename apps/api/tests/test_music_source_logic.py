"""Branch contracts for the pure mappings ported from Mineradio."""

from __future__ import annotations

import math

import pytest

from kernelon_api.modules.music.application.source_logic import (
    as_mapping,
    as_mapping_list,
    build_weather_mood,
    is_low_signal_weather_song,
    map_artists,
    map_podcast_program,
    map_podcast_radio,
    number,
    open_meteo_weather_label,
    order_weather_songs,
    score_weather_song,
    weather_artist_key,
    weather_radio_seed_queries,
    weather_title_key,
)


@pytest.mark.parametrize(
    ("code", "label"),
    [
        (0, "\u6674"),
        (1, "\u5c11\u4e91"),
        (3, "\u9634"),
        (45, "\u96fe"),
        (51, "\u6bdb\u6bdb\u96e8"),
        (56, "\u51bb\u96e8"),
        (61, "\u96e8"),
        (71, "\u96ea"),
        (80, "\u9635\u96e8"),
        (85, "\u9635\u96ea"),
        (95, "\u96f7\u96e8"),
        (999, "\u5929\u6c14"),
    ],
)
def test_open_meteo_weather_labels_match_source_groups(code: int, label: str) -> None:
    assert open_meteo_weather_label(code) == label


@pytest.mark.parametrize(
    ("weather", "hour", "key"),
    [
        ({"weatherCode": 95, "isDay": 1}, 12, "storm"),
        ({"weatherCode": 61, "isDay": 1}, 12, "rain"),
        ({"weatherCode": 71, "isDay": 1}, 12, "snow"),
        ({"weatherCode": 0, "apparentTemperature": 2, "isDay": 1}, 12, "snow"),
        ({"weatherCode": 0, "temperature": 32, "isDay": 1}, 12, "humid"),
        ({"weatherCode": 0, "humidity": 80, "isDay": 1}, 12, "humid"),
        ({"weatherCode": 3, "temperature": 20, "isDay": 1}, 12, "cloudy"),
        ({"weatherCode": 0, "temperature": 20, "isDay": 1}, 12, "clear"),
        ({"weatherCode": 0, "temperature": 20, "isDay": 0}, 12, "clear-night"),
        ({"weatherCode": 61, "isDay": 1}, 7, "rain"),
        ({"weatherCode": 61, "isDay": 1}, 18, "rain"),
    ],
)
def test_weather_mood_source_branches(weather: dict[str, object], hour: int, key: str) -> None:
    mood = build_weather_mood(weather, hour=hour)
    assert mood["key"] == key
    assert 0 <= mood["energy"] <= 1
    assert 0 < len(mood["keywords"]) <= 7


def test_weather_mood_time_and_wind_adjustments_are_preserved() -> None:
    morning = build_weather_mood({"weatherCode": 0, "isDay": 1}, hour=7)
    dusk = build_weather_mood({"weatherCode": 0, "isDay": 1}, hour=18)
    windy = build_weather_mood({"weatherCode": 0, "isDay": 1, "windSpeed": 30}, hour=12)
    implicit_hour = build_weather_mood({"weatherCode": 0, "isDay": 1})

    assert morning["energy"] >= 0.52
    assert dusk["melancholy"] >= 0.48
    assert windy["energy"] >= 0.56
    assert implicit_hour["key"] in {"clear", "clear-night"}


@pytest.mark.parametrize(
    "key",
    ["rain", "storm-night", "snow", "cloudy", "humid", "clear-night", "clear"],
)
def test_weather_seed_queries_exist_for_every_mood_family(key: str) -> None:
    queries = weather_radio_seed_queries({"key": key})
    assert len(queries) == 5
    assert all(query.strip() for query in queries)


def test_podcast_radio_and_program_accept_all_source_field_variants() -> None:
    radio = map_podcast_radio(
        {
            "rid": "radio-1",
            "radioName": "Radio",
            "picURL": "cover",
            "description": "description",
            "djSimple": {"nickname": "DJ"},
            "categoryName": "Music",
            "programNum": 3,
            "subscriberCount": 4,
        }
    )
    assert radio == {
        "id": "radio-1",
        "rid": "radio-1",
        "name": "Radio",
        "cover": "cover",
        "desc": "description",
        "djName": "DJ",
        "category": "Music",
        "programCount": 3,
        "subCount": 4,
    }

    program = map_podcast_program(
        {
            "programId": "program-1",
            "mainTrack": {
                "id": "song-1",
                "name": "Episode audio",
                "artists": [{"id": 8, "name": "Singer"}, {"name": ""}],
                "album": {"name": "Album", "picUrl": "album-cover"},
                "duration": 5000,
                "fee": 0,
            },
            "blurCoverUrl": "program-cover",
            "desc": "episode description",
            "serial": 9,
        },
        {"radioId": "radio-1", "name": "Radio", "creator": {"nickname": "DJ"}},
    )
    assert program["id"] == "song-1"
    assert program["programId"] == "program-1"
    assert program["radioId"] == "radio-1"
    assert program["artist"] == "Radio"
    assert program["artists"] == [{"id": 8, "name": "Singer"}]
    assert program["cover"] == "program-cover"
    assert program["duration"] == 5000
    assert program["serialNum"] == 9


def test_weather_song_filtering_scoring_deduplication_and_artist_diversity() -> None:
    songs = [
        {
            "id": 1,
            "name": "Rain Song",
            "artist": "Artist A",
            "album": "Album",
            "cover": "cover",
            "duration": 100,
            "weatherSource": "daily",
        },
        {"id": 1, "name": "Duplicate id", "artist": "Artist B"},
        {"id": 2, "name": "Rain Song (Live)", "artist": "Artist A"},
        {"id": 3, "name": "Third", "artist": "Artist A", "weatherSource": "private"},
        {"id": 4, "name": "Fourth", "artist": "Artist A"},
        {"id": 5, "name": "AI cover", "artist": "Generator"},
        {"id": 6, "name": "Fifth", "artist": "Artist B"},
        {"name": "Missing id", "artist": "Artist C"},
    ]
    mood = {"key": "rain"}

    ordered = order_weather_songs(songs, mood)

    assert [song["id"] for song in ordered] == [1, 3, 6, 4]
    assert score_weather_song(songs[0], mood) >= 12
    assert score_weather_song(songs[2], {"key": "clear"}) == 0
    assert is_low_signal_weather_song(songs[5]) is True
    assert is_low_signal_weather_song({}) is False
    assert is_low_signal_weather_song({"name": "Original", "artist": "Artist"}) is False
    assert weather_artist_key({"artist": "Artist A / Guest"}) == "artist a"
    assert weather_artist_key({}) == "unknown"
    assert weather_title_key({"name": "Rain Song (Live)"}) == "rainsong"


def test_source_mapping_small_helpers_handle_invalid_values() -> None:
    assert map_artists([{"id": 1, "name": "A"}, None, {"id": 2}]) == [{"id": 1, "name": "A"}]
    assert as_mapping({"id": 1}) == {"id": 1}
    assert as_mapping(None) == {}
    assert as_mapping_list([{"id": 1}, None, "x"]) == [{"id": 1}]
    assert as_mapping_list("not-a-list") == []
    assert number("3.5") == 3.5
    assert number(2) == 2.0
    assert math.isnan(number(""))
    assert number(object(), 7) == 7
    assert number("invalid", 8) == 8
