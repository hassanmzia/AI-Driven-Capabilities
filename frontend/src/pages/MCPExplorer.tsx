import React, { useEffect, useState } from 'react';
import { getMCPTools, getMCPInfo, executeMCPTool, getAgentCards } from '../services/api';
import type { MCPTool, AgentCard } from '../types';

export const MCPExplorer: React.FC = () => {
  const [tab, setTab] = useState<'tools' | 'agents' | 'execute'>('tools');
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [serverInfo, setServerInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // Execute state
  const [selectedTool, setSelectedTool] = useState('');
  const [toolArgs, setToolArgs] = useState('{}');
  const [execResult, setExecResult] = useState<string | null>(null);
  const [execLoading, setExecLoading] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getMCPTools().catch(() => ({ tools: [] })),
      getMCPInfo().catch(() => null),
      getAgentCards().catch(() => ({ agents: [] })),
    ]).then(([toolsData, info, agentsData]) => {
      setTools(toolsData.tools || []);
      setServerInfo(info);
      setAgents(agentsData.agents || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleExecuteTool = async () => {
    if (!selectedTool) return;
    setExecLoading(true); setExecError(null); setExecResult(null);
    try {
      const args = JSON.parse(toolArgs);
      const result = await executeMCPTool(selectedTool, args);
      setExecResult(JSON.stringify(result, null, 2));
    } catch (e: any) {
      setExecError(e.message || 'Execution failed');
    } finally {
      setExecLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>MCP & A2A Explorer</h2>
        <p>Explore Model Context Protocol tools and Agent-to-Agent capabilities</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'tools' ? 'active' : ''}`} onClick={() => setTab('tools')}>MCP Tools</button>
        <button className={`tab ${tab === 'agents' ? 'active' : ''}`} onClick={() => setTab('agents')}>A2A Agents</button>
        <button className={`tab ${tab === 'execute' ? 'active' : ''}`} onClick={() => setTab('execute')}>Execute Tool</button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /></div>
      ) : (
        <>
          {tab === 'tools' && (
            <div>
              {serverInfo && (
                <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--accent)' }}>
                  <div className="card-title">MCP Server Info</div>
                  <div className="output-box" style={{ marginTop: '0.5rem', maxHeight: '150px' }}>
                    {JSON.stringify(serverInfo, null, 2)}
                  </div>
                </div>
              )}

              <div className="template-grid">
                {tools.map((tool) => (
                  <div key={tool.name} className="template-card" onClick={() => { setSelectedTool(tool.name); setTab('execute'); }}>
                    <h3 style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{tool.name}</h3>
                    <p>{tool.description}</p>
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>Input Schema</summary>
                      <pre style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(tool.inputSchema, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>

              {tools.length === 0 && (
                <div className="empty-state">
                  <h3>No MCP tools available</h3>
                  <p>Ensure the gateway service is running.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'agents' && (
            <div className="template-grid">
              {agents.length > 0 ? agents.map((agent) => (
                <div key={agent.agent_id} className="template-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="badge badge-accent">{agent.type}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>A2A v{agent.protocol_version}</span>
                  </div>
                  <h3>{agent.name}</h3>
                  <p>{agent.description}</p>
                  {agent.capabilities?.length > 0 && (
                    <div className="tag-list" style={{ marginTop: '0.5rem' }}>
                      {agent.capabilities.map((cap) => <span key={cap} className="tag">{cap}</span>)}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Model: {agent.model}
                  </div>
                </div>
              )) : (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <h3>No A2A agents registered</h3>
                  <p>Agents are created through the backend admin or API.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'execute' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: '1rem' }}>Execute MCP Tool</div>
                <div className="form-group">
                  <label className="form-label">Tool Name</label>
                  <select className="form-select" value={selectedTool} onChange={(e) => setSelectedTool(e.target.value)}>
                    <option value="">Select a tool...</option>
                    {tools.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Arguments (JSON)</label>
                  <textarea
                    className="form-textarea"
                    value={toolArgs}
                    onChange={(e) => setToolArgs(e.target.value)}
                    style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </div>
                <button className="btn btn-primary" onClick={handleExecuteTool} disabled={execLoading || !selectedTool}>
                  {execLoading ? <><span className="loading-spinner" /> Executing...</> : 'Execute via MCP'}
                </button>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom: '1rem' }}>Result</div>
                {execError && <div className="error-box">{execError}</div>}
                {execResult && <div className="output-box">{execResult}</div>}
                {!execResult && !execError && (
                  <div className="empty-state">
                    <p>Select a tool and provide arguments to execute</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
