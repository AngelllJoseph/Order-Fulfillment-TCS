import os
import django
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.users.models import Role, Permission, RolePermission

def seed_data():
    permissions = [
        # User Management
        ('VIEW_USERS', 'Users'),
        ('CREATE_USER', 'Users'),
        ('EDIT_USER', 'Users'),
        ('DELETE_USER', 'Users'),
        # Role Management
        ('VIEW_ROLES', 'Roles'),
        ('MANAGE_ROLES', 'Roles'),
        # Logs
        ('VIEW_ACCESS_LOGS', 'Logs'),
        ('VIEW_AUDIT_LOGS', 'Logs'),
        # Sessions
        ('VIEW_SESSIONS', 'Sessions'),
        ('TERMINATE_SESSIONS', 'Sessions'),
    ]

    perm_objs = {}
    for name, module in permissions:
        perm, created = Permission.objects.get_or_create(
            permission_name=name,
            module=module
        )
        perm_objs[name] = perm
        if created:
            print(f"Created permission: {name}")

    roles = [
        ('ADMIN', 'Full system access'),
        ('PROGRAM_MANAGER', 'Manage orders and hubs'),
        ('MANUFACTURING_LEAD', 'Manage production floor'),
        ('REPORT_USER', 'View only access to reports'),
    ]

    for role_name, desc in roles:
        role, created = Role.objects.get_or_create(
            role_name=role_name,
            defaults={'description': desc}
        )
        if created:
            print(f"Created role: {role_name}")
            
        # Assign all permissions to Admin
        if role_name == 'ADMIN':
            for perm in perm_objs.values():
                RolePermission.objects.get_or_create(role=role, permission=perm)
            print(f"Assigned all permissions to {role_name}")

if __name__ == '__main__':
    seed_data()
