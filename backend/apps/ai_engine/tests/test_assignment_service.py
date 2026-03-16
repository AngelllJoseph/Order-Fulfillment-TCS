"""
Unit tests for apps.ai_engine.services.assignment_service
"""
import datetime
import uuid

from django.test import TestCase

from apps.ai_engine.models import AIDecision
from apps.ai_engine.services.assignment_service import recommend_hub_for_order
from apps.hubs.models import Hub, HubSKUMapping
from apps.orders.models import Order
from apps.products.models import Product


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_product(sku="SKU-TEST-001", name="Test Widget"):
    return Product.objects.create(
        product_id=f"PROD-{uuid.uuid4().hex[:6].upper()}",
        sku=sku,
        name=name,
        price="9.99",
        category="Test",
    )


def _make_hub(
    hub_code=None,
    name="Hub Alpha",
    max_daily_capacity=100,
    current_load=20,
    status="ACTIVE",
    priority_level=5,
):
    return Hub.objects.create(
        hub_code=hub_code or f"HUB-{uuid.uuid4().hex[:4].upper()}",
        name=name,
        location="Test City",
        max_daily_capacity=max_daily_capacity,
        current_load=current_load,
        status=status,
        priority_level=priority_level,
    )


def _make_mapping(hub, product, lead_time_hours=24, priority=5, is_enabled=True):
    return HubSKUMapping.objects.create(
        hub=hub,
        product=product,
        lead_time_hours=lead_time_hours,
        priority=priority,
        is_enabled=is_enabled,
    )


def _make_order(product, quantity=10):
    return Order.objects.create(
        product=product,
        sku=product.sku,
        quantity=quantity,
        customer_name="Test Customer",
        customer_phone="9999999999",
        shipping_address="123 Test Street",
        expected_delivery_date=datetime.date.today() + datetime.timedelta(days=7),
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class AssignmentServiceHappyPathTest(TestCase):
    """recommend_hub_for_order should pick the highest-scoring hub."""

    def setUp(self):
        self.product = _make_product()
        self.order = _make_order(self.product)

        # Hub A — lower capacity remaining, lower priority, lower lead time
        self.hub_a = _make_hub(name="Hub A", max_daily_capacity=100, current_load=70)
        _make_mapping(self.hub_a, self.product, lead_time_hours=48, priority=3)

        # Hub B — higher capacity remaining, higher priority, shorter lead time → should win
        self.hub_b = _make_hub(name="Hub B", max_daily_capacity=100, current_load=10)
        _make_mapping(self.hub_b, self.product, lead_time_hours=12, priority=9)

    def test_returns_expected_keys(self):
        result = recommend_hub_for_order(self.order.pk)
        self.assertIn("recommended_hub_id", result)
        self.assertIn("score", result)
        self.assertIn("reasoning_text", result)

    def test_best_hub_selected(self):
        result = recommend_hub_for_order(self.order.pk)
        self.assertEqual(result["recommended_hub_id"], str(self.hub_b.id))

    def test_score_is_positive_float(self):
        result = recommend_hub_for_order(self.order.pk)
        self.assertIsInstance(result["score"], float)
        self.assertGreater(result["score"], 0.0)

    def test_ai_decision_created(self):
        recommend_hub_for_order(self.order.pk)
        decision = AIDecision.objects.filter(
            related_order=self.order,
            decision_type="ASSIGNMENT",
        ).first()
        self.assertIsNotNone(decision)
        self.assertEqual(decision.status, "WAITING_APPROVAL")
        self.assertFalse(decision.executed)

    def test_confidence_score_between_0_and_1(self):
        recommend_hub_for_order(self.order.pk)
        decision = AIDecision.objects.filter(
            related_order=self.order,
            decision_type="ASSIGNMENT",
        ).first()
        self.assertGreaterEqual(decision.confidence_score, 0.0)
        self.assertLessEqual(decision.confidence_score, 1.0)

    def test_reasoning_text_mentions_hub_name(self):
        result = recommend_hub_for_order(self.order.pk)
        self.assertIn("Hub B", result["reasoning_text"])


class AssignmentServiceNoEligibleHubTest(TestCase):
    """ValueError raised when no eligible hub is available."""

    def setUp(self):
        self.product = _make_product(sku="SKU-NOHUB-001")
        self.order = _make_order(self.product)

    def test_no_mapping_raises_value_error(self):
        """No HubSKUMapping at all → ValueError."""
        with self.assertRaises(ValueError):
            recommend_hub_for_order(self.order.pk)

    def test_full_capacity_hub_raises_value_error(self):
        """Hub at max capacity is ineligible."""
        hub = _make_hub(max_daily_capacity=100, current_load=100)
        _make_mapping(hub, self.product, lead_time_hours=24, priority=5)
        with self.assertRaises(ValueError):
            recommend_hub_for_order(self.order.pk)

    def test_inactive_hub_raises_value_error(self):
        """Inactive hub is ineligible."""
        hub = _make_hub(status="INACTIVE", max_daily_capacity=100, current_load=0)
        _make_mapping(hub, self.product, lead_time_hours=24, priority=5)
        with self.assertRaises(ValueError):
            recommend_hub_for_order(self.order.pk)

    def test_disabled_mapping_raises_value_error(self):
        """Disabled HubSKUMapping is ineligible."""
        hub = _make_hub(max_daily_capacity=100, current_load=0)
        _make_mapping(hub, self.product, is_enabled=False)
        with self.assertRaises(ValueError):
            recommend_hub_for_order(self.order.pk)

    def test_wrong_product_raises_value_error(self):
        """Mapping for a different product is ineligible."""
        other_product = _make_product(sku="SKU-OTHER-002", name="Other Widget")
        hub = _make_hub(max_daily_capacity=100, current_load=0)
        _make_mapping(hub, other_product, lead_time_hours=24, priority=5)
        with self.assertRaises(ValueError):
            recommend_hub_for_order(self.order.pk)


class AssignmentServiceInvalidOrderTest(TestCase):
    """ValueError raised for a non-existent order."""

    def test_non_existent_order_raises_value_error(self):
        with self.assertRaises(ValueError):
            recommend_hub_for_order(uuid.uuid4())


class AssignmentServiceSingleHubTest(TestCase):
    """Single eligible hub — still produces a valid result."""

    def setUp(self):
        self.product = _make_product(sku="SKU-SINGLE-001")
        self.order = _make_order(self.product)
        self.hub = _make_hub(max_daily_capacity=200, current_load=50)
        _make_mapping(self.hub, self.product, lead_time_hours=24, priority=7)

    def test_single_hub_recommended(self):
        result = recommend_hub_for_order(self.order.pk)
        self.assertEqual(result["recommended_hub_id"], str(self.hub.id))

    def test_confidence_score_valid_range_single_hub(self):
        """With one hub, confidence should be a valid float in (0, 1]."""
        recommend_hub_for_order(self.order.pk)
        decision = AIDecision.objects.get(related_order=self.order)
        self.assertGreater(decision.confidence_score, 0.0)
        self.assertLessEqual(decision.confidence_score, 1.0)

    def test_no_auto_assignment(self):
        """Order's hub field must NOT be set by this service."""
        recommend_hub_for_order(self.order.pk)
        self.order.refresh_from_db()
        self.assertIsNone(self.order.hub)
