import { apiClient } from './client';
import type { Player, TransferOfferDto } from '@/types';

export const transferApi = {
  async getFreeAgents(): Promise<Player[]> {
    const { data } = await apiClient.get<Player[]>('/transfer/freeagents');
    return data;
  },

  async makeOffer(dto: TransferOfferDto) {
    const { data } = await apiClient.post('/transfer/offer', dto);
    return data;
  },
};