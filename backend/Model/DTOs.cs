namespace IronLeague.DTOs;

public sealed record RegisterDto(string UserName, string Password, string? Email, string? DisplayName);
public sealed record LoginDto(string UserOrEmail, string Password);
public sealed record UpdateProfileDto(string? DisplayName, string? Email);
public sealed record ChangePasswordDto(string CurrentPassword, string NewPassword);

public record ManagerDto(Guid Id, string Name, string Nationality, int Age, int Physical, int Mental, int Technical, int Reputation, decimal PersonalBalance, bool IsRetired, Guid? CurrentTeamId, string? CurrentTeamName, Guid? LeagueInstanceId, List<ManagerLanguageDto> Languages);
public record CreateManagerDto(string Name, string Nationality, bool EarlyBonus);
public record ManagerLanguageDto(string LanguageCode, int Proficiency);
public record ManagerTrophyDto(string TrophyName, string CompetitionName, int Season, DateTime WonAt);

public record CountryDto(string Code, string Name, string Currency, decimal ExchangeRateToEur, string PrimaryLanguage);

public record LeagueDto(Guid Id, string Name, string CountryCode, string CountryName, int Tier, int MaxTeams, int PromotionSpots, int RelegationSpots);
public record CreateLeagueDto(string Name, string CountryCode, int Tier, int MaxTeams, int PromotionSpots, int RelegationSpots, Guid? PromotesToLeagueId, Guid? RelegatesFromLeagueId);

public record TeamDto(Guid Id, string Name, string ShortName, Guid LeagueId, string LeagueName, string PrimaryColor, string SecondaryColor, int StadiumCapacity, string StadiumName, decimal WageBudget, decimal TransferBudget, decimal TotalBalance, int FanLoyalty, int FanMood, Guid? ManagerId, string? ManagerName);
public record TeamDetailDto(Guid Id, string Name, string ShortName, string PrimaryColor, string SecondaryColor, int StadiumCapacity, string StadiumName, decimal WageBudget, decimal TransferBudget, decimal TotalBalance, decimal TicketIncome, decimal SponsorIncome, decimal MerchandiseIncome, decimal TvIncome, int FanLoyalty, int FanMood, List<PlayerSummaryDto> Squad, List<StaffDto> Staff);

public record PlayerDto(Guid Id, string FirstName, string LastName, string FullName, string Nationality, int Age, string PrimaryPosition, string? SecondaryPosition, int Pace, int Shooting, int Passing, int Dribbling, int Defending, int Physical, int Overall, int Potential, int Morale, int Fitness, int Form, decimal MarketValue, bool IsLegend, bool IsSpecialLegend, Guid? TeamId, string? TeamName, List<string> Languages);
public record PlayerSummaryDto(Guid Id, string FullName, string Position, int Overall, int Age, decimal MarketValue, int Morale, int Fitness);
public record PlayerDetailDto(Guid Id, string FirstName, string LastName, string FullName, string Nationality, DateTime DateOfBirth, int Age, string PrimaryPosition, string? SecondaryPosition, int Pace, int Shooting, int Passing, int Dribbling, int Defending, int Physical, int Overall, int Potential, int Morale, int Fitness, int Form, decimal MarketValue, bool IsLegend, bool IsSpecialLegend, Guid? TeamId, string? TeamName, ContractDto? Contract, List<PlayerLanguageDto> Languages, List<PlayerAttributeDto> Attributes);
public record PlayerLanguageDto(string LanguageCode, bool IsNative);
public record PlayerAttributeDto(string AttributeName, int Value);

public record ContractDto(decimal WeeklyWage, DateTime StartDate, DateTime EndDate, decimal? ReleaseClause, decimal? SigningBonus, decimal? GoalBonus, decimal? AssistBonus, bool CanBeCancelledFree);
public record CreateContractDto(Guid PlayerId, Guid TeamId, decimal WeeklyWage, int Years, decimal? ReleaseClause, decimal? SigningBonus, decimal? GoalBonus, decimal? AssistBonus);

public record StaffDto(Guid Id, string Name, string Role, int Ability);

public record LeagueInstanceDto(Guid Id, string Name, string? BaseLeagueName, Guid OwnerId, string OwnerName, bool IsPrivate, int MaxPlayers, int CurrentPlayerCount, int CurrentSeason, DateTime CurrentDate, string Status, GovernanceSettingsDto Governance);
public record CreateLeagueInstanceDto(string Name, Guid? BaseLeagueId, bool IsPrivate, string? Password, int MaxPlayers, GovernanceSettingsDto? Governance);
public record JoinLeagueInstanceDto(Guid LeagueInstanceId, Guid ManagerId, Guid TeamId, string? Password);
public record LeagueInstanceDetailDto(Guid Id, string Name, int CurrentSeason, DateTime CurrentDate, string Status, List<LeagueTeamInstanceDto> Teams, List<CompetitionSummaryDto> Competitions, GovernanceSettingsDto Governance);

