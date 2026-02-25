import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

export function createHubConnection(path: string): HubConnection {
  const token = localStorage.getItem('il_token');

  return new HubConnectionBuilder()
    .withUrl(path, {
      accessTokenFactory: () => token || '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

export class MatchHubClient {
  private connection: HubConnection | null = null;

  async connect(matchId: string): Promise<HubConnection> {
    this.connection = createHubConnection('/hubs/match');
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

  on(event: string, callback: (...args: unknown[]) => void) {
    this.connection?.on(event, callback);
  }

  async invoke(method: string, ...args: unknown[]) {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke(method, ...args);
  }

  async pauseMatch(matchId: string) {
    await this.invoke('PauseMatch', matchId);
  }

  async resumeMatch(matchId: string) {
    await this.invoke('ResumeMatch', matchId);
  }

  async startMatch(dto: unknown) {
    await this.invoke('StartMatch', dto);
  }

  async giveSpeech(dto: unknown) {
    await this.invoke('GiveSpeech', dto);
  }
}