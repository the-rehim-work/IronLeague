using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IronLeague.Entities;

public class AppUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public string AvatarId { get; set; } = "default";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
    public int MatchesPlayed { get; set; }
    public int MatchesWon { get; set; }
    public int MatchesDrawn { get; set; }
    public int MatchesLost { get; set; }
    public int TrophiesWon { get; set; }
    public bool IsAdmin { get; set; }
    public ICollection<LeagueInvite> LeagueInvitesReceived { get; set; } = new List<LeagueInvite>();
    public ICollection<LeagueInvite> LeagueInvitesSent { get; set; } = new List<LeagueInvite>();
    public ICollection<Manager> Managers { get; set; } = new List<Manager>();
    public ICollection<Friendship> FriendshipsInitiated { get; set; } = new List<Friendship>();
    public ICollection<Friendship> FriendshipsReceived { get; set; } = new List<Friendship>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<LeagueInvite> LeagueInvites { get; set; } = new List<LeagueInvite>();
}

public class AppRole : IdentityRole<Guid> { }

public class Manager
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
    public int Age { get; set; } = 35;
    public int Physical { get; set; } = 50;
    public int Mental { get; set; } = 50;
    public int Technical { get; set; } = 50;
    public int Reputation { get; set; } = 50;
    public decimal PersonalBalance { get; set; }
    public bool IsRetired { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CurrentTeamId { get; set; }
    public Team? CurrentTeam { get; set; }
    public Guid? LeagueInstanceId { get; set; }
    public LeagueInstance? LeagueInstance { get; set; }
    public ICollection<ManagerLanguage> Languages { get; set; } = new List<ManagerLanguage>();
    public ICollection<ManagerTrophy> Trophies { get; set; } = new List<ManagerTrophy>();
}

public class ManagerLanguage
{
    public Guid Id { get; set; }
    public Guid ManagerId { get; set; }
    public Manager Manager { get; set; } = null!;
    public string LanguageCode { get; set; } = string.Empty;
    public int Proficiency { get; set; } = 100;
}

public class ManagerTrophy
{
    public Guid Id { get; set; }
    public Guid ManagerId { get; set; }
    public Manager Manager { get; set; } = null!;
    public string TrophyName { get; set; } = string.Empty;
    public string CompetitionName { get; set; } = string.Empty;
    public int Season { get; set; }
    public DateTime WonAt { get; set; }
}

public class Country
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Currency { get; set; } = "EUR";
    public decimal ExchangeRateToEur { get; set; } = 1m;
    public string PrimaryLanguage { get; set; } = string.Empty;
    public ICollection<League> Leagues { get; set; } = new List<League>();
}

public class League
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public Country Country { get; set; } = null!;
    public int Tier { get; set; } = 1;
    public int MaxTeams { get; set; } = 20;
    public int PromotionSpots { get; set; }
    public int RelegationSpots { get; set; }
    public Guid? PromotesToLeagueId { get; set; }
    public League? PromotesToLeague { get; set; }
    public Guid? RelegatesFromLeagueId { get; set; }
    public League? RelegatesFromLeague { get; set; }
    public ICollection<Team> Teams { get; set; } = new List<Team>();
}

public class Team
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public Guid LeagueId { get; set; }
    public League League { get; set; } = null!;
    public string PrimaryColor { get; set; } = "#FFFFFF";
    public string SecondaryColor { get; set; } = "#000000";
    public int StadiumCapacity { get; set; } = 30000;
    public string StadiumName { get; set; } = string.Empty;
    public decimal WageBudget { get; set; }
    public decimal TransferBudget { get; set; }
    public decimal TotalBalance { get; set; }
    public decimal TicketIncome { get; set; }
    public decimal SponsorIncome { get; set; }
    public decimal MerchandiseIncome { get; set; }
    public decimal TvIncome { get; set; }
    public int FanLoyalty { get; set; } = 70;
    public int FanMood { get; set; } = 50;
    public Guid? ManagerId { get; set; }
    public Manager? Manager { get; set; }
    public ICollection<Player> Players { get; set; } = new List<Player>();
    public ICollection<Staff> Staff { get; set; } = new List<Staff>();
}

