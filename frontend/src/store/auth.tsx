import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe } from '../api/client';

interface User {
  username: string;
  role: string;
  full_name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      getMe().then(res => setUser(res.data)).catch(() => logout());
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    const { access_token, role, full_name } = res.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser({ username, role, full_name, email: `${username}@smartsched.in` });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (roles: string[]) => user ? roles.includes(user.role) : false;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
