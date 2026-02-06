import React, { useState } from 'react';
import { runBatchEvaluation } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';

interface InputEntry {
  id: number;
  text: string;
}

interface ResultRow {
  index: number;
  input: string;
  output: string;
  tokens: number;
  latency: number;
}

interface ModelOption {
  value: string;
  label: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
];

export function BatchRunner() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [inputs, setInputs] = useState<InputEntry[]>([{ id: 1, text: '' }]);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextId, setNextId] = useState(2);

  const addInput = () => {
    setInputs(prev => [...prev, { id: nextId, text: '' }]);
    setNextId(prev => prev + 1);
  };

  const removeInput = (id: number) => {
    if (inputs.length <= 1) return;
    setInputs(prev => prev.filter(entry => entry.id !== id));
  };

  const updateInput = (id: number, text: string) => {
    setInputs(prev => prev.map(entry => entry.id === id ? { ...entry, text } : entry));
  };

  const handleExecute = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt template.');
      return;
    }
    const validInputs = inputs.filter(i => i.text.trim());
    if (validInputs.length === 0) {
      setError('Please provide at least one non-empty input.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await runBatchEvaluation({
        prompt_text: prompt,
        system_prompt: systemPrompt || undefined,
        inputs: validInputs.map(i => i.text),
        model: selectedModel,
      });

      const output = (response as any).output || '';
      const rows: ResultRow[] = validInputs.map((inp, idx) => ({
        index: idx + 1,
        input: inp.text,
        output: output,
        tokens: (response as any).tokens_input || 0,
        latency: (response as any).latency_ms || 0,
      }));
      setResults(rows);
    } catch (err: any) {
      setError(err.message || 'Batch evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
  const avgLatency = results.length > 0
    ? (results.reduce((sum, r) => sum + r.latency, 0) / results.length).toFixed(0)
    : 0;
  const minLatency = results.length > 0
    ? Math.min(...results.map(r => r.latency))
    : 0;
  const maxLatency = results.length > 0
    ? Math.max(...results.map(r => r.latency))
    : 0;

  return (
    <div>
      <div className="page-header">
        <h1 style={{ color: 'var(--text-primary)' }}>Batch Runner</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Run a prompt against multiple inputs and compare results side by side.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Configuration</h2>
        </div>

        <div className="form-group">
          <label className="form-label">Prompt Template</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Enter your prompt template. Use {{input}} to reference each input..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">System Prompt (optional)</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Optional system-level instructions..."
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Model</label>
          <select
            className="form-select"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
          >
            {MODEL_OPTIONS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Inputs ({inputs.length})</span>
            <button className="btn btn-sm btn-secondary" onClick={addInput}>+ Add Input</button>
          </label>
          {inputs.map((entry, idx) => (
            <div key={entry.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
              <span className="badge" style={{ marginTop: '0.5rem', minWidth: '2rem', textAlign: 'center' }}>
                {idx + 1}
              </span>
              <textarea
                className="form-textarea"
                rows={2}
                style={{ flex: 1 }}
                placeholder={`Input #${idx + 1}...`}
                value={entry.text}
                onChange={e => updateInput(entry.id, e.target.value)}
              />
              <button
                className="btn btn-sm"
                style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}
                onClick={() => removeInput(entry.id)}
                disabled={inputs.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleExecute}
          disabled={loading}
        >
          {loading ? 'Running Batch...' : 'Execute Batch'}
        </button>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Processing {inputs.filter(i => i.text.trim()).length} inputs...
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Results</h2>
            <span className="badge badge-success">{results.length} completed</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--accent)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', width: '3rem' }}>#</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Input</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Output</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', width: '5rem' }}>Tokens</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', width: '5rem' }}>Latency</th>
                </tr>
              </thead>
              <tbody>
                {results.map(row => (
                  <tr key={row.index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{row.index}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', maxWidth: '200px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.input.slice(0, 80)}{row.input.length > 80 ? '...' : ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', maxWidth: '300px' }}>
                      <FormattedOutput text={row.output.slice(0, 120) + (row.output.length > 120 ? '...' : '')} />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>{row.tokens}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>{row.latency}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: '2px solid var(--accent)', padding: '1rem', marginTop: '0.5rem' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Summary Statistics</h3>
            <div className="meta-row">
              <div className="meta-item">
                <span style={{ color: 'var(--text-secondary)' }}>Total Inputs</span>
                <strong style={{ color: 'var(--text-primary)' }}>{results.length}</strong>
              </div>
              <div className="meta-item">
                <span style={{ color: 'var(--text-secondary)' }}>Total Tokens</span>
                <strong style={{ color: 'var(--text-primary)' }}>{totalTokens.toLocaleString()}</strong>
              </div>
              <div className="meta-item">
                <span style={{ color: 'var(--text-secondary)' }}>Avg Latency</span>
                <strong style={{ color: 'var(--text-primary)' }}>{avgLatency}ms</strong>
              </div>
              <div className="meta-item">
                <span style={{ color: 'var(--text-secondary)' }}>Min / Max Latency</span>
                <strong style={{ color: 'var(--text-primary)' }}>{minLatency}ms / {maxLatency}ms</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="empty-state">
          <p style={{ color: 'var(--text-secondary)' }}>
            Configure your prompt and inputs above, then click Execute Batch to see results.
          </p>
        </div>
      )}
    </div>
  );
}

export default BatchRunner;
