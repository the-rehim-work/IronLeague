import { apiClient } from './client';
import type { Player } from '@/types';

export const playersApi = {
  async getById(playerId: string): Promise<Player> {
    const { data } = await apiClient.get<Player>(`/game/player/${playerId}`);
    return data;
  },

  async search(params: {
    name?: string;
    position?: string;
    minOverall?: number;
    maxAge?: number;
    maxValue?: number;
    limit?: number;
  }): Promise<Player[]> {
    const { data } = await apiClient.get<Player[]>('/game/player/search', { params });
    return data;
  },
};