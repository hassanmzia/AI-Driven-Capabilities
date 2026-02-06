import React, { useState } from 'react';
import { executeDecomposition } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

const EXAMPLE_TASK =
  'Write a comprehensive market analysis report for a new AI-powered fitness app. Cover target demographics, competitor landscape, pricing strategy, go-to-market plan, and risk assessment.';

interface DecompositionOutput {
  final_output: string;
  stages: Array<{ name: string; output: string }>;
  sub_task_count: number;
}

function parseDecomposition(output: string): DecompositionOutput | null {
  try {
    const parsed = JSON.parse(output);
    if (parsed && typeof parsed.sub_task_count === 'number' && Array.isArray(parsed.stages)) {
      return parsed as DecompositionOutput;
    }
    return null;
  } catch {
    // Try extracting JSON from markdown code fences
    const match = output.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (parsed && typeof parsed.sub_task_count === 'number' && Array.isArray(parsed.stages)) {
          return parsed as DecompositionOutput;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const DecompositionWorkflow: React.FC = () => {
  const [taskDescription, setTaskDescription] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!taskDescription.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executeDecomposition({ task_description: taskDescription, model });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Decomposition failed');
    } finally {
      setLoading(false);
    }
  };

  const decomposition = result ? parseDecomposition(result.output) : null;

  return (
    <div>
      <div className="page-header">
        <h2>Decomposition Workflow</h2>
        <p>Break complex tasks into sub-tasks, execute each step, and integrate results</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Column - Input */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Input</div>
            </div>

            <div className="form-group">
              <label className="form-label">Complex Task Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe a complex task that can be broken into smaller steps..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                style={{ minHeight: '180px' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setTaskDescription(EXAMPLE_TASK)}
              >
                Load Example
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Model</label>
              <select
                className="form-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleExecute}
              disabled={loading || !taskDescription.trim()}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" /> Decomposing...
                </>
              ) : (
                'Decompose & Execute'
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {error && (
            <div className="error-box" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                <h3>Decomposing Task</h3>
                <p>Breaking down into sub-tasks and executing each step...</p>
              </div>
            </div>
          )}

          {result && !loading && decomposition && (
            <div>
              {/* Sub-task count badge */}
              <div style={{ marginBottom: '1rem' }}>
                <span className="badge badge-success">
                  Decomposed into {decomposition.sub_task_count} sub-tasks
                </span>
              </div>

              {/* Stages accordion */}
              {decomposition.stages.map((stage, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === decomposition.stages.length - 1;
                return (
                  <details
                    key={idx}
                    open={isFirst || isLast}
                    style={{
                      marginBottom: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      ...(isLast
                        ? { borderLeft: '3px solid var(--accent)' }
                        : {}),
                    }}
                  >
                    <summary
                      style={{
                        padding: '0.85rem 1rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        color: 'var(--text-primary)',
                        userSelect: 'none',
                        listStyle: 'revert',
                      }}
                    >
                      {stage.name}
                    </summary>
                    <div style={{ padding: '0 1rem 1rem' }}>
                      <div className="output-box">
                        <FormattedOutput text={stage.output} />
                      </div>
                    </div>
                  </details>
                );
              })}

              {/* Meta row */}
              <div className="meta-row" style={{ marginTop: '1rem' }}>
                <div className="meta-item">
                  Model: <strong>{result.model}</strong>
                </div>
                <div className="meta-item">
                  Tokens: <strong>{result.tokens_input + result.tokens_output}</strong>
                </div>
                <div className="meta-item">
                  Cost: <strong>${result.cost_estimate.toFixed(5)}</strong>
                </div>
                <div className="meta-item">
                  Latency: <strong>{result.latency_ms}ms</strong>
                </div>
              </div>
            </div>
          )}

          {/* Fallback: result exists but couldn't parse structured output */}
          {result && !loading && !decomposition && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Output</div>
              </div>
              <div className="output-box">
                <FormattedOutput text={result.output} />
              </div>
              <div className="meta-row">
                <div className="meta-item">
                  Model: <strong>{result.model}</strong>
                </div>
                <div className="meta-item">
                  Tokens: <strong>{result.tokens_input + result.tokens_output}</strong>
                </div>
                <div className="meta-item">
                  Cost: <strong>${result.cost_estimate.toFixed(5)}</strong>
                </div>
                <div className="meta-item">
                  Latency: <strong>{result.latency_ms}ms</strong>
                </div>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="card">
              <div className="empty-state">
                <h3>Ready to Decompose</h3>
                <p>
                  Describe a complex task and click "Decompose & Execute" to
                  break it into manageable sub-tasks, execute each one, and
                  integrate the results.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
