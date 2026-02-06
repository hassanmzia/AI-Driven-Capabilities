from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'templates', views.PromptTemplateViewSet)
router.register(r'executions', views.PromptExecutionViewSet)
router.register(r'versions', views.PromptVersionViewSet)
router.register(r'chains', views.PromptChainViewSet)
router.register(r'saved', views.SavedOutputViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Feature endpoints
    path('execute/feedback-analysis/', views.feedback_analysis, name='feedback-analysis'),
    path('execute/meeting-summarizer/', views.meeting_summarizer, name='meeting-summarizer'),
    path('execute/quiz-generator/', views.quiz_generator, name='quiz-generator'),
    path('execute/slide-script/', views.slide_script_generator, name='slide-script'),
    path('execute/complaint-response/', views.complaint_response, name='complaint-response'),
    path('execute/custom/', views.custom_prompt, name='custom-prompt'),
    # Export endpoints
    path('export/slides-pptx/', views.export_slides_pptx, name='export-slides-pptx'),
    path('export/meeting-docx/', views.export_meeting_docx, name='export-meeting-docx'),
    path('export/quiz-docx/', views.export_quiz_docx, name='export-quiz-docx'),
    # Advanced prompt engineering endpoints
    path('execute/prompt-grader/', views.prompt_grader, name='prompt-grader'),
    path('execute/prompt-optimizer/', views.prompt_optimizer, name='prompt-optimizer'),
    path('execute/prompt-compare/', views.prompt_compare, name='prompt-compare'),
    path('execute/schema-enforcer/', views.schema_enforcer, name='schema-enforcer'),
    path('execute/self-correcting/', views.self_correcting, name='self-correcting'),
    path('execute/quality-pipeline/', views.quality_pipeline, name='quality-pipeline'),
    path('execute/decomposition/', views.decomposition, name='decomposition'),
    path('execute/injection-tester/', views.injection_tester, name='injection-tester'),
    path('execute/fewshot-builder/', views.fewshot_builder, name='fewshot-builder'),
    # Phase 4: Knowledge Workflows
    path('execute/expert-panel/', views.expert_panel, name='expert-panel'),
    path('execute/document-qa/', views.document_qa, name='document-qa'),
    path('execute/compliance-checker/', views.compliance_checker, name='compliance-checker'),
    # Phase 5: Specialized Tools
    path('execute/tone-transformer/', views.tone_transformer, name='tone-transformer'),
    path('execute/misconception-detector/', views.misconception_detector, name='misconception-detector'),
    path('execute/cot-visualizer/', views.cot_visualizer, name='cot-visualizer'),
    # Phase 6: Extended Features
    path('execute/rag-simulator/', views.rag_simulator, name='rag-simulator'),
    path('execute/scenario-simulator/', views.scenario_simulator, name='scenario-simulator'),
    path('execute/localizer/', views.localizer, name='localizer'),
    # Phase 13: Advanced Reasoning
    path('execute/self-consistency/', views.self_consistency, name='self-consistency'),
    path('execute/tree-of-thoughts/', views.tree_of_thoughts, name='tree-of-thoughts'),
    path('execute/reflection-loop/', views.reflection_loop, name='reflection-loop'),
    # Phase 14: Agent Patterns
    path('execute/react-agent/', views.react_agent, name='react-agent'),
    path('execute/agent-role-designer/', views.agent_role_designer, name='agent-role-designer'),
    path('execute/coordinator-router/', views.coordinator_router, name='coordinator-router'),
    # Phase 15: Auto-Optimization
    path('execute/ape-studio/', views.ape_studio, name='ape-studio'),
    path('execute/prompt-evolution/', views.prompt_evolution, name='prompt-evolution'),
    path('execute/meta-prompt/', views.meta_prompt, name='meta-prompt'),
    # Phase 16: Safety & Verification
    path('execute/guardrail-builder/', views.guardrail_builder, name='guardrail-builder'),
    path('execute/self-verification/', views.self_verification, name='self-verification'),
    # Phase 17: Context & Memory
    path('execute/context-packer/', views.context_packer, name='context-packer'),
    path('execute/memory-aware/', views.memory_aware, name='memory-aware'),
    path('health/', views.health_check, name='health-check'),
]
