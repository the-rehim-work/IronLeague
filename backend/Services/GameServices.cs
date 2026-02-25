using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using IronLeague.Data;
using IronLeague.DTOs;
using IronLeague.Entities;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace IronLeague.Services;

public interface IManagerService
{
    Task<ManagerDto?> CreateManagerAsync(Guid userId, CreateManagerDto dto);
    Task<ManagerDto?> GetManagerAsync(Guid managerId);
    Task<List<ManagerDto>> GetUserManagersAsync(Guid userId);
}

public class ManagerService : IManagerService
{
    private readonly AppDbContext _db;
    public ManagerService(AppDbContext db) => _db = db;

    public async Task<ManagerDto?> CreateManagerAsync(Guid userId, CreateManagerDto dto)
    {
        var manager = new Manager { Id = Guid.NewGuid(), UserId = userId, Name = dto.Name, Nationality = dto.Nationality, Physical = dto.EarlyBonus ? 60 : 40, Mental = dto.EarlyBonus ? 60 : 40, Technical = dto.EarlyBonus ? 60 : 40, Reputation = 50, PersonalBalance = 50000m };
        var country = await _db.Countries.FindAsync(dto.Nationality);
        if (country != null) manager.Languages.Add(new ManagerLanguage { LanguageCode = country.PrimaryLanguage, Proficiency = 100 });
        _db.Managers.Add(manager);
        await _db.SaveChangesAsync();
        return MapManager(manager);
    }

    public async Task<ManagerDto?> GetManagerAsync(Guid managerId)
    {
        var m = await _db.Managers.Include(m => m.Languages).Include(m => m.CurrentTeam).FirstOrDefaultAsync(m => m.Id == managerId);
        return m == null ? null : MapManager(m);
    }

    public async Task<List<ManagerDto>> GetUserManagersAsync(Guid userId)
    {
        var managers = await _db.Managers.Include(m => m.Languages).Include(m => m.CurrentTeam).Where(m => m.UserId == userId).ToListAsync();
        return managers.Select(MapManager).ToList();
    }

    private static ManagerDto MapManager(Manager m) => new(m.Id, m.Name, m.Nationality, m.Age, m.Physical, m.Mental, m.Technical, m.Reputation, m.PersonalBalance, m.IsRetired, m.CurrentTeamId, m.CurrentTeam?.Name, m.LeagueInstanceId, m.Languages.Select(l => new ManagerLanguageDto(l.LanguageCode, l.Proficiency)).ToList());
}

public interface ILeagueInstanceService
{
    Task<LeagueInstanceDto?> CreateAsync(Guid userId, CreateLeagueInstanceDto dto);
    Task<LeagueInstanceDto?> GetAsync(Guid id);
    Task<List<LeagueInstanceDto>> GetPublicAsync();
    Task<List<LeagueInstanceDto>> GetUserLeaguesAsync(Guid userId);
    Task<bool> JoinAsync(Guid userId, JoinLeagueInstanceDto dto);
    Task<bool> StartAsync(Guid leagueInstanceId, Guid userId);
}

public class LeagueInstanceService : ILeagueInstanceService
{
    private readonly AppDbContext _db;
    private readonly IFixtureService _fixtureService;
    public LeagueInstanceService(AppDbContext db, IFixtureService fixtureService) { _db = db; _fixtureService = fixtureService; }

    public async Task<LeagueInstanceDto?> CreateAsync(Guid userId, CreateLeagueInstanceDto dto)
    {
        var governance = new GovernanceSettings();
        if (dto.Governance != null) ApplyGovernance(governance, dto.Governance);
        _db.GovernanceSettings.Add(governance);

        var instance = new LeagueInstance { Id = Guid.NewGuid(), Name = dto.Name, BaseLeagueId = dto.BaseLeagueId, OwnerId = userId, IsPrivate = dto.IsPrivate, Password = dto.Password, MaxPlayers = dto.MaxPlayers, CurrentDate = new DateTime(2025, 8, 1), GovernanceId = governance.Id, Governance = governance };

        if (dto.BaseLeagueId.HasValue)
        {
            var baseTeams = await _db.Teams.Where(t => t.LeagueId == dto.BaseLeagueId.Value).ToListAsync();
            foreach (var team in baseTeams) instance.Teams.Add(new LeagueTeamInstance { Id = Guid.NewGuid(), LeagueInstanceId = instance.Id, BaseTeamId = team.Id, IsControlledByPlayer = false });
        }

        _db.LeagueInstances.Add(instance);
        await _db.SaveChangesAsync();
        return await GetAsync(instance.Id);
    }

    public async Task<LeagueInstanceDto?> GetAsync(Guid id)
    {
        var li = await _db.LeagueInstances.Include(l => l.Owner).Include(l => l.BaseLeague).Include(l => l.Governance).Include(l => l.Managers).FirstOrDefaultAsync(l => l.Id == id);
        return li == null ? null : MapInstance(li);
    }

    public async Task<List<LeagueInstanceDto>> GetPublicAsync() => (await _db.LeagueInstances.Include(l => l.Owner).Include(l => l.Governance).Include(l => l.Managers).Where(l => !l.IsPrivate && l.Status == LeagueStatus.Lobby).ToListAsync()).Select(MapInstance).ToList();
    public async Task<List<LeagueInstanceDto>> GetUserLeaguesAsync(Guid userId) => (await _db.LeagueInstances.Include(l => l.Owner).Include(l => l.Governance).Include(l => l.Managers).Where(l => l.Managers.Any(m => m.UserId == userId)).ToListAsync()).Select(MapInstance).ToList();

    public async Task<bool> JoinAsync(Guid userId, JoinLeagueInstanceDto dto)
    {
        var instance = await _db.LeagueInstances.Include(l => l.Teams).FirstOrDefaultAsync(l => l.Id == dto.LeagueInstanceId);
        if (instance == null || instance.Status != LeagueStatus.Lobby) return false;
        if (instance.IsPrivate && instance.Password != dto.Password) return false;

        var manager = await _db.Managers.FirstOrDefaultAsync(m => m.Id == dto.ManagerId && m.UserId == userId && m.LeagueInstanceId == null);
        if (manager == null) return false;

        var team = instance.Teams.FirstOrDefault(t => t.BaseTeamId == dto.TeamId && !t.IsControlledByPlayer);
        if (team == null) return false;

        manager.LeagueInstanceId = instance.Id;
        manager.CurrentTeamId = team.BaseTeamId;
        team.ManagerId = manager.Id;
        team.IsControlledByPlayer = true;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> StartAsync(Guid leagueInstanceId, Guid userId)
    {
        var instance = await _db.LeagueInstances.Include(l => l.Teams).FirstOrDefaultAsync(l => l.Id == leagueInstanceId);
        if (instance == null || instance.OwnerId != userId || instance.Status != LeagueStatus.Lobby) return false;
        instance.Status = LeagueStatus.Active;
        var competition = new Competition { Id = Guid.NewGuid(), Name = instance.Name + " League", LeagueInstanceId = instance.Id, Type = CompetitionType.League, Season = instance.CurrentSeason, Status = CompetitionStatus.InProgress };
        foreach (var team in instance.Teams) competition.Teams.Add(new CompetitionTeam { Id = Guid.NewGuid(), CompetitionId = competition.Id, TeamInstanceId = team.Id });
        _db.Competitions.Add(competition);
        await _db.SaveChangesAsync();
        await _fixtureService.GenerateLeagueFixturesAsync(competition.Id);
        return true;
    }

    private void ApplyGovernance(GovernanceSettings g, GovernanceSettingsDto dto) { g.PresetName = dto.PresetName; g.CrowdWeight = dto.CrowdWeight; g.CrowdCurve = Enum.Parse<CurveType>(dto.CrowdCurve); g.LanguageWeight = dto.LanguageWeight; g.MoraleWeight = dto.MoraleWeight; g.SpeechWeight = dto.SpeechWeight; g.PressureWeight = dto.PressureWeight; g.WeatherWeight = dto.WeatherWeight; g.RefereeWeight = dto.RefereeWeight; g.ChemistryWeight = dto.ChemistryWeight; g.RngChaosWeight = dto.RngChaosWeight; }
    private LeagueInstanceDto MapInstance(LeagueInstance li) => new(li.Id, li.Name, li.BaseLeague?.Name, li.OwnerId, li.Owner.DisplayName, li.IsPrivate, li.MaxPlayers, li.Managers.Count, li.CurrentSeason, li.CurrentDate, li.Status.ToString(), MapGovernance(li.Governance));
    private GovernanceSettingsDto MapGovernance(GovernanceSettings g) => new(g.PresetName, g.CrowdWeight, g.CrowdCurve.ToString(), g.CrowdCombination.ToString(), g.LanguageWeight, g.LanguageCurve.ToString(), g.LanguageCombination.ToString(), g.MoraleWeight, g.MoraleCurve.ToString(), g.MoraleCombination.ToString(), g.SpeechWeight, g.SpeechCurve.ToString(), g.SpeechCombination.ToString(), g.PressureWeight, g.PressureCurve.ToString(), g.PressureCombination.ToString(), g.WeatherWeight, g.WeatherCurve.ToString(), g.WeatherCombination.ToString(), g.RefereeWeight, g.RefereeCurve.ToString(), g.RefereeCombination.ToString(), g.ChemistryWeight, g.ChemistryCurve.ToString(), g.ChemistryCombination.ToString(), g.RngChaosWeight, g.ExperienceWeight, g.ExperienceCurve.ToString(), g.FormWeight, g.FormCurve.ToString(), g.ManagerReputationWeight, g.ManagerReputationCurve.ToString(), g.ScandalWeight, g.ScandalCurve.ToString());
}

public interface IFixtureService
{
    Task GenerateLeagueFixturesAsync(Guid competitionId);
    Task<List<FixtureDto>> GetFixturesAsync(Guid competitionId);
    Task<FixtureDto?> GetFixtureAsync(Guid fixtureId);
}

public class FixtureService : IFixtureService
{
    private readonly AppDbContext _db;
    public FixtureService(AppDbContext db) => _db = db;

