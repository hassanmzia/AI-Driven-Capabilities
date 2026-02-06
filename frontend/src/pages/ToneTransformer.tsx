import React, { useState } from 'react';
import { executeToneTransformer } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface ToneData {
  transformed_text?: string;
  changes_made?: string[];
  readability_metrics?: {
    estimated_grade_level?: number;
    word_count?: number;
    sentence_count?: number;
    avg_words_per_sentence?: number;
  };
  tone_analysis?: {
    original_tone?: string;
    target_tone?: string;
    confidence?: number;
  };
}

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'technical', label: 'Technical' },
  { value: 'executive_summary', label: 'Executive Summary' },
  { value: 'eli5', label: 'ELI5' },
];

function parseOutput(output: string): ToneData | null {
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
    if (parsed && typeof parsed === 'object') return parsed as ToneData;
    return null;
  } catch {
    return null;
  }
}

function getConfidenceBadgeClass(confidence: number): string {
  if (confidence >= 0.8) return 'badge-success';
  if (confidence >= 0.5) return 'badge-warning';
  return 'badge-error';
}

function MetricCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
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

export const ToneTransformer: React.FC = () => {
  const [text, setText] = useState('');
  const [targetTone, setTargetTone] = useState('formal');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleExecute = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await executeToneTransformer({ text, target_tone: targetTone, model });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result ? parseOutput(result.output) : null;
  const toneLabel = TONE_OPTIONS.find((t) => t.value === targetTone)?.label || targetTone;

  return (
    <div>
      <div className="page-header">
        <h2>Tone & Style Transformer</h2>
        <p>Transform text into different tones and styles while preserving the original meaning</p>
      </div>

      {/* Input Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">Input</div>
        </div>
        <div className="form-group">
          <label className="form-label">Text to Transform</label>
          <textarea
            className="form-textarea"
            placeholder="Enter the text you want to transform into a different tone..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ minHeight: '160px' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Target Tone</label>
            <select className="form-select" value={targetTone} onChange={(e) => setTargetTone(e.target.value)}>
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !text.trim()}>
            {loading ? <><span className="loading-spinner" /> Transforming...</> : 'Transform Text'}
          </button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {loading && (
        <div className="card">
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Transforming your text...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className={`btn btn-sm ${showRaw ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setShowRaw(!showRaw)}>
              {showRaw ? 'Formatted' : 'Raw'}
            </button>
          </div>

          {showRaw ? (
            <div className="card">
              <div className="card-header"><div className="card-title">Raw Output</div></div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
              <MetaRow result={result} />
            </div>
          ) : parsed ? (
            <>
              {/* Side-by-side Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                  <div className="card-header"><div className="card-title">Original Text</div></div>
                  <div className="output-box" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: '1.7' }}>
                    {text}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Transformed Text</div>
                    <span className="badge badge-accent">{toneLabel}</span>
                  </div>
                  <div className="output-box" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: '1.7' }}>
                    {parsed.transformed_text || 'No transformed text available'}
                  </div>
                </div>
              </div>

              {/* Tone Analysis */}
              {parsed.tone_analysis && (
                <div className="card">
                  <div className="card-header"><div className="card-title">Tone Analysis</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '1rem 0' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Original Tone</div>
                      <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                        {parsed.tone_analysis.original_tone || 'Unknown'}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 700 }}>&rarr;</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Tone</div>
                      <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                        {parsed.tone_analysis.target_tone || targetTone}
                      </span>
                    </div>
                    {parsed.tone_analysis.confidence !== undefined && (
                      <div style={{ textAlign: 'center', marginLeft: '1.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</div>
                        <span className={`badge ${getConfidenceBadgeClass(parsed.tone_analysis.confidence)}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                          {Math.round(parsed.tone_analysis.confidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Readability Metrics */}
              {parsed.readability_metrics && (
                <div className="card">
                  <div className="card-header"><div className="card-title">Readability Metrics</div></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    <MetricCard value={parsed.readability_metrics.estimated_grade_level ?? 'N/A'} label="Grade Level" />
                    <MetricCard value={parsed.readability_metrics.word_count ?? 'N/A'} label="Word Count" />
                    <MetricCard value={parsed.readability_metrics.sentence_count ?? 'N/A'} label="Sentence Count" />
                    <MetricCard
                      value={parsed.readability_metrics.avg_words_per_sentence != null
                        ? parsed.readability_metrics.avg_words_per_sentence.toFixed(1) : 'N/A'}
                      label="Avg Words/Sentence"
                    />
                  </div>
                </div>
              )}

              {/* Changes Made */}
              {parsed.changes_made && parsed.changes_made.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Changes Made</div>
                    <span className="badge badge-accent">{parsed.changes_made.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {parsed.changes_made.map((change, i) => (
                      <div key={i} style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(99, 102, 241, 0.03)',
                        borderRadius: '0.375rem',
                        borderLeft: '3px solid var(--accent)',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        lineHeight: '1.6',
                      }}>
                        {change}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="card"><MetaRow result={result} /></div>
            </>
          ) : (
            <div className="card">
              <div className="card-header"><div className="card-title">Output</div></div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
              <MetaRow result={result} />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="card">
          <div className="empty-state">
            <h3>Ready to transform</h3>
            <p>Enter text and select a target tone to get started</p>
          </div>
        </div>
      )}
    </div>
  );
};
