import uuid
from django.db import models
from django.contrib.auth.models import User


# --- User & Profile ---

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar_color = models.CharField(max_length=7, default='#6366f1')
    profile_picture = models.TextField(blank=True, default='', help_text="Base64 data URL of profile picture")
    onboarding_completed = models.BooleanField(default=False)
    theme = models.CharField(max_length=10, default='dark')
    phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    bio = models.TextField(blank=True, default='', max_length=500)
    company = models.CharField(max_length=255, blank=True, default='')
    job_title = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.username}"


# --- Phase 8: Projects & Workspace ---

class PromptProject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_shared = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.name


class PromptCollection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class PromptFavorite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    execution = models.ForeignKey(
        'promptengine.PromptExecution', on_delete=models.CASCADE, related_name='favorites'
    )
    collection = models.ForeignKey(
        PromptCollection, on_delete=models.SET_NULL, null=True, blank=True, related_name='favorites'
    )
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


# --- Phase 9: Testing & Evaluation ---

class TestSuite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    prompt_text = models.TextField(help_text="The prompt to test")
    system_prompt = models.TextField(blank=True)
    model = models.CharField(max_length=100, default='gpt-4o-mini')
    project = models.ForeignKey(
        PromptProject, on_delete=models.SET_NULL, null=True, blank=True, related_name='test_suites'
    )
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.name


class TestCase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    suite = models.ForeignKey(TestSuite, on_delete=models.CASCADE, related_name='test_cases')
    name = models.CharField(max_length=255)
    input_text = models.TextField()
    expected_output = models.TextField(blank=True)
    criteria = models.TextField(blank=True, help_text="Evaluation criteria for scoring")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name


class TestRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    suite = models.ForeignKey(TestSuite, on_delete=models.CASCADE, related_name='test_runs')
    prompt_text = models.TextField()
    system_prompt = models.TextField(blank=True)
    model = models.CharField(max_length=100)
    total_cases = models.IntegerField(default=0)
    passed_cases = models.IntegerField(default=0)
    avg_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_tokens = models.IntegerField(default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    total_latency_ms = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class TestResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run = models.ForeignKey(TestRun, on_delete=models.CASCADE, related_name='results')
    test_case = models.ForeignKey(TestCase, on_delete=models.CASCADE)
    actual_output = models.TextField()
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    passed = models.BooleanField(default=False)
    evaluation = models.TextField(blank=True)
    tokens_used = models.IntegerField(default=0)
    latency_ms = models.IntegerField(default=0)


# --- Phase 7: Learning Hub ---

class Tutorial(models.Model):
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    category = models.CharField(max_length=100)
    content = models.TextField(help_text="Markdown lesson content")
    example_prompt = models.TextField(blank=True)
    example_input = models.TextField(blank=True)
    sandbox_enabled = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title


class TutorialProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tutorial = models.ForeignKey(Tutorial, on_delete=models.CASCADE, related_name='progress')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['tutorial', 'session_id']


class Challenge(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('expert', 'Expert'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    criteria = models.TextField(help_text="Evaluation criteria")
    test_input = models.TextField()
    expected_behavior = models.TextField()
    hints = models.JSONField(default=list, blank=True)
    points = models.IntegerField(default=100)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title


class ChallengeSubmission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='submissions')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    prompt_text = models.TextField()
    output = models.TextField()
    score = models.IntegerField(default=0)
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


# --- Phase 12: Sharing & Community ---

class SharedPrompt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    system_prompt = models.TextField()
    user_prompt_template = models.TextField()
    category = models.CharField(max_length=100)
    tags = models.JSONField(default=list, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    author_name = models.CharField(max_length=100, default='Anonymous')
    share_link = models.CharField(max_length=100, unique=True)
    is_public = models.BooleanField(default=True)
    upvotes = models.IntegerField(default=0)
    downloads = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-upvotes', '-created_at']

    def __str__(self):
        return self.title


class TeamWorkspace(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_workspaces')
    members = models.ManyToManyField(User, blank=True, related_name='team_workspaces')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
