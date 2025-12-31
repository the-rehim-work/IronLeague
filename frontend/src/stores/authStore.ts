import { create } from 'zustand';
import type { User, Manager } from '../types';
import { authApi } from '../api';

interface AuthState {
  user: User | null;
  managers: Manager[];
  currentManager: Manager | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (userOrEmail: string, password: string) => Promise<void>;
  register: (userName: string, password: string, email?: string, displayName?: string) => Promise<void>;
  logout: () => void;
  setCurrentManager: (manager: Manager | null) => void;
  loadManagers: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  managers: [],
  currentManager: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (userOrEmail, password) => {
    const { user } = await authApi.login({ userOrEmail, password });
    set({ user, isAuthenticated: true });
  },

  register: async (userName, password, email, displayName) => {
    const { user } = await authApi.register({ userName, password, email, displayName });
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    authApi.logout();
    set({ user: null, managers: [], currentManager: null, isAuthenticated: false });
  },

  setCurrentManager: (manager) => {
    set({ currentManager: manager });
  },

  loadManagers: async () => {
    // Will be implemented when managers API is ready
    set({ managers: [] });
  },
}));
