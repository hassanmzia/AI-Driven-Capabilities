import React, { useState } from 'react';
import { executePromptCompare } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { CompareResult } from '../types';

interface JudgmentScores {
  [criterion: string]: number;
}

interface Judgment {
  scores_a?: JudgmentScores;
  scores_b?: JudgmentScores;
  winner?: string;
  reasoning?: string;
}

function parseJudgment(raw: string): Judgment | null {
  try {
    const trimmed = raw.trim();
    // Try direct parse
    let parsed: any = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      // Try extracting JSON from markdown code block
      const codeBlock = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlock) {
        parsed = JSON.parse(codeBlock[1].trim());
      } else {
        // Try finding embedded JSON
        const first = trimmed.search(/[{[]/);
        if (first >= 0) {
          const opener = trimmed[first];
          const closer = opener === '{' ? '}' : ']';
          const last = trimmed.lastIndexOf(closer);
          if (last > first) {
            parsed = JSON.parse(trimmed.slice(first, last + 1));
          }
        }
      }
    }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Judgment;
    }
    return null;
  } catch {
    return null;
  }
}

function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color =
    pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--error)';

  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          marginBottom: '0.25rem',
        }}
      >
        <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {label.replace(/[_-]/g, ' ')}
        </span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {value}/{max}
        </span>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '3px',
            background: color,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

function WinnerBadge({ winner }: { winner: string }) {
  const normalized = winner.toUpperCase().trim();
  let label: string;
  let className: string;

  if (normalized === 'A' || normalized === 'PROMPT A') {
    label = 'A Wins';
    className = 'badge-success';
  } else if (normalized === 'B' || normalized === 'PROMPT B') {
    label = 'B Wins';
    className = 'badge-accent';
  } else {
    label = 'Tie';
    className = 'badge-warning';
  }

  return (
    <span
      className={`badge ${className}`}
      style={{ fontSize: '1rem', padding: '0.4rem 1.2rem', fontWeight: 700 }}
    >
      {label}
    </span>
  );
}

export const ABTester: React.FC = () => {
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [testInput, setTestInput] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRun = promptA.trim() && promptB.trim() && testInput.trim() && !loading;

  const handleRun = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executePromptCompare({
        prompt_a: promptA,
        prompt_b: promptB,
        test_input: testInput,
        model,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const judgment: Judgment | null = result ? parseJudgment(result.output) : null;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>Prompt A/B Tester</h2>
        <p>Compare two prompt variants side-by-side with LLM-as-judge evaluation</p>
      </div>

      {/* Input Section */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Configuration</div>
        </div>

        {/* Prompt A & B side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Prompt A</label>
            <textarea
              className="form-textarea"
              placeholder="Enter the first prompt variant..."
              value={promptA}
              onChange={(e) => setPromptA(e.target.value)}
              style={{ minHeight: '120px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Prompt B</label>
            <textarea
              className="form-textarea"
              placeholder="Enter the second prompt variant..."
              value={promptB}
              onChange={(e) => setPromptB(e.target.value)}
              style={{ minHeight: '120px' }}
            />
          </div>
        </div>

        {/* Test Input */}
        <div className="form-group">
          <label className="form-label">Test Input</label>
          <textarea
            className="form-textarea"
            placeholder="Enter the input to run both prompts against..."
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            style={{ minHeight: '80px' }}
          />
        </div>

        {/* Model Selector & Run Button */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 240px' }}>
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
          <button className="btn btn-primary" onClick={handleRun} disabled={!canRun}>
            {loading ? (
              <>
                <span className="loading-spinner" /> Comparing...
              </>
            ) : (
              'Run Comparison'
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Running both prompts and evaluating outputs...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Results Section */}
      {result && !loading && (
        <>
          {/* Output A & B side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  Output A
                  {judgment?.winner && (
                    (() => {
                      const w = judgment.winner!.toUpperCase().trim();
                      return (w === 'A' || w === 'PROMPT A')
                        ? <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>Winner</span>
                        : null;
                    })()
                  )}
                </div>
              </div>
              <div className="output-box">
                {result.output_a ? (
                  <FormattedOutput text={result.output_a} />
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No output returned</span>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  Output B
                  {judgment?.winner && (
                    (() => {
                      const w = judgment.winner!.toUpperCase().trim();
                      return (w === 'B' || w === 'PROMPT B')
                        ? <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>Winner</span>
                        : null;
                    })()
                  )}
                </div>
              </div>
              <div className="output-box">
                {result.output_b ? (
                  <FormattedOutput text={result.output_b} />
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No output returned</span>
                )}
              </div>
            </div>
          </div>

          {/* Judgment Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Judgment</div>
            </div>

            {judgment ? (
              <>
                {/* Winner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Winner:
                  </span>
                  <WinnerBadge winner={judgment.winner || 'TIE'} />
                </div>

                {/* Score Bars side by side */}
                {(judgment.scores_a || judgment.scores_b) && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1.5rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {/* Scores A */}
                    <div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          marginBottom: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        Output A Scores
                      </div>
                      {judgment.scores_a &&
                        Object.entries(judgment.scores_a).map(([key, val]) => (
                          <ScoreBar key={key} label={key} value={val} />
                        ))}
                      {!judgment.scores_a && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          No scores available
                        </span>
                      )}
                    </div>

                    {/* Scores B */}
                    <div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          marginBottom: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        Output B Scores
                      </div>
                      {judgment.scores_b &&
                        Object.entries(judgment.scores_b).map(([key, val]) => (
                          <ScoreBar key={key} label={key} value={val} />
                        ))}
                      {!judgment.scores_b && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          No scores available
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Reasoning */}
                {judgment.reasoning && (
                  <div
                    style={{
                      padding: '1rem',
                      background: '#0f172a',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      lineHeight: '1.7',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Reasoning
                    </div>
                    {judgment.reasoning}
                  </div>
                )}
              </>
            ) : (
              <div className="output-box">
                <FormattedOutput text={result.output} />
              </div>
            )}

            {/* Meta Row */}
            <div className="meta-row">
              <div className="meta-item">
                Model: <strong>{result.model}</strong>
              </div>
              <div className="meta-item">
                Tokens: <strong>{result.tokens_input + result.tokens_output}</strong>
              </div>
              <div className="meta-item">
                Cost: <strong>${Number(result.cost_estimate).toFixed(5)}</strong>
              </div>
              <div className="meta-item">
                Latency: <strong>{result.latency_ms}ms</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
