"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.auth_custom.urls')), # Using custom auth
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('apps.users.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/user-sessions/', include('apps.user_sessions.urls')),
    path('api/hubs/', include('apps.hubs.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/common/', include('apps.common.urls')),
    path('api/dashboard/', include('apps.common.urls')),
    path('api/ai/', include('apps.ai_engine.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/operations/', include('apps.operations.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
]