public class Player
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age => (int)((DateTime.UtcNow - DateOfBirth).TotalDays / 365.25);
    public Position PrimaryPosition { get; set; }
    public Position? SecondaryPosition { get; set; }
    public int Pace { get; set; }
    public int Shooting { get; set; }
    public int Passing { get; set; }
    public int Dribbling { get; set; }
    public int Defending { get; set; }
    public int Physical { get; set; }
    public int Potential { get; set; }
    public int CurrentAbility { get; set; }
    public int Morale { get; set; } = 50;
    public int Fitness { get; set; } = 100;
    public int Form { get; set; } = 50;
    public decimal MarketValue { get; set; }
    public bool IsLegend { get; set; }
    public bool IsSpecialLegend { get; set; }
    public Guid? TeamId { get; set; }
    public Team? Team { get; set; }
    public Guid? ContractId { get; set; }
    public Contract? Contract { get; set; }
    public Guid? LoanedFromTeamId { get; set; }
    public Team? LoanedFromTeam { get; set; }
    public ICollection<PlayerLanguage> Languages { get; set; } = new List<PlayerLanguage>();
    public ICollection<PlayerAttribute> Attributes { get; set; } = new List<PlayerAttribute>();
    public ICollection<PlayerMatchStats> MatchStats { get; set; } = new List<PlayerMatchStats>();
}

public enum Position
{
    GK, CB, LB, RB, LWB, RWB, CDM, CM, CAM, LM, RM, LW, RW, CF, ST
}

public class PlayerLanguage
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public string LanguageCode { get; set; } = string.Empty;
    public bool IsNative { get; set; }
}

public class PlayerAttribute
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public string AttributeName { get; set; } = string.Empty;
    public int Value { get; set; }
}

public class Contract
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public Guid TeamId { get; set; }
    public Team Team { get; set; } = null!;
    public decimal WeeklyWage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal? ReleaseClause { get; set; }
    public decimal? SigningBonus { get; set; }
    public decimal? GoalBonus { get; set; }
    public decimal? AssistBonus { get; set; }
    public bool CanBeCancelledFree { get; set; }
}

public class Staff
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int Ability { get; set; } = 50;
    public Guid TeamId { get; set; }
    public Team Team { get; set; } = null!;
}

public class LeagueInstance
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? BaseLeagueId { get; set; }
    public League? BaseLeague { get; set; }
    public Guid OwnerId { get; set; }
    public AppUser Owner { get; set; } = null!;
    public bool IsPrivate { get; set; } = true;
    public string? Password { get; set; }
    public int MaxPlayers { get; set; } = 20;
    public int CurrentSeason { get; set; } = 1;
    public DateTime CurrentDate { get; set; }
    public LeagueStatus Status { get; set; } = LeagueStatus.Lobby;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid GovernanceId { get; set; }
    public GovernanceSettings Governance { get; set; } = null!;
    public ICollection<Manager> Managers { get; set; } = new List<Manager>();
    public ICollection<LeagueTeamInstance> Teams { get; set; } = new List<LeagueTeamInstance>();
    public ICollection<Competition> Competitions { get; set; } = new List<Competition>();
    public ICollection<LeagueInvite> Invites { get; set; } = new List<LeagueInvite>();
}

public enum LeagueStatus
{
    Lobby, Active, Paused, Completed
}

public class LeagueTeamInstance
{
    public Guid Id { get; set; }
    public Guid LeagueInstanceId { get; set; }
    public LeagueInstance LeagueInstance { get; set; } = null!;
    public Guid BaseTeamId { get; set; }
    public Team BaseTeam { get; set; } = null!;
    public Guid? ManagerId { get; set; }
    public Manager? Manager { get; set; }
    public bool IsControlledByPlayer { get; set; }
    public int Points { get; set; }
    public int GoalsFor { get; set; }
    public int GoalsAgainst { get; set; }
    public int Wins { get; set; }
    public int Draws { get; set; }
    public int Losses { get; set; }
}

public class LeagueInvite
{
    public Guid Id { get; set; }
    public Guid LeagueInstanceId { get; set; }
    public LeagueInstance LeagueInstance { get; set; } = null!;
    public Guid InvitedUserId { get; set; }
    public AppUser InvitedUser { get; set; } = null!;
    public Guid InvitedByUserId { get; set; }
    public AppUser InvitedByUser { get; set; } = null!;
    public DateTime InvitedAt { get; set; } = DateTime.UtcNow;
    public InviteStatus Status { get; set; } = InviteStatus.Pending;
}

