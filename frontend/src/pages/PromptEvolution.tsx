import React, { useState } from 'react';
import { executePromptEvolution } from '../services/api';
import { ExecutionResult } from '../types';
import { FormattedOutput } from '../components/shared/FormattedOutput';

export function PromptEvolution() {
  const [initialPrompt, setInitialPrompt] = useState('');
  const [feedback, setFeedback] = useState('');
  const [numGenerations, setNumGenerations] = useState(4);
  const [model, setModel] = useState('gpt-4o-mini');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const handleExecute = async () => {
    if (!initialPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await executePromptEvolution({ initial_prompt: initialPrompt, feedback, num_generations: numGenerations, model });
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
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Prompt Evolution Lab</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Evolve prompts through multiple generations using mutation and fitness evaluation
        </p>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Initial Prompt</label>
          <textarea className="form-textarea" value={initialPrompt} onChange={(e) => setInitialPrompt(e.target.value)}
            placeholder="Enter the initial prompt to evolve..." rows={4}
            style={{ width: '100%', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Performance Feedback (optional)</label>
          <textarea className="form-textarea" value={feedback} onChange={(e) => setFeedback(e.target.value)}
            placeholder="Performance feedback on the initial prompt..." rows={3}
            style={{ width: '100%', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
        </div>
        <div className="form-group" style={{ marginBottom: '1rem', maxWidth: '250px' }}>
          <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Number of Generations</label>
          <input type="number" className="form-input" value={numGenerations} onChange={(e) => setNumGenerations(Math.min(8, Math.max(2, parseInt(e.target.value) || 2)))}
            min={2} max={8}
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
        <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !initialPrompt.trim()}>
          {loading ? 'Evolving...' : 'Evolve Prompt'}
        </button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Running evolutionary generations...</p>
        </div>
      )}

      {result && !loading && (
        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <span className="card-title" style={{ color: 'var(--text-primary)' }}>Evolution Results</span>
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

export default PromptEvolution;
