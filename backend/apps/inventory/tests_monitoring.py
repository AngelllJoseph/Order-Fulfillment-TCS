from django.test import TestCase
from django.utils import timezone
from apps.inventory.models import Inventory
from apps.notifications.models import Notification
from apps.ai_engine.models import AIDecision
from apps.products.models import Product
from apps.hubs.models import Hub

class InventoryMonitoringTests(TestCase):
    def setUp(self):
        self.hub = Hub.objects.create(
            hub_code="HUB_TEST",
            name="Test Hub",
            location="Test Location"
        )
        self.product = Product.objects.create(
            product_id="PROD_TEST",
            sku="SKU_TEST",
            name="Test Product",
            price=15.0,
            category="Test Category"
        )
        # Create inventory with 100 stock and threshold 20
        self.inventory = Inventory.objects.create(
            hub=self.hub,
            product=self.product,
            quantity_available=100,
            reorder_threshold=20
        )

    def test_low_stock_triggers_alerts(self):
        """Test that dropping below threshold creates Notification and AIDecision."""
        # Initial check - no alerts
        self.assertEqual(Notification.objects.count(), 0)
        self.assertEqual(AIDecision.objects.count(), 0)

        # Update stock to 15 (below threshold 20)
        self.inventory.quantity_available = 15
        self.inventory.save()

        # Check alerts
        self.assertEqual(Notification.objects.count(), 1)
        self.assertEqual(AIDecision.objects.count(), 1)

        notification = Notification.objects.first()
        self.assertEqual(notification.type, 'WARNING')
        self.assertIn("Test Product", notification.message)

        ai_decision = AIDecision.objects.first()
        self.assertEqual(ai_decision.decision_type, 'INVENTORY_ALERT')
        self.assertEqual(ai_decision.status, 'AUTO_EXECUTED')
        self.assertEqual(ai_decision.recommendation['product_name'], "Test Product")

    def test_sufficient_stock_no_alerts(self):
        """Test that updating stock above threshold does not create alerts."""
        # Update stock to 50 (above threshold 20)
        self.inventory.quantity_available = 50
        self.inventory.save()

        self.assertEqual(Notification.objects.count(), 0)
        self.assertEqual(AIDecision.objects.count(), 0)

    def test_no_duplicate_unread_notifications(self):
        """Test that multiple saves below threshold don't spam unread notifications."""
        # First drop below threshold
        self.inventory.quantity_available = 15
        self.inventory.save()
        self.assertEqual(Notification.objects.count(), 1)

        # Second drop/save below threshold
        self.inventory.quantity_available = 10
        self.inventory.save()
        
        # Should still be 1 notification because first one is unread
        self.assertEqual(Notification.objects.count(), 1)
        # But AIDecision should be 2 (tracking every drop event)
        self.assertEqual(AIDecision.objects.count(), 2)

        # Read the notification
        notif = Notification.objects.first()
        notif.is_read = True
        notif.save()

        # Third drop
        self.inventory.quantity_available = 5
        self.inventory.save()
        self.assertEqual(Notification.objects.count(), 2)
