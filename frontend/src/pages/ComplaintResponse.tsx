import React, { useState } from 'react';
import { FeatureLayout, ModelSelector } from '../components/shared/FeatureLayout';
import { executeComplaintResponse } from '../services/api';
import type { ExecutionResult } from '../types';

const EXAMPLE = `My smart refrigerator has started ordering ice cream on its own, and now my freezer is overflowing with it! It's turning my kitchen into an Arctic wonderland, and I need a solution before the ice cream takes over the world.`;

export const ComplaintResponse: React.FC = () => {
  const [complaint, setComplaint] = useState('');
  const [companyName, setCompanyName] = useState('TechFast');
  const [agentName, setAgentName] = useState('Alex');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.3);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!complaint.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await executeComplaintResponse({ complaint, company_name: companyName, agent_name: agentName, model, temperature });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureLayout
      title="Complaint Response Generator"
      description="Generate professional, empathetic responses to customer complaints with sentiment analysis"
      result={result} loading={loading} error={error}
    >
      <div className="form-group">
        <label className="form-label">Customer Complaint</label>
        <textarea
          className="form-textarea"
          placeholder="Enter customer complaint..."
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          style={{ minHeight: '150px' }}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input type="text" className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Agent Name</label>
          <input type="text" className="form-input" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
        </div>
      </div>
      <ModelSelector model={model} temperature={temperature} onModelChange={setModel} onTemperatureChange={setTemperature} />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !complaint.trim()}>
          {loading ? <><span className="loading-spinner" /> Generating...</> : 'Generate Response'}
        </button>
        <button className="btn btn-secondary" onClick={() => setComplaint(EXAMPLE)}>Load Example</button>
      </div>
    </FeatureLayout>
  );
};
