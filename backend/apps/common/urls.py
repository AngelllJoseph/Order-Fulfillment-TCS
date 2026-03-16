from django.urls import path
from .views import DashboardStatsView, ProductionOverviewView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('production-overview/', ProductionOverviewView.as_view(), name='production-overview'),
]
