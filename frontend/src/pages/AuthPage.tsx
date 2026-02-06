import React, { useState, useEffect, useRef } from 'react';
import { registerUser, loginUser, getMe, updateProfile, updateUserInfo, changePassword, deleteAccount } from '../services/api';
import type { UserInfo } from '../types';

type AuthTab = 'login' | 'register';
type ProfileSection = 'info' | 'settings' | 'security' | 'danger';

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

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.375rem', color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>
    {message}
  </div>
);

const SectionTab: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '0.5rem 1rem', background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)', border: active ? 'none' : '1px solid var(--border-color)',
      borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s',
    }}
  >
    {label}
  </button>
);

export const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [profileSection, setProfileSection] = useState<ProfileSection>('info');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');

  // Profile edit state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Profile picture
  const fileInputRef = useRef<HTMLInputElement>(null);

  const populateEditFields = (u: UserInfo) => {
    setEditFirstName(u.first_name || '');
    setEditLastName(u.last_name || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
    setEditAddress(u.address || '');
    setEditBio(u.bio || '');
    setEditCompany(u.company || '');
    setEditJobTitle(u.job_title || '');
    setSelectedTheme(u.theme || 'dark');
    setSelectedColor(u.avatar_color || '#6366f1');
  };

  const fetchCurrentUser = async () => {
    setLoadingUser(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { setUser(null); setLoadingUser(false); return; }
      const res = await getMe();
      if (res.user) {
        setUser(res.user);
        populateEditFields(res.user);
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

  const handleSaveUserInfo = async () => {
    setSavingProfile(true); setError(null); setSuccess(null);
    try {
      await updateUserInfo({ first_name: editFirstName, last_name: editLastName, email: editEmail });
      await updateProfile({
        phone: editPhone, address: editAddress, bio: editBio,
        company: editCompany, job_title: editJobTitle,
      });
      setSuccess('Profile information updated.');
      await fetchCurrentUser();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingProfile(true); setError(null); setSuccess(null);
    try {
      await updateProfile({ theme: selectedTheme, avatar_color: selectedColor });
      setSuccess('Settings saved.');
      await fetchCurrentUser();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to save settings');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfilePicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setError(null); setSuccess(null);
      try {
        await updateProfile({ profile_picture: dataUrl });
        setSuccess('Profile picture updated.');
        await fetchCurrentUser();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to upload picture');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = async () => {
    setError(null); setSuccess(null);
    try {
      await updateProfile({ profile_picture: '' });
      setSuccess('Profile picture removed.');
      await fetchCurrentUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove picture');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    setChangingPassword(true); setError(null); setSuccess(null);
    try {
      const res = await changePassword({ current_password: currentPassword, new_password: newPassword });
      localStorage.setItem('access_token', res.access);
      localStorage.setItem('refresh_token', res.refresh);
      setSuccess('Password changed successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      setError('Password is required');
      return;
    }
    setDeletingAccount(true); setError(null); setSuccess(null);
    try {
      await deleteAccount(deletePassword);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session_id');
      setUser(null);
      setSuccess('Account deleted successfully.');
      setDeletePassword(''); setDeleteConfirm('');
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  // --- Loading state ---
  if (loadingUser) {
    return (
      <div style={{ padding: '1rem' }}>
        <div className="page-header">
          <h2 style={{ color: 'var(--text-primary)' }}>Account</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your account settings</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading account information...</p>
        </div>
      </div>
    );
  }

  // --- Logged-in view ---
  if (user) {
    const initials = (user.first_name?.[0] || user.username[0]).toUpperCase();
    const hasPicture = !!user.profile_picture;

    return (
      <div style={{ padding: '1rem' }}>
        <div className="page-header">
          <h2 style={{ color: 'var(--text-primary)' }}>Account</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user.first_name || user.username}</p>
        </div>
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message={success} />}

        {/* User Summary Card */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              {hasPicture ? (
                <img src={user.profile_picture} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: user.avatar_color || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
                  {initials}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                {user.first_name} {user.last_name}
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.25rem', fontSize: '0.85rem' }}>@{user.username}</p>
              {user.bio && <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0', fontSize: '0.85rem' }}>{user.bio}</p>}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {user.company && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Company: {user.company}</span>}
                {user.job_title && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Role: {user.job_title}</span>}
                {user.phone && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Phone: {user.phone}</span>}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
              Logout
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <SectionTab label="Personal Info" active={profileSection === 'info'} onClick={() => { setProfileSection('info'); setError(null); setSuccess(null); }} />
          <SectionTab label="Preferences" active={profileSection === 'settings'} onClick={() => { setProfileSection('settings'); setError(null); setSuccess(null); }} />
          <SectionTab label="Security" active={profileSection === 'security'} onClick={() => { setProfileSection('security'); setError(null); setSuccess(null); }} />
          <SectionTab label="Danger Zone" active={profileSection === 'danger'} onClick={() => { setProfileSection('danger'); setError(null); setSuccess(null); }} />
        </div>

        {/* Personal Info Section */}
        {profileSection === 'info' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}><div className="card-title" style={{ color: 'var(--text-primary)' }}>Personal Information</div></div>

            {/* Profile Picture Upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Profile Picture</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {hasPicture ? (
                  <img src={user.profile_picture} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: user.avatar_color || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                    {initials}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ fontSize: '0.8rem' }}>
                    Upload Photo
                  </button>
                  {hasPicture && (
                    <button className="btn btn-secondary" onClick={handleRemovePicture} style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                      Remove
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePicture} style={{ display: 'none' }} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>JPG, PNG or GIF. Max 2MB.</p>
            </div>

            {/* Name Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>First Name</label>
                <input className="form-input" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Last Name</label>
                <input className="form-input" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email</label>
              <input className="form-input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email address" />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone</label>
              <input className="form-input" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone number" />
            </div>

            {/* Company & Job Title */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Company</label>
                <input className="form-input" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Job Title</label>
                <input className="form-input" value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} placeholder="Job title" />
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Bio</label>
              <textarea className="form-textarea" value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} style={{ width: '100%', resize: 'vertical' }} />
            </div>

            {/* Address */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Address</label>
              <textarea className="form-textarea" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Street address, city, state, zip..." rows={2} style={{ width: '100%', resize: 'vertical' }} />
            </div>

            <button className="btn btn-primary" onClick={handleSaveUserInfo} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Preferences Section */}
        {profileSection === 'settings' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}><div className="card-title" style={{ color: 'var(--text-primary)' }}>Preferences</div></div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Theme</label>
              <select className="form-select" value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
                {THEME_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Avatar Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {AVATAR_COLORS.map((c) => (
                  <button key={c} onClick={() => setSelectedColor(c)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: c, border: selectedColor === c ? '3px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer', transition: 'border 0.2s ease' }} />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Account Details</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', background: 'var(--bg-tertiary, rgba(255,255,255,0.03))', borderRadius: '0.375rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Username</span>
                  <p style={{ color: 'var(--text-primary)', margin: '0.25rem 0 0', fontWeight: 500 }}>{user.username}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Member Since</span>
                  <p style={{ color: 'var(--text-primary)', margin: '0.25rem 0 0', fontWeight: 500 }}>{user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleSaveSettings} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        )}

        {/* Security Section */}
        {profileSection === 'security' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}><div className="card-title" style={{ color: 'var(--text-primary)' }}>Change Password</div></div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Current Password</label>
              <input className="form-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>New Password</label>
              <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 8 chars)" />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Confirm New Password</label>
              <input className="form-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()} />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>Passwords do not match</p>
              )}
            </div>

            <button className="btn btn-primary" onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}>
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        )}

        {/* Danger Zone Section */}
        {profileSection === 'danger' && (
          <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}><div className="card-title" style={{ color: '#ef4444' }}>Delete Account</div></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              This action is permanent and cannot be undone. All your data, projects, test suites, favorites, and submissions will be permanently deleted.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Enter your password to confirm</label>
              <input className="form-input" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Your password" />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Type DELETE to confirm</label>
              <input className="form-input" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type DELETE" style={{ borderColor: deleteConfirm === 'DELETE' ? '#ef4444' : undefined }} />
            </div>

            <button
              onClick={handleDeleteAccount}
              disabled={deletingAccount || deleteConfirm !== 'DELETE' || !deletePassword}
              style={{
                padding: '0.6rem 1.25rem', background: (deleteConfirm === 'DELETE' && deletePassword) ? '#ef4444' : 'rgba(239,68,68,0.3)',
                color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: (deleteConfirm === 'DELETE' && deletePassword) ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem', fontWeight: 500,
              }}
            >
              {deletingAccount ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Logged-out view: Login / Register ---
  return (
    <div style={{ padding: '1rem' }}>
      <div className="page-header">
        <h2 style={{ color: 'var(--text-primary)' }}>Account</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Log in or create an account to access all features</p>
      </div>
      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button className={`btn ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setActiveTab('login'); setError(null); }}>
            Login
          </button>
          <button className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setActiveTab('register'); setError(null); }}>
            Register
          </button>
        </div>

        {activeTab === 'login' && (
          <>
            <div className="card-header" style={{ paddingLeft: 0 }}>
              <div className="card-title" style={{ color: 'var(--text-primary)' }}>Sign In</div>
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
              {submitting ? 'Logging in...' : 'Login'}
            </button>
          </>
        )}

        {activeTab === 'register' && (
          <>
            <div className="card-header" style={{ paddingLeft: 0 }}>
              <div className="card-title" style={{ color: 'var(--text-primary)' }}>Create Account</div>
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
              <input className="form-input" type="password" placeholder="Choose a password (min 8 chars)" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
            </div>
            <button className="btn btn-primary" onClick={handleRegister} disabled={submitting || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()}>
              {submitting ? 'Creating Account...' : 'Register'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
