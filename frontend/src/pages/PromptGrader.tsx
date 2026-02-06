import React, { useState } from 'react';
import { executePromptGrader, executePromptOptimizer } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface ScoreDimension {
  key: string;
  label: string;
  score: number;
}

interface GapItem {
  category: string;
  issue: string;
  suggestion: string;
}

interface GradingData {
  scores?: Record<string, number>;
  overall_grade?: string;
  overall_score?: number;
  gaps?: GapItem[];
  summary?: string;
}

interface OptimizationData {
  improved_prompt?: string;
  advanced_prompt?: string;
  changes?: Array<{ what: string; why: string }>;
}

const DIMENSION_LABELS: Record<string, string> = {
  clarity: 'Clarity',
  specificity: 'Specificity',
  constraints: 'Constraints',
  output_format: 'Output Format',
  examples: 'Examples',
  safety: 'Safety',
};

function getScoreColor(score: number): string {
  if (score >= 7) return '#22c55e';
  if (score >= 4) return '#eab308';
  return '#ef4444';
}

function getGradeBadgeClass(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  if (letter === 'A') return 'badge-success';
  if (letter === 'B') return 'badge-accent';
  if (letter === 'C') return 'badge-warning';
  return 'badge-error';
}

function parseGradingOutput(output: string): GradingData | null {
  try {
    const trimmed = output.trim();
    // Try direct parse
    let parsed = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      // Try extracting JSON from markdown code blocks
      const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlockMatch) {
        parsed = JSON.parse(codeBlockMatch[1].trim());
      } else {
        // Try finding JSON object in text
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
        }
      }
    }
    if (parsed && typeof parsed === 'object') return parsed as GradingData;
    return null;
  } catch {
    return null;
  }
}

function parseOptimizationOutput(output: string): OptimizationData | null {
  try {
    const trimmed = output.trim();
    let parsed = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlockMatch) {
        parsed = JSON.parse(codeBlockMatch[1].trim());
      } else {
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
        }
      }
    }
    if (parsed && typeof parsed === 'object') return parsed as OptimizationData;
    return null;
  } catch {
    return null;
  }
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = getScoreColor(score);
  const widthPct = `${(score * 10)}%`;

  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color }}>{score}/10</span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        background: 'var(--bg-secondary)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: widthPct,
          height: '100%',
          background: color,
          borderRadius: '4px',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

function MetaRow({ result }: { result: ExecutionResult }) {
  return (
    <div className="meta-row">
      <div className="meta-item">Model: <strong>{result.model}</strong></div>
      <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
      <div className="meta-item">Cost: <strong>${Number(result.cost_estimate).toFixed(5)}</strong></div>
      <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
    </div>
  );
}

