import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MeResponse, UserRole } from '../types/api';
import { authApi } from '../api/auth';
import {
  getStoredAccessToken,
  setStoredTokens,
  clearStoredTokens,
} from '../api/client';

interface AuthContextType {
  user: MeResponse | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await authApi.getCurrentUser();
      setUser(me);
    } catch {
      clearStoredTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();

    const handleSessionExpired = () => {
      clearStoredTokens();
      setUser(null);
    };

    window.addEventListener('hms:auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('hms:auth-session-expired', handleSessionExpired);
    };
  }, [checkSession]);

  const login = async (email: string, password: string): Promise<UserRole> => {
    setIsLoading(true);
    try {
      const tokens = await authApi.login(email, password);
      setStoredTokens(tokens);
      const me = await authApi.getCurrentUser();
      setUser(me);
      return me.role;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      clearStoredTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkSession,
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
