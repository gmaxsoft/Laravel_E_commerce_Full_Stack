/* eslint-disable react-refresh/only-export-components -- AuthContext must be co-located with AuthProvider */
import { createContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && !user) {
      authApi.user()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      queueMicrotask(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- user intentionally excluded to avoid loop
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { user: u, token: t } = res.data;
    setUser(u);
    setToken(t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', t);
    return u;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    const { user: u, token: t } = res.data;
    setUser(u);
    setToken(t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', t);
    return u;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignoruj błędy przy wylogowaniu
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateUser,
    googleLogin: authApi.googleRedirect,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
