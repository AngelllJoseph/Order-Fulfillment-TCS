from django.urls import path
from .views import DelayRisksView, ReassignHubView, ExtendETAView, NotifyCustomerView, OperationsAlertsView

urlpatterns = [
    path('delay-risks/', DelayRisksView.as_view(), name='delay-risks'),
    path('reassign-hub/', ReassignHubView.as_view(), name='reassign-hub'),
    path('extend-eta/', ExtendETAView.as_view(), name='extend-eta'),
    path('notify-customer/', NotifyCustomerView.as_view(), name='notify-customer'),
    path('alerts/', OperationsAlertsView.as_view(), name='operations-alerts'),
]
