import { apiClient } from './client';

export const adminApi = {
  async seed() {
    await apiClient.post('/admin/seed');
  },
};