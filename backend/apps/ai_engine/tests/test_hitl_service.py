"""
Unit tests for Human-in-the-Loop workflow:
  - apps.ai_engine.services.hitl_service
  - POST /api/ai/decisions/{id}/approve/
  - POST /api/ai/decisions/{id}/reject/
"""

import datetime
import uuid

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.ai_engine.models import AIDecision
from apps.ai_engine.services import hitl_service
from apps.hubs.models import Hub, HubSKUMapping
from apps.notifications.models import Notification
from apps.orders.models import Order
from apps.products.models import Product
from apps.users.models import AuditLog, User


# ---------------------------------------------------------------------------
# Shared factories
# ---------------------------------------------------------------------------

def _make_product(sku="SKU-HITL-001"):
    return Product.objects.create(
        product_id=f"PROD-{uuid.uuid4().hex[:6].upper()}",
        sku=sku,
        name="HITL Widget",
        price="19.99",
        category="Test",
    )


def _make_hub(name="Hub HITL", max_daily_capacity=100, current_load=20):
    return Hub.objects.create(
        hub_code=f"HUB-{uuid.uuid4().hex[:4].upper()}",
        name=name,
        location="Test City",
        max_daily_capacity=max_daily_capacity,
        current_load=current_load,
        status="ACTIVE",
    )


def _make_order(product):
    return Order.objects.create(
        product=product,
        sku=product.sku,
        quantity=5,
        customer_name="Test Customer",
        customer_phone="9999999999",
        shipping_address="123 HITL Street",
        expected_delivery_date=datetime.date.today() + datetime.timedelta(days=7),
    )


def _make_decision(order, hub, confidence_score=0.5, status="WAITING_APPROVAL"):
    return AIDecision.objects.create(
        decision_type="ASSIGNMENT",
        related_order=order,
        recommendation={
            "recommended_hub_id": str(hub.id),
            "score": confidence_score,
            "reasoning_text": "Test reasoning.",
        },
        confidence_score=confidence_score,
        status=status,
        executed=False,
    )


def _make_user(email=None, role="PROGRAM_MANAGER"):
    email = email or f"pm-{uuid.uuid4().hex[:6]}@test.com"
    return User.objects.create_user(
        username=email,
        email=email,
        password="testpass123",
        first_name="Test",
        last_name="PM",
        role=role,
    )


# ---------------------------------------------------------------------------
# hitl_service.dispatch_decision — low confidence
# ---------------------------------------------------------------------------

class DispatchLowConfidenceTest(TestCase):
    """Score < 0.8 → WAITING_APPROVAL + PM notifications."""

    def setUp(self):
        self.product = _make_product()
        self.hub = _make_hub()
        self.order = _make_order(self.product)
        self.pm1 = _make_user(email="pm1@test.com")
        self.pm2 = _make_user(email="pm2@test.com")
        self.decision = _make_decision(self.order, self.hub, confidence_score=0.65)

    def test_status_set_to_waiting_approval(self):
        hitl_service.dispatch_decision(self.decision)
        self.decision.refresh_from_db()
        self.assertEqual(self.decision.status, "WAITING_APPROVAL")

    def test_decision_not_executed(self):
        hitl_service.dispatch_decision(self.decision)
        self.decision.refresh_from_db()
        self.assertFalse(self.decision.executed)

    def test_order_not_assigned(self):
        hitl_service.dispatch_decision(self.decision)
        self.order.refresh_from_db()
        self.assertIsNone(self.order.hub)

    def test_notifications_sent_to_all_pms(self):
        hitl_service.dispatch_decision(self.decision)
        notif_count = Notification.objects.filter(
            user__in=[self.pm1, self.pm2],
        ).count()
        self.assertEqual(notif_count, 2)

    def test_notification_content(self):
        hitl_service.dispatch_decision(self.decision)
        notif = Notification.objects.filter(user=self.pm1).first()
        self.assertIsNotNone(notif)
        self.assertIn(self.order.order_id, notif.message)
        self.assertEqual(notif.type, "INFO")


# ---------------------------------------------------------------------------
# hitl_service.dispatch_decision — high confidence
# ---------------------------------------------------------------------------

class DispatchHighConfidenceTest(TestCase):
    """Score >= 0.8 → auto-executed immediately."""

    def setUp(self):
        self.product = _make_product(sku="SKU-HITL-HIGH-001")
        self.hub = _make_hub(name="Hub AutoExec")
        self.order = _make_order(self.product)
        self.decision = _make_decision(self.order, self.hub, confidence_score=0.85)

    def test_decision_auto_executed(self):
        hitl_service.dispatch_decision(self.decision)
        self.decision.refresh_from_db()
        self.assertEqual(self.decision.status, "AUTO_EXECUTED")
        self.assertTrue(self.decision.executed)
        self.assertIsNotNone(self.decision.executed_at)

    def test_order_hub_assigned(self):
        hitl_service.dispatch_decision(self.decision)
        self.order.refresh_from_db()
        self.assertEqual(self.order.hub, self.hub)

    def test_order_status_assigned(self):
        hitl_service.dispatch_decision(self.decision)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "ASSIGNED")

    def test_audit_log_created(self):
        hitl_service.dispatch_decision(self.decision)
        log = AuditLog.objects.filter(
            module="AI Engine",
            action__icontains="AUTO-EXECUTED",
        ).first()
        self.assertIsNotNone(log)

    def test_no_notifications_on_auto_execute(self):
        hitl_service.dispatch_decision(self.decision)
        self.assertEqual(Notification.objects.count(), 0)


