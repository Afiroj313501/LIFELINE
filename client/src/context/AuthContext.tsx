import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import { getSocket, disconnectSocket } from '../services/socket';

export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: 'DONOR' | 'RECIPIENT' | 'VOLUNTEER' | 'HOSPITAL_STAFF' | 'ADMIN';
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lifeline_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Restore session
  const refreshUser = useCallback(async () => {
    try {
      const res = await apiClient<{ user: User }>('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        // Connect socket with current token
        const currentToken = localStorage.getItem('lifeline_token');
        if (currentToken) {
          getSocket(currentToken);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('lifeline_token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [token, refreshUser]);

  const login = async (identifier: string, password: string): Promise<void> => {
    const res = await apiClient<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (res.data) {
      const { user: loggedInUser, accessToken } = res.data;
      localStorage.setItem('lifeline_token', accessToken);
      setToken(accessToken);
      setUser(loggedInUser);
      getSocket(accessToken);
    }
  };

  const register = async (payload: Record<string, unknown>): Promise<void> => {
    const res = await apiClient<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.data) {
      const { user: registeredUser, accessToken } = res.data;
      localStorage.setItem('lifeline_token', accessToken);
      setToken(accessToken);
      setUser(registeredUser);
      getSocket(accessToken);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('lifeline_token');
      setToken(null);
      setUser(null);
      disconnectSocket();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
