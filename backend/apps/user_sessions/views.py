from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.models import UserSession, AccessLog
from .serializers import UserSessionSerializer, AccessLogSerializer

class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserSession.objects.filter(is_active=True).order_by('-login_time')
    serializer_class = UserSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        session = self.get_object()
        session.is_active = False
        import django.utils.timezone as timezone
        session.logout_time = timezone.now()
        session.save()
        return Response({'status': 'session terminated'})

class AccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AccessLog.objects.all().order_by('-login_time')
    serializer_class = AccessLogSerializer
    permission_classes = [permissions.IsAuthenticated]
