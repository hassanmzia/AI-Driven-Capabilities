from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
    path('costs/', views.cost_analysis, name='cost-analysis'),
    path('performance/', views.performance_metrics, name='performance-metrics'),
]
