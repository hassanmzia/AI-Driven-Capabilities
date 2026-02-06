import React, { useState } from 'react';
import { executeRAGSimulator } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface SelectedChunk {
  chunk_index: number;
  text: string;
}

interface ParsedOutput {
  retrieval: string;
  selected_chunks: SelectedChunk[];
  answer_with_context: string;
  answer_without_context: string;
  num_chunks_total: number;
  num_chunks_retrieved: number;
}

function parseRAGOutput(raw: string): ParsedOutput | null {
  try {
    const trimmed = raw.trim();
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
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as ParsedOutput;
    }
    return null;
  } catch {
    return null;
  }
}

function PipelineStage({
  number,
  title,
  badgeClass,
  children,
}: {
  number: number;
  title: string;
  badgeClass: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        padding: '1rem',
        borderLeft: '3px solid var(--accent)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem' }}>
          Stage {number}
        </span>
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export const RAGSimulator: React.FC = () => {
  const [query, setQuery] = useState('');
  const [chunks, setChunks] = useState<string[]>(['', '', '']);
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const nonEmptyChunks = chunks.filter((c) => c.trim().length > 0);
  const canRun = query.trim() && nonEmptyChunks.length > 0 && !loading;

  const handleExecute = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executeRAGSimulator({
        query,
        knowledge_chunks: nonEmptyChunks,
        model,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const addChunk = () => {
    setChunks((prev) => [...prev, '']);
  };

  const removeChunk = (index: number) => {
    if (chunks.length <= 1) return;
    setChunks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateChunk = (index: number, value: string) => {
    setChunks((prev) => prev.map((c, i) => (i === index ? value : c)));
  };

  const parsed: ParsedOutput | null = result?.output ? parseRAGOutput(result.output) : null;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>RAG Pipeline Simulator</h2>
        <p>Simulate retrieval-augmented generation to compare context-grounded answers against baseline responses</p>
      </div>

      {/* Input Section */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Configuration</div>
        </div>

        {/* Query Input */}
        <div className="form-group">
          <label className="form-label">Query / Question</label>
          <input
            className="form-input"
            type="text"
            placeholder="Enter a question to answer using the knowledge base..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Knowledge Base Chunks */}
        <div className="form-group">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <label className="form-label" style={{ margin: 0 }}>
              Knowledge Base Chunks
            </label>
            <button className="btn btn-secondary btn-sm" onClick={addChunk}>
              Add Chunk
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {chunks.map((chunk, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Chunk {index + 1}
                  </span>
                  {chunks.length > 1 && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => removeChunk(index)}
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <textarea
                  className="form-textarea"
                  placeholder={`Enter knowledge chunk ${index + 1}...`}
                  value={chunk}
                  onChange={(e) => updateChunk(index, e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Model Selector & Run Button */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 240px' }}>
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
          <button className="btn btn-primary" onClick={handleExecute} disabled={!canRun}>
            {loading ? (
              <>
                <span className="loading-spinner" /> Simulating...
              </>
            ) : (
              'Run RAG Simulation'
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Running retrieval and generating answers with and without context...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Results Section */}
      {result && !loading && (
        <>
          {/* Toggle Raw/Formatted */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowRaw((prev) => !prev)}
            >
              {showRaw ? 'Formatted View' : 'Raw JSON'}
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
          ) : parsed ? (
            <>
              {/* Stats Row */}
              <div
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '1rem 1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Total Chunks:
                  </span>
                  <span className="badge badge-accent">{parsed.num_chunks_total}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Retrieved:
                  </span>
                  <span className="badge badge-success">{parsed.num_chunks_retrieved}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Retrieval Rate:
                  </span>
                  <span className="badge badge-warning">
                    {parsed.num_chunks_total > 0
                      ? Math.round((parsed.num_chunks_retrieved / parsed.num_chunks_total) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Pipeline Visualization */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Pipeline Stages</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Stage 1: Retrieval */}
                  <PipelineStage number={1} title="Retrieval" badgeClass="badge-accent">
                    {parsed.retrieval && (
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.6',
                          marginBottom: '0.75rem',
                        }}
                      >
                        {parsed.retrieval}
                      </p>
                    )}
                    {parsed.selected_chunks && parsed.selected_chunks.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {parsed.selected_chunks.map((sc, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '0.6rem 0.75rem',
                              background: 'rgba(99, 102, 241, 0.08)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              borderRadius: '0.4rem',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                marginBottom: '0.35rem',
                              }}
                            >
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                Chunk {sc.chunk_index}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Retrieved
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-primary)',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {sc.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        No chunks were selected during retrieval
                      </span>
                    )}
                  </PipelineStage>

                  {/* Stage 2: Answer With Context */}
                  <PipelineStage number={2} title="Answer With Context (RAG)" badgeClass="badge-success">
                    <div className="output-box">
                      <FormattedOutput text={parsed.answer_with_context || 'No answer generated'} />
                    </div>
                  </PipelineStage>

                  {/* Stage 3: Answer Without Context (Baseline) */}
                  <PipelineStage number={3} title="Answer Without Context (Baseline)" badgeClass="badge-warning">
                    <div className="output-box">
                      <FormattedOutput text={parsed.answer_without_context || 'No baseline answer generated'} />
                    </div>
                  </PipelineStage>
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      With Context
                      <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>RAG</span>
                    </div>
                  </div>
                  <div className="output-box" style={{ minHeight: '120px' }}>
                    <FormattedOutput text={parsed.answer_with_context || 'No answer generated'} />
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      Without Context
                      <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>Baseline</span>
                    </div>
                  </div>
                  <div className="output-box" style={{ minHeight: '120px' }}>
                    <FormattedOutput text={parsed.answer_without_context || 'No baseline answer generated'} />
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="card">
                <div className="meta-row">
                  <div className="meta-item">
                    Model: <strong>{result.model}</strong>
                  </div>
                  <div className="meta-item">
                    Tokens: <strong>{result.tokens_input + result.tokens_output}</strong>
                  </div>
                  <div className="meta-item">
                    Cost: <strong>${result.cost_estimate.toFixed(5)}</strong>
                  </div>
                  <div className="meta-item">
                    Latency: <strong>{result.latency_ms}ms</strong>
                  </div>
                  <div className="meta-item">
                    <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>
                      {result.execution_id}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Fallback: raw output if JSON parsing fails */
            <div className="card">
              <div className="card-header">
                <div className="card-title">Output</div>
              </div>
              <div className="output-box">
                <FormattedOutput text={result.output} />
              </div>
              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">
                  Model: <strong>{result.model}</strong>
                </div>
                <div className="meta-item">
                  Tokens: <strong>{result.tokens_input + result.tokens_output}</strong>
                </div>
                <div className="meta-item">
                  Cost: <strong>${result.cost_estimate.toFixed(5)}</strong>
                </div>
                <div className="meta-item">
                  Latency: <strong>{result.latency_ms}ms</strong>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
