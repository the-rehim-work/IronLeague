import { apiClient } from './client';
import type { Manager } from '../types';

export interface CreateManagerDto {
  name: string;
  nationality: string;
  earlyBonus: boolean;
}

export const managersApi = {
  async getMyManagers(): Promise<Manager[]> {
    const { data } = await apiClient.get<Manager[]>('/manager/mine');
    return data;
  },

  async create(dto: CreateManagerDto): Promise<Manager> {
    const { data } = await apiClient.post<Manager>('/manager', dto);
    return data;
  },

  async getById(id: string): Promise<Manager> {
    const { data } = await apiClient.get<Manager>(`/manager/${id}`);
    return data;
  },
};
