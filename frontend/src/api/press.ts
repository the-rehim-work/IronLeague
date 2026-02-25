import { apiClient } from './client';
import type { PressEventDto } from '@/types';

export const pressApi = {
  async getForLeague(leagueInstanceId: string, limit = 20): Promise<PressEventDto[]> {
    const { data } = await apiClient.get<PressEventDto[]>(`/press/league/${leagueInstanceId}`, { params: { limit } });
    return data;
  },

  async generateMatchReport(matchId: string): Promise<PressEventDto> {
    const { data } = await apiClient.post<PressEventDto>(`/press/match/${matchId}/report`);
    return data;
  },
};