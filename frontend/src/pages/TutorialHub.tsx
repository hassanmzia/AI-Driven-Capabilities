import React, { useState, useEffect } from 'react';
import { getTutorials, completeTutorial, seedPlatformData, executeCustomPrompt } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { Tutorial, ExecutionResult } from '../types';

function getOrCreateSessionId(): string {
  let sid = localStorage.getItem('session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('session_id', sid);
  }
  return sid;
}

const difficultyBadge = (d: string): string => {
  switch (d.toLowerCase()) {
    case 'beginner': return 'badge-success';
    case 'intermediate': return 'badge-warning';
    case 'advanced': return 'badge-error';
    default: return 'badge-accent';
  }
};

export const TutorialHub: React.FC = () => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [selected, setSelected] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [sandboxPrompt, setSandboxPrompt] = useState('');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState('');
  const [marking, setMarking] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [sessionId] = useState<string>(getOrCreateSessionId);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        let data = await getTutorials();
        let list = data.results || [];
        if (list.length === 0) {
          await seedPlatformData();
          data = await getTutorials();
          list = data.results || [];
        }
        if (!cancelled) {
          list.sort((a, b) => a.order - b.order);
          setTutorials(list);
          if (list.length > 0) {
            setSelected(list[0]);
            setSandboxPrompt(list[0].example_prompt || '');
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load tutorials');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const completedCount = completedIds.size;
  const totalCount = tutorials.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const categories = Array.from(new Set(tutorials.map(t => t.category))).sort();
  const filtered = filterCategory ? tutorials.filter(t => t.category === filterCategory) : tutorials;

  const handleSelect = (t: Tutorial) => {
    setSelected(t);
    setSandboxPrompt(t.example_prompt || '');
    setExecutionResult(null);
    setExecutionError('');
  };

  const handleExecute = async () => {
    if (!sandboxPrompt.trim()) return;
    setExecuting(true);
    setExecutionResult(null);
    setExecutionError('');
    try {
      const result = await executeCustomPrompt({ user_prompt: sandboxPrompt });
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionError(err?.response?.data?.error || err?.message || 'Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!selected) return;
    setMarking(true);
    try {
      await completeTutorial(selected.id, sessionId);
      setCompletedIds(prev => new Set(prev).add(selected.id));
    } catch (err: any) {
      setExecutionError(err?.response?.data?.error || err?.message || 'Failed to mark complete');
    } finally {
      setMarking(false);
    }
  };

  const renderContent = (content: string) => content.split('\n').map((line, i) => {
    const t = line.trim();
    if (t === '') return <div key={i} style={{ height: '0.5rem' }} />;
    if (t.startsWith('### '))
      return <h4 key={i} style={{ margin: '0.75rem 0 0.35rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{t.slice(4)}</h4>;
    if (t.startsWith('## '))
      return <h3 key={i} style={{ margin: '0.75rem 0 0.35rem', color: 'var(--accent)', fontSize: '0.95rem' }}>{t.slice(3)}</h3>;
    if (t.startsWith('# '))
      return <h2 key={i} style={{ margin: '0.75rem 0 0.35rem', color: 'var(--text-primary)', fontSize: '1.05rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.3rem' }}>{t.slice(2)}</h2>;
    if (t.startsWith('- ') || t.startsWith('* '))
      return <div key={i} style={{ paddingLeft: '1rem', position: 'relative', lineHeight: '1.7', fontSize: '0.85rem' }}><span style={{ position: 'absolute', left: '0.2rem' }}>&#8226;</span>{t.slice(2)}</div>;
    if (/^\d+[.)]\s/.test(t)) {
      const m = t.match(/^(\d+[.)]\s)(.*)/);
      return <div key={i} style={{ paddingLeft: '1rem', lineHeight: '1.7', fontSize: '0.85rem' }}><strong>{m?.[1]}</strong>{m?.[2]}</div>;
    }
    if (t.startsWith('```'))
      return <div key={i} style={{ borderTop: '1px solid var(--border)', margin: '0.35rem 0' }} />;
    if (t.startsWith('> '))
      return <div key={i} style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem', margin: '0.35rem 0' }}>{t.slice(2)}</div>;
    return <p key={i} style={{ margin: '0.2rem 0', lineHeight: '1.7', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{t}</p>;
  });

  if (loading) return (
    <div>
      <div className="page-header"><h2>Tutorial Hub</h2><p>Interactive prompt engineering tutorials</p></div>
      <div className="empty-state"><div className="loading-spinner" /></div>
    </div>
  );

  if (error) return (
    <div>
      <div className="page-header"><h2>Tutorial Hub</h2><p>Interactive prompt engineering tutorials</p></div>
      <div className="error-box">{error}</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Tutorial Hub</h2>
        <p>Interactive prompt engineering tutorials with a live sandbox</p>
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            Progress: {completedCount} / {totalCount} tutorials completed
          </span>
          <span className="badge badge-accent">{progressPct}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--bg-card)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Category Filters */}
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${!filterCategory ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterCategory('')}>All</button>
          {categories.map(cat => (
            <button key={cat} className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterCategory(cat)}>{cat}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No tutorials available</h3>
          <p>Tutorials could not be loaded. Try refreshing the page.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Panel: Tutorial List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 'calc(100vh - 14rem)', overflowY: 'auto' }}>
            {filtered.map(tutorial => {
              const isActive = selected?.id === tutorial.id;
              const done = completedIds.has(tutorial.id);
              return (
                <div key={tutorial.id} className="card" onClick={() => handleSelect(tutorial)} style={{
                  padding: '0.75rem 1rem', cursor: 'pointer',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  background: isActive ? 'var(--bg-card)' : undefined,
                  opacity: done ? 0.85 : 1, transition: 'border-color 0.2s ease',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {done && <span style={{ color: 'var(--success)', marginRight: '0.35rem' }}>&#10003;</span>}
                      {tutorial.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span className={`badge ${difficultyBadge(tutorial.difficulty)}`} style={{ fontSize: '0.7rem' }}>{tutorial.difficulty}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{tutorial.category}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Panel */}
          {selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Tutorial Content Card */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">{selected.title}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', alignItems: 'center' }}>
                      <span className={`badge ${difficultyBadge(selected.difficulty)}`}>{selected.difficulty}</span>
                      <span className="badge badge-accent">{selected.category}</span>
                      {completedIds.has(selected.id) && <span className="badge badge-success">Completed</span>}
                    </div>
                  </div>
                  {!completedIds.has(selected.id) && (
                    <button className="btn btn-primary btn-sm" onClick={handleMarkComplete} disabled={marking}>
                      {marking ? 'Marking...' : 'Mark Complete'}
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.75rem 0' }}>
                  {selected.description}
                </p>

                <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '0.5rem', border: '1px solid var(--border)', maxHeight: '400px', overflowY: 'auto' }}>
                  {renderContent(selected.content)}
                </div>

                {selected.example_input && (
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Example Input</label>
                    <div className="output-box" style={{ fontSize: '0.8rem', maxHeight: '120px' }}>{selected.example_input}</div>
                  </div>
                )}
              </div>

              {/* Sandbox Card */}
              {selected.sandbox_enabled !== false && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Prompt Sandbox</div>
                    <button className="btn btn-primary btn-sm" onClick={handleExecute} disabled={executing || !sandboxPrompt.trim()}>
                      {executing ? 'Executing...' : 'Execute'}
                    </button>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label">Try your own prompt</label>
                    <textarea className="form-textarea" rows={5} value={sandboxPrompt}
                      onChange={e => setSandboxPrompt(e.target.value)}
                      placeholder="Enter a prompt to test what you learned in this tutorial..."
                      style={{ fontSize: '0.85rem' }} />
                  </div>

                  {selected.example_prompt && sandboxPrompt !== selected.example_prompt && (
                    <button className="btn btn-secondary btn-sm" style={{ marginBottom: '0.75rem' }}
                      onClick={() => setSandboxPrompt(selected.example_prompt)}>Reset to Example Prompt</button>
                  )}

                  {executing && (
                    <div className="empty-state" style={{ padding: '2rem 0' }}><div className="loading-spinner" /></div>
                  )}

                  {executionError && <div className="error-box" style={{ marginTop: '0.75rem' }}>{executionError}</div>}

                  {executionResult && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="output-box"><FormattedOutput text={executionResult.output} /></div>
                      <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                        <div className="meta-item">Model: <strong>{executionResult.model}</strong></div>
                        <div className="meta-item">Latency: <strong>{executionResult.latency_ms}ms</strong></div>
                        <div className="meta-item">Tokens: <strong>{executionResult.tokens_input + executionResult.tokens_output}</strong></div>
                        <div className="meta-item">Cost: <strong>${executionResult.cost_estimate.toFixed(4)}</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Select a tutorial</h3>
              <p>Choose a tutorial from the list on the left to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
