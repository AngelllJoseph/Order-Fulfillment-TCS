from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from apps.users.models import AccessLog, UserSession, AuditLog
import uuid

class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        email = request.data.get('email')
        from apps.users.models import User
        user = User.objects.filter(email=email).first()
        
        status_code = response.status_code
        login_status = 'SUCCESS' if status_code == 200 else 'FAILED'
        
        # Log Access
        AccessLog.objects.create(
            user=user if user else None,
            ip_address=request.META.get('REMOTE_ADDR'),
            device=request.META.get('HTTP_USER_AGENT'),
            login_status=login_status
        )
        
        if status_code == 200 and user:
            # Create Session
            UserSession.objects.create(
                user=user,
                session_token=response.data.get('access')[:255], # Simple token ref
                ip_address=request.META.get('REMOTE_ADDR'),
                device=request.META.get('HTTP_USER_AGENT'),
            )
            
            # Audit Log
            AuditLog.objects.create(
                user=user,
                action='LOGIN',
                module='AUTH',
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            from apps.users.serializers import UserSerializer
            response.data['user'] = UserSerializer(user).data
            
        return response

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Mark sessions inactive
        UserSession.objects.filter(user=user, is_active=True).update(
            is_active=False, 
            logout_time=timezone.now()
        )
        
        # Update Access Log
        last_log = AccessLog.objects.filter(user=user, login_status='SUCCESS').last()
        if last_log:
            last_log.logout_time = timezone.now()
            last_log.save()
            
        # Audit Log
        AuditLog.objects.create(
            user=user,
            action='LOGOUT',
            module='AUTH',
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'detail': 'Logged out successfully'}, status=status.HTTP_200_OK)

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.users.serializers import UserSerializer
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
