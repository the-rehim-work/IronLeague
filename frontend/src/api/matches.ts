import { apiClient } from './client';
import type { Match } from '@/types';

export const matchesApi = {
  async getById(matchId: string): Promise<Match> {
    const { data } = await apiClient.get<Match>(`/match/${matchId}`);
    return data;
  },

  async createDemo(): Promise<Match> {
    const { data } = await apiClient.post<Match>('/match/demo');
    return data;
  },

  async start(dto: {
    fixtureId: string;
    homeFormation: string;
    homeTactics: string;
    awayFormation: string;
    awayTactics: string;
  }): Promise<Match> {
    const { data } = await apiClient.post<Match>('/match/start', dto);
    return data;
  },

  async simulateFixture(fixtureId: string) {
    const { data } = await apiClient.post(`/game/fixture/${fixtureId}/simulate`);
    return data;
  },
};