public enum InviteStatus
{
    Pending, Accepted, Declined, Expired
}

public class GovernanceSettings
{
    public Guid Id { get; set; }
    public string PresetName { get; set; } = "Balanced";
    public float CrowdWeight { get; set; } = 0.5f;
    public CurveType CrowdCurve { get; set; } = CurveType.Linear;
    public CombinationMethod CrowdCombination { get; set; } = CombinationMethod.VarianceControl;
    public float LanguageWeight { get; set; } = 0.2f;
    public CurveType LanguageCurve { get; set; } = CurveType.Diminishing;
    public CombinationMethod LanguageCombination { get; set; } = CombinationMethod.AdditiveContribution;
    public float MoraleWeight { get; set; } = 0.8f;
    public CurveType MoraleCurve { get; set; } = CurveType.Threshold;
    public CombinationMethod MoraleCombination { get; set; } = CombinationMethod.ConditionalGate;
    public float SpeechWeight { get; set; } = 0.7f;
    public CurveType SpeechCurve { get; set; } = CurveType.Exponential;
    public CombinationMethod SpeechCombination { get; set; } = CombinationMethod.DirectOverride;
    public float PressureWeight { get; set; } = 0.6f;
    public CurveType PressureCurve { get; set; } = CurveType.Exponential;
    public CombinationMethod PressureCombination { get; set; } = CombinationMethod.VarianceControl;
    public float WeatherWeight { get; set; } = 0.3f;
    public CurveType WeatherCurve { get; set; } = CurveType.Linear;
    public CombinationMethod WeatherCombination { get; set; } = CombinationMethod.AdditiveContribution;
    public float RefereeWeight { get; set; } = 0.4f;
    public CurveType RefereeCurve { get; set; } = CurveType.Threshold;
    public CombinationMethod RefereeCombination { get; set; } = CombinationMethod.ConditionalGate;
    public float ChemistryWeight { get; set; } = 0.5f;
    public CurveType ChemistryCurve { get; set; } = CurveType.Diminishing;
    public CombinationMethod ChemistryCombination { get; set; } = CombinationMethod.AdditiveContribution;
    public float RngChaosWeight { get; set; } = 0.3f;
    public float ExperienceWeight { get; set; } = 0.5f;
    public CurveType ExperienceCurve { get; set; } = CurveType.Diminishing;
    public float FormWeight { get; set; } = 0.6f;
    public CurveType FormCurve { get; set; } = CurveType.Linear;
    public float ManagerReputationWeight { get; set; } = 0.4f;
    public CurveType ManagerReputationCurve { get; set; } = CurveType.Threshold;
    public float ScandalWeight { get; set; } = 0.5f;
    public CurveType ScandalCurve { get; set; } = CurveType.Exponential;
}

public enum CurveType
{
    Linear, Diminishing, Threshold, Exponential, Soft
}

public enum CombinationMethod
{
    DirectOverride, AdditiveContribution, ConditionalGate, VarianceControl
}

public class Competition
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid LeagueInstanceId { get; set; }
    public LeagueInstance LeagueInstance { get; set; } = null!;
    public CompetitionType Type { get; set; }
    public int Season { get; set; }
    public CompetitionStatus Status { get; set; } = CompetitionStatus.Scheduled;
    public ICollection<CompetitionTeam> Teams { get; set; } = new List<CompetitionTeam>();
    public ICollection<Fixture> Fixtures { get; set; } = new List<Fixture>();
}

public enum CompetitionType
{
    League, Cup, GroupAndKnockout
}

public enum CompetitionStatus
{
    Scheduled, InProgress, Completed
}

public class CompetitionTeam
{
    public Guid Id { get; set; }
    public Guid CompetitionId { get; set; }
    public Competition Competition { get; set; } = null!;
    public Guid TeamInstanceId { get; set; }
    public LeagueTeamInstance TeamInstance { get; set; } = null!;
    public string? GroupName { get; set; }
    public int GroupPoints { get; set; }
    public bool IsEliminated { get; set; }
}

