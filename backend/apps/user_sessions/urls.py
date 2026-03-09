from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserSessionViewSet, AccessLogViewSet

router = DefaultRouter()
router.register(r'sessions', UserSessionViewSet)
router.register(r'access-logs', AccessLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
