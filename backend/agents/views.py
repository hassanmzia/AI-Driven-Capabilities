import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import AgentDefinition, AgentExecution
from .serializers import AgentDefinitionSerializer, AgentExecutionSerializer, MultiAgentRequestSerializer
from promptengine import services


class AgentDefinitionViewSet(viewsets.ModelViewSet):
    queryset = AgentDefinition.objects.all()
    serializer_class = AgentDefinitionSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['agent_type', 'is_active']


class AgentExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AgentExecution.objects.all()
    serializer_class = AgentExecutionSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['agent', 'workflow_id', 'status']


@api_view(['POST'])
def run_multi_agent_workflow(request):
    """Execute a multi-agent workflow using A2A protocol.

    The orchestrator agent analyzes the task, delegates to specialized agents,
    and synthesizes the final result.
    """
    serializer = MultiAgentRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    workflow_id = uuid.uuid4()
    results = []

    # Step 1: Router agent analyzes the task
    router_result = services.execute_prompt(
        system_prompt=(
            "You are a task routing agent. Analyze the given task and determine "
            "which specialized agents should handle it. Return a JSON object with: "
            "analysis, recommended_agents (list), execution_order, and reasoning."
        ),
        user_prompt=f"Task: {data['task']}\nCategory: {data['category']}\nInput preview: {data['input_data'][:500]}",
        model=data['model'],
    )
    results.append({'agent': 'router', 'output': router_result.get('output', '')})

    # Step 2: Primary content agent processes the input
    primary_result = services.execute_prompt(
        system_prompt=services.SYSTEM_PROMPTS.get(data['category'], 'You are a helpful AI assistant.'),
        user_prompt=data['input_data'],
        model=data['model'],
    )
    results.append({'agent': 'primary', 'output': primary_result.get('output', '')})

    # Step 3: Quality reviewer agent evaluates the output
    reviewer_result = services.execute_prompt(
        system_prompt=(
            "You are a quality review agent. Evaluate the AI-generated output for "
            "accuracy, completeness, tone, and usefulness. Provide a quality score (1-10), "
            "specific improvements, and a brief summary. Format as JSON with: "
            "quality_score, strengths, improvements, summary."
        ),
        user_prompt=f"Original task: {data['task']}\n\nGenerated output:\n{primary_result.get('output', '')}",
        model=data['model'],
    )
    results.append({'agent': 'reviewer', 'output': reviewer_result.get('output', '')})

    # Record executions
    for r in results:
        AgentExecution.objects.create(
            agent=AgentDefinition.objects.filter(agent_type='orchestrator').first() or AgentDefinition.objects.first() or AgentDefinition.objects.create(
                name='Default Orchestrator', agent_type='orchestrator',
                description='Default multi-agent orchestrator',
                system_prompt='You orchestrate multi-agent workflows.',
            ),
            workflow_id=workflow_id,
            input_data=data['input_data'][:1000],
            output_data=r['output'][:2000],
            status='completed',
        )

    return Response({
        'workflow_id': str(workflow_id),
        'results': results,
        'total_agents': len(results),
    })


@api_view(['GET'])
def list_agent_cards(request):
    """Return A2A-compatible agent cards for all active agents."""
    agents = AgentDefinition.objects.filter(is_active=True)
    cards = []
    for agent in agents:
        cards.append({
            'agent_id': str(agent.id),
            'name': agent.name,
            'type': agent.agent_type,
            'description': agent.description,
            'capabilities': agent.capabilities,
            'model': agent.model_preference,
            'mcp_endpoint': agent.mcp_endpoint,
            'a2a_card': agent.a2a_card,
            'protocol_version': '1.0',
        })
    return Response({'agents': cards, 'protocol': 'A2A', 'version': '1.0'})