    public async Task GenerateLeagueFixturesAsync(Guid competitionId)
    {
        var competition = await _db.Competitions.Include(c => c.Teams).Include(c => c.LeagueInstance).FirstOrDefaultAsync(c => c.Id == competitionId);
        if (competition == null) return;
        var teams = competition.Teams.Select(t => t.TeamInstanceId).ToList();
        var n = teams.Count; if (n < 2) return;
        var fixtures = new List<Fixture>();
        var startDate = competition.LeagueInstance.CurrentDate;
        var matchDay = 1;

        for (int round = 0; round < (n - 1) * 2; round++)
        {
            var isSecondHalf = round >= n - 1;
            for (int match = 0; match < n / 2; match++)
            {
                var home = (round + match) % (n - 1); var away = (n - 1 - match + round) % (n - 1);
                if (match == 0) away = n - 1;
                var homeTeam = teams[home]; var awayTeam = teams[away];
                if (isSecondHalf) (homeTeam, awayTeam) = (awayTeam, homeTeam);
                fixtures.Add(new Fixture { Id = Guid.NewGuid(), CompetitionId = competitionId, HomeTeamId = homeTeam, AwayTeamId = awayTeam, ScheduledDate = startDate.AddDays(round * 7), MatchDay = matchDay, Status = FixtureStatus.Scheduled });
            }
            matchDay++;
        }
        _db.Fixtures.AddRange(fixtures);
        await _db.SaveChangesAsync();
    }

    public async Task<List<FixtureDto>> GetFixturesAsync(Guid competitionId) => (await _db.Fixtures.Include(f => f.Competition).Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam).Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam).Include(f => f.Match).Where(f => f.CompetitionId == competitionId).OrderBy(f => f.ScheduledDate).ToListAsync()).Select(MapFixture).ToList();
    public async Task<FixtureDto?> GetFixtureAsync(Guid fixtureId) { var f = await _db.Fixtures.Include(f => f.Competition).Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam).Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam).Include(f => f.Match).FirstOrDefaultAsync(f => f.Id == fixtureId); return f == null ? null : MapFixture(f); }
    private FixtureDto MapFixture(Fixture f) => new(f.Id, f.CompetitionId, f.Competition.Name, f.HomeTeamId, f.HomeTeam.BaseTeam.Name, f.HomeTeam.BaseTeam.PrimaryColor, f.AwayTeamId, f.AwayTeam.BaseTeam.Name, f.AwayTeam.BaseTeam.PrimaryColor, f.ScheduledDate, f.MatchDay, f.Round, f.Status.ToString(), f.Match == null ? null : new MatchSummaryDto(f.Match.Id, f.Match.HomeScore, f.Match.AwayScore, f.Match.Status.ToString()));
}

public interface IMatchService
{
    Task<MatchDto?> GetMatchAsync(Guid matchId);
    Task<MatchDto?> StartMatchAsync(StartMatchDto dto);
    Task<bool> PauseMatchAsync(Guid matchId, Guid managerId);
    Task<bool> ResumeMatchAsync(Guid matchId, Guid managerId);
    Task<Speech?> GiveSpeechAsync(SpeechDto dto, Guid managerId);
}

public class MatchService : IMatchService
{
    private readonly AppDbContext _db;
    private readonly IMatchEngine _engine;
    public MatchService(AppDbContext db, IMatchEngine engine) { _db = db; _engine = engine; }

    public async Task<MatchDto?> GetMatchAsync(Guid matchId)
    {
        var match = await _db.Matches.Include(m => m.Fixture).ThenInclude(f => f.HomeTeam).ThenInclude(t => t.BaseTeam).Include(m => m.Fixture).ThenInclude(f => f.AwayTeam).ThenInclude(t => t.BaseTeam).Include(m => m.Events).Include(m => m.States.OrderByDescending(s => s.Tick).Take(1)).FirstOrDefaultAsync(m => m.Id == matchId);
        return match == null ? null : MapMatch(match);
    }

    public async Task<MatchDto?> StartMatchAsync(StartMatchDto dto)
    {
        var fixture = await _db.Fixtures
            .Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam)
            .FirstOrDefaultAsync(f => f.Id == dto.FixtureId);

        if (fixture == null) return null;

        if (fixture.MatchId.HasValue)
        {
            var existingMatch = await _db.Matches.FindAsync(fixture.MatchId);
            if (existingMatch != null)
                return MapToDto(existingMatch, fixture);
        }

        var match = new Match
        {
            Id = Guid.NewGuid(),
            FixtureId = fixture.Id,
            HomeScore = 0,
            AwayScore = 0,
            Status = MatchStatus.InProgress,
            CurrentTick = 0,
            TotalTicks = 5400,
            Weather = (WeatherType)new Random().Next(0, 8),
            Attendance = (int)(fixture.HomeTeam.BaseTeam.StadiumCapacity * (0.7 + new Random().NextDouble() * 0.3)),
            HomeFormation = dto.HomeFormation ?? "4-4-2",
            AwayFormation = dto.AwayFormation ?? "4-4-2"
        };

        _db.Matches.Add(match);
        fixture.MatchId = match.Id;
        fixture.Match = match;
        fixture.Status = FixtureStatus.InProgress;

        await _db.SaveChangesAsync();

        return MapToDto(match, fixture);
    }

    private MatchDto? MapToDto(Match match, Fixture fixture)
    {
        if (match == null)
            return null;

        return new MatchDto(match.Id, fixture.Id, match.HomeScore, match.AwayScore, match.CurrentTick, match.TotalTicks, match.Status.ToString(),
            match.Weather.ToString(), match.Attendance,
            new MatchTeamDto(fixture.HomeTeam.Id, fixture.HomeTeam.BaseTeam.Name, match.HomeFormation ?? "4-4-2", match.HomeTactics ?? "", match.HomeSpeechesUsed, match.HomePausesUsed, new List<MatchPlayerDto>()),
            new MatchTeamDto(fixture.AwayTeam.Id, fixture.AwayTeam.BaseTeam.Name, match.AwayFormation ?? "4-4-2", match.AwayTactics ?? "", match.AwaySpeechesUsed, match.AwayPausesUsed, new List<MatchPlayerDto>()),
            match.Events.Select(e => new MatchEventDto(e.Id, e.Tick, e.Minute, e.Type.ToString(), e.PrimaryPlayer?.LastName, e.SecondaryPlayer?.LastName, e.IsHomeTeam, e.Description, e.IsKeyEvent, e.IsImportantEvent, e.PositionX, e.PositionY)).ToList());
    }

    public async Task<bool> PauseMatchAsync(Guid matchId, Guid managerId)
    {
        var match = await _db.Matches.FindAsync(matchId);
        if (match == null || match.IsPaused) return false;
        match.IsPaused = true; match.PausedByManagerId = managerId; match.PauseStartedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResumeMatchAsync(Guid matchId, Guid managerId)
    {
        var match = await _db.Matches.FindAsync(matchId);
        if (match == null || !match.IsPaused || match.PausedByManagerId != managerId) return false;
        match.IsPaused = false; match.PausedByManagerId = null; match.PauseStartedAt = null;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<Speech?> GiveSpeechAsync(SpeechDto dto, Guid managerId)
    {
        var match = await _db.Matches.
            Include(m => m.Fixture).
            ThenInclude(f => f.HomeTeam).
            Include(m => m.Fixture).
            ThenInclude(f => f.Competition).
            ThenInclude(c => c.LeagueInstance).
            ThenInclude(l => l.Governance).
            FirstOrDefaultAsync(m => m.Id == dto.MatchId);
        if (match == null) return null;
        var manager = await _db.Managers.FindAsync(managerId);
        if (manager == null) return null;
        var isHome = match.Fixture.HomeTeam.ManagerId == managerId;
        var speechesUsed = isHome ? match.HomeSpeechesUsed : match.AwaySpeechesUsed;
        if (speechesUsed >= 3) return null;

        var speech = new Speech { Id = Guid.NewGuid(), MatchId = match.Id, ManagerId = managerId, Manager = manager, Tick = match.CurrentTick, Type = Enum.Parse<SpeechType>(dto.Type), Target = Enum.Parse<SpeechTarget>(dto.Target), TargetPlayerId = dto.TargetPlayerId, Tone = Enum.Parse<SpeechTone>(dto.Tone) };
        await _engine.ApplySpeechAsync(match, speech, match.Fixture.Competition.LeagueInstance.Governance);
        if (isHome) match.HomeSpeechesUsed++; else match.AwaySpeechesUsed++;
        await _db.SaveChangesAsync();
        return speech;
    }

    private MatchDto MapMatch(Match m)
    {
        var state = m.States.FirstOrDefault();
        return new MatchDto(m.Id, m.FixtureId, m.HomeScore, m.AwayScore, m.CurrentTick, m.TotalTicks, m.Status.ToString(), m.Weather.ToString(), m.Attendance,
            new MatchTeamDto(m.Fixture.HomeTeamId, m.Fixture.HomeTeam.BaseTeam.Name, m.HomeFormation ?? "4-4-2", m.HomeTactics ?? "", m.HomeSpeechesUsed, m.HomePausesUsed, new List<MatchPlayerDto>()),
            new MatchTeamDto(m.Fixture.AwayTeamId, m.Fixture.AwayTeam.BaseTeam.Name, m.AwayFormation ?? "4-4-2", m.AwayTactics ?? "", m.AwaySpeechesUsed, m.AwayPausesUsed, new List<MatchPlayerDto>()),
            m.Events.Select(e => new MatchEventDto(e.Id, e.Tick, e.Minute, e.Type.ToString(), e.PrimaryPlayer?.LastName, e.SecondaryPlayer?.LastName, e.IsHomeTeam, e.Description, e.IsKeyEvent, e.IsImportantEvent, e.PositionX, e.PositionY)).ToList());
    }
}

public interface INotificationService
{
    Task CreateAsync(Guid userId, NotificationType type, string title, string message, string? linkUrl = null);
    Task<List<NotificationDto>> GetUnreadAsync(Guid userId);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    public NotificationService(AppDbContext db) => _db = db;

    public async Task CreateAsync(Guid userId, NotificationType type, string title, string message, string? linkUrl = null) { _db.Notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = userId, Type = type, Title = title, Message = message, LinkUrl = linkUrl }); await _db.SaveChangesAsync(); }
    public async Task<List<NotificationDto>> GetUnreadAsync(Guid userId) => (await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync()).Select(n => new NotificationDto(n.Id, n.Type.ToString(), n.Title, n.Message, n.LinkUrl, n.IsRead, n.CreatedAt)).ToList();
    public async Task MarkAsReadAsync(Guid notificationId) { var n = await _db.Notifications.FindAsync(notificationId); if (n != null) { n.IsRead = true; await _db.SaveChangesAsync(); } }
    public async Task MarkAllAsReadAsync(Guid userId) => await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
}

public interface ITransferService
{
    Task<TransferDto?> CreateOfferAsync(Guid fromManagerId, CreateTransferOfferDto dto);
    Task<List<PlayerDto>> GetFreeAgentsAsync();
}

public class TransferService : ITransferService


{
    private readonly AppDbContext _db;
    public TransferService(AppDbContext db) => _db = db;

