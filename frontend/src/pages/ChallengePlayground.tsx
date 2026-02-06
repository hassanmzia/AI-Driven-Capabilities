import React, { useState, useEffect } from 'react';
import { getChallenges, submitChallenge, seedPlatformData } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { Challenge, ChallengeSubmission } from '../types';

interface EvaluationFeedback {
  criteria_met?: string[];
  criteria_missed?: string[];
  summary?: string;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; label: string }> = {
  easy:   { bg: '#22c55e', label: 'Easy' },
  medium: { bg: '#eab308', label: 'Medium' },
  hard:   { bg: '#f97316', label: 'Hard' },
  expert: { bg: '#ef4444', label: 'Expert' },
};

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
];

const sectionLabel: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)',
  textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.35rem',
};

function scoreColor(s: number) { return s >= 80 ? '#22c55e' : s >= 50 ? '#eab308' : '#ef4444'; }

function parseFeedback(evaluation: string): EvaluationFeedback | null {
  try {
    const t = evaluation.trim();
    let parsed = null;
    try { parsed = JSON.parse(t); } catch {
      const cb = t.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (cb) { parsed = JSON.parse(cb[1].trim()); }
      else {
        const f = t.indexOf('{'), l = t.lastIndexOf('}');
        if (f >= 0 && l > f) parsed = JSON.parse(t.slice(f, l + 1));
      }
    }
    return parsed && typeof parsed === 'object' ? parsed as EvaluationFeedback : null;
  } catch { return null; }
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const c = DIFFICULTY_COLORS[difficulty.toLowerCase()] || { bg: '#6b7280', label: difficulty };
  return (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '9999px',
      fontSize: '0.7rem', fontWeight: 600, color: '#fff', background: c.bg,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {c.label}
    </span>
  );
}

