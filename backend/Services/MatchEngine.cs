using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using IronLeague.Data;
using IronLeague.DTOs;
using IronLeague.Entities;

namespace IronLeague.Services;

public interface IMatchEngine
{
    Task<Match> CreateMatchAsync(Guid fixtureId);
    Task<MatchState> ProcessTickAsync(Match match, GovernanceSettings governance);
    Task ApplySpeechAsync(Match match, Speech speech, GovernanceSettings governance);
    float CalculateInfluence(float baseValue, float weight, CurveType curve, CombinationMethod method, float context);
}

public class MatchEngine : IMatchEngine
{
    private readonly AppDbContext _db;
    private readonly Random _rng = new();

    public MatchEngine(AppDbContext db) => _db = db;

    public async Task<Match> CreateMatchAsync(Guid fixtureId)
    {
        var fixture = await _db.Fixtures
            .Include(f => f.HomeTeam).ThenInclude(t => t.BaseTeam).ThenInclude(t => t.Players)
            .Include(f => f.AwayTeam).ThenInclude(t => t.BaseTeam).ThenInclude(t => t.Players)
            .FirstOrDefaultAsync(f => f.Id == fixtureId) ?? throw new Exception("Fixture not found");

        var match = new Match
        {
            Id = Guid.NewGuid(),
            FixtureId = fixtureId,
            RngSeed = DateTime.UtcNow.Ticks,
            Weather = (WeatherType)_rng.Next(0, 8),
            Attendance = (int)(fixture.HomeTeam.BaseTeam.StadiumCapacity * (0.6 + _rng.NextDouble() * 0.4)),
            HomeFormation = "4-4-2",
            AwayFormation = "4-4-2",
            Status = MatchStatus.NotStarted
        };

        var initialState = new MatchState
        {
            Id = Guid.NewGuid(),
            MatchId = match.Id,
            Tick = 0,
            BallX = 50f,
            BallY = 50f,
            IsHomeTeamPossession = _rng.Next(2) == 0,
            HomeMomentum = 50f,
            AwayMomentum = 50f
        };

        var positions = InitializePlayerPositions(fixture.HomeTeam.BaseTeam.Players.ToList(), fixture.AwayTeam.BaseTeam.Players.ToList());
        initialState.PlayerPositionsJson = JsonSerializer.Serialize(positions);

        match.States.Add(initialState);
        match.Events.Add(new MatchEvent
        {
            Id = Guid.NewGuid(),
            MatchId = match.Id,
            Tick = 0,
            Type = MatchEventType.KickOff,
            IsHomeTeam = initialState.IsHomeTeamPossession,
            Description = "Kick off!",
            IsKeyEvent = true
        });

        _db.Matches.Add(match);
        fixture.Status = FixtureStatus.InProgress;
        fixture.MatchId = match.Id;
        await _db.SaveChangesAsync();
        return match;
    }

