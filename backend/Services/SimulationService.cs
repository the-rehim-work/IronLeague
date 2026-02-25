using Microsoft.EntityFrameworkCore;
using IronLeague.Data;
using IronLeague.Entities;
using IronLeague.DTOs;

namespace IronLeague.Services;

public interface ISimulationService
{
    Task<SimulationResult> AdvanceDayAsync(Guid leagueInstanceId, Guid? userId, bool simulatePlayerMatches = false);
    Task<SimulationResult> AdvanceUntilPlayerMatchAsync(Guid leagueInstanceId, Guid userId, bool simulatePlayerMatches = false);
    Task<MatchSimResult> SimulateMatchAsync(Guid fixtureId);
}

public record SimulationResult(
    bool Success,
    DateTime NewDate,
    List<MatchSimResult> SimulatedMatches,
    FixtureDto? PlayerMatchUpcoming,
    string? Message
);

public record MatchSimResult(
    Guid FixtureId,
    Guid? MatchId,
    string HomeTeamName,
    string AwayTeamName,
    int HomeScore,
    int AwayScore,
    bool InvolvesPlayer
);

public class SimulationService : ISimulationService
{
    private readonly AppDbContext _db;
    private readonly ICompetitionService _competitionService;
    private readonly ITrainingService _trainingService;
    private readonly IPressService _pressService;
    private readonly IInternationalService _internationalService;
    private readonly Random _rng = new();

    public SimulationService(
        AppDbContext db,
        ICompetitionService competitionService,
        ITrainingService trainingService,
        IPressService pressService,
        IInternationalService internationalService)
    {
        _db = db;
        _competitionService = competitionService;
        _trainingService = trainingService;
        _pressService = pressService;
        _internationalService = internationalService;
    }