public record LeagueTeamInstanceDto(
    Guid Id,
    Guid BaseTeamId,
    string TeamName,
    string TeamColors,
    Guid? ManagerId,
    string? ManagerName,
    bool IsControlledByPlayer,
    int Points,
    int GoalsFor,
    int GoalsAgainst,
    int GoalDifference,
    int Wins,
    int Draws,
    int Losses,
    int Played
);

public record LeagueTeamDto(
    Guid Id,
    Guid BaseTeamId,
    string Name,
    string ShortName,
    string PrimaryColor,
    string SecondaryColor,
    bool IsControlledByPlayer,
    Guid? ManagerId,
    string? ManagerName
);

public record FixtureDto(
    Guid Id,
    Guid CompetitionId,
    string CompetitionName,
    Guid HomeTeamId,
    string HomeTeamName,
    string HomeTeamColors,
    Guid AwayTeamId,
    string AwayTeamName,
    string AwayTeamColors,
    DateTime ScheduledDate,
    int? MatchDay,
    string? Round,
    string Status,
    MatchSummaryDto? Match
);

public record MatchSummaryDto(
    Guid Id,
    int HomeScore,
    int AwayScore,
    string Status
);

public record CompetitionSummaryDto(
    Guid Id,
    string Name,
    string Type,
    string Status
);

public record GovernanceSettingsDto(
    string PresetName,
    float CrowdWeight, string CrowdCurve, string CrowdCombination,
    float LanguageWeight, string LanguageCurve, string LanguageCombination,
    float MoraleWeight, string MoraleCurve, string MoraleCombination,
    float SpeechWeight, string SpeechCurve, string SpeechCombination,
    float PressureWeight, string PressureCurve, string PressureCombination,
    float WeatherWeight, string WeatherCurve, string WeatherCombination,
    float RefereeWeight, string RefereeCurve, string RefereeCombination,
    float ChemistryWeight, string ChemistryCurve, string ChemistryCombination,
    float RngChaosWeight,
    float ExperienceWeight, string ExperienceCurve,
    float FormWeight, string FormCurve,
    float ManagerReputationWeight, string ManagerReputationCurve,
    float ScandalWeight, string ScandalCurve
);

public record CompetitionDto(Guid Id, string Name, Guid LeagueInstanceId, string Type, int Season, string Status, List<CompetitionTeamDto> Teams, List<FixtureSummaryDto> Fixtures);
public record CompetitionTeamDto(Guid Id, string TeamName, string? GroupName, int GroupPoints, bool IsEliminated);

public record FixtureSummaryDto(Guid Id, string HomeTeam, string AwayTeam, DateTime ScheduledDate, string Status, int? HomeScore, int? AwayScore);
public record CreateFixtureDto(Guid CompetitionId, Guid HomeTeamId, Guid AwayTeamId, DateTime ScheduledDate, int? MatchDay, string? Round);

public record MatchDto(Guid Id, Guid FixtureId, int HomeScore, int AwayScore, int CurrentTick, int TotalTicks, string Status, string Weather, int Attendance, MatchTeamDto HomeTeam, MatchTeamDto AwayTeam, List<MatchEventDto> Events);
public record MatchTeamDto(Guid TeamId, string TeamName, string Formation, string Tactics, int SpeechesUsed, int PausesUsed, List<MatchPlayerDto> Players);
public record MatchPlayerDto(Guid PlayerId, string Name, string Position, float X, float Y, bool HasBall);
public record MatchEventDto(Guid Id, int Tick, int Minute, string Type, string? PrimaryPlayerName, string? SecondaryPlayerName, bool IsHomeTeam, string? Description, bool IsKeyEvent, bool IsImportantEvent, float? PositionX, float? PositionY);

public record MatchStateDto(int Tick, float BallX, float BallY, bool IsHomeTeamPossession, float HomeMomentum, float AwayMomentum, Dictionary<Guid, PlayerPositionDto> PlayerPositions);
public record PlayerPositionDto(float X, float Y, bool HasBall);

public record StartMatchDto(Guid FixtureId, string HomeFormation, string HomeTactics, string AwayFormation, string AwayTactics);
public record PauseMatchDto(Guid MatchId);
public record ResumeMatchDto(Guid MatchId);
public record SpeechDto(Guid MatchId, string Type, string Target, Guid? TargetPlayerId, string Tone);
public record TacticalChangeDto(Guid MatchId, string? NewFormation, string? NewTactics, Dictionary<Guid, string>? PlayerInstructions);

public record PlayerMatchStatsDto(Guid PlayerId, string PlayerName, string Position, bool IsHomeTeam, int MinutesPlayed, int Goals, int Assists, int Shots, int ShotsOnTarget, int Passes, int PassesCompleted, float PassAccuracy, int Tackles, int TacklesWon, int Interceptions, int Fouls, int FoulsSuffered, int YellowCards, int RedCards, float Rating);

