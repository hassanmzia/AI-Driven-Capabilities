import React, { useState } from 'react';
import { executeQualityPipeline } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface PipelineStage {
  name: string;
  status: string;
  output: string;
}

interface PipelineOutput {
  final_content: string;
  stages: PipelineStage[];
  all_passed: boolean;
}

function parsePipelineOutput(raw: string): PipelineOutput | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'stages' in parsed) {
      return parsed as PipelineOutput;
    }
    return null;
  } catch {
    // Try extracting JSON from markdown code blocks
    const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        if (parsed && typeof parsed === 'object' && 'stages' in parsed) {
          return parsed as PipelineOutput;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}

function getStatusBadge(status: string): React.ReactElement {
  const normalized = status.toLowerCase();
  if (normalized === 'completed' || normalized === 'passed') {
    return <span className="badge badge-success">{status}</span>;
  }
  if (normalized === 'failed') {
    return <span className="badge badge-error">{status}</span>;
  }
  // skipped or any other status
  return (
    <span className="badge" style={{ color: 'var(--text-muted)' }}>
      {status}
    </span>
  );
}

export const QualityGatePipeline: React.FC = () => {
  const [taskPrompt, setTaskPrompt] = useState('');
  const [inputData, setInputData] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!taskPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executeQualityPipeline({
        task_prompt: taskPrompt,
        input_text: inputData,
        model,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Pipeline execution failed');
    } finally {
      setLoading(false);
    }
  };

  const pipelineData = result ? parsePipelineOutput(result.output) : null;

  return (
    <div>
      <div className="page-header">
        <h2>Quality Gate Pipeline</h2>
        <p>
          Multi-stage content pipeline: Generate &rarr; Safety Check &rarr;
          Revise &rarr; Validate
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5fr',
          gap: '1.5rem',
        }}
      >
        {/* Left column: Input */}
        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1rem' }}>
              Pipeline Input
            </div>

            <div className="form-group">
              <label className="form-label">Task Prompt</label>
              <textarea
                className="form-textarea"
                placeholder="Instructions for content generation..."
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                style={{ minHeight: '120px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Input Data</label>
              <textarea
                className="form-textarea"
                placeholder="Content or context to process..."
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                style={{ minHeight: '100px' }}
              />
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
                <option value="claude-3-5-sonnet-20241022">
                  claude-3-5-sonnet-20241022
                </option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleExecute}
              disabled={loading || !taskPrompt.trim()}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" /> Running Pipeline...
                </>
              ) : (
                'Run Pipeline'
              )}
            </button>
          </div>
        </div>

        {/* Right column: Results */}
        <div>
          {error && (
            <div className="error-box" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="empty-state">
                <div
                  className="loading-spinner"
                  style={{ margin: '0 auto 1rem' }}
                />
                <h3>Running Quality Gate Pipeline</h3>
                <p>
                  Generate &rarr; Safety Check &rarr; Revise &rarr; Validate
                </p>
              </div>
            </div>
          )}

          {result && pipelineData && (
            <div>
              {/* Overall status */}
              <div
                className="card"
                style={{
                  background: pipelineData.all_passed
                    ? 'rgba(34, 197, 94, 0.05)'
                    : 'rgba(239, 68, 68, 0.05)',
                  borderColor: pipelineData.all_passed
                    ? 'var(--success)'
                    : 'var(--error)',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div className="card-title">Pipeline Result</div>
                  {pipelineData.all_passed ? (
                    <span className="badge badge-success">All Passed</span>
                  ) : (
                    <span className="badge badge-error">Issues Detected</span>
                  )}
                </div>
              </div>

              {/* Stage visualization */}
              {pipelineData.stages.map((stage, idx) => (
                <React.Fragment key={idx}>
                  <div className="card">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div className="card-title">{stage.name}</div>
                      {getStatusBadge(stage.status)}
                    </div>
                    <details>
                      <summary
                        style={{
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Show output
                      </summary>
                      <div className="output-box">
                        <FormattedOutput text={stage.output} />
                      </div>
                    </details>
                  </div>
                  {idx < pipelineData.stages.length - 1 && (
                    <div
                      style={{
                        color: 'var(--text-muted)',
                        margin: '0.5rem auto',
                        textAlign: 'center',
                        fontSize: '1.2rem',
                      }}
                    >
                      &#8595;
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* Arrow before final content */}
              {pipelineData.stages.length > 0 && (
                <div
                  style={{
                    color: 'var(--text-muted)',
                    margin: '0.5rem auto',
                    textAlign: 'center',
                    fontSize: '1.2rem',
                  }}
                >
                  &#8595;
                </div>
              )}

              {/* Final content */}
              <div
                className="card"
                style={{
                  borderColor: 'var(--accent)',
                  background: 'rgba(99, 102, 241, 0.05)',
                }}
              >
                <div className="card-title" style={{ marginBottom: '0.75rem' }}>
                  Final Content
                </div>
                <div className="output-box">
                  <FormattedOutput text={pipelineData.final_content} />
                </div>
              </div>

              {/* Meta row */}
              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">
                  Model: <strong>{result.model}</strong>
                </div>
                <div className="meta-item">
                  Tokens:{' '}
                  <strong>
                    {result.tokens_input + result.tokens_output}
                  </strong>
                </div>
                <div className="meta-item">
                  Cost:{' '}
                  <strong>${result.cost_estimate.toFixed(5)}</strong>
                </div>
                <div className="meta-item">
                  Latency: <strong>{result.latency_ms}ms</strong>
                </div>
              </div>
            </div>
          )}

          {/* Fallback if result exists but JSON parsing failed */}
          {result && !pipelineData && (
            <div>
              <div className="card">
                <div className="card-title" style={{ marginBottom: '0.75rem' }}>
                  Pipeline Output
                </div>
                <div className="output-box">
                  <FormattedOutput text={result.output} />
                </div>
              </div>
              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">
                  Model: <strong>{result.model}</strong>
                </div>
                <div className="meta-item">
                  Tokens:{' '}
                  <strong>
                    {result.tokens_input + result.tokens_output}
                  </strong>
                </div>
                <div className="meta-item">
                  Cost:{' '}
                  <strong>${result.cost_estimate.toFixed(5)}</strong>
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
                <h3>Quality Gate Pipeline Ready</h3>
                <p>
                  Enter a task prompt and optional input data, then click "Run
                  Pipeline" to execute the multi-stage quality gate process.
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
                  <strong>Pipeline stages:</strong>
                  <br />
                  1. <strong>Generate</strong> &mdash; Creates initial content
                  from your prompt
                  <br />
                  2. <strong>Safety Check</strong> &mdash; Screens content for
                  policy compliance
                  <br />
                  3. <strong>Revise</strong> &mdash; Refines content based on
                  safety feedback
                  <br />
                  4. <strong>Validate</strong> &mdash; Final quality assurance
                  pass
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
