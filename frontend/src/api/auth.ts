import { apiClient, setAuthToken, clearAuthToken, setStoredUser } from './client';
import type { User } from '../types';

export interface LoginDto {
  userOrEmail: string;
  password: string;
}

export interface RegisterDto {
  userName: string;
  password: string;
  email?: string;
  displayName?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', dto);
    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', dto);
    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async logout() {
    clearAuthToken();
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me');
    setStoredUser(data);
    return data;
  },
};
