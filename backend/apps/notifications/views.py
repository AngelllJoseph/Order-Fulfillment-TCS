from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see their own notifications + broadcast notifications (user=None)
        user = self.request.user
        return Notification.objects.filter(models.Q(user=user) | models.Q(user__isnull=True))

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def send(self, request):
        """
        Admin endpoint to send a notification to specific user(s) or broadcast.
        Payload: { user_id: ID or null, title: 'Title', message: 'Message', type: 'INFO' }
        """
        user_id = request.data.get('user_id')
        title = request.data.get('title')
        message = request.data.get('message')
        notif_type = request.data.get('type', 'INFO')

        if not title or not message:
            return Response({'error': 'Title and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            type=notif_type,
        )

        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
