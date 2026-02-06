import React, { useState } from 'react';
import { executeDocumentQA } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface SourceDocument {
  label: string;
  text: string;
}

interface KeyFinding {
  finding: string;
  sources: string[];
}

interface QAOutput {
  answer: string;
  sources_used: string[];
  confidence: string;
  key_findings: KeyFinding[];
  gaps: string[];
}

function parseQAOutput(output: string): QAOutput | null {
  try {
    const parsed = JSON.parse(output);
    if (parsed && typeof parsed === 'object' && 'answer' in parsed && 'sources_used' in parsed) {
      return parsed as QAOutput;
    }
    return null;
  } catch {
    const cbMatch = output.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (cbMatch) {
      try {
        const parsed = JSON.parse(cbMatch[1].trim());
        if (parsed && typeof parsed === 'object' && 'answer' in parsed) return parsed as QAOutput;
      } catch { /* fall through */ }
    }
    return null;
  }
}

function confidenceBadgeClass(confidence: string): string {
  const lower = (confidence || '').toLowerCase();
  if (lower === 'high') return 'badge badge-success';
  if (lower === 'medium') return 'badge badge-warning';
  if (lower === 'low') return 'badge badge-error';
  return 'badge badge-accent';
}

function renderCitedAnswer(answer: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\[Source\s+(\d+)\]/gi;
  let lastIdx = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(answer)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<span key={key++}>{answer.slice(lastIdx, match.index)}</span>);
    }
    parts.push(
      <span key={key++} className="badge badge-accent" style={{ fontSize: '0.7rem', margin: '0 0.15rem' }}>
        Source {match[1]}
      </span>
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < answer.length) parts.push(<span key={key++}>{answer.slice(lastIdx)}</span>);
  return parts.length > 0 ? parts : [<span key={0}>{answer}</span>];
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)',
  marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em',
};

function MetaRow({ result }: { result: ExecutionResult }) {
  return (
    <div className="meta-row" style={{ marginTop: '0.75rem' }}>
      <div className="meta-item">Model: <strong>{result.model}</strong></div>
      <div className="meta-item">Tokens In: <strong>{result.tokens_input}</strong></div>
      <div className="meta-item">Tokens Out: <strong>{result.tokens_output}</strong></div>
      <div className="meta-item">Cost: <strong>${Number(result.cost_estimate).toFixed(5)}</strong></div>
      <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
      <div className="meta-item">
        <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>{result.execution_id}</span>
      </div>
    </div>
  );
}

export const DocumentQA: React.FC = () => {
  const [documents, setDocuments] = useState<SourceDocument[]>([{ label: '', text: '' }]);
  const [question, setQuestion] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleExecute = async () => {
    if (!question.trim() || documents.every((d) => !d.text.trim())) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await executeDocumentQA({
        question,
        documents: documents.map((d) => ({ label: d.label, text: d.text })),
        model,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const addDocument = () => {
    if (documents.length >= 5) return;
    setDocuments((prev) => [...prev, { label: '', text: '' }]);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDocument = (index: number, field: 'label' | 'text', value: string) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc))
    );
  };

  const qaOutput = result ? parseQAOutput(result.output) : null;
  const hasValidDocs = documents.some((d) => d.text.trim());

  return (
    <div>
      <div className="page-header">
        <h2>Document Q&A with Citations</h2>
        <p>Ask questions across multiple source documents and receive answers with precise source citations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Column - Input */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Source Documents</div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Documents ({documents.length}/5)</label>
              <button className="btn btn-secondary btn-sm" onClick={addDocument} disabled={documents.length >= 5}>
                Add Source
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {documents.map((doc, index) => (
                <div key={index} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Source {index + 1}
                    </span>
                    {documents.length > 1 && (
                      <button className="btn btn-secondary btn-sm" onClick={() => removeDocument(index)}
                        style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>Remove</button>
                    )}
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Label</label>
                    <input type="text" className="form-input" placeholder='e.g. "Company Policy", "Q3 Report"...'
                      value={doc.label} onChange={(e) => updateDocument(index, 'label', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Content</label>
                    <textarea className="form-textarea" placeholder="Paste document text here..."
                      value={doc.text} onChange={(e) => updateDocument(index, 'text', e.target.value)}
                      style={{ minHeight: '80px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Question</label>
            <textarea className="form-textarea" placeholder="Ask a question about the documents above..."
              value={question} onChange={(e) => setQuestion(e.target.value)} style={{ minHeight: '80px' }} />
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

          <button className="btn btn-primary" onClick={handleExecute}
            disabled={loading || !question.trim() || !hasValidDocs} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? (<><span className="loading-spinner" /> Analyzing Documents...</>) : 'Ask Question'}
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Results</div>

          {error && <div className="error-box">{error}</div>}

          {loading && (
            <div className="empty-state">
              <div className="loading-spinner" />
              <p>Searching documents and generating cited answer...</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="empty-state">
              <h3>No results yet</h3>
              <p>Add source documents, enter a question, then click "Ask Question"</p>
            </div>
          )}

          {result && qaOutput && !showRaw && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowRaw(true)}>Show Raw</button>
              </div>

              {/* Confidence & sources count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={confidenceBadgeClass(qaOutput.confidence)}>
                  Confidence: {qaOutput.confidence}
                </span>
                {qaOutput.sources_used && qaOutput.sources_used.length > 0 && (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Sources used: <strong>{qaOutput.sources_used.length}</strong>
                  </span>
                )}
              </div>

              {/* Answer */}
              <div>
                <div style={sectionTitleStyle}>Answer</div>
                <div className="output-box" style={{ lineHeight: '1.7', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
                  {renderCitedAnswer(qaOutput.answer)}
                </div>
              </div>

              {/* Sources used */}
              {qaOutput.sources_used && qaOutput.sources_used.length > 0 && (
                <div>
                  <div style={sectionTitleStyle}>Sources Used</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {qaOutput.sources_used.map((source, i) => (
                      <span key={i} className="badge badge-accent">{source}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key findings */}
              {qaOutput.key_findings && qaOutput.key_findings.length > 0 && (
                <div>
                  <div style={sectionTitleStyle}>Key Findings</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {qaOutput.key_findings.map((kf, i) => (
                      <div key={i} style={{
                        padding: '0.6rem 0.75rem', background: 'rgba(99, 102, 241, 0.03)',
                        borderRadius: '0.375rem', borderLeft: '3px solid var(--accent)', fontSize: '0.82rem',
                      }}>
                        <div style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', lineHeight: '1.6' }}>
                          {kf.finding}
                        </div>
                        {kf.sources && kf.sources.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {kf.sources.map((src, j) => (
                              <span key={j} className="badge badge-accent" style={{ fontSize: '0.68rem' }}>{src}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {qaOutput.gaps && qaOutput.gaps.length > 0 && (
                <div>
                  <div style={sectionTitleStyle}>Information Gaps</div>
                  <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', listStyle: 'disc' }}>
                    {qaOutput.gaps.map((gap, i) => (
                      <li key={i} style={{ marginBottom: '0.3rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <MetaRow result={result} />
            </div>
          )}

          {/* Raw view */}
          {result && showRaw && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowRaw(false)}>Show Formatted</button>
              </div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
              <MetaRow result={result} />
            </div>
          )}

          {/* Fallback if JSON parsing fails */}
          {result && !qaOutput && !showRaw && (
            <div>
              <div className="output-box"><FormattedOutput text={result.output} /></div>
              <MetaRow result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
