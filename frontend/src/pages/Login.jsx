import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, User, Lock,
  ShieldCheck, RefreshCw,
  Sun, Moon, LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
// import ruhuna from '../assets/Ruhuna.jpg';
import img from '../assets/Gemini_Generated_Image_s954fus954fus954.jpg';


// ── Showcase grid data ──────────────────────────────────────────
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const PERIODS = ['08:00', '10:00', '12:00', '14:00', '16:00'];
// 1 = scheduled lecture, 2 = the "current" period, 0 = free
const GRID = [
  [1, 0, 1, 1, 0],
  [1, 1, 0, 1, 1],
  [0, 1, 1, 2, 1],
  [1, 0, 1, 1, 0],
  [0, 1, 0, 1, 1],
];

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

  // We only have a single toggleTheme() from context, so the two
  // explicit sun/moon buttons each guard against firing when they're
  // already the active mode.
  const setDark = () => { if (theme !== 'dark') toggleTheme(); };
  const setLight = () => { if (theme === 'dark') toggleTheme(); };

  return (
    <div
      className="lg-login"
      data-theme={theme}
      style={{ backgroundImage: `url(${img})` }}
    >
      <div className="lg-scrim" aria-hidden="true" />

      <div className="lg-theme-toggle">
        <button
          type="button"
          className={`lg-toggle-btn lg-toggle-btn--dark ${theme === 'dark' ? 'is-active' : ''}`}
          onClick={setDark}
          aria-label="Switch to dark mode"
          aria-pressed={theme === 'dark'}
        >
          <Moon size={16} />
        </button>
        <button
          type="button"
          className={`lg-toggle-btn lg-toggle-btn--light ${theme !== 'dark' ? 'is-active' : ''}`}
          onClick={setLight}
          aria-label="Switch to light mode"
          aria-pressed={theme !== 'dark'}
        >
          <Sun size={16} />
        </button>
      </div>

      <div className="lg-stage">

        {/* ── Left: showcase panel, full height, pinned left ── */}
        <div className="lg-showcase">
          <div className="lg-showcase-inner">

            <div className="lg-grid" aria-hidden="true">
              <div className="lg-grid-row lg-grid-row--header">
                <span className="lg-grid-corner">GMT+5:30</span>
                {DAYS.map((d) => (
                  <span key={d} className="lg-grid-day">{d}</span>
                ))}
              </div>
              {PERIODS.map((time, ri) => (
                <div className="lg-grid-row" key={time}>
                  <span className="lg-grid-time">{time}</span>
                  {GRID[ri].map((state, ci) => (
                    <span
                      key={ci}
                      className={
                        'lg-grid-cell' +
                        (state === 1 ? ' is-filled' : '') +
                        (state === 2 ? ' is-now' : '')
                      }
                      style={{ animationDelay: `${(ri * 5 + ci) * 55}ms` }}
                    />
                  ))}
                </div>
              ))}
            </div>

            <h1 className="lg-headline">
              Every lecture,<br /><em>exactly on time.</em>
            </h1>
            <p className="lg-sub">
              One workspace for admins, lecturers and students to build,
              publish and follow the Faculty of Science timetable —
              live, always in sync.
            </p>

            <div className="lg-meta">
              <span><ShieldCheck size={15} aria-hidden="true" /> Role-based access</span>
              <span><RefreshCw size={15} aria-hidden="true" /> Live sync</span>
            </div>
          </div>
        </div>

        {/* ── Right: floating glass login card, close to the showcase ── */}
        <div className="lg-form-card">
          <div className="lg-form-inner">

            <header className="lg-brand">
              <div className="lg-brand-mark">
                <LayoutGrid size={20} />
              </div>
              <div>
                <div className="lg-brand-title">Timetable Manager</div>
                <div className="lg-brand-subtitle">Faculty of Science · University of Ruhuna</div>
              </div>
            </header>

            <div className="lg-welcome">
              <h2 className="lg-welcome-heading">Welcome back</h2>
              <p className="lg-welcome-sub">Sign in to access your timetable workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="lg-form">
              <label className="lg-field-label" htmlFor="login-username">Username</label>
              <div className="lg-field">
                <User size={16} className="lg-field-icon" aria-hidden="true" />
                <input
                  id="login-username"
                  className="lg-field-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  disabled={loading}
                  aria-label="Username"
                />
              </div>

              <label className="lg-field-label" htmlFor="login-password">Password</label>
              <div className="lg-field">
                <Lock size={16} className="lg-field-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  className="lg-field-input"
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
                  className="lg-pw-toggle"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  <div className="lg-pw-icon-wrap">
                    <EyeOff className={`lg-pw-icon lg-pw-icon--hide ${showPw ? 'active' : ''}`} />
                    <Eye className={`lg-pw-icon lg-pw-icon--show ${!showPw ? 'active' : ''}`} />
                  </div>
                </button>
              </div>

              <button className="lg-submit" type="submit" disabled={loading} aria-label="Sign in">
                {loading && <span className="lg-submit-spinner" aria-hidden="true" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <footer className="lg-footer">
              <span>Faculty of Science · University of Ruhuna</span>
              <span>Timetable Management System</span>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
