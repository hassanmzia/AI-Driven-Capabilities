import React, { useState } from 'react';
import { executePromptGrader, executeCustomPrompt } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface GradeScores { [dim: string]: number }

interface SideResult {
  execution: ExecutionResult | null;
  grade: GradeScores | null;
  overallScore: number | null;
  raw: string;
}

const PRESET_EXAMPLES = [
  {
    label: 'Summarization: Vague vs Structured',
    before: 'Summarize this text.',
    after: 'You are a professional editor. Summarize the following text in exactly 3 bullet points, each under 20 words. Focus on key facts, omit opinions, and use active voice.',
    testInput: 'The company reported record Q3 earnings of $4.2B, beating analyst expectations by 12%. CEO Jane Smith attributed the growth to strong cloud adoption and a 35% increase in enterprise contracts. However, operating expenses rose 18% due to aggressive hiring in the AI division. The board approved a $500M share buyback program and raised the quarterly dividend by 8%.',
  },
  {
    label: 'Email Drafting: Casual vs Professional',
    before: 'Write an email to a customer about their late order.',
    after: 'You are a customer support specialist. Draft a professional, empathetic email to a customer whose order is delayed by 3 days. Include: an apology, a reason (supply chain delays), the new estimated delivery date, and a 15% discount code. Keep the tone warm but professional, under 150 words.',
    testInput: 'Customer: Sarah Johnson. Order #ORD-88421. Original delivery: Jan 15. Product: Wireless Noise-Cancelling Headphones. She has emailed twice asking for updates.',
  },
  {
    label: 'Code Review: Minimal vs Detailed',
    before: 'Review this code and find bugs.',
    after: 'You are a senior software engineer conducting a code review. Analyze the code for: 1) Bugs and logic errors, 2) Security vulnerabilities, 3) Performance issues, 4) Readability concerns. For each issue, specify the line, explain the problem, rate severity (critical/major/minor), and provide a corrected snippet.',
    testInput: 'function fetchUser(id) {\n  let data = fetch("/api/users/" + id);\n  if (data.status = 200) {\n    return JSON.parse(data);\n  }\n  return null;\n}\nconst admin = fetchUser(req.query.userId);\nconsole.log("Password:", admin.password);',
  },
];

function parseScores(output: string): { scores: GradeScores | null; overall: number | null } {
  try {
    let parsed: any = null;
    const trimmed = output.trim();
    try { parsed = JSON.parse(trimmed); } catch {
      const cb = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (cb) { parsed = JSON.parse(cb[1].trim()); }
      else {
        const first = trimmed.indexOf('{');
        const last = trimmed.lastIndexOf('}');
        if (first >= 0 && last > first) parsed = JSON.parse(trimmed.slice(first, last + 1));
      }
    }
    if (parsed && typeof parsed === 'object') {
      return { scores: parsed.scores || null, overall: parsed.overall_score ?? null };
    }
    return { scores: null, overall: null };
  } catch { return { scores: null, overall: null }; }
}

