import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone: string) => Promise<User>;
  logout: () => Promise<void>;
  submitOnboarding: (purpose: 'buy' | 'rent' | 'both', spaces: string[], budgetMin: number, budgetMax: number, style: string) => Promise<void>;
  updateProfile: (name: string, phone: string | null, profilePicture: string | null) => Promise<User>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  mockGoogleLogin: (name: string, email: string, picture?: string) => Promise<User>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = async () => {
    // Check if this is a brand new tab session (closing the tab destroys sessionStorage)
    const isNewTab = !sessionStorage.getItem('rentease_tab_session');
    if (isNewTab) {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        // Silently capture errors in case backend is offline
      }
      setUser(null);
      setIsLoading(false);
      sessionStorage.setItem('rentease_tab_session', 'active');
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.id) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { email, password });
    const userData = response.data.user;
    sessionStorage.setItem('rentease_tab_session', 'active');
    setUser(userData);
    return userData;
  };

  const register = async (name: string, email: string, password: string, phone: string): Promise<User> => {
    const response = await api.post('/auth/register', { name, email, password, phone });
    const userData = response.data.user;
    sessionStorage.setItem('rentease_tab_session', 'active');
    setUser(userData);
    return userData;
  };

  const mockGoogleLogin = async (name: string, email: string, picture?: string): Promise<User> => {
    const response = await api.post('/auth/mock-google', { name, email, profilePicture: picture });
    const userData = response.data.user;
    sessionStorage.setItem('rentease_tab_session', 'active');
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const submitOnboarding = async (
    purpose: 'buy' | 'rent' | 'both',
    spaces: string[],
    budgetMin: number,
    budgetMax: number,
    style: string
  ) => {
    await api.post('/users/preferences', { purpose, spaces, budgetMin, budgetMax, style });
    // Refresh user object to update is_new_user = false
    await checkSession();
  };

  const updateProfile = async (name: string, phone: string | null, profilePicture: string | null): Promise<User> => {
    const response = await api.put('/users/profile', { name, phone, profilePicture });
    const updatedUser = response.data.user;
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    await api.put('/users/password', { oldPassword, newPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        submitOnboarding,
        updateProfile,
        changePassword,
        mockGoogleLogin,
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
