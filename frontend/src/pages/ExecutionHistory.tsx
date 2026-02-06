import React, { useEffect, useState } from 'react';
import { getExecutions, rateExecution } from '../services/api';
import type { PromptExecution } from '../types';
import { FormattedOutput } from '../components/shared/FormattedOutput';

export const ExecutionHistory: React.FC = () => {
  const [executions, setExecutions] = useState<PromptExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedExec, setSelectedExec] = useState<PromptExecution | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filterCategory) params.category = filterCategory;
    getExecutions(params)
      .then((data) => setExecutions(data.results || []))
      .catch(() => setExecutions([]))
      .finally(() => setLoading(false));
  }, [filterCategory]);

  const handleRate = async (id: string, rating: number) => {
    try {
      await rateExecution(id, rating);
      setExecutions((prev) =>
        prev.map((e) => (e.id === id ? { ...e, rating } : e))
      );
    } catch { /* ignore */ }
  };

  const categoryLabels: Record<string, string> = {
    feedback_analysis: 'Feedback',
    meeting_summarizer: 'Meeting',
    quiz_generator: 'Quiz',
    slide_script: 'Slides',
    complaint_response: 'Complaint',
    custom: 'Custom',
  };

  return (
    <div>
      <div className="page-header">
        <h2>Execution History</h2>
        <p>Browse past prompt executions, review outputs, and rate quality</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${!filterCategory ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterCategory('')}>All</button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button key={key} className={`btn btn-sm ${filterCategory === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterCategory(key)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /></div>
      ) : executions.length === 0 ? (
        <div className="empty-state">
          <h3>No executions yet</h3>
          <p>Run some prompts and they will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedExec ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="execution-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Tokens</th>
                  <th>Cost</th>
                  <th>Latency</th>
                  <th>Rating</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((exec) => (
                  <tr key={exec.id} onClick={() => setSelectedExec(exec)} style={{ cursor: 'pointer', background: selectedExec?.id === exec.id ? 'rgba(99,102,241,0.05)' : undefined }}>
                    <td><span className="badge badge-accent">{categoryLabels[exec.category] || exec.category}</span></td>
                    <td style={{ fontSize: '0.75rem' }}>{exec.model_used}</td>
                    <td><span className={`badge ${exec.status === 'completed' ? 'badge-success' : 'badge-error'}`}>{exec.status}</span></td>
                    <td>{exec.tokens_input + exec.tokens_output}</td>
                    <td>${Number(exec.cost_estimate || 0).toFixed(5)}</td>
                    <td>{exec.latency_ms}ms</td>
                    <td>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={(e) => { e.stopPropagation(); handleRate(exec.id, star); }}
                          style={{ cursor: 'pointer', color: star <= (exec.rating || 0) ? 'var(--warning)' : 'var(--text-muted)', fontSize: '0.9rem' }}
                        >
                          *
                        </span>
                      ))}
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(exec.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedExec && (
            <div className="card" style={{ position: 'sticky', top: '2rem', maxHeight: 'calc(100vh - 6rem)', overflowY: 'auto' }}>
              <div className="card-header">
                <div className="card-title">Execution Detail</div>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedExec(null)}>Close</button>
              </div>
              <div className="form-group">
                <label className="form-label">Output</label>
                <div className="output-box">{selectedExec.output_data ? <FormattedOutput text={selectedExec.output_data} /> : 'No output'}</div>
              </div>
              <div className="meta-row">
                <div className="meta-item">ID: <strong style={{ fontSize: '0.7rem' }}>{selectedExec.id}</strong></div>
                <div className="meta-item">Model: <strong>{selectedExec.model_used}</strong></div>
                <div className="meta-item">Tokens: <strong>{selectedExec.tokens_input + selectedExec.tokens_output}</strong></div>
                <div className="meta-item">Cost: <strong>${Number(selectedExec.cost_estimate || 0).toFixed(5)}</strong></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
