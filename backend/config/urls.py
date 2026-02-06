from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('promptengine.urls')),
    path('api/v1/agents/', include('agents.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/platform/', include('prompt_platform.urls')),
]
