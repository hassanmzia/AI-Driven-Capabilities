import React, { useState } from 'react';
import { FeatureLayout, ModelSelector } from '../components/shared/FeatureLayout';
import { executeQuizGenerator } from '../services/api';
import type { ExecutionResult } from '../types';

const EXAMPLE = `Introduction to Generative AI and Language Models (LLMs)
Generative AI refers to a subset of artificial intelligence that focuses on teaching machines to generate content autonomously. Language Models (LLMs) are deep learning algorithms designed to understand and generate human-like text. Key characteristics include: Pretraining on vast corpora of text data, Fine-tuning on specific tasks or domains, and Autoregressive Generation. The Transformer architecture, introduced in "Attention Is All You Need" by Vaswani et al. in 2017, revolutionized LLMs with self-attention mechanisms. Applications include content generation, chatbots, translation, summarization, question answering, and sentiment analysis.`;

export const QuizGenerator: React.FC = () => {
  const [content, setContent] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficultyMix, setDifficultyMix] = useState('2 easy, 2 intermediate, 1 hard');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!content.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await executeQuizGenerator({ content, num_questions: numQuestions, difficulty_mix: difficultyMix, model, temperature });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureLayout
      title="Training Quiz Generator"
      description="Generate multiple-choice quizzes from educational content with configurable difficulty levels"
      result={result} loading={loading} error={error}
    >
      <div className="form-group">
        <label className="form-label">Source Content</label>
        <textarea
          className="form-textarea"
          placeholder="Paste educational/training content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ minHeight: '160px' }}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Number of Questions</label>
          <input type="number" className="form-input" min={1} max={20} value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)} />
        </div>
        <div className="form-group">
          <label className="form-label">Difficulty Mix</label>
          <input type="text" className="form-input" value={difficultyMix} onChange={(e) => setDifficultyMix(e.target.value)} />
        </div>
      </div>
      <ModelSelector model={model} temperature={temperature} onModelChange={setModel} onTemperatureChange={setTemperature} />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !content.trim()}>
          {loading ? <><span className="loading-spinner" /> Generating...</> : 'Generate Quiz'}
        </button>
        <button className="btn btn-secondary" onClick={() => setContent(EXAMPLE)}>Load Example</button>
      </div>
    </FeatureLayout>
  );
};
