import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, favoriteApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isTenant: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  favorites: string[];
  unreadNotifications: number;
  login: (credentials: any) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  toggleFavorite: (propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  refreshSession: () => Promise<void>;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshSession = async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setUnreadNotifications(data.unreadNotifications || 0);
      setFavorites(data.favoritePropertyIds || []);
    } catch (error) {
      setUser(null);
      setFavorites([]);
      setUnreadNotifications(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (credentials: any): Promise<User> => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    await refreshSession();
    return data.user;
  };

  const register = async (data: any): Promise<User> => {
    const res = await authApi.register(data);
    setUser(res.user);
    await refreshSession();
    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setFavorites([]);
      setUnreadNotifications(0);
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
  };

  const isFavorite = (propertyId: string) => {
    return favorites.includes(propertyId);
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      throw new Error('Please sign in to save favorite properties.');
    }

    const wasFav = favorites.includes(propertyId);
    // Optimistic UI update
    setFavorites((prev) =>
      wasFav ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );

    try {
      if (wasFav) {
        await favoriteApi.removeFavorite(propertyId);
      } else {
        await favoriteApi.addFavorite(propertyId);
      }
    } catch (err) {
      // Revert on failure
      setFavorites((prev) =>
        wasFav ? [...prev, propertyId] : prev.filter((id) => id !== propertyId)
      );
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    isTenant: user?.role === 'TENANT',
    isOwner: user?.role === 'OWNER',
    isAdmin: user?.role === 'ADMIN',
    favorites,
    unreadNotifications,
    login,
    register,
    logout,
    updateUser,
    toggleFavorite,
    isFavorite,
    refreshSession,
    setUnreadNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
