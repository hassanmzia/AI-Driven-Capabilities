import React, { useState } from 'react';
import { executeSelfCorrecting } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface RoundData {
  round: number;
  type: string;
  output: string;
}

interface ParsedOutput {
  final_output: string;
  rounds: RoundData[];
  total_rounds: number;
}

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
];

function getRoundStyle(type: string): { color: string; label: string } {
  switch (type.toLowerCase()) {
    case 'generation':
      return { color: 'var(--accent, #6366f1)', label: 'Generation' };
    case 'critique':
      return { color: 'var(--warning, #f59e0b)', label: 'Critique' };
    case 'revision':
      return { color: 'var(--success, #22c55e)', label: 'Revision' };
    default:
      return { color: 'var(--accent, #6366f1)', label: type };
  }
}

function getBadgeClass(type: string): string {
  switch (type.toLowerCase()) {
    case 'generation':
      return 'badge-accent';
    case 'critique':
      return 'badge-warning';
    case 'revision':
      return 'badge-success';
    default:
      return 'badge-accent';
  }
}

function tryParseOutput(output: string): ParsedOutput | null {
  try {
    const parsed = JSON.parse(output);
    if (parsed && parsed.final_output && Array.isArray(parsed.rounds)) {
      return parsed as ParsedOutput;
    }
    return null;
  } catch {
    // Try extracting JSON from markdown code blocks
    const codeBlockMatch = output.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        if (parsed && parsed.final_output && Array.isArray(parsed.rounds)) {
          return parsed as ParsedOutput;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const SelfCorrectingLoop: React.FC = () => {
  const [promptText, setPromptText] = useState('');
  const [inputText, setInputText] = useState('');
  const [criteria, setCriteria] = useState('');
  const [maxRounds, setMaxRounds] = useState(3);
  const [threshold, setThreshold] = useState(7);
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!promptText.trim() || !inputText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executeSelfCorrecting({
        prompt_text: promptText,
        input_text: inputText,
        criteria: criteria.trim() || undefined,
        max_rounds: maxRounds,
        threshold,
        model,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result ? tryParseOutput(result.output) : null;

  return (
    <div>
      <div className="page-header">
        <h2>Self-Correcting Loop</h2>
        <p>Generate, critique, and revise iteratively until quality threshold is met</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Input */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Input</div>
            </div>

            <div className="form-group">
              <label className="form-label">System/Task Prompt</label>
              <textarea
                className="form-textarea"
                placeholder="Enter the system or task prompt for the LLM..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Input Text</label>
              <textarea
                className="form-textarea"
                placeholder="Enter the content to process..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ minHeight: '120px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Quality Criteria</label>
              <textarea
                className="form-textarea"
                placeholder="Optional: specific criteria to evaluate against..."
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                style={{ minHeight: '60px' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Max Rounds</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={5}
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(Math.min(5, Math.max(1, parseInt(e.target.value) || 3)))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quality Threshold</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={10}
                  value={threshold}
                  onChange={(e) => setThreshold(Math.min(10, Math.max(1, parseInt(e.target.value) || 7)))}
                />
              </div>
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
              disabled={loading || !promptText.trim() || !inputText.trim()}
              style={{ width: '100%' }}
            >
              {loading ? (
                <><span className="loading-spinner" /> Running Loop...</>
              ) : (
                'Start Loop'
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
                <h3>Running Self-Correcting Loop</h3>
                <p>Generate &rarr; Critique &rarr; Revise &rarr; Repeat until quality threshold is met</p>
              </div>
            </div>
          )}

          {result && !loading && parsed && (
            <div>
              {/* Summary badge */}
              <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-title">Loop Results</div>
                  <span className="badge badge-success">
                    Completed in {parsed.total_rounds} round{parsed.total_rounds !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Timeline view of rounds */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                {parsed.rounds.map((round, idx) => {
                  const style = getRoundStyle(round.type);
                  const badgeClass = getBadgeClass(round.type);
                  return (
                    <div
                      key={idx}
                      className="card"
                      style={{
                        borderLeft: `3px solid ${style.color}`,
                        marginBottom: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Round {round.round}
                        </span>
                        <span className={`badge ${badgeClass}`}>{style.label}</span>
                      </div>
                      <div className="output-box" style={{ margin: 0 }}>
                        <FormattedOutput text={round.output} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Final Output */}
              <div
                className="card"
                style={{
                  marginTop: '0.75rem',
                  background: 'rgba(34, 197, 94, 0.05)',
                  borderColor: 'var(--success, #22c55e)',
                  borderWidth: '1px',
                }}
              >
                <div className="card-title" style={{ marginBottom: '0.75rem' }}>Final Output</div>
                <div className="output-box" style={{ margin: 0 }}>
                  <FormattedOutput text={parsed.final_output} />
                </div>
              </div>

              {/* Meta row */}
              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">Model: <strong>{result.model}</strong></div>
                <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
                <div className="meta-item">Cost: <strong>${result.cost_estimate.toFixed(5)}</strong></div>
                <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
              </div>
            </div>
          )}

          {/* Fallback: result exists but output is not parseable as expected JSON */}
          {result && !loading && !parsed && (
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

          {!result && !loading && !error && (
            <div className="card">
              <div className="empty-state">
                <h3>Self-Correcting Loop Ready</h3>
                <p>
                  Provide a task prompt and input text, then click "Start Loop" to begin
                  the iterative generate-critique-revise cycle.
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
                  <strong>How it works:</strong><br />
                  1. <strong>Generation</strong> -- The LLM produces an initial output based on your prompt<br />
                  2. <strong>Critique</strong> -- The output is evaluated against quality criteria<br />
                  3. <strong>Revision</strong> -- Feedback is incorporated to improve the output<br />
                  4. Steps 2-3 repeat until the quality threshold is met or max rounds are reached
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
