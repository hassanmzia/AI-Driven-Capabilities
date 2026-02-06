import React, { useState } from 'react';
import { FeatureLayout, ModelSelector } from '../components/shared/FeatureLayout';
import { executeFeedbackAnalysis } from '../services/api';
import type { ExecutionResult } from '../types';

const EXAMPLE = `John Smith - I recently had the privilege of consulting with Dr. Emily Roberts, a board-certified Family Physician, and I must say it was an exceptional experience. From start to finish, everything about my visit was top-notch, and I couldn't be more satisfied with the care I received. Dr. Roberts' credentials and professionalism were immediately evident. Her warm and welcoming demeanor put me at ease right away. She took the time to listen attentively to my concerns, showing genuine empathy and understanding. My rating for this consultation is a resounding five out of five stars.`;

export const FeedbackAnalysis: React.FC = () => {
  const [reviewText, setReviewText] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!reviewText.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await executeFeedbackAnalysis({ review_text: reviewText, model, temperature });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureLayout
      title="Customer Feedback Analysis"
      description="Extract structured insights from customer/patient reviews - sentiment, ratings, satisfaction, and issue tags"
      result={result} loading={loading} error={error}
    >
      <div className="form-group">
        <label className="form-label">Customer/Patient Review</label>
        <textarea
          className="form-textarea"
          placeholder="Paste customer review or patient feedback here..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          style={{ minHeight: '200px' }}
        />
      </div>
      <ModelSelector model={model} temperature={temperature} onModelChange={setModel} onTemperatureChange={setTemperature} />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !reviewText.trim()}>
          {loading ? <><span className="loading-spinner" /> Analyzing...</> : 'Analyze Feedback'}
        </button>
        <button className="btn btn-secondary" onClick={() => setReviewText(EXAMPLE)}>Load Example</button>
      </div>
    </FeatureLayout>
  );
};
