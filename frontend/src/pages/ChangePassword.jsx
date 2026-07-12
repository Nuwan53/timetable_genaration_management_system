import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, LogOut, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../api';

export default function ChangePassword() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPw) {
      toast.error('Current password is required');
      return;
    }

    if (newPw.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (newPw !== confirmPw) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await auth.changePassword({
        current_password: currentPw,
        new_password: newPw,
      });

      toast.success('Password updated successfully!');
      
      // Update local storage and auth context state
      updateUser({ must_change_password: false });
      
      // Redirect to correct role-based dashboard
      const defaultDest = user.role === 'ADMIN' ? '/' : user.role === 'LECTURER' ? '/lecturer' : '/student';
      navigate(defaultDest, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to update password. Make sure current password is correct.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-card" style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
        <div className="login-logo" style={{ marginBottom: '24px' }}>
          <div className="login-logo-mark" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
            <Lock size={20} />
          </div>
          <div>
            <div className="login-title">Secure Your Account</div>
            <div className="login-subtitle">Forced password change required</div>
          </div>
        </div>

        <div className="login-hero-tip" style={{ marginBottom: '20px', background: 'rgba(231, 76, 60, 0.08)', color: '#c0392b', border: '1px solid rgba(231, 76, 60, 0.2)' }}>
          This is your first login or your password was reset by an admin. You must set a new secure password of at least 8 characters to access the timetable management system.
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field-label" htmlFor="currentPw">Current (Temporary) Password</label>
          <div className="password-wrap" style={{ marginBottom: '16px' }}>
            <input
              id="currentPw"
              className="login-input"
              type={showCurrent ? 'text' : 'password'}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowCurrent((s) => !s)}
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <label className="field-label" htmlFor="newPw">New Password</label>
          <div className="password-wrap" style={{ marginBottom: '16px' }}>
            <input
              id="newPw"
              className="login-input"
              type={showNew ? 'text' : 'password'}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Min 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowNew((s) => !s)}
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <label className="field-label" htmlFor="confirmPw">Confirm New Password</label>
          <div className="password-wrap" style={{ marginBottom: '24px' }}>
            <input
              id="confirmPw"
              className="login-input"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button className="login-btn" type="submit" disabled={loading} style={{ background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <KeyRound size={16} />
            {loading ? 'Updating Password…' : 'Update Password & Continue'}
          </button>
        </form>

        <button 
          onClick={logout} 
          className="btn btn-ghost" 
          style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--muted)', fontSize: '13px' }}
        >
          <LogOut size={14} /> Abort & Logout
        </button>
      </div>
    </div>
  );
}
