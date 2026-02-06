import json
import uuid

from django.contrib.auth.models import User
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    UserProfile, PromptProject, PromptCollection, PromptFavorite,
    TestSuite, TestCase, TestRun, TestResult,
    Tutorial, TutorialProgress, Challenge, ChallengeSubmission,
    SharedPrompt, TeamWorkspace,
)
from .serializers import (
    RegisterSerializer, UserSerializer, UserProfileSerializer,
    ChangePasswordSerializer, UpdateUserInfoSerializer,
    PromptProjectSerializer, PromptCollectionSerializer, PromptFavoriteSerializer,
    TestSuiteSerializer, TestCaseSerializer, TestRunSerializer,
    TutorialSerializer, TutorialProgressSerializer,
    ChallengeSerializer, ChallengeSubmissionSerializer,
    SharedPromptSerializer, TeamWorkspaceSerializer,
    RunTestSuiteRequestSerializer, BatchEvalRequestSerializer,
    ConsistencyCheckRequestSerializer, SubmitChallengeRequestSerializer,
    CostOptimizerRequestSerializer, ModelCompareRequestSerializer,
    SnippetGeneratorRequestSerializer, GlobalSearchRequestSerializer,
)
from . import services


# --- Auth Views ---

@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if User.objects.filter(username=data['username']).exists():
        return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=data['email']).exists():
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
    )
    UserProfile.objects.create(user=user)
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def me(request):
    if not request.user.is_authenticated:
        return Response({'user': None})
    return Response({'user': UserSerializer(request.user).data})


