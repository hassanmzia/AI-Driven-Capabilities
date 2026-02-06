import React, { useState, useEffect } from 'react';
import { getCollections, createCollection, getFavorites, removeFavorite } from '../services/api';
import { PromptCollection, PromptFavorite } from '../types';

export function FavoritesManager() {
  const [collections, setCollections] = useState<PromptCollection[]>([]);
  const [favorites, setFavorites] = useState<PromptFavorite[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [collectionsData, favoritesData] = await Promise.all([
        getCollections(),
        getFavorites(),
      ]);
      setCollections(collectionsData.results || []);
      setFavorites(favoritesData.results || []);
    } catch (err) {
      setError('Failed to load favorites data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      await createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim(),
      });
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      setError('Failed to create collection.');
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    setRemovingId(favoriteId);
    try {
      await removeFavorite(favoriteId);
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch (err) {
      setError('Failed to remove favorite.');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredFavorites = React.useMemo(() => {
    if (activeTab === 'all') return favorites;
    return favorites.filter((f) => f.collection === activeTab);
  }, [favorites, activeTab]);

  const formatDate = (date: string | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={{ padding: '1rem', color: 'var(--text-primary)' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Favorites Manager
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Organize and manage your favorited prompts across collections
            </p>
          </div>
          {!loading && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : 'Create Collection'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Loading favorites...
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {showCreateForm && (
        <div
          className="card"
          style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="card-header" style={{ marginBottom: '0.75rem' }}>
            <span className="card-title" style={{ color: 'var(--text-primary)' }}>
              New Collection
            </span>
          </div>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label" style={{ color: 'var(--text-secondary)' }}>
              Collection Name
            </label>
            <input
              className="form-input"
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Enter collection name..."
              style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label" style={{ color: 'var(--text-secondary)' }}>
              Description (optional)
            </label>
            <textarea
              className="form-textarea"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              placeholder="Describe this collection..."
              rows={3}
              style={{
                width: '100%',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-card)',
              }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCreateCollection}
            disabled={!newCollectionName.trim()}
          >
            Create
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--text-secondary)',
          paddingBottom: '0.5rem',
        }}
      >
        <button
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
          onClick={() => setActiveTab('all')}
        >
          All Favorites
          <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>
            {favorites.length}
          </span>
        </button>
        {collections.map((col) => {
          const count = favorites.filter((f) => f.collection === col.id).length;
          return (
            <button
              key={col.id}
              className={`btn ${activeTab === col.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem' }}
              onClick={() => setActiveTab(col.id)}
            >
              {col.name}
              <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

          {filteredFavorites.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                {activeTab === 'all'
                  ? 'No favorites yet. Start favoriting prompts to see them here.'
                  : 'No favorites in this collection.'}
              </p>
            </div>
          ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredFavorites.map((fav) => (
            <div
              key={fav.id}
              className="card"
              style={{ padding: '1rem', backgroundColor: 'var(--bg-card)' }}
            >
              <div
                className="card-header"
                style={{
                  marginBottom: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  className="card-title"
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {fav.execution || fav.id}
                </span>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleRemoveFavorite(fav.id)}
                  disabled={removingId === fav.id}
                  style={{ flexShrink: 0, marginLeft: '0.5rem' }}
                >
                  {removingId === fav.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
              <div className="meta-row" style={{ marginBottom: '0.5rem' }}>
                <div className="meta-item">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Execution ID
                  </span>
                  <span style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
                    {fav.execution || 'N/A'}
                  </span>
                </div>
                <div className="meta-item">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Date
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    {formatDate(fav.created_at)}
                  </span>
                </div>
              </div>
              {fav.notes && (
                <div
                  className="output-box"
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    padding: '0.5rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {fav.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default FavoritesManager;
