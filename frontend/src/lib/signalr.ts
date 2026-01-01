/* eslint-disable @typescript-eslint/no-explicit-any */
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

export class MatchHubClient {
  private connection: HubConnection | null = null;

  async connect(matchId: string): Promise<HubConnection> {
    const token = localStorage.getItem('token');

    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/match', {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    await this.connection.start();
    await this.connection.invoke('JoinMatch', matchId);

    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  onMatchState(callback: (state: any) => void) {
    this.connection?.on('MatchState', callback);
  }

  onMatchEvent(callback: (event: any) => void) {
    this.connection?.on('MatchEvent', callback);
  }

  onMatchPaused(callback: (data: any) => void) {
    this.connection?.on('MatchPaused', callback);
  }

  onMatchResumed(callback: () => void) {
    this.connection?.on('MatchResumed', callback);
  }

  onMatchEnded(callback: (data: any) => void) {
    this.connection?.on('MatchEnded', callback);
  }

  onMatchFinished(callback: (summary: any) => void) {
    this.connection?.on('MatchFinished', callback);
  }

  onError(callback: (errorMsg: string) => void) {
    this.connection?.on('Error', callback);
  }

  async pauseMatch(duration: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('PauseMatch', duration);
  }

  async resumeMatch(): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('ResumeMatch');
  }

  async giveSpeech(dto: any): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('GiveSpeech', dto);
  }

  async startMatch(dto: any): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('StartMatch', dto);
  }
}

export class LeagueHubClient {
  private connection: HubConnection | null = null;

  async connect(leagueId: string): Promise<HubConnection> {
    const token = localStorage.getItem('token');

    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/league', {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    await this.connection.start();
    await this.connection.invoke('JoinLeague', leagueId);

    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  onLeagueUpdate(callback: (data: any) => void) {
    this.connection?.on('LeagueUpdate', callback);
  }

  onFixtureUpdate(callback: (data: any) => void) {
    this.connection?.on('FixtureUpdate', callback);
  }
}