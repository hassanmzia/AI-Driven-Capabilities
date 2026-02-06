import React, { useEffect, useState } from 'react';
import { getMCPTools, getMCPInfo, executeMCPTool, getAgentCards } from '../services/api';
import type { MCPTool, AgentCard } from '../types';
import { FormattedOutput } from '../components/shared/FormattedOutput';

interface SchemaProperty {
  type: string;
  description?: string;
  default?: any;
  enum?: string[];
  minimum?: number;
  maximum?: number;
}

export const MCPExplorer: React.FC = () => {
  const [tab, setTab] = useState<'tools' | 'agents' | 'execute'>('tools');
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [serverInfo, setServerInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // Execute state
  const [selectedTool, setSelectedTool] = useState('');
  const [formArgs, setFormArgs] = useState<Record<string, any>>({});
  const [execResult, setExecResult] = useState<string | null>(null);
  const [execMeta, setExecMeta] = useState<Record<string, any> | null>(null);
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

  const currentTool = tools.find((t) => t.name === selectedTool);
  const schema = currentTool?.inputSchema as { properties?: Record<string, SchemaProperty>; required?: string[] } | undefined;
  const properties = schema?.properties || {};
  const required = schema?.required || [];

  const handleToolChange = (toolName: string) => {
    setSelectedTool(toolName);
    const tool = tools.find((t) => t.name === toolName);
    const props = (tool?.inputSchema as any)?.properties || {};
    const defaults: Record<string, any> = {};
    Object.entries(props).forEach(([key, prop]: [string, any]) => {
      if (prop.default !== undefined) defaults[key] = prop.default;
      else defaults[key] = '';
    });
    setFormArgs(defaults);
  };

  const updateArg = (key: string, value: any) => {
    setFormArgs((prev) => ({ ...prev, [key]: value }));
  };

  const handleExecuteTool = async () => {
    if (!selectedTool) return;
    setExecLoading(true); setExecError(null); setExecResult(null); setExecMeta(null);
    try {
      const args: Record<string, any> = {};
      Object.entries(formArgs).forEach(([key, value]) => {
        if (value !== '' && value !== undefined) args[key] = value;
      });
      const result = await executeMCPTool(selectedTool, args);
      // Extract LLM output text from MCP response wrapper
      const outputText = result?.content?.[0]?.text || result?.output || JSON.stringify(result, null, 2);
      setExecResult(outputText);
      if (result?.metadata) setExecMeta(result.metadata);
    } catch (e: any) {
      setExecError(e.message || 'Execution failed');
    } finally {
      setExecLoading(false);
    }
  };

  const formatLabel = (key: string): string =>
    key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const renderField = (key: string, prop: SchemaProperty) => {
    const isRequired = required.includes(key);
    const label = `${formatLabel(key)}${isRequired ? ' *' : ''}`;
    const value = formArgs[key] ?? prop.default ?? '';

    if (prop.enum) {
      return (
        <div className="form-group" key={key}>
          <label className="form-label">{label}</label>
          <select className="form-select" value={value} onChange={(e) => updateArg(key, e.target.value)}>
            {prop.enum.map((opt) => <option key={opt} value={opt}>{formatLabel(opt)}</option>)}
          </select>
          {prop.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{prop.description}</div>}
        </div>
      );
    }

    if (prop.type === 'number' || prop.type === 'integer') {
      return (
        <div className="form-group" key={key}>
          <label className="form-label">{label}</label>
          <input
            type="number"
            className="form-input"
            value={value}
            min={prop.minimum}
            max={prop.maximum}
            step={prop.type === 'number' ? 0.1 : 1}
            onChange={(e) => updateArg(key, e.target.value === '' ? '' : Number(e.target.value))}
          />
          {prop.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{prop.description}</div>}
        </div>
      );
    }

    const isLongText = isRequired || ['text', 'content', 'transcript', 'complaint', 'prompt', 'review'].some((k) => key.toLowerCase().includes(k));
    if (isLongText) {
      return (
        <div className="form-group" key={key}>
          <label className="form-label">{label}</label>
          <textarea
            className="form-textarea"
            placeholder={prop.description || ''}
            value={value}
            onChange={(e) => updateArg(key, e.target.value)}
            style={{ minHeight: '100px' }}
          />
        </div>
      );
    }

    return (
      <div className="form-group" key={key}>
        <label className="form-label">{label}</label>
        <input
          type="text"
          className="form-input"
          placeholder={prop.description || ''}
          value={value}
          onChange={(e) => updateArg(key, e.target.value)}
        />
      </div>
    );
  };

  const canExecute = selectedTool && required.every((key) => {
    const val = formArgs[key];
    return val !== undefined && val !== '';
  });

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
                    <FormattedOutput text={JSON.stringify(serverInfo, null, 2)} />
                  </div>
                </div>
              )}

              <div className="template-grid">
                {tools.map((tool) => (
                  <div key={tool.name} className="template-card" onClick={() => { handleToolChange(tool.name); setTab('execute'); }}>
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
                  <select className="form-select" value={selectedTool} onChange={(e) => handleToolChange(e.target.value)}>
                    <option value="">Select a tool...</option>
                    {tools.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                {selectedTool && Object.entries(properties).map(([key, prop]) => renderField(key, prop as SchemaProperty))}
                <button className="btn btn-primary" onClick={handleExecuteTool} disabled={execLoading || !canExecute} style={{ width: '100%', marginTop: '0.5rem' }}>
                  {execLoading ? <><span className="loading-spinner" /> Executing...</> : 'Execute via MCP'}
                </button>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom: '1rem' }}>Result</div>
                {execError && <div className="error-box">{execError}</div>}
                {execResult && (
                  <>
                    <div className="output-box"><FormattedOutput text={execResult} /></div>
                    {execMeta && (
                      <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                        {execMeta.execution_id && (
                          <div className="meta-item">ID: <strong style={{ fontSize: '0.7rem' }}>{execMeta.execution_id}</strong></div>
                        )}
                        {execMeta.tokens_input != null && (
                          <div className="meta-item">Tokens In: <strong>{execMeta.tokens_input}</strong></div>
                        )}
                        {execMeta.tokens_output != null && (
                          <div className="meta-item">Tokens Out: <strong>{execMeta.tokens_output}</strong></div>
                        )}
                        {execMeta.cost_estimate != null && (
                          <div className="meta-item">Cost: <strong>${Number(execMeta.cost_estimate).toFixed(5)}</strong></div>
                        )}
                        {execMeta.latency_ms != null && (
                          <div className="meta-item">Latency: <strong>{execMeta.latency_ms}ms</strong></div>
                        )}
                      </div>
                    )}
                  </>
                )}
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
