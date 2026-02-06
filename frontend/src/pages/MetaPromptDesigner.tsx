import React, { useState } from 'react';
import { executeMetaPrompt } from '../services/api';
import { ExecutionResult } from '../types';
import { FormattedOutput } from '../components/shared/FormattedOutput';

export function MetaPromptDesigner() {
  const [domain, setDomain] = useState('');
  const [taskType, setTaskType] = useState('');
  const [requirements, setRequirements] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const handleExecute = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await executeMetaPrompt({ domain, task_type: taskType, requirements, model });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem', color: 'var(--text-primary)' }}>
      <div className="page-header">
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Meta Prompt Designer</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Design meta-prompts that generate task-specific prompts for any domain
        </p>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Domain</label>
          <input type="text" className="form-input" value={domain} onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter the domain, e.g., Customer Service, Education..."
            style={{ width: '100%', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Task Type (optional)</label>
          <input type="text" className="form-input" value={taskType} onChange={(e) => setTaskType(e.target.value)}
            placeholder="e.g., Classification, Generation, Extraction..."
            style={{ width: '100%', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Requirements (optional)</label>
          <textarea className="form-textarea" value={requirements} onChange={(e) => setRequirements(e.target.value)}
            placeholder="Any specific requirements for generated prompts..." rows={3}
            style={{ width: '100%', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
        </div>
        <div className="form-group" style={{ marginBottom: '1rem', maxWidth: '250px' }}>
          <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Model</label>
          <select className="form-select" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4-turbo">gpt-4-turbo</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !domain.trim()}>
          {loading ? 'Designing...' : 'Design Meta-Prompt'}
        </button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Designing meta-prompt...</p>
        </div>
      )}

      {result && !loading && (
        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <span className="card-title" style={{ color: 'var(--text-primary)' }}>Meta-Prompt Design</span>
          </div>
          <div className="meta-row" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Model</span>
              <span style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{result.model}</span>
            </div>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Tokens</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{(result.tokens_input + result.tokens_output).toLocaleString()}</span>
            </div>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Cost</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>${Number(result.cost_estimate).toFixed(5)}</span>
            </div>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Latency</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{result.latency_ms}ms</span>
            </div>
          </div>
          <FormattedOutput text={result.output} />
        </div>
      )}
    </div>
  );
}

export default MetaPromptDesigner;
