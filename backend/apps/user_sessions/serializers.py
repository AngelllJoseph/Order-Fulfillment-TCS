from rest_framework import serializers
from apps.users.models import UserSession, AccessLog
from apps.users.serializers import UserSerializer

class UserSessionSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = UserSession
        fields = [
            'id', 'user', 'user_details', 'session_token', 'login_time', 
            'last_activity', 'logout_time', 'ip_address', 'device', 'is_active'
        ]

class AccessLogSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = AccessLog
        fields = [
            'id', 'user', 'user_details', 'login_time', 'logout_time', 
            'ip_address', 'device', 'location', 'login_status'
        ]
