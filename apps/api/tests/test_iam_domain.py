"""Identity and authorization domain tests."""

from uuid import uuid4

import pytest

from kernelon_api.modules.identity.domain import normalize_email
from kernelon_api.modules.organizations.domain import (
    Permission,
    Principal,
    effective_permissions,
    ensure_assignable_permissions,
)


def test_email_is_normalized_for_global_identity() -> None:
    assert normalize_email("  Alice@Example.COM ") == "alice@example.com"


def test_invalid_email_is_rejected() -> None:
    with pytest.raises(ValueError, match="valid email"):
        normalize_email("not-an-email")


def test_member_and_group_permissions_are_merged() -> None:
    permissions = effective_permissions({"members.read"}, {"groups.manage", "members.read"})
    assert permissions == frozenset({"members.read", "groups.manage"})


def test_role_escalation_is_rejected() -> None:
    with pytest.raises(PermissionError, match="ROLE_ESCALATION_DENIED"):
        ensure_assignable_permissions({"roles.manage"}, {"roles.manage", "organization.manage"})


def test_principal_permission_check() -> None:
    principal = Principal(
        uuid4(), uuid4(), uuid4(), frozenset(), frozenset({"members.read"}), frozenset()
    )
    assert principal.has(Permission.MEMBERS_READ)
    assert not principal.has(Permission.MEMBERS_MANAGE)
