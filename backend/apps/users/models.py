import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class Permission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    permission_name = models.CharField(max_length=255, unique=True)
    module = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.module} | {self.permission_name}"

class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    permissions = models.ManyToManyField(Permission, through='RolePermission', related_name='roles')

    def __str__(self):
        return self.role_name

class RolePermission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('role', 'permission')

class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('PROGRAM_MANAGER', 'Program Manager'),
        ('MANUFACTURING_LEAD', 'Manufacturing Lead'),
        ('REPORT_USER', 'Report User'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    # Keeping role field as a legacy/convenience for now, but will use M2M roles
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='REPORT_USER')
    
    mfa_enabled = models.BooleanField(default=False)
    
    # Existing fields
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    
    roles = models.ManyToManyField(Role, through='UserRole', related_name='users')

    # Audit fields
    created_by = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='created_users'
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    # Hub relationship
    hub = models.ForeignKey(
        'hubs.Hub', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='staff'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

class UserRole(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'role')

# Note: AuditLog and UserSession will be moved to separate apps as requested.
# I am keeping them here temporarily to avoid breaking existing code until migrations are ready.

class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
    session_token = models.CharField(max_length=255, unique=True, null=True, blank=True)
    login_time = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device = models.TextField(null=True, blank=True) # Changed from device_info
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Session for {self.user.email} at {self.login_time}"

class AccessLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='access_logs')
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    login_status = models.CharField(max_length=20, choices=[('SUCCESS', 'Success'), ('FAILED', 'Failed')])

    def __str__(self):
        return f"{self.user.email} - {self.login_status} at {self.login_time}"

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=255)
    module = models.CharField(max_length=100, null=True, blank=True)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"{self.action} by {self.user} at {self.timestamp}"

class AIApproval(models.Model):
    DECISION_CHOICES = [
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ai_decision_id = models.CharField(max_length=255) # Reference to AI logic decision
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_approvals')
    decision = models.CharField(max_length=10, choices=DECISION_CHOICES)
    comments = models.TextField(blank=True, null=True)
    approved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AI Approval {self.id} - {self.decision} by {self.user.email}"
