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

// Default seeded users for demonstration
const DEFAULT_USERS: any[] = [
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

  // Initialize users database in localStorage if not already present or invalid
  useEffect(() => {
    const storedUsers = localStorage.getItem('rentease_users');
    let valid = false;
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          valid = true;
        }
      } catch (e) {
        valid = false;
      }
    }
    if (!valid) {
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
      try {
        setUser(JSON.parse(activeUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    // Simulate minor delay for UX skeletons/loading state
    await new Promise((resolve) => setTimeout(resolve, 500));

    const storedUsers = localStorage.getItem('rentease_users');
    let usersList = DEFAULT_USERS;
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          usersList = parsed;
        }
      } catch (e) {
        usersList = DEFAULT_USERS;
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const foundUser = usersList.find((u: any) => u.email.trim().toLowerCase() === cleanEmail);
    if (!foundUser) {
      throw new Error('Incorrect credentials.');
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

    const storedUsers = localStorage.getItem('rentease_users');
    let usersList = DEFAULT_USERS;
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          usersList = parsed;
        }
      } catch (e) {
        usersList = DEFAULT_USERS;
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailExists = usersList.some((u: any) => u.email.trim().toLowerCase() === cleanEmail);
    if (emailExists) {
      throw new Error('User with this email already exists.');
    }

    const newUser = {
      id: Math.max(...usersList.map((u: any) => u.id), 0) + 1,
      name: name.trim(),
      email: email.trim(),
      password: password,
      phone: phone.trim(),
      profile_picture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.trim())}`,
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
    const storedUsers = localStorage.getItem('rentease_users');
    let usersList = DEFAULT_USERS;
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          usersList = parsed;
        }
      } catch (e) {
        usersList = DEFAULT_USERS;
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    let foundUser = usersList.find((u: any) => u.email.trim().toLowerCase() === cleanEmail);
    if (!foundUser) {
      foundUser = {
        id: Math.max(...usersList.map((u: any) => u.id), 0) + 1,
        name: name.trim(),
        email: email.trim(),
        password: 'GoogleSimulatedPassword@123',
        phone: '',
        profile_picture: picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.trim())}`,
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

    const storedUsers = localStorage.getItem('rentease_users');
    let usersList = DEFAULT_USERS;
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          usersList = parsed;
        }
      } catch (e) {
        usersList = DEFAULT_USERS;
      }
    }

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

    const storedUsers = localStorage.getItem('rentease_users');
    let usersList = DEFAULT_USERS;
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          usersList = parsed;
        }
      } catch (e) {
        usersList = DEFAULT_USERS;
      }
    }

    const userIndex = usersList.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      usersList[userIndex].name = name.trim();
      usersList[userIndex].phone = phone ? phone.trim() : '';
      if (profilePicture) {
        usersList[userIndex].profile_picture = profilePicture;
      }
      localStorage.setItem('rentease_users', JSON.stringify(usersList));
    }

    const updatedUser = { 
      ...user, 
      name: name.trim(), 
      phone: phone ? phone.trim() : '', 
      profile_picture: profilePicture || user.profile_picture 
    };
    localStorage.setItem('rentease_current_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) throw new Error('Not authenticated.');

    await new Promise((resolve) => setTimeout(resolve, 500));

    const storedUsers = localStorage.getItem('rentease_users');
    let usersList = DEFAULT_USERS;
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          usersList = parsed;
        }
      } catch (e) {
        usersList = DEFAULT_USERS;
      }
    }

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
