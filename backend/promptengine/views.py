import logging
from django.http import FileResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import PromptTemplate, PromptExecution, PromptVersion, PromptChain, SavedOutput
from .serializers import (
    PromptTemplateSerializer, PromptExecutionSerializer,
    PromptVersionSerializer, PromptChainSerializer, SavedOutputSerializer,
    FeedbackAnalysisRequestSerializer, MeetingSummarizerRequestSerializer,
    QuizGeneratorRequestSerializer, SlideScriptRequestSerializer,
    ComplaintResponseRequestSerializer, CustomPromptRequestSerializer,
    RatingSerializer,
)
from . import services

logger = logging.getLogger(__name__)


class PromptTemplateViewSet(viewsets.ModelViewSet):
    queryset = PromptTemplate.objects.all()
    serializer_class = PromptTemplateSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['category', 'difficulty', 'is_active', 'is_builtin']
    search_fields = ['name', 'description', 'tags']
    ordering_fields = ['usage_count', 'avg_rating', 'created_at']


class PromptExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromptExecution.objects.all()
    serializer_class = PromptExecutionSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['category', 'status', 'model_used']
    ordering_fields = ['created_at', 'latency_ms', 'cost_estimate']

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        execution = self.get_object()
        serializer = RatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        execution.rating = serializer.validated_data['rating']
        execution.feedback = serializer.validated_data.get('feedback', '')
        execution.save()
        return Response({'status': 'rated'})


class PromptVersionViewSet(viewsets.ModelViewSet):
    queryset = PromptVersion.objects.all()
    serializer_class = PromptVersionSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['template', 'is_active']


class PromptChainViewSet(viewsets.ModelViewSet):
    queryset = PromptChain.objects.all()
    serializer_class = PromptChainSerializer
    permission_classes = [AllowAny]


class SavedOutputViewSet(viewsets.ModelViewSet):
    queryset = SavedOutput.objects.all()
    serializer_class = SavedOutputSerializer
    permission_classes = [AllowAny]


def _execute_feature(request, category, serializer_class, service_fn, extract_args):
    """Generic helper to execute a feature and store the result."""
    serializer = serializer_class(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    args = extract_args(data)
    result = service_fn(**args)

    # Save execution record
    execution = PromptExecution.objects.create(
        category=category,
        input_data=str(data),
        system_prompt=services.SYSTEM_PROMPTS.get(category, ''),
        user_prompt=str(args),
        output_data=result.get('output', ''),
        status='completed' if 'error' not in result else 'failed',
        model_used=result.get('model', 'gpt-4o-mini'),
        tokens_input=result.get('tokens_input', 0),
        tokens_output=result.get('tokens_output', 0),
        cost_estimate=result.get('cost_estimate', 0),
        latency_ms=result.get('latency_ms', 0),
        error_message=result.get('error', ''),
    )

    # Increment template usage if applicable
    template_id = request.data.get('template_id')
    if template_id:
        try:
            tpl = PromptTemplate.objects.get(id=template_id)
            tpl.usage_count += 1
            tpl.save(update_fields=['usage_count'])
            execution.template = tpl
            execution.save(update_fields=['template'])
        except PromptTemplate.DoesNotExist:
            pass

    return Response({
        'execution_id': str(execution.id),
        'output': result.get('output', ''),
        'error': result.get('error'),
        'tokens_input': result.get('tokens_input', 0),
        'tokens_output': result.get('tokens_output', 0),
        'cost_estimate': float(result.get('cost_estimate', 0)),
        'latency_ms': result.get('latency_ms', 0),
        'model': result.get('model', 'gpt-4o-mini'),
    }, status=status.HTTP_200_OK if 'error' not in result else status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def feedback_analysis(request):
    return _execute_feature(
        request, 'feedback_analysis',
        FeedbackAnalysisRequestSerializer,
        services.analyze_feedback,
        lambda d: {'review_text': d['review_text'], 'model': d['model'], 'temperature': d['temperature']}
    )


@api_view(['POST'])
def meeting_summarizer(request):
    return _execute_feature(
        request, 'meeting_summarizer',
        MeetingSummarizerRequestSerializer,
        services.summarize_meeting,
        lambda d: {'transcript': d['transcript'], 'model': d['model'], 'temperature': d['temperature']}
    )


@api_view(['POST'])
def quiz_generator(request):
    return _execute_feature(
        request, 'quiz_generator',
        QuizGeneratorRequestSerializer,
        services.generate_quiz,
        lambda d: {
            'content': d['content'], 'num_questions': d['num_questions'],
            'difficulty_mix': d['difficulty_mix'], 'model': d['model'], 'temperature': d['temperature']
        }
    )


@api_view(['POST'])
def slide_script_generator(request):
    return _execute_feature(
        request, 'slide_script',
        SlideScriptRequestSerializer,
        services.generate_slide_script,
        lambda d: {
            'topic': d['topic'], 'num_slides': d['num_slides'],
            'style': d['style'], 'model': d['model'], 'temperature': d['temperature']
        }
    )


@api_view(['POST'])
def complaint_response(request):
    return _execute_feature(
        request, 'complaint_response',
        ComplaintResponseRequestSerializer,
        services.generate_complaint_response,
        lambda d: {
            'complaint': d['complaint'], 'company_name': d['company_name'],
            'agent_name': d['agent_name'], 'model': d['model'], 'temperature': d['temperature']
        }
    )


@api_view(['POST'])
def custom_prompt(request):
    return _execute_feature(
        request, 'custom',
        CustomPromptRequestSerializer,
        services.execute_custom_prompt,
        lambda d: {
            'system_prompt': d.get('system_prompt', ''),
            'user_prompt': d['user_prompt'],
            'model': d['model'], 'temperature': d['temperature'],
            'max_tokens': d['max_tokens'],
        }
    )


@api_view(['POST'])
def export_slides_pptx(request):
    """Export a slide script execution to a PowerPoint file."""
    execution_id = request.data.get('execution_id')
    slide_json = request.data.get('slide_json')

    # Get slide JSON from execution record or direct input
    if execution_id:
        try:
            execution = PromptExecution.objects.get(id=execution_id)
            slide_json = execution.output_data
        except PromptExecution.DoesNotExist:
            return Response({'error': 'Execution not found'}, status=status.HTTP_404_NOT_FOUND)

    if not slide_json:
        return Response({'error': 'No slide data provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        buf = services.generate_pptx(slide_json)
        response = FileResponse(buf, content_type='application/vnd.openxmlformats-officedocument.presentationml.presentation')
        response['Content-Disposition'] = 'attachment; filename="presentation.pptx"'
        return response
    except Exception as e:
        logger.error(f"PPTX generation failed: {e}")
        return Response({'error': f'Failed to generate PowerPoint: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'healthy', 'service': 'prompt-engine-backend'})
