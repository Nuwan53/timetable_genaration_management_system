import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, User, Lock,
  ShieldCheck, Users, RefreshCw, Clock,
  Sun, Moon, LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ruhuna from '../assets/Ruhuna.jpg';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please complete all required fields');
      return;
    }
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      toast.success(`Welcome, ${user.username}`);
      if (user.must_change_password) {
        navigate('/change-password', { replace: true });
      } else {
        const defaultDest = user.role === 'ADMIN' ? '/' : user.role === 'LECTURER' ? '/lecturer' : '/student';
        const dest = location.state?.from || defaultDest;
        navigate(dest, { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isFlipped = theme === 'dark';

  return (
    <div className={`login-split ${isFlipped ? 'login-split--flipped' : ''}`}>

      {/* ── Left image panel ── */}
      <div className="login-panel-image">
        <img src={ruhuna} alt="University of Ruhuna campus" className="login-panel-img" />
        <div className="login-panel-overlay" />

        <div className="login-panel-content">
          <div className="login-panel-badge">
            <span className="login-panel-badge-dot" aria-hidden="true" />
            Faculty of Science
          </div>

          <div className="login-panel-headline">
            <h1>Every lecture,<br /><em>on the grid.</em></h1>
            <p>
              One system to build, publish, and manage timetables
              across admin, lecturer, and student access — always
              current, always in sync.
            </p>
          </div>

          <div className="login-panel-features">
            {[
              { icon: <ShieldCheck size={17} />, label: 'Secure Login' },
              { icon: <RefreshCw size={17} />,   label: 'Live Sync' },
            ].map(f => (
              <div key={f.label} className="login-panel-feature">
                {f.icon}
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          <div className="login-panel-tip">
            Your workspace loads automatically based on the role you sign in with.
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-panel-form">

        {/* Theme toggle */}
        <button
          type="button"
          className="login-form-theme-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div className="theme-icon-wrap">
            <Sun className={`theme-icon theme-icon-sun ${theme === 'dark' ? 'active' : ''}`} />
            <Moon className={`theme-icon theme-icon-moon ${theme !== 'dark' ? 'active' : ''}`} />
          </div>
        </button>

        <div className="login-form-inner">

          {/* Logo */}
          <header className="login-logo">
            <div className="login-logo-mark">
              <LayoutGrid size={20} />
            </div>
            <div>
              <div className="login-title">Timetable Manager</div>
              <div className="login-subtitle">Faculty of Science · University of Ruhuna</div>
            </div>
          </header>

          {/* Welcome */}
          <div className="login-welcome">
            <h2 className="login-welcome-heading">Welcome Back</h2>
            <p className="login-welcome-sub">Sign in to access your timetable workspace</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <label className="field-label" htmlFor="login-username">Username</label>
            <div className="login-input-wrap">
              <User size={16} className="login-input-icon" aria-hidden="true" />
              <input
                id="login-username"
                className="login-input login-input--has-icon"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                disabled={loading}
                aria-label="Username"
              />
            </div>

            <label className="field-label" htmlFor="login-password">Password</label>
            <div className="password-wrap">
              <Lock size={16} className="login-input-icon" aria-hidden="true" />
              <input
                id="login-password"
                className="login-input login-input--has-icon"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                aria-label="Password"
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw(s => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <div className="pw-icon-wrap">
                  <EyeOff className={`pw-icon pw-icon-hide ${showPw ? 'active' : ''}`} />
                  <Eye className={`pw-icon pw-icon-show ${!showPw ? 'active' : ''}`} />
                </div>
              </button>
            </div>

            <button className="login-btn" type="submit" disabled={loading} aria-label="Sign in">
              {loading && <span className="login-btn-spinner" aria-hidden="true" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <footer className="login-footer">
            <span>Faculty of Science · University of Ruhuna</span>
            <span>Timetable Management System</span>
          </footer>
        </div>
      </div>
    </div>
  );
}