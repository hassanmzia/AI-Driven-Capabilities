import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api';
import type { DashboardStats } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const categoryLabels: Record<string, string> = {
    feedback_analysis: 'Feedback Analysis',
    meeting_summarizer: 'Meeting Summarizer',
    quiz_generator: 'Quiz Generator',
    slide_script: 'Slide Scripts',
    complaint_response: 'Complaint Response',
    custom: 'Custom Prompt',
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your prompt engineering platform activity and performance</p>
      </div>

      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats?.total_executions ?? 0}</div>
              <div className="stat-label">Total Executions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.recent_executions_7d ?? 0}</div>
              <div className="stat-label">Last 7 Days</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{((stats?.total_tokens_input ?? 0) + (stats?.total_tokens_output ?? 0)).toLocaleString()}</div>
              <div className="stat-label">Total Tokens</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">${(stats?.total_cost ?? 0).toFixed(4)}</div>
              <div className="stat-label">Total Cost</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.avg_latency_ms ?? 0}ms</div>
              <div className="stat-label">Avg Latency</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.avg_rating ? `${stats.avg_rating}/5` : 'N/A'}</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-title" style={{ marginBottom: '1rem' }}>Usage by Category</div>
              {stats?.category_breakdown?.length ? (
                <div>
                  {stats.category_breakdown.map((cat) => (
                    <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.85rem' }}>{categoryLabels[cat.category] || cat.category}</span>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span><strong>{cat.count}</strong> runs</span>
                        <span>{Math.round(cat.avg_lat)}ms avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><p>No executions yet. Try running a prompt!</p></div>
              )}
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: '1rem' }}>Model Usage</div>
              {stats?.model_usage?.length ? (
                <div>
                  {stats.model_usage.map((m) => (
                    <div key={m.model_used} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.85rem' }}>{m.model_used}</span>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span><strong>{m.count}</strong> runs</span>
                        <span>${(m.total_cost || 0).toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><p>No data available yet</p></div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-title" style={{ marginBottom: '1rem' }}>Platform Capabilities</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[
                { title: 'MCP Protocol', desc: 'Model Context Protocol for tool discovery and execution', badge: 'Active' },
                { title: 'A2A Protocol', desc: 'Agent-to-Agent communication for multi-agent workflows', badge: 'Active' },
                { title: 'Multi-Agent System', desc: 'Router, Generator, and Reviewer agents working in concert', badge: 'Active' },
                { title: '5 Built-in Features', desc: 'Feedback Analysis, Meeting Notes, Quiz Gen, Slides, Complaints', badge: 'Ready' },
                { title: 'Prompt Versioning', desc: 'Track prompt iterations with A/B testing support', badge: 'Ready' },
                { title: 'Real-time WebSocket', desc: 'Live execution updates and notification streaming', badge: 'Active' },
              ].map((cap) => (
                <div key={cap.title} style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cap.title}</span>
                    <span className="badge badge-success">{cap.badge}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