public class Fixture
{
    public Guid Id { get; set; }
    public Guid CompetitionId { get; set; }
    public Competition Competition { get; set; } = null!;
    public Guid HomeTeamId { get; set; }
    public LeagueTeamInstance HomeTeam { get; set; } = null!;
    public Guid AwayTeamId { get; set; }
    public LeagueTeamInstance AwayTeam { get; set; } = null!;
    public DateTime ScheduledDate { get; set; }
    public int? MatchDay { get; set; }
    public string? Round { get; set; }
    public FixtureStatus Status { get; set; } = FixtureStatus.Scheduled;
    public Guid? MatchId { get; set; }
    public Match? Match { get; set; }
}

public enum FixtureStatus
{
    Scheduled, InProgress, Completed, Cancelled, Postponed
}

public class Match
{
    public Guid Id { get; set; }
    public Guid FixtureId { get; set; }
    public Fixture Fixture { get; set; } = null!;
    public int HomeScore { get; set; }
    public int AwayScore { get; set; }
    public int CurrentTick { get; set; }
    public int TotalTicks { get; set; } = 5400;
    public MatchStatus Status { get; set; } = MatchStatus.NotStarted;
    public long RngSeed { get; set; }
    public WeatherType Weather { get; set; }
    public int Attendance { get; set; }
    public int HomeHomeSpeechesUsed { get; set; }
    public int AwaySpeechesUsed { get; set; }
    public int HomePausesUsed { get; set; }
    public int AwayPausesUsed { get; set; }
    public bool IsPaused { get; set; }
    public Guid? PausedByManagerId { get; set; }
    public DateTime? PauseStartedAt { get; set; }
    public string? HomeFormation { get; set; }
    public string? AwayFormation { get; set; }
    public string? HomeTactics { get; set; }
    public string? AwayTactics { get; set; }
    public ICollection<MatchEvent> Events { get; set; } = new List<MatchEvent>();
    public ICollection<PlayerMatchStats> PlayerStats { get; set; } = new List<PlayerMatchStats>();
    public ICollection<MatchState> States { get; set; } = new List<MatchState>();
}

public enum MatchStatus
{
    NotStarted, FirstHalf, HalfTime, SecondHalf, ExtraTimeFirst, ExtraTimeSecond, Penalties, Finished, Abandoned
}

public enum WeatherType
{
    Clear, Cloudy, Rainy, Snowy, Foggy, Windy, Hot, Cold
}

public class MatchState
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public Match Match { get; set; } = null!;
    public int Tick { get; set; }
    public float BallX { get; set; }
    public float BallY { get; set; }
    public Guid? BallPossessionPlayerId { get; set; }
    public bool IsHomeTeamPossession { get; set; }
    public float HomeMomentum { get; set; } = 50f;
    public float AwayMomentum { get; set; } = 50f;
    public string PlayerPositionsJson { get; set; } = "{}";
}

public class MatchEvent
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public Match Match { get; set; } = null!;
    public int Tick { get; set; }
    public int Minute => Tick / 60;
    public MatchEventType Type { get; set; }
    public Guid? PrimaryPlayerId { get; set; }
    public Player? PrimaryPlayer { get; set; }
    public Guid? SecondaryPlayerId { get; set; }
    public Player? SecondaryPlayer { get; set; }
    public Guid? TeamId { get; set; }
    public bool IsHomeTeam { get; set; }
    public string? Description { get; set; }
    public bool IsKeyEvent { get; set; }
    public bool IsImportantEvent { get; set; }
    public float? PositionX { get; set; }
    public float? PositionY { get; set; }
}

public enum MatchEventType
{
    KickOff, Goal, OwnGoal, Assist, Shot, ShotOnTarget, ShotBlocked, Save, Pass, KeyPass,
    Tackle, Interception, Foul, YellowCard, RedCard, Injury, Substitution,
    Corner, FreeKick, Penalty, PenaltyMissed, PenaltySaved, Offside,
    HalfTime, FullTime, ExtraTime, PenaltyShootout,
    Speech, TacticalChange, Pause, Resume,
    MomentumShift, PressureBuildup, CounterAttack, SetPiece
}

