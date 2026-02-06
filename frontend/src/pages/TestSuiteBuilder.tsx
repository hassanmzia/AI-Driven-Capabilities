import React, { useState, useEffect } from 'react';
import {
  getTestSuites,
  createTestSuite,
  createTestCase,
  deleteTestSuite,
  runTestSuite,
} from '../services/api';
import { TestSuite, TestCase, TestRun, TestResultItem } from '../types';

export function TestSuiteBuilder() {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<TestRun | null>(null);
  const [running, setRunning] = useState(false);

  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuitePrompt, setNewSuitePrompt] = useState('');
  const [newSuiteSystemPrompt, setNewSuiteSystemPrompt] = useState('');
  const [newSuiteModel, setNewSuiteModel] = useState('');
  const [showSuiteForm, setShowSuiteForm] = useState(false);

  const [newCaseName, setNewCaseName] = useState('');
  const [newCaseInput, setNewCaseInput] = useState('');
  const [newCaseExpected, setNewCaseExpected] = useState('');
  const [newCaseCriteria, setNewCaseCriteria] = useState('');
  const [showCaseForm, setShowCaseForm] = useState(false);

  useEffect(() => {
    loadSuites();
  }, []);

  const loadSuites = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTestSuites();
      setSuites(data.results || []);
    } catch (err) {
      setError('Failed to load test suites.');
    } finally {
      setLoading(false);
    }
  };

  const selectedSuite = suites.find((s) => s.id === selectedSuiteId) || null;

  const handleCreateSuite = async () => {
    if (!newSuiteName.trim()) return;
    try {
      await createTestSuite({
        name: newSuiteName.trim(),
        prompt_text: newSuitePrompt.trim(),
        system_prompt: newSuiteSystemPrompt.trim(),
        model: newSuiteModel.trim(),
      });
      setNewSuiteName('');
      setNewSuitePrompt('');
      setNewSuiteSystemPrompt('');
      setNewSuiteModel('');
      setShowSuiteForm(false);
      await loadSuites();
    } catch (err) {
      setError('Failed to create test suite.');
    }
  };

  const handleDeleteSuite = async (suiteId: string) => {
    try {
      await deleteTestSuite(suiteId);
      if (selectedSuiteId === suiteId) {
        setSelectedSuiteId(null);
        setRunResults(null);
      }
      await loadSuites();
    } catch (err) {
      setError('Failed to delete test suite.');
    }
  };

  const handleCreateTestCase = async () => {
    if (!selectedSuiteId || !newCaseName.trim()) return;
    try {
      await createTestCase({
        suite: selectedSuiteId,
        name: newCaseName.trim(),
        input_text: newCaseInput.trim(),
        expected_output: newCaseExpected.trim(),
        criteria: newCaseCriteria.trim(),
      });
      setNewCaseName('');
      setNewCaseInput('');
      setNewCaseExpected('');
      setNewCaseCriteria('');
      setShowCaseForm(false);
      await loadSuites();
    } catch (err) {
      setError('Failed to create test case.');
    }
  };

  const handleRunSuite = async () => {
    if (!selectedSuiteId) return;
    setRunning(true);
    setRunResults(null);
    setError(null);
    try {
      const results = await runTestSuite({ suite_id: selectedSuiteId });
      setRunResults(results);
    } catch (err) {
      setError('Failed to run test suite.');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner" style={{ color: 'var(--text-secondary)' }}>
        Loading test suites...
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', color: 'var(--text-primary)' }}>
      <div className="page-header">
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Test Suite Builder
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Build, manage, and run test suites for your prompts
        </p>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: '1rem' }}>
          <p>{error}</p>
          <button className="btn btn-sm btn-secondary" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: 0 }}>
              Test Suites
            </h2>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowSuiteForm(!showSuiteForm)}
            >
              {showSuiteForm ? 'Cancel' : 'New Suite'}
            </button>
          </div>

          {showSuiteForm && (
            <div className="card" style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'var(--bg-card)' }}>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Name</label>
                <input className="form-input" type="text" value={newSuiteName} onChange={(e) => setNewSuiteName(e.target.value)} placeholder="Suite name" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Prompt</label>
                <textarea className="form-textarea" value={newSuitePrompt} onChange={(e) => setNewSuitePrompt(e.target.value)} placeholder="Main prompt template" rows={3} style={{ width: '100%', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>System Prompt</label>
                <textarea className="form-textarea" value={newSuiteSystemPrompt} onChange={(e) => setNewSuiteSystemPrompt(e.target.value)} placeholder="System prompt (optional)" rows={2} style={{ width: '100%', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Model</label>
                <input className="form-input" type="text" value={newSuiteModel} onChange={(e) => setNewSuiteModel(e.target.value)} placeholder="e.g. gpt-4" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleCreateSuite} disabled={!newSuiteName.trim()}>
                Create Suite
              </button>
            </div>
          )}

          {suites.length === 0 ? (
            <div className="empty-state" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No test suites yet. Create one to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {suites.map((suite) => (
                <div
                  key={suite.id}
                  className="card"
                  style={{
                    padding: '0.75rem',
                    backgroundColor: selectedSuiteId === suite.id ? 'var(--accent)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onClick={() => { setSelectedSuiteId(suite.id); setRunResults(null); }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: selectedSuiteId === suite.id ? '#fff' : 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>
                      {suite.name}
                    </span>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSuite(suite.id); }}
                      style={{ fontSize: '0.7rem' }}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="meta-row" style={{ marginTop: '0.25rem' }}>
                    <span className="meta-item" style={{ fontSize: '0.75rem', color: selectedSuiteId === suite.id ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
                      {suite.test_cases?.length || 0} cases
                    </span>
                    <span className="meta-item" style={{ fontSize: '0.75rem', color: selectedSuiteId === suite.id ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
                      {suite.model || 'No model'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {!selectedSuite ? (
            <div className="empty-state" style={{ color: 'var(--text-secondary)', marginTop: '3rem' }}>
              Select a test suite from the left panel to view its test cases.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: 0 }}>
                    {selectedSuite.name}
                  </h2>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Model: {selectedSuite.model || 'Not set'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowCaseForm(!showCaseForm)}>
                    {showCaseForm ? 'Cancel' : 'Add Test Case'}
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={handleRunSuite} disabled={running || !selectedSuite.test_cases?.length}>
                    {running ? 'Running...' : 'Run Suite'}
                  </button>
                </div>
              </div>

              {showCaseForm && (
                <div className="card" style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'var(--bg-card)' }}>
                  <div className="card-header" style={{ marginBottom: '0.75rem' }}>
                    <span className="card-title" style={{ color: 'var(--text-primary)' }}>New Test Case</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Test Name</label>
                      <input className="form-input" type="text" value={newCaseName} onChange={(e) => setNewCaseName(e.target.value)} placeholder="e.g. Basic greeting test" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Criteria</label>
                      <input className="form-input" type="text" value={newCaseCriteria} onChange={(e) => setNewCaseCriteria(e.target.value)} placeholder="e.g. contains, exact_match" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Input</label>
                      <textarea className="form-textarea" value={newCaseInput} onChange={(e) => setNewCaseInput(e.target.value)} placeholder="Test input..." rows={3} style={{ width: '100%', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Expected Output</label>
                      <textarea className="form-textarea" value={newCaseExpected} onChange={(e) => setNewCaseExpected(e.target.value)} placeholder="Expected output..." rows={3} style={{ width: '100%', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleCreateTestCase} disabled={!newCaseName.trim()} style={{ marginTop: '0.75rem' }}>
                    Add Test Case
                  </button>
                </div>
              )}

              {(!selectedSuite.test_cases || selectedSuite.test_cases.length === 0) ? (
                <div className="empty-state" style={{ color: 'var(--text-secondary)' }}>
                  No test cases in this suite. Add one to get started.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedSuite.test_cases.map((tc: TestCase, idx: number) => {
                    const result = runResults?.results?.find((r: TestResultItem) => r.test_case_name === tc.name);
                    return (
                      <div key={tc.id || idx} className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)' }}>
                        <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                          <span className="card-title" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {tc.name || `Test Case ${idx + 1}`}
                          </span>
                          {result && (
                            <span className={`badge ${result.passed ? 'badge-success' : 'badge-error'}`}>
                              {result.passed ? 'PASS' : 'FAIL'}
                            </span>
                          )}
                        </div>
                        <div className="meta-row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                          <div className="meta-item">
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Input</span>
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                              {tc.input_text ? (tc.input_text.length > 80 ? tc.input_text.slice(0, 80) + '...' : tc.input_text) : 'N/A'}
                            </span>
                          </div>
                          <div className="meta-item">
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Expected</span>
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                              {tc.expected_output ? (tc.expected_output.length > 80 ? tc.expected_output.slice(0, 80) + '...' : tc.expected_output) : 'N/A'}
                            </span>
                          </div>
                          {tc.criteria && (
                            <div className="meta-item">
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Criteria</span>
                              <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{tc.criteria}</span>
                            </div>
                          )}
                        </div>
                        {result && result.actual_output && (
                          <div className="output-box" style={{ marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Actual: </span>
                            <span style={{ color: 'var(--text-primary)' }}>{result.actual_output}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {runResults && (
                <div className="card" style={{ padding: '1rem', marginTop: '1rem', backgroundColor: 'var(--bg-card)' }}>
                  <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                    <span className="card-title" style={{ color: 'var(--text-primary)' }}>Run Summary</span>
                  </div>
                  <div className="meta-row" style={{ gap: '1.5rem' }}>
                    <div className="meta-item">
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total</span>
                      <span style={{ color: 'var(--text-primary)' }}>{runResults.total_cases || 0}</span>
                    </div>
                    <div className="meta-item">
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Passed</span>
                      <span className="badge badge-success">{runResults.passed_cases || 0}</span>
                    </div>
                    <div className="meta-item">
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Failed</span>
                      <span className="badge badge-error">{(runResults.total_cases || 0) - (runResults.passed_cases || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TestSuiteBuilder;
