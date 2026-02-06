import React, { useState, useEffect } from 'react';
import { getTechniqueLibrary } from '../services/api';
import type { Technique } from '../types';

const CATEGORIES = ['All', 'Basic', 'Reasoning', 'Structure', 'Orchestration', 'Knowledge', 'Control', 'Security'] as const;

const categoryBadgeClass: Record<string, string> = {
  Basic: 'badge-success',
  Reasoning: 'badge-accent',
  Structure: 'badge-warning',
  Orchestration: 'badge-accent',
  Knowledge: 'badge-success',
  Control: 'badge-warning',
  Security: 'badge-warning',
};

export const TechniqueLibrary: React.FC = () => {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedName, setExpandedName] = useState<string | null>(null);

  useEffect(() => {
    getTechniqueLibrary()
      .then((data) => setTechniques(data.techniques || []))
      .catch(() => setTechniques([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = techniques.filter((t) => {
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    const query = search.toLowerCase();
    const matchesSearch =
      !query || t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const grouped = filtered.reduce<Record<string, Technique[]>>((acc, t) => {
    const key = t.category || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const sortedCategories = CATEGORIES.filter((c) => c !== 'All' && grouped[c]);
  const otherCategories = Object.keys(grouped).filter(
    (c) => !CATEGORIES.includes(c as any)
  );
  const categoryOrder = [...sortedCategories, ...otherCategories];

  const toggleExpand = (name: string) => {
    setExpandedName((prev) => (prev === name ? null : name));
  };

  return (
    <div>
      <div className="page-header">
        <h2>Technique Library</h2>
        <p>
          A searchable encyclopedia of prompt engineering techniques
          {!loading && (
            <span style={{ marginLeft: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {filtered.length} of {techniques.length} techniques
            </span>
          )}
        </p>
      </div>

      {/* Search bar */}
      <div className="form-group" style={{ maxWidth: '480px', marginBottom: '1rem' }}>
        <label className="form-label">Search techniques</label>
        <input
          className="form-input"
          type="text"
          placeholder="Filter by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No techniques found</h3>
          <p>Try adjusting your search or category filter.</p>
        </div>
      ) : (
        categoryOrder.map((category) => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            {/* Section header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.5rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {category}
              </h3>
              <span
                className="badge badge-accent"
                style={{ fontSize: '0.7rem' }}
              >
                {grouped[category].length}
              </span>
            </div>

            {/* Technique cards grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1rem',
              }}
            >
              {grouped[category].map((tech) => {
                const isExpanded = expandedName === tech.name;
                return (
                  <div
                    key={tech.name}
                    className="card"
                    onClick={() => toggleExpand(tech.name)}
                    style={{
                      cursor: 'pointer',
                      borderColor: isExpanded ? 'var(--accent)' : undefined,
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <div className="card-header" style={{ justifyContent: 'space-between' }}>
                      <span className="card-title" style={{ fontSize: '0.95rem' }}>
                        {tech.name}
                      </span>
                      <span className={`badge ${categoryBadgeClass[tech.category] || 'badge-accent'}`}>
                        {tech.category}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                      {tech.description}
                    </p>

                    {/* Collapsed: short preview; Expanded: full details */}
                    {isExpanded && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            When to Use
                          </label>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {tech.when_to_use}
                          </p>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            Example
                          </label>
                          <pre
                            style={{
                              background: 'var(--bg-tertiary, #1e1e2e)',
                              color: 'var(--text-primary)',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              margin: 0,
                              border: '1px solid var(--border)',
                            }}
                          >
                            <code>{tech.example}</code>
                          </pre>
                        </div>
                      </div>
                    )}

                    {!isExpanded && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Click to expand details
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