public class PlayerMatchStats
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public Match Match { get; set; } = null!;
    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public bool IsHomeTeam { get; set; }
    public int MinutesPlayed { get; set; }
    public int Goals { get; set; }
    public int Assists { get; set; }
    public int Shots { get; set; }
    public int ShotsOnTarget { get; set; }
    public int Passes { get; set; }
    public int PassesCompleted { get; set; }
    public int Tackles { get; set; }
    public int TacklesWon { get; set; }
    public int Interceptions { get; set; }
    public int Fouls { get; set; }
    public int FoulsSuffered { get; set; }
    public int YellowCards { get; set; }
    public int RedCards { get; set; }
    public float Rating { get; set; } = 6.0f;
    public int DistanceCovered { get; set; }
    public int Sprints { get; set; }
}

public class TrainingSession
{
    public Guid Id { get; set; }
    public Guid TeamInstanceId { get; set; }
    public LeagueTeamInstance TeamInstance { get; set; } = null!;
    public DateTime Date { get; set; }
    public TrainingType Type { get; set; }
    public int Intensity { get; set; } = 50;
    public string? FocusAttribute { get; set; }
    public ICollection<PlayerTrainingResult> Results { get; set; } = new List<PlayerTrainingResult>();
}

public enum TrainingType
{
    General, Attacking, Defending, Physical, Tactical, SetPiece, Recovery
}

public class PlayerTrainingResult
{
    public Guid Id { get; set; }
    public Guid TrainingSessionId { get; set; }
    public TrainingSession TrainingSession { get; set; } = null!;
    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public int FitnessChange { get; set; }
    public int MoraleChange { get; set; }
    public string? AttributeImproved { get; set; }
    public int AttributeChange { get; set; }
}

public class Transfer
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public Guid FromTeamId { get; set; }
    public Team FromTeam { get; set; } = null!;
    public Guid ToTeamId { get; set; }
    public Team ToTeam { get; set; } = null!;
    public decimal Fee { get; set; }
    public TransferType Type { get; set; }
    public TransferStatus Status { get; set; } = TransferStatus.Pending;
    public DateTime InitiatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public bool IsLoan { get; set; }
    public DateTime? LoanEndDate { get; set; }
    public decimal? LoanFee { get; set; }
    public bool? LoanHasBuyOption { get; set; }
    public decimal? LoanBuyOptionFee { get; set; }
}

public enum TransferType
{
    Permanent, Loan, FreeAgent, Release
}

public enum TransferStatus
{
    Pending, Negotiating, Accepted, Rejected, Completed, Cancelled
}

public class TransferOffer
{
    public Guid Id { get; set; }
    public Guid TransferId { get; set; }
    public Transfer Transfer { get; set; } = null!;
    public decimal OfferedFee { get; set; }
    public decimal? OfferedWage { get; set; }
    public int? OfferedContractYears { get; set; }
    public bool IsCounterOffer { get; set; }
    public DateTime OfferedAt { get; set; } = DateTime.UtcNow;
    public OfferStatus Status { get; set; } = OfferStatus.Pending;
}

public enum OfferStatus
{
    Pending, Accepted, Rejected, Expired, Withdrawn
}

public class YouthAcademy
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public Team Team { get; set; } = null!;
    public int Level { get; set; } = 1;
    public int ScoutingRange { get; set; } = 1;
    public int TrainingQuality { get; set; } = 50;
    public DateTime LastIntakeDate { get; set; }
    public ICollection<YouthPlayer> YouthPlayers { get; set; } = new List<YouthPlayer>();
}

