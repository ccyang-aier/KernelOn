"""Framework-free RBAC vocabulary and rules."""

from dataclasses import dataclass
from enum import StrEnum
from uuid import UUID


class Permission(StrEnum):
    ORGANIZATION_READ = "organization.read"
    ORGANIZATION_MANAGE = "organization.manage"
    MEMBERS_READ = "members.read"
    MEMBERS_MANAGE = "members.manage"
    GROUPS_READ = "groups.read"
    GROUPS_MANAGE = "groups.manage"
    ROLES_READ = "roles.read"
    ROLES_MANAGE = "roles.manage"
    ONBOARDING_READ = "onboarding.read"
    ONBOARDING_MANAGE = "onboarding.manage"
    MENTORSHIP_READ = "mentorship.read"
    MENTORSHIP_MANAGE = "mentorship.manage"
    GROWTH_READ = "growth.read"
    GROWTH_MANAGE = "growth.manage"
    TRAINING_READ = "training.read"
    TRAINING_MANAGE = "training.manage"
    ASSESSMENT_READ = "assessment.read"
    ASSESSMENT_MANAGE = "assessment.manage"
    DASHBOARD_READ = "dashboard.read"
    RESOURCES_READ = "resources.read"
    RESOURCES_MANAGE = "resources.manage"


ALL_PERMISSIONS = frozenset(item.value for item in Permission)


@dataclass(frozen=True, slots=True)
class Principal:
    user_id: UUID
    membership_id: UUID
    organization_id: UUID
    group_ids: frozenset[UUID]
    permissions: frozenset[str]
    role_keys: frozenset[str]

    def has(self, permission: Permission | str) -> bool:
        return str(permission) in self.permissions


def effective_permissions(*role_permission_sets: set[str]) -> frozenset[str]:
    return frozenset().union(*role_permission_sets)


def ensure_assignable_permissions(actor: set[str], requested: set[str]) -> None:
    if not requested <= actor:
        raise PermissionError("ROLE_ESCALATION_DENIED")
