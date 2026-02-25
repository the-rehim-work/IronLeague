import { apiClient } from './client';
import type { TacticDto, CreateTacticDto } from '@/types';

export const tacticsApi = {
  async getForTeam(teamInstanceId: string): Promise<TacticDto[]> {
    const { data } = await apiClient.get<TacticDto[]>(`/tactic/team/${teamInstanceId}`);
    return data;
  },

  async getById(id: string): Promise<TacticDto> {
    const { data } = await apiClient.get<TacticDto>(`/tactic/${id}`);
    return data;
  },

  async create(teamInstanceId: string, dto: CreateTacticDto): Promise<TacticDto> {
    const { data } = await apiClient.post<TacticDto>(`/tactic/team/${teamInstanceId}`, dto);
    return data;
  },

  async update(id: string, dto: CreateTacticDto): Promise<TacticDto> {
    const { data } = await apiClient.put<TacticDto>(`/tactic/${id}`, dto);
    return data;
  },

  async remove(id: string) {
    await apiClient.delete(`/tactic/${id}`);
  },

  async setDefault(teamInstanceId: string, tacticId: string) {
    await apiClient.post(`/tactic/team/${teamInstanceId}/default/${tacticId}`);
  },
};