public class YouthPlayer
{
    public Guid Id { get; set; }
    public Guid YouthAcademyId { get; set; }
    public YouthAcademy YouthAcademy { get; set; } = null!;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public Position PrimaryPosition { get; set; }
    public int PotentialMin { get; set; }
    public int PotentialMax { get; set; }
    public int CurrentAbility { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsPromoted { get; set; }
}

public class Friendship
{
    public Guid Id { get; set; }
    public Guid User1Id { get; set; }
    public AppUser User1 { get; set; } = null!;
    public Guid User2Id { get; set; }
    public AppUser User2 { get; set; } = null!;
    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcceptedAt { get; set; }
}

public enum FriendshipStatus
{
    Pending, Accepted, Blocked
}

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum NotificationType
{
    System, MatchResult, Transfer, LeagueInvite, FriendRequest, Achievement, ManagerOffer, SeasonEnd, Injury, Scandal
}

public class PressEvent
{
    public Guid Id { get; set; }
    public Guid? TargetManagerId { get; set; }
    public Manager? TargetManager { get; set; }
    public Guid? TargetPlayerId { get; set; }
    public Player? TargetPlayer { get; set; }
    public Guid? TargetTeamId { get; set; }
    public Team? TargetTeam { get; set; }
    public PressEventType Type { get; set; }
    public string Headline { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int ReputationImpact { get; set; }
    public int MoraleImpact { get; set; }
    public int FanMoodImpact { get; set; }
    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
    public Guid LeagueInstanceId { get; set; }
    public LeagueInstance LeagueInstance { get; set; } = null!;
}

public enum PressEventType
{
    Positive, Negative, Scandal, Rumor, Praise, Criticism, TransferNews, InjuryNews
}

public class Tactic
{
    public Guid Id { get; set; }
    public Guid TeamInstanceId { get; set; }
    public LeagueTeamInstance TeamInstance { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Formation { get; set; } = "4-4-2";
    public int DefensiveLine { get; set; } = 50;
    public int Width { get; set; } = 50;
    public int Tempo { get; set; } = 50;
    public int Pressing { get; set; } = 50;
    public bool CounterAttack { get; set; }
    public bool PlayOutFromBack { get; set; }
    public bool DirectPassing { get; set; }
    public bool HighPress { get; set; }
    public bool ParkTheBus { get; set; }
    public string PlayerInstructionsJson { get; set; } = "{}";
    public string SetPieceRoutinesJson { get; set; } = "{}";
    public bool IsDefault { get; set; }
}

public class InGameInstruction
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public InstructionCategory Category { get; set; }
    public int MinReputationRequired { get; set; }
    public string EffectJson { get; set; } = "{}";
}

public enum InstructionCategory
{
    Attacking, Defending, Mentality, Tempo, Width, Specific
}

public class Speech
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public Match Match { get; set; } = null!;
    public Guid ManagerId { get; set; }
    public Manager Manager { get; set; } = null!;
    public int Tick { get; set; }
    public SpeechType Type { get; set; }
    public SpeechTarget Target { get; set; }
    public Guid? TargetPlayerId { get; set; }
    public Player? TargetPlayer { get; set; }
    public SpeechTone Tone { get; set; }
    public float EffectStrength { get; set; }
    public bool Backfired { get; set; }
    public string? ResultDescription { get; set; }
}

public enum SpeechType
{
    Motivational, Tactical, Calm, Aggressive, Encouragement, Warning
}

public enum SpeechTarget
{
    WholeTeam, SinglePlayer
}

public enum SpeechTone
{
    Calm, Passionate, Aggressive, Supportive, Critical
}

public class InternationalTeam
{
    public Guid Id { get; set; }
    public string CountryCode { get; set; } = string.Empty;
    public Country Country { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public Guid? ManagerId { get; set; }
    public Manager? Manager { get; set; }
    public int FifaRanking { get; set; }
    public ICollection<InternationalCall> CallUps { get; set; } = new List<InternationalCall>();
}

public class InternationalCall
{
    public Guid Id { get; set; }
    public Guid InternationalTeamId { get; set; }
    public InternationalTeam InternationalTeam { get; set; } = null!;
    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public DateTime BreakStartDate { get; set; }
    public DateTime BreakEndDate { get; set; }
    public bool PlayerReturned { get; set; }
    public int? InjuryDays { get; set; }
}

public class InternationalBreak
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public InternationalBreakType Type { get; set; }
}

public enum InternationalBreakType
{
    Friendly, Qualifier, Tournament
}

public class SaveExport
{
    public Guid Id { get; set; }
    public Guid LeagueInstanceId { get; set; }
    public LeagueInstance LeagueInstance { get; set; } = null!;
    public Guid ExportedByUserId { get; set; }
    public AppUser ExportedByUser { get; set; } = null!;
    public DateTime ExportedAt { get; set; } = DateTime.UtcNow;
    public string Version { get; set; } = "1.0";
    public string DataHash { get; set; } = string.Empty;
}