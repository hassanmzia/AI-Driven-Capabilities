import uuid
from django.db import models
from django.contrib.auth.models import User


class PromptTemplate(models.Model):
    """Reusable prompt templates for various use cases."""
    CATEGORY_CHOICES = [
        ('feedback_analysis', 'Customer Feedback Analysis'),
        ('meeting_summarizer', 'Meeting Notes Summarizer'),
        ('quiz_generator', 'Quiz Generator'),
        ('slide_script', 'Slide Script Generator'),
        ('complaint_response', 'Complaint Response Generator'),
        ('custom', 'Custom Template'),
    ]
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    system_prompt = models.TextField(help_text="System-level instruction for the AI")
    user_prompt_template = models.TextField(help_text="User prompt template with {placeholders}")
    example_input = models.TextField(blank=True, help_text="Example input to demonstrate usage")
    example_output = models.TextField(blank=True, help_text="Expected example output")
    parameters = models.JSONField(default=dict, blank=True, help_text="Template parameters schema")
    tags = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    is_builtin = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    usage_count = models.IntegerField(default=0)
    avg_rating = models.FloatField(default=0.0)

    class Meta:
        ordering = ['-usage_count', '-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class PromptExecution(models.Model):
    """Record of each prompt execution for analytics and history."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(PromptTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='executions')
    category = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='executions')
    input_data = models.TextField()
    system_prompt = models.TextField(blank=True)
    user_prompt = models.TextField()
    output_data = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    model_used = models.CharField(max_length=100, default='gpt-4o-mini')
    tokens_input = models.IntegerField(default=0)
    tokens_output = models.IntegerField(default=0)
    cost_estimate = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    latency_ms = models.IntegerField(default=0)
    rating = models.IntegerField(null=True, blank=True, help_text="1-5 star rating")
    feedback = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.category} - {self.status} ({self.created_at})"


class PromptVersion(models.Model):
    """Version history for prompt templates enabling A/B testing."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(PromptTemplate, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    system_prompt = models.TextField()
    user_prompt_template = models.TextField()
    change_description = models.TextField(blank=True)
    is_active = models.BooleanField(default=False)
    ab_test_weight = models.FloatField(default=0.0, help_text="Weight for A/B testing (0-1)")
    performance_score = models.FloatField(default=0.0)
    execution_count = models.IntegerField(default=0)
    avg_rating = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['template', '-version_number']
        unique_together = ['template', 'version_number']

    def __str__(self):
        return f"{self.template.name} v{self.version_number}"


class PromptChain(models.Model):
    """Multi-step prompt chains for complex workflows."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    steps = models.JSONField(default=list, help_text="Ordered list of prompt steps")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class SavedOutput(models.Model):
    """User-saved outputs for reference and sharing."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    execution = models.ForeignKey(PromptExecution, on_delete=models.CASCADE, related_name='saved_outputs')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_outputs')
    title = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    is_favorite = models.BooleanField(default=False)
    shared = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
