import React, { useState } from 'react';
import { executeInjectionTester } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface Vulnerability {
  category: string;
  severity: string;
  description: string;
  attack_example: string;
  mitigation: string;
}

interface ScanResult {
  overall_risk: string;
  risk_score: number;
  vulnerabilities: Vulnerability[];
  hardened_prompt: string;
  recommendations: string[];
}

const EXAMPLE_PROMPT =
  'You are a helpful customer service agent for TechCorp. Answer questions about our products and services. Be polite and professional.';

const severityBadge = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'low':
      return 'badge-success';
    case 'medium':
      return 'badge-warning';
    case 'high':
    case 'critical':
      return 'badge-error';
    default:
      return 'badge-warning';
  }
};

const riskBadge = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'low':
      return 'badge-success';
    case 'medium':
      return 'badge-warning';
    case 'high':
      return 'badge-error';
    case 'critical':
      return 'badge-error';
    default:
      return 'badge-warning';
  }
};

function tryParseScanResult(output: string): ScanResult | null {
  try {
    const parsed = JSON.parse(output);
    if (parsed && typeof parsed.overall_risk === 'string' && Array.isArray(parsed.vulnerabilities)) {
      return parsed as ScanResult;
    }
    return null;
  } catch {
    // Try extracting JSON from markdown code blocks or embedded JSON
    const codeBlockMatch = output.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        if (parsed && typeof parsed.overall_risk === 'string') return parsed as ScanResult;
      } catch {
        // fall through
      }
    }
    // Try finding embedded JSON object
    const firstBrace = output.indexOf('{');
    const lastBrace = output.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        const parsed = JSON.parse(output.slice(firstBrace, lastBrace + 1));
        if (parsed && typeof parsed.overall_risk === 'string') return parsed as ScanResult;
      } catch {
        // fall through
      }
    }
    return null;
  }
}

export const InjectionTester: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!systemPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executeInjectionTester({ system_prompt: systemPrompt, model });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const scanResult: ScanResult | null = result?.output ? tryParseScanResult(result.output) : null;

  return (
    <div>
      <div className="page-header">
        <h2>Prompt Injection Tester</h2>
        <p>Red-team your system prompts against injection attacks and get hardened versions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Column - Input */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Security Scan Configuration</div>

          <div className="form-group">
            <label className="form-label">System Prompt to Test</label>
            <textarea
              className="form-textarea"
              placeholder="Paste your production system prompt here..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={{ minHeight: '200px' }}
            />
            <div style={{ marginTop: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSystemPrompt(EXAMPLE_PROMPT)}
              >
                Load Example
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Model</label>
            <select
              className="form-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={loading || !systemPrompt.trim()}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" /> Scanning...
              </>
            ) : (
              'Run Security Scan'
            )}
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Scan Results</div>

          {error && <div className="error-box">{error}</div>}

          {loading && (
            <div className="empty-state">
              <div className="loading-spinner" />
              <p style={{ marginTop: '0.75rem' }}>Running injection security scan...</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="empty-state">
              <h3>No scan results yet</h3>
              <p>Enter a system prompt and run a security scan to see vulnerability analysis</p>
            </div>
          )}

          {result && scanResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Risk Score Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--bg-input)',
                  borderRadius: '0.5rem',
                }}
              >
                <span
                  className={`badge ${riskBadge(scanResult.overall_risk)}`}
                  style={{
                    fontSize: '1.1rem',
                    padding: '0.5rem 1rem',
                    fontWeight: scanResult.overall_risk.toLowerCase() === 'critical' ? 800 : 600,
                  }}
                >
                  {scanResult.overall_risk.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {scanResult.risk_score}/10
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Risk Score</span>
              </div>

              {/* Vulnerabilities */}
              {scanResult.vulnerabilities && scanResult.vulnerabilities.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Vulnerabilities ({scanResult.vulnerabilities.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {scanResult.vulnerabilities.map((vuln, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.75rem',
                          background: 'rgba(99, 102, 241, 0.03)',
                          borderRadius: '0.5rem',
                          borderLeft: '3px solid var(--border)',
                        }}
                      >
                        {/* Header: category + severity badges */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <span className="badge badge-accent">{vuln.category}</span>
                          <span className={`badge ${severityBadge(vuln.severity)}`}>
                            {vuln.severity}
                          </span>
                        </div>

                        {/* Description */}
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                            marginBottom: '0.5rem',
                            lineHeight: '1.6',
                          }}
                        >
                          {vuln.description}
                        </div>

                        {/* Attack Example */}
                        {vuln.attack_example && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: '0.25rem',
                              }}
                            >
                              Attack Example
                            </div>
                            <div
                              style={{
                                background: 'var(--bg-input)',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.375rem',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.5',
                              }}
                            >
                              {vuln.attack_example}
                            </div>
                          </div>
                        )}

                        {/* Mitigation */}
                        {vuln.mitigation && (
                          <div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: '0.25rem',
                              }}
                            >
                              Mitigation
                            </div>
                            <div
                              style={{
                                fontSize: '0.82rem',
                                color: '#4ade80',
                                lineHeight: '1.6',
                              }}
                            >
                              {vuln.mitigation}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hardened Prompt */}
              {scanResult.hardened_prompt && (
                <div>
                  <details>
                    <summary
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Hardened Prompt
                    </summary>
                    <div
                      className="output-box"
                      style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}
                    >
                      {scanResult.hardened_prompt}
                    </div>
                  </details>
                </div>
              )}

              {/* Recommendations */}
              {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Recommendations
                  </div>
                  <ul
                    style={{
                      paddingLeft: '1.25rem',
                      margin: '0.25rem 0',
                      listStyle: 'disc',
                    }}
                  >
                    {scanResult.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                          marginBottom: '0.3rem',
                          lineHeight: '1.6',
                        }}
                      >
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meta Row */}
              {result && (
                <div className="meta-row" style={{ marginTop: '0.5rem' }}>
                  <div className="meta-item">
                    Model: <strong>{result.model}</strong>
                  </div>
                  <div className="meta-item">
                    Tokens In: <strong>{result.tokens_input}</strong>
                  </div>
                  <div className="meta-item">
                    Tokens Out: <strong>{result.tokens_output}</strong>
                  </div>
                  <div className="meta-item">
                    Cost: <strong>${Number(result.cost_estimate).toFixed(5)}</strong>
                  </div>
                  <div className="meta-item">
                    Latency: <strong>{result.latency_ms}ms</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback: result exists but could not be parsed as ScanResult */}
          {result && !scanResult && (
            <div>
              <div className="output-box">
                <FormattedOutput text={result.output} />
              </div>
              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">
                  Model: <strong>{result.model}</strong>
                </div>
                <div className="meta-item">
                  Tokens In: <strong>{result.tokens_input}</strong>
                </div>
                <div className="meta-item">
                  Tokens Out: <strong>{result.tokens_output}</strong>
                </div>
                <div className="meta-item">
                  Cost: <strong>${Number(result.cost_estimate).toFixed(5)}</strong>
                </div>
                <div className="meta-item">
                  Latency: <strong>{result.latency_ms}ms</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
