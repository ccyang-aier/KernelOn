"""Framework-free identity rules."""

from enum import StrEnum


class UserStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"


def normalize_email(value: str) -> str:
    """Normalize the v1 login identifier deterministically."""
    normalized = value.strip().casefold()
    if not normalized or "@" not in normalized:
        raise ValueError("a valid email address is required")
    return normalized
