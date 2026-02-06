import React, { useState, useEffect } from 'react';

interface DiffWord {
  text: string;
  type: 'unchanged' | 'removed' | 'added';
}

interface DiffStats {
  linesA: number;
  linesB: number;
  wordsA: number;
  wordsB: number;
  charsA: number;
  charsB: number;
  wordsAdded: number;
  wordsRemoved: number;
}

function computeWordDiff(textA: string, textB: string): DiffWord[] {
  const wordsA = textA.split(/(\s+)/);
  const wordsB = textB.split(/(\s+)/);
  const result: DiffWord[] = [];

  const setA = new Set(wordsA.filter((w) => w.trim() !== ''));
  const setB = new Set(wordsB.filter((w) => w.trim() !== ''));

  let i = 0;
  let j = 0;

  while (i < wordsA.length || j < wordsB.length) {
    if (i < wordsA.length && j < wordsB.length && wordsA[i] === wordsB[j]) {
      result.push({ text: wordsA[i], type: 'unchanged' });
      i++;
      j++;
    } else if (i < wordsA.length && !setB.has(wordsA[i]) && wordsA[i].trim() !== '') {
      result.push({ text: wordsA[i], type: 'removed' });
      i++;
    } else if (j < wordsB.length && !setA.has(wordsB[j]) && wordsB[j].trim() !== '') {
      result.push({ text: wordsB[j], type: 'added' });
      j++;
    } else if (i < wordsA.length && j < wordsB.length) {
      result.push({ text: wordsA[i], type: 'removed' });
      result.push({ text: wordsB[j], type: 'added' });
      i++;
      j++;
    } else if (i < wordsA.length) {
      result.push({ text: wordsA[i], type: wordsA[i].trim() === '' ? 'unchanged' : 'removed' });
      i++;
    } else if (j < wordsB.length) {
      result.push({ text: wordsB[j], type: wordsB[j].trim() === '' ? 'unchanged' : 'added' });
      j++;
    }
  }

  return result;
}

function computeStats(textA: string, textB: string, diff: DiffWord[]): DiffStats {
  const linesA = textA === '' ? 0 : textA.split('\n').length;
  const linesB = textB === '' ? 0 : textB.split('\n').length;
  const wordsA = textA.trim() === '' ? 0 : textA.trim().split(/\s+/).length;
  const wordsB = textB.trim() === '' ? 0 : textB.trim().split(/\s+/).length;
  const charsA = textA.length;
  const charsB = textB.length;
  const wordsAdded = diff.filter((d) => d.type === 'added').length;
  const wordsRemoved = diff.filter((d) => d.type === 'removed').length;

  return { linesA, linesB, wordsA, wordsB, charsA, charsB, wordsAdded, wordsRemoved };
}

export function PromptDiffViewer() {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [diff, setDiff] = useState<DiffWord[]>([]);
  const [stats, setStats] = useState<DiffStats | null>(null);
  const [hasCompared, setHasCompared] = useState(false);

  const handleCompare = () => {
    const result = computeWordDiff(textA, textB);
    const diffStats = computeStats(textA, textB, result);
    setDiff(result);
    setStats(diffStats);
    setHasCompared(true);
  };

  const handleClear = () => {
    setTextA('');
    setTextB('');
    setDiff([]);
    setStats(null);
    setHasCompared(false);
  };

  const getWordStyle = (type: 'unchanged' | 'removed' | 'added'): React.CSSProperties => {
    switch (type) {
      case 'removed':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          textDecoration: 'line-through',
          padding: '1px 2px',
          borderRadius: '2px',
        };
      case 'added':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          color: '#22c55e',
          padding: '1px 2px',
          borderRadius: '2px',
        };
      default:
        return { color: 'var(--text-primary)' };
    }
  };

  const formatDelta = (a: number, b: number): string => {
    const delta = b - a;
    if (delta > 0) return `+${delta}`;
    if (delta < 0) return `${delta}`;
    return '0';
  };

  return (
    <div style={{ padding: '1rem', color: 'var(--text-primary)' }}>
      <div className="page-header">
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Prompt Diff Viewer
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Compare two prompt versions side by side to see differences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-card)' }}>
          <div className="card-header" style={{ marginBottom: '0.75rem' }}>
            <span className="card-title" style={{ color: 'var(--text-primary)' }}>
              Version A
            </span>
            <span className="badge badge-warning">Original</span>
          </div>
          <div className="form-group">
            <textarea
              className="form-textarea"
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              placeholder="Paste the original prompt text here..."
              rows={12}
              style={{
                width: '100%',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-card)',
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              }}
            />
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-card)' }}>
          <div className="card-header" style={{ marginBottom: '0.75rem' }}>
            <span className="card-title" style={{ color: 'var(--text-primary)' }}>
              Version B
            </span>
            <span className="badge badge-success">Modified</span>
          </div>
          <div className="form-group">
            <textarea
              className="form-textarea"
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              placeholder="Paste the modified prompt text here..."
              rows={12}
              style={{
                width: '100%',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-card)',
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleCompare}
          disabled={textA === '' && textB === ''}
        >
          Compare
        </button>
        <button className="btn btn-secondary" onClick={handleClear}>
          Clear All
        </button>
      </div>

      {hasCompared && stats && (
        <div
          className="card"
          style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="card-header" style={{ marginBottom: '0.75rem' }}>
            <span className="card-title" style={{ color: 'var(--text-primary)' }}>
              Diff Statistics
            </span>
          </div>
          <div className="meta-row" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Lines</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {stats.linesA} &rarr; {stats.linesB}{' '}
                <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                  ({formatDelta(stats.linesA, stats.linesB)})
                </span>
              </span>
            </div>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Words</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {stats.wordsA} &rarr; {stats.wordsB}{' '}
                <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                  ({formatDelta(stats.wordsA, stats.wordsB)})
                </span>
              </span>
            </div>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Characters</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {stats.charsA} &rarr; {stats.charsB}{' '}
                <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                  ({formatDelta(stats.charsA, stats.charsB)})
                </span>
              </span>
            </div>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Words Removed</span>
              <span className="badge badge-error">{stats.wordsRemoved}</span>
            </div>
            <div className="meta-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Words Added</span>
              <span className="badge badge-success">{stats.wordsAdded}</span>
            </div>
          </div>
        </div>
      )}

      {hasCompared && (
        <div
          className="card"
          style={{ padding: '1rem', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="card-header" style={{ marginBottom: '0.75rem' }}>
            <span className="card-title" style={{ color: 'var(--text-primary)' }}>
              Diff Output
            </span>
          </div>
          {diff.length === 0 ? (
            <div className="empty-state" style={{ color: 'var(--text-secondary)' }}>
              Both versions are empty. Enter text above and click Compare.
            </div>
          ) : (
            <div
              className="output-box"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                padding: '1rem',
                maxHeight: '500px',
                overflowY: 'auto',
              }}
            >
              {diff.map((word, idx) => (
                <span key={idx} style={getWordStyle(word.type)}>
                  {word.text}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!hasCompared && (
        <div className="empty-state" style={{ color: 'var(--text-secondary)', marginTop: '2rem' }}>
          Enter text in both versions above and click Compare to see differences.
        </div>
      )}
    </div>
  );
}

export default PromptDiffViewer;
