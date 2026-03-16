from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import User
from apps.orders.models import Order
from apps.hubs.models import Hub
from django.utils import timezone
from datetime import timedelta
import uuid

class ReportsAPITests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='password123',
            role='ADMIN',
            first_name='Admin'
        )
        self.client.force_authenticate(user=self.admin_user)
        
        # Create some data
        self.hub = Hub.objects.create(
            hub_code='HUB01',
            name='Test Hub',
            max_daily_capacity=100,
            current_load=20
        )
        
        Order.objects.create(
            order_id='ORD-001',
            customer_name='John Doe',
            customer_phone='1234567890',
            status='ORDERED',
            expected_delivery_date=timezone.now().date() + timedelta(days=7)
        )

    def test_dashboard_stats(self):
        url = reverse('report-dashboard-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_orders', response.data)

    def test_demand_supply_analytics(self):
        url = reverse('report-demand-supply')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('forecasted_demand', response.data)
        self.assertIn('available_capacity', response.data)
        self.assertIn('utilization_prediction', response.data)
        
        # Verify capacity calculation
        self.assertEqual(response.data['available_capacity'], 80)
        self.assertEqual(response.data['total_capacity'], 100)
        self.assertEqual(response.data['current_load'], 20)
