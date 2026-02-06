import React, { useState } from 'react';
import { executeMisconceptionDetector } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface MisconceptionItem {
  claim: string;
  issue: string;
  correction: string;
  severity: string;
}

interface DetectorData {
  classification?: string;
  score?: number;
  correct_elements?: string[];
  misconceptions?: MisconceptionItem[];
  missing_concepts?: string[];
  feedback?: string;
  suggested_resources?: string[];
}

const SECTION_HEADING: React.CSSProperties = {
  fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)',
  marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em',
};

const LIST_ITEM: React.CSSProperties = {
  fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.3rem', lineHeight: '1.6',
};

function classificationBadge(c: string): string {
  switch (c.toLowerCase()) {
    case 'correct': return 'badge-success';
    case 'partially_correct': return 'badge-warning';
    case 'incorrect': return 'badge-error';
    default: return 'badge-accent';
  }
}

function severityBadge(s: string): string {
  switch (s.toLowerCase()) {
    case 'low': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'high': case 'critical': return 'badge-error';
    default: return 'badge-warning';
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

function formatClassification(v: string): string {
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function tryParseDetectorOutput(output: string): DetectorData | null {
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
    if (parsed && typeof parsed === 'object') return parsed as DetectorData;
    return null;
  } catch {
    return null;
  }
}

function MetaRow({ result }: { result: ExecutionResult }) {
  return (
    <div className="meta-row" style={{ marginTop: '0.5rem' }}>
      <div className="meta-item">Model: <strong>{result.model}</strong></div>
      <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
      <div className="meta-item">Cost: <strong>${Number(result.cost_estimate).toFixed(5)}</strong></div>
      <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
    </div>
  );
}

export const MisconceptionDetector: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  const handleExecute = async () => {
    if (!topic.trim() || !studentAnswer.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await executeMisconceptionDetector({ topic, student_answer: studentAnswer, model });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const data = result?.output ? tryParseDetectorOutput(result.output) : null;
  const scoreValue = data?.score ?? 0;
  const scoreColor = getScoreColor(scoreValue);

  return (
    <div>
      <div className="page-header">
        <h2>Misconception Detector</h2>
        <p>Analyze student answers to identify misconceptions, missing concepts, and provide targeted feedback</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Column - Input */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Input</div>
          </div>

          <div className="form-group">
            <label className="form-label">Topic / Subject</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Photosynthesis, Newton's Laws of Motion, Cell Division..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Student's Answer</label>
            <textarea
              className="form-textarea"
              placeholder="Enter the student's response to analyze for misconceptions..."
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              style={{ minHeight: '200px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Model</label>
            <select className="form-select" value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={loading || !topic.trim() || !studentAnswer.trim()}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? <><span className="loading-spinner" /> Analyzing...</> : 'Detect Misconceptions'}
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Analysis Results</div>
            {result && !loading && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
              >
                {viewMode === 'formatted' ? 'Raw' : 'Formatted'}
              </button>
            )}
          </div>

          {error && <div className="error-box">{error}</div>}

          {loading && (
            <div className="empty-state">
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Analyzing student response...</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="empty-state">
              <h3>No analysis yet</h3>
              <p>Enter a topic and student answer to detect misconceptions</p>
            </div>
          )}

          {/* Raw View */}
          {result && !loading && viewMode === 'raw' && (
            <div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
              <MetaRow result={result} />
            </div>
          )}

          {/* Formatted View */}
          {result && !loading && viewMode === 'formatted' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Classification & Score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: '0.5rem' }}>
                {data.classification && (
                  <span
                    className={`badge ${classificationBadge(data.classification)}`}
                    style={{ fontSize: '1.1rem', padding: '0.5rem 1rem', fontWeight: 700 }}
                  >
                    {formatClassification(data.classification)}
                  </span>
                )}
                {data.score !== undefined && (
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Score</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: scoreColor }}>{scoreValue}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${scoreValue}%`, height: '100%', background: scoreColor, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Correct Elements */}
              {data.correct_elements && data.correct_elements.length > 0 && (
                <div>
                  <div style={SECTION_HEADING}>Correct Elements</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {data.correct_elements.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', ...LIST_ITEM }}>
                        <span style={{ color: '#22c55e', flexShrink: 0 }}>&#10003;</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Misconceptions */}
              {data.misconceptions && data.misconceptions.length > 0 && (
                <div>
                  <div style={SECTION_HEADING}>Misconceptions ({data.misconceptions.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {data.misconceptions.map((item, i) => (
                      <div key={i} style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '0.5rem', borderLeft: '3px solid var(--border)' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span className={`badge ${severityBadge(item.severity)}`}>{item.severity}</span>
                        </div>
                        <div style={{ marginBottom: '0.4rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>Student Claimed</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>{item.claim}</div>
                        </div>
                        <div style={{ marginBottom: '0.4rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>What's Wrong</div>
                          <div style={{ fontSize: '0.85rem', color: '#ef4444', lineHeight: '1.6' }}>{item.issue}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>Correction</div>
                          <div style={{ fontSize: '0.85rem', color: '#4ade80', lineHeight: '1.6' }}>{item.correction}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Concepts */}
              {data.missing_concepts && data.missing_concepts.length > 0 && (
                <div>
                  <div style={SECTION_HEADING}>Missing Concepts</div>
                  <ul style={{ paddingLeft: '1.25rem', margin: '0.25rem 0', listStyle: 'disc' }}>
                    {data.missing_concepts.map((concept, i) => (
                      <li key={i} style={LIST_ITEM}>{concept}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback */}
              {data.feedback && (
                <div>
                  <div style={SECTION_HEADING}>Feedback</div>
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {data.feedback}
                  </div>
                </div>
              )}

              {/* Suggested Resources */}
              {data.suggested_resources && data.suggested_resources.length > 0 && (
                <div>
                  <div style={SECTION_HEADING}>Suggested Resources</div>
                  <ul style={{ paddingLeft: '1.25rem', margin: '0.25rem 0', listStyle: 'disc' }}>
                    {data.suggested_resources.map((resource, i) => (
                      <li key={i} style={LIST_ITEM}>{resource}</li>
                    ))}
                  </ul>
                </div>
              )}

              <MetaRow result={result} />
            </div>
          )}

          {/* Formatted view fallback when JSON parsing fails */}
          {result && !loading && viewMode === 'formatted' && !data && (
            <div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
              <MetaRow result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
