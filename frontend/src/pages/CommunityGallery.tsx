import React, { useState, useEffect } from 'react';
import { getCommunityPrompts, sharePrompt, upvotePrompt, downloadSharedPrompt } from '../services/api';
import type { SharedPrompt } from '../types';

type SortMode = 'newest' | 'most_upvoted' | 'most_downloaded';

const CATEGORY_OPTIONS = [
  'General', 'Writing', 'Coding', 'Analysis', 'Education',
  'Marketing', 'Customer Support', 'Data', 'Creative', 'Other',
];

export const CommunityGallery: React.FC = () => {
  const [prompts, setPrompts] = useState<SharedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showShareForm, setShowShareForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Share form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSystemPrompt, setFormSystemPrompt] = useState('');
  const [formUserPrompt, setFormUserPrompt] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formTags, setFormTags] = useState('');

  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCommunityPrompts();
      setPrompts(res.results || []);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to load community prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleUpvote = async (id: string) => {
    try {
      await upvotePrompt(id);
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p))
      );
    } catch (e: any) {
      console.error('Upvote failed', e);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await downloadSharedPrompt(id);
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, downloads: p.downloads + 1 } : p))
      );
    } catch (e: any) {
      console.error('Download failed', e);
    }
  };

  const handleShare = async () => {
    if (!formTitle.trim() || !formUserPrompt.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const tags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const newPrompt = await sharePrompt({
        title: formTitle,
        description: formDescription,
        system_prompt: formSystemPrompt,
        user_prompt_template: formUserPrompt,
        category: formCategory,
        tags,
      });
      setPrompts((prev) => [newPrompt, ...prev]);
      setSubmitSuccess(true);
      setFormTitle('');
      setFormDescription('');
      setFormSystemPrompt('');
      setFormUserPrompt('');
      setFormCategory('General');
      setFormTags('');
      setTimeout(() => {
        setShowShareForm(false);
        setSubmitSuccess(false);
      }, 1500);
    } catch (e: any) {
      setSubmitError(e.response?.data?.error || e.message || 'Failed to share prompt');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and sort
  const filtered = prompts
    .filter((p) => {
      if (filterCategory && p.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.author_name.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortMode === 'most_upvoted') return b.upvotes - a.upvotes;
      if (sortMode === 'most_downloaded') return b.downloads - a.downloads;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div>
      <div className="page-header">
        <h2>Community Gallery</h2>
        <p>Browse, share, and discover prompts from the community</p>
      </div>

      {/* Toolbar */}
      <div className="card">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 220px' }}>
            <label className="form-label">Search</label>
            <input
              className="form-input"
              placeholder="Search prompts by title, tag, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 160px' }}>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 170px' }}>
            <label className="form-label">Sort By</label>
            <select
              className="form-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="newest">Newest</option>
              <option value="most_upvoted">Most Upvoted</option>
              <option value="most_downloaded">Most Downloaded</option>
            </select>
          </div>
          <button
            className={`btn ${showShareForm ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setShowShareForm(!showShareForm)}
          >
            {showShareForm ? 'Cancel' : 'Share a Prompt'}
          </button>
        </div>
      </div>

      {/* Share Form */}
      {showShareForm && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Share a Prompt</div>
          </div>
          {submitSuccess && (
            <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.1)', borderRadius: '0.375rem', color: 'var(--success, #22c55e)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              Prompt shared successfully!
            </div>
          )}
          {submitError && <div className="error-box" style={{ marginBottom: '1rem' }}>{submitError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" placeholder="Prompt title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" placeholder="Brief description of the prompt" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">System Prompt</label>
            <textarea className="form-textarea" placeholder="System prompt (optional)" value={formSystemPrompt} onChange={(e) => setFormSystemPrompt(e.target.value)} style={{ minHeight: '70px' }} />
          </div>
          <div className="form-group">
            <label className="form-label">User Prompt Template</label>
            <textarea className="form-textarea" placeholder="User prompt template..." value={formUserPrompt} onChange={(e) => setFormUserPrompt(e.target.value)} style={{ minHeight: '80px' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-input" placeholder="e.g. writing, creative, marketing" value={formTags} onChange={(e) => setFormTags(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleShare} disabled={submitting || !formTitle.trim() || !formUserPrompt.trim()}>
            {submitting ? <><span className="loading-spinner" /> Sharing...</> : 'Share Prompt'}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading community prompts...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Prompt Grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map((p) => (
            <div className="card" key={p.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ paddingBottom: '0.25rem' }}>
                <div className="card-title" style={{ fontSize: '0.95rem' }}>{p.title}</div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 0.75rem', flex: 1 }}>
                {p.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <span className="badge badge-accent">{p.category}</span>
                {p.tags.slice(0, 3).map((t) => (
                  <span className="badge" key={t} style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>{t}</span>
                ))}
              </div>
              <div className="meta-row" style={{ fontSize: '0.78rem' }}>
                <div className="meta-item">By <strong style={{ color: 'var(--text-primary)' }}>{p.author_name || 'Anonymous'}</strong></div>
                <div className="meta-item" style={{ color: 'var(--text-secondary)' }}>{p.upvotes} upvotes</div>
                <div className="meta-item" style={{ color: 'var(--text-secondary)' }}>{p.downloads} downloads</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => handleUpvote(p.id)}>
                  Upvote
                </button>
                <button className="btn btn-sm btn-primary" onClick={() => handleDownload(p.id)}>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p style={{ color: 'var(--text-secondary)' }}>
              {prompts.length === 0
                ? 'No community prompts yet. Be the first to share one!'
                : 'No prompts match your search or filter criteria.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
