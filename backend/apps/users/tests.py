from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Role, Permission

User = get_user_model()

class UserAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create some roles and permissions
        self.role1 = Role.objects.create(name='ADMIN', description='Admin Role')
        self.perm1 = Permission.objects.create(name='view_users', module='users')
        self.role1.permissions.add(self.perm1)
        
        self.user.roles.add(self.role1)

    def test_get_users(self):
        url = reverse('user-list') # Depends on router registration
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming pagination or flat list
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_user(self):
        url = reverse('user-list')
        data = {
            'email': 'newuser@example.com',
            'password': 'newpassword123',
            'first_name': 'New',
            'last_name': 'User',
            'role_ids': [str(self.role1.id)]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(email='newuser@example.com').count(), 1)
        new_user = User.objects.get(email='newuser@example.com')
        self.assertEqual(new_user.roles.count(), 1)

    def test_update_user(self):
        url = reverse('user-detail', args=[self.user.id])
        data = {
            'first_name': 'UpdatedName'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'UpdatedName')

    def test_toggle_status(self):
        url = reverse('user-toggle-status', args=[self.user.id])
        self.assertTrue(self.user.is_active)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_reset_password(self):
        url = reverse('user-reset-password', args=[self.user.id])
        data = {'password': 'newpassword456'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword456'))

class RoleAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='admin@example.com',
            password='testpassword123'
        )
        self.client.force_authenticate(user=self.user)
        self.perm1 = Permission.objects.create(name='manage_roles', module='roles')

    def test_create_role(self):
        url = reverse('role-list')
        data = {
            'name': 'MANAGER',
            'description': 'Manager Role',
            'permission_ids': [str(self.perm1.id)]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Role.objects.count(), 1)
        role = Role.objects.get(name='MANAGER')
        self.assertEqual(role.permissions.count(), 1)

class PermissionAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='admin@example.com',
            password='testpassword123'
        )
        self.client.force_authenticate(user=self.user)
        Permission.objects.create(name='view_reports', module='reports')

    def test_get_permissions(self):
        url = reverse('permission-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
