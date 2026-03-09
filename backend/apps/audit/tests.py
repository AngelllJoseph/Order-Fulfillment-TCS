from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import AuditLog

User = get_user_model()

class AuditLogAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='admin@example.com',
            password='testpassword123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create some audit logs
        AuditLog.objects.create(
            user=self.user,
            action='USER_LOGIN',
            module='auth',
            ip_address='127.0.0.1'
        )

    def test_get_audit_logs(self):
        url = reverse('auditlog-list') # Depends on router registration
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain at least 1 log
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['action'], 'USER_LOGIN')

    def test_audit_logs_read_only(self):
        url = reverse('auditlog-list')
        data = {
            'action': 'HACK_SYSTEM',
            'module': 'core'
        }
        response = self.client.post(url, data, format='json')
        # ViewSet is ReadOnlyModelViewSet, so POST should not be allowed
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
