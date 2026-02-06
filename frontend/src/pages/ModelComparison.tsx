import React, { useState, useEffect } from 'react';
import { runModelComparison } from '../services/api';
import type { ExecutionResult } from '../types';

interface ModelResult {
  model: string;
  output: string;
  tokens_input: number;
  tokens_output: number;
  cost_estimate: number;
  latency_ms: number;
  error?: string;
}

interface ComparisonResponse {
  model_results: ModelResult[];
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4', label: 'GPT-4' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
];

function parseComparisonOutput(raw: string): ComparisonResponse | null {
  try {
    const trimmed = raw.trim();
    let parsed: any = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      const codeBlock = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlock) {
        parsed = JSON.parse(codeBlock[1].trim());
      } else {
        const first = trimmed.search(/[{[]/);
        if (first >= 0) {
          const opener = trimmed[first];
          const closer = opener === '{' ? '}' : ']';
          const last = trimmed.lastIndexOf(closer);
          if (last > first) parsed = JSON.parse(trimmed.slice(first, last + 1));
        }
      }
    }
    if (parsed && parsed.model_results && Array.isArray(parsed.model_results)) {
      return parsed as ComparisonResponse;
    }
    return null;
  } catch {
    return null;
  }
}

function findCheapest(results: ModelResult[]): string | null {
  if (results.length === 0) return null;
  let min = results[0];
  for (const r of results) {
    if (r.cost_estimate < min.cost_estimate) min = r;
  }
  return min.model;
}

function findFastest(results: ModelResult[]): string | null {
  if (results.length === 0) return null;
  let min = results[0];
  for (const r of results) {
    if (r.latency_ms < min.latency_ms) min = r;
  }
  return min.model;
}

export const ModelComparison: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4o-mini', 'gpt-4o']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResult, setRawResult] = useState<ExecutionResult | null>(null);
  const [modelResults, setModelResults] = useState<ModelResult[]>([]);

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
    );
  };

  const canRun = prompt.trim() && inputText.trim() && selectedModels.length >= 2 && !loading;

  const handleCompare = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setRawResult(null);
    setModelResults([]);
    try {
      const res = await runModelComparison({
        prompt_text: prompt,
        system_prompt: systemPrompt || undefined,
        input_text: inputText,
        models: selectedModels,
      });
      setRawResult(res);
      const parsed = parseComparisonOutput(res.output);
      if (parsed) {
        setModelResults(parsed.model_results);
      } else {
        setError('Could not parse comparison results from model output.');
      }
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Model comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const cheapest = findCheapest(modelResults);
  const fastest = findFastest(modelResults);

  return (
    <div>
      <div className="page-header">
        <h2>Model Comparison</h2>
        <p>Compare outputs from multiple models side by side to evaluate quality, cost, and speed</p>
      </div>

      {/* Configuration */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Configuration</div>
        </div>

        <div className="form-group">
          <label className="form-label">Prompt</label>
          <textarea
            className="form-textarea"
            placeholder="Enter your prompt template..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ minHeight: '100px' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">System Prompt (optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Enter an optional system prompt..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            style={{ minHeight: '70px' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Input</label>
          <textarea
            className="form-textarea"
            placeholder="Enter the input text to test against all selected models..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ minHeight: '80px' }}
          />
        </div>

        {/* Model Checkboxes */}
        <div className="form-group">
          <label className="form-label">Select Models (at least 2)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
            {AVAILABLE_MODELS.map((m) => (
              <label
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: selectedModels.includes(m.id)
                    ? '1px solid var(--accent)'
                    : '1px solid var(--border, rgba(255,255,255,0.1))',
                  background: selectedModels.includes(m.id)
                    ? 'rgba(99,102,241,0.1)'
                    : 'transparent',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedModels.includes(m.id)}
                  onChange={() => toggleModel(m.id)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleCompare} disabled={!canRun}>
          {loading ? (
            <>
              <span className="loading-spinner" /> Comparing Models...
            </>
          ) : (
            'Compare'
          )}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Running prompt across {selectedModels.length} models...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Results Cards */}
      {modelResults.length > 0 && !loading && (
        <>
          <div className="page-header" style={{ marginTop: '0.5rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>Results</h2>
            <p>{modelResults.length} models compared</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(modelResults.length, 3)}, 1fr)`,
              gap: '1rem',
            }}
          >
            {modelResults.map((mr) => {
              const isCheapest = mr.model === cheapest;
              const isFastest = mr.model === fastest;
              return (
                <div className="card" key={mr.model} style={{ position: 'relative' }}>
                  <div className="card-header">
                    <div className="card-title" style={{ fontSize: '0.95rem' }}>
                      {AVAILABLE_MODELS.find((m) => m.id === mr.model)?.label || mr.model}
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {isCheapest && <span className="badge badge-success">Cheapest</span>}
                    {isFastest && <span className="badge badge-accent">Fastest</span>}
                    {mr.error && <span className="badge badge-error">Error</span>}
                  </div>

                  {/* Output */}
                  {mr.error ? (
                    <div className="error-box" style={{ fontSize: '0.82rem' }}>{mr.error}</div>
                  ) : (
                    <div className="output-box" style={{ minHeight: '120px', maxHeight: '280px', overflow: 'auto' }}>
                      {mr.output || 'No output returned'}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="meta-row" style={{ flexDirection: 'column', gap: '0.3rem', marginTop: '0.75rem' }}>
                    <div className="meta-item">
                      Tokens:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {mr.tokens_input + mr.tokens_output}
                      </strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                        ({mr.tokens_input} in / {mr.tokens_output} out)
                      </span>
                    </div>
                    <div className="meta-item">
                      Cost:{' '}
                      <strong
                        style={{
                          color: isCheapest ? 'var(--success, #22c55e)' : 'var(--text-primary)',
                        }}
                      >
                        ${Number(mr.cost_estimate).toFixed(5)}
                      </strong>
                    </div>
                    <div className="meta-item">
                      Latency:{' '}
                      <strong
                        style={{
                          color: isFastest ? 'var(--accent)' : 'var(--text-primary)',
                        }}
                      >
                        {mr.latency_ms}ms
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Meta */}
          {rawResult && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header">
                <div className="card-title">Comparison Summary</div>
              </div>
              <div className="meta-row">
                <div className="meta-item">
                  Judge Model: <strong>{rawResult.model}</strong>
                </div>
                <div className="meta-item">
                  Total Tokens: <strong>{rawResult.tokens_input + rawResult.tokens_output}</strong>
                </div>
                <div className="meta-item">
                  Total Cost: <strong>${Number(rawResult.cost_estimate).toFixed(5)}</strong>
                </div>
                <div className="meta-item">
                  Latency: <strong>{rawResult.latency_ms}ms</strong>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && modelResults.length === 0 && !rawResult && (
        <div className="card">
          <div className="empty-state">
            <p style={{ color: 'var(--text-secondary)' }}>
              Select at least two models, enter a prompt and input, then click Compare to see side-by-side results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