    public async Task<MatchState> ProcessTickAsync(Match match, GovernanceSettings gov)
    {
        var prevState = match.States.OrderByDescending(s => s.Tick).First();
        var newTick = prevState.Tick + 1;
        var positions = JsonSerializer.Deserialize<Dictionary<Guid, PlayerPositionDto>>(prevState.PlayerPositionsJson) ?? new();

        var ballX = prevState.BallX;
        var ballY = prevState.BallY;
        var isHome = prevState.IsHomeTeamPossession;
        var homeMomentum = prevState.HomeMomentum;
        var awayMomentum = prevState.AwayMomentum;

        var actionRoll = GenerateRng(gov.RngChaosWeight);
        var crowdEffect = CalculateInfluence(isHome ? 60 : 40, gov.CrowdWeight, gov.CrowdCurve, gov.CrowdCombination, match.Attendance / 50000f);
        var pressureEffect = CalculateInfluence(isHome ? homeMomentum : awayMomentum, gov.PressureWeight, gov.PressureCurve, gov.PressureCombination, newTick / 5400f);
        var successChance = 0.5f + (crowdEffect - 50) / 200f + (pressureEffect - 50) / 200f;

        if (actionRoll < 0.6f)
        {
            var moveX = (isHome ? 1 : -1) * (2f + _rng.NextSingle() * 3f);
            var moveY = (_rng.NextSingle() - 0.5f) * 4f;
            ballX = Math.Clamp(ballX + moveX, 0, 100);
            ballY = Math.Clamp(ballY + moveY, 0, 100);

            if (_rng.NextSingle() > successChance)
            {
                isHome = !isHome;
                match.Events.Add(new MatchEvent { Id = Guid.NewGuid(), MatchId = match.Id, Tick = newTick, Type = MatchEventType.Interception, IsHomeTeam = isHome, PositionX = ballX, PositionY = ballY });
            }
        }
        else if (actionRoll < 0.9f)
        {
            if (_rng.NextSingle() < successChance + 0.2f)
            {
                ballX += (isHome ? 1 : -1) * (5f + _rng.NextSingle() * 10f);
                ballY += (_rng.NextSingle() - 0.5f) * 20f;
                ballX = Math.Clamp(ballX, 0, 100);
                ballY = Math.Clamp(ballY, 0, 100);
            }
            else isHome = !isHome;
        }
        else
        {
            var inShootingZone = isHome ? ballX > 75 : ballX < 25;
            if (inShootingZone)
            {
                match.Events.Add(new MatchEvent { Id = Guid.NewGuid(), MatchId = match.Id, Tick = newTick, Type = MatchEventType.Shot, IsHomeTeam = isHome, PositionX = ballX, PositionY = ballY, IsKeyEvent = true });

                if (_rng.NextSingle() < successChance * 0.3f)
                {
                    if (isHome) match.HomeScore++; else match.AwayScore++;
                    match.Events.Add(new MatchEvent { Id = Guid.NewGuid(), MatchId = match.Id, Tick = newTick, Type = MatchEventType.Goal, IsHomeTeam = isHome, Description = "GOAL!", PositionX = ballX, PositionY = ballY, IsKeyEvent = true, IsImportantEvent = true });
                    ballX = 50; ballY = 50; isHome = !isHome;
                    if (isHome) homeMomentum = Math.Min(100, homeMomentum + 15);
                    else awayMomentum = Math.Min(100, awayMomentum + 15);
                }
                else { isHome = !isHome; ballX = isHome ? 10 : 90; }
            }
        }

        if (_rng.NextSingle() < 0.005f)
        {
            var isHomeFoul = _rng.Next(2) == 0;
            match.Events.Add(new MatchEvent { Id = Guid.NewGuid(), MatchId = match.Id, Tick = newTick, Type = MatchEventType.Foul, IsHomeTeam = isHomeFoul, PositionX = ballX, PositionY = ballY, IsKeyEvent = true });
            if (_rng.NextSingle() < 0.15f)
                match.Events.Add(new MatchEvent { Id = Guid.NewGuid(), MatchId = match.Id, Tick = newTick, Type = MatchEventType.YellowCard, IsHomeTeam = isHomeFoul, IsKeyEvent = true, IsImportantEvent = true });
        }

        homeMomentum = Math.Clamp(homeMomentum + (_rng.NextSingle() - 0.5f) * 2, 20, 80);
        awayMomentum = Math.Clamp(awayMomentum + (_rng.NextSingle() - 0.5f) * 2, 20, 80);
        UpdatePlayerPositions(positions, ballX, ballY, isHome);

        var newState = new MatchState
        {
            Id = Guid.NewGuid(),
            MatchId = match.Id,
            Tick = newTick,
            BallX = ballX,
            BallY = ballY,
            IsHomeTeamPossession = isHome,
            HomeMomentum = homeMomentum,
            AwayMomentum = awayMomentum,
            PlayerPositionsJson = JsonSerializer.Serialize(positions)
        };

        match.CurrentTick = newTick;

        if (newTick == 2700) { match.Status = MatchStatus.HalfTime; match.Events.Add(new MatchEvent { Id = Guid.NewGuid(), MatchId = match.Id, Tick = newTick, Type = MatchEventType.HalfTime, Description = "Half Time", IsKeyEvent = true, IsImportantEvent = true }); }
        else if (newTick == 5400) { match.Status = MatchStatus.Finished; match.Events.Add(new MatchEvent { Id = Guid.NewGuid(), MatchId = match.Id, Tick = newTick, Type = MatchEventType.FullTime, Description = "Full Time", IsKeyEvent = true, IsImportantEvent = true }); }
        else match.Status = newTick < 2700 ? MatchStatus.FirstHalf : MatchStatus.SecondHalf;

        var hasKeyEvent = match.Events.Any(e => e.Tick == newTick && e.IsKeyEvent);
        if (ShouldSnapshot(newTick, hasKeyEvent))
            match.States.Add(newState);

        if (newTick % 60 == 0 || hasKeyEvent || match.Status == MatchStatus.Finished)
            await _db.SaveChangesAsync();

        return newState;
    }

