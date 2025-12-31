import { apiClient } from './client';
import type { LeagueInstance, League, LeagueTeamInstance, GovernanceSettings } from '../types';

export interface CreateLeagueInstanceDto {
  name: string;
  baseLeagueId?: string;
  isPrivate: boolean;
  password?: string;
  maxPlayers: number;
  governance?: GovernanceSettings;
}

export const leaguesApi = {
  async getAll(): Promise<LeagueInstance[]> {
    const { data } = await apiClient.get<LeagueInstance[]>('/leagueinstance/public');
    return data;
  },

  async getById(id: string): Promise<LeagueInstance> {
    const { data } = await apiClient.get<LeagueInstance>(`/leagueinstance/${id}`);
    return data;
  },

  async create(dto: CreateLeagueInstanceDto): Promise<LeagueInstance> {
    const { data } = await apiClient.post<LeagueInstance>('/leagueinstance', dto);
    return data;
  },

  async join(leagueId: string, managerId: string, teamId: string, password?: string) {
    await apiClient.post('/leagueinstance/join', { leagueInstanceId: leagueId, managerId, teamId, password });
  },

  async start(leagueId: string) {
    await apiClient.post(`/leagueinstance/${leagueId}/start`);
  },

  async getStandings(leagueId: string): Promise<LeagueTeamInstance[]> {
    const { data } = await apiClient.get<LeagueTeamInstance[]>(`/leagueinstance/${leagueId}/standings`);
    return data;
  },

  async getBaseLeagues(): Promise<League[]> {
    const { data } = await apiClient.get<League[]>('/data/leagues');
    return data;
  },
};
