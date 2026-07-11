"""Request correlation tests."""

from kernelon_api.platform.request_id import normalize_request_id


def test_valid_request_id_is_preserved() -> None:
    assert normalize_request_id("trace-123:child") == "trace-123:child"


def test_invalid_request_id_is_replaced() -> None:
    request_id = normalize_request_id("contains spaces")

    assert request_id != "contains spaces"
    assert len(request_id) == 36
