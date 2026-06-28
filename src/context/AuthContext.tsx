import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, avatarUrl?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory token storage (held strictly in closure/state, not localStorage)
let globalInMemoryToken: string | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(globalInMemoryToken);
  const [loading, setLoading] = useState<boolean>(true);

  // Set up Axios authorization interceptor whenever token changes
  useEffect(() => {
    globalInMemoryToken = token;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Try to recover session if token was preserved in session memory or via cookie
  useEffect(() => {
    const fetchProfile = async () => {
      if (globalInMemoryToken) {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Session validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;
      setTokenState(receivedToken);
      setUser(receivedUser);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed.';
      throw new Error(msg);
    }
  };

  const register = async (name: string, email: string, password: string, avatarUrl?: string) => {
    try {
      const response = await axios.post('/api/auth/register', { name, email, password, avatarUrl });
      const { token: receivedToken, user: receivedUser } = response.data;
      setTokenState(receivedToken);
      setUser(receivedUser);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed.';
      throw new Error(msg);
    }
  };

  const logout = () => {
    setTokenState(null);
    setUser(null);
    globalInMemoryToken = null;
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = !!user;
  const adminEmails = ['admin@rohit.com', '2410030030cse@gmail.com'];
  const isAdmin = user?.role === 'admin' || (user && adminEmails.includes(user.email.toLowerCase())) || false;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
