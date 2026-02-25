using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using IronLeague.Data;
using IronLeague.DTOs;
using IronLeague.Services;
using IronLeague.Entities;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ManagerController : ControllerBase
{
    private readonly IManagerService _managerService;
    public ManagerController(IManagerService managerService) => _managerService = managerService;

    [HttpPost]
    public async Task<ActionResult<ManagerDto>> Create(CreateManagerDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _managerService.CreateManagerAsync(userId, dto);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ManagerDto>> Get(Guid id)
    {
        var result = await _managerService.GetManagerAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<ManagerDto>>> GetMine()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return Ok(await _managerService.GetUserManagersAsync(userId));
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LeagueInstanceController : ControllerBase
{
    private readonly ILeagueInstanceService _leagueService;
    public LeagueInstanceController(ILeagueInstanceService leagueService) => _leagueService = leagueService;

    [HttpPost]
    public async Task<ActionResult<LeagueInstanceDto>> Create(CreateLeagueInstanceDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _leagueService.CreateAsync(userId, dto);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LeagueInstanceDto>> Get(Guid id)
    {
        var result = await _leagueService.GetAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("public")]
    public async Task<ActionResult<List<LeagueInstanceDto>>> GetPublic() => Ok(await _leagueService.GetPublicAsync());

    [HttpGet("mine")]
    public async Task<ActionResult<List<LeagueInstanceDto>>> GetMine()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return Ok(await _leagueService.GetUserLeaguesAsync(userId));
    }

    [HttpPost("join")]
    public async Task<ActionResult> Join(JoinLeagueInstanceDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return await _leagueService.JoinAsync(userId, dto) ? Ok() : BadRequest();
    }

    [HttpPost("{id}/start")]
    public async Task<ActionResult> Start(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return await _leagueService.StartAsync(id, userId) ? Ok() : BadRequest();
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FixtureController : ControllerBase
{
    private readonly IFixtureService _fixtureService;
    public FixtureController(IFixtureService fixtureService) => _fixtureService = fixtureService;

    [HttpGet("competition/{competitionId}")]
    public async Task<ActionResult<List<FixtureDto>>> GetByCompetition(Guid competitionId) => Ok(await _fixtureService.GetFixturesAsync(competitionId));

    [HttpGet("{id}")]
    public async Task<ActionResult<FixtureDto>> Get(Guid id)
    {
        var result = await _fixtureService.GetFixtureAsync(id);
        return result == null ? NotFound() : Ok(result);
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MatchController : ControllerBase
{
    private readonly IMatchService _matchService;
    private readonly AppDbContext _db;

    public MatchController(IMatchService matchService, AppDbContext db)
    {
        _matchService = matchService;
        _db = db;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MatchDto>> Get(Guid id)
    {
        var result = await _matchService.GetMatchAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost("start")]
    public async Task<ActionResult<MatchDto>> Start(StartMatchDto dto)
    {
        var result = await _matchService.StartMatchAsync(dto);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpPost("demo")]
    public async Task<ActionResult<MatchDto>> CreateDemo()
    {
        // For a demo match, we need a LeagueInstance with team instances
        // Let's create a simple demo league instance with two base teams
        var baseTeams = await _db.Teams
            .Include(t => t.League)
            .OrderBy(t => Guid.NewGuid())
            .Take(2)
            .ToListAsync();

        if (baseTeams.Count < 2)
            return BadRequest("Not enough teams in database");

        // Get current user ID
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // Create default governance settings
        var governance = new GovernanceSettings
        {
            Id = Guid.NewGuid(),
            PresetName = "Demo Balanced"
        };

        _db.Set<GovernanceSettings>().Add(governance);

        // Create a demo league instance
        var demoLeagueInstance = new LeagueInstance
        {
            Id = Guid.NewGuid(),
            BaseLeagueId = baseTeams[0].LeagueId,
            Name = "Demo Match League",
            OwnerId = userId,
            Status = LeagueStatus.Active,
            CurrentDate = DateTime.UtcNow,
            IsPrivate = true,
            MaxPlayers = 2,
            CurrentSeason = 1,
            GovernanceId = governance.Id
        };

        _db.LeagueInstances.Add(demoLeagueInstance);

        // Create team instances for both teams
        var homeTeamInstance = new LeagueTeamInstance
        {
            Id = Guid.NewGuid(),
            LeagueInstanceId = demoLeagueInstance.Id,
            BaseTeamId = baseTeams[0].Id,
            ManagerId = null
        };

        var awayTeamInstance = new LeagueTeamInstance
        {
            Id = Guid.NewGuid(),
            LeagueInstanceId = demoLeagueInstance.Id,
            BaseTeamId = baseTeams[1].Id,
            ManagerId = null
        };

        _db.Set<LeagueTeamInstance>().AddRange(homeTeamInstance, awayTeamInstance);

        // Create a competition for this demo league
        var competition = new Competition
        {
            Id = Guid.NewGuid(),
            LeagueInstanceId = demoLeagueInstance.Id,
            Name = "Demo Competition",
            Type = CompetitionType.League,
            Season = 1,
            Status = CompetitionStatus.InProgress
        };

        _db.Set<Competition>().Add(competition);

        // Create the fixture
        var fixture = new Fixture
        {
            Id = Guid.NewGuid(),
            CompetitionId = competition.Id,
            HomeTeamId = homeTeamInstance.Id,
            AwayTeamId = awayTeamInstance.Id,
            ScheduledDate = DateTime.UtcNow,
            Status = FixtureStatus.Scheduled,
            MatchDay = 1,
            Round = "Demo Match"
        };

        _db.Fixtures.Add(fixture);
        await _db.SaveChangesAsync();

        // Start the match
        var startDto = new StartMatchDto(
            fixture.Id,
            "4-4-2",
            "Balanced",
            "4-3-3",
            "Attacking"
        );

        var result = await _matchService.StartMatchAsync(startDto);
        return result == null ? BadRequest("Failed to start demo match") : Ok(result);
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransferController : ControllerBase
{
    private readonly ITransferService _transferService;
    private readonly AppDbContext _db;
    public TransferController(ITransferService transferService, AppDbContext db)
    {
        _transferService = transferService;
        _db = db;
    }

    [HttpGet("freeagents")]
    public async Task<ActionResult<List<PlayerDto>>> GetFreeAgents() => Ok(await _transferService.GetFreeAgentsAsync());

    [HttpPost("offer")]
    public async Task<ActionResult<TransferDto>> CreateOffer(CreateTransferOfferDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var manager = await _db.Managers.FirstOrDefaultAsync(m => m.UserId == userId && m.CurrentTeamId != null);
        if (manager == null) return BadRequest("No manager with a team found");
        var result = await _transferService.CreateOfferAsync(manager.Id, dto);
        return result == null ? BadRequest("Failed to create offer") : Ok(result);
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    public NotificationController(INotificationService notificationService) => _notificationService = notificationService;

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetUnread()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return Ok(await _notificationService.GetUnreadAsync(userId));
    }

    [HttpPost("{id}/read")]
    public async Task<ActionResult> MarkAsRead(Guid id)
    {
        await _notificationService.MarkAsReadAsync(id);
        return Ok();
    }

    [HttpPost("read-all")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok();
    }
}

[ApiController]
[Route("api/[controller]")]
public class DataController : ControllerBase
{
    private readonly AppDbContext _db;
    public DataController(AppDbContext db) => _db = db;

    [HttpGet("countries")]
    public async Task<ActionResult<List<CountryDto>>> GetCountries() => Ok((await _db.Countries.ToListAsync()).Select(c => new CountryDto(c.Code, c.Name, c.Currency, c.ExchangeRateToEur, c.PrimaryLanguage)));

    [HttpGet("leagues")]
    public async Task<ActionResult<List<LeagueDto>>> GetLeagues() => Ok((await _db.Leagues.Include(l => l.Country).ToListAsync()).Select(l => new LeagueDto(l.Id, l.Name, l.CountryCode, l.Country.Name, l.Tier, l.MaxTeams, l.PromotionSpots, l.RelegationSpots)));

    [HttpGet("teams/{leagueId}")]
    public async Task<ActionResult<List<TeamDto>>> GetTeams(Guid leagueId) => Ok((await _db.Teams.Include(t => t.League).Include(t => t.Manager).Where(t => t.LeagueId == leagueId).ToListAsync()).Select(t => new TeamDto(t.Id, t.Name, t.ShortName, t.LeagueId, t.League.Name, t.PrimaryColor, t.SecondaryColor, t.StadiumCapacity, t.StadiumName, t.WageBudget, t.TransferBudget, t.TotalBalance, t.FanLoyalty, t.FanMood, t.ManagerId, t.Manager?.Name)));

    [HttpGet("players/{teamId}")]
    public async Task<ActionResult<List<PlayerSummaryDto>>> GetPlayers(Guid teamId) => Ok((await _db.Players.Where(p => p.TeamId == teamId).ToListAsync()).Select(p => new PlayerSummaryDto(p.Id, $"{p.FirstName} {p.LastName}", p.PrimaryPosition.ToString(), (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6, p.Age, p.MarketValue, p.Morale, p.Fitness)));
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICompetitionService _competitionService;
    private readonly IFixtureService _fixtureService;
    private readonly IMatchService _matchService;
    private readonly ITeamService _teamService;
    private readonly IPlayerService _playerService;
    private readonly ISimulationService _simulationService;

    public GameController(
        AppDbContext db,
        ICompetitionService competitionService,
        IFixtureService fixtureService,
        IMatchService matchService,
        ITeamService teamService,
        IPlayerService playerService,
        ISimulationService simulationService)
    {
        _db = db;
        _competitionService = competitionService;
        _fixtureService = fixtureService;
        _matchService = matchService;
        _teamService = teamService;
        _playerService = playerService;
        _simulationService = simulationService;
    }

    [HttpPost("leagueinstance/{instanceId}/advance")]
    public async Task<ActionResult<SimulationResult>> AdvanceDay(Guid instanceId, [FromQuery] bool simulateOwn = false)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _simulationService.AdvanceDayAsync(instanceId, userId, simulateOwn);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("leagueinstance/{instanceId}/advance-until-match")]
    public async Task<ActionResult<SimulationResult>> AdvanceUntilMatch(Guid instanceId, [FromQuery] bool simulateOwn = false)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _simulationService.AdvanceUntilPlayerMatchAsync(instanceId, userId, simulateOwn);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("leagueinstance/{instanceId}/teams")]
    public async Task<ActionResult<List<LeagueTeamDto>>> GetLeagueInstanceTeams(Guid instanceId)
    {
        var teams = await _db.LeagueTeamInstances
            .Include(t => t.BaseTeam)
            .Include(t => t.Manager)
            .Where(t => t.LeagueInstanceId == instanceId)
            .ToListAsync();

        return Ok(teams.Select(t => new LeagueTeamDto(
            t.Id,
            t.BaseTeamId,
            t.BaseTeam.Name,
            t.BaseTeam.ShortName,
            t.BaseTeam.PrimaryColor,
            t.BaseTeam.SecondaryColor,
            t.IsControlledByPlayer,
            t.ManagerId,
            t.Manager?.Name
        )));
    }

    [HttpGet("leagueinstance/{instanceId}/competitions")]
    public async Task<ActionResult<List<CompetitionSummaryDto>>> GetCompetitions(Guid instanceId)
    {
        return Ok(await _competitionService.GetLeagueCompetitionsAsync(instanceId));
    }

    [HttpGet("competition/{competitionId}")]
    public async Task<ActionResult<CompetitionDto>> GetCompetition(Guid competitionId)
    {
        var result = await _competitionService.GetCompetitionAsync(competitionId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("competition/{competitionId}/standings")]
    public async Task<ActionResult<List<LeagueTeamInstanceDto>>> GetStandings(Guid competitionId)
    {
        return Ok(await _competitionService.GetStandingsAsync(competitionId));
    }

    [HttpGet("competition/{competitionId}/fixtures")]
    public async Task<ActionResult<List<FixtureDto>>> GetFixtures(Guid competitionId)
    {
        return Ok(await _fixtureService.GetFixturesAsync(competitionId));
    }

    [HttpGet("leagueinstance/{id}/fixtures")]
    public async Task<IActionResult> GetLeagueFixtures(Guid id)
    {
        var competitions = await _db.Competitions
            .Where(c => c.LeagueInstanceId == id)
            .Select(c => c.Id)
            .ToListAsync();

        var fixtures = await _db.Fixtures
            .Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.Match)
            .Where(f => competitions.Contains(f.CompetitionId))
            .OrderBy(f => f.MatchDay).ThenBy(f => f.ScheduledDate)
            .Select(f => new
            {
                f.Id,
                f.CompetitionId,
                HomeTeamId = f.HomeTeamId,
                HomeTeamName = f.HomeTeam.BaseTeam.Name,
                HomeTeamColors = f.HomeTeam.BaseTeam.PrimaryColor,
                AwayTeamId = f.AwayTeamId,
                AwayTeamName = f.AwayTeam.BaseTeam.Name,
                AwayTeamColors = f.AwayTeam.BaseTeam.PrimaryColor,
                f.ScheduledDate,
                f.MatchDay,
                Status = f.Status.ToString(),
                Match = f.Match == null ? null : new
                {
                    f.Match.Id,
                    f.Match.HomeScore,
                    f.Match.AwayScore
                }
            })
            .ToListAsync();

        return Ok(fixtures);
    }

    [HttpGet("leagueinstance/{instanceId}/fixtures/grouped")]
    public async Task<ActionResult> GetFixturesGroupedByWeek(Guid instanceId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        Guid? userTeamInstanceId = null;
        var manager = await _db.Managers
            .FirstOrDefaultAsync(m => m.UserId == userId && m.LeagueInstanceId == instanceId);
        if (manager != null)
        {
            var teamInstance = await _db.LeagueTeamInstances
                .FirstOrDefaultAsync(t => t.LeagueInstanceId == instanceId && t.ManagerId == manager.Id);
            userTeamInstanceId = teamInstance?.Id;
        }

        var fixtures = await _db.Fixtures
            .Include(f => f.Competition)
            .Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.Match)
            .Where(f => f.Competition.LeagueInstanceId == instanceId)
            .OrderBy(f => f.ScheduledDate)
            .ToListAsync();

        var grouped = fixtures
            .GroupBy(f => f.MatchDay ?? GetWeekNumber(f.ScheduledDate))
            .Select(g => new
            {
                matchDay = g.Key,
                weekStart = g.Min(f => f.ScheduledDate).ToString("yyyy-MM-dd"),
                fixtures = g.Select(f => new
                {
                    id = f.Id,
                    homeTeamId = f.HomeTeamId,
                    homeTeamName = f.HomeTeam.BaseTeam.Name,
                    homeTeamColor = f.HomeTeam.BaseTeam.PrimaryColor,
                    awayTeamId = f.AwayTeamId,
                    awayTeamName = f.AwayTeam.BaseTeam.Name,
                    awayTeamColor = f.AwayTeam.BaseTeam.PrimaryColor,
                    scheduledDate = f.ScheduledDate.ToString("yyyy-MM-dd"),
                    status = f.Status.ToString(),
                    homeScore = f.Match?.HomeScore,
                    awayScore = f.Match?.AwayScore,
                    matchId = f.Match?.Id,
                    involvesUser = userTeamInstanceId.HasValue &&
                        (f.HomeTeamId == userTeamInstanceId || f.AwayTeamId == userTeamInstanceId)
                }).ToList()
            })
            .OrderBy(g => g.matchDay)
            .ToList();

        return Ok(new { userTeamInstanceId, weeks = grouped });
    }

    private static int GetWeekNumber(DateTime date)
    {
        var startOfYear = new DateTime(date.Year, 1, 1);
        return (date - startOfYear).Days / 7 + 1;
    }

    [HttpGet("leagueinstance/{instanceId}/fixtures/upcoming")]
    public async Task<ActionResult<List<FixtureDto>>> GetUpcomingFixtures(Guid instanceId, [FromQuery] int count = 10)
    {
        var instance = await _db.LeagueInstances.FindAsync(instanceId);
        if (instance == null) return NotFound();

        var fixtures = await _db.Fixtures
            .Include(f => f.Competition)
            .Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.Match)
            .Where(f => f.Competition.LeagueInstanceId == instanceId && f.Status == Entities.FixtureStatus.Scheduled)
            .OrderBy(f => f.ScheduledDate)
            .Take(count)
            .ToListAsync();

        return Ok(fixtures.Select(f => new FixtureDto(
            f.Id, f.CompetitionId, f.Competition.Name,
            f.HomeTeamId, f.HomeTeam.BaseTeam.Name, f.HomeTeam.BaseTeam.PrimaryColor,
            f.AwayTeamId, f.AwayTeam.BaseTeam.Name, f.AwayTeam.BaseTeam.PrimaryColor,
            f.ScheduledDate, f.MatchDay, f.Round, f.Status.ToString(),
            f.Match == null ? null : new MatchSummaryDto(f.Match.Id, f.Match.HomeScore, f.Match.AwayScore, f.Match.Status.ToString())
        )));
    }

    [HttpGet("leagueinstance/{instanceId}/results")]
    public async Task<ActionResult<List<FixtureDto>>> GetResults(Guid instanceId, [FromQuery] int count = 10)
    {
        var fixtures = await _db.Fixtures
            .Include(f => f.Competition)
            .Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.Match)
            .Where(f => f.Competition.LeagueInstanceId == instanceId && f.Status == Entities.FixtureStatus.Completed)
            .OrderByDescending(f => f.ScheduledDate)
            .Take(count)
            .ToListAsync();

        return Ok(fixtures.Select(f => new FixtureDto(
            f.Id, f.CompetitionId, f.Competition.Name,
            f.HomeTeamId, f.HomeTeam.BaseTeam.Name, f.HomeTeam.BaseTeam.PrimaryColor,
            f.AwayTeamId, f.AwayTeam.BaseTeam.Name, f.AwayTeam.BaseTeam.PrimaryColor,
            f.ScheduledDate, f.MatchDay, f.Round, f.Status.ToString(),
            f.Match == null ? null : new MatchSummaryDto(f.Match.Id, f.Match.HomeScore, f.Match.AwayScore, f.Match.Status.ToString())
        )));
    }

    [HttpGet("leagueinstance/{instanceId}/myteam")]
    public async Task<ActionResult> GetMyTeam(Guid instanceId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var manager = await _db.Managers
            .FirstOrDefaultAsync(m => m.UserId == userId && m.LeagueInstanceId == instanceId);

        if (manager == null) return NotFound(new { message = "You don't have a manager in this league" });

        var teamInstance = await _db.LeagueTeamInstances
            .Include(t => t.BaseTeam).ThenInclude(b => b.Players)
            .Include(t => t.BaseTeam).ThenInclude(b => b.Staff)
            .Include(t => t.Manager)
            .FirstOrDefaultAsync(t => t.LeagueInstanceId == instanceId && t.ManagerId == manager.Id);

        if (teamInstance == null) return NotFound(new { message = "No team assigned" });

        var baseTeam = teamInstance.BaseTeam;

        return Ok(new
        {
            teamInstanceId = teamInstance.Id,
            baseTeamId = teamInstance.BaseTeamId,
            name = baseTeam.Name,
            shortName = baseTeam.ShortName,
            primaryColor = baseTeam.PrimaryColor,
            secondaryColor = baseTeam.SecondaryColor,
            stadiumName = baseTeam.StadiumName,
            stadiumCapacity = baseTeam.StadiumCapacity,
            wageBudget = baseTeam.WageBudget,
            transferBudget = baseTeam.TransferBudget,
            totalBalance = baseTeam.TotalBalance,
            fanLoyalty = baseTeam.FanLoyalty,
            fanMood = baseTeam.FanMood,
            managerName = manager.Name,
            standings = new
            {
                points = teamInstance.Points,
                played = teamInstance.Wins + teamInstance.Draws + teamInstance.Losses,
                wins = teamInstance.Wins,
                draws = teamInstance.Draws,
                losses = teamInstance.Losses,
                goalsFor = teamInstance.GoalsFor,
                goalsAgainst = teamInstance.GoalsAgainst,
                goalDifference = teamInstance.GoalsFor - teamInstance.GoalsAgainst
            },
            squad = baseTeam.Players.Select(p => new PlayerSummaryDto(
                p.Id,
                $"{p.FirstName} {p.LastName}",
                p.PrimaryPosition.ToString(),
                (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6,
                p.Age,
                p.MarketValue,
                p.Morale,
                p.Fitness
            )).ToList()
        });
    }

    [HttpGet("leagueinstance/{instanceId}/myfixtures")]
    public async Task<ActionResult<List<FixtureDto>>> GetMyFixtures(Guid instanceId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var manager = await _db.Managers
            .FirstOrDefaultAsync(m => m.UserId == userId && m.LeagueInstanceId == instanceId);

        if (manager == null) return NotFound();

        var teamInstance = await _db.LeagueTeamInstances
            .FirstOrDefaultAsync(t => t.LeagueInstanceId == instanceId && t.ManagerId == manager.Id);

        if (teamInstance == null) return NotFound();

        var fixtures = await _db.Fixtures
            .Include(f => f.Competition)
            .Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam)
            .Include(f => f.Match)
            .Where(f => f.Competition.LeagueInstanceId == instanceId &&
                       (f.HomeTeamId == teamInstance.Id || f.AwayTeamId == teamInstance.Id))
            .OrderBy(f => f.ScheduledDate)
            .ToListAsync();

        return Ok(fixtures.Select(f => new FixtureDto(
            f.Id, f.CompetitionId, f.Competition.Name,
            f.HomeTeamId, f.HomeTeam.BaseTeam.Name, f.HomeTeam.BaseTeam.PrimaryColor,
            f.AwayTeamId, f.AwayTeam.BaseTeam.Name, f.AwayTeam.BaseTeam.PrimaryColor,
            f.ScheduledDate, f.MatchDay, f.Round, f.Status.ToString(),
            f.Match == null ? null : new MatchSummaryDto(f.Match.Id, f.Match.HomeScore, f.Match.AwayScore, f.Match.Status.ToString())
        )));
    }

    [HttpGet("team/{teamInstanceId}/detail")]
    public async Task<ActionResult> GetTeamInstanceDetail(Guid teamInstanceId)
    {
        var teamInstance = await _db.LeagueTeamInstances
            .Include(t => t.BaseTeam).ThenInclude(b => b.Players)
            .Include(t => t.BaseTeam).ThenInclude(b => b.Staff)
            .Include(t => t.Manager)
            .FirstOrDefaultAsync(t => t.Id == teamInstanceId);

        if (teamInstance == null) return NotFound();

        var baseTeam = teamInstance.BaseTeam;

        return Ok(new
        {
            teamInstanceId = teamInstance.Id,
            baseTeamId = baseTeam.Id,
            name = baseTeam.Name,
            shortName = baseTeam.ShortName,
            primaryColor = baseTeam.PrimaryColor,
            secondaryColor = baseTeam.SecondaryColor,
            stadiumName = baseTeam.StadiumName,
            stadiumCapacity = baseTeam.StadiumCapacity,
            wageBudget = baseTeam.WageBudget,
            transferBudget = baseTeam.TransferBudget,
            totalBalance = baseTeam.TotalBalance,
            fanLoyalty = baseTeam.FanLoyalty,
            fanMood = baseTeam.FanMood,
            isControlledByPlayer = teamInstance.IsControlledByPlayer,
            managerName = teamInstance.Manager?.Name,
            standings = new
            {
                points = teamInstance.Points,
                played = teamInstance.Wins + teamInstance.Draws + teamInstance.Losses,
                wins = teamInstance.Wins,
                draws = teamInstance.Draws,
                losses = teamInstance.Losses,
                goalsFor = teamInstance.GoalsFor,
                goalsAgainst = teamInstance.GoalsAgainst,
                goalDifference = teamInstance.GoalsFor - teamInstance.GoalsAgainst
            },
            squad = baseTeam.Players
                .OrderBy(p => GetPositionOrder(p.PrimaryPosition.ToString()))
                .Select(p => new
                {
                    id = p.Id,
                    firstName = p.FirstName,
                    lastName = p.LastName,
                    fullName = $"{p.FirstName} {p.LastName}",
                    position = p.PrimaryPosition.ToString(),
                    secondaryPosition = p.SecondaryPosition?.ToString(),
                    age = p.Age,
                    nationality = p.Nationality,
                    pace = p.Pace,
                    shooting = p.Shooting,
                    passing = p.Passing,
                    dribbling = p.Dribbling,
                    defending = p.Defending,
                    physical = p.Physical,
                    overall = (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6,
                    potential = p.Potential,
                    morale = p.Morale,
                    fitness = p.Fitness,
                    form = p.Form,
                    marketValue = p.MarketValue
                }).ToList(),
            staff = baseTeam.Staff.Select(s => new StaffDto(s.Id, s.Name, s.Role, s.Ability)).ToList()
        });

    }

    private static int GetPositionOrder(string pos)
    {
        return pos switch
        {
            "GK" => 0,
            "CB" => 1,
            "LB" => 2,
            "RB" => 3,
            "LWB" => 4,
            "RWB" => 5,
            "CDM" => 6,
            "CM" => 7,
            "CAM" => 8,
            "LM" => 9,
            "RM" => 10,
            "LW" => 11,
            "RW" => 12,
            "CF" => 13,
            "ST" => 14,
            _ => 99
        };
    }

    [HttpPost("fixture/{fixtureId}/simulate")]
    public async Task<IActionResult> SimulateFixture(Guid fixtureId)
    {
        var result = await _simulationService.SimulateMatchAsync(fixtureId);
        if (result.FixtureId == Guid.Empty)
            return NotFound(new { message = "Fixture not found" });
        return Ok(result);
    }

    [HttpGet("player/{playerId}")]
    public async Task<ActionResult<PlayerDetailDto>> GetPlayer(Guid playerId)
    {
        var result = await _playerService.GetPlayerDetailAsync(playerId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("player/search")]
    public async Task<ActionResult<List<PlayerDto>>> SearchPlayers(
        [FromQuery] string? name,
        [FromQuery] string? position,
        [FromQuery] int? minOverall,
        [FromQuery] int? maxAge,
        [FromQuery] decimal? maxValue,
        [FromQuery] int limit = 50)
    {
        return Ok(await _playerService.SearchPlayersAsync(name, position, minOverall, maxAge, maxValue, limit));
    }
}


