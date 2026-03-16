from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AIDecisionViewSet,
    PendingDecisionsView,
    ApproveDecisionView,
    RejectDecisionView
)

router = DefaultRouter()
router.register(r'decisions', AIDecisionViewSet, basename='ai-decision')

urlpatterns = [
    path('', include(router.urls)),
    path('pending-decisions/', PendingDecisionsView.as_view(), name='pending-decisions'),
    path('approve/<uuid:pk>/', ApproveDecisionView.as_view(), name='approve-decision'),
    path('reject/<uuid:pk>/', RejectDecisionView.as_view(), name='reject-decision'),
]
