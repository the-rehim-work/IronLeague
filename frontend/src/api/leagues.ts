/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './client';
import type { LeagueInstance, League, LeagueTeamInstance, GovernanceSettings, Competition, Fixture } from '../types';

export interface CreateLeagueInstanceDto {
  name: string;
  baseLeagueId?: string;
  isPrivate: boolean;
  password?: string;
  maxPlayers: number;
  governance?: GovernanceSettings;
}

export const leaguesApi = {
  async getPublic(): Promise<LeagueInstance[]> {
    const { data } = await apiClient.get<LeagueInstance[]>('/leagueinstance/public');
    return data;
  },

  async getMine(): Promise<LeagueInstance[]> {
    const { data } = await apiClient.get<LeagueInstance[]>('/leagueinstance/mine');
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

  async getTeams(leagueId: string): Promise<any[]> {
    const { data } = await apiClient.get(`/game/leagueinstance/${leagueId}/teams`);
    return data;
  },

  async getCompetitions(leagueId: string): Promise<Competition[]> {
    const { data } = await apiClient.get<Competition[]>(`/game/leagueinstance/${leagueId}/competitions`);
    return data;
  },

  async getStandings(competitionId: string): Promise<LeagueTeamInstance[]> {
    const { data } = await apiClient.get<LeagueTeamInstance[]>(`/game/competition/${competitionId}/standings`);
    return data;
  },

  async getFixtures(leagueId: string): Promise<Fixture[]> {
    const { data } = await apiClient.get<Fixture[]>(`/game/leagueinstance/${leagueId}/fixtures`);
    return data;
  },

  async getFixturesGrouped(leagueId: string): Promise<any> {
    const { data } = await apiClient.get(`/game/leagueinstance/${leagueId}/fixtures/grouped`);
    return data;
  },

  async getMyTeam(leagueId: string): Promise<any> {
    const { data } = await apiClient.get(`/game/leagueinstance/${leagueId}/myteam`);
    return data;
  },

  async advanceDay(leagueId: string, simulateOwn: boolean = false): Promise<any> {
    const { data } = await apiClient.post(`/game/leagueinstance/${leagueId}/advance?simulateOwn=${simulateOwn}`);
    return data;
  },

  async advanceUntilMatch(leagueId: string, simulateOwn: boolean = false): Promise<any> {
    const { data } = await apiClient.post(`/game/leagueinstance/${leagueId}/advance-until-match?simulateOwn=${simulateOwn}`);
    return data;
  },

  async getBaseLeagues(): Promise<League[]> {
    const { data } = await apiClient.get<League[]>('/data/leagues');
    return data;
  },
};