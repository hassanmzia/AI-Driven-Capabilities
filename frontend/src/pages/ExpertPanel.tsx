import React, { useState } from 'react';
import { executeExpertPanel } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface ExpertResponse {
  persona: string;
  response: string;
}

interface ExpertPanelOutput {
  expert_responses: ExpertResponse[];
  synthesis: string;
  num_experts: number;
}

interface SynthesisData {
  consensus_points?: string[];
  disagreements?: string[];
  key_insights?: string[];
  recommendation?: string;
  risk_factors?: string[];
  next_steps?: string[];
}

const PERSONA_OPTIONS: { key: string; label: string }[] = [
  { key: 'optimist', label: 'Optimist Strategist' },
  { key: 'skeptic', label: 'Skeptical Analyst' },
  { key: 'risk_mgr', label: 'Risk Manager' },
  { key: 'technical', label: 'Technical Expert' },
  { key: 'end_user', label: 'End-User Advocate' },
  { key: 'financial', label: 'Financial Advisor' },
];

const EXPERT_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

function parseJSON(raw: string): any | null {
  try {
    const trimmed = raw.trim();
    // Try direct parse
    let parsed: any = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      // Try extracting JSON from markdown code block
      const codeBlock = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlock) {
        parsed = JSON.parse(codeBlock[1].trim());
      } else {
        // Try finding embedded JSON
        const first = trimmed.search(/[{[]/);
        if (first >= 0) {
          const opener = trimmed[first];
          const closer = opener === '{' ? '}' : ']';
          const last = trimmed.lastIndexOf(closer);
          if (last > first) {
            parsed = JSON.parse(trimmed.slice(first, last + 1));
          }
        }
      }
    }
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function parsePanelOutput(output: string): ExpertPanelOutput | null {
  const parsed = parseJSON(output);
  if (
    parsed &&
    Array.isArray(parsed.expert_responses) &&
    typeof parsed.synthesis === 'string'
  ) {
    return parsed as ExpertPanelOutput;
  }
  return null;
}

function parseSynthesis(synthesis: string): SynthesisData | null {
  const parsed = parseJSON(synthesis);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as SynthesisData;
  }
  return null;
}

function personaLabel(key: string): string {
  const found = PERSONA_OPTIONS.find((p) => p.key === key);
  return found ? found.label : key;
}

function SynthesisSection({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div
        style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: '1.7' }}>
        {items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export const ExpertPanel: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['optimist', 'skeptic']);
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const canRun = topic.trim() && selectedPersonas.length >= 2 && !loading;

  const togglePersona = (key: string) => {
    setSelectedPersonas((prev) => {
      if (prev.includes(key)) {
        return prev.filter((p) => p !== key);
      }
      if (prev.length >= 6) return prev;
      return [...prev, key];
    });
  };

  const handleExecute = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executeExpertPanel({ topic, personas: selectedPersonas, model });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Expert panel failed');
    } finally {
      setLoading(false);
    }
  };

  const panelOutput = result ? parsePanelOutput(result.output) : null;
  const synthesisData = panelOutput ? parseSynthesis(panelOutput.synthesis) : null;

  return (
    <div>
      <div className="page-header">
        <h2>Expert Panel Debate</h2>
        <p>Simulate a multi-perspective discussion with AI-driven expert personas on any topic</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        {/* Left Column - Configuration */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Panel Configuration</div>
            </div>

            <div className="form-group">
              <label className="form-label">Topic / Question</label>
              <textarea
                className="form-textarea"
                placeholder="Enter a topic or question for the expert panel to discuss..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Expert Personas
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.78rem' }}>
                  ({selectedPersonas.length} selected, 2-6 required)
                </span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {PERSONA_OPTIONS.map((persona, idx) => {
                  const isSelected = selectedPersonas.includes(persona.key);
                  const color = EXPERT_COLORS[idx % EXPERT_COLORS.length];
                  return (
                    <label
                      key={persona.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-primary)',
                        border: `1px solid ${isSelected ? color : 'var(--border)'}`,
                        transition: 'all 0.2s ease',
                        fontSize: '0.82rem',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePersona(persona.key)}
                        style={{ accentColor: color }}
                      />
                      <span style={{ borderLeft: `3px solid ${color}`, paddingLeft: '0.5rem' }}>
                        {persona.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Model</label>
              <select
                className="form-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
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
              disabled={!canRun}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" /> Running Panel...
                </>
              ) : (
                'Start Expert Debate'
              )}
            </button>
          </div>

          {/* Persona Pipeline */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '0.75rem' }}>Selected Panelists</div>
            {selectedPersonas.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Select at least 2 personas above
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedPersonas.map((key, idx) => {
                  const color = EXPERT_COLORS[PERSONA_OPTIONS.findIndex((p) => p.key === key) % EXPERT_COLORS.length];
                  return (
                    <div
                      key={key}
                      style={{
                        padding: '0.6rem 0.75rem',
                        background: 'var(--bg-primary)',
                        borderRadius: '0.5rem',
                        borderLeft: `3px solid ${color}`,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {idx + 1}. {personaLabel(key)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {error && (
            <div className="error-box" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                <h3>Convening Expert Panel</h3>
                <p>Each expert is formulating their perspective on the topic...</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div>
              {/* View Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="badge badge-success">
                  {panelOutput ? `${panelOutput.num_experts} Experts Responded` : 'Panel Complete'}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowRaw(!showRaw)}
                >
                  {showRaw ? 'Formatted View' : 'Raw Output'}
                </button>
              </div>

              {showRaw ? (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Raw Output</div>
                  </div>
                  <div className="output-box">
                    <FormattedOutput text={result.output} />
                  </div>
                </div>
              ) : panelOutput ? (
                <>
                  {/* Expert Response Cards */}
                  {panelOutput.expert_responses.map((expert, idx) => {
                    const personaIdx = PERSONA_OPTIONS.findIndex((p) => p.key === expert.persona);
                    const color = EXPERT_COLORS[(personaIdx >= 0 ? personaIdx : idx) % EXPERT_COLORS.length];
                    return (
                      <div
                        key={idx}
                        className="card"
                        style={{ borderLeft: `3px solid ${color}` }}
                      >
                        <div className="card-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                color: '#fff',
                                flexShrink: 0,
                              }}
                            >
                              {personaLabel(expert.persona).charAt(0)}
                            </div>
                            <div>
                              <div className="card-title">{personaLabel(expert.persona)}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Persona: {expert.persona}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className="output-box"
                          style={{ marginTop: '0.5rem', fontSize: '0.85rem', lineHeight: '1.7' }}
                        >
                          <FormattedOutput text={expert.response} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Synthesis Card */}
                  <div
                    className="card"
                    style={{
                      background: 'rgba(99, 102, 241, 0.05)',
                      borderColor: 'var(--accent)',
                    }}
                  >
                    <div className="card-header">
                      <div className="card-title">Moderator Synthesis</div>
                      <span className="badge badge-accent">Synthesis</span>
                    </div>

                    {synthesisData ? (
                      <div style={{ marginTop: '0.75rem' }}>
                        <SynthesisSection title="Consensus Points" items={synthesisData.consensus_points || []} />
                        <SynthesisSection title="Disagreements" items={synthesisData.disagreements || []} />
                        <SynthesisSection title="Key Insights" items={synthesisData.key_insights || []} />

                        {synthesisData.recommendation && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                marginBottom: '0.5rem',
                              }}
                            >
                              Recommendation
                            </div>
                            <div
                              style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(34, 197, 94, 0.06)',
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                fontSize: '0.85rem',
                                lineHeight: '1.7',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {synthesisData.recommendation}
                            </div>
                          </div>
                        )}

                        <SynthesisSection title="Risk Factors" items={synthesisData.risk_factors || []} />
                        <SynthesisSection title="Next Steps" items={synthesisData.next_steps || []} />
                      </div>
                    ) : (
                      <div className="output-box" style={{ marginTop: '0.5rem' }}>
                        <FormattedOutput text={panelOutput.synthesis} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Fallback when structured parse fails */
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Panel Output</div>
                  </div>
                  <div className="output-box">
                    <FormattedOutput text={result.output} />
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="meta-row" style={{ marginTop: '1rem' }}>
                <div className="meta-item">
                  Model: <strong>{result.model}</strong>
                </div>
                <div className="meta-item">
                  Tokens: <strong>{result.tokens_input + result.tokens_output}</strong>
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

          {!result && !loading && !error && (
            <div className="card">
              <div className="empty-state">
                <h3>Expert Panel Ready</h3>
                <p>
                  Enter a topic and select 2-6 expert personas to simulate a
                  multi-perspective debate with AI-driven analysis and synthesis.
                </p>
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <strong>How it works:</strong><br />
                  1. <strong>Select Personas</strong> - choose the expert viewpoints you want represented<br />
                  2. <strong>Each Expert Responds</strong> - every persona analyzes the topic from their perspective<br />
                  3. <strong>Moderator Synthesizes</strong> - a synthesis highlights consensus, disagreements, and recommendations
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
