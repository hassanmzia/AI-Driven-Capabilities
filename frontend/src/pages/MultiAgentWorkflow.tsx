import React, { useState } from 'react';
import { runMultiAgentWorkflow } from '../services/api';

interface WorkflowResult {
  workflow_id: string;
  results: Array<{ agent: string; output: string }>;
  total_agents: number;
}

export const MultiAgentWorkflow: React.FC = () => {
  const [task, setTask] = useState('');
  const [category, setCategory] = useState('feedback_analysis');
  const [inputData, setInputData] = useState('');
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!task.trim() || !inputData.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await runMultiAgentWorkflow(task, category, inputData);
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Workflow failed');
    } finally {
      setLoading(false);
    }
  };

  const agentLabels: Record<string, { name: string; role: string; color: string }> = {
    router: { name: 'Task Router Agent', role: 'Analyzes the task and routes to appropriate agents', color: '#3b82f6' },
    primary: { name: 'Primary Content Agent', role: 'Executes the main task using the appropriate prompt template', color: '#22c55e' },
    reviewer: { name: 'Quality Reviewer Agent', role: 'Evaluates output quality and suggests improvements', color: '#f59e0b' },
  };

  return (
    <div>
      <div className="page-header">
        <h2>Multi-Agent Workflow</h2>
        <p>Orchestrate A2A multi-agent pipelines with automatic routing, execution, and quality review</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1rem' }}>Workflow Configuration</div>
            <div className="form-group">
              <label className="form-label">Task Description</label>
              <input type="text" className="form-input" placeholder="Describe what you want the agents to do..." value={task} onChange={(e) => setTask(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="feedback_analysis">Feedback Analysis</option>
                <option value="meeting_summarizer">Meeting Summarizer</option>
                <option value="quiz_generator">Quiz Generator</option>
                <option value="slide_script">Slide Script</option>
                <option value="complaint_response">Complaint Response</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Input Data</label>
              <textarea className="form-textarea" placeholder="Provide the input data for the workflow..." value={inputData} onChange={(e) => setInputData(e.target.value)} style={{ minHeight: '150px' }} />
            </div>
            <button className="btn btn-primary" onClick={handleExecute} disabled={loading || !task.trim() || !inputData.trim()} style={{ width: '100%' }}>
              {loading ? <><span className="loading-spinner" /> Running Pipeline...</> : 'Run Multi-Agent Pipeline'}
            </button>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: '0.75rem' }}>Agent Pipeline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(agentLabels).map(([key, agent], idx) => (
                <div key={key} style={{ padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '0.5rem', borderLeft: `3px solid ${agent.color}` }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{idx + 1}. {agent.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{agent.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {error && <div className="error-box" style={{ marginBottom: '1rem' }}>{error}</div>}

          {loading && (
            <div className="card">
              <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                <h3>Running Multi-Agent Pipeline</h3>
                <p>Router &rarr; Primary Agent &rarr; Quality Reviewer</p>
              </div>
            </div>
          )}

          {result && (
            <div>
              <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="card-title">Workflow Complete</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {result.total_agents} agents executed successfully
                    </div>
                  </div>
                  <span className="badge badge-success">Completed</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Workflow ID: {result.workflow_id}
                </div>
              </div>

              {result.results.map((r) => {
                const info = agentLabels[r.agent] || { name: r.agent, role: '', color: '#6366f1' };
                const isExpanded = expandedAgent === r.agent;
                return (
                  <div key={r.agent} className="card" style={{ borderLeft: `3px solid ${info.color}` }}>
                    <div
                      className="card-header"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedAgent(isExpanded ? null : r.agent)}
                    >
                      <div>
                        <div className="card-title">{info.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{info.role}</div>
                      </div>
                      <span style={{ fontSize: '1.2rem' }}>{isExpanded ? '−' : '+'}</span>
                    </div>
                    {isExpanded && (
                      <div className="output-box" style={{ marginTop: '0.5rem' }}>
                        {r.output}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="card">
              <div className="empty-state">
                <h3>Multi-Agent System Ready</h3>
                <p>Configure your workflow and click "Run Multi-Agent Pipeline" to see the agents collaborate via A2A protocol.</p>
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>How it works:</strong><br />
                  1. <strong>Router Agent</strong> analyzes your task and determines the best approach<br />
                  2. <strong>Primary Agent</strong> executes the main task using the appropriate prompt template<br />
                  3. <strong>Reviewer Agent</strong> evaluates the output quality and provides feedback
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
