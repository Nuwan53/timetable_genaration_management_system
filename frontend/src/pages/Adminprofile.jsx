import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserRound, Upload, KeyRound, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function AdminProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || user?.username || '', email: user?.email || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : (user?.avatar_url || '');

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (file) setAvatarFile(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('email', form.email);
      if (avatarFile) payload.append('avatar', avatarFile);

      const { data } = await api.patch('/admin/me/', payload);
      updateUser((current) => ({ ...current, ...data }));
      setAvatarFile(null);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (newPw.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPw(true);
    try {
      await api.post('/auth/change-password/', { current_password: currentPw, new_password: newPw });
      toast.success('Password changed');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not change password');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">My Profile</span>
          <UserRound size={16} />
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Admin avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserRound size={28} color="#64748b" />
            )}
          </div>
          <div>
            <label className="btn btn-ghost">
              <Upload size={14} /> Change photo
              <input type="file" accept="image/png,image/jpeg" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
            <div className="stat-lbl" style={{ marginTop: 6 }}>JPG or PNG.</div>
          </div>
        </div>

        <form onSubmit={saveProfile} className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(event) => setForm((c) => ({ ...c, email: event.target.value }))} />
          </div>
          <div className="modal-footer" style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Change Password</span>
          <KeyRound size={16} />
        </div>
        <form onSubmit={changePassword} className="form-row">
          <div className="form-group">
            <label>Current Password</label>
            <div className="password-wrap">
              <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={(event) => setCurrentPw(event.target.value)} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type={showPw ? 'text' : 'password'} value={newPw} onChange={(event) => setNewPw(event.target.value)} placeholder="Min 8 characters" />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={(event) => setConfirmPw(event.target.value)} />
          </div>
          <div className="modal-footer" style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" type="submit" disabled={changingPw}>
              {changingPw ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}