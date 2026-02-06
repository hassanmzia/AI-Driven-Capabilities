from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, PromptProject, PromptCollection, PromptFavorite,
    TestSuite, TestCase, TestRun, TestResult,
    Tutorial, TutorialProgress, Challenge, ChallengeSubmission,
    SharedPrompt, TeamWorkspace,
)


# --- Auth ---

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, default='')
    last_name = serializers.CharField(required=False, default='')


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['avatar_color', 'profile_picture', 'onboarding_completed', 'theme',
                  'phone', 'address', 'bio', 'company', 'job_title']


class UserSerializer(serializers.ModelSerializer):
    theme = serializers.CharField(source='profile.theme', read_only=True, default='dark')
    onboarding_completed = serializers.BooleanField(source='profile.onboarding_completed', read_only=True, default=False)
    avatar_color = serializers.CharField(source='profile.avatar_color', read_only=True, default='#6366f1')
    profile_picture = serializers.CharField(source='profile.profile_picture', read_only=True, default='')
    phone = serializers.CharField(source='profile.phone', read_only=True, default='')
    address = serializers.CharField(source='profile.address', read_only=True, default='')
    bio = serializers.CharField(source='profile.bio', read_only=True, default='')
    company = serializers.CharField(source='profile.company', read_only=True, default='')
    job_title = serializers.CharField(source='profile.job_title', read_only=True, default='')

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'theme', 'onboarding_completed', 'avatar_color', 'profile_picture',
                  'phone', 'address', 'bio', 'company', 'job_title', 'date_joined']


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)


class UpdateUserInfoSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)


# --- Projects & Workspace ---

class PromptProjectSerializer(serializers.ModelSerializer):
    prompt_count = serializers.SerializerMethodField()
    test_suite_count = serializers.SerializerMethodField()

    class Meta:
        model = PromptProject
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_prompt_count(self, obj):
        return 0  # Can be enhanced with execution linking

    def get_test_suite_count(self, obj):
        return obj.test_suites.count()


class PromptCollectionSerializer(serializers.ModelSerializer):
    favorite_count = serializers.SerializerMethodField()

    class Meta:
        model = PromptCollection
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

    def get_favorite_count(self, obj):
        return obj.favorites.count()


class PromptFavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptFavorite
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


# --- Testing ---

class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = '__all__'
        read_only_fields = ['id']


class TestSuiteSerializer(serializers.ModelSerializer):
    test_cases = TestCaseSerializer(many=True, read_only=True)
    run_count = serializers.SerializerMethodField()

    class Meta:
        model = TestSuite
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_run_count(self, obj):
        return obj.test_runs.count()


class TestResultSerializer(serializers.ModelSerializer):
    test_case_name = serializers.CharField(source='test_case.name', read_only=True)

    class Meta:
        model = TestResult
        fields = '__all__'
        read_only_fields = ['id']


class TestRunSerializer(serializers.ModelSerializer):
    results = TestResultSerializer(many=True, read_only=True)
    pass_rate = serializers.SerializerMethodField()

    class Meta:
        model = TestRun
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

    def get_pass_rate(self, obj):
        if obj.total_cases == 0:
            return 0
        return round(obj.passed_cases / obj.total_cases * 100, 1)


# --- Learning ---

class TutorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tutorial
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class TutorialProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorialProgress
        fields = '__all__'
        read_only_fields = ['id']


class ChallengeSerializer(serializers.ModelSerializer):
    submission_count = serializers.SerializerMethodField()
    best_score = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

    def get_submission_count(self, obj):
        return obj.submissions.count()

    def get_best_score(self, obj):
        best = obj.submissions.order_by('-score').first()
        return best.score if best else None


class ChallengeSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeSubmission
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


# --- Community ---

class SharedPromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = SharedPrompt
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'upvotes', 'downloads']


class TeamWorkspaceSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = TeamWorkspace
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()


# --- Request serializers for action endpoints ---

class RunTestSuiteRequestSerializer(serializers.Serializer):
    suite_id = serializers.UUIDField()
    model = serializers.CharField(default='gpt-4o-mini')
    prompt_text = serializers.CharField(required=False)
    system_prompt = serializers.CharField(required=False, default='')


class BatchEvalRequestSerializer(serializers.Serializer):
    prompt_text = serializers.CharField()
    system_prompt = serializers.CharField(required=False, default='')
    inputs = serializers.ListField(child=serializers.CharField(), min_length=1, max_length=50)
    model = serializers.CharField(default='gpt-4o-mini')


class ConsistencyCheckRequestSerializer(serializers.Serializer):
    prompt_text = serializers.CharField()
    system_prompt = serializers.CharField(required=False, default='')
    input_text = serializers.CharField()
    num_runs = serializers.IntegerField(default=5, min_value=2, max_value=10)
    model = serializers.CharField(default='gpt-4o-mini')


class SubmitChallengeRequestSerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    prompt_text = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')


class CostOptimizerRequestSerializer(serializers.Serializer):
    prompt_text = serializers.CharField()
    system_prompt = serializers.CharField(required=False, default='')
    model = serializers.CharField(default='gpt-4o-mini')


class ModelCompareRequestSerializer(serializers.Serializer):
    prompt_text = serializers.CharField()
    system_prompt = serializers.CharField(required=False, default='')
    input_text = serializers.CharField()
    models = serializers.ListField(child=serializers.CharField(), min_length=2, max_length=5)


class SnippetGeneratorRequestSerializer(serializers.Serializer):
    system_prompt = serializers.CharField()
    user_prompt_template = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')
    language = serializers.ChoiceField(choices=['python', 'javascript', 'curl', 'langchain'])


class GlobalSearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField(min_length=2)
    scope = serializers.ChoiceField(
        choices=['all', 'executions', 'templates', 'projects', 'community'],
        default='all'
    )
