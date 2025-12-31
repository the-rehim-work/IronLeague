import { apiClient } from './client';
import type { Team } from '../types';

export const teamsApi = {
  async getAvailableTeams(leagueId: string): Promise<Team[]> {
    const { data } = await apiClient.get<Team[]>(`/data/teams/${leagueId}`);
    return data;
  },

  async getTeamDetails(teamId: string): Promise<Team> {
    const { data } = await apiClient.get<Team>(`/game/team/${teamId}/detail`);
    return data;
  },
};
