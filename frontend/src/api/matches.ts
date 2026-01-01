/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './client';
import type { Match, Fixture, Speech, TacticalChange } from '../types';

export const matchesApi = {
  async getById(matchId: string): Promise<Match> {
    const { data } = await apiClient.get<Match>(`/match/${matchId}`);
    return data;
  },

  async createDemoMatch(): Promise<Match> {
    const { data } = await apiClient.post<Match>('/match/demo');
    return data;
  },

  async startMatch(fixtureId: string, homeFormation: string, homeTactics: string, awayFormation: string, awayTactics: string): Promise<Match> {
    const { data } = await apiClient.post<Match>('/match/start', {
      fixtureId,
      homeFormation,
      homeTactics,
      awayFormation,
      awayTactics,
    });
    return data;
  },

  async simulateFixture(fixtureId: string): Promise<any> {
    const { data } = await apiClient.post(`/game/fixture/${fixtureId}/simulate`);
    return data;
  },

  async getFixture(fixtureId: string): Promise<Fixture> {
    const { data } = await apiClient.get<Fixture>(`/fixture/${fixtureId}`);
    return data;
  },
};