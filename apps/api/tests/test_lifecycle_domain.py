"""Lifecycle state-machine tests."""

import pytest

from kernelon_api.modules.lifecycle.domain import (
    CaseStatus,
    ReviewStatus,
    ensure_case_transition,
    ensure_review_transition,
)


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (CaseStatus.DRAFT, CaseStatus.ACTIVE),
        (CaseStatus.DRAFT, CaseStatus.CANCELLED),
        (CaseStatus.ACTIVE, CaseStatus.SUSPENDED),
        (CaseStatus.SUSPENDED, CaseStatus.ACTIVE),
        (CaseStatus.ACTIVE, CaseStatus.COMPLETED),
        (CaseStatus.ACTIVE, CaseStatus.TERMINATED),
    ],
)
def test_case_transitions_accept_supported_paths(current: CaseStatus, target: CaseStatus) -> None:
    ensure_case_transition(current, target)


def test_case_transitions_reject_reopening_terminal_state() -> None:
    with pytest.raises(ValueError, match="Cannot transition lifecycle case"):
        ensure_case_transition(CaseStatus.COMPLETED, CaseStatus.ACTIVE)


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (ReviewStatus.NOT_STARTED, ReviewStatus.COLLECTING),
        (ReviewStatus.COLLECTING, ReviewStatus.UNDER_REVIEW),
        (ReviewStatus.UNDER_REVIEW, ReviewStatus.DECISION_PENDING),
        (ReviewStatus.DECISION_PENDING, ReviewStatus.PASSED),
        (ReviewStatus.DECISION_PENDING, ReviewStatus.EXTENDED),
        (ReviewStatus.DECISION_PENDING, ReviewStatus.FAILED),
    ],
)
def test_review_transitions_accept_supported_paths(
    current: ReviewStatus, target: ReviewStatus
) -> None:
    ensure_review_transition(current, target)


def test_review_transitions_reject_decision_before_collection() -> None:
    with pytest.raises(ValueError, match="Cannot transition assessment"):
        ensure_review_transition(ReviewStatus.COLLECTING, ReviewStatus.PASSED)