# ---------------------------------------------------------------------------
# hitl_service.reject_decision
# ---------------------------------------------------------------------------

class RejectDecisionTest(TestCase):

    def setUp(self):
        self.product = _make_product(sku="SKU-HITL-REJ-001")
        self.hub = _make_hub(name="Hub Reject")
        self.order = _make_order(self.product)
        self.actor = _make_user(email="pm-reject@test.com")
        self.decision = _make_decision(self.order, self.hub, confidence_score=0.5)

    def test_status_set_to_rejected(self):
        hitl_service.reject_decision(self.decision, actor=self.actor, reason="Too busy.")
        self.decision.refresh_from_db()
        self.assertEqual(self.decision.status, "REJECTED")

    def test_order_not_assigned(self):
        hitl_service.reject_decision(self.decision, actor=self.actor)
        self.order.refresh_from_db()
        self.assertIsNone(self.order.hub)

    def test_audit_log_created(self):
        hitl_service.reject_decision(self.decision, actor=self.actor, reason="No capacity.")
        log = AuditLog.objects.filter(
            module="AI Engine",
            action__icontains="REJECTED",
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.user, self.actor)
        self.assertEqual(log.old_value, "No capacity.")


# ---------------------------------------------------------------------------
# API endpoint: POST /api/ai/decisions/{id}/approve/
# ---------------------------------------------------------------------------

class ApproveEndpointTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.product = _make_product(sku="SKU-API-APPROVE-001")
        self.hub = _make_hub(name="Hub Approve")
        self.order = _make_order(self.product)
        self.actor = _make_user(email="pm-approve@test.com", role="PROGRAM_MANAGER")
        self.client.force_authenticate(user=self.actor)
        self.decision = _make_decision(self.order, self.hub, confidence_score=0.6)

    def _url(self):
        return f"/api/ai/decisions/{self.decision.pk}/approve/"

    def test_approve_returns_200(self):
        resp = self.client.post(self._url())
        self.assertEqual(resp.status_code, 200)

    def test_approve_sets_approved_status(self):
        self.client.post(self._url())
        self.decision.refresh_from_db()
        self.assertEqual(self.decision.status, "APPROVED")

    def test_approve_marks_executed(self):
        self.client.post(self._url())
        self.decision.refresh_from_db()
        self.assertTrue(self.decision.executed)
        self.assertIsNotNone(self.decision.executed_at)

    def test_approve_assigns_hub_to_order(self):
        self.client.post(self._url())
        self.order.refresh_from_db()
        self.assertEqual(self.order.hub, self.hub)
        self.assertEqual(self.order.status, "ASSIGNED")

    def test_approve_creates_audit_log(self):
        self.client.post(self._url())
        log = AuditLog.objects.filter(module="AI Engine", user=self.actor).first()
        self.assertIsNotNone(log)
        self.assertIn("APPROVED", log.action)

    def test_double_approve_returns_400(self):
        self.client.post(self._url())  # first approve
        resp = self.client.post(self._url())  # second attempt
        self.assertEqual(resp.status_code, 400)

    def test_unauthenticated_returns_401(self):
        self.client.logout()
        resp = self.client.post(self._url())
        self.assertEqual(resp.status_code, 401)


# ---------------------------------------------------------------------------
# API endpoint: POST /api/ai/decisions/{id}/reject/
# ---------------------------------------------------------------------------

class RejectEndpointTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.product = _make_product(sku="SKU-API-REJECT-001")
        self.hub = _make_hub(name="Hub Api Reject")
        self.order = _make_order(self.product)
        self.actor = _make_user(email="pm-rej-api@test.com", role="PROGRAM_MANAGER")
        self.client.force_authenticate(user=self.actor)
        self.decision = _make_decision(self.order, self.hub, confidence_score=0.55)

    def _url(self):
        return f"/api/ai/decisions/{self.decision.pk}/reject/"

    def test_reject_returns_200(self):
        resp = self.client.post(self._url(), {"reason": "Hub unavailable."}, format="json")
        self.assertEqual(resp.status_code, 200)

    def test_reject_sets_rejected_status(self):
        self.client.post(self._url())
        self.decision.refresh_from_db()
        self.assertEqual(self.decision.status, "REJECTED")

    def test_reject_does_not_assign_hub(self):
        self.client.post(self._url())
        self.order.refresh_from_db()
        self.assertIsNone(self.order.hub)
        self.assertNotEqual(self.order.status, "ASSIGNED")

    def test_reject_creates_audit_log(self):
        self.client.post(self._url(), {"reason": "Not now."}, format="json")
        log = AuditLog.objects.filter(module="AI Engine", user=self.actor).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.old_value, "Not now.")

    def test_double_reject_returns_400(self):
        self.client.post(self._url())
        resp = self.client.post(self._url())
        self.assertEqual(resp.status_code, 400)

    def test_unauthenticated_returns_401(self):
        self.client.logout()
        resp = self.client.post(self._url())
        self.assertEqual(resp.status_code, 401)
