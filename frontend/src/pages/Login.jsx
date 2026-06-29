import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, GraduationCap, UserCog, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roles = [
  { key: 'ADMIN',    label: 'Admin',    icon: <UserCog size={16}/> },
  { key: 'LECTURER', label: 'Lecturer', icon: <ShieldCheck size={16}/> },
  { key: 'STUDENT',  label: 'Student',  icon: <GraduationCap size={16}/> },
];

export default function Login() {
  const [role, setRole] = useState('STUDENT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      const user = await login(username.trim(), password, role);
      toast.success(`Welcome, ${user.username}`);

      if (user.must_change_password) {
        navigate('/change-password', { replace: true });
        return;
      }
      const dest = location.state?.from || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <span>📅</span>
          <div>
            <div className="login-title">Timetable Management System</div>
            <div className="login-subtitle">Faculty of Science · University of Ruhuna</div>
          </div>
        </div>

        <div className="role-tabs">
          {roles.map((r) => (
            <button
              type="button"
              key={r.key}
              className={`role-tab${role === r.key ? ' active' : ''}`}
              onClick={() => setRole(r.key)}
            >
              {r.icon} {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field-label">Username</label>
          <input
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoComplete="username"
          />

          <label className="field-label">Password</label>
          <div className="password-wrap">
            <input
              className="login-input"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((s) => !s)}
              aria-label="Toggle password visibility"
            >
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : `Sign in as ${roles.find(r => r.key===role).label}`}
          </button>
        </form>

        <p className="login-note">
          Don't have credentials? Contact your administrator — accounts are issued by the system admin.
        </p>
      </div>
    </div>
  );
}