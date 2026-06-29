import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('tms_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (username, password, role) => {
    const { data } = await api.post('/auth/login/', { username, password, role });
    localStorage.setItem('tms_token', data.token);
    localStorage.setItem('tms_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('tms_token');
    localStorage.removeItem('tms_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);