import React, { useState, useEffect } from 'react';
import { getTestSuites, getTestRuns } from '../services/api';
import { TestSuite, TestRun } from '../types';

interface SuiteOption {
  id: string;
  name: string;
}

interface RunRow {
  id: string;
  date: string;
  model: string;
  passRate: number;
  avgScore: number;
  tokens: number;
  cost: number;
  latency: number;
  isBest: boolean;
}

export function BenchmarkDashboard() {
  const [suites, setSuites] = useState<SuiteOption[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [suitesLoading, setSuitesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuites = async () => {
      setSuitesLoading(true);
      try {
        const response = await getTestSuites();
        const suiteList: SuiteOption[] = (response.results || []).map((s: TestSuite) => ({
          id: s.id,
          name: s.name,
        }));
        setSuites(suiteList);
        if (suiteList.length > 0) {
          setSelectedSuite(suiteList[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load test suites.');
      } finally {
        setSuitesLoading(false);
      }
    };
    fetchSuites();
  }, []);

  useEffect(() => {
    if (!selectedSuite) return;

    const fetchRuns = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getTestRuns(selectedSuite);
        const runList: RunRow[] = (response.results || []).map((r: TestRun) => ({
          id: r.id,
          date: new Date(r.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
          }),
          model: r.model,
          passRate: r.pass_rate,
          avgScore: r.avg_score,
          tokens: r.total_tokens,
          cost: r.total_cost,
          latency: r.total_latency_ms,
          isBest: false,
        }));

        if (runList.length > 0) {
          const bestIdx = runList.reduce(
            (bestI, run, i, arr) => run.avgScore > arr[bestI].avgScore ? i : bestI, 0
          );
          runList[bestIdx].isBest = true;
        }

        setRuns(runList);
      } catch (err: any) {
        setError(err.message || 'Failed to load test runs.');
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
  }, [selectedSuite]);

  const getPassRateColor = (rate: number): string => {
    if (rate >= 90) return '#22c55e';
    if (rate >= 70) return '#eab308';
    return '#ef4444';
  };

  const getPassRateBadge = (rate: number): string => {
    if (rate >= 90) return 'badge-success';
    if (rate >= 70) return 'badge-warning';
    return 'badge-error';
  };

  const selectedSuiteName = suites.find(s => s.id === selectedSuite)?.name || 'None';

  return (
    <div>
      <div className="page-header">
        <h1 style={{ color: 'var(--text-primary)' }}>Benchmark Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          View and compare test run results across suites and models.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Suite Selector</h2>
        </div>

        {suitesLoading ? (
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Loading suites...</p>
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Test Suite</label>
            <select
              className="form-select"
              value={selectedSuite}
              onChange={e => setSelectedSuite(e.target.value)}
            >
              {suites.length === 0 && <option value="">No suites available</option>}
              {suites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Loading runs for "{selectedSuiteName}"...
          </p>
        </div>
      )}

      {!loading && runs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Test Runs - {selectedSuiteName}</h2>
            <span className="badge">{runs.length} runs</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--accent)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Model</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Pass Rate</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Avg Score</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Tokens</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Cost</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Latency</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(run => (
                  <tr
                    key={run.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      background: run.isBest ? 'rgba(34,197,94,0.08)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>
                      {run.date}
                      {run.isBest && (
                        <span className="badge badge-success" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                          BEST
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>{run.model}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '80px', height: '8px', borderRadius: '4px',
                          background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${run.passRate}%`, height: '100%', borderRadius: '4px',
                            background: getPassRateColor(run.passRate),
                          }} />
                        </div>
                        <span className={`badge ${getPassRateBadge(run.passRate)}`}>
                          {run.passRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>
                      {run.avgScore.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>
                      {run.tokens.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>
                      ${run.cost.toFixed(4)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>
                      {run.latency}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: '2px solid var(--accent)', padding: '1rem', marginTop: '0.5rem' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Aggregate Stats</h3>
            <div className="meta-row">
              <div className="meta-item">
                <span style={{ color: 'var(--text-secondary)' }}>Total Runs</span>
                <strong style={{ color: 'var(--text-primary)' }}>{runs.length}</strong>
              </div>
              <div className="meta-item">
                <span style={{ color: 'var(--text-secondary)' }}>Best Score</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {Math.max(...runs.map(r => r.avgScore)).toFixed(2)}
                </strong>
              </div>
              <div className="meta-item">
                <span style={{ color: 'var(--text-secondary)' }}>Avg Pass Rate</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {(runs.reduce((s, r) => s + r.passRate, 0) / runs.length).toFixed(1)}%
                </strong>
              </div>
              <div className="meta-item">
                <span style={{ color: 'var(--text-secondary)' }}>Total Cost</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  ${runs.reduce((s, r) => s + r.cost, 0).toFixed(4)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !suitesLoading && runs.length === 0 && !error && (
        <div className="empty-state">
          <p style={{ color: 'var(--text-secondary)' }}>
            {suites.length === 0
              ? 'No test suites found. Create a test suite to get started.'
              : 'No test runs found for the selected suite.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default BenchmarkDashboard;
