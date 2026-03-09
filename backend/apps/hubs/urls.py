from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HubViewSet, HubSKUMappingViewSet

router = DefaultRouter()
router.register(r'hubs', HubViewSet)
router.register(r'mappings', HubSKUMappingViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
