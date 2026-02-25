import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/types';

export const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('il_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('il_token');
      localStorage.removeItem('il_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token: string) {
  localStorage.setItem('il_token', token);
}

export function clearAuth() {
  localStorage.removeItem('il_token');
  localStorage.removeItem('il_user');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('il_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown) {
  localStorage.setItem('il_user', JSON.stringify(user));
}