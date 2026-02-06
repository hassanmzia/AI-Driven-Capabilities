from django.contrib import admin
from .models import AgentDefinition, AgentExecution


@admin.register(AgentDefinition)
class AgentDefinitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'agent_type', 'model_preference', 'is_active']
    list_filter = ['agent_type', 'is_active']


@admin.register(AgentExecution)
class AgentExecutionAdmin(admin.ModelAdmin):
    list_display = ['agent', 'workflow_id', 'status', 'tokens_used', 'latency_ms', 'created_at']
    list_filter = ['status']
