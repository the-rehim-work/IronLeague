/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './client';
import type { Team, Player } from '../types';

export const teamsApi = {
  async getByLeague(leagueId: string): Promise<Team[]> {
    const { data } = await apiClient.get<Team[]>(`/data/teams/${leagueId}`);
    return data;
  },

  async getDetail(teamInstanceId: string): Promise<any> {
    const { data } = await apiClient.get(`/game/team/${teamInstanceId}/detail`);
    return data;
  },

  async getPlayers(teamId: string): Promise<Player[]> {
    const { data } = await apiClient.get<Player[]>(`/data/players/${teamId}`);
    return data;
  },
};