import datetime
import uuid
from django.test import TestCase
from django.utils import timezone
from apps.orders.models import Order, OrderItem
from apps.ai_engine.models import AIDecision
from apps.ai_engine.orchestrator.executor import run_fulfillment_workflow, resume_fulfillment_workflow
from apps.hubs.models import Hub
from apps.products.models import Product
from unittest.mock import patch

class OrchestratorTest(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            product_id=f"PROD-{uuid.uuid4().hex[:6].upper()}",
            sku="SKU-ORCH-001",
            name="Orchestrator Widget",
            price="25.00",
            category="Test",
        )
        self.hub = Hub.objects.create(
            hub_code=f"HUB-{uuid.uuid4().hex[:4].upper()}",
            name="Test Hub",
            location="Test City",
            max_daily_capacity=100,
            current_load=10,
            status="ACTIVE",
        )

    @patch('apps.ai_engine.services.hub_scoring_service.HubScoringService.score_hubs_for_item')
    @patch('apps.ai_engine.services.assignment_agent.AssignmentAgent.fetch_candidate_hubs')
    def test_full_workflow_auto_execution(self, mock_fetch, mock_score):
        # Setup
        order = Order.objects.create(
            customer_name="Test Customer",
            customer_phone="1234567890",
            shipping_address="Test Address",
            expected_delivery_date=timezone.now().date()
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1
        )
        
        mock_fetch.return_value = [self.hub]
        mock_score.return_value = [{
            'hub_id': self.hub.id,
            'hub_name': self.hub.name,
            'hub_code': self.hub.hub_code,
            'confidence_score': 0.9,
            'total_score': 95
        }]
        
        # Run workflow
        result = run_fulfillment_workflow(order.order_id)
        
        # Verify
        self.assertEqual(result['execution_status'], 'COMPLETED')
        self.assertEqual(result['confidence_score'], 0.9)
        self.assertFalse(result['requires_hitl'])
        
        order.refresh_from_db()
        self.assertEqual(order.status, 'ASSIGNED')
        
        decision = AIDecision.objects.get(related_order=order)
        self.assertEqual(decision.status, 'AUTO_EXECUTED')
        self.assertTrue(decision.executed)
        self.assertTrue(len(decision.execution_trace) > 0)

    @patch('apps.ai_engine.services.hub_scoring_service.HubScoringService.score_hubs_for_item')
    @patch('apps.ai_engine.services.assignment_agent.AssignmentAgent.fetch_candidate_hubs')
    def test_workflow_hitl_pause_and_resume(self, mock_fetch, mock_score):
        # Setup
        order = Order.objects.create(
            customer_name="HITL Customer",
            customer_phone="1234567890",
            shipping_address="Test Address",
            expected_delivery_date=timezone.now().date()
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1
        )
        
        mock_fetch.return_value = [self.hub]
        mock_score.return_value = [{
            'hub_id': self.hub.id,
            'hub_name': self.hub.name,
            'hub_code': self.hub.hub_code,
            'confidence_score': 0.5, # Low confidence
            'total_score': 50
        }]
        
        # Run workflow (should pause)
        result = run_fulfillment_workflow(order.order_id)
        
        self.assertEqual(result['execution_status'], 'WAITING_APPROVAL')
        self.assertTrue(result['requires_hitl'])
        
        decision = AIDecision.objects.get(related_order=order)
        self.assertEqual(decision.status, 'WAITING_APPROVAL')
        
        # Approve decision
        decision.status = 'APPROVED'
        decision.save()
        
        # Resume workflow
        resume_result = resume_fulfillment_workflow(str(decision.id))
        
        self.assertEqual(resume_result['execution_status'], 'COMPLETED')
        order.refresh_from_db()
        self.assertEqual(order.status, 'ASSIGNED')
        
        decision.refresh_from_db()
        self.assertEqual(decision.status, 'APPROVED')
        self.assertTrue(decision.executed)
