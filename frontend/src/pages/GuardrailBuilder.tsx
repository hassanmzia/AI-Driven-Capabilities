import React, { useState } from 'react';
import { executeGuardrailBuilder } from '../services/api';
import { ExecutionResult } from '../types';
import { FormattedOutput } from '../components/shared/FormattedOutput';

export function GuardrailBuilder() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [useCase, setUseCase] = useState('');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [model, setModel] = useState('gpt-4o-mini');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const handleExecute = async () => {
    if (!systemPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await executeGuardrailBuilder({ system_prompt: systemPrompt, use_case: useCase, risk_level: riskLevel, model });
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
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Guardrail Builder</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Design comprehensive safety guardrails for AI systems and prompts</p>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>System Prompt to Protect</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={5}
            placeholder="Enter the system prompt or AI behavior description..."
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Use Case (optional)</label>
          <input
            type="text"
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            placeholder="e.g., Customer chatbot, Medical advisor..."
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontFamily: 'inherit', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Risk Tolerance Level</label>
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontFamily: 'inherit', fontSize: '0.85rem' }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
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

        <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !systemPrompt.trim()}>
          {loading ? 'Building...' : 'Build Guardrails'}
        </button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Analyzing risks and building guardrails...</p>
        </div>
      )}

      {result && !loading && (
        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <span className="card-title" style={{ color: 'var(--text-primary)' }}>Guardrail Design</span>
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

export default GuardrailBuilder;
