from rest_framework import serializers
from .models import AgentDefinition, AgentExecution


class AgentDefinitionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_agent_type_display', read_only=True)

    class Meta:
        model = AgentDefinition
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AgentExecutionSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.name', read_only=True)

    class Meta:
        model = AgentExecution
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class MultiAgentRequestSerializer(serializers.Serializer):
    """Request to run a multi-agent workflow."""
    task = serializers.CharField()
    category = serializers.CharField()
    input_data = serializers.CharField()
    agents = serializers.ListField(child=serializers.UUIDField(), required=False)
    model = serializers.CharField(default='gpt-4o-mini')
