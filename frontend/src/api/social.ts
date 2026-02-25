import { apiClient } from './client';
import type { FriendshipDto, LeagueInviteDto, ChatThread, ChatMessage } from '@/types';

export const socialApi = {
  async getFriends(): Promise<FriendshipDto[]> {
    const { data } = await apiClient.get<FriendshipDto[]>('/social/friends');
    return data;
  },

  async getPendingRequests(): Promise<FriendshipDto[]> {
    const { data } = await apiClient.get<FriendshipDto[]>('/social/friends/pending');
    return data;
  },

  async sendRequest(userName: string) {
    await apiClient.post('/social/friends/request', { userName });
  },

  async acceptRequest(friendshipId: string) {
    await apiClient.post(`/social/friends/${friendshipId}/accept`);
  },

  async declineRequest(friendshipId: string) {
    await apiClient.post(`/social/friends/${friendshipId}/decline`);
  },

  async removeFriend(friendshipId: string) {
    await apiClient.delete(`/social/friends/${friendshipId}`);
  },

  async getInvites(): Promise<LeagueInviteDto[]> {
    const { data } = await apiClient.get<LeagueInviteDto[]>('/social/invites');
    return data;
  },

  async acceptInvite(inviteId: string) {
    await apiClient.post(`/social/invites/${inviteId}/accept`);
  },

  async declineInvite(inviteId: string) {
    await apiClient.post(`/social/invites/${inviteId}/decline`);
  },

  async getThreads(): Promise<ChatThread[]> {
    const { data } = await apiClient.get<ChatThread[]>('/chat/threads');
    return data;
  },

  async getMessages(threadId: string, limit = 50): Promise<ChatMessage[]> {
    const { data } = await apiClient.get<ChatMessage[]>(`/chat/threads/${threadId}/messages`, { params: { limit } });
    return data;
  },

  async sendMessage(threadId: string, content: string): Promise<ChatMessage> {
    const { data } = await apiClient.post<ChatMessage>(`/chat/threads/${threadId}/messages`, { content });
    return data;
  },

  async startThread(userName: string): Promise<ChatThread> {
    const { data } = await apiClient.post<ChatThread>('/chat/threads', { userName });
    return data;
  },

  async getYouthAcademy(teamInstanceId: string) {
    const { data } = await apiClient.get(`/game/team/${teamInstanceId}/youth-academy`);
    return data;
  },

  async upgradeAcademy(teamInstanceId: string) {
    const { data } = await apiClient.post(`/game/team/${teamInstanceId}/youth-academy/upgrade`);
    return data;
  },

  async triggerIntake(teamInstanceId: string) {
    const { data } = await apiClient.post(`/game/team/${teamInstanceId}/youth-academy/intake`);
    return data;
  },

  async promoteYouth(teamInstanceId: string, playerId: string) {
    const { data } = await apiClient.post(`/game/team/${teamInstanceId}/youth-academy/promote/${playerId}`);
    return data;
  },
};