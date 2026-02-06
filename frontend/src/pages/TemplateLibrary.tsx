import React, { useEffect, useState } from 'react';
import { getTemplates } from '../services/api';
import type { PromptTemplate } from '../types';

export const TemplateLibrary: React.FC = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<PromptTemplate | null>(null);

  useEffect(() => {
    getTemplates()
      .then((data) => setTemplates(data.results || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = templates.filter(
    (t) => !filter || t.category === filter
  );

  const categoryLabels: Record<string, string> = {
    feedback_analysis: 'Feedback Analysis',
    meeting_summarizer: 'Meeting Summarizer',
    quiz_generator: 'Quiz Generator',
    slide_script: 'Slide Scripts',
    complaint_response: 'Complaint Response',
    custom: 'Custom',
  };

  return (
    <div>
      <div className="page-header">
        <h2>Template Library</h2>
        <p>Browse, manage, and use prompt templates across all features</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${!filter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('')}>All</button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button key={key} className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No templates found</h3>
          <p>Templates will appear here after the backend seeds them on first run.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          <div className="template-grid" style={selected ? { gridTemplateColumns: '1fr' } : undefined}>
            {filtered.map((tpl) => (
              <div key={tpl.id} className="template-card" onClick={() => setSelected(tpl)} style={selected?.id === tpl.id ? { borderColor: 'var(--accent)' } : undefined}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-accent">{categoryLabels[tpl.category] || tpl.category}</span>
                  <span className="badge badge-warning">{tpl.difficulty}</span>
                </div>
                <h3>{tpl.name}</h3>
                <p>{tpl.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>{tpl.usage_count} uses</span>
                  <span>{tpl.avg_rating > 0 ? `${tpl.avg_rating}/5` : 'No rating'}</span>
                </div>
                {tpl.tags?.length > 0 && (
                  <div className="tag-list" style={{ marginTop: '0.5rem' }}>
                    {tpl.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {selected && (
            <div className="card" style={{ position: 'sticky', top: '2rem', maxHeight: 'calc(100vh - 6rem)', overflowY: 'auto' }}>
              <div className="card-header">
                <div className="card-title">{selected.name}</div>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{selected.description}</p>

              <div className="form-group">
                <label className="form-label">System Prompt</label>
                <div className="output-box" style={{ maxHeight: '200px', fontSize: '0.78rem' }}>{selected.system_prompt}</div>
              </div>

              <div className="form-group">
                <label className="form-label">User Prompt Template</label>
                <div className="output-box" style={{ maxHeight: '100px', fontSize: '0.78rem' }}>{selected.user_prompt_template}</div>
              </div>

              {selected.example_input && (
                <div className="form-group">
                  <label className="form-label">Example Input</label>
                  <div className="output-box" style={{ maxHeight: '100px', fontSize: '0.78rem' }}>{selected.example_input}</div>
                </div>
              )}

              <div className="meta-row">
                <div className="meta-item">Category: <strong>{categoryLabels[selected.category]}</strong></div>
                <div className="meta-item">Difficulty: <strong>{selected.difficulty}</strong></div>
                <div className="meta-item">Uses: <strong>{selected.usage_count}</strong></div>
                <div className="meta-item">Versions: <strong>{selected.version_count}</strong></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
