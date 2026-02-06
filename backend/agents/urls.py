from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'definitions', views.AgentDefinitionViewSet)
router.register(r'executions', views.AgentExecutionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('workflow/', views.run_multi_agent_workflow, name='multi-agent-workflow'),
    path('cards/', views.list_agent_cards, name='agent-cards'),
]
