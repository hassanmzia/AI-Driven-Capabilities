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
    PromptGraderRequestSerializer, PromptOptimizerRequestSerializer,
    PromptCompareRequestSerializer, SchemaEnforcerRequestSerializer,
    SelfCorrectingRequestSerializer, QualityPipelineRequestSerializer,
    DecompositionRequestSerializer, InjectionTesterRequestSerializer,
    FewShotBuilderRequestSerializer,
    ExpertPanelRequestSerializer, DocumentQARequestSerializer,
    ComplianceCheckerRequestSerializer, ToneTransformerRequestSerializer,
    MisconceptionDetectorRequestSerializer, CoTVisualizerRequestSerializer,
    RAGSimulatorRequestSerializer, ScenarioSimulatorRequestSerializer,
    LocalizerRequestSerializer,
    SelfConsistencyRequestSerializer, TreeOfThoughtsRequestSerializer,
    ReflectionLoopRequestSerializer, ReActAgentRequestSerializer,
    AgentRoleDesignerRequestSerializer, CoordinatorRouterRequestSerializer,
    APEStudioRequestSerializer, PromptEvolutionRequestSerializer,
    MetaPromptRequestSerializer, GuardrailBuilderRequestSerializer,
    SelfVerificationRequestSerializer, ContextPackerRequestSerializer,
    MemoryAwareRequestSerializer,
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