function ScoreBar({ label, before, after }: { label: string; before: number; after: number }) {
  const improved = after > before;
  const same = after === before;
  const afterColor = improved ? 'var(--success, #22c55e)' : same ? 'var(--warning, #eab308)' : 'var(--error, #ef4444)';
  return (
    <div style={{ marginBottom: '0.7rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
        <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {label.replace(/[_-]/g, ' ')}
        </span>
        <span>
          <span style={{ color: 'var(--text-muted)' }}>{before}</span>
          <span style={{ margin: '0 0.3rem', color: 'var(--text-muted)' }}>&rarr;</span>
          <span style={{ fontWeight: 700, color: afterColor }}>{after}</span>
          {improved && <span style={{ marginLeft: '0.3rem', color: 'var(--success, #22c55e)', fontSize: '0.72rem' }}>+{after - before}</span>}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '4px', height: '6px' }}>
        <div style={{ flex: 1, borderRadius: '3px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${before * 10}%`, borderRadius: '3px', background: 'var(--text-muted)', transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ flex: 1, borderRadius: '3px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${after * 10}%`, borderRadius: '3px', background: afterColor, transition: 'width 0.4s ease' }} />
        </div>
      </div>
    </div>
  );
}

function MetaRow({ result }: { result: ExecutionResult }) {
  return (
    <div className="meta-row">
      <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
      <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
      <div className="meta-item">Cost: <strong>${result.cost_estimate.toFixed(5)}</strong></div>
    </div>
  );
}

const EMPTY_SIDE: SideResult = { execution: null, grade: null, overallScore: null, raw: '' };

export const BeforeAfterComparator: React.FC = () => {
  const [beforePrompt, setBeforePrompt] = useState('');
  const [afterPrompt, setAfterPrompt] = useState('');
  const [testInput, setTestInput] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beforeResult, setBeforeResult] = useState<SideResult>(EMPTY_SIDE);
  const [afterResult, setAfterResult] = useState<SideResult>(EMPTY_SIDE);

  const canRun = beforePrompt.trim() && afterPrompt.trim() && testInput.trim() && !loading;

  const loadPreset = (index: number) => {
    const p = PRESET_EXAMPLES[index];
    if (!p) return;
    setBeforePrompt(p.before);
    setAfterPrompt(p.after);
    setTestInput(p.testInput);
    setBeforeResult(EMPTY_SIDE);
    setAfterResult(EMPTY_SIDE);
    setError(null);
  };

  const handleCompare = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setBeforeResult(EMPTY_SIDE);
    setAfterResult(EMPTY_SIDE);
    try {
      const [execBefore, execAfter] = await Promise.all([
        executeCustomPrompt({ user_prompt: beforePrompt + '\n\nInput:\n' + testInput, model }),
        executeCustomPrompt({ user_prompt: afterPrompt + '\n\nInput:\n' + testInput, model }),
      ]);
      const [gradeBefore, gradeAfter] = await Promise.all([
        executePromptGrader({ prompt_text: beforePrompt, model }),
        executePromptGrader({ prompt_text: afterPrompt, model }),
      ]);
      const pB = parseScores(gradeBefore.output);
      const pA = parseScores(gradeAfter.output);
      setBeforeResult({ execution: execBefore, grade: pB.scores, overallScore: pB.overall, raw: gradeBefore.output });
      setAfterResult({ execution: execAfter, grade: pA.scores, overallScore: pA.overall, raw: gradeAfter.output });
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const allDimensions = Array.from(new Set([
    ...Object.keys(beforeResult.grade || {}),
    ...Object.keys(afterResult.grade || {}),
  ]));
  const hasResults = beforeResult.execution && afterResult.execution;

  const scoreBadge = (score: number | null) => {
    if (score === null) return null;
    const cls = score >= 7 ? 'badge-success' : score >= 4 ? 'badge-warning' : 'badge-error';
    return <span className={`badge ${cls}`} style={{ fontSize: '1.1rem', padding: '0.35rem 0.8rem', fontWeight: 700 }}>{score}/10</span>;
  };

  const diffBadge = () => {
    const bS = beforeResult.overallScore;
    const aS = afterResult.overallScore;
    if (bS === null || aS === null) return null;
    const delta = aS - bS;
    const cls = delta > 0 ? 'badge-success' : delta === 0 ? 'badge-warning' : 'badge-error';
    const text = delta > 0 ? `+${delta.toFixed(1)} improvement` : delta === 0 ? 'No change' : `${delta.toFixed(1)} regression`;
    return <span className={`badge ${cls}`} style={{ marginLeft: 'auto', fontSize: '0.85rem', padding: '0.3rem 0.9rem' }}>{text}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h2>Before / After Comparator</h2>
        <p>Compare a bad prompt against an improved version -- see outputs and quality scores side by side</p>
      </div>

      {/* Configuration */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Configuration</div>
          <select
            className="btn btn-sm btn-secondary"
            style={{ marginLeft: 'auto', minWidth: '200px' }}
            defaultValue=""
            onChange={(e) => { if (e.target.value !== '') loadPreset(Number(e.target.value)); }}
          >
            <option value="" disabled>Load a preset example...</option>
            {PRESET_EXAMPLES.map((ex, i) => <option key={i} value={i}>{ex.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--error, #ef4444)' }}>Before (Original Prompt)</label>
            <textarea className="form-textarea" placeholder="Enter the original / bad prompt..." value={beforePrompt} onChange={(e) => setBeforePrompt(e.target.value)} style={{ minHeight: '110px' }} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--success, #22c55e)' }}>After (Improved Prompt)</label>
            <textarea className="form-textarea" placeholder="Enter the improved prompt..." value={afterPrompt} onChange={(e) => setAfterPrompt(e.target.value)} style={{ minHeight: '110px' }} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Test Input</label>
          <textarea className="form-textarea" placeholder="Enter the input data to run both prompts against..." value={testInput} onChange={(e) => setTestInput(e.target.value)} style={{ minHeight: '80px' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 240px' }}>
            <label className="form-label">Model</label>
            <select className="form-input" value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleCompare} disabled={!canRun}>
            {loading ? (<><span className="loading-spinner" /> Comparing...</>) : 'Compare'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card">
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Running both prompts and grading quality...</p>
          </div>
        </div>
      )}

      {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {hasResults && !loading && (
        <>
          {/* Outputs side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Before Output</div>
                {scoreBadge(beforeResult.overallScore)}
              </div>
              <div className="output-box"><FormattedOutput text={beforeResult.execution!.output} /></div>
              <MetaRow result={beforeResult.execution!} />
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">After Output</div>
                {scoreBadge(afterResult.overallScore)}
              </div>
              <div className="output-box"><FormattedOutput text={afterResult.execution!.output} /></div>
              <MetaRow result={afterResult.execution!} />
            </div>
          </div>

          {/* Score Comparison */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Quality Score Comparison</div>
              {diffBadge()}
            </div>
            {allDimensions.length > 0 ? (
              <div style={{ maxWidth: '600px' }}>
                {allDimensions.map((dim) => (
                  <ScoreBar key={dim} label={dim} before={(beforeResult.grade || {})[dim] ?? 0} after={(afterResult.grade || {})[dim] ?? 0} />
                ))}
              </div>
            ) : (
              <div className="output-box">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Before Grade (Raw)</div>
                    <FormattedOutput text={beforeResult.raw} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>After Grade (Raw)</div>
                    <FormattedOutput text={afterResult.raw} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!hasResults && !loading && !error && (
        <div className="card">
          <div className="empty-state">
            <h3>Ready to compare</h3>
            <p>Enter a before and after prompt pair, add test input, and click Compare to see the difference</p>
          </div>
        </div>
      )}
    </div>
  );
};
