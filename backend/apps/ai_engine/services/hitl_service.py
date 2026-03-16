"""
Human-in-the-Loop (HITL) Service
===================================
Routes AI decisions based on confidence score:

    confidence_score >= 0.8  →  auto-execute assignment immediately
    confidence_score <  0.8  →  set WAITING_APPROVAL + notify PROGRAM_MANAGER users

Public API:
    dispatch_decision(decision)                 — called after creating an AIDecision
    execute_assignment(decision, actor=None)    — shared execution logic (auto + approved)
    reject_decision(decision, actor, reason)    — called by reject endpoint
"""

from __future__ import annotations

from django.utils import timezone

from apps.ai_engine.models import AIDecision
from apps.notifications.models import Notification
from apps.users.models import AuditLog, User

# ---------------------------------------------------------------------------
# Confidence threshold
# ---------------------------------------------------------------------------
AUTO_EXECUTE_THRESHOLD = 0.8


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def dispatch_decision(decision: AIDecision) -> AIDecision:
    """
    Route a freshly-created AIDecision based on its confidence_score.

    - score >= AUTO_EXECUTE_THRESHOLD → auto-execute immediately
    - score <  AUTO_EXECUTE_THRESHOLD → set WAITING_APPROVAL + notify PMs

    Returns the (possibly mutated) decision.
    """
    if decision.confidence_score >= AUTO_EXECUTE_THRESHOLD:
        execute_assignment(decision, actor=None)
    else:
        _mark_waiting_approval(decision)
        _notify_program_managers(decision)

    return decision


def execute_assignment(decision: AIDecision, actor: User | None = None) -> None:
    """
    Assign the recommended hub to the related order and mark the decision executed.

    Parameters
    ----------
    decision : AIDecision
        Must have decision_type='ASSIGNMENT' and a non-null related_order.
    actor : User or None
        The approving user. None → auto-executed path.
    """
    recommendation = decision.recommendation or {}
    hub_id = recommendation.get("recommended_hub_id")

    if not hub_id:
        raise ValueError("AIDecision recommendation does not contain 'recommended_hub_id'.")

    from apps.hubs.models import Hub  # local import to avoid circular deps

    try:
        hub = Hub.objects.get(pk=hub_id)
    except Hub.DoesNotExist:
        raise ValueError(f"Hub with id '{hub_id}' not found during assignment execution.")

    order = decision.related_order
    if order is None:
        raise ValueError("AIDecision has no related_order; cannot execute assignment.")

    # Execute reassignment per item for load recalculations
    from apps.orders.services.reassignment_service import execute_reassignment
    for item in order.items.all():
        execute_reassignment(item.id, hub.id, actor=actor, reason="AI Assignment")

    # Update order status
    order.status = "ASSIGNED"
    order.save(update_fields=["status", "updated_at"])

    # Mark decision executed
    decision.status = "APPROVED" if actor else "AUTO_EXECUTED"
    decision.executed = True
    decision.executed_at = timezone.now()
    decision.save(update_fields=["status", "executed", "executed_at"])

    # Audit log
    action_label = (
        f"AI Assignment AUTO-EXECUTED for order {order.order_id}"
        if actor is None
        else f"AI Assignment APPROVED by {actor.email} for order {order.order_id}"
    )
    AuditLog.objects.create(
        user=actor,
        action=action_label,
        module="AI Engine",
        new_value=(
            f"Order {order.order_id} assigned to hub '{hub.name}' ({hub.hub_code}). "
            f"Confidence: {decision.confidence_score:.4f}. "
            f"Score: {recommendation.get('score', 'N/A')}."
        ),
    )


def reject_decision(
    decision: AIDecision,
    actor: User,
    reason: str = "",
) -> None:
    """
    Mark a WAITING_APPROVAL decision as REJECTED and log the action.

    Parameters
    ----------
    decision : AIDecision
        Must currently be in WAITING_APPROVAL status.
    actor : User
        The rejecting user.
    reason : str
        Optional rejection reason, stored in AuditLog.old_value.
    """
    order = decision.related_order
    order_ref = order.order_id if order else "N/A"

    decision.status = "REJECTED"
    decision.save(update_fields=["status"])

    AuditLog.objects.create(
        user=actor,
        action=f"AI Assignment REJECTED by {actor.email} for order {order_ref}",
        module="AI Engine",
        old_value=reason or None,
        new_value=(
            f"Decision {decision.id} rejected. "
            f"Recommended hub: {decision.recommendation.get('recommended_hub_id', 'N/A')}. "
            f"Confidence: {decision.confidence_score:.4f}."
        ),
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _mark_waiting_approval(decision: AIDecision) -> None:
    """Set status to WAITING_APPROVAL if not already set."""
    if decision.status != "WAITING_APPROVAL":
        decision.status = "WAITING_APPROVAL"
        decision.save(update_fields=["status"])


def _notify_program_managers(decision: AIDecision) -> None:
    """Create an in-app Notification for every active PROGRAM_MANAGER user."""
    managers = User.objects.filter(role="PROGRAM_MANAGER", is_active=True)

    order = decision.related_order
    order_ref = order.order_id if order else "N/A"
    product_name = (order.product.name if order and order.product else "N/A")
    score = decision.recommendation.get("score", "N/A")
    hub_id = decision.recommendation.get("recommended_hub_id", "N/A")

    notifications = [
        Notification(
            user=manager,
            title="AI Assignment Awaiting Approval",
            message=(
                f"Order {order_ref} ({product_name}) has an AI hub recommendation "
                f"(score: {score}, confidence: {decision.confidence_score:.2f}) "
                f"that requires your approval. Suggested hub ID: {hub_id}."
            ),
            type="INFO",
            related_order_id=order_ref,
            related_product_name=product_name,
        )
        for manager in managers
    ]

    if notifications:
        Notification.objects.bulk_create(notifications)
