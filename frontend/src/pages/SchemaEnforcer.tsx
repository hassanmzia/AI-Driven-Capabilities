import React, { useState } from 'react';
import { executeSchemaEnforcer } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

const EXAMPLE_SCHEMA = JSON.stringify(
  {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
      skills: { type: 'array', items: { type: 'string' } },
    },
    required: ['name', 'age'],
  },
  null,
  2
);

interface SchemaAttempt {
  attempt: number;
  valid: boolean;
  error?: string;
  output?: string;
}

interface SchemaOutput {
  result: string;
  attempts: SchemaAttempt[];
  total_attempts: number;
  success: boolean;
}

function parseSchemaOutput(output: string): SchemaOutput | null {
  try {
    const parsed = JSON.parse(output);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'result' in parsed &&
      'attempts' in parsed &&
      'total_attempts' in parsed &&
      'success' in parsed
    ) {
      return parsed as SchemaOutput;
    }
    return null;
  } catch {
    return null;
  }
}

export const SchemaEnforcer: React.FC = () => {
  const [promptText, setPromptText] = useState('');
  const [schemaText, setSchemaText] = useState('');
  const [inputText, setInputText] = useState('');
  const [maxRetries, setMaxRetries] = useState(3);
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!promptText.trim() || !schemaText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executeSchemaEnforcer({
        prompt_text: promptText,
        schema_text: schemaText,
        input_text: inputText,
        max_retries: maxRetries,
        model,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const schemaOutput = result ? parseSchemaOutput(result.output) : null;

  return (
    <div>
      <div className="page-header">
        <h2>Schema Enforcer</h2>
        <p>Enforce JSON schema compliance on LLM output with auto-retry validation</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left column: Input */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Configuration</div>

          <div className="form-group">
            <label className="form-label">Task Prompt</label>
            <textarea
              className="form-textarea"
              placeholder="The instruction for the LLM, e.g. 'Generate a profile for a software engineer...'"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              style={{ minHeight: '100px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">JSON Schema</label>
            <textarea
              className="form-textarea"
              placeholder='{"type":"object","properties":{...},"required":[...]}'
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              style={{ minHeight: '120px', fontFamily: 'monospace' }}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSchemaText(EXAMPLE_SCHEMA)}
              style={{ marginTop: '0.5rem' }}
            >
              Load Example Schema
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Input Data</label>
            <textarea
              className="form-textarea"
              placeholder="The actual data or text to process..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ minHeight: '80px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Max Retries</label>
              <input
                type="number"
                className="form-input"
                min={1}
                max={5}
                value={maxRetries}
                onChange={(e) => setMaxRetries(Math.min(5, Math.max(1, parseInt(e.target.value) || 3)))}
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
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={loading || !promptText.trim() || !schemaText.trim()}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" /> Enforcing Schema...
              </>
            ) : (
              'Enforce Schema'
            )}
          </button>
        </div>

        {/* Right column: Results */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Results</div>

          {error && <div className="error-box">{error}</div>}

          {loading && (
            <div className="empty-state">
              <div className="loading-spinner" />
              <p>Validating and enforcing schema compliance...</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="empty-state">
              <h3>No results yet</h3>
              <p>Configure your schema and prompt, then click Enforce Schema to begin.</p>
            </div>
          )}

          {result && schemaOutput && (
            <>
              {/* Success / Failure badge */}
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={schemaOutput.success ? 'badge badge-success' : 'badge badge-error'}>
                  {schemaOutput.success ? 'Schema Valid' : 'Schema Invalid'}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Attempts: <strong>{schemaOutput.total_attempts}</strong>
                </span>
              </div>

              {/* Attempt cards */}
              {schemaOutput.attempts && schemaOutput.attempts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Attempt Log
                  </div>
                  {schemaOutput.attempts.map((attempt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.6rem 0.75rem',
                        background: 'rgba(99, 102, 241, 0.03)',
                        borderRadius: '0.375rem',
                        borderLeft: `3px solid ${attempt.valid ? 'var(--success)' : 'var(--error)'}`,
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          #{attempt.attempt}
                        </span>
                        <span className={attempt.valid ? 'badge badge-success' : 'badge badge-error'}>
                          {attempt.valid ? 'Valid' : 'Invalid'}
                        </span>
                      </div>
                      {attempt.error && (
                        <div style={{ marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                          {attempt.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Final result */}
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.35rem' }}>
                Final Output
              </div>
              <div className="output-box">
                <FormattedOutput
                  text={
                    typeof schemaOutput.result === 'string'
                      ? schemaOutput.result
                      : JSON.stringify(schemaOutput.result, null, 2)
                  }
                />
              </div>

              {/* Meta row */}
              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">
                  ID: <strong style={{ fontSize: '0.7rem' }}>{result.execution_id}</strong>
                </div>
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
            </>
          )}

          {/* Fallback if output could not be parsed as expected structure */}
          {result && !schemaOutput && (
            <>
              <div className="output-box">
                <FormattedOutput text={result.output} />
              </div>
              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">
                  ID: <strong style={{ fontSize: '0.7rem' }}>{result.execution_id}</strong>
                </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
