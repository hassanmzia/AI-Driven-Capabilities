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


# --- Phase 4: Knowledge Workflow Serializers ---

class ExpertPanelRequestSerializer(serializers.Serializer):
    topic = serializers.CharField()
    personas = serializers.ListField(child=serializers.CharField(), min_length=2, max_length=6)
    model = serializers.CharField(default='gpt-4o-mini')

class DocumentQARequestSerializer(serializers.Serializer):
    question = serializers.CharField()
    documents = serializers.ListField(child=serializers.DictField(), min_length=1, max_length=5)
    model = serializers.CharField(default='gpt-4o-mini')

class ComplianceCheckerRequestSerializer(serializers.Serializer):
    policy_text = serializers.CharField()
    document_text = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')


# --- Phase 5: Specialized Tool Serializers ---

class ToneTransformerRequestSerializer(serializers.Serializer):
    text = serializers.CharField()
    target_tone = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')

class MisconceptionDetectorRequestSerializer(serializers.Serializer):
    topic = serializers.CharField()
    student_answer = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')

class CoTVisualizerRequestSerializer(serializers.Serializer):
    question = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')


# --- Phase 6: Extended Feature Serializers ---

class RAGSimulatorRequestSerializer(serializers.Serializer):
    query = serializers.CharField()
    knowledge_chunks = serializers.ListField(child=serializers.CharField(), min_length=1, max_length=20)
    model = serializers.CharField(default='gpt-4o-mini')

class ScenarioSimulatorRequestSerializer(serializers.Serializer):
    plan = serializers.CharField()
    stakeholders = serializers.ListField(child=serializers.CharField(), min_length=2, max_length=8)
    model = serializers.CharField(default='gpt-4o-mini')

class LocalizerRequestSerializer(serializers.Serializer):
    prompt_text = serializers.CharField()
    target_language = serializers.CharField()
    cultural_context = serializers.CharField(required=False, default='')
    model = serializers.CharField(default='gpt-4o-mini')


# --- Phase 13: Advanced Reasoning Serializers ---

class SelfConsistencyRequestSerializer(serializers.Serializer):
    question = serializers.CharField()
    num_paths = serializers.IntegerField(default=5, min_value=2, max_value=10)
    model = serializers.CharField(default='gpt-4o-mini')

class TreeOfThoughtsRequestSerializer(serializers.Serializer):
    problem = serializers.CharField()
    num_branches = serializers.IntegerField(default=3, min_value=2, max_value=5)
    max_depth = serializers.IntegerField(default=3, min_value=2, max_value=5)
    model = serializers.CharField(default='gpt-4o-mini')

class ReflectionLoopRequestSerializer(serializers.Serializer):
    task = serializers.CharField()
    input_text = serializers.CharField()
    num_rounds = serializers.IntegerField(default=2, min_value=1, max_value=5)
    model = serializers.CharField(default='gpt-4o-mini')

# --- Phase 14: Agent Pattern Serializers ---

class ReActAgentRequestSerializer(serializers.Serializer):
    task = serializers.CharField()
    available_tools = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    model = serializers.CharField(default='gpt-4o-mini')

class AgentRoleDesignerRequestSerializer(serializers.Serializer):
    role_description = serializers.CharField()
    domain = serializers.CharField(required=False, default='')
    constraints = serializers.CharField(required=False, default='')
    model = serializers.CharField(default='gpt-4o-mini')

class CoordinatorRouterRequestSerializer(serializers.Serializer):
    task = serializers.CharField()
    agents = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    model = serializers.CharField(default='gpt-4o-mini')

# --- Phase 15: Auto-Optimization Serializers ---

class APEStudioRequestSerializer(serializers.Serializer):
    task_description = serializers.CharField()
    examples = serializers.CharField(required=False, default='')
    model = serializers.CharField(default='gpt-4o-mini')

class PromptEvolutionRequestSerializer(serializers.Serializer):
    initial_prompt = serializers.CharField()
    feedback = serializers.CharField(required=False, default='')
    num_generations = serializers.IntegerField(default=4, min_value=2, max_value=8)
    model = serializers.CharField(default='gpt-4o-mini')

class MetaPromptRequestSerializer(serializers.Serializer):
    domain = serializers.CharField()
    task_type = serializers.CharField(required=False, default='')
    requirements = serializers.CharField(required=False, default='')
    model = serializers.CharField(default='gpt-4o-mini')

# --- Phase 16: Safety & Verification Serializers ---

class GuardrailBuilderRequestSerializer(serializers.Serializer):
    system_prompt = serializers.CharField()
    use_case = serializers.CharField(required=False, default='')
    risk_level = serializers.CharField(default='medium')
    model = serializers.CharField(default='gpt-4o-mini')

class SelfVerificationRequestSerializer(serializers.Serializer):
    task = serializers.CharField()
    input_text = serializers.CharField()
    model = serializers.CharField(default='gpt-4o-mini')

# --- Phase 17: Context & Memory Serializers ---

class ContextPackerRequestSerializer(serializers.Serializer):
    content = serializers.CharField()
    token_budget = serializers.IntegerField(default=4000, min_value=100, max_value=128000)
    model = serializers.CharField(default='gpt-4o-mini')

class MemoryAwareRequestSerializer(serializers.Serializer):
    task_description = serializers.CharField()
    conversation_type = serializers.CharField(required=False, default='')
    context_requirements = serializers.CharField(required=False, default='')
    model = serializers.CharField(default='gpt-4o-mini')
