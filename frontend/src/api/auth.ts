import { apiClient, setAuthToken, setStoredUser, clearAuth } from './client';
import type { User } from '@/types';

interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  async login(userOrEmail: string, password: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { userOrEmail, password });
    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async register(dto: { userName: string; password: string; email?: string; displayName?: string }): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', dto);
    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me');
    setStoredUser(data);
    return data;
  },

  async updateProfile(dto: { displayName?: string; email?: string }) {
    const { data } = await apiClient.put('/auth/profile', dto);
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    return data;
  },

  async checkUsername(name: string): Promise<{ available: boolean; reason?: string }> {
    const { data } = await apiClient.get('/auth/usernames/check', { params: { name } });
    return data;
  },

  logout() {
    clearAuth();
  },
};