from django.test import TestCase
from apps.hubs.models import Hub
from apps.ai_engine.models import AIDecision
from apps.operations.models import Alert
from apps.operations.services.alert_service import generate_operations_alerts
from apps.orders.models import Order
from apps.products.models import Product
from django.utils import timezone
import uuid

class AlertServiceTest(TestCase):
    def setUp(self):
        # Create a hub at high capacity
        self.hub = Hub.objects.create(
            hub_code='TEST-01',
            name='Test Hub',
            max_daily_capacity=100,
            current_load=95,
            status='ACTIVE'
        )
        
        # Create a product and order for delay prediction
        self.product = Product.objects.create(
            product_id='PROD-01',
            sku='SKU-01',
            name='Test Product',
            price=10.0
        )
        self.order = Order.objects.create(
            order_id='ORD-TEST-01',
            product=self.product,
            customer_email='test@example.com',
            status='ORDERED',
            expected_delivery_date=timezone.now().date()
        )
        
        # Create a delay prediction decision with high confidence
        self.decision = AIDecision.objects.create(
            decision_type='DELAY_PREDICTION',
            related_order=self.order,
            confidence_score=0.85,
            status='WAITING_APPROVAL',
            recommendation={'reasoning_text': 'Supply bottleneck'}
        )

    def test_alert_generation(self):
        # Initial alert count
        self.assertEqual(Alert.objects.count(), 0)
        
        # Trigger generation
        count = generate_operations_alerts()
        
        # Should create 2 alerts (1 capacity, 1 delay)
        self.assertEqual(count, 2)
        self.assertEqual(Alert.objects.count(), 2)
        
        # Verify capacity alert
        cap_alert = Alert.objects.get(type='CAPACITY')
        self.assertEqual(cap_alert.severity, 'HIGH') # 95 is between 90 and 95
        self.assertIn('95.0%', cap_alert.message)
        
        # Verify delay alert
        delay_alert = Alert.objects.get(type='DELAY')
        self.assertEqual(delay_alert.severity, 'HIGH')
        self.assertIn('ORD-TEST-01', delay_alert.message)

    def test_duplicate_prevention(self):
        # Generate once
        generate_operations_alerts()
        initial_count = Alert.objects.count()
        
        # Generate again
        count = generate_operations_alerts()
        
        # Should not create new alerts if issues still exist and alerts are unresolved
        self.assertEqual(count, 0)
        self.assertEqual(Alert.objects.count(), initial_count)
