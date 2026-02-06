import React, { useState, useEffect } from 'react';
import { getExecutions } from '../services/api';
import { PromptExecution } from '../types';

interface GroupedExecutions {
  [category: string]: PromptExecution[];
}

export function VersionHistory() {
  const [executions, setExecutions] = useState<PromptExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadExecutions();
  }, []);

  const loadExecutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExecutions();
      const results = data && data.results ? data.results : [];
      setExecutions(results);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load execution history.');
    } finally {
      setLoading(false);
    }
  };

  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    executions.forEach((ex) => {
      if (ex.category) {
        cats.add(ex.category);
      }
    });
    return Array.from(cats).sort();
  }, [executions]);

  const filteredExecutions = React.useMemo(() => {
    return executions.filter((ex) => {
      const matchesCategory =
        selectedCategory === 'all' || ex.category === selectedCategory;
      const matchesSearch =
        searchTerm === '' ||
        (ex.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ex.model_used || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ex.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [executions, selectedCategory, searchTerm]);

  const groupedExecutions = React.useMemo((): GroupedExecutions => {
    const groups: GroupedExecutions = {};
    filteredExecutions.forEach((ex) => {
      const cat = ex.category || 'Uncategorized';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(ex);
    });
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    });
    return groups;
  }, [filteredExecutions]);

  const formatTimestamp = (ts: string | undefined): string => {
    if (!ts) return 'N/A';
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const formatCost = (cost: number | string | null | undefined): string => {
    if (cost === undefined || cost === null) return 'N/A';
    return `$${Number(cost).toFixed(4)}`;
  };

  const formatTokens = (tokens: number | string | null | undefined): string => {
    if (tokens === undefined || tokens === null) return 'N/A';
    const n = Number(tokens);
    if (isNaN(n)) return 'N/A';
    return n.toLocaleString();
  };

  return (
    <div style={{ padding: '1rem', color: 'var(--text-primary)' }}>
      <div className="page-header">
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Version History
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Browse prompt execution history grouped by category
        </p>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={loadExecutions}>
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Loading execution history...
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div
            className="card"
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label" style={{ color: 'var(--text-secondary)' }}>
                  Filter by Category
                </label>
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 2, minWidth: '250px' }}>
                <label className="form-label" style={{ color: 'var(--text-secondary)' }}>
                  Search
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Search by category, model, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="meta-row" style={{ marginTop: '0.75rem' }}>
              <span className="meta-item" style={{ color: 'var(--text-secondary)' }}>
                Showing {filteredExecutions.length} of {executions.length} executions
              </span>
              <span className="meta-item" style={{ color: 'var(--text-secondary)' }}>
                {Object.keys(groupedExecutions).length} categories
              </span>
            </div>
          </div>

          {Object.keys(groupedExecutions).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                No executions found
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {executions.length === 0
                  ? 'Run some prompts first, then come back to see your execution history here.'
                  : 'No executions match your current filters. Try adjusting the category or search term.'}
              </p>
            </div>
          ) : (
            Object.entries(groupedExecutions).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '2rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>{category}</h2>
                  <span className="badge badge-success">{items.length} versions</span>
                </div>

                <div
                  style={{
                    borderLeft: '2px solid var(--accent)',
                    paddingLeft: '1.5rem',
                    marginLeft: '0.5rem',
                  }}
                >
                  {items.map((execution, index) => (
                    <div
                      key={execution.id || index}
                      className="card"
                      style={{
                        marginBottom: '1rem',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-card)',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: '-2.05rem',
                          top: '1.25rem',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent)',
                        }}
                      />
                      <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                        <span
                          className="card-title"
                          style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}
                        >
                          {execution.template_name || execution.category || `Execution ${index + 1}`}
                        </span>
                        <span
                          className="badge badge-warning"
                          style={{ fontSize: '0.75rem' }}
                        >
                          v{items.length - index}
                        </span>
                      </div>
                      <div className="meta-row" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="meta-item">
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            Timestamp
                          </span>
                          <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {formatTimestamp(execution.created_at)}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            Model
                          </span>
                          <span style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
                            {execution.model_used || 'N/A'}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            Tokens
                          </span>
                          <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {formatTokens((execution.tokens_input || 0) + (execution.tokens_output || 0))}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            Cost
                          </span>
                          <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {formatCost(execution.cost_estimate)}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            Latency
                          </span>
                          <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {execution.latency_ms ? `${execution.latency_ms}ms` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default VersionHistory;
