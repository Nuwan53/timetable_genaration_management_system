import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Lock, ShieldCheck, Users, RefreshCw, Clock, Sun, Moon } from 'lucide-react';
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

  return (
    <div className="login-screen">
      <img src={ruhuna} alt="University of Ruhuna" className="login-screen-bg" />
      <button 
        type="button"
        onClick={toggleTheme}
        className="theme-toggle-login"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="login-shell">

        <section className="login-hero" aria-label="System information">
          <span className="grid-cell" aria-hidden="true" />
          <span className="grid-cell" aria-hidden="true" />
          <span className="grid-cell" aria-hidden="true" />
          <span className="grid-cell" aria-hidden="true" />

          <div className="login-hero-badge">
            <span className="login-hero-badge-dot" aria-hidden="true" />
            Faculty of Science
          </div>
          <h1>Every lecture, <em>on the grid.</em></h1>
          <p>
            One system to build, publish, and manage timetables across admin,
            lecturer, and student access — always current, always in sync.
          </p>

          <div className="login-hero-features">
            <div className="login-hero-feature">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Secure Login</span>
            </div>
            <div className="login-hero-feature">
              <Users size={18} aria-hidden="true" />
              <span>Role-Based Access</span>
            </div>
            <div className="login-hero-feature">
              <RefreshCw size={18} aria-hidden="true" />
              <span>Live Timetable Sync</span>
            </div>
            <div className="login-hero-feature">
              <Clock size={18} aria-hidden="true" />
              <span>24/7 Access</span>
            </div>
          </div>

          <div className="login-hero-tip">
            First time here? Your workspace loads automatically based on the role you sign in with.
          </div>
        </section>

        <section className="login-card" aria-label="Sign in">
          <header className="login-logo">
            <div className="login-logo-mark">TMS</div>
            <div>
              <div className="login-title">Timetable Manager</div>
              <div className="login-subtitle">Faculty of Science · University of Ruhuna</div>
            </div>
          </header>

          <div className="login-welcome">
            <h2 className="login-welcome-heading">Welcome Back</h2>
            <p className="login-welcome-sub">Sign in to access your timetable workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="field-label" htmlFor="username">Username</label>
            <div className="login-input-wrap">
              <User size={16} className="login-input-icon" aria-hidden="true" />
              <input
                id="username"
                className="login-input login-input--has-icon"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                disabled={loading}
                aria-label="Username"
              />
            </div>

            <label className="field-label" htmlFor="password">Password</label>
            <div className="password-wrap">
              <Lock size={16} className="login-input-icon" aria-hidden="true" />
              <input
                id="password"
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
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
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
        </section>

      </div>
    </div>
  );
}