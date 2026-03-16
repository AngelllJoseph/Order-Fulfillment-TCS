from django.urls import path
from .views import (
    DashboardStatsView,
    OrderAnalyticsView,
    FulfillmentPerformanceView,
    DeliveryTimelinesView,
    CapacityUtilizationView,
    ExportReportsView,
    DemandSupplyAnalyticsView,
    AIDecisionMetricsView,
    OrderTrendView,
)

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='report-dashboard-stats'),
    path('analytics/orders/', OrderAnalyticsView.as_view(), name='report-order-analytics'),
    path('performance/fulfillment/', FulfillmentPerformanceView.as_view(), name='report-fulfillment-perf'),
    path('performance/delivery/', DeliveryTimelinesView.as_view(), name='report-delivery-perf'),
    path('capacity/utilization/', CapacityUtilizationView.as_view(), name='report-capacity-util'),
    path('analytics/demand-supply/', DemandSupplyAnalyticsView.as_view(), name='report-demand-supply'),
    path('export/', ExportReportsView.as_view(), name='report-export'),
    path('ai-metrics/', AIDecisionMetricsView.as_view(), name='report-ai-metrics'),
    path('order-trend/', OrderTrendView.as_view(), name='report-order-trend'),
]
