import React, { useState } from 'react';
import { executeMemoryAware } from '../services/api';
import { ExecutionResult } from '../types';
import { FormattedOutput } from '../components/shared/FormattedOutput';

export function MemoryAwarePrompting() {
  const [taskDescription, setTaskDescription] = useState('');
  const [conversationType, setConversationType] = useState('');
  const [contextRequirements, setContextRequirements] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const handleExecute = async () => {
    if (!taskDescription.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await executeMemoryAware({ task_description: taskDescription, conversation_type: conversationType, context_requirements: contextRequirements, model });
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
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Memory-Aware Prompting</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Design memory-aware prompt strategies for multi-turn conversations</p>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Task / Application Description</label>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            rows={4}
            placeholder="Describe the conversational AI application..."
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Conversation Type (optional)</label>
          <input
            type="text"
            value={conversationType}
            onChange={(e) => setConversationType(e.target.value)}
            placeholder="e.g., Support chat, Tutoring session, Sales..."
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontFamily: 'inherit', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Context Requirements (optional)</label>
          <textarea
            value={contextRequirements}
            onChange={(e) => setContextRequirements(e.target.value)}
            rows={3}
            placeholder="Any specific context management needs..."
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontFamily: 'inherit', fontSize: '0.85rem' }}
          >
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4-turbo">gpt-4-turbo</option>
            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !taskDescription.trim()}>
          {loading ? 'Designing...' : 'Design Memory Strategy'}
        </button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Designing memory-aware prompt strategy...</p>
        </div>
      )}

      {result && !loading && (
        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <span className="card-title" style={{ color: 'var(--text-primary)' }}>Memory Strategy Design</span>
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

export default MemoryAwarePrompting;
