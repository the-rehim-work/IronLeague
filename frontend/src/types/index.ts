export interface User {
  id: string;
  userName: string;
  email: string;
  displayName: string;
  avatarId: string;
  isAdmin: boolean;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  trophiesWon: number;
}

export interface Manager {
  id: string;
  name: string;
  nationality: string;
  age: number;
  physical: number;
  mental: number;
  technical: number;
  reputation: number;
  personalBalance: number;
  isRetired: boolean;
  currentTeamId?: string;
  currentTeamName?: string;
  leagueInstanceId?: string;
  languages: ManagerLanguage[];
}

export interface ManagerLanguage {
  languageCode: string;
  proficiency: number;
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  exchangeRateToEur: number;
  primaryLanguage: string;
}

export interface League {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  tier: number;
  maxTeams: number;
  promotionSpots: number;
  relegationSpots: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  leagueName: string;
  primaryColor: string;
  secondaryColor: string;
  stadiumCapacity: number;
  stadiumName: string;
  wageBudget: number;
  transferBudget: number;
  totalBalance: number;
  fanLoyalty: number;
  fanMood: number;
  managerId?: string;
  managerName?: string;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationality: string;
  age: number;
  primaryPosition: Position;
  secondaryPosition?: Position;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  overall: number;
  potential: number;
  morale: number;
  fitness: number;
  form: number;
  marketValue: number;
  isLegend: boolean;
  isSpecialLegend: boolean;
  teamId?: string;
  teamName?: string;
  languages: string[];
}

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'LWB' | 'RWB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'CF' | 'ST';

export interface LeagueInstance {
  id: string;
  name: string;
  baseLeagueName?: string;
  ownerId: string;
  ownerName: string;
  isPrivate: boolean;
  maxPlayers: number;
  currentPlayerCount: number;
  currentSeason: number;
  currentDate: string;
  status: LeagueStatus;
  governance: GovernanceSettings;
}

export type LeagueStatus = 'Lobby' | 'Active' | 'Paused' | 'Completed';

export interface LeagueTeamInstance {
  id: string;
  baseTeamId: string;
  teamName: string;
  teamColors: string;
  managerId?: string;
  managerName?: string;
  isControlledByPlayer: boolean;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  wins: number;
  draws: number;
  losses: number;
  played: number;
}

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  status: CompetitionStatus;
}

export type CompetitionType = 'League' | 'Cup' | 'GroupAndKnockout';
export type CompetitionStatus = 'Scheduled' | 'InProgress' | 'Completed';

export interface Fixture {
  id: string;
  competitionId: string;
  competitionName: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamColors: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamColors: string;
  scheduledDate: string;
  matchDay?: number;
  round?: string;
  status: FixtureStatus;
  match?: MatchSummary;
}

export type FixtureStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Postponed';

export interface MatchSummary {
  id: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
}

export type MatchStatus = 'NotStarted' | 'FirstHalf' | 'HalfTime' | 'SecondHalf' | 'ExtraTimeFirst' | 'ExtraTimeSecond' | 'Penalties' | 'Finished' | 'Abandoned';

export interface Match {
  id: string;
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  currentTick: number;
  totalTicks: number;
  status: MatchStatus;
  weather: WeatherType;
  attendance: number;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  events: MatchEvent[];
}

export type WeatherType = 'Clear' | 'Cloudy' | 'Rainy' | 'Snowy' | 'Foggy' | 'Windy' | 'Hot' | 'Cold';

export interface MatchTeam {
  teamId: string;
  teamName: string;
  formation: string;
  tactics: string;
  speechesUsed: number;
  pausesUsed: number;
  players: MatchPlayer[];
}

export interface MatchPlayer {
  playerId: string;
  name: string;
  position: string;
  x: number;
  y: number;
  hasBall: boolean;
}

export interface MatchEvent {
  id: string;
  tick: number;
  minute: number;
  type: MatchEventType;
  primaryPlayerName?: string;
  secondaryPlayerName?: string;
  isHomeTeam: boolean;
  description?: string;
  isKeyEvent: boolean;
  isImportantEvent: boolean;
  positionX?: number;
  positionY?: number;
}

export type MatchEventType =
  | 'KickOff' | 'Goal' | 'OwnGoal' | 'Assist' | 'Shot' | 'ShotOnTarget' | 'ShotBlocked' | 'Save'
  | 'Pass' | 'KeyPass' | 'Tackle' | 'Interception' | 'Foul' | 'YellowCard' | 'RedCard'
  | 'Injury' | 'Substitution' | 'Corner' | 'FreeKick' | 'Penalty' | 'PenaltyMissed' | 'PenaltySaved'
  | 'Offside' | 'HalfTime' | 'FullTime' | 'ExtraTime' | 'PenaltyShootout'
  | 'Speech' | 'TacticalChange' | 'Pause' | 'Resume' | 'MomentumShift' | 'PressureBuildup'
  | 'CounterAttack' | 'SetPiece';

export interface MatchState {
  tick: number;
  ballX: number;
  ballY: number;
  isHomeTeamPossession: boolean;
  homeMomentum: number;
  awayMomentum: number;
  playerPositions: Record<string, PlayerPosition>;
}

export interface PlayerPosition {
  x: number;
  y: number;
  hasBall: boolean;
}

export interface GovernanceSettings {
  presetName: string;
  crowdWeight: number;
  crowdCurve: CurveType;
  crowdCombination: CombinationMethod;
  languageWeight: number;
  languageCurve: CurveType;
  languageCombination: CombinationMethod;
  moraleWeight: number;
  moraleCurve: CurveType;
  moraleCombination: CombinationMethod;
  speechWeight: number;
  speechCurve: CurveType;
  speechCombination: CombinationMethod;
  pressureWeight: number;
  pressureCurve: CurveType;
  pressureCombination: CombinationMethod;
  weatherWeight: number;
  weatherCurve: CurveType;
  weatherCombination: CombinationMethod;
  refereeWeight: number;
  refereeCurve: CurveType;
  refereeCombination: CombinationMethod;
  chemistryWeight: number;
  chemistryCurve: CurveType;
  chemistryCombination: CombinationMethod;
  rngChaosWeight: number;
  experienceWeight: number;
  experienceCurve: CurveType;
  formWeight: number;
  formCurve: CurveType;
  managerReputationWeight: number;
  managerReputationCurve: CurveType;
  scandalWeight: number;
  scandalCurve: CurveType;
}

export type CurveType = 'Linear' | 'Diminishing' | 'Threshold' | 'Exponential' | 'Soft';
export type CombinationMethod = 'DirectOverride' | 'AdditiveContribution' | 'ConditionalGate' | 'VarianceControl';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType = 'System' | 'MatchResult' | 'Transfer' | 'LeagueInvite' | 'FriendRequest' | 'Achievement' | 'ManagerOffer' | 'SeasonEnd' | 'Injury' | 'Scandal';

export interface Speech {
  type: SpeechType;
  target: SpeechTarget;
  targetPlayerId?: string;
  tone: SpeechTone;
}

export type SpeechType = 'Motivational' | 'Tactical' | 'Calm' | 'Aggressive' | 'Encouragement' | 'Warning';
export type SpeechTarget = 'WholeTeam' | 'SinglePlayer';
export type SpeechTone = 'Calm' | 'Passionate' | 'Aggressive' | 'Supportive' | 'Critical';

export interface TacticalChange {
  newFormation?: string;
  newTactics?: string;
  playerInstructions?: Record<string, string>;
}

export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}