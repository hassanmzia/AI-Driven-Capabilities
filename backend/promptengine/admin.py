from django.contrib import admin
from .models import PromptTemplate, PromptExecution, PromptVersion, PromptChain, SavedOutput


@admin.register(PromptTemplate)
class PromptTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'difficulty', 'usage_count', 'avg_rating', 'is_active', 'is_builtin']
    list_filter = ['category', 'difficulty', 'is_active', 'is_builtin']
    search_fields = ['name', 'description']


@admin.register(PromptExecution)
class PromptExecutionAdmin(admin.ModelAdmin):
    list_display = ['id', 'category', 'status', 'model_used', 'tokens_input', 'tokens_output', 'cost_estimate', 'latency_ms', 'rating', 'created_at']
    list_filter = ['category', 'status', 'model_used']
    readonly_fields = ['id', 'created_at']


@admin.register(PromptVersion)
class PromptVersionAdmin(admin.ModelAdmin):
    list_display = ['template', 'version_number', 'is_active', 'ab_test_weight', 'execution_count', 'avg_rating']
    list_filter = ['is_active']


@admin.register(PromptChain)
class PromptChainAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']


@admin.register(SavedOutput)
class SavedOutputAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'is_favorite', 'shared', 'created_at']