export const PromptGrader: React.FC = () => {
  const [promptText, setPromptText] = useState('');
  const [taskType, setTaskType] = useState('general');
  const [domain, setDomain] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [grading, setGrading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [gradeResult, setGradeResult] = useState<ExecutionResult | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async () => {
    if (!promptText.trim()) return;
    setGrading(true);
    setError(null);
    setGradeResult(null);
    setOptimizeResult(null);
    try {
      const res = await executePromptGrader({
        prompt_text: promptText,
        task_type: taskType,
        domain: domain || undefined,
        model,
      });
      setGradeResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Grading failed');
    } finally {
      setGrading(false);
    }
  };

  const handleGradeAndOptimize = async () => {
    if (!promptText.trim()) return;
    setGrading(true);
    setOptimizing(false);
    setError(null);
    setGradeResult(null);
    setOptimizeResult(null);
    try {
      const gradeRes = await executePromptGrader({
        prompt_text: promptText,
        task_type: taskType,
        domain: domain || undefined,
        model,
      });
      setGradeResult(gradeRes);
      setGrading(false);

      setOptimizing(true);
      const optRes = await executePromptOptimizer({
        prompt_text: promptText,
        grading_output: gradeRes.output,
        model,
      });
      setOptimizeResult(optRes);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setGrading(false);
      setOptimizing(false);
    }
  };

  const isLoading = grading || optimizing;
  const gradingData = gradeResult ? parseGradingOutput(gradeResult.output) : null;
  const optimizationData = optimizeResult ? parseOptimizationOutput(optimizeResult.output) : null;

  const dimensions: ScoreDimension[] = gradingData?.scores
    ? Object.entries(gradingData.scores).map(([key, score]) => ({
        key,
        label: DIMENSION_LABELS[key] || key.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        score: typeof score === 'number' ? score : 0,
      }))
    : [];

  return (
    <div>
      <div className="page-header">
        <h2>Prompt Grader & Optimizer</h2>
        <p>Evaluate your prompts across 6 quality dimensions and get AI-powered optimization suggestions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Input */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Input</div>
            </div>

            <div className="form-group">
              <label className="form-label">Your Prompt</label>
              <textarea
                className="form-textarea"
                placeholder="Enter the prompt you want to grade and optimize..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                style={{ minHeight: '200px' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Task Type</label>
                <select
                  className="form-select"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="summarization">Summarization</option>
                  <option value="generation">Generation</option>
                  <option value="classification">Classification</option>
                  <option value="extraction">Extraction</option>
                  <option value="chat">Chat</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Domain</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., healthcare, finance, legal..."
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
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
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleGrade}
                disabled={isLoading || !promptText.trim()}
              >
                {grading && !optimizing ? (
                  <><span className="loading-spinner" /> Grading...</>
                ) : (
                  'Grade Prompt'
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleGradeAndOptimize}
                disabled={isLoading || !promptText.trim()}
              >
                {optimizing ? (
                  <><span className="loading-spinner" /> Optimizing...</>
                ) : grading ? (
                  <><span className="loading-spinner" /> Grading...</>
                ) : (
                  'Grade & Optimize'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Grading Results Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Grading Results</div>
            </div>

            {grading && (
              <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                <p>Analyzing your prompt...</p>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}

            {gradeResult && !grading && gradingData && (
              <>
                {/* Overall Grade */}
                {gradingData.overall_grade && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <span
                      className={`badge ${getGradeBadgeClass(gradingData.overall_grade)}`}
                      style={{ fontSize: '1.5rem', padding: '0.5rem 1rem', fontWeight: 700 }}
                    >
                      {gradingData.overall_grade}
                    </span>
                    {gradingData.overall_score !== undefined && (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Overall Score: <strong>{gradingData.overall_score}/10</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Score Bars */}
                {dimensions.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    {dimensions.map((dim) => (
                      <ScoreBar key={dim.key} label={dim.label} score={dim.score} />
                    ))}
                  </div>
                )}

                {/* Gaps Section */}
                {gradingData.gaps && gradingData.gaps.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}>
                      Gaps & Suggestions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {gradingData.gaps.map((gap, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.6rem 0.75rem',
                            background: 'rgba(99, 102, 241, 0.03)',
                            borderRadius: '0.375rem',
                            borderLeft: '3px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                              {gap.category}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                            {gap.issue}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Suggestion: {gap.suggestion}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {gradingData.summary && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    marginBottom: '0.75rem',
                  }}>
                    {gradingData.summary}
                  </div>
                )}

                <MetaRow result={gradeResult} />
              </>
            )}

            {/* Fallback: show raw FormattedOutput if JSON parsing fails */}
            {gradeResult && !grading && !gradingData && (
              <>
                <div className="output-box">
                  <FormattedOutput text={gradeResult.output} />
                </div>
                <MetaRow result={gradeResult} />
              </>
            )}

            {!gradeResult && !grading && !error && (
              <div className="empty-state">
                <h3>Ready to go</h3>
                <p>Enter a prompt and click Grade to see quality scores</p>
              </div>
            )}
          </div>

          {/* Optimization Results Card */}
          {optimizing && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Optimization Results</div>
              </div>
              <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                <p>Generating optimized prompts...</p>
              </div>
            </div>
          )}

          {optimizeResult && !optimizing && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Optimization Results</div>
              </div>

              {optimizationData ? (
                <>
                  {/* Improved Prompt */}
                  {optimizationData.improved_prompt && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}>
                        Improved Prompt
                      </div>
                      <div className="output-box" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                        {optimizationData.improved_prompt}
                      </div>
                    </div>
                  )}

                  {/* Advanced Prompt (collapsible) */}
                  {optimizationData.advanced_prompt && (
                    <div style={{ marginBottom: '1rem' }}>
                      <details>
                        <summary style={{
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--accent)',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          userSelect: 'none',
                        }}>
                          Advanced Prompt
                        </summary>
                        <div className="output-box" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                          {optimizationData.advanced_prompt}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Changes */}
                  {optimizationData.changes && optimizationData.changes.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}>
                        Changes Made
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {optimizationData.changes.map((change, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: 'rgba(99, 102, 241, 0.03)',
                              borderRadius: '0.375rem',
                              borderLeft: '3px solid var(--accent)',
                            }}
                          >
                            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {change.what}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              {change.why}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <MetaRow result={optimizeResult} />
                </>
              ) : (
                <>
                  <div className="output-box">
                    <FormattedOutput text={optimizeResult.output} />
                  </div>
                  <MetaRow result={optimizeResult} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
