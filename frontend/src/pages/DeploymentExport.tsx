import React, { useState } from 'react';
import { FormattedOutput } from '../components/shared/FormattedOutput';

interface LocalTestCase {
  id: number;
  input: string;
  expectedOutput: string;
}

interface DeploymentPackage {
  version: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  userPromptTemplate: string;
  testCases: { input: string; expectedOutput: string }[];
  metadata: {
    exportedAt: string;
    exportFormat: string;
  };
}

interface ModelOption {
  value: string;
  label: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
];

export function DeploymentExport() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPromptTemplate, setUserPromptTemplate] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [testCases, setTestCases] = useState<LocalTestCase[]>([{ id: 1, input: '', expectedOutput: '' }]);
  const [nextTestId, setNextTestId] = useState(2);
  const [generatedPackage, setGeneratedPackage] = useState<DeploymentPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addTestCase = () => {
    setTestCases(prev => [...prev, { id: nextTestId, input: '', expectedOutput: '' }]);
    setNextTestId(prev => prev + 1);
  };

  const removeTestCase = (id: number) => {
    if (testCases.length <= 1) return;
    setTestCases(prev => prev.filter(tc => tc.id !== id));
  };

  const updateTestCase = (id: number, field: 'input' | 'expectedOutput', value: string) => {
    setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, [field]: value } : tc));
  };

  const handleGenerate = () => {
    if (!systemPrompt.trim() && !userPromptTemplate.trim()) {
      setError('Please provide at least a system prompt or user prompt template.');
      return;
    }

    setError(null);

    const validTestCases = testCases
      .filter(tc => tc.input.trim() || tc.expectedOutput.trim())
      .map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput }));

    const pkg: DeploymentPackage = {
      version: '1.0.0',
      model: selectedModel,
      temperature,
      systemPrompt,
      userPromptTemplate,
      testCases: validTestCases,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportFormat: 'deployment-config-v1',
      },
    };

    setGeneratedPackage(pkg);
  };

  const handleDownload = () => {
    if (!generatedPackage) return;

    const blob = new Blob([JSON.stringify(generatedPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deployment-${selectedModel}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const temperatureLabel = (t: number): string => {
    if (t <= 0.2) return 'Very Deterministic';
    if (t <= 0.5) return 'Focused';
    if (t <= 0.8) return 'Balanced';
    if (t <= 1.2) return 'Creative';
    return 'Highly Random';
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ color: 'var(--text-primary)' }}>Deployment Export</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Export a finalized prompt as a deployment-ready configuration package.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Prompt Configuration</h2>
        </div>

        <div className="form-group">
          <label className="form-label">System Prompt</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Define the system-level behavior and constraints..."
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">User Prompt Template</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Define the user prompt template. Use {{variable}} for dynamic inputs..."
            value={userPromptTemplate}
            onChange={e => setUserPromptTemplate(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Model</label>
            <select
              className="form-select"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
            >
              {MODEL_OPTIONS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Temperature: {temperature.toFixed(1)}
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                ({temperatureLabel(temperature)})
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="form-input"
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>0.0</span>
              <span>1.0</span>
              <span>2.0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Test Cases</h2>
          <button className="btn btn-sm btn-secondary" onClick={addTestCase}>+ Add Test Case</button>
        </div>

        {testCases.map((tc, idx) => (
          <div
            key={tc.id}
            style={{
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              padding: '1rem', marginBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="badge" style={{ fontSize: '0.8rem' }}>Test Case {idx + 1}</span>
              <button
                className="btn btn-sm"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => removeTestCase(tc.id)}
                disabled={testCases.length <= 1}
              >
                Remove
              </button>
            </div>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Input</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Test input..."
                value={tc.input}
                onChange={e => updateTestCase(tc.id, 'input', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Expected Output</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Expected output or criteria..."
                value={tc.expectedOutput}
                onChange={e => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={handleGenerate}>
          Generate Package
        </button>
        {generatedPackage && (
          <button className="btn btn-secondary" onClick={handleDownload}>
            Download JSON
          </button>
        )}
      </div>

      {generatedPackage && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Package Preview</h2>
            <span className="badge badge-success">Ready</span>
          </div>

          <div className="meta-row" style={{ marginBottom: '1rem' }}>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)' }}>Model</span>
              <strong style={{ color: 'var(--text-primary)' }}>{generatedPackage.model}</strong>
            </div>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)' }}>Temperature</span>
              <strong style={{ color: 'var(--text-primary)' }}>{generatedPackage.temperature}</strong>
            </div>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)' }}>Test Cases</span>
              <strong style={{ color: 'var(--text-primary)' }}>{generatedPackage.testCases.length}</strong>
            </div>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)' }}>Version</span>
              <strong style={{ color: 'var(--text-primary)' }}>{generatedPackage.version}</strong>
            </div>
          </div>

          <div className="output-box" style={{ maxHeight: '400px', overflow: 'auto' }}>
            <FormattedOutput text={JSON.stringify(generatedPackage, null, 2)} />
          </div>
        </div>
      )}

      {!generatedPackage && !error && (
        <div className="empty-state">
          <p style={{ color: 'var(--text-secondary)' }}>
            Configure your prompt, select a model, add test cases, then generate a deployment package.
          </p>
        </div>
      )}
    </div>
  );
}

export default DeploymentExport;
