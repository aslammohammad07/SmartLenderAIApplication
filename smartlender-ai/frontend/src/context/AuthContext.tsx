import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { mockCurrentUser } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smartlender_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('smartlender_token');
      const storedUser = localStorage.getItem('smartlender_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with backend
          const res = await api.auth.me();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('smartlender_user', JSON.stringify(res.user));
          }
        } catch {
          // If token verification fails, keep stored or fallback to demo
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      } else {
        // Auto sign-in as Admin for smooth developer & reviewer experience
        const defaultUser: User = mockCurrentUser;
        setUser(defaultUser);
        setToken('demo-active-token');
        localStorage.setItem('smartlender_token', 'demo-active-token');
        localStorage.setItem('smartlender_user', JSON.stringify(defaultUser));
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      if (res?.token && res?.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('smartlender_token', res.token);
        localStorage.setItem('smartlender_user', JSON.stringify(res.user));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smartlender_token');
    localStorage.removeItem('smartlender_user');
  };

  const switchDemoRole = async (role: UserRole) => {
    let email = 'admin@smartlender.bank';
    let name = 'Eleanor Vance';
    let dept = 'Executive Credit Committee';

    if (role === 'loan_manager') {
      email = 'manager@smartlender.bank';
      name = 'Marcus Sterling';
      dept = 'Underwriting & Risk Oversight';
    } else if (role === 'loan_officer') {
      email = 'officer@smartlender.bank';
      name = 'Sophia Chen';
      dept = 'Retail & Commercial Lending';
    }

    try {
      await login(email, 'Password@123');
    } catch {
      const switchedUser: User = {
        id: role === 'admin' ? 1 : role === 'loan_manager' ? 2 : 3,
        full_name: name,
        email,
        role,
        department: dept,
        status: 'active'
      };
      setUser(switchedUser);
      localStorage.setItem('smartlender_user', JSON.stringify(switchedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchDemoRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
