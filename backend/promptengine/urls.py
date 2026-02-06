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
    path('export/slides-pptx/', views.export_slides_pptx, name='export-slides-pptx'),
    path('health/', views.health_check, name='health-check'),
]
