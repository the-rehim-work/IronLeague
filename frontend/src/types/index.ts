export interface User {
  id: string;
  userName: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  roles: string[];
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
  languages: PlayerLanguage[];
  contract?: ContractInfo;
}

export interface PlayerLanguage {
  languageCode: string;
  isNative: boolean;
}

export interface ContractInfo {
  weeklyWage: number;
  startDate: string;
  endDate: string;
  releaseClause?: number;
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
  governance?: GovernanceSettings;
}

export type LeagueStatus = 'Lobby' | 'Active' | 'Paused' | 'Completed';

export interface LeagueTeam {
  id: string;
  baseTeamId: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  isControlledByPlayer: boolean;
  managerId?: string;
  managerName?: string;
}

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
  type: string;
  status: string;
}

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
  status: string;
  match?: MatchSummary;
}

export interface MatchSummary {
  id: string;
  homeScore: number;
  awayScore: number;
  status: string;
}

export interface Match {
  id: string;
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  currentTick: number;
  totalTicks: number;
  status: string;
  weather: string;
  attendance: number;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  events: MatchEvent[];
}

export interface MatchTeam {
  teamId: string;
  teamName: string;
  formation: string;
  tactics: string;
  primaryColor?: string;
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
  type: string;
  primaryPlayerName?: string;
  secondaryPlayerName?: string;
  isHomeTeam: boolean;
  description?: string;
  isKeyEvent: boolean;
  isImportantEvent: boolean;
  positionX?: number;
  positionY?: number;
}

export interface MatchState {
  tick: number;
  ballX: number;
  ballY: number;
  homeScore: number;
  awayScore: number;
  status: string;
  isHomeTeamPossession: boolean;
  homeMomentum: number;
  awayMomentum: number;
}

export interface FixtureWeek {
  matchDay: number;
  weekStart: string;
  fixtures: GroupedFixture[];
}

export interface GroupedFixture {
  id: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamColor: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamColor: string;
  scheduledDate: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  matchId?: string;
  involvesUser: boolean;
}

export interface GroupedFixturesResponse {
  userTeamInstanceId: string | null;
  weeks: FixtureWeek[];
}

export interface SimulationResult {
  success: boolean;
  newDate: string;
  simulatedMatches: SimMatch[];
  playerMatchUpcoming?: GroupedFixture;
  message?: string;
}

export interface SimMatch {
  fixtureId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  involvesPlayer: boolean;
}

export interface TeamDetail {
  teamInstanceId: string;
  baseTeamId: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
  stadiumCapacity: number;
  wageBudget: number;
  transferBudget: number;
  totalBalance: number;
  fanLoyalty: number;
  fanMood: number;
  isControlledByPlayer: boolean;
  managerName?: string;
  standings: TeamStandings;
  squad: SquadPlayer[];
  staff: StaffMember[];
}

export interface TeamStandings {
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface SquadPlayer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  secondaryPosition?: string;
  age: number;
  nationality: string;
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
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  ability: number;
}

export interface MyTeamResponse {
  teamInstanceId: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  standings: TeamStandings;
  squad: SquadPlayer[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface TacticDto {
  id: string;
  teamInstanceId: string;
  name: string;
  formation: string;
  defensiveLine: number;
  width: number;
  tempo: number;
  pressing: number;
  counterAttack: boolean;
  playOutFromBack: boolean;
  directPassing: boolean;
  highPress: boolean;
  parkTheBus: boolean;
  isDefault: boolean;
}

export interface CreateTacticDto {
  name: string;
  formation: string;
  defensiveLine: number;
  width: number;
  tempo: number;
  pressing: number;
  counterAttack: boolean;
  playOutFromBack: boolean;
  directPassing: boolean;
  highPress: boolean;
  parkTheBus: boolean;
}

export interface TrainingSessionDto {
  id: string;
  teamInstanceId: string;
  type: string;
  intensity: number;
  focusAttribute?: string;
  excludedPlayerIds: string[];
  results: TrainingResult[];
  processedAt?: string;
}

export interface TrainingResult {
  playerName: string;
  fitnessChange: number;
  moraleChange: number;
  attributeImproved?: string;
}

export interface GovernanceSettings {
  presetName: string;
  crowdWeight: number;
  languageWeight: number;
  moraleWeight: number;
  speechWeight: number;
  pressureWeight: number;
  weatherWeight: number;
  refereeWeight: number;
  chemistryWeight: number;
  rngChaosWeight: number;
  experienceWeight: number;
  formWeight: number;
  managerReputationWeight: number;
  scandalWeight: number;
}

export interface PressEventDto {
  id: string;
  leagueInstanceId: string;
  headline: string;
  content: string;
  type: string;
  createdAt: string;
  reputationImpact: number;
  moraleImpact: number;
  fanMoodImpact: number;
}

export interface TransferOfferDto {
  playerId: string;
  offeredFee: number;
  offeredWage: number;
  contractYears: number;
  isLoan: boolean;
  loanFee?: number;
  loanWage?: number;
}

export interface FriendshipDto {
  id: string;
  userId: string;
  userName: string;
  displayName: string;
  status: string;
  createdAt: string;
}

export interface LeagueInviteDto {
  id: string;
  leagueInstanceId: string;
  leagueName: string;
  invitedByName: string;
  createdAt: string;
}

export interface ChatThread {
  threadId: string;
  withUserName: string;
  withDisplayName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderUserName: string;
  content: string;
  sentAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}