import React, { useState } from 'react';
import { runConsistencyCheck } from '../services/api';
import { FormattedOutput } from '../components/shared/FormattedOutput';

interface RunOutput {
  runIndex: number;
  output: string;
}

interface AnalysisSummary {
  consistency_score: number;
  consistent_elements: string[];
  varying_elements: string[];
  recommendation: string;
}

interface ConsistencyResult {
  runs: Array<{ output?: string } | string>;
  analysis?: {
    consistency_score: number;
    consistent_elements?: string[];
    varying_elements?: string[];
    recommendation?: string;
  };
}

export function ConsistencyAnalyzer() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [inputText, setInputText] = useState('');
  const [numRuns, setNumRuns] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runOutputs, setRunOutputs] = useState<RunOutput[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [selectedRun, setSelectedRun] = useState<number | null>(null);

  const handleExecute = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setLoading(true);
    setError(null);
    setRunOutputs([]);
    setAnalysis(null);
    setSelectedRun(null);

    try {
      const response = await runConsistencyCheck({
        prompt_text: prompt,
        system_prompt: systemPrompt || undefined,
        input_text: inputText || '',
        num_runs: numRuns,
      });

      const parsed: ConsistencyResult = typeof response === 'string' ? JSON.parse(response) : response;

      const outputs: RunOutput[] = (parsed.runs || []).map((r: any, idx: number) => ({
        runIndex: idx + 1,
        output: typeof r === 'string' ? r : r.output || '',
      }));
      setRunOutputs(outputs);

      if (parsed.analysis) {
        setAnalysis({
          consistency_score: parsed.analysis.consistency_score,
          consistent_elements: parsed.analysis.consistent_elements || [],
          varying_elements: parsed.analysis.varying_elements || [],
          recommendation: parsed.analysis.recommendation || '',
        });
      }

      if (outputs.length > 0) {
        setSelectedRun(0);
      }
    } catch (err: any) {
      setError(err.message || 'Consistency check failed.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return '#22c55e';
    if (score >= 0.5) return '#eab308';
    return '#ef4444';
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 0.8) return 'badge-success';
    if (score >= 0.5) return 'badge-warning';
    return 'badge-error';
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ color: 'var(--text-primary)' }}>Consistency Analyzer</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Run the same prompt multiple times and analyze output variance.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Configuration</h2>
        </div>

        <div className="form-group">
          <label className="form-label">Prompt</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Enter the prompt to test for consistency..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">System Prompt (optional)</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Optional system-level instructions..."
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Input Text (optional)</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Input text to include with each run..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Number of Runs</label>
          <select
            className="form-select"
            value={numRuns}
            onChange={e => setNumRuns(Number(e.target.value))}
          >
            {Array.from({ length: 9 }, (_, i) => i + 2).map(n => (
              <option key={n} value={n}>{n} runs</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleExecute}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : `Run ${numRuns} Times & Analyze`}
        </button>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Running prompt {numRuns} times and analyzing variance...
          </p>
        </div>
      )}

      {!loading && analysis && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">Analysis Summary</h2>
            <span className={`badge ${getScoreBadge(analysis.consistency_score)}`}>
              Score: {(analysis.consistency_score * 100).toFixed(0)}%
            </span>
          </div>

          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Consistency Score</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{
                  flex: 1, height: '12px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${analysis.consistency_score * 100}%`, height: '100%',
                    borderRadius: '6px', background: getScoreColor(analysis.consistency_score),
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <strong style={{ color: 'var(--text-primary)', minWidth: '3rem' }}>
                  {(analysis.consistency_score * 100).toFixed(0)}%
                </strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                  Consistent Elements
                </label>
                {analysis.consistent_elements.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None identified</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                    {analysis.consistent_elements.map((el, i) => (
                      <li key={i} style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{el}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                  Varying Elements
                </label>
                {analysis.varying_elements.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None identified</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                    {analysis.varying_elements.map((el, i) => (
                      <li key={i} style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{el}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {analysis.recommendation && (
              <div className="output-box" style={{ marginTop: '0.75rem' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                  Recommendation
                </label>
                <FormattedOutput text={analysis.recommendation} />
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && runOutputs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Individual Run Outputs</h2>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {runOutputs.map((ro, idx) => (
              <button
                key={idx}
                className={`btn btn-sm ${selectedRun === idx ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedRun(idx)}
              >
                Run {ro.runIndex}
              </button>
            ))}
          </div>

          {selectedRun !== null && runOutputs[selectedRun] && (
            <div className="output-box">
              <div style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Run #{runOutputs[selectedRun].runIndex} Output
              </div>
              <FormattedOutput text={runOutputs[selectedRun].output} />
            </div>
          )}
        </div>
      )}

      {!loading && runOutputs.length === 0 && !error && (
        <div className="empty-state">
          <p style={{ color: 'var(--text-secondary)' }}>
            Configure your prompt above and select the number of runs to analyze consistency.
          </p>
        </div>
      )}
    </div>
  );
}

export default ConsistencyAnalyzer;