    public async Task<TransferDto?> CreateOfferAsync(Guid fromManagerId, CreateTransferOfferDto dto)
    {
        var player = await _db.Players.Include(p => p.Team).FirstOrDefaultAsync(p => p.Id == dto.PlayerId);
        if (player?.TeamId == null) return null;
        var manager = await _db.Managers.FirstOrDefaultAsync(m => m.Id == fromManagerId);
        if (manager?.CurrentTeamId == null) return null;

        var transfer = new Transfer { Id = Guid.NewGuid(), PlayerId = player.Id, FromTeamId = player.TeamId.Value, ToTeamId = manager.CurrentTeamId.Value, Type = dto.IsLoan ? TransferType.Loan : TransferType.Permanent, IsLoan = dto.IsLoan, LoanEndDate = dto.LoanEndDate, LoanFee = dto.LoanFee, Status = TransferStatus.Pending };
        var offer = new TransferOffer { Id = Guid.NewGuid(), TransferId = transfer.Id, OfferedFee = dto.OfferedFee, OfferedWage = dto.OfferedWage, OfferedContractYears = dto.OfferedContractYears, Status = OfferStatus.Pending };

        _db.Transfers.Add(transfer);
        _db.TransferOffers.Add(offer);
        await _db.SaveChangesAsync();
        return new TransferDto(transfer.Id, player.Id, $"{player.FirstName} {player.LastName}", transfer.FromTeamId, player.Team!.Name, transfer.ToTeamId, "", dto.OfferedFee, transfer.Type.ToString(), transfer.Status.ToString(), transfer.IsLoan, transfer.LoanEndDate, transfer.LoanFee);
    }

    public async Task<List<PlayerDto>> GetFreeAgentsAsync() => (await _db.Players.Include(p => p.Languages).Where(p => p.TeamId == null && !p.IsLegend).Take(100).ToListAsync()).Select(p => new PlayerDto(p.Id, p.FirstName, p.LastName, $"{p.FirstName} {p.LastName}", p.Nationality, p.Age, p.PrimaryPosition.ToString(), p.SecondaryPosition?.ToString(), p.Pace, p.Shooting, p.Passing, p.Dribbling, p.Defending, p.Physical, (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6, p.Potential, p.Morale, p.Fitness, p.Form, p.MarketValue, p.IsLegend, p.IsSpecialLegend, p.TeamId, null, p.Languages.Select(l => l.LanguageCode).ToList())).ToList();
}

public interface ITeamService
{
    Task<TeamDto?> GetTeamAsync(Guid teamId);
    Task<TeamDetailDto?> GetTeamDetailAsync(Guid teamId);
    Task<List<TeamDto>> GetTeamsByLeagueAsync(Guid leagueId);
    Task<List<PlayerSummaryDto>> GetSquadAsync(Guid teamId);
    Task<bool> UpdateBudgetsAsync(Guid teamId, decimal wageBudget, decimal transferBudget);
}

public class TeamService : ITeamService
{
    private readonly AppDbContext _db;

    public TeamService(AppDbContext db) => _db = db;

    public async Task<TeamDto?> GetTeamAsync(Guid teamId)
    {
        var t = await _db.Teams
            .Include(t => t.League)
            .Include(t => t.Manager)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        return t == null ? null : new TeamDto(
            t.Id, t.Name, t.ShortName, t.LeagueId, t.League.Name,
            t.PrimaryColor, t.SecondaryColor, t.StadiumCapacity, t.StadiumName,
            t.WageBudget, t.TransferBudget, t.TotalBalance,
            t.FanLoyalty, t.FanMood, t.ManagerId, t.Manager?.Name
        );
    }