@api_view(['POST'])
def export_meeting_docx(request):
    """Export a meeting summary execution to a Word document."""
    execution_id = request.data.get('execution_id')
    meeting_text = request.data.get('meeting_text')

    if execution_id:
        try:
            execution = PromptExecution.objects.get(id=execution_id)
            meeting_text = execution.output_data
        except PromptExecution.DoesNotExist:
            return Response({'error': 'Execution not found'}, status=status.HTTP_404_NOT_FOUND)

    if not meeting_text:
        return Response({'error': 'No meeting data provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        buf = services.generate_meeting_docx(meeting_text)
        response = FileResponse(buf, content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        response['Content-Disposition'] = 'attachment; filename="meeting_summary.docx"'
        return response
    except Exception as e:
        logger.error(f"Meeting DOCX generation failed: {e}")
        return Response({'error': f'Failed to generate Word document: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def export_quiz_docx(request):
    """Export a quiz execution to a Word document."""
    execution_id = request.data.get('execution_id')
    quiz_json = request.data.get('quiz_json')

    if execution_id:
        try:
            execution = PromptExecution.objects.get(id=execution_id)
            quiz_json = execution.output_data
        except PromptExecution.DoesNotExist:
            return Response({'error': 'Execution not found'}, status=status.HTTP_404_NOT_FOUND)

    if not quiz_json:
        return Response({'error': 'No quiz data provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        buf = services.generate_quiz_docx(quiz_json)
        response = FileResponse(buf, content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        response['Content-Disposition'] = 'attachment; filename="quiz.docx"'
        return response
    except Exception as e:
        logger.error(f"Quiz DOCX generation failed: {e}")
        return Response({'error': f'Failed to generate Word document: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- Advanced Feature Views ---

def _execute_advanced(request, category, serializer_class, service_fn, extract_args):
    """Generic helper for advanced features that may return multi-step outputs."""
    serializer = serializer_class(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    args = extract_args(data)
    result = service_fn(**args)

    execution = PromptExecution.objects.create(
        category=category,
        input_data=str(data),
        system_prompt=services.ADVANCED_PROMPTS.get(category, ''),
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

    resp = {
        'execution_id': str(execution.id),
        'output': result.get('output', ''),
        'error': result.get('error'),
        'tokens_input': result.get('tokens_input', 0),
        'tokens_output': result.get('tokens_output', 0),
        'cost_estimate': float(result.get('cost_estimate', 0)),
        'latency_ms': result.get('latency_ms', 0),
        'model': result.get('model', 'gpt-4o-mini'),
    }
    # Include extra fields for multi-output features
    for key in ('output_a', 'output_b'):
        if key in result:
            resp[key] = result[key]

    return Response(resp, status=status.HTTP_200_OK if 'error' not in result else status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def prompt_grader(request):
    return _execute_advanced(
        request, 'prompt_grader',
        PromptGraderRequestSerializer,
        services.grade_prompt,
        lambda d: {'prompt_text': d['prompt_text'], 'task_type': d['task_type'], 'domain': d['domain'], 'model': d['model']}
    )


@api_view(['POST'])
def prompt_optimizer(request):
    return _execute_advanced(
        request, 'prompt_optimizer',
        PromptOptimizerRequestSerializer,
        services.optimize_prompt,
        lambda d: {'prompt_text': d['prompt_text'], 'grading_output': d['grading_output'], 'model': d['model']}
    )


@api_view(['POST'])
def prompt_compare(request):
    return _execute_advanced(
        request, 'prompt_compare',
        PromptCompareRequestSerializer,
        services.compare_prompt_outputs,
        lambda d: {'prompt_a': d['prompt_a'], 'prompt_b': d['prompt_b'], 'test_input': d['test_input'], 'model': d['model']}
    )


@api_view(['POST'])
def schema_enforcer(request):
    return _execute_advanced(
        request, 'schema_enforcer',
        SchemaEnforcerRequestSerializer,
        services.enforce_schema,
        lambda d: {
            'prompt_text': d['prompt_text'], 'schema_text': d['schema_text'],
            'input_text': d['input_text'], 'max_retries': d['max_retries'], 'model': d['model']
        }
    )


@api_view(['POST'])
def self_correcting(request):
    return _execute_advanced(
        request, 'self_correcting',
        SelfCorrectingRequestSerializer,
        services.execute_self_correcting,
        lambda d: {
            'prompt_text': d['prompt_text'], 'input_text': d['input_text'],
            'criteria': d['criteria'], 'max_rounds': d['max_rounds'],
            'threshold': d['threshold'], 'model': d['model']
        }
    )


@api_view(['POST'])
def quality_pipeline(request):
    return _execute_advanced(
        request, 'quality_pipeline',
        QualityPipelineRequestSerializer,
        services.execute_quality_pipeline,
        lambda d: {'task_prompt': d['task_prompt'], 'input_text': d['input_text'], 'model': d['model']}
    )


@api_view(['POST'])
def decomposition(request):
    return _execute_advanced(
        request, 'decomposition',
        DecompositionRequestSerializer,
        services.execute_decomposition,
        lambda d: {'task_description': d['task_description'], 'model': d['model']}
    )


@api_view(['POST'])
def injection_tester(request):
    return _execute_advanced(
        request, 'injection_tester',
        InjectionTesterRequestSerializer,
        services.test_prompt_injection,
        lambda d: {'system_prompt': d['system_prompt'], 'model': d['model']}
    )


@api_view(['POST'])
def fewshot_builder(request):
    return _execute_advanced(
        request, 'fewshot_builder',
        FewShotBuilderRequestSerializer,
        services.build_fewshot_prompt,
        lambda d: {'task_description': d['task_description'], 'examples_json': d['examples'], 'model': d['model']}
    )


# --- Phase 4: Knowledge Workflow Views ---

@api_view(['POST'])
def expert_panel(request):
    return _execute_advanced(
        request, 'expert_panel',
        ExpertPanelRequestSerializer,
        services.execute_expert_panel,
        lambda d: {'topic': d['topic'], 'personas': d['personas'], 'model': d['model']}
    )


@api_view(['POST'])
def document_qa(request):
    return _execute_advanced(
        request, 'document_qa',
        DocumentQARequestSerializer,
        services.execute_document_qa,
        lambda d: {'question': d['question'], 'documents': d['documents'], 'model': d['model']}
    )


@api_view(['POST'])
def compliance_checker(request):
    return _execute_advanced(
        request, 'compliance_checker',
        ComplianceCheckerRequestSerializer,
        services.execute_compliance_check,
        lambda d: {'policy_text': d['policy_text'], 'document_text': d['document_text'], 'model': d['model']}
    )


# --- Phase 5: Specialized Tool Views ---

@api_view(['POST'])
def tone_transformer(request):
    return _execute_advanced(
        request, 'tone_transformer',
        ToneTransformerRequestSerializer,
        services.execute_tone_transform,
        lambda d: {'text': d['text'], 'target_tone': d['target_tone'], 'model': d['model']}
    )


@api_view(['POST'])
def misconception_detector(request):
    return _execute_advanced(
        request, 'misconception_detector',
        MisconceptionDetectorRequestSerializer,
        services.execute_misconception_detector,
        lambda d: {'topic': d['topic'], 'student_answer': d['student_answer'], 'model': d['model']}
    )


@api_view(['POST'])
def cot_visualizer(request):
    return _execute_advanced(
        request, 'cot_visualizer',
        CoTVisualizerRequestSerializer,
        services.execute_cot_visualizer,
        lambda d: {'question': d['question'], 'model': d['model']}
    )


# --- Phase 6: Extended Feature Views ---

@api_view(['POST'])
def rag_simulator(request):
    return _execute_advanced(
        request, 'rag_simulator',
        RAGSimulatorRequestSerializer,
        services.execute_rag_simulator,
        lambda d: {'query': d['query'], 'knowledge_chunks': d['knowledge_chunks'], 'model': d['model']}
    )


@api_view(['POST'])
def scenario_simulator(request):
    return _execute_advanced(
        request, 'scenario_simulator',
        ScenarioSimulatorRequestSerializer,
        services.execute_scenario_simulator,
        lambda d: {'plan': d['plan'], 'stakeholders': d['stakeholders'], 'model': d['model']}
    )


@api_view(['POST'])
def localizer(request):
    return _execute_advanced(
        request, 'localizer',
        LocalizerRequestSerializer,
        services.execute_localizer,
        lambda d: {
            'prompt_text': d['prompt_text'], 'target_language': d['target_language'],
            'cultural_context': d['cultural_context'], 'model': d['model']
        }
    )


# --- Phase 13: Advanced Reasoning Views ---

@api_view(['POST'])
def self_consistency(request):
    return _execute_advanced(
        request, 'self_consistency',
        SelfConsistencyRequestSerializer,
        services.execute_self_consistency,
        lambda d: {'question': d['question'], 'num_paths': d['num_paths'], 'model': d['model']}
    )


@api_view(['POST'])
def tree_of_thoughts(request):
    return _execute_advanced(
        request, 'tree_of_thoughts',
        TreeOfThoughtsRequestSerializer,
        services.execute_tree_of_thoughts,
        lambda d: {'problem': d['problem'], 'num_branches': d['num_branches'], 'max_depth': d['max_depth'], 'model': d['model']}
    )


@api_view(['POST'])
def reflection_loop(request):
    return _execute_advanced(
        request, 'reflection_loop',
        ReflectionLoopRequestSerializer,
        services.execute_reflection_loop,
        lambda d: {'task': d['task'], 'input_text': d['input_text'], 'num_rounds': d['num_rounds'], 'model': d['model']}
    )


# --- Phase 14: Agent Pattern Views ---

@api_view(['POST'])
def react_agent(request):
    return _execute_advanced(
        request, 'react_agent',
        ReActAgentRequestSerializer,
        services.execute_react_agent,
        lambda d: {'task': d['task'], 'available_tools': d.get('available_tools', []), 'model': d['model']}
    )


@api_view(['POST'])
def agent_role_designer(request):
    return _execute_advanced(
        request, 'agent_role_designer',
        AgentRoleDesignerRequestSerializer,
        services.execute_agent_role_designer,
        lambda d: {'role_description': d['role_description'], 'domain': d['domain'], 'constraints': d['constraints'], 'model': d['model']}
    )


@api_view(['POST'])
def coordinator_router(request):
    return _execute_advanced(
        request, 'coordinator_router',
        CoordinatorRouterRequestSerializer,
        services.execute_coordinator_router,
        lambda d: {'task': d['task'], 'agents': d.get('agents', []), 'model': d['model']}
    )


# --- Phase 15: Auto-Optimization Views ---

@api_view(['POST'])
def ape_studio(request):
    return _execute_advanced(
        request, 'ape_studio',
        APEStudioRequestSerializer,
        services.execute_ape_studio,
        lambda d: {'task_description': d['task_description'], 'examples': d['examples'], 'model': d['model']}
    )


@api_view(['POST'])
def prompt_evolution(request):
    return _execute_advanced(
        request, 'prompt_evolution',
        PromptEvolutionRequestSerializer,
        services.execute_prompt_evolution,
        lambda d: {'initial_prompt': d['initial_prompt'], 'feedback': d['feedback'], 'num_generations': d['num_generations'], 'model': d['model']}
    )


@api_view(['POST'])
def meta_prompt(request):
    return _execute_advanced(
        request, 'meta_prompt',
        MetaPromptRequestSerializer,
        services.execute_meta_prompt,
        lambda d: {'domain': d['domain'], 'task_type': d['task_type'], 'requirements': d['requirements'], 'model': d['model']}
    )


# --- Phase 16: Safety & Verification Views ---

@api_view(['POST'])
def guardrail_builder(request):
    return _execute_advanced(
        request, 'guardrail_builder',
        GuardrailBuilderRequestSerializer,
        services.execute_guardrail_builder,
        lambda d: {'system_prompt': d['system_prompt'], 'use_case': d['use_case'], 'risk_level': d['risk_level'], 'model': d['model']}
    )


@api_view(['POST'])
def self_verification(request):
    return _execute_advanced(
        request, 'self_verification',
        SelfVerificationRequestSerializer,
        services.execute_self_verification,
        lambda d: {'task': d['task'], 'input_text': d['input_text'], 'model': d['model']}
    )


# --- Phase 17: Context & Memory Views ---

@api_view(['POST'])
def context_packer(request):
    return _execute_advanced(
        request, 'context_packer',
        ContextPackerRequestSerializer,
        services.execute_context_packer,
        lambda d: {'content': d['content'], 'token_budget': d['token_budget'], 'model': d['model']}
    )


@api_view(['POST'])
def memory_aware(request):
    return _execute_advanced(
        request, 'memory_aware',
        MemoryAwareRequestSerializer,
        services.execute_memory_aware_prompting,
        lambda d: {'task_description': d['task_description'], 'conversation_type': d['conversation_type'], 'context_requirements': d['context_requirements'], 'model': d['model']}
    )


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'healthy', 'service': 'prompt-engine-backend'})
