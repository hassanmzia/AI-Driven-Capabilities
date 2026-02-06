from rest_framework import serializers
from .models import PromptTemplate, PromptExecution, PromptVersion, PromptChain, SavedOutput


class PromptTemplateSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    version_count = serializers.SerializerMethodField()

    class Meta:
        model = PromptTemplate
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'usage_count', 'avg_rating']

    def get_version_count(self, obj):
        return obj.versions.count()


class PromptExecutionSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True, default='')

    class Meta:
        model = PromptExecution
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'tokens_input', 'tokens_output', 'cost_estimate', 'latency_ms']


class PromptVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptVersion
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'execution_count', 'avg_rating', 'performance_score']


class PromptChainSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptChain
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SavedOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedOutput
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


# --- Feature-specific request serializers ---

class FeedbackAnalysisRequestSerializer(serializers.Serializer):
    review_text = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')
    temperature = serializers.FloatField(default=0.0, min_value=0, max_value=2)

class MeetingSummarizerRequestSerializer(serializers.Serializer):
    transcript = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')
    temperature = serializers.FloatField(default=0.0, min_value=0, max_value=2)

class QuizGeneratorRequestSerializer(serializers.Serializer):
    content = serializers.CharField()
    num_questions = serializers.IntegerField(default=5, min_value=1, max_value=20)
    difficulty_mix = serializers.CharField(default='2 easy, 2 intermediate, 1 hard')
    model = serializers.CharField(default='gpt-4o-mini')
    temperature = serializers.FloatField(default=0.0, min_value=0, max_value=2)

class SlideScriptRequestSerializer(serializers.Serializer):
    topic = serializers.CharField()
    num_slides = serializers.IntegerField(default=3, min_value=1, max_value=20)
    style = serializers.CharField(default='professional')
    model = serializers.CharField(default='gpt-4o-mini')
    temperature = serializers.FloatField(default=0.7, min_value=0, max_value=2)

class ComplaintResponseRequestSerializer(serializers.Serializer):
    complaint = serializers.CharField()
    company_name = serializers.CharField(default='Our Company')
    agent_name = serializers.CharField(default='Support Agent')
    model = serializers.CharField(default='gpt-4o-mini')
    temperature = serializers.FloatField(default=0.3, min_value=0, max_value=2)

class CustomPromptRequestSerializer(serializers.Serializer):
    system_prompt = serializers.CharField(required=False, default='')
    user_prompt = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')
    temperature = serializers.FloatField(default=0.7, min_value=0, max_value=2)
    max_tokens = serializers.IntegerField(default=1024, min_value=1, max_value=4096)

class RatingSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    feedback = serializers.CharField(required=False, default='')


# --- Advanced Feature Request Serializers ---

class PromptGraderRequestSerializer(serializers.Serializer):
    prompt_text = serializers.CharField()
    task_type = serializers.CharField(required=False, default='')
    domain = serializers.CharField(required=False, default='')
    model = serializers.CharField(default='gpt-4o-mini')

class PromptOptimizerRequestSerializer(serializers.Serializer):
    prompt_text = serializers.CharField()
    grading_output = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')

class PromptCompareRequestSerializer(serializers.Serializer):
    prompt_a = serializers.CharField()
    prompt_b = serializers.CharField()
    test_input = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')

class SchemaEnforcerRequestSerializer(serializers.Serializer):
    prompt_text = serializers.CharField()
    schema_text = serializers.CharField()
    input_text = serializers.CharField()
    max_retries = serializers.IntegerField(default=3, min_value=1, max_value=5)
    model = serializers.CharField(default='gpt-4o-mini')

class SelfCorrectingRequestSerializer(serializers.Serializer):
    prompt_text = serializers.CharField()
    input_text = serializers.CharField()
    criteria = serializers.CharField(required=False, default='')
    max_rounds = serializers.IntegerField(default=3, min_value=1, max_value=5)
    threshold = serializers.IntegerField(default=7, min_value=1, max_value=10)
    model = serializers.CharField(default='gpt-4o-mini')

class QualityPipelineRequestSerializer(serializers.Serializer):
    task_prompt = serializers.CharField()
    input_text = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')

class DecompositionRequestSerializer(serializers.Serializer):
    task_description = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')

class InjectionTesterRequestSerializer(serializers.Serializer):
    system_prompt = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')

class FewShotBuilderRequestSerializer(serializers.Serializer):
    task_description = serializers.CharField()
    examples = serializers.CharField(help_text="JSON string of input/output pairs")
    model = serializers.CharField(default='gpt-4o-mini')
