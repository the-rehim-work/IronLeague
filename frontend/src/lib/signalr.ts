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

    // Join the match room after connecting
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
    await this.connection.invoke('Pause', duration);
  }

  async resumeMatch(): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('Resume');
  }

  async giveSpeech(message: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('GiveSpeech', message);
  }
}

export class NotificationHubClient {
  private connection: HubConnection | null = null;

  async connect(): Promise<HubConnection> {
    const token = localStorage.getItem('token');

    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/notifications', {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    await this.connection.start();
    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  onNotification(callback: (notification: any) => void) {
    this.connection?.on('ReceiveNotification', callback);
  }
}

export class LeagueHubClient {
  private connection: HubConnection | null = null;

  async connect(leagueId: string): Promise<HubConnection> {
    const token = localStorage.getItem('token');

    this.connection = new HubConnectionBuilder()
      .withUrl(`/hubs/league?leagueId=${leagueId}`, {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    await this.connection.start();
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

  onPlayerJoined(callback: (data: any) => void) {
    this.connection?.on('PlayerJoined', callback);
  }

  onPlayerLeft(callback: (data: any) => void) {
    this.connection?.on('PlayerLeft', callback);
  }
}
