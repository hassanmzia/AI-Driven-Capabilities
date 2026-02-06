import React, { useState } from 'react';
import { FeatureLayout, ModelSelector } from '../components/shared/FeatureLayout';
import { executeSlideScript, exportSlidesToPPTX } from '../services/api';
import type { ExecutionResult } from '../types';

export const SlideScriptGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [numSlides, setNumSlides] = useState(3);
  const [style, setStyle] = useState('professional');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExecute = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await executeSlideScript({ topic, num_slides: numSlides, style, model, temperature });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPPTX = async () => {
    if (!result?.execution_id) return;
    setExporting(true);
    try {
      await exportSlidesToPPTX(result.execution_id);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <FeatureLayout
      title="Slide Script Generator"
      description="Generate presentation slide scripts with titles, bullet points, and speaker notes"
      result={result} loading={loading} error={error}
      extraActions={result && !loading ? (
        <button className="btn btn-secondary btn-sm" onClick={handleExportPPTX} disabled={exporting}>
          {exporting ? <><span className="loading-spinner" /> Exporting...</> : 'Download PowerPoint'}
        </button>
      ) : undefined}
    >
      <div className="form-group">
        <label className="form-label">Presentation Topic</label>
        <input
          type="text" className="form-input"
          placeholder="e.g., Cryptocurrency, Machine Learning Fundamentals..."
          value={topic} onChange={(e) => setTopic(e.target.value)}
        />
      </div>
      <div className="form-row-3">
        <div className="form-group">
          <label className="form-label">Number of Slides</label>
          <input type="number" className="form-input" min={1} max={20} value={numSlides} onChange={(e) => setNumSlides(parseInt(e.target.value) || 3)} />
        </div>
        <div className="form-group">
          <label className="form-label">Style</label>
          <select className="form-select" value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="academic">Academic</option>
            <option value="sales">Sales Pitch</option>
          </select>
        </div>
        <div />
      </div>
      <ModelSelector model={model} temperature={temperature} onModelChange={setModel} onTemperatureChange={setTemperature} />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !topic.trim()}>
          {loading ? <><span className="loading-spinner" /> Generating...</> : 'Generate Script'}
        </button>
        <button className="btn btn-secondary" onClick={() => setTopic('Cryptocurrency: The Future of Digital Finance')}>Load Example</button>
      </div>
    </FeatureLayout>
  );
};
