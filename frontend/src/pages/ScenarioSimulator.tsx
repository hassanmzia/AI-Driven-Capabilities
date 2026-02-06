import React, { useState } from 'react';
import { executeScenarioSimulator } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface StakeholderReaction {
  role: string;
  reaction: string;
  concerns: string[];
  support_level: string;
  conditions: string;
}

interface SimulatorOutput {
  stakeholder_reactions: StakeholderReaction[];
  overall_viability: string;
  critical_risks: string[];
  recommended_modifications: string[];
  consensus_path: string;
}

function tryParseSimulatorOutput(output: string): SimulatorOutput | null {
  try {
    const parsed = JSON.parse(output);
    if (parsed && Array.isArray(parsed.stakeholder_reactions)) return parsed as SimulatorOutput;
    return null;
  } catch {
    const codeBlock = output.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlock) {
      try {
        const parsed = JSON.parse(codeBlock[1].trim());
        if (parsed && Array.isArray(parsed.stakeholder_reactions)) return parsed as SimulatorOutput;
      } catch { /* fall through */ }
    }
    const firstBrace = output.indexOf('{');
    const lastBrace = output.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        const parsed = JSON.parse(output.slice(firstBrace, lastBrace + 1));
        if (parsed && Array.isArray(parsed.stakeholder_reactions)) return parsed as SimulatorOutput;
      } catch { /* fall through */ }
    }
    return null;
  }
}

function getSupportBadge(level: string): { cls: string; label: string } {
  switch (level.toLowerCase().replace(/\s+/g, '_')) {
    case 'strongly_support': return { cls: 'badge-success', label: 'Strongly Support' };
    case 'support': return { cls: 'badge-success', label: 'Support' };
    case 'neutral': return { cls: 'badge-warning', label: 'Neutral' };
    case 'oppose': return { cls: 'badge-error', label: 'Oppose' };
    case 'strongly_oppose': return { cls: 'badge-error', label: 'Strongly Oppose' };
    default: return { cls: 'badge-warning', label: level };
  }
}

function getViabilityBadge(level: string): string {
  switch (level.toLowerCase()) {
    case 'high': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'low': return 'badge-error';
    default: return 'badge-warning';
  }
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.35rem',
};

const listStyle: React.CSSProperties = { paddingLeft: '1.25rem', margin: 0, listStyle: 'disc' };
const listItem: React.CSSProperties = {
  fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.35rem', lineHeight: '1.6',
};

export const ScenarioSimulator: React.FC = () => {
  const [plan, setPlan] = useState('');
  const [stakeholders, setStakeholders] = useState<string[]>(['CEO', 'Engineering Lead', 'End User']);
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleExecute = async () => {
    const validStakeholders = stakeholders.filter((s) => s.trim());
    if (!plan.trim() || validStakeholders.length < 2) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await executeScenarioSimulator({ plan, stakeholders: validStakeholders, model });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const updateStakeholder = (i: number, val: string) => {
    const updated = [...stakeholders];
    updated[i] = val;
    setStakeholders(updated);
  };

  const canRun = plan.trim() && stakeholders.filter((s) => s.trim()).length >= 2 && !loading;
  const simOutput = result?.output ? tryParseSimulatorOutput(result.output) : null;

  return (
    <div>
      <div className="page-header">
        <h2>Scenario Simulator</h2>
        <p>Simulate stakeholder reactions to plans and proposals with multi-perspective analysis</p>
      </div>

      {/* Input */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Simulation Configuration</div>
        </div>
        <div className="form-group">
          <label className="form-label">Plan / Proposal</label>
          <textarea
            className="form-textarea"
            placeholder="Describe your plan, proposal, or initiative to simulate stakeholder reactions..."
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            style={{ minHeight: '140px' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Stakeholder Roles</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stakeholders.map((role, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text" className="form-input" style={{ flex: 1 }}
                  placeholder={`Stakeholder role ${i + 1}...`}
                  value={role} onChange={(e) => updateStakeholder(i, e.target.value)}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setStakeholders(stakeholders.filter((_, j) => j !== i))}
                  disabled={stakeholders.length <= 2}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setStakeholders([...stakeholders, ''])}
            style={{ marginTop: '0.5rem' }}>
            Add Stakeholder
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 260px' }}>
            <label className="form-label">Model</label>
            <select className="form-select" value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleExecute} disabled={!canRun}>
            {loading ? <><span className="loading-spinner" /> Simulating...</> : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <h3>Running Simulation</h3>
            <p>Analyzing stakeholder perspectives and generating reactions...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Results */}
      {result && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowRaw(!showRaw)}>
              {showRaw ? 'Formatted View' : 'Raw Output'}
            </button>
          </div>

          {showRaw ? (
            <div className="card">
              <div className="card-header"><div className="card-title">Raw Output</div></div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
            </div>
          ) : simOutput ? (
            <>
              {/* Overall Viability */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Overall Viability:
                  </span>
                  <span
                    className={`badge ${getViabilityBadge(simOutput.overall_viability)}`}
                    style={{ fontSize: '1rem', padding: '0.4rem 1.2rem', fontWeight: 700 }}
                  >
                    {simOutput.overall_viability.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Stakeholder Reactions */}
              {simOutput.stakeholder_reactions.map((sr, idx) => {
                const badge = getSupportBadge(sr.support_level);
                return (
                  <div key={idx} className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                    <div className="card-header">
                      <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {sr.role}
                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.7', marginBottom: '0.75rem' }}>
                      {sr.reaction}
                    </div>
                    {sr.concerns && sr.concerns.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={sectionLabel}>Concerns</div>
                        <ul style={listStyle}>
                          {sr.concerns.map((c, i) => <li key={i} style={listItem}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                    {sr.conditions && (
                      <div>
                        <div style={sectionLabel}>Conditions for Support</div>
                        <div style={{ fontSize: '0.84rem', color: '#4ade80', lineHeight: '1.6' }}>
                          {sr.conditions}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Critical Risks */}
              {simOutput.critical_risks && simOutput.critical_risks.length > 0 && (
                <div className="card" style={{ borderLeft: '3px solid var(--warning, #f59e0b)' }}>
                  <div className="card-header">
                    <div className="card-title" style={{ color: 'var(--warning, #f59e0b)' }}>
                      Critical Risks
                    </div>
                  </div>
                  <ul style={listStyle}>
                    {simOutput.critical_risks.map((risk, i) => <li key={i} style={listItem}>{risk}</li>)}
                  </ul>
                </div>
              )}

              {/* Recommended Modifications */}
              {simOutput.recommended_modifications && simOutput.recommended_modifications.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Recommended Modifications</div>
                  </div>
                  <ul style={listStyle}>
                    {simOutput.recommended_modifications.map((mod, i) => <li key={i} style={listItem}>{mod}</li>)}
                  </ul>
                </div>
              )}

              {/* Consensus Path */}
              {simOutput.consensus_path && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Consensus Path</div>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                    {simOutput.consensus_path}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card">
              <div className="card-header"><div className="card-title">Output</div></div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
            </div>
          )}

          {/* Meta */}
          <div className="meta-row" style={{ marginTop: '1rem' }}>
            <div className="meta-item">Model: <strong>{result.model}</strong></div>
            <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
            <div className="meta-item">Cost: <strong>${result.cost_estimate.toFixed(5)}</strong></div>
            <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="card">
          <div className="empty-state">
            <h3>Ready to Simulate</h3>
            <p>
              Enter a plan or proposal and define stakeholder roles to simulate
              multi-perspective reactions, identify risks, and find a path to consensus.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
