'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, getToken, setToken, removeToken } from './api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      if (storedToken) {
        setTokenState(storedToken);
        const res = await apiFetch('/auth/me');
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          removeToken();
          setTokenState(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      const { user, token } = res.data;
      setToken(token);
      setTokenState(token);
      setUser(user);
      return { success: true, user };
    }

    return { success: false, error: res.error?.message || 'Login failed' };
  };

  const register = async (name, email, password) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (res.success && res.data) {
      const { user, token } = res.data;
      setToken(token);
      setTokenState(token);
      setUser(user);
      return { success: true, user };
    }

    return { success: false, error: res.error?.message || 'Registration failed' };
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