@api_view(['PATCH'])
def update_profile(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(UserSerializer(request.user).data)


@api_view(['PATCH'])
def update_user_info(request):
    """Update user's basic info (name, email)."""
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    serializer = UpdateUserInfoSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user = request.user
    if 'email' in data:
        if User.objects.filter(email=data['email']).exclude(id=user.id).exists():
            return Response({'error': 'Email already in use'}, status=status.HTTP_400_BAD_REQUEST)
        user.email = data['email']
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    user.save()
    return Response(UserSerializer(user).data)


@api_view(['POST'])
def change_password(request):
    """Change the user's password."""
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if not request.user.check_password(data['current_password']):
        return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

    request.user.set_password(data['new_password'])
    request.user.save()

    # Generate new tokens since password changed
    refresh = RefreshToken.for_user(request.user)
    return Response({
        'message': 'Password changed successfully',
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


@api_view(['DELETE'])
def delete_account(request):
    """Permanently delete the user's account and all associated data."""
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    password = request.data.get('password', '')
    if not request.user.check_password(password):
        return Response({'error': 'Password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

    request.user.delete()
    return Response({'message': 'Account deleted successfully'}, status=status.HTTP_200_OK)


# --- CRUD ViewSets ---

class PromptProjectViewSet(viewsets.ModelViewSet):
    queryset = PromptProject.objects.all()
    serializer_class = PromptProjectSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['is_shared']
    search_fields = ['name', 'description']


class PromptCollectionViewSet(viewsets.ModelViewSet):
    queryset = PromptCollection.objects.all()
    serializer_class = PromptCollectionSerializer
    permission_classes = [AllowAny]


class PromptFavoriteViewSet(viewsets.ModelViewSet):
    queryset = PromptFavorite.objects.all()
    serializer_class = PromptFavoriteSerializer
    permission_classes = [AllowAny]


class TestSuiteViewSet(viewsets.ModelViewSet):
    queryset = TestSuite.objects.all()
    serializer_class = TestSuiteSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['project']
    search_fields = ['name', 'description']


class TestCaseViewSet(viewsets.ModelViewSet):
    queryset = TestCase.objects.all()
    serializer_class = TestCaseSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['suite']


class TestRunViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TestRun.objects.all()
    serializer_class = TestRunSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['suite']


class TutorialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tutorial.objects.all()
    serializer_class = TutorialSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['difficulty', 'category']


class ChallengeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['difficulty']


class ChallengeSubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ChallengeSubmission.objects.all()
    serializer_class = ChallengeSubmissionSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['challenge']


class SharedPromptViewSet(viewsets.ModelViewSet):
    queryset = SharedPrompt.objects.filter(is_public=True)
    serializer_class = SharedPromptSerializer
    permission_classes = [AllowAny]
    search_fields = ['title', 'description', 'category']

    def perform_create(self, serializer):
        serializer.save(share_link=uuid.uuid4().hex[:12])

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        prompt = self.get_object()
        prompt.upvotes += 1
        prompt.save(update_fields=['upvotes'])
        return Response({'upvotes': prompt.upvotes})

    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        prompt = self.get_object()
        prompt.downloads += 1
        prompt.save(update_fields=['downloads'])
        return Response(SharedPromptSerializer(prompt).data)


class TeamWorkspaceViewSet(viewsets.ModelViewSet):
    queryset = TeamWorkspace.objects.all()
    serializer_class = TeamWorkspaceSerializer
    permission_classes = [AllowAny]


# --- Action Views ---

@api_view(['POST'])
def run_test_suite_view(request):
    serializer = RunTestSuiteRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        suite = TestSuite.objects.get(id=data['suite_id'])
    except TestSuite.DoesNotExist:
        return Response({'error': 'Test suite not found'}, status=status.HTTP_404_NOT_FOUND)

    run = services.run_test_suite(
        suite,
        model=data.get('model'),
        prompt_text=data.get('prompt_text'),
        system_prompt=data.get('system_prompt'),
    )
    return Response(TestRunSerializer(run).data)


@api_view(['POST'])
def batch_evaluation(request):
    serializer = BatchEvalRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data
    result = services.run_batch_evaluation(d['prompt_text'], d['system_prompt'], d['inputs'], d['model'])
    return Response({
        'output': result['output'],
        'tokens_input': result['tokens_input'],
        'tokens_output': result['tokens_output'],
        'cost_estimate': float(result['cost_estimate']),
        'latency_ms': result['latency_ms'],
        'model': result['model'],
    })


@api_view(['POST'])
def consistency_check(request):
    serializer = ConsistencyCheckRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data
    result = services.run_consistency_check(
        d['prompt_text'], d['system_prompt'], d['input_text'], d['num_runs'], d['model']
    )
    return Response({
        'output': result['output'],
        'tokens_input': result['tokens_input'],
        'tokens_output': result['tokens_output'],
        'cost_estimate': float(result['cost_estimate']),
        'latency_ms': result['latency_ms'],
        'model': result['model'],
    })


@api_view(['POST'])
def submit_challenge(request):
    serializer = SubmitChallengeRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data

    try:
        challenge = Challenge.objects.get(id=d['challenge_id'])
    except Challenge.DoesNotExist:
        return Response({'error': 'Challenge not found'}, status=status.HTTP_404_NOT_FOUND)

    result = services.evaluate_challenge(challenge, d['prompt_text'], d['model'])

    # Parse evaluation score
    score = 0
    feedback = result.get('evaluation', '')
    try:
        parsed = json.loads(services._sanitize_json(feedback))
        score = parsed.get('score', 0)
        feedback = json.dumps(parsed)
    except (json.JSONDecodeError, TypeError):
        pass

    submission = ChallengeSubmission.objects.create(
        challenge=challenge,
        user=request.user if request.user.is_authenticated else None,
        session_id=request.headers.get('X-Session-Id', ''),
        prompt_text=d['prompt_text'],
        output=result.get('output', ''),
        score=score,
        feedback=feedback,
    )

    return Response({
        'submission_id': str(submission.id),
        'output': result.get('output', ''),
        'evaluation': feedback,
        'score': score,
        'tokens_input': result['tokens_input'],
        'cost_estimate': float(result['cost_estimate']),
        'latency_ms': result['latency_ms'],
        'model': result['model'],
    })


@api_view(['POST'])
def cost_optimizer(request):
    serializer = CostOptimizerRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data
    result = services.optimize_cost(d['prompt_text'], d['system_prompt'], d['model'])
    return Response({
        'output': result.get('output', ''),
        'tokens_input': result.get('tokens_input', 0),
        'tokens_output': result.get('tokens_output', 0),
        'cost_estimate': float(result.get('cost_estimate', 0)),
        'latency_ms': result.get('latency_ms', 0),
        'model': result.get('model', d['model']),
    })


@api_view(['POST'])
def model_comparison(request):
    serializer = ModelCompareRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data
    result = services.compare_models(d['prompt_text'], d['system_prompt'], d['input_text'], d['models'])
    return Response({
        'output': result['output'],
        'tokens_input': result['tokens_input'],
        'tokens_output': result['tokens_output'],
        'cost_estimate': float(result['cost_estimate']),
        'latency_ms': result['latency_ms'],
        'model': result['model'],
    })


@api_view(['POST'])
def snippet_generator(request):
    serializer = SnippetGeneratorRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data
    snippet = services.generate_snippet(d['system_prompt'], d['user_prompt_template'], d['model'], d['language'])
    return Response({'snippet': snippet, 'language': d['language']})


@api_view(['GET'])
def technique_library(request):
    return Response({'techniques': services.TECHNIQUE_LIBRARY})


@api_view(['POST'])
def global_search(request):
    serializer = GlobalSearchRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data
    results = services.global_search(d['query'], d['scope'])
    return Response(results)


@api_view(['POST'])
def seed_data(request):
    """Seed tutorials and challenges."""
    tutorials_created = services.seed_tutorials()
    challenges_created = services.seed_challenges()
    return Response({
        'tutorials_created': tutorials_created,
        'challenges_created': challenges_created,
    })


@api_view(['POST'])
def complete_tutorial(request):
    """Mark a tutorial as completed."""
    tutorial_id = request.data.get('tutorial_id')
    session_id = request.data.get('session_id', request.headers.get('X-Session-Id', ''))

    try:
        tutorial = Tutorial.objects.get(id=tutorial_id)
    except Tutorial.DoesNotExist:
        return Response({'error': 'Tutorial not found'}, status=status.HTTP_404_NOT_FOUND)

    progress, created = TutorialProgress.objects.get_or_create(
        tutorial=tutorial,
        session_id=session_id,
        defaults={
            'user': request.user if request.user.is_authenticated else None,
            'completed': True,
            'completed_at': __import__('django.utils.timezone', fromlist=['now']).now(),
        }
    )
    if not created and not progress.completed:
        from django.utils import timezone
        progress.completed = True
        progress.completed_at = timezone.now()
        progress.save()

    return Response({'completed': True})


@api_view(['GET'])
def tutorial_progress(request):
    """Get progress for all tutorials."""
    session_id = request.headers.get('X-Session-Id', '')
    completed_ids = set(
        TutorialProgress.objects.filter(
            session_id=session_id, completed=True
        ).values_list('tutorial_id', flat=True)
    )
    tutorials = Tutorial.objects.all()
    data = []
    for t in tutorials:
        data.append({
            'id': str(t.id),
            'title': t.title,
            'completed': t.id in completed_ids,
        })
    return Response({
        'progress': data,
        'completed_count': len(completed_ids),
        'total_count': tutorials.count(),
    })
