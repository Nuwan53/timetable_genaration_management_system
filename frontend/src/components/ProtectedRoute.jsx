import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allow }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a spinner

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.must_change_password) {
    if (location.pathname !== '/change-password') {
      return <Navigate to="/change-password" replace />;
    }
  } else {
    if (location.pathname === '/change-password') {
      return <Navigate to="/" replace />;
    }
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
