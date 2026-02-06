import React, { useState, useEffect } from 'react';
import { getProjects, createProject, deleteProject } from '../services/api';
import type { PromptProject } from '../types';

export const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<PromptProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data.results);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async () => {
    if (!formName.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const tags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await createProject({ name: formName.trim(), description: formDescription.trim(), tags });
      setFormName('');
      setFormDescription('');
      setFormTags('');
      setShowForm(false);
      await fetchProjects();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (project: PromptProject) => {
    if (!window.confirm(`Delete project "${project.name}"? This action cannot be undone.`)) return;
    setError(null);
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to delete project');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>Project Manager</h2>
        <p>Organize your prompt projects, track test suites, and manage shared workspaces</p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <input
          className="form-input"
          placeholder="Search projects by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 260px', minWidth: 0 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : 'New Project'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="error-box" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* New Project Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Create New Project</div>
          </div>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className="form-input"
              placeholder="My Prompt Project"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Brief description of the project..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              style={{ minHeight: '80px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input
              className="form-input"
              placeholder="e.g. production, gpt-4, summarization"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!formName.trim() || submitting}
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading projects...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {search ? 'No projects match your search' : 'No projects yet'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {search
                ? 'Try a different search term or clear the filter.'
                : 'Click "New Project" above to create your first prompt project.'}
            </p>
          </div>
        </div>
      )}

      {/* Project Grid */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filtered.map((project) => (
            <div className="card" key={project.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="card-title" style={{ flex: 1, marginRight: '0.5rem' }}>
                  {project.name}
                </div>
                {project.is_shared && (
                  <span className="badge badge-accent" style={{ flexShrink: 0 }}>Shared</span>
                )}
              </div>

              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '0.75rem',
                  flex: 1,
                }}
              >
                {project.description || 'No description provided.'}
              </p>

              {/* Tags */}
              {project.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {project.tags.map((tag) => (
                    <span className="badge badge-warning" key={tag} style={{ fontSize: '0.72rem' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats Row */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.75rem',
                }}
              >
                <span>
                  <strong style={{ color: 'var(--text-secondary)' }}>{project.prompt_count}</strong> prompts
                </span>
                <span>
                  <strong style={{ color: 'var(--text-secondary)' }}>{project.test_suite_count}</strong> test suites
                </span>
              </div>

              {/* Dates */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '0.65rem',
                  marginBottom: '0.75rem',
                }}
              >
                <span>Created {formatDate(project.created_at)}</span>
                <span>Updated {formatDate(project.updated_at)}</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--error)' }}
                  onClick={() => handleDelete(project)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
