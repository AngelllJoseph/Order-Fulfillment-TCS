from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AIDecisionViewSet,
    PendingDecisionsView,
    ApproveDecisionView,
    RejectDecisionView,
    AIAccuracyStatsView,
    AIApprovalHistoryView,
    ConfidenceThresholdView,
)

router = DefaultRouter()
router.register(r'decisions', AIDecisionViewSet, basename='ai-decision')

urlpatterns = [
    path('', include(router.urls)),
    path('pending-decisions/', PendingDecisionsView.as_view(), name='pending-decisions'),
    path('approve/<uuid:pk>/', ApproveDecisionView.as_view(), name='approve-decision'),
    path('reject/<uuid:pk>/', RejectDecisionView.as_view(), name='reject-decision'),
    path('accuracy-stats/', AIAccuracyStatsView.as_view(), name='ai-accuracy-stats'),
    path('approval-history/', AIApprovalHistoryView.as_view(), name='ai-approval-history'),
    path('settings/confidence-threshold/', ConfidenceThresholdView.as_view(), name='ai-confidence-threshold'),
]
