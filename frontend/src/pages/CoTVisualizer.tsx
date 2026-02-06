import React, { useState } from 'react';
import { executeCoTVisualizer } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface CoTStep {
  step_number: number;
  title: string;
  reasoning: string;
  result: string;
  confidence: number;
}

interface CoTOutput {
  steps: CoTStep[];
  final_answer: string;
  reasoning_type: string;
  total_steps: number;
  weakest_step: number;
  alternative_approaches: string[];
}

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
];

const EXAMPLE_QUESTION =
  'A farmer has 17 sheep. All but 9 die. How many sheep are left? Explain your reasoning step by step.';

function parseCoTOutput(raw: string): CoTOutput | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.steps) && parsed.final_answer) {
      return parsed as CoTOutput;
    }
    return null;
  } catch {
    // Try extracting JSON from markdown code blocks
    const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        if (parsed && Array.isArray(parsed.steps) && parsed.final_answer) {
          return parsed as CoTOutput;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 8) return 'var(--success, #22c55e)';
  if (confidence >= 5) return 'var(--warning, #f59e0b)';
  return 'var(--error, #ef4444)';
}

function getReasoningTypeBadgeClass(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes('deductive') || normalized.includes('logical')) return 'badge-accent';
  if (normalized.includes('mathematical') || normalized.includes('analytical')) return 'badge-success';
  if (normalized.includes('inductive') || normalized.includes('creative')) return 'badge-warning';
  return 'badge-accent';
}

