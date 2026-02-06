from django.db.models import Count, Avg, Sum, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from promptengine.models import PromptExecution, PromptTemplate


@api_view(['GET'])
def dashboard_stats(request):
    """Main dashboard statistics."""
    now = timezone.now()
    last_30d = now - timedelta(days=30)
    last_7d = now - timedelta(days=7)

    total_executions = PromptExecution.objects.count()
    recent_executions = PromptExecution.objects.filter(created_at__gte=last_7d).count()

    agg = PromptExecution.objects.aggregate(
        total_tokens_in=Sum('tokens_input'),
        total_tokens_out=Sum('tokens_output'),
        total_cost=Sum('cost_estimate'),
        avg_latency=Avg('latency_ms'),
        avg_rating=Avg('rating'),
    )

    category_breakdown = list(
        PromptExecution.objects.values('category')
        .annotate(count=Count('id'), avg_lat=Avg('latency_ms'), avg_rate=Avg('rating'))
        .order_by('-count')
    )

    daily_usage = list(
        PromptExecution.objects.filter(created_at__gte=last_30d)
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'), cost=Sum('cost_estimate'))
        .order_by('date')
    )

    model_usage = list(
        PromptExecution.objects.values('model_used')
        .annotate(count=Count('id'), total_cost=Sum('cost_estimate'))
        .order_by('-count')
    )

    top_templates = list(
        PromptTemplate.objects.filter(is_active=True)
        .order_by('-usage_count')[:10]
        .values('id', 'name', 'category', 'usage_count', 'avg_rating')
    )

    return Response({
        'total_executions': total_executions,
        'recent_executions_7d': recent_executions,
        'total_tokens_input': agg['total_tokens_in'] or 0,
        'total_tokens_output': agg['total_tokens_out'] or 0,
        'total_cost': float(agg['total_cost'] or 0),
        'avg_latency_ms': round(agg['avg_latency'] or 0, 1),
        'avg_rating': round(agg['avg_rating'] or 0, 2),
        'category_breakdown': category_breakdown,
        'daily_usage': daily_usage,
        'model_usage': model_usage,
        'top_templates': top_templates,
    })


@api_view(['GET'])
def cost_analysis(request):
    """Detailed cost analysis endpoint."""
    days = int(request.query_params.get('days', 30))
    since = timezone.now() - timedelta(days=days)

    daily_costs = list(
        PromptExecution.objects.filter(created_at__gte=since)
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(
            cost=Sum('cost_estimate'),
            tokens_in=Sum('tokens_input'),
            tokens_out=Sum('tokens_output'),
            count=Count('id'),
        )
        .order_by('date')
    )

    by_model = list(
        PromptExecution.objects.filter(created_at__gte=since)
        .values('model_used')
        .annotate(cost=Sum('cost_estimate'), count=Count('id'))
        .order_by('-cost')
    )

    by_category = list(
        PromptExecution.objects.filter(created_at__gte=since)
        .values('category')
        .annotate(cost=Sum('cost_estimate'), count=Count('id'))
        .order_by('-cost')
    )

    return Response({
        'period_days': days,
        'daily_costs': daily_costs,
        'by_model': by_model,
        'by_category': by_category,
    })


@api_view(['GET'])
def performance_metrics(request):
    """Performance metrics for prompt executions."""
    days = int(request.query_params.get('days', 30))
    since = timezone.now() - timedelta(days=days)

    latency_by_category = list(
        PromptExecution.objects.filter(created_at__gte=since)
        .values('category')
        .annotate(
            avg_latency=Avg('latency_ms'),
            p50_count=Count('id'),
        )
        .order_by('category')
    )

    success_rate = PromptExecution.objects.filter(created_at__gte=since).aggregate(
        total=Count('id'),
        completed=Count('id', filter=F('status') == 'completed') if False else Count('id'),
    )

    rating_dist = list(
        PromptExecution.objects.filter(rating__isnull=False, created_at__gte=since)
        .values('rating')
        .annotate(count=Count('id'))
        .order_by('rating')
    )

    return Response({
        'period_days': days,
        'latency_by_category': latency_by_category,
        'success_rate': success_rate,
        'rating_distribution': rating_dist,
    })