    public async Task<SimulationResult> AdvanceDayAsync(Guid leagueInstanceId, Guid? userId, bool simulatePlayerMatches = false)
    {
        var instance = await _db.LeagueInstances
            .Include(l => l.Teams)
            .Include(l => l.Governance)
            .FirstOrDefaultAsync(l => l.Id == leagueInstanceId);

        if (instance == null || instance.Status != LeagueStatus.Active)
            return new SimulationResult(false, DateTime.MinValue, new(), null, "League not found or not active");

        Guid? userTeamInstanceId = null;
        if (userId.HasValue)
        {
            var manager = await _db.Managers
                .FirstOrDefaultAsync(m => m.UserId == userId && m.LeagueInstanceId == leagueInstanceId);
            if (manager != null)
            {
                var teamInstance = await _db.LeagueTeamInstances
                    .FirstOrDefaultAsync(t => t.LeagueInstanceId == leagueInstanceId && t.ManagerId == manager.Id);
                userTeamInstanceId = teamInstance?.Id;
            }
        }

        var currentDate = instance.CurrentDate;

        var todaysFixtures = await _db.Fixtures
            .Include(f => f.Competition).ThenInclude(c => c.LeagueInstance).ThenInclude(l => l.Governance)
            .Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam).ThenInclude(t => t.Players)
            .Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam).ThenInclude(t => t.Players)
            .Include(f => f.Match)
            .Where(f => f.Competition.LeagueInstanceId == leagueInstanceId
                     && f.ScheduledDate.Date == currentDate.Date
                     && f.Status == FixtureStatus.Scheduled)
            .ToListAsync();

        var simulatedMatches = new List<MatchSimResult>();
        FixtureDto? playerMatchUpcoming = null;
        bool hasUnplayedPlayerMatch = false;

        foreach (var fixture in todaysFixtures)
        {
            var involvesPlayer = userTeamInstanceId.HasValue &&
                (fixture.HomeTeamId == userTeamInstanceId || fixture.AwayTeamId == userTeamInstanceId);

            if (involvesPlayer && !simulatePlayerMatches)
            {
                playerMatchUpcoming = MapFixture(fixture);
                hasUnplayedPlayerMatch = true;
                continue;
            }

            var result = await SimulateMatchInternalAsync(fixture, instance.Governance);
            simulatedMatches.Add(new MatchSimResult(
                fixture.Id,
                fixture.MatchId,
                fixture.HomeTeam.BaseTeam.Name,
                fixture.AwayTeam.BaseTeam.Name,
                result.HomeScore,
                result.AwayScore,
                involvesPlayer
            ));
        }

        await RunDailyProcessingAsync(instance, userTeamInstanceId, todaysFixtures);

        if (playerMatchUpcoming == null)
        {
            instance.CurrentDate = currentDate.AddDays(1);
        }

        await _db.SaveChangesAsync();

        var message = playerMatchUpcoming != null
            ? "Your match is ready to play!"
            : simulatedMatches.Count == 0
                ? "Day advanced. No matches today."
                : null;

        return new SimulationResult(
            true,
            instance.CurrentDate,
            simulatedMatches,
            playerMatchUpcoming,
            message
        );
    }

    private async Task RunDailyProcessingAsync(LeagueInstance instance, Guid? userTeamInstanceId, List<Fixture> todaysFixtures)
    {
        var playedTeamIds = todaysFixtures
            .Where(f => f.Status == FixtureStatus.Completed || f.Status == FixtureStatus.InProgress)
            .SelectMany(f => new[] { f.HomeTeamId, f.AwayTeamId })
            .ToHashSet();

        var aiTeams = instance.Teams
            .Where(t => !t.IsControlledByPlayer && !playedTeamIds.Contains(t.Id))
            .ToList();

        foreach (var team in aiTeams)
        {
            try
            {
                await _trainingService.CreateSessionAsync(team.Id, new CreateTrainingSessionDto("General", 50, null, null));
            }
            catch { }
        }

        if (_rng.NextDouble() < 0.05)
        {
            try
            {
                await _pressService.GenerateScandalAsync(instance.Id, null, null);
            }
            catch { }
        }

        var activeBreak = await _db.InternationalBreaks
            .FirstOrDefaultAsync(b => b.StartDate.Date == instance.CurrentDate.Date);

        if (activeBreak != null)
        {
            try
            {
                await _internationalService.ProcessBreakReturnAsync(activeBreak.Id);
            }
            catch { }
        }
    }
    
    public async Task<SimulationResult> AdvanceUntilPlayerMatchAsync(Guid leagueInstanceId, Guid userId, bool simulatePlayerMatches = false)
    {
        var allSimulated = new List<MatchSimResult>();
        SimulationResult lastResult;
        int daysAdvanced = 0;
        const int maxDays = 365;

        do
        {
            lastResult = await AdvanceDayAsync(leagueInstanceId, userId, simulatePlayerMatches);
            if (!lastResult.Success) break;

            allSimulated.AddRange(lastResult.SimulatedMatches);
            daysAdvanced++;

            if (lastResult.PlayerMatchUpcoming != null && !simulatePlayerMatches)
                break;

            if (daysAdvanced >= maxDays)
            {
                return new SimulationResult(true, lastResult.NewDate, allSimulated, null, "Season complete or max days reached");
            }

            var hasRemainingFixtures = await _db.Fixtures
                .Include(f => f.Competition)
                .AnyAsync(f => f.Competition.LeagueInstanceId == leagueInstanceId && f.Status == FixtureStatus.Scheduled);

            if (!hasRemainingFixtures)
            {
                return new SimulationResult(true, lastResult.NewDate, allSimulated, null, "All fixtures completed");
            }

        } while (true);

        return new SimulationResult(lastResult.Success, lastResult.NewDate, allSimulated, lastResult.PlayerMatchUpcoming, lastResult.Message);
    }

    public async Task<MatchSimResult> SimulateMatchAsync(Guid fixtureId)
    {
        var fixture = await _db.Fixtures
            .Include(f => f.Competition).ThenInclude(c => c.LeagueInstance).ThenInclude(l => l.Governance)
            .Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam).ThenInclude(t => t.Players)
            .Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam).ThenInclude(t => t.Players)
            .Include(f => f.Match)
            .FirstOrDefaultAsync(f => f.Id == fixtureId);

        if (fixture == null)
            return new MatchSimResult(Guid.Empty, Guid.Empty, "", "", 0, 0, false);

        if (fixture.Status == FixtureStatus.Completed && fixture.Match != null)
        {
            return new MatchSimResult(
                fixture.Id,
                fixture.Match.Id,
                fixture.HomeTeam.BaseTeam.Name,
                fixture.AwayTeam.BaseTeam.Name,
                fixture.Match.HomeScore,
                fixture.Match.AwayScore,
                false
            );
        }

        var governance = fixture.Competition.LeagueInstance.Governance ?? new GovernanceSettings();
        var result = await SimulateMatchInternalAsync(fixture, governance);
        await _db.SaveChangesAsync();

        return new MatchSimResult(fixture.Id, fixture.MatchId, fixture.HomeTeam.BaseTeam.Name, fixture.AwayTeam.BaseTeam.Name, result.HomeScore, result.AwayScore, false);
    }

    private async Task<(int HomeScore, int AwayScore)> SimulateMatchInternalAsync(Fixture fixture, GovernanceSettings? governance)
    {
        governance ??= new GovernanceSettings();

        var homePlayers = fixture.HomeTeam.BaseTeam.Players.ToList();
        var awayPlayers = fixture.AwayTeam.BaseTeam.Players.ToList();

        // STEP 1: Calculate base team strength (pure skill)
        var homeBaseStrength = CalculateTeamBaseStrength(homePlayers);
        var awayBaseStrength = CalculateTeamBaseStrength(awayPlayers);

        // STEP 2: Apply condition modifiers (morale, fitness, form) - GOVERNED
        var homeConditionMod = CalculateConditionModifier(homePlayers, governance);
        var awayConditionMod = CalculateConditionModifier(awayPlayers, governance);

        // STEP 3: Home advantage (crowd influence) - GOVERNED
        var crowdEffect = ApplyCurve(governance.CrowdWeight, governance.CrowdCurve);
        var homeAdvantage = 1.0f + (crowdEffect * 0.18f); // Up to 18% home boost based on governance

        // STEP 4: Weather impact - GOVERNED (more impact on away team)
        var weatherRoll = _rng.NextSingle();
        var weatherEffect = ApplyCurve(governance.WeatherWeight * weatherRoll, governance.WeatherCurve);
        var awayWeatherPenalty = 1.0f - (weatherEffect * 0.08f);

        // Calculate final strengths
        var homeStrength = homeBaseStrength * homeConditionMod * homeAdvantage;
        var awayStrength = awayBaseStrength * awayConditionMod * awayWeatherPenalty;

        // STEP 5: Apply RNG chaos (variance control) - GOVERNED
        if (governance.RngChaosWeight > 0)
        {
            var chaosRange = governance.RngChaosWeight * 0.35f;
            homeStrength *= 1.0f + (_rng.NextSingle() - 0.5f) * chaosRange;
            awayStrength *= 1.0f + (_rng.NextSingle() - 0.5f) * chaosRange;
        }

        // STEP 6: Normalize to win probability
        var totalStrength = Math.Max(homeStrength + awayStrength, 1f);
        var homeWinChance = homeStrength / totalStrength;

        // STEP 7: Generate goals
        var homeScore = GenerateGoals(homeWinChance, homeStrength, governance);
        var awayScore = GenerateGoals(1 - homeWinChance, awayStrength, governance);

        // STEP 8: Clutch/Pressure gate (conditional gate combination) - GOVERNED
        ApplyClutchFactor(ref homeScore, ref awayScore, homePlayers, awayPlayers, governance);

        // Create match record
        var match = new Match
        {
            Id = Guid.NewGuid(),
            FixtureId = fixture.Id,
            HomeScore = homeScore,
            AwayScore = awayScore,
            Status = MatchStatus.Finished,
            CurrentTick = 5400,
            TotalTicks = 5400,
            Weather = (WeatherType)_rng.Next(0, 8),
            Attendance = (int)(fixture.HomeTeam.BaseTeam.StadiumCapacity * (0.6 + _rng.NextDouble() * 0.4)),
            HomeFormation = "4-4-2",
            AwayFormation = "4-4-2"
        };

        _db.Matches.Add(match);
        fixture.MatchId = match.Id;
        fixture.Match = match;
        fixture.Status = FixtureStatus.Completed;

        UpdateStandings(fixture.HomeTeam, fixture.AwayTeam, homeScore, awayScore);

        return (homeScore, awayScore);
    }

    private void UpdateStandings(LeagueTeamInstance home, LeagueTeamInstance away, int homeScore, int awayScore)
    {
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
    }

    private float CalculateTeamBaseStrength(List<Player> players)
    {
        if (players.Count == 0) return 50f;

        var top11 = players
            .Select(p => (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6f)
            .OrderByDescending(x => x)
            .Take(11)
            .ToList();

        return (float)top11.Average();
    }

    private float CalculateConditionModifier(List<Player> players, GovernanceSettings gov)
    {
        if (players.Count == 0) return 1.0f;

        var top11 = players.OrderByDescending(p =>
            (p.Pace + p.Shooting + p.Passing + p.Dribbling + p.Defending + p.Physical) / 6f)
            .Take(11).ToList();

        var avgMorale = (float)top11.Average(p => p.Morale) / 100f;
        var avgFitness = (float)top11.Average(p => p.Fitness) / 100f;
        var avgForm = (float)top11.Average(p => p.Form) / 100f;

        var moraleCurved = ApplyCurve(avgMorale, gov.MoraleCurve);
        var formCurved = ApplyCurve(avgForm, gov.FormCurve);

        var moraleContrib = moraleCurved * gov.MoraleWeight * 0.12f;
        var fitnessContrib = avgFitness * 0.08f;
        var formContrib = formCurved * gov.FormWeight * 0.08f;

        return 1.0f + moraleContrib + fitnessContrib + formContrib - 0.14f;
    }

    private float ApplyCurve(float value, CurveType curve)
    {
        value = Math.Clamp(value, 0f, 1f);

        return curve switch
        {
            CurveType.Linear => value,
            CurveType.Diminishing => MathF.Sqrt(value),
            CurveType.Threshold => value < 0.4f ? value * 0.3f : 0.12f + (value - 0.4f) * 1.47f,
            CurveType.Exponential => value * value,
            CurveType.Soft => 0.3f + value * 0.4f,
            _ => value
        };
    }

    private int GenerateGoals(double winProb, float strength, GovernanceSettings gov)
    {
        // Expected goals: 0.8 base + strength contribution + win probability contribution
        var expectedGoals = 0.7 + (winProb * 1.2) + ((strength - 50) / 100.0 * 0.8);
        expectedGoals = Math.Clamp(expectedGoals, 0.3, 3.5);

        var goals = 0;

        // Poisson-like distribution
        for (int i = 0; i < 12; i++)
        {
            if (_rng.NextDouble() < expectedGoals / 12.0)
                goals++;
        }

        // Chaos outliers (variance control)
        if (gov.RngChaosWeight > 0.3f && _rng.NextDouble() < 0.06 * gov.RngChaosWeight)
        {
            goals += _rng.Next(1, 3);
        }

        // Defensive masterclass (rare low-scoring upset)
        if (_rng.NextDouble() < 0.03 && goals >= 3)
        {
            goals = _rng.Next(0, 2);
        }

        return Math.Clamp(goals, 0, 7);
    }

    private void ApplyClutchFactor(ref int homeScore, ref int awayScore, List<Player> homePlayers, List<Player> awayPlayers, GovernanceSettings gov)
    {
        // Threshold gate: morale under pressure can unlock clutch finishes
        if (gov.MoraleCurve != CurveType.Threshold) return;

        var homeMorale = homePlayers.Take(11).Average(p => p.Morale);
        var awayMorale = awayPlayers.Take(11).Average(p => p.Morale);

        // Close game + high morale = clutch goal chance
        if (Math.Abs(homeScore - awayScore) <= 1)
        {
            var clutchChance = 0.04 * gov.MoraleWeight * gov.PressureWeight;

            if (homeScore <= awayScore && homeMorale > 65 && _rng.NextDouble() < clutchChance)
            {
                homeScore++;
            }
            else if (awayScore <= homeScore && awayMorale > 65 && _rng.NextDouble() < clutchChance)
            {
                awayScore++;
            }
        }

        // Collapse gate: very low morale under pressure = defensive collapse
        if (homeMorale < 35 && homeScore <= awayScore && _rng.NextDouble() < 0.08 * gov.PressureWeight)
        {
            awayScore++;
        }
        if (awayMorale < 35 && awayScore <= homeScore && _rng.NextDouble() < 0.08 * gov.PressureWeight)
        {
            homeScore++;
        }
    }

    private static FixtureDto MapFixture(Fixture f) => new(
        f.Id, f.CompetitionId, f.Competition.Name,
        f.HomeTeamId, f.HomeTeam.BaseTeam.Name, f.HomeTeam.BaseTeam.PrimaryColor,
        f.AwayTeamId, f.AwayTeam.BaseTeam.Name, f.AwayTeam.BaseTeam.PrimaryColor,
        f.ScheduledDate, f.MatchDay, f.Round, f.Status.ToString(),
        f.Match == null ? null : new MatchSummaryDto(f.Match.Id, f.Match.HomeScore, f.Match.AwayScore, f.Match.Status.ToString())
    );

}