"""
AI Order Assignment Service
============================
Recommends the best manufacturing hub for a given order using a weighted
scoring algorithm. Does NOT auto-assign — saves an AIDecision with
status="WAITING_APPROVAL" for human review.

Score formula (per eligible hub):
    capacity_remaining_pct = (max_daily_capacity - current_load) / max_daily_capacity
    score = (capacity_remaining_pct * 0.4) + (priority * 0.3) + ((1 / lead_time_hours) * 0.3)

Returns:
    {
        "recommended_hub_id": str,
        "score": float,
        "reasoning_text": str,
    }

Raises:
    ValueError  — if the order doesn't exist or no eligible hub is found.
"""

from __future__ import annotations

import uuid
from typing import Optional

from apps.ai_engine.models import AIDecision
from apps.hubs.models import Hub, HubSKUMapping
from apps.orders.models import Order


# ---------------------------------------------------------------------------
# Weights (must sum to 1.0)
# ---------------------------------------------------------------------------
W_CAPACITY = 0.4
W_PRIORITY = 0.3
W_LEAD_TIME = 0.3


def _compute_score(capacity_remaining_pct: float, priority: int, lead_time_hours: int) -> float:
    """Return the raw weighted score for a single hub/SKU-mapping candidate."""
    return (
        (capacity_remaining_pct * W_CAPACITY)
        + (priority * W_PRIORITY)
        + ((1.0 / lead_time_hours) * W_LEAD_TIME)
    )


def recommend_hub_for_order(order_id: uuid.UUID | str) -> dict:
    """
    Recommend the best manufacturing hub for the given order.

    Parameters
    ----------
    order_id : UUID or str
        Primary key of the ``Order`` to process.

    Returns
    -------
    dict
        Keys: ``recommended_hub_id``, ``score``, ``reasoning_text``.

    Raises
    ------
    ValueError
        If the order does not exist or no eligible hub is found.
    """
    # ------------------------------------------------------------------
    # 1. Fetch the order
    # ------------------------------------------------------------------
    try:
        order = Order.objects.select_related("product").get(pk=order_id)
    except Order.DoesNotExist:
        raise ValueError(f"Order with id '{order_id}' does not exist.")

    # ------------------------------------------------------------------
    # 2. Find eligible HubSKUMappings
    #    Criteria:
    #      • Mapped to this order's product
    #      • Mapping is enabled
    #      • Hub is ACTIVE
    #      • Hub still has remaining capacity (current_load < max_daily_capacity)
    #      • lead_time_hours > 0 (prevents division-by-zero)
    # ------------------------------------------------------------------
    mappings = (
        HubSKUMapping.objects.select_related("hub")
        .filter(
            product=order.product,
            is_enabled=True,
            hub__status="ACTIVE",
        )
        .exclude(lead_time_hours__lte=0)
        .exclude(lead_time_hours__isnull=True)
    )

    # Further filter: hub must have remaining capacity
    eligible: list[tuple[float, HubSKUMapping]] = []

    for mapping in mappings:
        hub: Hub = mapping.hub
        if hub.max_daily_capacity <= 0:
            continue
        if hub.current_load >= hub.max_daily_capacity:
            continue

        capacity_remaining_pct: float = (
            hub.max_daily_capacity - hub.current_load
        ) / hub.max_daily_capacity

        priority: int = mapping.priority or 1
        lead_time_hours: int = mapping.lead_time_hours  # already guaranteed > 0

        score = _compute_score(capacity_remaining_pct, priority, lead_time_hours)
        eligible.append((score, mapping))

    if not eligible:
        # ------------------------------------------------------------------
        # 2b. Fallback: Check Hub.supported_skus (Legacy Field)
        # ------------------------------------------------------------------
        sku_to_match = (order.sku or "").strip().lower()
        active_hubs = Hub.objects.filter(status="ACTIVE", max_daily_capacity__gt=0)
        
        for hub in active_hubs:
            if hub.current_load >= hub.max_daily_capacity:
                continue
                
            supported = [s.strip().lower() for s in (hub.supported_skus or "").split(",") if s.strip()]
            if sku_to_match in supported:
                capacity_remaining_pct = (hub.max_daily_capacity - hub.current_load) / hub.max_daily_capacity
                # Defaults for legacy hubs
                score = _compute_score(capacity_remaining_pct, priority=1, lead_time_hours=24)
                
                # Mock a mapping context for the reasoning engine
                mock_mapping = HubSKUMapping(hub=hub, product=order.product, priority=1, lead_time_hours=24)
                eligible.append((score, mock_mapping))

    if not eligible:
        raise ValueError(
            f"No eligible manufacturing hub found for order '{order.order_id}' "
            f"(product: {order.product.name if order.product else 'N/A'})."
        )

    # ------------------------------------------------------------------
    # 3. Pick the highest-scoring hub
    # ------------------------------------------------------------------
    best_score, best_mapping = max(eligible, key=lambda t: t[0])
    best_hub: Hub = best_mapping.hub

    capacity_remaining_pct_best = (
        best_hub.max_daily_capacity - best_hub.current_load
    ) / best_hub.max_daily_capacity

    reasoning_text = (
        f"Hub '{best_hub.name}' ({best_hub.hub_code}) selected with score {best_score:.4f}. "
        f"Capacity remaining: {capacity_remaining_pct_best * 100:.1f}% "
        f"({best_hub.max_daily_capacity - best_hub.current_load}/{best_hub.max_daily_capacity} units), "
        f"SKU mapping priority: {best_mapping.priority}, "
        f"Lead time: {best_mapping.lead_time_hours}h. "
        f"Evaluated {len(eligible)} eligible hub(s)."
    )

    recommendation = {
        "recommended_hub_id": str(best_hub.id),
        "score": round(best_score, 6),
        "reasoning_text": reasoning_text,
    }

    # ------------------------------------------------------------------
    # 4. Normalise score → confidence_score in [0, 1]
    #    Theoretical max: capacity=1.0, priority=max, lead_time=min
    # ------------------------------------------------------------------
    max_priority = max(m.priority or 1 for _, m in eligible)
    min_lead_time = min(m.lead_time_hours for _, m in eligible)
    theoretical_max = _compute_score(1.0, max_priority, min_lead_time)

    confidence_score: float = (
        min(best_score / theoretical_max, 1.0) if theoretical_max > 0 else 0.0
    )

    # ------------------------------------------------------------------
    # 5. Persist as an AIDecision, then route through HITL dispatcher
    #    (auto-executes if score >= 0.8, else waits for PM approval)
    # ------------------------------------------------------------------
    from apps.ai_engine.services import hitl_service  # local import — avoids circular deps

    decision = AIDecision.objects.create(
        decision_type="ASSIGNMENT",
        related_order=order,
        recommendation=recommendation,
        confidence_score=round(confidence_score, 6),
        status="PENDING",
        executed=False,
    )

    return recommendation
