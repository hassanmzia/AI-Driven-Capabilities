import React, { useState } from 'react';
import { executeFewShotBuilder } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';
import type { ExecutionResult } from '../types';

interface ExamplePair {
  input: string;
  output: string;
}

interface ParsedOutput {
  system_prompt: string;
  few_shot_examples: { input: string; output: string }[];
  user_prompt_template: string;
  assembled_prompt: string;
  tips: string[];
}

export const FewShotBuilder: React.FC = () => {
  const [taskDescription, setTaskDescription] = useState('');
  const [examples, setExamples] = useState<ExamplePair[]>([
    { input: '', output: '' },
    { input: '', output: '' },
  ]);
  const [model, setModel] = useState('gpt-4o-mini');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExecute = async () => {
    if (!taskDescription.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executeFewShotBuilder({
        task_description: taskDescription,
        examples: JSON.stringify(examples),
        model,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const addExample = () => {
    setExamples((prev) => [...prev, { input: '', output: '' }]);
  };

  const removeExample = (index: number) => {
    setExamples((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExample = (index: number, field: 'input' | 'output', value: string) => {
    setExamples((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const loadExample = () => {
    setTaskDescription(
      'Classify customer emails into categories: billing, technical, general inquiry, complaint'
    );
    setExamples([
      { input: "I can't log into my account", output: 'technical' },
      { input: 'I was charged twice', output: 'billing' },
      { input: 'What are your business hours?', output: 'general inquiry' },
    ]);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  let parsed: ParsedOutput | null = null;
  if (result?.output) {
    try {
      parsed = JSON.parse(result.output);
    } catch {
      parsed = null;
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Few-Shot Builder</h2>
        <p>Build optimized few-shot prompts from task descriptions and example pairs</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left Column - Input */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>
            Input Configuration
          </div>

          <div className="form-group">
            <label className="form-label">Task Description</label>
            <textarea
              className="form-textarea"
              placeholder="Describe what the prompt should accomplish..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              style={{ minHeight: '100px' }}
            />
          </div>

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
                Example Pairs
              </label>
              <button className="btn btn-secondary btn-sm" onClick={addExample}>
                Add Example
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {examples.map((example, index) => (
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
                      Example {index + 1}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => removeExample(index)}
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>
                      Example Input
                    </label>
                    <textarea
                      className="form-textarea"
                      placeholder="Input for this example..."
                      value={example.input}
                      onChange={(e) => updateExample(index, 'input', e.target.value)}
                      style={{ minHeight: '60px' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>
                      Expected Output
                    </label>
                    <textarea
                      className="form-textarea"
                      placeholder="Expected output for this example..."
                      value={example.output}
                      onChange={(e) => updateExample(index, 'output', e.target.value)}
                      style={{ minHeight: '60px' }}
                    />
                  </div>
                </div>
              ))}
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

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleExecute}
              disabled={loading || !taskDescription.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" /> Building...
                </>
              ) : (
                'Build Few-Shot Prompt'
              )}
            </button>
            <button className="btn btn-secondary" onClick={loadExample}>
              Load Example
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>
            Results
          </div>

          {error && <div className="error-box">{error}</div>}

          {loading && (
            <div className="empty-state">
              <div className="loading-spinner" />
            </div>
          )}

          {!result && !loading && !error && (
            <div className="empty-state">
              <h3>No results yet</h3>
              <p>Configure your task and examples, then click "Build Few-Shot Prompt"</p>
            </div>
          )}

          {result && parsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* System Prompt */}
              {parsed.system_prompt && (
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    System Prompt
                  </div>
                  <div className="output-box">
                    <span style={{ whiteSpace: 'pre-wrap' }}>{parsed.system_prompt}</span>
                  </div>
                </div>
              )}

              {/* Few-Shot Examples */}
              {parsed.few_shot_examples && parsed.few_shot_examples.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Few-Shot Examples
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {parsed.few_shot_examples.map((ex, i) => (
                      <div
                        key={i}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          borderLeft: '3px solid var(--accent)',
                        }}
                      >
                        <div style={{ marginBottom: '0.35rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              textTransform: 'uppercase',
                            }}
                          >
                            Input:
                          </span>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              color: 'var(--text-primary)',
                              marginTop: '0.15rem',
                            }}
                          >
                            {ex.input}
                          </div>
                        </div>
                        <div>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              textTransform: 'uppercase',
                            }}
                          >
                            Output:
                          </span>
                          <div style={{ marginTop: '0.15rem' }}>
                            <span className="badge badge-success">{ex.output}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Prompt Template */}
              {parsed.user_prompt_template && (
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    User Prompt Template
                  </div>
                  <div className="output-box">
                    <code style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {parsed.user_prompt_template}
                    </code>
                  </div>
                </div>
              )}

              {/* Assembled Prompt */}
              {parsed.assembled_prompt && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Assembled Prompt
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopy(parsed!.assembled_prompt)}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="output-box" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{parsed.assembled_prompt}</span>
                  </div>
                </div>
              )}

              {/* Optimization Tips */}
              {parsed.tips && parsed.tips.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Optimization Tips
                  </div>
                  <ul
                    style={{
                      margin: '0.25rem 0',
                      paddingLeft: '1.25rem',
                      listStyle: 'disc',
                    }}
                  >
                    {parsed.tips.map((tip, i) => (
                      <li
                        key={i}
                        style={{
                          marginBottom: '0.3rem',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.6',
                        }}
                      >
                        {tip}
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
              )}
            </div>
          )}

          {/* Fallback: raw output if JSON parsing fails */}
          {result && !parsed && (
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
          )}
        </div>
      </div>
    </div>
  );
};
