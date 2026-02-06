import React, { useState } from 'react';
import { runCostOptimizer } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface OptimizationItem {
  type: string;
  original: string;
  optimized: string;
  tokens_saved: number;
}

interface CostAnalysis {
  original_estimated_tokens?: number;
  optimized_prompt?: string;
  optimized_estimated_tokens?: number;
  savings_percent?: number;
  optimizations?: OptimizationItem[];
  tips?: string[];
}

function parseJSON(raw: string): CostAnalysis | null {
  try {
    const trimmed = raw.trim();
    let parsed = null;
    try { parsed = JSON.parse(trimmed); } catch {
      const cb = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (cb) { parsed = JSON.parse(cb[1].trim()); }
      else {
        const f = trimmed.indexOf('{'), l = trimmed.lastIndexOf('}');
        if (f >= 0 && l > f) parsed = JSON.parse(trimmed.slice(f, l + 1));
      }
    }
    return parsed && typeof parsed === 'object' ? parsed as CostAnalysis : null;
  } catch { return null; }
}

function getSavingsBadge(pct: number): string {
  if (pct >= 30) return 'badge-success';
  if (pct >= 15) return 'badge-warning';
  return 'badge-error';
}

function TokenBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.82rem' }}>
        <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value.toLocaleString()} tokens</span>
      </div>
      <div style={{ width: '100%', height: 10, background: 'var(--bg-secondary)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 5, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export const CostOptimizer: React.FC = () => {
  const [promptText, setPromptText] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = promptText.trim() && !loading;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await runCostOptimizer({
        prompt_text: promptText,
        system_prompt: systemPrompt || undefined,
        model,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Cost analysis failed');
    } finally { setLoading(false); }
  };

  const analysis: CostAnalysis | null = result ? parseJSON(result.output) : null;
  const origTokens = analysis?.original_estimated_tokens ?? 0;
  const optTokens = analysis?.optimized_estimated_tokens ?? 0;
  const savings = analysis?.savings_percent ?? 0;
  const tokenMax = Math.max(origTokens, optTokens, 1);

  return (
    <div>
      <div className="page-header">
        <h2>Cost Optimizer</h2>
        <p>Analyze your prompts for token waste and get optimized alternatives to reduce API costs</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Input */}
        <div className="card">
          <div className="card-header"><div className="card-title">Input</div></div>

          <div className="form-group">
            <label className="form-label">Prompt to Analyze</label>
            <textarea className="form-textarea" placeholder="Enter the prompt you want to optimize for cost..."
              value={promptText} onChange={(e) => setPromptText(e.target.value)} style={{ minHeight: '160px' }} />
          </div>

          <div className="form-group">
            <label className="form-label">System Prompt (optional)</label>
            <textarea className="form-textarea" placeholder="Enter a system prompt if applicable..."
              value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} style={{ minHeight: '80px' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Model</label>
            <select className="form-select" value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleAnalyze} disabled={!canAnalyze}>
            {loading ? <><span className="loading-spinner" /> Analyzing...</> : 'Analyze'}
          </button>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading && (
            <div className="card">
              <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                <p>Analyzing prompt for token waste...</p>
              </div>
            </div>
          )}

          {error && !loading && <div className="error-box">{error}</div>}

          {result && !loading && analysis && (
            <>
              {/* Savings Overview */}
              <div className="card">
                <div className="card-header"><div className="card-title">Savings Overview</div></div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1.25rem', marginBottom: '1rem', background: 'rgba(99,102,241,0.04)', borderRadius: '0.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span className={`badge ${getSavingsBadge(savings)}`}
                      style={{ fontSize: '2rem', padding: '0.6rem 1.5rem', fontWeight: 700 }}>
                      {savings}% Saved
                    </span>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      Estimated token reduction
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Token Comparison
                </div>
                <TokenBar label="Original" value={origTokens} max={tokenMax} color="#ef4444" />
                <TokenBar label="Optimized" value={optTokens} max={tokenMax} color="#22c55e" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
                  <span>Tokens saved: <strong>{(origTokens - optTokens).toLocaleString()}</strong></span>
                  <span>Reduction: <strong>{savings}%</strong></span>
                </div>
                <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                  <div className="meta-item">Model: <strong>{result.model}</strong></div>
                  <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
                  <div className="meta-item">Cost: <strong>${Number(result.cost_estimate).toFixed(5)}</strong></div>
                  <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
                </div>
              </div>

              {/* Optimized Prompt */}
              {analysis.optimized_prompt && (
                <div className="card">
                  <div className="card-header"><div className="card-title">Optimized Prompt</div></div>
                  <div className="form-group">
                    <textarea className="form-textarea" value={analysis.optimized_prompt} readOnly
                      style={{ minHeight: '140px', background: 'var(--bg-secondary)', cursor: 'default', fontSize: '0.85rem', lineHeight: '1.6' }} />
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}
                    onClick={() => { if (analysis.optimized_prompt) navigator.clipboard.writeText(analysis.optimized_prompt); }}>
                    Copy Optimized Prompt
                  </button>
                </div>
              )}

              {/* Optimizations List */}
              {analysis.optimizations && analysis.optimizations.length > 0 && (
                <div className="card">
                  <div className="card-header"><div className="card-title">Optimizations Applied</div></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {analysis.optimizations.map((opt, i) => (
                      <div key={i} style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.03)', borderRadius: '0.375rem', borderLeft: '3px solid var(--accent, #6366f1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{opt.type}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#22c55e' }}>-{opt.tokens_saved} tokens</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                          <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.08)', borderRadius: '0.25rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                            {opt.original}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '1rem', paddingTop: '0.3rem' }}>&rarr;</div>
                          <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(34,197,94,0.08)', borderRadius: '0.25rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                            {opt.optimized}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {analysis.tips && analysis.tips.length > 0 && (
                <div className="card">
                  <div className="card-header"><div className="card-title">Cost-Saving Tips</div></div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {analysis.tips.map((tip, i) => (
                      <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Fallback raw output */}
          {result && !loading && !analysis && (
            <div className="card">
              <div className="card-header"><div className="card-title">Analysis Results</div></div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
              <div className="meta-row">
                <div className="meta-item">Model: <strong>{result.model}</strong></div>
                <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
                <div className="meta-item">Cost: <strong>${Number(result.cost_estimate).toFixed(5)}</strong></div>
                <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="card">
              <div className="empty-state">
                <h3>Ready to optimize</h3>
                <p>Enter a prompt and click Analyze to identify token waste and get a leaner version</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
