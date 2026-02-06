import React, { useState } from 'react';
import { FeatureLayout, ModelSelector } from '../components/shared/FeatureLayout';
import { executeMeetingSummarizer, exportMeetingToDocx } from '../services/api';
import type { ExecutionResult } from '../types';

const EXAMPLE = `John: Good morning, everyone. Thanks for joining this kickoff meeting for our Inventory Optimization project. As you know, we've been facing inventory management challenges at RetailSmart.
Sarah: Morning, John. I'm excited to tackle this project. It's a great opportunity to boost profitability.
Mike: Absolutely, John. Getting the data ready is my top priority.
John: Sarah, could you summarize the problem and objectives?
Sarah: RetailSmart operates stores across various locations, and the core problem is figuring out how much of each product to stock to maximize profit. Our approach will involve data science and regression modeling.
John: Mike, how's our data situation?
Mike: We've got historical sales data but there are some missing values. I'll complete data cleaning by October 5th.
Sarah: I'll build the initial regression model and have results by October 15th.
John: Let's document risks and reconvene on October 15th.`;

export const MeetingSummarizer: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExecute = async () => {
    if (!transcript.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await executeMeetingSummarizer({ transcript, model, temperature });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportDocx = async () => {
    if (!result?.execution_id) return;
    setExporting(true);
    try {
      await exportMeetingToDocx(result.execution_id);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <FeatureLayout
      title="Meeting Notes Summarizer"
      description="Summarize meeting transcripts into structured notes with objectives, participants, and action items"
      result={result} loading={loading} error={error}
      extraActions={result && !loading ? (
        <button className="btn btn-secondary btn-sm" onClick={handleExportDocx} disabled={exporting}>
          {exporting ? <><span className="loading-spinner" /> Exporting...</> : 'Download Word'}
        </button>
      ) : undefined}
    >
      <div className="form-group">
        <label className="form-label">Meeting Transcript</label>
        <textarea
          className="form-textarea"
          placeholder="Paste meeting transcript here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          style={{ minHeight: '200px' }}
        />
      </div>
      <ModelSelector model={model} temperature={temperature} onModelChange={setModel} onTemperatureChange={setTemperature} />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !transcript.trim()}>
          {loading ? <><span className="loading-spinner" /> Summarizing...</> : 'Summarize Meeting'}
        </button>
        <button className="btn btn-secondary" onClick={() => setTranscript(EXAMPLE)}>Load Example</button>
      </div>
    </FeatureLayout>
  );
};
