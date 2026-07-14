/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

api.interceptors.request.use((config) => {
  const isAuthRoute = config.url?.includes('/auth/login');
  const token = localStorage.getItem('tms_token');
  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('tms_user');
    return stored ? JSON.parse(stored) : null;
  });
  const loading = false;

  const login = useCallback(async (username, password, role) => {
    const { data } = await api.post('/auth/login/', { username, password, role });
    localStorage.setItem('tms_token', data.token);
    localStorage.setItem('tms_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tms_token');
    localStorage.removeItem('tms_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser((current) => {
      const merged = typeof nextUser === 'function' ? nextUser(current) : { ...current, ...nextUser };
      if (merged) {
        localStorage.setItem('tms_user', JSON.stringify(merged));
      }
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);