from rest_framework import serializers
from apps.users.models import AuditLog
from apps.users.serializers import UserSerializer

class AuditLogSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_details', 'action', 'module', 
            'old_value', 'new_value', 'timestamp', 'ip_address'
        ]
