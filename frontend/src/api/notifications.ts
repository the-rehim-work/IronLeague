import { apiClient } from './client';
import type { Notification } from '@/types';

export const notificationsApi = {
  async getAll(): Promise<Notification[]> {
    const { data } = await apiClient.get<Notification[]>('/notification');
    return data;
  },

  async markRead(id: string) {
    await apiClient.post(`/notification/${id}/read`);
  },

  async markAllRead() {
    await apiClient.post('/notification/read-all');
  },
};