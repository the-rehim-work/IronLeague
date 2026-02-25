import { apiClient } from './client';
import type { Team, TeamDetail, Player } from '@/types';

export const teamsApi = {
  async getByLeague(leagueId: string): Promise<Team[]> {
    const { data } = await apiClient.get<Team[]>(`/data/teams/${leagueId}`);
    return data;
  },

  async getDetail(teamInstanceId: string): Promise<TeamDetail> {
    const { data } = await apiClient.get<TeamDetail>(`/game/team/${teamInstanceId}/detail`);
    return data;
  },

  async getPlayers(teamId: string): Promise<Player[]> {
    const { data } = await apiClient.get<Player[]>(`/data/players/${teamId}`);
    return data;
  },
};