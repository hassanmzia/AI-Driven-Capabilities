import React, { useState } from 'react';
import { executeComplianceChecker } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface ScorecardItem {
  rule_id: string;
  rule: string;
  status: string;
  evidence: string;
  recommendation: string;
}

interface ComplianceData {
  overall_status?: string;
  compliance_score?: number;
  rules_checked?: number;
  rules_passed?: number;
  scorecard?: ScorecardItem[];
  critical_issues?: string[];
  summary?: string;
}

function parseComplianceOutput(output: string): ComplianceData | null {
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
    if (parsed && typeof parsed === 'object') return parsed as ComplianceData;
    return null;
  } catch {
    return null;
  }
}

function getStatusBadgeClass(status: string): string {
  const n = status.toLowerCase().replace(/\s+/g, '_');
  if (n === 'compliant' || n === 'pass' || n === 'passed') return 'badge-success';
  if (n === 'partially_compliant' || n === 'partial') return 'badge-warning';
  if (n === 'non_compliant' || n === 'fail' || n === 'failed') return 'badge-error';
  return 'badge-accent';
}

function getStatusLabel(status: string): string {
  const n = status.toLowerCase().replace(/\s+/g, '_');
  if (n === 'compliant') return 'Compliant';
  if (n === 'partially_compliant') return 'Partially Compliant';
  if (n === 'non_compliant') return 'Non-Compliant';
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

function MetaRow({ result }: { result: ExecutionResult }) {
  return (
    <div className="meta-row">
      <div className="meta-item">Model: <strong>{result.model}</strong></div>
      <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
      <div className="meta-item">Cost: <strong>${result.cost_estimate.toFixed(5)}</strong></div>
      <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
    </div>
  );
}

export const ComplianceChecker: React.FC = () => {
  const [policyText, setPolicyText] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleExecute = async () => {
    if (!policyText.trim() || !documentText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowRaw(false);
    try {
      const res = await executeComplianceChecker({
        policy_text: policyText,
        document_text: documentText,
        model,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Compliance check failed');
    } finally {
      setLoading(false);
    }
  };

  const complianceData = result ? parseComplianceOutput(result.output) : null;
  const score = complianceData?.compliance_score ?? 0;
  const scoreColor = getScoreColor(score);

  const thStyle: React.CSSProperties = {
    padding: '0.6rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600,
  };

  return (
    <div>
      <div className="page-header">
        <h2>Compliance Checker</h2>
        <p>Validate documents against policies and SOPs with detailed rule-by-rule scoring</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        {/* Left Column: Input */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Input</div>
            </div>
            <div className="form-group">
              <label className="form-label">Policy / SOP Text</label>
              <textarea
                className="form-textarea"
                placeholder="Paste the policy, standard operating procedure, or regulatory rules to check against..."
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                style={{ minHeight: '160px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Document to Check</label>
              <textarea
                className="form-textarea"
                placeholder="Paste the document, report, or content to check for compliance..."
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                style={{ minHeight: '160px' }}
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
              disabled={loading || !policyText.trim() || !documentText.trim()}
              style={{ width: '100%' }}
            >
              {loading ? (
                <><span className="loading-spinner" /> Checking Compliance...</>
              ) : 'Check Compliance'}
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && <div className="error-box">{error}</div>}

          {loading && (
            <div className="card">
              <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                <h3>Analyzing Compliance</h3>
                <p>Checking document against policy rules...</p>
              </div>
            </div>
          )}

          {result && !loading && complianceData && !showRaw && (
            <>
              {/* Overall Status & Score */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Compliance Result</div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowRaw(true)}>
                    Show Raw
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '90px', height: '90px', borderRadius: '50%',
                    border: `4px solid ${scoreColor}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                      {score}%
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      score
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    {complianceData.overall_status && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span
                          className={`badge ${getStatusBadgeClass(complianceData.overall_status)}`}
                          style={{ fontSize: '0.9rem', padding: '0.35rem 0.75rem', fontWeight: 600 }}
                        >
                          {getStatusLabel(complianceData.overall_status)}
                        </span>
                      </div>
                    )}
                    {complianceData.rules_checked !== undefined && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Rules Passed: <strong style={{ color: 'var(--text-primary)' }}>
                          {complianceData.rules_passed ?? 0}</strong> / {complianceData.rules_checked}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  width: '100%', height: '8px', background: 'var(--bg-secondary)',
                  borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem',
                }}>
                  <div style={{
                    width: `${Math.min(100, score)}%`, height: '100%',
                    background: scoreColor, borderRadius: '4px', transition: 'width 0.5s ease',
                  }} />
                </div>
                <MetaRow result={result} />
              </div>

              {/* Critical Issues */}
              {complianceData.critical_issues && complianceData.critical_issues.length > 0 && (
                <div className="card" style={{ borderColor: 'var(--error)', background: 'rgba(239, 68, 68, 0.04)' }}>
                  <div className="card-header">
                    <div className="card-title" style={{ color: '#ef4444' }}>Critical Issues</div>
                    <span className="badge badge-error">{complianceData.critical_issues.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {complianceData.critical_issues.map((issue, idx) => (
                      <div key={idx} style={{
                        padding: '0.6rem 0.75rem', background: 'rgba(239, 68, 68, 0.06)',
                        borderRadius: '0.375rem', borderLeft: '3px solid #ef4444',
                        fontSize: '0.85rem', color: 'var(--text-primary)',
                      }}>
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scorecard Table */}
              {complianceData.scorecard && complianceData.scorecard.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Rule Scorecard</div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={thStyle}>Rule</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                          <th style={thStyle}>Evidence</th>
                          <th style={thStyle}>Recommendation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complianceData.scorecard.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-primary)' }}>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginRight: '0.4rem' }}>
                                {item.rule_id}
                              </span>
                              {item.rule}
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                              <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </span>
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)', maxWidth: '220px' }}>
                              {item.evidence}
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '220px' }}>
                              {item.recommendation}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary */}
              {complianceData.summary && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Summary</div>
                  </div>
                  <div style={{
                    padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem',
                    fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6',
                  }}>
                    {complianceData.summary}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Raw output view */}
          {result && !loading && showRaw && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Raw Output</div>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowRaw(false)}>
                  Show Formatted
                </button>
              </div>
              <div className="output-box">
                <FormattedOutput text={result.output} />
              </div>
              <MetaRow result={result} />
            </div>
          )}

          {/* Fallback if JSON parsing fails */}
          {result && !loading && !complianceData && !showRaw && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Compliance Output</div>
              </div>
              <div className="output-box">
                <FormattedOutput text={result.output} />
              </div>
              <MetaRow result={result} />
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="card">
              <div className="empty-state">
                <h3>Compliance Checker Ready</h3>
                <p>
                  Paste your policy or SOP on the left, add the document to check,
                  and click "Check Compliance" to get a detailed rule-by-rule scorecard.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
