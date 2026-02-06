from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'projects', views.PromptProjectViewSet)
router.register(r'collections', views.PromptCollectionViewSet)
router.register(r'favorites', views.PromptFavoriteViewSet)
router.register(r'test-suites', views.TestSuiteViewSet)
router.register(r'test-cases', views.TestCaseViewSet)
router.register(r'test-runs', views.TestRunViewSet)
router.register(r'tutorials', views.TutorialViewSet)
router.register(r'challenges', views.ChallengeViewSet)
router.register(r'challenge-submissions', views.ChallengeSubmissionViewSet)
router.register(r'community', views.SharedPromptViewSet)
router.register(r'teams', views.TeamWorkspaceViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Auth
    path('auth/register/', views.register, name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', views.me, name='me'),
    path('auth/profile/', views.update_profile, name='update-profile'),
    path('auth/user-info/', views.update_user_info, name='update-user-info'),
    path('auth/change-password/', views.change_password, name='change-password'),
    path('auth/delete-account/', views.delete_account, name='delete-account'),
    # Actions
    path('run-test-suite/', views.run_test_suite_view, name='run-test-suite'),
    path('batch-evaluation/', views.batch_evaluation, name='batch-evaluation'),
    path('consistency-check/', views.consistency_check, name='consistency-check'),
    path('submit-challenge/', views.submit_challenge, name='submit-challenge'),
    path('cost-optimizer/', views.cost_optimizer, name='cost-optimizer'),
    path('model-comparison/', views.model_comparison, name='model-comparison'),
    path('snippet-generator/', views.snippet_generator, name='snippet-generator'),
    path('technique-library/', views.technique_library, name='technique-library'),
    path('search/', views.global_search, name='global-search'),
    path('seed-data/', views.seed_data, name='seed-data'),
    path('complete-tutorial/', views.complete_tutorial, name='complete-tutorial'),
    path('tutorial-progress/', views.tutorial_progress, name='tutorial-progress'),
]
