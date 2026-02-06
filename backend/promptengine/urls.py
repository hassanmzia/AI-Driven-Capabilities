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
    path('health/', views.health_check, name='health-check'),
]
