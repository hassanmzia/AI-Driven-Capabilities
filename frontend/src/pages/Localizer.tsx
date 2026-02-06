import React, { useState } from 'react';
import { executeLocalizer } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface Adaptation { original: string; adapted: string; reason: string }

interface LocalizerOutput {
  localized_prompt: string;
  adaptations: Adaptation[];
  cultural_notes: string[];
  back_translation: string;
  confidence: number;
}

function getConfidenceBadgeClass(confidence: number): string {
  if (confidence >= 0.85) return 'badge-success';
  if (confidence >= 0.6) return 'badge-warning';
  return 'badge-error';
}

function parseLocalizerOutput(output: string): LocalizerOutput | null {
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
    if (parsed && typeof parsed === 'object') return parsed as LocalizerOutput;
    return null;
  } catch {
    return null;
  }
}

const LANGUAGE_OPTIONS = [
  'Spanish', 'French', 'German', 'Japanese', 'Chinese (Simplified)',
  'Arabic', 'Portuguese', 'Hindi', 'Korean', 'Italian',
];

const sectionLabel: React.CSSProperties = {
  fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)',
  marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em',
};

const subLabel: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)',
  textTransform: 'uppercase', marginBottom: '0.35rem',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600,
};

export const Localizer: React.FC = () => {
  const [promptText, setPromptText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [culturalContext, setCulturalContext] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleExecute = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executeLocalizer({
        prompt_text: promptText,
        target_language: targetLanguage,
        cultural_context: culturalContext || undefined,
        model,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Localization failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result ? parseLocalizerOutput(result.output) : null;

  const renderMeta = (r: ExecutionResult) => (
    <div className="meta-row" style={{ marginTop: '0.75rem' }}>
      <div className="meta-item">Model: <strong>{r.model}</strong></div>
      <div className="meta-item">Tokens In: <strong>{r.tokens_input}</strong></div>
      <div className="meta-item">Tokens Out: <strong>{r.tokens_output}</strong></div>
      <div className="meta-item">Cost: <strong>${r.cost_estimate.toFixed(5)}</strong></div>
      <div className="meta-item">Latency: <strong>{r.latency_ms}ms</strong></div>
      <div className="meta-item">
        <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>{r.execution_id}</span>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Multi-Language Prompt Localizer</h2>
        <p>Localize prompts for different languages and cultural contexts with back-translation verification</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Column - Input */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Input Configuration</div>
          </div>

          <div className="form-group">
            <label className="form-label">Prompt to Localize</label>
            <textarea
              className="form-textarea"
              placeholder="Enter the prompt you want to localize..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              style={{ minHeight: '150px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Language</label>
            <select className="form-select" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Cultural Context Notes (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Any cultural context or audience details to consider..."
              value={culturalContext}
              onChange={(e) => setCulturalContext(e.target.value)}
              style={{ minHeight: '70px' }}
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

          <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !promptText.trim()}>
            {loading ? (<><span className="loading-spinner" /> Localizing...</>) : 'Localize Prompt'}
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Localization Results</div>
            {result && parsed && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRaw(!showRaw)}>
                {showRaw ? 'Formatted' : 'Raw'}
              </button>
            )}
          </div>

          {error && <div className="error-box">{error}</div>}

          {loading && (
            <div className="empty-state">
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Localizing prompt to {targetLanguage}...</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="empty-state">
              <h3>No results yet</h3>
              <p>Enter a prompt, select a language, and click "Localize Prompt"</p>
            </div>
          )}

          {result && showRaw && (
            <div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
              {renderMeta(result)}
            </div>
          )}

          {result && !showRaw && parsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Confidence Badge */}
              {parsed.confidence !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    className={`badge ${getConfidenceBadgeClass(parsed.confidence)}`}
                    style={{ fontSize: '0.9rem', padding: '0.35rem 0.75rem', fontWeight: 600 }}
                  >
                    {Math.round(parsed.confidence * 100)}% Confidence
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Target: {targetLanguage}
                  </span>
                </div>
              )}

              {/* Side-by-Side Comparison */}
              <div>
                <div style={sectionLabel}>Prompt Comparison</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={subLabel}>Original (English)</div>
                    <div className="output-box" style={{ minHeight: '100px' }}>
                      <span style={{ whiteSpace: 'pre-wrap' }}>{promptText}</span>
                    </div>
                  </div>
                  <div>
                    <div style={subLabel}>Localized ({targetLanguage})</div>
                    <div className="output-box" style={{ minHeight: '100px', borderLeft: '3px solid var(--accent)' }}>
                      <span style={{ whiteSpace: 'pre-wrap' }}>{parsed.localized_prompt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Translation */}
              {parsed.back_translation && (
                <div>
                  <div style={sectionLabel}>Back Translation (Verification)</div>
                  <div className="output-box" style={{ borderLeft: '3px solid var(--border)', fontStyle: 'italic' }}>
                    <span style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                      {parsed.back_translation}
                    </span>
                  </div>
                </div>
              )}

              {/* Adaptations Table */}
              {parsed.adaptations && parsed.adaptations.length > 0 && (
                <div>
                  <div style={sectionLabel}>Adaptations</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                          <th style={thStyle}>Original</th>
                          <th style={thStyle}>Adapted</th>
                          <th style={thStyle}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.adaptations.map((adapt, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.5rem', color: 'var(--text-primary)' }}>{adapt.original}</td>
                            <td style={{ padding: '0.5rem', color: 'var(--accent)', fontWeight: 500 }}>{adapt.adapted}</td>
                            <td style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{adapt.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cultural Notes */}
              {parsed.cultural_notes && parsed.cultural_notes.length > 0 && (
                <div>
                  <div style={sectionLabel}>Cultural Notes</div>
                  <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', listStyle: 'disc' }}>
                    {parsed.cultural_notes.map((note, i) => (
                      <li key={i} style={{
                        marginBottom: '0.3rem', fontSize: '0.82rem',
                        color: 'var(--text-secondary)', lineHeight: '1.6',
                      }}>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {renderMeta(result)}
            </div>
          )}

          {/* Fallback: raw output if JSON parsing fails */}
          {result && !showRaw && !parsed && (
            <div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
              {renderMeta(result)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
