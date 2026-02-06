import React, { useState } from 'react';
import { FeatureLayout, ModelSelector } from '../components/shared/FeatureLayout';
import { executeCustomPrompt } from '../services/api';
import type { ExecutionResult } from '../types';

export const CustomPrompt: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!userPrompt.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await executeCustomPrompt({ system_prompt: systemPrompt, user_prompt: userPrompt, model, temperature, max_tokens: maxTokens });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureLayout
      title="Custom Prompt"
      description="Execute any custom prompt with configurable system message, model, and parameters"
      result={result} loading={loading} error={error}
    >
      <div className="form-group">
        <label className="form-label">System Prompt (optional)</label>
        <textarea
          className="form-textarea"
          placeholder="Set the AI's behavior and role..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          style={{ minHeight: '80px' }}
        />
      </div>
      <div className="form-group">
        <label className="form-label">User Prompt</label>
        <textarea
          className="form-textarea"
          placeholder="Enter your prompt here..."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          style={{ minHeight: '140px' }}
        />
      </div>
      <div className="form-row-3">
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
        <div className="form-group">
          <label className="form-label">Temperature: {temperature}</label>
          <input type="range" className="form-input" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} style={{ padding: '0.3rem' }} />
        </div>
        <div className="form-group">
          <label className="form-label">Max Tokens</label>
          <input type="number" className="form-input" min={1} max={4096} value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1024)} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !userPrompt.trim()}>
        {loading ? <><span className="loading-spinner" /> Executing...</> : 'Execute Prompt'}
      </button>
    </FeatureLayout>
  );
};
