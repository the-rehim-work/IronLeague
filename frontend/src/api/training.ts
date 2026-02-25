import { apiClient } from './client';
import type { TrainingSessionDto } from '@/types';

export const trainingApi = {
  async getForTeam(teamInstanceId: string, limit = 10): Promise<TrainingSessionDto[]> {
    const { data } = await apiClient.get<TrainingSessionDto[]>(`/training/team/${teamInstanceId}`, { params: { limit } });
    return data;
  },

  async getById(sessionId: string): Promise<TrainingSessionDto> {
    const { data } = await apiClient.get<TrainingSessionDto>(`/training/${sessionId}`);
    return data;
  },

  async create(teamInstanceId: string, dto: {
    type: string;
    intensity: number;
    focusAttribute?: string;
    excludedPlayerIds?: string[];
  }): Promise<TrainingSessionDto> {
    const { data } = await apiClient.post<TrainingSessionDto>(`/training/team/${teamInstanceId}`, dto);
    return data;
  },

  async process(sessionId: string) {
    await apiClient.post(`/training/${sessionId}/process`);
  },
};