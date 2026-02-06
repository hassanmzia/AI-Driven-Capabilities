from django.contrib import admin
from .models import (
    UserProfile, PromptProject, PromptCollection, PromptFavorite,
    TestSuite, TestCase, TestRun, TestResult,
    Tutorial, TutorialProgress, Challenge, ChallengeSubmission,
    SharedPrompt, TeamWorkspace,
)

admin.site.register(UserProfile)
admin.site.register(PromptProject)
admin.site.register(PromptCollection)
admin.site.register(PromptFavorite)
admin.site.register(TestSuite)
admin.site.register(TestCase)
admin.site.register(TestRun)
admin.site.register(TestResult)
admin.site.register(Tutorial)
admin.site.register(TutorialProgress)
admin.site.register(Challenge)
admin.site.register(ChallengeSubmission)
admin.site.register(SharedPrompt)
admin.site.register(TeamWorkspace)
