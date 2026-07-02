import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, GraduationCap, UserCog, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ruhuna from '../assets/Ruhuna.jpg';

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

      const defaultDest = user.role === 'ADMIN' ? '/' : user.role === 'LECTURER' ? '/lecturer' : '/student';
      const dest = location.state?.from || defaultDest;
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
      <img src={ruhuna} alt="University of Ruhuna" className="login-screen-bg" />
      <div className="login-shell">
        <div className="login-hero">
          <span className="grid-cell" aria-hidden="true" />
          <span className="grid-cell" aria-hidden="true" />
          <span className="grid-cell" aria-hidden="true" />
          <span className="grid-cell" aria-hidden="true" />

          <div className="login-hero-badge">Faculty of Science</div>
          <h1>Every lecture, <em>on the grid.</em></h1>
          <p>
            One system to build, publish, and manage timetables across admin,
            lecturer, and student access — always current, always in sync.
          </p>
          <div className="login-hero-stats">
            <div><strong>3</strong><span>Roles</span></div>
            <div><strong>24/7</strong><span>Access</span></div>
            <div><strong>Live</strong><span>Sync</span></div>
          </div>
          <div className="login-hero-tip">
            First time here? Your workspace loads automatically based on the role you sign in with.
          </div>
        </div>

        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-mark">TMS</div>
            <div>
              <div className="login-title">Timetable Manager</div>
              <div className="login-subtitle">Faculty of Science · University of Ruhuna</div>
            </div>
          </div>

          <div className="role-tabs" role="tablist" aria-label="Select role">
            {roles.map((r) => (
              <button
                type="button"
                key={r.key}
                role="tab"
                aria-selected={role === r.key}
                className={`role-tab${role === r.key ? ' active' : ''}`}
                onClick={() => setRole(r.key)}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="field-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
            />

            <label className="field-label" htmlFor="password">Password</label>
            <div className="password-wrap">
              <input
                id="password"
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
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : `Sign in as ${roles.find(r => r.key===role).label}`}
            </button>
          </form>

          <div className="login-note-box">
            <div className="login-note-title">Sample credentials</div>
            <div className="credential-chips">
              <div className="credential-chip"><span>admin</span><span>Admin@123</span></div>
              <div className="credential-chip"><span>lecturer</span><span>Lecturer@123</span></div>
              <div className="credential-chip"><span>student</span><span>Student@123</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}