    public async Task ApplySpeechAsync(Match match, Speech speech, GovernanceSettings gov)
    {
        var effect = CalculateInfluence(50f, gov.SpeechWeight, gov.SpeechCurve, gov.SpeechCombination, 1f);
        var backfireChance = 0.1f + (100 - speech.Manager.Reputation) / 500f;

        if (_rng.NextSingle() < backfireChance)
        {
            speech.Backfired = true;
            speech.EffectStrength = -effect * 0.5f;
            speech.ResultDescription = "The speech backfired!";
        }
        else
        {
            speech.EffectStrength = effect;
            speech.ResultDescription = speech.Type switch
            {
                SpeechType.Motivational => "The team looks fired up!",
                SpeechType.Calm => "The players seem more composed.",
                SpeechType.Tactical => "Players acknowledge the tactical adjustments.",
                SpeechType.Aggressive => "The team's intensity has increased!",
                _ => "The speech had an effect."
            };
        }

        _db.Speeches.Add(speech);
        match.Events.Add(new MatchEvent { Id = Guid.NewGuid(), MatchId = match.Id, Tick = match.CurrentTick, Type = MatchEventType.Speech, Description = speech.ResultDescription, IsKeyEvent = true });
        await _db.SaveChangesAsync();
    }

    public float CalculateInfluence(float baseValue, float weight, CurveType curve, CombinationMethod method, float context)
    {
        var normalized = baseValue / 100f;
        var curved = curve switch
        {
            CurveType.Linear => normalized,
            CurveType.Diminishing => MathF.Sqrt(normalized),
            CurveType.Threshold => normalized < 0.3f ? 0 : (normalized - 0.3f) / 0.7f,
            CurveType.Exponential => normalized * normalized,
            _ => normalized
        };
        var weighted = curved * weight;
        return method switch
        {
            CombinationMethod.DirectOverride => weighted * 100f,
            CombinationMethod.AdditiveContribution => 50f + (weighted - 0.5f) * 20f,
            CombinationMethod.ConditionalGate => weighted > 0.5f ? baseValue : baseValue * 0.7f,
            CombinationMethod.VarianceControl => baseValue + (_rng.NextSingle() - 0.5f) * weighted * 40f,
            _ => baseValue
        };
    }

    private float GenerateRng(float chaosWeight) => Math.Clamp(_rng.NextSingle() + (_rng.NextSingle() - 0.5f) * chaosWeight, 0f, 1f);

    private Dictionary<Guid, PlayerPositionDto> InitializePlayerPositions(List<Player> home, List<Player> away)
    {
        var positions = new Dictionary<Guid, PlayerPositionDto>();
        var homePos = new[] { (5f, 50f), (15f, 15f), (15f, 38f), (15f, 62f), (15f, 85f), (35f, 20f), (35f, 40f), (35f, 60f), (35f, 80f), (45f, 35f), (45f, 65f) };
        var awayPos = new[] { (95f, 50f), (85f, 15f), (85f, 38f), (85f, 62f), (85f, 85f), (65f, 20f), (65f, 40f), (65f, 60f), (65f, 80f), (55f, 35f), (55f, 65f) };
        for (int i = 0; i < Math.Min(11, home.Count); i++) positions[home[i].Id] = new PlayerPositionDto(homePos[i].Item1, homePos[i].Item2, false);
        for (int i = 0; i < Math.Min(11, away.Count); i++) positions[away[i].Id] = new PlayerPositionDto(awayPos[i].Item1, awayPos[i].Item2, false);
        return positions;
    }

    private void UpdatePlayerPositions(Dictionary<Guid, PlayerPositionDto> positions, float ballX, float ballY, bool isHomePossession)
    {
        foreach (var kvp in positions.ToList())
            positions[kvp.Key] = new PlayerPositionDto(Math.Clamp(kvp.Value.X + (isHomePossession ? 2 : -2) + (_rng.NextSingle() - 0.5f) * 3, 0, 100), Math.Clamp(kvp.Value.Y + (_rng.NextSingle() - 0.5f) * 2, 0, 100), false);
    }

    private static bool ShouldSnapshot(int tick, bool hasKeyEvent)
    {
        if (tick == 0 || tick == 2700 || tick == 5400) return true;
        if (hasKeyEvent) return true;
        if (tick % 300 == 0) return true;
        return false;
    }
}