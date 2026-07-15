"""Lifecycle enums and transition rules without framework dependencies."""

from enum import StrEnum


class CaseStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    TERMINATED = "terminated"


class ReviewStatus(StrEnum):
    NOT_STARTED = "not_started"
    COLLECTING = "collecting"
    UNDER_REVIEW = "under_review"
    DECISION_PENDING = "decision_pending"
    PASSED = "passed"
    EXTENDED = "extended"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RiskLevel(StrEnum):
    NORMAL = "normal"
    ATTENTION = "attention"
    HIGH = "high"


CASE_TRANSITIONS: dict[CaseStatus, frozenset[CaseStatus]] = {
    CaseStatus.DRAFT: frozenset({CaseStatus.ACTIVE, CaseStatus.CANCELLED}),
    CaseStatus.ACTIVE: frozenset(
        {CaseStatus.SUSPENDED, CaseStatus.COMPLETED, CaseStatus.TERMINATED}
    ),
    CaseStatus.SUSPENDED: frozenset({CaseStatus.ACTIVE, CaseStatus.TERMINATED}),
    CaseStatus.COMPLETED: frozenset(),
    CaseStatus.CANCELLED: frozenset(),
    CaseStatus.TERMINATED: frozenset(),
}

REVIEW_TRANSITIONS: dict[ReviewStatus, frozenset[ReviewStatus]] = {
    ReviewStatus.NOT_STARTED: frozenset({ReviewStatus.COLLECTING}),
    ReviewStatus.COLLECTING: frozenset({ReviewStatus.UNDER_REVIEW, ReviewStatus.CANCELLED}),
    ReviewStatus.UNDER_REVIEW: frozenset({ReviewStatus.DECISION_PENDING, ReviewStatus.CANCELLED}),
    ReviewStatus.DECISION_PENDING: frozenset(
        {ReviewStatus.PASSED, ReviewStatus.EXTENDED, ReviewStatus.FAILED}
    ),
    ReviewStatus.PASSED: frozenset(),
    ReviewStatus.EXTENDED: frozenset(),
    ReviewStatus.FAILED: frozenset(),
    ReviewStatus.CANCELLED: frozenset(),
}


def ensure_case_transition(current: str, target: str) -> None:
    current_status = CaseStatus(current)
    target_status = CaseStatus(target)
    if target_status not in CASE_TRANSITIONS[current_status]:
        raise ValueError(f"Cannot transition lifecycle case from {current} to {target}")


def ensure_review_transition(current: str, target: str) -> None:
    current_status = ReviewStatus(current)
    target_status = ReviewStatus(target)
    if target_status not in REVIEW_TRANSITIONS[current_status]:
        raise ValueError(f"Cannot transition assessment from {current} to {target}")
