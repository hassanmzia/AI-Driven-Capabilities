import uuid
from django.db import models


class AgentDefinition(models.Model):
    """Defines an AI agent with specific capabilities for the multi-agent system."""
    AGENT_TYPES = [
        ('analyzer', 'Content Analyzer'),
        ('generator', 'Content Generator'),
        ('reviewer', 'Quality Reviewer'),
        ('router', 'Task Router'),
        ('orchestrator', 'Orchestrator'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    agent_type = models.CharField(max_length=50, choices=AGENT_TYPES)
    description = models.TextField()
    system_prompt = models.TextField()
    capabilities = models.JSONField(default=list, help_text="List of capability tags")
    model_preference = models.CharField(max_length=100, default='gpt-4o-mini')
    max_tokens = models.IntegerField(default=1024)
    temperature = models.FloatField(default=0.7)
    is_active = models.BooleanField(default=True)
    mcp_endpoint = models.CharField(max_length=500, blank=True, help_text="MCP protocol endpoint")
    a2a_card = models.JSONField(default=dict, blank=True, help_text="A2A Agent Card metadata")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_agent_type_display()})"


class AgentExecution(models.Model):
    """Records agent interactions in multi-agent workflows."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(AgentDefinition, on_delete=models.CASCADE, related_name='executions')
    workflow_id = models.UUIDField(help_text="Groups related agent executions")
    parent_execution = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    input_data = models.TextField()
    output_data = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='pending')
    tokens_used = models.IntegerField(default=0)
    latency_ms = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.agent.name} - {self.status}"
