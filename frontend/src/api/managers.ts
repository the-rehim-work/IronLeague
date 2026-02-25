import { apiClient } from './client';
import type { Manager, Country } from '@/types';

export const managersApi = {
  async getMine(): Promise<Manager[]> {
    const { data } = await apiClient.get<Manager[]>('/manager/mine');
    return data;
  },

  async getById(id: string): Promise<Manager> {
    const { data } = await apiClient.get<Manager>(`/manager/${id}`);
    return data;
  },

  async create(dto: { name: string; nationality: string; earlyBonus: boolean }): Promise<Manager> {
    const { data } = await apiClient.post<Manager>('/manager', dto);
    return data;
  },

  async getCountries(): Promise<Country[]> {
    const { data } = await apiClient.get<Country[]>('/data/countries');
    return data;
  },
};