export const ChallengePlayground: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [promptText, setPromptText] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ChallengeSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        let res = await getChallenges();
        if (!res.results || res.results.length === 0) {
          await seedPlatformData();
          res = await getChallenges();
        }
        if (!cancelled) {
          setChallenges(res.results || []);
          if (res.results?.length > 0) setSelected(res.results[0]);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.response?.data?.error || e.message || 'Failed to load challenges');
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSelect = (ch: Challenge) => {
    setSelected(ch); setPromptText(''); setResult(null); setError(null); setHintsOpen(false);
  };

  const handleSubmit = async () => {
    if (!selected || !promptText.trim()) return;
    setSubmitting(true); setError(null); setResult(null);
    try {
      const res = await submitChallenge({ challenge_id: selected.id, prompt_text: promptText, model });
      setResult(res);
      setChallenges((prev) => prev.map((c) =>
        c.id === selected.id ? {
          ...c, submission_count: c.submission_count + 1,
          best_score: c.best_score === null ? res.score : Math.max(c.best_score, res.score),
        } : c
      ));
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const feedback = result ? parseFeedback(result.evaluation) : null;

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h2>Challenge Playground</h2>
          <p>Sharpen your prompt engineering skills with gamified challenges</p>
        </div>
        <div className="empty-state">
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Challenge Playground</h2>
        <p>Sharpen your prompt engineering skills with gamified challenges</p>
      </div>

      {error && !selected && <div className="error-box">{error}</div>}

      {challenges.length === 0 && !error ? (
        <div className="empty-state">
          <h3>No challenges available</h3>
          <p>Challenges could not be loaded. Try refreshing the page.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Panel: Challenge List */}
          <div className="card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div className="card-title">Challenges ({challenges.length})</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {challenges.map((c) => {
                const active = selected?.id === c.id;
                return (
                  <div key={c.id} onClick={() => handleSelect(c)} style={{
                    padding: '0.65rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                    background: active ? 'var(--accent-bg, rgba(99, 102, 241, 0.08))' : 'transparent',
                    border: active ? '1px solid var(--accent)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                        {c.title}
                      </span>
                      <DifficultyBadge difficulty={c.difficulty} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>{c.points} pts</span>
                      <span>{c.submission_count} attempt{c.submission_count !== 1 ? 's' : ''}</span>
                      {c.best_score !== null && (
                        <span style={{ color: scoreColor(c.best_score), fontWeight: 600 }}>
                          Best: {c.best_score}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {selected ? (
              <>
                {/* Challenge Details */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title" style={{ flex: 1 }}>{selected.title}</div>
                    <DifficultyBadge difficulty={selected.difficulty} />
                    <span className="badge badge-accent" style={{ marginLeft: '0.5rem' }}>{selected.points} pts</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
                    {selected.description}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={sectionLabel}>Test Input</div>
                      <div className="output-box" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', minHeight: '60px' }}>
                        {selected.test_input || 'No specific test input provided.'}
                      </div>
                    </div>
                    <div>
                      <div style={sectionLabel}>Expected Behavior</div>
                      <div className="output-box" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', minHeight: '60px' }}>
                        {selected.expected_behavior || 'See challenge criteria.'}
                      </div>
                    </div>
                  </div>

                  {/* Hints (collapsible) */}
                  {selected.hints && selected.hints.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setHintsOpen(!hintsOpen)}
                        style={{ fontSize: '0.78rem' }}>
                        {hintsOpen ? 'Hide Hints' : `Show Hints (${selected.hints.length})`}
                      </button>
                      {hintsOpen && (
                        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', listStyle: 'disc' }}>
                          {selected.hints.map((hint, i) => (
                            <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', lineHeight: 1.6 }}>
                              {hint}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Prompt Input */}
                  <div className="form-group">
                    <label className="form-label">Your Prompt Solution</label>
                    <textarea className="form-textarea" placeholder="Write a prompt that solves this challenge..."
                      value={promptText} onChange={(e) => setPromptText(e.target.value)}
                      style={{ minHeight: '140px' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
                      <select className="form-input" value={model} onChange={(e) => setModel(e.target.value)}>
                        {MODELS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleSubmit}
                      disabled={submitting || !promptText.trim()}>
                      {submitting
                        ? <><span className="loading-spinner" /> Evaluating...</>
                        : 'Submit Solution'}
                    </button>
                  </div>
                </div>

                {error && <div className="error-box">{error}</div>}

                {/* Result Card */}
                {result && (
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Results</div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1, color: scoreColor(result.score) }}>
                        {result.score}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Score out of 100
                      </div>
                    </div>

                    {/* Parsed Feedback */}
                    {feedback && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        {feedback.criteria_met && feedback.criteria_met.length > 0 && (
                          <div>
                            <div style={{ ...sectionLabel, color: '#22c55e' }}>Criteria Met</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              {feedback.criteria_met.map((item, i) => (
                                <span key={i} className="badge badge-success" style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}>
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {feedback.criteria_missed && feedback.criteria_missed.length > 0 && (
                          <div>
                            <div style={{ ...sectionLabel, color: '#ef4444' }}>Criteria Missed</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              {feedback.criteria_missed.map((item, i) => (
                                <span key={i} className="badge badge-error" style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}>
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fallback raw evaluation */}
                    {!feedback && result.evaluation && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={sectionLabel}>Evaluation</div>
                        <div className="output-box"><FormattedOutput text={result.evaluation} /></div>
                      </div>
                    )}

                    {/* Actual Output */}
                    {result.output && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={sectionLabel}>Actual Output</div>
                        <div className="output-box"><FormattedOutput text={result.output} /></div>
                      </div>
                    )}

                    <div className="meta-row">
                      <div className="meta-item">Model: <strong>{result.model}</strong></div>
                      <div className="meta-item">Tokens: <strong>{result.tokens_input}</strong></div>
                      <div className="meta-item">Cost: <strong>${result.cost_estimate.toFixed(5)}</strong></div>
                      <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <h3>Select a Challenge</h3>
                  <p>Pick a challenge from the list to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
