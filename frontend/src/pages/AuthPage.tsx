import React, { useState, useEffect } from 'react';
import { registerUser, loginUser, getMe, updateProfile } from '../services/api';
import type { UserInfo } from '../types';

type AuthTab = 'login' | 'register';

const THEME_OPTIONS = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6',
];

const SuccessBanner: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.1)', borderRadius: '0.375rem', color: 'var(--success, #22c55e)', marginBottom: '1rem', fontSize: '0.85rem' }}>
    {message}
  </div>
);

export const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchCurrentUser = async () => {
    setLoadingUser(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { setUser(null); setLoadingUser(false); return; }
      const res = await getMe();
      if (res.user) {
        setUser(res.user);
        setSelectedTheme(res.user.theme || 'dark');
        setSelectedColor(res.user.avatar_color || '#6366f1');
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => { fetchCurrentUser(); }, []);

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) return;
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const res = await loginUser({ username: loginUsername, password: loginPassword });
      localStorage.setItem('access_token', res.access);
      localStorage.setItem('refresh_token', res.refresh);
      setSuccess('Login successful!');
      setLoginUsername(''); setLoginPassword('');
      await fetchCurrentUser();
    } catch (e: any) {
      setError(e.response?.data?.detail || e.response?.data?.error || e.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!regUsername.trim() || !regEmail.trim() || !regPassword.trim()) return;
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      await registerUser({
        username: regUsername, email: regEmail, password: regPassword,
        first_name: regFirstName || undefined, last_name: regLastName || undefined,
      });
      setSuccess('Registration successful! You can now log in.');
      setActiveTab('login'); setLoginUsername(regUsername);
      setRegUsername(''); setRegEmail(''); setRegPassword('');
      setRegFirstName(''); setRegLastName('');
    } catch (e: any) {
      setError(e.response?.data?.detail || e.response?.data?.error || e.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('session_id');
    setUser(null); setSuccess('Logged out successfully.'); setError(null);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true); setError(null); setSuccess(null);
    try {
      await updateProfile({ theme: selectedTheme, avatar_color: selectedColor });
      setSuccess('Profile updated.');
      await fetchCurrentUser();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loadingUser) {
    return (
      <div>
        <div className="page-header">
          <h2>Account</h2>
          <p>Manage your account settings</p>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading account information...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Logged-in view ---
  if (user) {
    const initials = (user.first_name?.[0] || user.username[0]).toUpperCase();
    return (
      <div>
        <div className="page-header">
          <h2>Account</h2>
          <p>Welcome back, {user.first_name || user.username}</p>
        </div>
        {error && <div className="error-box" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <SuccessBanner message={success} />}

        {/* User Info */}
        <div className="card">
          <div className="card-header"><div className="card-title">User Information</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: user.avatar_color || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
              {initials}
            </div>
            <div>
              <div className="meta-row" style={{ marginBottom: '0.3rem' }}>
                <div className="meta-item">Username: <strong style={{ color: 'var(--text-primary)' }}>{user.username}</strong></div>
                <div className="meta-item">Email: <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong></div>
              </div>
              <div className="meta-row">
                <div className="meta-item">Name: <strong style={{ color: 'var(--text-primary)' }}>{user.first_name} {user.last_name}</strong></div>
                <div className="meta-item">Theme: <strong style={{ color: 'var(--text-primary)' }}>{user.theme || 'dark'}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="card">
          <div className="card-header"><div className="card-title">Profile Settings</div></div>
          <div className="form-group">
            <label className="form-label">Theme</label>
            <select className="form-select" value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
              {THEME_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Avatar Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              {AVATAR_COLORS.map((c) => (
                <button key={c} onClick={() => setSelectedColor(c)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: selectedColor === c ? '3px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer', transition: 'border 0.2s ease' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <><span className="loading-spinner" /> Saving...</> : 'Save Settings'}
            </button>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ color: 'var(--error, #ef4444)' }}>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Logged-out view: Login / Register ---
  return (
    <div>
      <div className="page-header">
        <h2>Account</h2>
        <p>Log in or create an account to access all features</p>
      </div>
      {error && <div className="error-box" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <SuccessBanner message={success} />}

      <div className="card">
        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button className={`btn ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setActiveTab('login'); setError(null); }}>
            Login
          </button>
          <button className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setActiveTab('register'); setError(null); }}>
            Register
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <>
            <div className="card-header" style={{ paddingLeft: 0 }}>
              <div className="card-title">Sign In</div>
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" placeholder="Enter your username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            </div>
            <button className="btn btn-primary" onClick={handleLogin} disabled={submitting || !loginUsername.trim() || !loginPassword.trim()}>
              {submitting ? <><span className="loading-spinner" /> Logging in...</> : 'Login'}
            </button>
          </>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <>
            <div className="card-header" style={{ paddingLeft: 0 }}>
              <div className="card-title">Create Account</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" placeholder="First name" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" placeholder="Last name" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" placeholder="Choose a username" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="Enter your email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Choose a password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
            </div>
            <button className="btn btn-primary" onClick={handleRegister} disabled={submitting || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()}>
              {submitting ? <><span className="loading-spinner" /> Creating Account...</> : 'Register'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