    public async Task<TeamDetailDto?> GetTeamDetailAsync(Guid teamId)
    {
        var t = await _db.Teams
            .Include(t => t.Players)
            .Include(t => t.Staff)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (t == null) return null;

        var squad = t.Players.Select(p => new PlayerSummaryDto(
            p.Id,
            $"{p.FirstName} {p.LastName}",
            p.PrimaryPosition.ToString(),
            (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6,
            p.Age,
            p.MarketValue,
            p.Morale,
            p.Fitness
        )).ToList();

        var staff = t.Staff.Select(s => new StaffDto(s.Id, s.Name, s.Role, s.Ability)).ToList();

        return new TeamDetailDto(
            t.Id, t.Name, t.ShortName, t.PrimaryColor, t.SecondaryColor,
            t.StadiumCapacity, t.StadiumName, t.WageBudget, t.TransferBudget, t.TotalBalance,
            t.TicketIncome, t.SponsorIncome, t.MerchandiseIncome, t.TvIncome,
            t.FanLoyalty, t.FanMood, squad, staff
        );
    }

    public async Task<List<TeamDto>> GetTeamsByLeagueAsync(Guid leagueId)
    {
        return await _db.Teams
            .Include(t => t.League)
            .Include(t => t.Manager)
            .Where(t => t.LeagueId == leagueId)
            .Select(t => new TeamDto(
                t.Id, t.Name, t.ShortName, t.LeagueId, t.League.Name,
                t.PrimaryColor, t.SecondaryColor, t.StadiumCapacity, t.StadiumName,
                t.WageBudget, t.TransferBudget, t.TotalBalance,
                t.FanLoyalty, t.FanMood, t.ManagerId, t.Manager != null ? t.Manager.Name : null
            ))
            .ToListAsync();
    }

    public async Task<List<PlayerSummaryDto>> GetSquadAsync(Guid teamId)
    {
        return await _db.Players
            .Where(p => p.TeamId == teamId)
            .Select(p => new PlayerSummaryDto(
                p.Id,
                p.FirstName + " " + p.LastName,
                p.PrimaryPosition.ToString(),
                (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6,
                p.Age,
                p.MarketValue,
                p.Morale,
                p.Fitness
            ))
            .ToListAsync();
    }

    public async Task<bool> UpdateBudgetsAsync(Guid teamId, decimal wageBudget, decimal transferBudget)
    {
        var team = await _db.Teams.FindAsync(teamId);
        if (team == null) return false;

        team.WageBudget = wageBudget;
        team.TransferBudget = transferBudget;
        team.TotalBalance = wageBudget + transferBudget;
        await _db.SaveChangesAsync();
        return true;
    }
}

public interface IPlayerService
{
    Task<PlayerDto?> GetPlayerAsync(Guid playerId);
    Task<PlayerDetailDto?> GetPlayerDetailAsync(Guid playerId);
    Task<List<PlayerDto>> SearchPlayersAsync(string? name, string? position, int? minOverall, int? maxAge, decimal? maxValue, int limit = 50);
    Task<bool> UpdateMoraleAsync(Guid playerId, int change);
    Task<bool> UpdateFitnessAsync(Guid playerId, int change);
    Task<bool> UpdateFormAsync(Guid playerId, int change);
}

public class PlayerService : IPlayerService
{
    private readonly AppDbContext _db;

    public PlayerService(AppDbContext db) => _db = db;

    public async Task<PlayerDto?> GetPlayerAsync(Guid playerId)
    {
        var p = await _db.Players
            .Include(p => p.Team)
            .Include(p => p.Languages)
            .FirstOrDefaultAsync(p => p.Id == playerId);

        if (p == null) return null;

        return new PlayerDto(
            p.Id, p.FirstName, p.LastName, $"{p.FirstName} {p.LastName}",
            p.Nationality, p.Age, p.PrimaryPosition.ToString(), p.SecondaryPosition?.ToString(),
            p.Pace, p.Shooting, p.Passing, p.Dribbling, p.Defending, p.Physical,
            (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6,
            p.Potential, p.Morale, p.Fitness, p.Form, p.MarketValue,
            p.IsLegend, p.IsSpecialLegend, p.TeamId, p.Team?.Name,
            p.Languages.Select(l => l.LanguageCode).ToList()
        );
    }

    public async Task<PlayerDetailDto?> GetPlayerDetailAsync(Guid playerId)
    {
        var p = await _db.Players
            .Include(p => p.Team)
            .Include(p => p.Contract)
            .Include(p => p.Languages)
            .Include(p => p.Attributes)
            .FirstOrDefaultAsync(p => p.Id == playerId);

        if (p == null) return null;

        var contract = p.Contract == null ? null : new ContractDto(
            p.Contract.WeeklyWage, p.Contract.StartDate, p.Contract.EndDate,
            p.Contract.ReleaseClause, p.Contract.SigningBonus,
            p.Contract.GoalBonus, p.Contract.AssistBonus, p.Contract.CanBeCancelledFree
        );

        return new PlayerDetailDto(
            p.Id, p.FirstName, p.LastName, $"{p.FirstName} {p.LastName}",
            p.Nationality, p.DateOfBirth, p.Age,
            p.PrimaryPosition.ToString(), p.SecondaryPosition?.ToString(),
            p.Pace, p.Shooting, p.Passing, p.Dribbling, p.Defending, p.Physical,
            (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6,
            p.Potential, p.Morale, p.Fitness, p.Form, p.MarketValue,
            p.IsLegend, p.IsSpecialLegend, p.TeamId, p.Team?.Name,
            contract,
            p.Languages.Select(l => new PlayerLanguageDto(l.LanguageCode, l.IsNative)).ToList(),
            p.Attributes.Select(a => new PlayerAttributeDto(a.AttributeName, a.Value)).ToList()
        );
    }

    public async Task<List<PlayerDto>> SearchPlayersAsync(string? name, string? position, int? minOverall, int? maxAge, decimal? maxValue, int limit = 50)
    {
        var query = _db.Players.Include(p => p.Team).Include(p => p.Languages).AsQueryable();

        if (!string.IsNullOrEmpty(name))
            query = query.Where(p => (p.FirstName + " " + p.LastName).Contains(name));

        if (!string.IsNullOrEmpty(position) && Enum.TryParse<Position>(position, out var pos))
            query = query.Where(p => p.PrimaryPosition == pos || p.SecondaryPosition == pos);

        if (maxAge.HasValue)
            query = query.Where(p => p.DateOfBirth >= DateTime.UtcNow.AddYears(-maxAge.Value));

        if (maxValue.HasValue)
            query = query.Where(p => p.MarketValue <= maxValue.Value);

        var players = await query.Take(limit).ToListAsync();

        if (minOverall.HasValue)
            players = players.Where(p => (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6 >= minOverall.Value).ToList();

        return players.Select(p => new PlayerDto(
            p.Id, p.FirstName, p.LastName, $"{p.FirstName} {p.LastName}",
            p.Nationality, p.Age, p.PrimaryPosition.ToString(), p.SecondaryPosition?.ToString(),
            p.Pace, p.Shooting, p.Passing, p.Dribbling, p.Defending, p.Physical,
            (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6,
            p.Potential, p.Morale, p.Fitness, p.Form, p.MarketValue,
            p.IsLegend, p.IsSpecialLegend, p.TeamId, p.Team?.Name,
            p.Languages.Select(l => l.LanguageCode).ToList()
        )).ToList();
    }

    public async Task<bool> UpdateMoraleAsync(Guid playerId, int change)
    {
        var player = await _db.Players.FindAsync(playerId);
        if (player == null) return false;
        player.Morale = Math.Clamp(player.Morale + change, 0, 100);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateFitnessAsync(Guid playerId, int change)
    {
        var player = await _db.Players.FindAsync(playerId);
        if (player == null) return false;
        player.Fitness = Math.Clamp(player.Fitness + change, 0, 100);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateFormAsync(Guid playerId, int change)
    {
        var player = await _db.Players.FindAsync(playerId);
        if (player == null) return false;
        player.Form = Math.Clamp(player.Form + change, 0, 100);
        await _db.SaveChangesAsync();
        return true;
    }
}

public interface ICompetitionService
{
    Task<CompetitionDto?> GetCompetitionAsync(Guid competitionId);
    Task<List<CompetitionSummaryDto>> GetLeagueCompetitionsAsync(Guid leagueInstanceId);
    Task<List<LeagueTeamInstanceDto>> GetStandingsAsync(Guid competitionId);
    Task<CompetitionDto?> CreateCupAsync(Guid leagueInstanceId, string name, List<Guid> teamInstanceIds);
    Task UpdateStandingsAfterMatchAsync(Guid fixtureId, int homeScore, int awayScore);
}

public class CompetitionService : ICompetitionService
{
    private readonly AppDbContext _db;

    public CompetitionService(AppDbContext db) => _db = db;

    public async Task<CompetitionDto?> GetCompetitionAsync(Guid competitionId)
    {
        var c = await _db.Competitions
            .Include(c => c.Teams).ThenInclude(t => t.TeamInstance).ThenInclude(ti => ti.BaseTeam)
            .Include(c => c.Fixtures).ThenInclude(f => f.HomeTeam).ThenInclude(t => t.BaseTeam)
            .Include(c => c.Fixtures).ThenInclude(f => f.AwayTeam).ThenInclude(t => t.BaseTeam)
            .Include(c => c.Fixtures).ThenInclude(f => f.Match)
            .FirstOrDefaultAsync(c => c.Id == competitionId);

        if (c == null) return null;

        var teams = c.Teams.Select(t => new CompetitionTeamDto(
            t.Id, t.TeamInstance.BaseTeam.Name, t.GroupName, t.GroupPoints, t.IsEliminated
        )).ToList();

        var fixtures = c.Fixtures.Select(f => new FixtureSummaryDto(
            f.Id, f.HomeTeam.BaseTeam.Name, f.AwayTeam.BaseTeam.Name,
            f.ScheduledDate, f.Status.ToString(),
            f.Match?.HomeScore, f.Match?.AwayScore
        )).ToList();

        return new CompetitionDto(c.Id, c.Name, c.LeagueInstanceId, c.Type.ToString(), c.Season, c.Status.ToString(), teams, fixtures);
    }

    public async Task<List<CompetitionSummaryDto>> GetLeagueCompetitionsAsync(Guid leagueInstanceId)
    {
        return await _db.Competitions
            .Where(c => c.LeagueInstanceId == leagueInstanceId)
            .Select(c => new CompetitionSummaryDto(c.Id, c.Name, c.Type.ToString(), c.Status.ToString()))
            .ToListAsync();
    }

    public async Task<List<LeagueTeamInstanceDto>> GetStandingsAsync(Guid competitionId)
    {
        var competition = await _db.Competitions
            .Include(c => c.Teams).ThenInclude(t => t.TeamInstance).ThenInclude(ti => ti.BaseTeam)
            .Include(c => c.Teams).ThenInclude(t => t.TeamInstance).ThenInclude(ti => ti.Manager)
            .FirstOrDefaultAsync(c => c.Id == competitionId);

        if (competition == null) return new List<LeagueTeamInstanceDto>();

        return competition.Teams
            .Select(t => t.TeamInstance)
            .OrderByDescending(t => t.Points)
            .ThenByDescending(t => t.GoalsFor - t.GoalsAgainst)
            .ThenByDescending(t => t.GoalsFor)
            .Select(t => new LeagueTeamInstanceDto(
                t.Id, t.BaseTeamId, t.BaseTeam.Name,
                t.BaseTeam.PrimaryColor, t.ManagerId, t.Manager?.Name,
                t.IsControlledByPlayer, t.Points, t.GoalsFor, t.GoalsAgainst,
                t.GoalsFor - t.GoalsAgainst, t.Wins, t.Draws, t.Losses,
                t.Wins + t.Draws + t.Losses
            ))
            .ToList();
    }

    public async Task<CompetitionDto?> CreateCupAsync(Guid leagueInstanceId, string name, List<Guid> teamInstanceIds)
    {
        var competition = new Competition
        {
            Id = Guid.NewGuid(),
            Name = name,
            LeagueInstanceId = leagueInstanceId,
            Type = CompetitionType.Cup,
            Season = 1,
            Status = CompetitionStatus.Scheduled
        };

        foreach (var teamId in teamInstanceIds)
        {
            competition.Teams.Add(new CompetitionTeam
            {
                Id = Guid.NewGuid(),
                CompetitionId = competition.Id,
                TeamInstanceId = teamId
            });
        }

        _db.Competitions.Add(competition);
        await _db.SaveChangesAsync();

        return await GetCompetitionAsync(competition.Id);
    }

    public async Task UpdateStandingsAfterMatchAsync(Guid fixtureId, int homeScore, int awayScore)
    {
        var fixture = await _db.Fixtures
            .Include(f => f.HomeTeam)
            .Include(f => f.AwayTeam)
            .FirstOrDefaultAsync(f => f.Id == fixtureId);

        if (fixture == null) return;

        var home = fixture.HomeTeam;
        var away = fixture.AwayTeam;

        home.GoalsFor += homeScore;
        home.GoalsAgainst += awayScore;
        away.GoalsFor += awayScore;
        away.GoalsAgainst += homeScore;

        if (homeScore > awayScore)
        {
            home.Wins++;
            home.Points += 3;
            away.Losses++;
        }
        else if (homeScore < awayScore)
        {
            away.Wins++;
            away.Points += 3;
            home.Losses++;
        }
        else
        {
            home.Draws++;
            away.Draws++;
            home.Points++;
            away.Points++;
        }

        await _db.SaveChangesAsync();
    }
}

public interface ITacticService
{
    Task<TacticDto?> GetTacticAsync(Guid tacticId);
    Task<List<TacticDto>> GetTeamTacticsAsync(Guid teamInstanceId);
    Task<TacticDto?> CreateTacticAsync(Guid teamInstanceId, CreateTacticDto dto);
    Task<TacticDto?> UpdateTacticAsync(Guid tacticId, CreateTacticDto dto);
    Task<bool> DeleteTacticAsync(Guid tacticId);
    Task<bool> SetDefaultTacticAsync(Guid teamInstanceId, Guid tacticId);
}

public class TacticService : ITacticService
{
    private readonly AppDbContext _db;

    public TacticService(AppDbContext db) => _db = db;

    public async Task<TacticDto?> GetTacticAsync(Guid tacticId)
    {
        var t = await _db.Set<Tactic>().FindAsync(tacticId);
        return t == null ? null : MapTactic(t);
    }

    public async Task<List<TacticDto>> GetTeamTacticsAsync(Guid teamInstanceId)
    {
        return await _db.Set<Tactic>()
            .Where(t => t.TeamInstanceId == teamInstanceId)
            .Select(t => MapTactic(t))
            .ToListAsync();
    }

    public async Task<TacticDto?> CreateTacticAsync(Guid teamInstanceId, CreateTacticDto dto)
    {
        var tactic = new Tactic
        {
            Id = Guid.NewGuid(),
            TeamInstanceId = teamInstanceId,
            Name = dto.Name,
            Formation = dto.Formation,
            DefensiveLine = dto.DefensiveLine,
            Width = dto.Width,
            Tempo = dto.Tempo,
            Pressing = dto.Pressing,
            CounterAttack = dto.CounterAttack,
            PlayOutFromBack = dto.PlayOutFromBack,
            DirectPassing = dto.DirectPassing,
            HighPress = dto.HighPress,
            ParkTheBus = dto.ParkTheBus,
            PlayerInstructionsJson = dto.PlayerInstructions != null
                ? JsonSerializer.Serialize(dto.PlayerInstructions)
                : "{}"
        };

        _db.Set<Tactic>().Add(tactic);
        await _db.SaveChangesAsync();
        return MapTactic(tactic);
    }

    public async Task<TacticDto?> UpdateTacticAsync(Guid tacticId, CreateTacticDto dto)
    {
        var tactic = await _db.Set<Tactic>().FindAsync(tacticId);
        if (tactic == null) return null;

        tactic.Name = dto.Name;
        tactic.Formation = dto.Formation;
        tactic.DefensiveLine = dto.DefensiveLine;
        tactic.Width = dto.Width;
        tactic.Tempo = dto.Tempo;
        tactic.Pressing = dto.Pressing;
        tactic.CounterAttack = dto.CounterAttack;
        tactic.PlayOutFromBack = dto.PlayOutFromBack;
        tactic.DirectPassing = dto.DirectPassing;
        tactic.HighPress = dto.HighPress;
        tactic.ParkTheBus = dto.ParkTheBus;
        tactic.PlayerInstructionsJson = dto.PlayerInstructions != null
            ? JsonSerializer.Serialize(dto.PlayerInstructions)
            : "{}";

        await _db.SaveChangesAsync();
        return MapTactic(tactic);
    }

    public async Task<bool> DeleteTacticAsync(Guid tacticId)
    {
        var tactic = await _db.Set<Tactic>().FindAsync(tacticId);
        if (tactic == null || tactic.IsDefault) return false;

        _db.Set<Tactic>().Remove(tactic);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetDefaultTacticAsync(Guid teamInstanceId, Guid tacticId)
    {
        var tactics = await _db.Set<Tactic>().Where(t => t.TeamInstanceId == teamInstanceId).ToListAsync();
        foreach (var t in tactics)
        {
            t.IsDefault = t.Id == tacticId;
        }
        await _db.SaveChangesAsync();
        return true;
    }

    private static TacticDto MapTactic(Tactic t) => new(
        t.Id, t.Name, t.Formation, t.DefensiveLine, t.Width, t.Tempo, t.Pressing,
        t.CounterAttack, t.PlayOutFromBack, t.DirectPassing, t.HighPress, t.ParkTheBus, t.IsDefault
    );
}

public interface ITrainingService
{
    Task<TrainingSessionDto?> GetSessionAsync(Guid sessionId);
    Task<List<TrainingSessionDto>> GetTeamSessionsAsync(Guid teamInstanceId, int limit = 10);
    Task<TrainingSessionDto?> CreateSessionAsync(Guid teamInstanceId, CreateTrainingSessionDto dto);
    Task ProcessTrainingAsync(Guid sessionId);
}

public class TrainingService : ITrainingService
{
    private readonly AppDbContext _db;
    private readonly Random _rng = new();

    public TrainingService(AppDbContext db) => _db = db;

    public async Task<TrainingSessionDto?> GetSessionAsync(Guid sessionId)
    {
        var s = await _db.Set<TrainingSession>()
            .Include(s => s.Results).ThenInclude(r => r.Player)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        return s == null ? null : MapSession(s);
    }

    public async Task<List<TrainingSessionDto>> GetTeamSessionsAsync(Guid teamInstanceId, int limit = 10)
    {
        return await _db.Set<TrainingSession>()
            .Include(s => s.Results).ThenInclude(r => r.Player)
            .Where(s => s.TeamInstanceId == teamInstanceId)
            .OrderByDescending(s => s.Date)
            .Take(limit)
            .Select(s => MapSession(s))
            .ToListAsync();
    }

    public async Task<TrainingSessionDto?> CreateSessionAsync(Guid teamInstanceId, CreateTrainingSessionDto dto)
    {
        var teamInstance = await _db.LeagueTeamInstances
            .Include(t => t.BaseTeam).ThenInclude(t => t.Players)
            .FirstOrDefaultAsync(t => t.Id == teamInstanceId);

        if (teamInstance == null) return null;

        var session = new TrainingSession
        {
            Id = Guid.NewGuid(),
            TeamInstanceId = teamInstanceId,
            Date = DateTime.UtcNow,
            Type = Enum.Parse<TrainingType>(dto.Type),
            Intensity = dto.Intensity,
            FocusAttribute = dto.FocusAttribute
        };

        var excludedIds = dto.ExcludedPlayerIds ?? new List<Guid>();
        var players = teamInstance.BaseTeam.Players.Where(p => !excludedIds.Contains(p.Id)).ToList();

        foreach (var player in players)
        {
            var fitnessChange = CalculateFitnessChange(dto.Intensity, player.Fitness);
            var moraleChange = _rng.Next(-2, 4);
            var (attrImproved, attrChange) = CalculateAttributeGain(player, dto.Type, dto.FocusAttribute, dto.Intensity);

            player.Fitness = Math.Clamp(player.Fitness + fitnessChange, 0, 100);
            player.Morale = Math.Clamp(player.Morale + moraleChange, 0, 100);

            session.Results.Add(new PlayerTrainingResult
            {
                Id = Guid.NewGuid(),
                TrainingSessionId = session.Id,
                PlayerId = player.Id,
                FitnessChange = fitnessChange,
                MoraleChange = moraleChange,
                AttributeImproved = attrImproved,
                AttributeChange = attrChange
            });
        }

        _db.Set<TrainingSession>().Add(session);
        await _db.SaveChangesAsync();

        return MapSession(session);
    }

    public async Task ProcessTrainingAsync(Guid sessionId)
    {
        var session = await _db.Set<TrainingSession>()
            .Include(s => s.Results).ThenInclude(r => r.Player)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return;

        foreach (var result in session.Results)
        {
            if (!string.IsNullOrEmpty(result.AttributeImproved) && result.AttributeChange > 0)
            {
                var player = result.Player;
                switch (result.AttributeImproved.ToLower())
                {
                    case "pace": player.Pace = Math.Clamp(player.Pace + result.AttributeChange, 0, 99); break;
                    case "shooting": player.Shooting = Math.Clamp(player.Shooting + result.AttributeChange, 0, 99); break;
                    case "passing": player.Passing = Math.Clamp(player.Passing + result.AttributeChange, 0, 99); break;
                    case "dribbling": player.Dribbling = Math.Clamp(player.Dribbling + result.AttributeChange, 0, 99); break;
                    case "defending": player.Defending = Math.Clamp(player.Defending + result.AttributeChange, 0, 99); break;
                    case "physical": player.Physical = Math.Clamp(player.Physical + result.AttributeChange, 0, 99); break;
                }
            }
        }

        await _db.SaveChangesAsync();
    }

    private int CalculateFitnessChange(int intensity, int currentFitness)
    {
        var baseDrain = intensity / 20;
        var recovery = currentFitness > 80 ? 2 : 5;
        return intensity > 70 ? -baseDrain : recovery - baseDrain / 2;
    }

    private (string?, int) CalculateAttributeGain(Player player, string type, string? focus, int intensity)
    {
        if (_rng.NextDouble() > 0.15) return (null, 0);

        var potentialGap = player.Potential - player.CurrentAbility;
        if (potentialGap <= 0) return (null, 0);

        var attrs = type switch
        {
            "Attacking" => new[] { "shooting", "dribbling" },
            "Defending" => new[] { "defending", "physical" },
            "Physical" => new[] { "pace", "physical" },
            "Tactical" => new[] { "passing" },
            _ => new[] { "pace", "shooting", "passing", "dribbling", "defending", "physical" }
        };

        var attr = !string.IsNullOrEmpty(focus) && attrs.Contains(focus.ToLower())
            ? focus.ToLower()
            : attrs[_rng.Next(attrs.Length)];

        var gain = _rng.NextDouble() < 0.3 && intensity > 60 ? 1 : 0;
        return (attr, gain);
    }

    private static TrainingSessionDto MapSession(TrainingSession s) => new(
        s.Id, s.Date, s.Type.ToString(), s.Intensity, s.FocusAttribute,
        s.Results.Select(r => new PlayerTrainingResultDto(
            r.PlayerId, $"{r.Player.FirstName} {r.Player.LastName}",
            r.FitnessChange, r.MoraleChange, r.AttributeImproved, r.AttributeChange
        )).ToList()
    );
}

public interface IYouthAcademyService
{
    Task<YouthAcademyDto?> GetAcademyAsync(Guid teamId);
    Task<YouthAcademyDto?> CreateAcademyAsync(Guid teamId);
    Task<bool> UpgradeAcademyAsync(Guid academyId);
    Task<List<YouthPlayerDto>> GenerateIntakeAsync(Guid academyId);
    Task<PlayerDto?> PromoteYouthPlayerAsync(Guid youthPlayerId);
}

public class YouthAcademyService : IYouthAcademyService
{
    private readonly AppDbContext _db;
    private readonly Random _rng = new();

    public YouthAcademyService(AppDbContext db) => _db = db;

    public async Task<YouthAcademyDto?> GetAcademyAsync(Guid teamId)
    {
        var a = await _db.Set<YouthAcademy>()
            .Include(a => a.YouthPlayers.Where(p => !p.IsPromoted))
            .FirstOrDefaultAsync(a => a.TeamId == teamId);

        return a == null ? null : MapAcademy(a);
    }

    public async Task<YouthAcademyDto?> CreateAcademyAsync(Guid teamId)
    {
        var existing = await _db.Set<YouthAcademy>().FirstOrDefaultAsync(a => a.TeamId == teamId);
        if (existing != null) return MapAcademy(existing);

        var academy = new YouthAcademy
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            Level = 1,
            ScoutingRange = 1,
            TrainingQuality = 50,
            LastIntakeDate = DateTime.UtcNow.AddYears(-1)
        };

        _db.Set<YouthAcademy>().Add(academy);
        await _db.SaveChangesAsync();
        return MapAcademy(academy);
    }

    public async Task<bool> UpgradeAcademyAsync(Guid academyId)
    {
        var academy = await _db.Set<YouthAcademy>().FindAsync(academyId);
        if (academy == null || academy.Level >= 5) return false;

        academy.Level++;
        academy.ScoutingRange = Math.Min(academy.ScoutingRange + 1, 5);
        academy.TrainingQuality = Math.Min(academy.TrainingQuality + 10, 100);

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<YouthPlayerDto>> GenerateIntakeAsync(Guid academyId)
    {
        var academy = await _db.Set<YouthAcademy>()
            .Include(a => a.Team).ThenInclude(t => t.League)
            .FirstOrDefaultAsync(a => a.Id == academyId);

        if (academy == null) return new List<YouthPlayerDto>();

        var intakeCount = 3 + academy.Level;
        var positions = Enum.GetValues<Position>();

        for (int i = 0; i < intakeCount; i++)
        {
            var potentialBase = 40 + academy.TrainingQuality / 2 + _rng.Next(20);
            var youthPlayer = new YouthPlayer
            {
                Id = Guid.NewGuid(),
                YouthAcademyId = academyId,
                FirstName = $"Youth{_rng.Next(1000)}",
                LastName = $"Player{_rng.Next(1000)}",
                Nationality = academy.Team.League?.CountryCode ?? "ENG",
                DateOfBirth = DateTime.UtcNow.AddYears(-16).AddDays(-_rng.Next(365)),
                PrimaryPosition = positions[_rng.Next(positions.Length)],
                PotentialMin = Math.Max(40, potentialBase - 10),
                PotentialMax = Math.Min(99, potentialBase + 15),
                CurrentAbility = 20 + _rng.Next(15)
            };
            academy.YouthPlayers.Add(youthPlayer);
        }

        academy.LastIntakeDate = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return academy.YouthPlayers
            .Where(p => !p.IsPromoted)
            .Select(MapYouthPlayer)
            .ToList();
    }

    public async Task<PlayerDto?> PromoteYouthPlayerAsync(Guid youthPlayerId)
    {
        var youthPlayer = await _db.Set<YouthPlayer>()
            .Include(y => y.YouthAcademy)
            .FirstOrDefaultAsync(y => y.Id == youthPlayerId);

        if (youthPlayer == null || youthPlayer.IsPromoted) return null;

        var potential = _rng.Next(youthPlayer.PotentialMin, youthPlayer.PotentialMax + 1);
        var baseAbility = youthPlayer.CurrentAbility;

        var player = new Player
        {
            Id = Guid.NewGuid(),
            FirstName = youthPlayer.FirstName,
            LastName = youthPlayer.LastName,
            Nationality = youthPlayer.Nationality,
            DateOfBirth = youthPlayer.DateOfBirth,
            PrimaryPosition = youthPlayer.PrimaryPosition,
            Pace = Math.Clamp(baseAbility + _rng.Next(-5, 10), 30, 99),
            Shooting = Math.Clamp(baseAbility + _rng.Next(-5, 10), 30, 99),
            Passing = Math.Clamp(baseAbility + _rng.Next(-5, 10), 30, 99),
            Dribbling = Math.Clamp(baseAbility + _rng.Next(-5, 10), 30, 99),
            Defending = Math.Clamp(baseAbility + _rng.Next(-5, 10), 30, 99),
            Physical = Math.Clamp(baseAbility + _rng.Next(-5, 10), 30, 99),
            Potential = potential,
            CurrentAbility = baseAbility,
            MarketValue = baseAbility * 50_000,
            TeamId = youthPlayer.YouthAcademy.TeamId,
            Morale = 70,
            Fitness = 100,
            Form = 50
        };

        player.Languages.Add(new PlayerLanguage
        {
            Id = Guid.NewGuid(),
            PlayerId = player.Id,
            LanguageCode = youthPlayer.Nationality == "ENG" ? "en" : youthPlayer.Nationality.ToLower(),
            IsNative = true
        });

        youthPlayer.IsPromoted = true;
        _db.Players.Add(player);
        await _db.SaveChangesAsync();

        return new PlayerDto(
            player.Id, player.FirstName, player.LastName, $"{player.FirstName} {player.LastName}",
            player.Nationality, player.Age, player.PrimaryPosition.ToString(), null,
            player.Pace, player.Shooting, player.Passing, player.Dribbling, player.Defending, player.Physical,
            baseAbility, potential, player.Morale, player.Fitness, player.Form, player.MarketValue,
            false, false, player.TeamId, null, new List<string>()
        );
    }

    private static YouthAcademyDto MapAcademy(YouthAcademy a) => new(
        a.Id, a.Level, a.ScoutingRange, a.TrainingQuality, a.LastIntakeDate,
        a.YouthPlayers.Where(p => !p.IsPromoted).Select(MapYouthPlayer).ToList()
    );

    private static YouthPlayerDto MapYouthPlayer(YouthPlayer y) => new(
        y.Id, y.FirstName, y.LastName, y.Nationality,
        (int)((DateTime.UtcNow - y.DateOfBirth).TotalDays / 365.25),
        y.PrimaryPosition.ToString(), y.PotentialMin, y.PotentialMax, y.CurrentAbility
    );
}

public interface IFriendshipService
{
    Task<List<FriendshipDto>> GetFriendsAsync(Guid userId);
    Task<List<FriendshipDto>> GetPendingRequestsAsync(Guid userId);
    Task<FriendshipDto?> SendRequestAsync(Guid fromUserId, Guid toUserId);
    Task<bool> AcceptRequestAsync(Guid friendshipId, Guid userId);
    Task<bool> DeclineRequestAsync(Guid friendshipId, Guid userId);
    Task<bool> RemoveFriendAsync(Guid friendshipId, Guid userId);
    Task<bool> BlockUserAsync(Guid userId, Guid blockedUserId);
}

public class FriendshipService : IFriendshipService
{
    private readonly AppDbContext _db;

    public FriendshipService(AppDbContext db) => _db = db;

    public async Task<List<FriendshipDto>> GetFriendsAsync(Guid userId)
    {
        var friendships = await _db.Set<Friendship>()
            .Include(f => f.User1)
            .Include(f => f.User2)
            .Where(f => (f.User1Id == userId || f.User2Id == userId) && f.Status == FriendshipStatus.Accepted)
            .ToListAsync();

        return friendships.Select(f =>
        {
            var friend = f.User1Id == userId ? f.User2 : f.User1;
            return new FriendshipDto(f.Id, friend.Id, friend.DisplayName, friend.AvatarId, f.Status.ToString(), f.CreatedAt);
        }).ToList();
    }

    public async Task<List<FriendshipDto>> GetPendingRequestsAsync(Guid userId)
    {
        var requests = await _db.Set<Friendship>()
            .Include(f => f.User1)
            .Where(f => f.User2Id == userId && f.Status == FriendshipStatus.Pending)
            .ToListAsync();

        return requests.Select(f => new FriendshipDto(
            f.Id, f.User1.Id, f.User1.DisplayName, f.User1.AvatarId, f.Status.ToString(), f.CreatedAt
        )).ToList();
    }

    public async Task<FriendshipDto?> SendRequestAsync(Guid fromUserId, Guid toUserId)
    {
        if (fromUserId == toUserId) return null;

        var existing = await _db.Set<Friendship>()
            .FirstOrDefaultAsync(f =>
                (f.User1Id == fromUserId && f.User2Id == toUserId) ||
                (f.User1Id == toUserId && f.User2Id == fromUserId));

        if (existing != null) return null;

        var toUser = await _db.Users.FindAsync(toUserId);
        if (toUser == null) return null;

        var friendship = new Friendship
        {
            Id = Guid.NewGuid(),
            User1Id = fromUserId,
            User2Id = toUserId,
            Status = FriendshipStatus.Pending
        };

        _db.Set<Friendship>().Add(friendship);
        await _db.SaveChangesAsync();

        return new FriendshipDto(friendship.Id, toUser.Id, toUser.DisplayName, toUser.AvatarId, friendship.Status.ToString(), friendship.CreatedAt);
    }

    public async Task<bool> AcceptRequestAsync(Guid friendshipId, Guid userId)
    {
        var friendship = await _db.Set<Friendship>().FindAsync(friendshipId);
        if (friendship == null || friendship.User2Id != userId || friendship.Status != FriendshipStatus.Pending)
            return false;

        friendship.Status = FriendshipStatus.Accepted;
        friendship.AcceptedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeclineRequestAsync(Guid friendshipId, Guid userId)
    {
        var friendship = await _db.Set<Friendship>().FindAsync(friendshipId);
        if (friendship == null || friendship.User2Id != userId || friendship.Status != FriendshipStatus.Pending)
            return false;

        _db.Set<Friendship>().Remove(friendship);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveFriendAsync(Guid friendshipId, Guid userId)
    {
        var friendship = await _db.Set<Friendship>().FindAsync(friendshipId);
        if (friendship == null || (friendship.User1Id != userId && friendship.User2Id != userId))
            return false;

        _db.Set<Friendship>().Remove(friendship);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> BlockUserAsync(Guid userId, Guid blockedUserId)
    {
        var friendship = await _db.Set<Friendship>()
            .FirstOrDefaultAsync(f =>
                (f.User1Id == userId && f.User2Id == blockedUserId) ||
                (f.User1Id == blockedUserId && f.User2Id == userId));

        if (friendship != null)
        {
            friendship.Status = FriendshipStatus.Blocked;
        }
        else
        {
            friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                User1Id = userId,
                User2Id = blockedUserId,
                Status = FriendshipStatus.Blocked
            };
            _db.Set<Friendship>().Add(friendship);
        }

        await _db.SaveChangesAsync();
        return true;
    }
}

public interface ILeagueInviteService
{
    Task<List<LeagueInviteDto>> GetPendingInvitesAsync(Guid userId);
    Task<LeagueInviteDto?> SendInviteAsync(Guid fromUserId, SendLeagueInviteDto dto);
    Task<bool> AcceptInviteAsync(Guid inviteId, Guid userId);
    Task<bool> DeclineInviteAsync(Guid inviteId, Guid userId);
    Task<bool> CancelInviteAsync(Guid inviteId, Guid userId);
}

public class LeagueInviteService : ILeagueInviteService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;

    public LeagueInviteService(AppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task<List<LeagueInviteDto>> GetPendingInvitesAsync(Guid userId)
    {
        return await _db.LeagueInvites
            .Include(i => i.LeagueInstance)
            .Include(i => i.InvitedByUser)
            .Where(i => i.InvitedUserId == userId && i.Status == InviteStatus.Pending)
            .Select(i => new LeagueInviteDto(
                i.Id, i.LeagueInstanceId, i.LeagueInstance.Name,
                i.InvitedByUserId, i.InvitedByUser.DisplayName, i.InvitedAt, i.Status.ToString()
            ))
            .ToListAsync();
    }

    public async Task<LeagueInviteDto?> SendInviteAsync(Guid fromUserId, SendLeagueInviteDto dto)
    {
        var league = await _db.LeagueInstances.FindAsync(dto.LeagueInstanceId);
        if (league == null || league.OwnerId != fromUserId) return null;

        var targetUser = await _db.Users.FindAsync(dto.UserId);
        if (targetUser == null) return null;

        var existing = await _db.LeagueInvites
            .FirstOrDefaultAsync(i => i.LeagueInstanceId == dto.LeagueInstanceId && i.InvitedUserId == dto.UserId && i.Status == InviteStatus.Pending);
        if (existing != null) return null;

        var invite = new LeagueInvite
        {
            Id = Guid.NewGuid(),
            LeagueInstanceId = dto.LeagueInstanceId,
            InvitedUserId = dto.UserId,
            InvitedByUserId = fromUserId
        };

        _db.LeagueInvites.Add(invite);
        await _db.SaveChangesAsync();

        await _notificationService.CreateAsync(
            dto.UserId,
            NotificationType.LeagueInvite,
            "League Invitation",
            $"You've been invited to join {league.Name}",
            $"/league/{league.Id}/join"
        );

        var fromUser = await _db.Users.FindAsync(fromUserId);
        return new LeagueInviteDto(
            invite.Id, league.Id, league.Name, fromUserId, fromUser?.DisplayName ?? "Unknown", invite.InvitedAt, invite.Status.ToString()
        );
    }

    public async Task<bool> AcceptInviteAsync(Guid inviteId, Guid userId)
    {
        var invite = await _db.LeagueInvites.FindAsync(inviteId);
        if (invite == null || invite.InvitedUserId != userId || invite.Status != InviteStatus.Pending)
            return false;

        invite.Status = InviteStatus.Accepted;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeclineInviteAsync(Guid inviteId, Guid userId)
    {
        var invite = await _db.LeagueInvites.FindAsync(inviteId);
        if (invite == null || invite.InvitedUserId != userId || invite.Status != InviteStatus.Pending)
            return false;

        invite.Status = InviteStatus.Declined;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CancelInviteAsync(Guid inviteId, Guid userId)
    {
        var invite = await _db.LeagueInvites.FindAsync(inviteId);
        if (invite == null || invite.InvitedByUserId != userId || invite.Status != InviteStatus.Pending)
            return false;

        _db.LeagueInvites.Remove(invite);
        await _db.SaveChangesAsync();
        return true;
    }
}

public interface IPressService
{
    Task<List<PressEventDto>> GetLeaguePressEventsAsync(Guid leagueInstanceId, int limit = 20);
    Task<PressEventDto?> GenerateMatchReportAsync(Guid matchId);
    Task<PressEventDto?> GenerateScandalAsync(Guid leagueInstanceId, Guid? managerId, Guid? playerId);
    Task<PressEventDto?> GenerateTransferRumorAsync(Guid playerId, Guid? interestedTeamId, Guid leagueInstanceId);
}

public class PressService : IPressService
{
    private readonly AppDbContext _db;
    private readonly Random _rng = new();

    public PressService(AppDbContext db) => _db = db;

    public async Task<List<PressEventDto>> GetLeaguePressEventsAsync(Guid leagueInstanceId, int limit = 20)
    {
        return await _db.Set<PressEvent>()
            .Include(p => p.TargetManager)
            .Include(p => p.TargetPlayer)
            .Include(p => p.TargetTeam)
            .Where(p => p.LeagueInstanceId == leagueInstanceId)
            .OrderByDescending(p => p.PublishedAt)
            .Take(limit)
            .Select(p => new PressEventDto(
                p.Id, p.Type.ToString(), p.Headline, p.Content,
                p.ReputationImpact, p.MoraleImpact, p.FanMoodImpact, p.PublishedAt,
                p.TargetManager != null ? p.TargetManager.Name : null,
                p.TargetPlayer != null ? $"{p.TargetPlayer.FirstName} {p.TargetPlayer.LastName}" : null,
                p.TargetTeam != null ? p.TargetTeam.Name : null
            ))
            .ToListAsync();
    }

    public async Task<PressEventDto?> GenerateMatchReportAsync(Guid matchId)
    {
        var match = await _db.Matches
            .Include(m => m.Fixture).ThenInclude(f => f.HomeTeam).ThenInclude(t => t.BaseTeam)
            .Include(m => m.Fixture).ThenInclude(f => f.AwayTeam).ThenInclude(t => t.BaseTeam)
            .Include(m => m.Fixture).ThenInclude(f => f.Competition)
            .FirstOrDefaultAsync(m => m.Id == matchId);

        if (match == null) return null;

        var homeName = match.Fixture.HomeTeam.BaseTeam.Name;
        var awayName = match.Fixture.AwayTeam.BaseTeam.Name;
        var scoreStr = $"{match.HomeScore}-{match.AwayScore}";

        var (headline, content, type) = match.HomeScore > match.AwayScore
            ? ($"{homeName} Triumphs Over {awayName}", $"In an exciting match, {homeName} secured a {scoreStr} victory against {awayName}.", PressEventType.Positive)
            : match.AwayScore > match.HomeScore
                ? ($"{awayName} Stuns {homeName}", $"{awayName} pulled off an impressive {scoreStr} win away at {homeName}.", PressEventType.Positive)
                : ($"Honors Even as {homeName} and {awayName} Draw", $"Neither side could find a winner in a {scoreStr} draw.", PressEventType.Positive);

        var pressEvent = new PressEvent
        {
            Id = Guid.NewGuid(),
            LeagueInstanceId = match.Fixture.Competition.LeagueInstanceId,
            Type = type,
            Headline = headline,
            Content = content,
            ReputationImpact = 0,
            MoraleImpact = 0,
            FanMoodImpact = 0
        };

        _db.Set<PressEvent>().Add(pressEvent);
        await _db.SaveChangesAsync();

        return new PressEventDto(
            pressEvent.Id, pressEvent.Type.ToString(), pressEvent.Headline, pressEvent.Content,
            0, 0, 0, pressEvent.PublishedAt, null, null, null
        );
    }

    public async Task<PressEventDto?> GenerateScandalAsync(Guid leagueInstanceId, Guid? managerId, Guid? playerId)
    {
        var headlines = new[]
        {
            "Controversy Erupts After Training Ground Incident",
            "Shocking Revelations Rock The Club",
            "Star Accused Of Unprofessional Behavior",
            "Internal Tensions Threaten Squad Harmony"
        };

        Manager? manager = managerId.HasValue ? await _db.Managers.FindAsync(managerId.Value) : null;
        Player? player = playerId.HasValue ? await _db.Players.FindAsync(playerId.Value) : null;

        var pressEvent = new PressEvent
        {
            Id = Guid.NewGuid(),
            LeagueInstanceId = leagueInstanceId,
            Type = PressEventType.Scandal,
            Headline = headlines[_rng.Next(headlines.Length)],
            Content = "Sources close to the situation report that...",
            ReputationImpact = -_rng.Next(5, 15),
            MoraleImpact = -_rng.Next(5, 10),
            FanMoodImpact = -_rng.Next(5, 15),
            TargetManagerId = managerId,
            TargetPlayerId = playerId
        };

        if (manager != null) manager.Reputation = Math.Max(0, manager.Reputation + pressEvent.ReputationImpact);
        if (player != null) player.Morale = Math.Max(0, player.Morale + pressEvent.MoraleImpact);

        _db.Set<PressEvent>().Add(pressEvent);
        await _db.SaveChangesAsync();

        return new PressEventDto(
            pressEvent.Id, pressEvent.Type.ToString(), pressEvent.Headline, pressEvent.Content,
            pressEvent.ReputationImpact, pressEvent.MoraleImpact, pressEvent.FanMoodImpact, pressEvent.PublishedAt,
            manager?.Name, player != null ? $"{player.FirstName} {player.LastName}" : null, null
        );
    }

    public async Task<PressEventDto?> GenerateTransferRumorAsync(Guid playerId, Guid? interestedTeamId, Guid leagueInstanceId)
    {
        var player = await _db.Players.Include(p => p.Team).FirstOrDefaultAsync(p => p.Id == playerId);
        if (player == null) return null;

        Team? interestedTeam = interestedTeamId.HasValue
            ? await _db.Teams.FindAsync(interestedTeamId.Value)
            : null;

        var playerName = $"{player.FirstName} {player.LastName}";
        var headline = interestedTeam != null
            ? $"{interestedTeam.Name} Eyeing Move for {playerName}"
            : $"{playerName} Attracting Interest From Top Clubs";

        var pressEvent = new PressEvent
        {
            Id = Guid.NewGuid(),
            LeagueInstanceId = leagueInstanceId,
            Type = PressEventType.TransferNews,
            Headline = headline,
            Content = $"Reports suggest {playerName} could be on the move...",
            TargetPlayerId = playerId,
            TargetTeamId = interestedTeamId
        };

        _db.Set<PressEvent>().Add(pressEvent);
        await _db.SaveChangesAsync();

        return new PressEventDto(
            pressEvent.Id, pressEvent.Type.ToString(), pressEvent.Headline, pressEvent.Content,
            0, 0, 0, pressEvent.PublishedAt, null, playerName, interestedTeam?.Name
        );
    }
}

public interface IVoteService
{
    Task<VoteResult> VoteToSkipAsync(Guid leagueInstanceId, Guid userId);
    Task<VoteResult> GetVoteStatusAsync(Guid leagueInstanceId);
    Task ResetVotesAsync(Guid leagueInstanceId);
}

public class VoteService : IVoteService
{
    private readonly AppDbContext _db;
    private static readonly ConcurrentDictionary<Guid, HashSet<Guid>> _votes = new();

    public VoteService(AppDbContext db) => _db = db;

    public async Task<VoteResult> VoteToSkipAsync(Guid leagueInstanceId, Guid userId)
    {
        var league = await _db.LeagueInstances
            .Include(l => l.Managers)
            .FirstOrDefaultAsync(l => l.Id == leagueInstanceId);

        if (league == null)
            return new VoteResult(0, 0, false);

        var userHasManager = league.Managers.Any(m => m.UserId == userId);
        if (!userHasManager)
            return await GetVoteStatusAsync(leagueInstanceId);

        _votes.TryAdd(leagueInstanceId, new HashSet<Guid>());
        _votes[leagueInstanceId].Add(userId);

        var playerCount = league.Managers.Select(m => m.UserId).Distinct().Count();
        var votesNeeded = (int)Math.Ceiling(playerCount * 0.6);
        var votesCast = _votes[leagueInstanceId].Count;
        var skipApproved = votesCast >= votesNeeded;

        return new VoteResult(votesNeeded, votesCast, skipApproved);
    }

    public async Task<VoteResult> GetVoteStatusAsync(Guid leagueInstanceId)
    {
        var league = await _db.LeagueInstances
            .Include(l => l.Managers)
            .FirstOrDefaultAsync(l => l.Id == leagueInstanceId);

        if (league == null)
            return new VoteResult(0, 0, false);

        var playerCount = league.Managers.Select(m => m.UserId).Distinct().Count();
        var votesNeeded = (int)Math.Ceiling(playerCount * 0.6);

        _votes.TryGetValue(leagueInstanceId, out var votes);
        var votesCast = votes?.Count ?? 0;

        return new VoteResult(votesNeeded, votesCast, votesCast >= votesNeeded);
    }

    public Task ResetVotesAsync(Guid leagueInstanceId)
    {
        _votes.TryRemove(leagueInstanceId, out _);
        return Task.CompletedTask;
    }
}

public interface IContractService
{
    Task<ContractDto?> GetContractAsync(Guid playerId);
    Task<ContractDto?> CreateContractAsync(CreateContractDto dto);
    Task<bool> TerminateContractAsync(Guid playerId);
    Task<bool> ExtendContractAsync(Guid playerId, int additionalYears, decimal? newWage);
    Task<List<ContractDto>> GetExpiringContractsAsync(Guid teamId, int monthsAhead = 6);
}

public class ContractService : IContractService
{
    private readonly AppDbContext _db;

    public ContractService(AppDbContext db) => _db = db;

    public async Task<ContractDto?> GetContractAsync(Guid playerId)
    {
        var c = await _db.Contracts.FirstOrDefaultAsync(c => c.PlayerId == playerId);
        return c == null ? null : MapContract(c);
    }

    public async Task<ContractDto?> CreateContractAsync(CreateContractDto dto)
    {
        var player = await _db.Players.FindAsync(dto.PlayerId);
        if (player == null) return null;

        var existing = await _db.Contracts.FirstOrDefaultAsync(c => c.PlayerId == dto.PlayerId);
        if (existing != null) _db.Contracts.Remove(existing);

        var contract = new Contract
        {
            Id = Guid.NewGuid(),
            PlayerId = dto.PlayerId,
            TeamId = dto.TeamId,
            WeeklyWage = dto.WeeklyWage,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddYears(dto.Years),
            ReleaseClause = dto.ReleaseClause,
            SigningBonus = dto.SigningBonus,
            GoalBonus = dto.GoalBonus,
            AssistBonus = dto.AssistBonus
        };

        player.ContractId = contract.Id;
        player.TeamId = dto.TeamId;

        _db.Contracts.Add(contract);
        await _db.SaveChangesAsync();

        return MapContract(contract);
    }

    public async Task<bool> TerminateContractAsync(Guid playerId)
    {
        var contract = await _db.Contracts.FirstOrDefaultAsync(c => c.PlayerId == playerId);
        if (contract == null) return false;

        var player = await _db.Players.FindAsync(playerId);
        if (player != null)
        {
            player.ContractId = null;
            if (contract.CanBeCancelledFree) player.TeamId = null;
        }

        _db.Contracts.Remove(contract);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExtendContractAsync(Guid playerId, int additionalYears, decimal? newWage)
    {
        var contract = await _db.Contracts.FirstOrDefaultAsync(c => c.PlayerId == playerId);
        if (contract == null) return false;

        contract.EndDate = contract.EndDate.AddYears(additionalYears);
        if (newWage.HasValue) contract.WeeklyWage = newWage.Value;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<ContractDto>> GetExpiringContractsAsync(Guid teamId, int monthsAhead = 6)
    {
        var cutoff = DateTime.UtcNow.AddMonths(monthsAhead);
        return await _db.Contracts
            .Where(c => c.TeamId == teamId && c.EndDate <= cutoff)
            .Select(c => MapContract(c))
            .ToListAsync();
    }

    private static ContractDto MapContract(Contract c) => new(
        c.WeeklyWage, c.StartDate, c.EndDate,
        c.ReleaseClause, c.SigningBonus, c.GoalBonus, c.AssistBonus, c.CanBeCancelledFree
    );
}

public interface IInternationalService
{
    Task<List<InternationalTeamDto>> GetTeamsAsync();
    Task<InternationalTeamDto?> GetTeamAsync(Guid teamId);
    Task<List<InternationalBreakDto>> GetUpcomingBreaksAsync(int count = 5);
    Task<List<InternationalCallDto>> GetCallUpsForBreakAsync(Guid breakId);
    Task<InternationalCallDto?> CallUpPlayerAsync(Guid internationalTeamId, Guid playerId, Guid breakId);
    Task ProcessBreakReturnAsync(Guid breakId);
}

public class InternationalService : IInternationalService
{
    private readonly AppDbContext _db;
    private readonly Random _rng = new();

    public InternationalService(AppDbContext db) => _db = db;

    public async Task<List<InternationalTeamDto>> GetTeamsAsync()
    {
        return await _db.InternationalTeams
            .Include(t => t.Manager)
            .OrderBy(t => t.FifaRanking)
            .Select(t => new InternationalTeamDto(
                t.Id, t.CountryCode, t.Country.Name, t.Name,
                t.ManagerId, t.Manager != null ? t.Manager.Name : null, t.FifaRanking
            ))
            .ToListAsync();
    }

    public async Task<InternationalTeamDto?> GetTeamAsync(Guid teamId)
    {
        var t = await _db.InternationalTeams
            .Include(t => t.Country)
            .Include(t => t.Manager)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        return t == null ? null : new InternationalTeamDto(
            t.Id, t.CountryCode, t.Country.Name, t.Name,
            t.ManagerId, t.Manager?.Name, t.FifaRanking
        );
    }

    public async Task<List<InternationalBreakDto>> GetUpcomingBreaksAsync(int count = 5)
    {
        return await _db.InternationalBreaks
            .Where(b => b.EndDate >= DateTime.UtcNow)
            .OrderBy(b => b.StartDate)
            .Take(count)
            .Select(b => new InternationalBreakDto(b.Id, b.Name, b.StartDate, b.EndDate, b.Type.ToString()))
            .ToListAsync();
    }

    public async Task<List<InternationalCallDto>> GetCallUpsForBreakAsync(Guid breakId)
    {
        var brk = await _db.InternationalBreaks.FindAsync(breakId);
        if (brk == null) return new List<InternationalCallDto>();

        return await _db.InternationalCalls
            .Include(c => c.Player)
            .Where(c => c.BreakStartDate == brk.StartDate)
            .Select(c => new InternationalCallDto(
                c.Id, c.PlayerId, $"{c.Player.FirstName} {c.Player.LastName}",
                c.BreakStartDate, c.BreakEndDate, c.PlayerReturned, c.InjuryDays
            ))
            .ToListAsync();
    }

    public async Task<InternationalCallDto?> CallUpPlayerAsync(Guid internationalTeamId, Guid playerId, Guid breakId)
    {
        var team = await _db.InternationalTeams.FindAsync(internationalTeamId);
        var player = await _db.Players.FindAsync(playerId);
        var brk = await _db.InternationalBreaks.FindAsync(breakId);

        if (team == null || player == null || brk == null) return null;
        if (player.Nationality != team.CountryCode) return null;

        var call = new InternationalCall
        {
            Id = Guid.NewGuid(),
            InternationalTeamId = internationalTeamId,
            PlayerId = playerId,
            BreakStartDate = brk.StartDate,
            BreakEndDate = brk.EndDate
        };

        _db.InternationalCalls.Add(call);
        await _db.SaveChangesAsync();

        return new InternationalCallDto(
            call.Id, playerId, $"{player.FirstName} {player.LastName}",
            call.BreakStartDate, call.BreakEndDate, false, null
        );
    }

    public async Task ProcessBreakReturnAsync(Guid breakId)
    {
        var brk = await _db.InternationalBreaks.FindAsync(breakId);
        if (brk == null) return;

        var calls = await _db.InternationalCalls
            .Include(c => c.Player)
            .Where(c => c.BreakStartDate == brk.StartDate && !c.PlayerReturned)
            .ToListAsync();

        foreach (var call in calls)
        {
            call.PlayerReturned = true;

            if (_rng.NextDouble() < 0.05)
            {
                call.InjuryDays = _rng.Next(7, 28);
                call.Player.Fitness = Math.Max(0, call.Player.Fitness - 30);
            }
            else
            {
                call.Player.Fitness = Math.Max(60, call.Player.Fitness - 10);
            }

            call.Player.Morale = Math.Min(100, call.Player.Morale + 5);
        }

        await _db.SaveChangesAsync();
    }
}

public interface ISaveExportService
{
    Task<SaveExportDto?> ExportLeagueAsync(Guid leagueInstanceId, Guid userId);
    Task<bool> ImportLeagueAsync(Guid userId, ImportSaveDto dto);
    Task<List<SaveExportDto>> GetUserExportsAsync(Guid userId);
}

public class SaveExportService : ISaveExportService
{
    private readonly AppDbContext _db;

    public SaveExportService(AppDbContext db) => _db = db;

    public async Task<SaveExportDto?> ExportLeagueAsync(Guid leagueInstanceId, Guid userId)
    {
        var league = await _db.LeagueInstances
            .Include(l => l.Teams).ThenInclude(t => t.BaseTeam).ThenInclude(t => t.Players)
            .Include(l => l.Competitions).ThenInclude(c => c.Fixtures)
            .Include(l => l.Managers)
            .Include(l => l.Governance)
            .FirstOrDefaultAsync(l => l.Id == leagueInstanceId);

        if (league == null) return null;

        var exportData = new
        {
            League = league,
            ExportedAt = DateTime.UtcNow,
            Version = "1.0"
        };

        var json = JsonSerializer.Serialize(exportData);
        var hash = ComputeHash(json);

        var export = new SaveExport
        {
            Id = Guid.NewGuid(),
            LeagueInstanceId = leagueInstanceId,
            ExportedByUserId = userId,
            Version = "1.0",
            DataHash = hash
        };

        _db.SaveExports.Add(export);
        await _db.SaveChangesAsync();

        return new SaveExportDto(export.Id, export.ExportedAt, export.Version, export.DataHash);
    }

    public async Task<bool> ImportLeagueAsync(Guid userId, ImportSaveDto dto)
    {
        var computedHash = ComputeHash(dto.JsonData);
        if (computedHash != dto.ExpectedHash) return false;

        // TODO: Deserialize and recreate league
        // This is complex and would need full implementation
        await Task.CompletedTask;
        return true;
    }

    public async Task<List<SaveExportDto>> GetUserExportsAsync(Guid userId)
    {
        return await _db.SaveExports
            .Where(e => e.ExportedByUserId == userId)
            .OrderByDescending(e => e.ExportedAt)
            .Select(e => new SaveExportDto(e.Id, e.ExportedAt, e.Version, e.DataHash))
            .ToListAsync();
    }

    private static string ComputeHash(string data)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(data));
        return Convert.ToBase64String(bytes);
    }
}

public interface IInGameInstructionService
{
    Task<List<InGameInstructionDto>> GetAvailableInstructionsAsync(int managerReputation);
    Task<List<InGameInstructionDto>> GetAllInstructionsAsync();
    Task SeedDefaultInstructionsAsync();
}

public class InGameInstructionService : IInGameInstructionService
{
    private readonly AppDbContext _db;

    public InGameInstructionService(AppDbContext db) => _db = db;

    public async Task<List<InGameInstructionDto>> GetAvailableInstructionsAsync(int managerReputation)
    {
        return await _db.InGameInstructions
            .Where(i => i.MinReputationRequired <= managerReputation)
            .Select(i => new InGameInstructionDto(i.Id, i.Name, i.Description, i.Category.ToString(), i.MinReputationRequired))
            .ToListAsync();
    }

    public async Task<List<InGameInstructionDto>> GetAllInstructionsAsync()
    {
        return await _db.InGameInstructions
            .Select(i => new InGameInstructionDto(i.Id, i.Name, i.Description, i.Category.ToString(), i.MinReputationRequired))
            .ToListAsync();
    }

    public async Task SeedDefaultInstructionsAsync()
    {
        if (await _db.InGameInstructions.AnyAsync()) return;

        var instructions = new[]
        {
            new InGameInstruction { Id = Guid.NewGuid(), Name = "Push Forward", Description = "Team pushes higher up the pitch", Category = InstructionCategory.Attacking, MinReputationRequired = 0 },
            new InGameInstruction { Id = Guid.NewGuid(), Name = "Drop Deep", Description = "Team drops back defensively", Category = InstructionCategory.Defending, MinReputationRequired = 0 },
            new InGameInstruction { Id = Guid.NewGuid(), Name = "Time Wasting", Description = "Slow down play to preserve lead", Category = InstructionCategory.Tempo, MinReputationRequired = 20 },
            new InGameInstruction { Id = Guid.NewGuid(), Name = "Get Stuck In", Description = "More aggressive tackling", Category = InstructionCategory.Mentality, MinReputationRequired = 30 },
            new InGameInstruction { Id = Guid.NewGuid(), Name = "Play Wide", Description = "Stretch play to the wings", Category = InstructionCategory.Width, MinReputationRequired = 0 },
            new InGameInstruction { Id = Guid.NewGuid(), Name = "Play Narrow", Description = "Focus play through the middle", Category = InstructionCategory.Width, MinReputationRequired = 0 },
            new InGameInstruction { Id = Guid.NewGuid(), Name = "Target Man", Description = "Play long balls to striker", Category = InstructionCategory.Specific, MinReputationRequired = 40 },
            new InGameInstruction { Id = Guid.NewGuid(), Name = "Overlap", Description = "Fullbacks overlap wingers", Category = InstructionCategory.Attacking, MinReputationRequired = 50 },
            new InGameInstruction { Id = Guid.NewGuid(), Name = "Gegenpressing", Description = "Immediate press after losing ball", Category = InstructionCategory.Defending, MinReputationRequired = 60 },
            new InGameInstruction { Id = Guid.NewGuid(), Name = "False 9", Description = "Striker drops deep to create space", Category = InstructionCategory.Specific, MinReputationRequired = 70 }
        };

        _db.InGameInstructions.AddRange(instructions);
        await _db.SaveChangesAsync();
    }
}