export const CoTVisualizer: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleExecute = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowRaw(false);
    try {
      const res = await executeCoTVisualizer({ question, model });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result ? parseCoTOutput(result.output) : null;

  return (
    <div>
      <div className="page-header">
        <h2>Chain-of-Thought Visualizer</h2>
        <p>Visualize step-by-step reasoning for complex questions with confidence tracking</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        {/* Left Column: Input */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Input</div>
            </div>

            <div className="form-group">
              <label className="form-label">Reasoning Question</label>
              <textarea
                className="form-textarea"
                placeholder="Enter a reasoning-heavy question (math, logic, analysis)..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={{ minHeight: '160px' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setQuestion(EXAMPLE_QUESTION)}
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
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleExecute}
              disabled={loading || !question.trim()}
              style={{ width: '100%' }}
            >
              {loading ? (
                <><span className="loading-spinner" /> Analyzing...</>
              ) : (
                'Visualize Reasoning'
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div>
          {error && <div className="error-box" style={{ marginBottom: '1rem' }}>{error}</div>}

          {loading && (
            <div className="card">
              <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                <h3>Analyzing Reasoning Chain</h3>
                <p>Breaking down the question into logical steps...</p>
              </div>
            </div>
          )}

          {result && !loading && parsed && !showRaw && (
            <div>
              {/* Header with reasoning type and toggle */}
              <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="card-title">Reasoning Chain</div>
                    <span className={`badge ${getReasoningTypeBadgeClass(parsed.reasoning_type)}`}>
                      {parsed.reasoning_type}
                    </span>
                    <span className="badge badge-success">
                      {parsed.total_steps} step{parsed.total_steps !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowRaw(true)}
                  >
                    Raw Output
                  </button>
                </div>
              </div>

              {/* Vertical timeline of reasoning steps */}
              <div style={{ position: 'relative', marginTop: '0.75rem' }}>
                {parsed.steps.map((step, idx) => {
                  const isWeakest = step.step_number === parsed.weakest_step;
                  const isLast = idx === parsed.steps.length - 1;
                  const confidenceColor = getConfidenceColor(step.confidence);

                  return (
                    <div key={idx} style={{ position: 'relative', paddingLeft: '2rem' }}>
                      {/* Vertical connector line */}
                      {!isLast && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '0.9rem',
                            top: '2rem',
                            bottom: 0,
                            width: '2px',
                            background: 'var(--border)',
                          }}
                        />
                      )}

                      {/* Step number circle */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '0.15rem',
                          top: '1rem',
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '50%',
                          background: isWeakest ? 'var(--warning, #f59e0b)' : 'var(--accent, #6366f1)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          zIndex: 1,
                        }}
                      >
                        {step.step_number}
                      </div>

                      {/* Step card */}
                      <div
                        className="card"
                        style={{
                          marginBottom: '0.75rem',
                          borderLeft: isWeakest
                            ? '3px solid var(--warning, #f59e0b)'
                            : '3px solid var(--accent, #6366f1)',
                          background: isWeakest ? 'rgba(245, 158, 11, 0.04)' : undefined,
                        }}
                      >
                        {/* Step header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {step.title}
                            </span>
                            {isWeakest && (
                              <span className="badge badge-warning">Weakest Link</span>
                            )}
                          </div>
                        </div>

                        {/* Reasoning */}
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: '1.6' }}>
                          {step.reasoning}
                        </div>

                        {/* Intermediate result */}
                        {step.result && (
                          <div
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg-primary)',
                              borderRadius: '0.375rem',
                              fontSize: '0.82rem',
                              color: 'var(--text-primary)',
                              fontWeight: 500,
                              marginBottom: '0.5rem',
                            }}
                          >
                            Result: {step.result}
                          </div>
                        )}

                        {/* Confidence bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '4.5rem' }}>
                            Confidence:
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: '6px',
                              background: 'var(--bg-primary)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${(step.confidence / 10) * 100}%`,
                                height: '100%',
                                background: confidenceColor,
                                borderRadius: '3px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: confidenceColor, minWidth: '2rem', textAlign: 'right' }}>
                            {step.confidence}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Final Answer */}
              <div
                className="card"
                style={{
                  marginTop: '0.5rem',
                  background: 'rgba(34, 197, 94, 0.05)',
                  borderColor: 'var(--success, #22c55e)',
                  borderWidth: '1px',
                }}
              >
                <div className="card-title" style={{ marginBottom: '0.75rem', color: 'var(--success, #22c55e)' }}>
                  Final Answer
                </div>
                <div className="output-box" style={{ margin: 0, fontSize: '0.92rem' }}>
                  <FormattedOutput text={parsed.final_answer} />
                </div>
              </div>

              {/* Alternative Approaches */}
              {parsed.alternative_approaches && parsed.alternative_approaches.length > 0 && (
                <div className="card" style={{ marginTop: '0.75rem' }}>
                  <div className="card-title" style={{ marginBottom: '0.5rem' }}>Alternative Approaches</div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc' }}>
                    {parsed.alternative_approaches.map((approach, idx) => (
                      <li
                        key={idx}
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '0.3rem',
                          lineHeight: '1.5',
                        }}
                      >
                        {approach}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meta row */}
              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">Model: <strong>{result.model}</strong></div>
                <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
                <div className="meta-item">Cost: <strong>${result.cost_estimate.toFixed(5)}</strong></div>
                <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
              </div>
            </div>
          )}

          {/* Raw output view */}
          {result && !loading && showRaw && (
            <div>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div className="card-title">Raw Output</div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowRaw(false)}
                  >
                    Formatted View
                  </button>
                </div>
                <div className="output-box">
                  <pre style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                  }}>
                    {result.output}
                  </pre>
                </div>
              </div>
              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">Model: <strong>{result.model}</strong></div>
                <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
                <div className="meta-item">Cost: <strong>${result.cost_estimate.toFixed(5)}</strong></div>
                <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
              </div>
            </div>
          )}

          {/* Fallback: result exists but JSON parsing failed */}
          {result && !loading && !parsed && !showRaw && (
            <div>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Output</div>
                </div>
                <div className="output-box">
                  <FormattedOutput text={result.output} />
                </div>
              </div>
              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">Model: <strong>{result.model}</strong></div>
                <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
                <div className="meta-item">Cost: <strong>${result.cost_estimate.toFixed(5)}</strong></div>
                <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="card">
              <div className="empty-state">
                <h3>Chain-of-Thought Visualizer Ready</h3>
                <p>
                  Enter a reasoning-heavy question and click "Visualize Reasoning" to see
                  the step-by-step thought process broken down with confidence scores.
                </p>
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <strong>Best suited for:</strong><br />
                  1. <strong>Mathematical problems</strong> &mdash; Step-by-step calculations with verification<br />
                  2. <strong>Logic puzzles</strong> &mdash; Deductive reasoning with clear premises<br />
                  3. <strong>Analytical questions</strong> &mdash; Multi-factor analysis and comparison<br />
                  4. <strong>Causal reasoning</strong> &mdash; Tracing cause-and-effect chains
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
