import React, { useState } from 'react';
import { generateSnippet } from '../services/api';

const LANGUAGES = ['Python', 'JavaScript', 'cURL', 'LangChain'] as const;
type Language = typeof LANGUAGES[number];

const LANG_COLORS: Record<Language, string> = {
  Python: '#3572A5', JavaScript: '#f1e05a', cURL: '#89e051', LangChain: '#6366f1',
};

export const SnippetGenerator: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPromptTemplate, setUserPromptTemplate] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [selectedTab, setSelectedTab] = useState<Language>('Python');
  const [snippet, setSnippet] = useState<string | null>(null);
  const [snippetLang, setSnippetLang] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cache, setCache] = useState<Record<string, string>>({});

  const canGenerate = systemPrompt.trim() && userPromptTemplate.trim() && !loading;

  const fetchSnippet = async (lang: Language) => {
    setLoading(true);
    setError(null);
    setSnippet(null);
    try {
      const res = await generateSnippet({
        system_prompt: systemPrompt,
        user_prompt_template: userPromptTemplate,
        model,
        language: lang,
      });
      setSnippet(res.snippet);
      setSnippetLang(res.language || lang);
      setCache((prev) => ({ ...prev, [lang]: res.snippet }));
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Snippet generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (lang: Language) => {
    setSelectedTab(lang);
    setCopied(false);
    if (cache[lang]) {
      setSnippet(cache[lang]);
      setSnippetLang(lang);
      return;
    }
    if (systemPrompt.trim() && userPromptTemplate.trim()) fetchSnippet(lang);
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    setCache({});
    setCopied(false);
    fetchSnippet(selectedTab);
  };

  const clearCache = () => { setCache({}); setSnippet(null); setSnippetLang(''); setCopied(false); };

  const handleCopy = async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* noop */ }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Code Snippet Generator</h2>
        <p>Generate production-ready code snippets for your prompts in multiple languages</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Input */}
        <div className="card">
          <div className="card-header"><div className="card-title">Prompt Configuration</div></div>

          <div className="form-group">
            <label className="form-label">System Prompt</label>
            <textarea
              className="form-textarea"
              placeholder="Enter the system prompt that defines the AI's behavior..."
              value={systemPrompt}
              onChange={(e) => { setSystemPrompt(e.target.value); clearCache(); }}
              style={{ minHeight: '120px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">User Prompt Template</label>
            <textarea
              className="form-textarea"
              placeholder="Enter the user prompt template with {placeholders}..."
              value={userPromptTemplate}
              onChange={(e) => { setUserPromptTemplate(e.target.value); clearCache(); }}
              style={{ minHeight: '120px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Model</label>
            <select className="form-select" value={model}
              onChange={(e) => { setModel(e.target.value); clearCache(); }}>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleGenerate} disabled={!canGenerate}>
            {loading ? <><span className="loading-spinner" /> Generating...</> : 'Generate Snippet'}
          </button>
        </div>

        {/* Output */}
        <div className="card">
          <div className="card-header"><div className="card-title">Generated Code</div></div>

          {/* Language Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            {LANGUAGES.map((lang) => {
              const active = selectedTab === lang;
              return (
                <button
                  key={lang}
                  className={active ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                  onClick={() => handleTabClick(lang)}
                  disabled={loading}
                  style={{
                    borderRadius: '0.375rem 0.375rem 0 0',
                    borderBottom: active ? '2px solid var(--accent, #6366f1)' : '2px solid transparent',
                    opacity: loading && !active ? 0.6 : 1,
                  }}
                >
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: LANG_COLORS[lang], marginRight: '0.4rem',
                  }} />
                  {lang}
                  {cache[lang] && !active && (
                    <span style={{
                      display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
                      background: 'var(--success, #22c55e)', marginLeft: '0.35rem',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="empty-state">
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Generating {selectedTab} snippet...</p>
            </div>
          )}

          {error && !loading && <div className="error-box">{error}</div>}

          {snippet && !loading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>{snippetLang}</span>
                <button className="btn btn-secondary btn-sm" onClick={handleCopy}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>

              <div style={{
                background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem', padding: '1rem 1.25rem',
                overflowX: 'auto', maxHeight: 500, overflowY: 'auto',
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: "'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace",
                  fontSize: '0.82rem', lineHeight: '1.65', color: '#e6edf3',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', tabSize: 4,
                }}>
                  <code>{snippet}</code>
                </pre>
              </div>

              <div className="meta-row" style={{ marginTop: '0.75rem' }}>
                <div className="meta-item">Language: <strong>{snippetLang}</strong></div>
                <div className="meta-item">Model: <strong>{model}</strong></div>
                <div className="meta-item">Lines: <strong>{snippet.split('\n').length}</strong></div>
              </div>
            </div>
          )}

          {!snippet && !loading && !error && (
            <div className="empty-state">
              <h3>No snippet generated yet</h3>
              <p>Configure your prompt and click Generate Snippet or select a language tab</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
