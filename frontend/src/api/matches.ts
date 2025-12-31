import { apiClient } from './client';
import type { Match, Fixture, Speech, TacticalChange } from '../types';

export const matchesApi = {
  async getFixtures(leagueId: string): Promise<Fixture[]> {
    const { data } = await apiClient.get<Fixture[]>(`/leagues/${leagueId}/fixtures`);
    return data;
  },

  async createDemoMatch(): Promise<Match> {
    const { data } = await apiClient.post<Match>('/match/demo');
    return data;
  },

  async startMatch(fixtureId: string, homeFormation: string, awayFormation: string): Promise<Match> {
    const { data } = await apiClient.post<Match>(`/fixtures/${fixtureId}/start`, {
      homeFormation,
      awayFormation,
    });
    return data;
  },

  async pauseMatch(matchId: string) {
    await apiClient.post(`/matches/${matchId}/pause`);
  },

  async resumeMatch(matchId: string) {
    await apiClient.post(`/matches/${matchId}/resume`);
  },

  async giveSpeech(matchId: string, speech: Speech) {
    await apiClient.post(`/matches/${matchId}/speech`, speech);
  },

  async changeTactics(matchId: string, change: TacticalChange) {
    await apiClient.post(`/matches/${matchId}/tactics`, change);
  },
};
