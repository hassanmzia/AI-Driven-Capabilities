import React, { useState } from 'react';
import type { ExecutionResult } from '../../types';
import { FormattedOutput } from './FormattedOutput';

interface FeatureLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  result: ExecutionResult | null;
  loading: boolean;
  error: string | null;
  extraActions?: React.ReactNode;
}

export const FeatureLayout: React.FC<FeatureLayoutProps> = ({
  title, description, children, result, loading, error, extraActions,
}) => {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div>
      <div className="page-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="grid-2-col">
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Input</div>
            </div>
            {children}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Output</div>
              {result && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {extraActions}
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowRaw(!showRaw)}>
                    {showRaw ? 'Formatted' : 'Raw'}
                  </button>
                </div>
              )}
            </div>

            {loading && (
              <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                <p>Processing your request...</p>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}

            {result && !loading && (
              <>
                <div className="output-box">
                  {showRaw ? JSON.stringify(result, null, 2) : <FormattedOutput text={result.output} />}
                </div>
                <div className="meta-row">
                  <div className="meta-item">Model: <strong>{result.model}</strong></div>
                  <div className="meta-item">Tokens: <strong>{result.tokens_input + result.tokens_output}</strong></div>
                  <div className="meta-item">Cost: <strong>${Number(result.cost_estimate).toFixed(5)}</strong></div>
                  <div className="meta-item">Latency: <strong>{result.latency_ms}ms</strong></div>
                </div>
              </>
            )}

            {!result && !loading && !error && (
              <div className="empty-state">
                <h3>Ready to go</h3>
                <p>Fill in the input and click Execute to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ModelSelectorProps {
  model: string;
  temperature: number;
  onModelChange: (m: string) => void;
  onTemperatureChange: (t: number) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  model, temperature, onModelChange, onTemperatureChange,
}) => (
  <div className="form-row">
    <div className="form-group">
      <label className="form-label">Model</label>
      <select className="form-select" value={model} onChange={(e) => onModelChange(e.target.value)}>
        <option value="gpt-4o-mini">GPT-4o Mini</option>
        <option value="gpt-4o">GPT-4o</option>
        <option value="gpt-4">GPT-4</option>
        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
        <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
      </select>
    </div>
    <div className="form-group">
      <label className="form-label">Temperature: {temperature}</label>
      <input
        type="range" min="0" max="2" step="0.1"
        value={temperature}
        onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
        className="form-input"
        style={{ padding: '0.3rem' }}
      />
    </div>
  </div>
);
