import { create } from 'zustand';
import type { User, Manager } from '@/types';
import { authApi } from '@/api/auth';

interface AuthState {
  user: User | null;
  managers: Manager[];
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (userOrEmail: string, password: string) => Promise<void>;
  register: (userName: string, password: string, email?: string, displayName?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setManagers: (managers: Manager[]) => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  managers: [],
  isAuthenticated: false,
  isLoading: true,

  login: async (userOrEmail, password) => {
    const { user } = await authApi.login(userOrEmail, password);
    set({ user, isAuthenticated: true });
  },

  register: async (userName, password, email, displayName) => {
    const { user } = await authApi.register({ userName, password, email, displayName });
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    authApi.logout();
    set({ user: null, managers: [], isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
  setManagers: (managers) => set({ managers }),
  setLoading: (isLoading) => set({ isLoading }),
}));