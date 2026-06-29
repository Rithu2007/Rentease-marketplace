import React, { createContext, useContext, useState, useEffect } from 'react';
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

// In-memory/localStorage seed database for fallback
const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Ritish Admin',
    email: 'ritish@rentease.in',
    password: 'Rentease@123',
    phone: '9876543210',
    profile_picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ritish',
    is_new_user: false,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Test Customer',
    email: 'customer@gmail.com',
    password: 'Rentease@123',
    phone: '9999988888',
    profile_picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Customer',
    is_new_user: true,
    created_at: new Date().toISOString()
  }
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize users in localStorage if not already present
  useEffect(() => {
    const storedUsers = localStorage.getItem('rentease_users');
    if (!storedUsers) {
      localStorage.setItem('rentease_users', JSON.stringify(DEFAULT_USERS));
    }

    // Load active session
    const activeUser = localStorage.getItem('rentease_current_user');
    if (activeUser) {
      try {
        setUser(JSON.parse(activeUser));
      } catch (e) {
        localStorage.removeItem('rentease_current_user');
      }
    }
    setIsLoading(false);
  }, []);

  const checkSession = async () => {
    const activeUser = localStorage.getItem('rentease_current_user');
    if (activeUser) {
      setUser(JSON.parse(activeUser));
    } else {
      setUser(null);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const storedUsers = localStorage.getItem('rentease_users');
    const usersList = storedUsers ? JSON.parse(storedUsers) : DEFAULT_USERS;

    const foundUser = usersList.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!foundUser) {
      throw new Error('User not found.');
    }

    if (foundUser.password !== password) {
      throw new Error('Incorrect credentials.');
    }

    const { password: _, ...userSession } = foundUser;
    localStorage.setItem('rentease_current_user', JSON.stringify(userSession));
    setUser(userSession as User);
    return userSession as User;
  };

  const register = async (name: string, email: string, password: string, phone: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const storedUsers = localStorage.getItem('rentease_users') || JSON.stringify(DEFAULT_USERS);
    const usersList = JSON.parse(storedUsers);

    const emailExists = usersList.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      throw new Error('User with this email already exists.');
    }

    const newUser = {
      id: Math.max(...usersList.map((u: any) => u.id), 0) + 1,
      name,
      email,
      password,
      phone,
      profile_picture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      is_new_user: true,
      created_at: new Date().toISOString()
    };

    usersList.push(newUser);
    localStorage.setItem('rentease_users', JSON.stringify(usersList));

    const { password: _, ...userSession } = newUser;
    localStorage.setItem('rentease_current_user', JSON.stringify(userSession));
    setUser(userSession as User);
    return userSession as User;
  };

  const mockGoogleLogin = async (name: string, email: string, picture?: string): Promise<User> => {
    const storedUsers = localStorage.getItem('rentease_users') || JSON.stringify(DEFAULT_USERS);
    const usersList = JSON.parse(storedUsers);

    let foundUser = usersList.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!foundUser) {
      foundUser = {
        id: Math.max(...usersList.map((u: any) => u.id), 0) + 1,
        name,
        email,
        password: 'GoogleSimulatedPassword@123',
        phone: null,
        profile_picture: picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
        is_new_user: true,
        created_at: new Date().toISOString()
      };
      usersList.push(foundUser);
      localStorage.setItem('rentease_users', JSON.stringify(usersList));
    }

    const { password: _, ...userSession } = foundUser;
    localStorage.setItem('rentease_current_user', JSON.stringify(userSession));
    setUser(userSession as User);
    return userSession as User;
  };

  const logout = async () => {
    localStorage.removeItem('rentease_current_user');
    setUser(null);
  };

  const submitOnboarding = async (
    purpose: 'buy' | 'rent' | 'both',
    spaces: string[],
    budgetMin: number,
    budgetMax: number,
    style: string
  ) => {
    if (!user) return;

    await new Promise((resolve) => setTimeout(resolve, 500));

    const storedUsers = localStorage.getItem('rentease_users') || JSON.stringify(DEFAULT_USERS);
    const usersList = JSON.parse(storedUsers);

    const userIndex = usersList.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      usersList[userIndex].is_new_user = false;
      usersList[userIndex].preferences = { purpose, spaces, budgetMin, budgetMax, style };
      localStorage.setItem('rentease_users', JSON.stringify(usersList));
    }

    const updatedUser = { ...user, is_new_user: false };
    localStorage.setItem('rentease_current_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const updateProfile = async (name: string, phone: string | null, profilePicture: string | null): Promise<User> => {
    if (!user) throw new Error('Not authenticated.');

    await new Promise((resolve) => setTimeout(resolve, 500));

    const storedUsers = localStorage.getItem('rentease_users') || JSON.stringify(DEFAULT_USERS);
    const usersList = JSON.parse(storedUsers);

    const userIndex = usersList.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      usersList[userIndex].name = name;
      usersList[userIndex].phone = phone;
      if (profilePicture) {
        usersList[userIndex].profile_picture = profilePicture;
      }
      localStorage.setItem('rentease_users', JSON.stringify(usersList));
    }

    const updatedUser = { 
      ...user, 
      name, 
      phone, 
      profile_picture: profilePicture || user.profile_picture 
    };
    localStorage.setItem('rentease_current_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) throw new Error('Not authenticated.');

    await new Promise((resolve) => setTimeout(resolve, 500));

    const storedUsers = localStorage.getItem('rentease_users') || JSON.stringify(DEFAULT_USERS);
    const usersList = JSON.parse(storedUsers);

    const userIndex = usersList.findIndex((u: any) => u.id === user.id);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    if (usersList[userIndex].password !== oldPassword) {
      throw new Error('Incorrect current password.');
    }

    usersList[userIndex].password = newPassword;
    localStorage.setItem('rentease_users', JSON.stringify(usersList));
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
