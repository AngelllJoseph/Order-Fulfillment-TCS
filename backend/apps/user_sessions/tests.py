from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import UserSession, AccessLog

User = get_user_model()

class UserSessionAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='admin@example.com',
            password='testpassword123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create a session
        self.session = UserSession.objects.create(
            user=self.user,
            session_token='test-token-123',
            ip_address='127.0.0.1',
            device='Mozilla/5.0',
            is_active=True
        )

    def test_get_active_sessions(self):
        url = reverse('usersession-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        # Assuming we filter by active in the view or just returning all for admin
        self.assertEqual(response.data[0]['is_active'], True)

    def test_terminate_session(self):
        url = reverse('usersession-terminate', args=[self.session.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertFalse(self.session.is_active)

class AccessLogAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='admin@example.com',
            password='testpassword123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create an access log
        AccessLog.objects.create(
            user=self.user,
            ip_address='127.0.0.1',
            device='Mozilla/5.0',
            login_status='SUCCESS'
        )

    def test_get_access_logs(self):
        url = reverse('accesslog-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['login_status'], 'SUCCESS')

    def test_access_logs_read_only(self):
        url = reverse('accesslog-list')
        data = {
            'login_status': 'FAILED'
        }
        response = self.client.post(url, data, format='json')
        # ViewSet is ReadOnlyModelViewSet, so POST should not be allowed
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