public record TacticDto(Guid Id, string Name, string Formation, int DefensiveLine, int Width, int Tempo, int Pressing, bool CounterAttack, bool PlayOutFromBack, bool DirectPassing, bool HighPress, bool ParkTheBus, bool IsDefault);
public record CreateTacticDto(string Name, string Formation, int DefensiveLine, int Width, int Tempo, int Pressing, bool CounterAttack, bool PlayOutFromBack, bool DirectPassing, bool HighPress, bool ParkTheBus, Dictionary<Guid, PlayerInstructionDto>? PlayerInstructions);
public record PlayerInstructionDto(string Role, string Duty, List<string> SpecificInstructions);

public record TrainingSessionDto(Guid Id, DateTime Date, string Type, int Intensity, string? FocusAttribute, List<PlayerTrainingResultDto> Results);
public record CreateTrainingSessionDto(string Type, int Intensity, string? FocusAttribute, List<Guid>? ExcludedPlayerIds);
public record PlayerTrainingResultDto(Guid PlayerId, string PlayerName, int FitnessChange, int MoraleChange, string? AttributeImproved, int AttributeChange);

public record TransferDto(Guid Id, Guid PlayerId, string PlayerName, Guid FromTeamId, string FromTeamName, Guid ToTeamId, string ToTeamName, decimal Fee, string Type, string Status, bool IsLoan, DateTime? LoanEndDate, decimal? LoanFee);
public record CreateTransferOfferDto(Guid PlayerId, decimal OfferedFee, decimal? OfferedWage, int? OfferedContractYears, bool IsLoan, DateTime? LoanEndDate, decimal? LoanFee, bool? HasBuyOption, decimal? BuyOptionFee);
public record TransferOfferDto(Guid Id, decimal OfferedFee, decimal? OfferedWage, int? OfferedContractYears, bool IsCounterOffer, DateTime OfferedAt, string Status);
public record RespondToOfferDto(bool Accept, TransferOfferDto? CounterOffer);

public record YouthAcademyDto(Guid Id, int Level, int ScoutingRange, int TrainingQuality, DateTime LastIntakeDate, List<YouthPlayerDto> YouthPlayers);
public record YouthPlayerDto(Guid Id, string FirstName, string LastName, string Nationality, int Age, string PrimaryPosition, int PotentialMin, int PotentialMax, int CurrentAbility);
public record PromoteYouthPlayerDto(Guid YouthPlayerId);

public record FriendshipDto(Guid Id, Guid FriendId, string FriendName, string FriendAvatarId, string Status, DateTime CreatedAt);
public record SendFriendRequestDto(Guid UserId);

public record NotificationDto(Guid Id, string Type, string Title, string Message, string? LinkUrl, bool IsRead, DateTime CreatedAt);

public record LeagueInviteDto(Guid Id, Guid LeagueInstanceId, string LeagueName, Guid InvitedByUserId, string InvitedByName, DateTime InvitedAt, string Status);
public record SendLeagueInviteDto(Guid LeagueInstanceId, Guid UserId);
public record PressEventDto(Guid Id, string Type, string Headline, string Content, int ReputationImpact, int MoraleImpact, int FanMoodImpact, DateTime PublishedAt, string? TargetManagerName, string? TargetPlayerName, string? TargetTeamName);

public record InternationalTeamDto(Guid Id, string CountryCode, string CountryName, string Name, Guid? ManagerId, string? ManagerName, int FifaRanking);
public record InternationalCallDto(Guid Id, Guid PlayerId, string PlayerName, DateTime BreakStartDate, DateTime BreakEndDate, bool PlayerReturned, int? InjuryDays);
public record InternationalBreakDto(Guid Id, string Name, DateTime StartDate, DateTime EndDate, string Type);

public record InGameInstructionDto(Guid Id, string Name, string Description, string Category, int MinReputationRequired);

public record VoteSkipDto(Guid LeagueInstanceId);
public record VoteResult(int VotesNeeded, int VotesCast, bool SkipApproved);

public record SaveExportDto(Guid Id, DateTime ExportedAt, string Version, string DataHash);
public record ImportSaveDto(string JsonData, string ExpectedHash);

public record AdminCreateCountryDto(string Code, string Name, string Currency, decimal ExchangeRateToEur, string PrimaryLanguage);
public record AdminCreateTeamDto(string Name, string ShortName, Guid LeagueId, string PrimaryColor, string SecondaryColor, int StadiumCapacity, string StadiumName, decimal WageBudget, decimal TransferBudget);
public record AdminCreatePlayerDto(string FirstName, string LastName, string Nationality, DateTime DateOfBirth, string PrimaryPosition, string? SecondaryPosition, int Pace, int Shooting, int Passing, int Dribbling, int Defending, int Physical, int Potential, decimal MarketValue, bool IsLegend, bool IsSpecialLegend, Guid? TeamId, List<string> Languages);
public record AdminBulkImportDto(List<AdminCreatePlayerDto> Players);

public record ErrorDto(string Code, string Message, Dictionary<string, string[]>? Errors);
public record PagedResultDto<T>(List<T> Items, int TotalCount, int Page, int PageSize, int TotalPages);