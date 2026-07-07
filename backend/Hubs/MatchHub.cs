using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using IronLeague.Data;
using IronLeague.Services;
using IronLeague.DTOs;
using IronLeague.Entities;
using System.Collections.Concurrent;

namespace IronLeague.Hubs;

[Authorize]
public class MatchHub : Hub
{
    private readonly IMatchService _matchService;
    private readonly AppDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<MatchHub> _hubContext;

    // How many game-ticks to advance per broadcast step, and the real-time delay between
    // steps. 30 ticks (0.5 game-min) per ~550ms keeps a full 5400-tick match at ~90s of
    // wall-clock while still animating the ball smoothly.
    private const int TicksPerStep = 30;
    private const int StepDelayMs = 550;
    private const int HalfTimeBreakMs = 4000;

    private static readonly ConcurrentDictionary<Guid, CancellationTokenSource> _runningMatches = new();
    private static readonly ConcurrentDictionary<Guid, bool> _pausedMatches = new();
    private static readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, byte>> _matchConnections = new();

    public MatchHub(
        IMatchService matchService,
        AppDbContext db,
        IServiceScopeFactory scopeFactory,
        IHubContext<MatchHub> hubContext)
    {
        _matchService = matchService;
        _db = db;
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
    }

    public async Task JoinMatch(Guid matchId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"match_{matchId}");

        var connections = _matchConnections.GetOrAdd(matchId, _ => new ConcurrentDictionary<string, byte>());
        connections.TryAdd(Context.ConnectionId, 0);

        var match = await _matchService.GetMatchAsync(matchId);
        if (match != null)
        {
            await Clients.Caller.SendAsync("MatchState", new
            {
                Tick = match.CurrentTick,
                Minute = match.CurrentTick / 60,
                BallX = 50f,
                BallY = 50f,
                IsHomeTeamPossession = true,
                HomeMomentum = 50f,
                AwayMomentum = 50f,
                match.HomeScore,
                match.AwayScore,
                match.Status
            });
            await Clients.Caller.SendAsync("MatchInfo", new
            {
                HomeTeamName = match.HomeTeam.TeamName,
                AwayTeamName = match.AwayTeam.TeamName,
                HomeFormation = match.HomeTeam.Formation,
                AwayFormation = match.AwayTeam.Formation,
                Weather = match.Weather,
                Attendance = match.Attendance
            });

            // Auto-resume the live simulation for any match that isn't finished. This is
            // what makes the REST-created match actually tick — the first viewer to join
            // starts the loop, subsequent joiners are guarded out by TryAdd.
            if (match.Status != MatchStatus.Finished.ToString() &&
                match.Status != MatchStatus.Abandoned.ToString())
            {
                EnsureSimulationRunning(matchId);
            }
        }
    }

    public async Task LeaveMatch(Guid matchId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"match_{matchId}");

        if (_matchConnections.TryGetValue(matchId, out var conns))
        {
            conns.TryRemove(Context.ConnectionId, out _);
            if (conns.IsEmpty)
                _matchConnections.TryRemove(matchId, out _);
        }
    }

    public async Task StartMatch(StartMatchDto dto)
    {
        try
        {
            var match = await _matchService.StartMatchAsync(dto);
            if (match == null)
            {
                await Clients.Caller.SendAsync("Error", "Failed to start match");
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"match_{match.Id}");
            _matchConnections.GetOrAdd(match.Id, _ => new ConcurrentDictionary<string, byte>())
                .TryAdd(Context.ConnectionId, 0);

            await Clients.Group($"match_{match.Id}").SendAsync("MatchStarted", new { MatchId = match.Id });
            await Clients.Group($"match_{match.Id}").SendAsync("MatchInfo", new
            {
                HomeTeamName = match.HomeTeam.TeamName,
                AwayTeamName = match.AwayTeam.TeamName,
                HomeFormation = match.HomeTeam.Formation,
                AwayFormation = match.AwayTeam.Formation,
                Weather = match.Weather,
                Attendance = match.Attendance
            });

            EnsureSimulationRunning(match.Id);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", $"Failed to start match: {ex.Message}");
        }
    }

    public async Task PauseMatch(Guid matchId)
    {
        var userId = GetUserId();
        var manager = await GetManagerForUser(userId, matchId);
        if (manager == null)
        {
            await Clients.Caller.SendAsync("Error", "Manager not found or not authorized");
            return;
        }

        var success = await _matchService.PauseMatchAsync(matchId, manager.Id);
        if (success)
        {
            _pausedMatches[matchId] = true;
            await Clients.Group($"match_{matchId}").SendAsync("MatchPaused", new
            {
                ManagerId = manager.Id,
                ManagerName = manager.Name,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    public async Task ResumeMatch(Guid matchId)
    {
        var userId = GetUserId();
        var manager = await GetManagerForUser(userId, matchId);
        if (manager == null)
        {
            await Clients.Caller.SendAsync("Error", "Manager not found or not authorized");
            return;
        }

        var success = await _matchService.ResumeMatchAsync(matchId, manager.Id);
        if (success)
        {
            _pausedMatches[matchId] = false;
            await Clients.Group($"match_{matchId}").SendAsync("MatchResumed", new
            {
                ManagerId = manager.Id,
                ManagerName = manager.Name,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    public async Task GiveSpeech(SpeechDto dto)
    {
        var userId = GetUserId();
        var manager = await GetManagerForUser(userId, dto.MatchId);
        if (manager == null)
        {
            await Clients.Caller.SendAsync("Error", "Manager not found or not authorized");
            return;
        }

        var speech = await _matchService.GiveSpeechAsync(dto, manager.Id);
        if (speech != null)
        {
            await Clients.Caller.SendAsync("SpeechResult", new
            {
                Type = speech.Type.ToString(),
                Backfired = speech.Backfired,
                EffectStrength = speech.EffectStrength,
                Result = speech.ResultDescription
            });

            await Clients.OthersInGroup($"match_{dto.MatchId}").SendAsync("SpeechGiven", new
            {
                ManagerId = manager.Id,
                ManagerName = manager.Name,
                Type = speech.Type.ToString(),
                Target = speech.Target.ToString()
            });
        }
    }

    private void EnsureSimulationRunning(Guid matchId)
    {
        var cts = new CancellationTokenSource();
        if (_runningMatches.TryAdd(matchId, cts))
        {
            _ = RunMatchSimulation(matchId, cts.Token);
        }
        else
        {
            cts.Dispose();
        }
    }

    // Runs on a background task that outlives the hub invocation, so it must not touch the
    // hub's scoped services (_db, Clients). It creates its own DI scope and broadcasts via
    // the singleton IHubContext.
    private async Task RunMatchSimulation(Guid matchId, CancellationToken ct)
    {
        var group = _hubContext.Clients.Group($"match_{matchId}");
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var engine = scope.ServiceProvider.GetRequiredService<IMatchEngine>();

            var match = await db.Matches
                .Include(m => m.Events)
                .Include(m => m.States)
                .Include(m => m.Fixture)
                    .ThenInclude(f => f.Competition)
                    .ThenInclude(c => c.LeagueInstance)
                    .ThenInclude(l => l.Governance)
                .FirstOrDefaultAsync(m => m.Id == matchId, ct);

            if (match == null || match.Status == MatchStatus.Finished || match.Status == MatchStatus.Abandoned)
                return;

            var governance = match.Fixture.Competition.LeagueInstance.Governance ?? new GovernanceSettings();

            var current = match.States.OrderByDescending(s => s.Tick).FirstOrDefault();
            if (current == null)
            {
                current = engine.CreateInitialState(match);
                match.States.Add(current);
                await db.SaveChangesAsync(ct);
            }

            var sentEventIds = new HashSet<Guid>();

            while (!ct.IsCancellationRequested && match.Status != MatchStatus.Finished)
            {
                if (_pausedMatches.TryGetValue(matchId, out var paused) && paused)
                {
                    await Task.Delay(1000, ct);
                    continue;
                }

                for (int i = 0; i < TicksPerStep; i++)
                {
                    if (match.Status == MatchStatus.Finished) break;
                    current = engine.ProcessTick(match, current, governance);
                    if (match.Status == MatchStatus.HalfTime) break;
                }

                await db.SaveChangesAsync(ct);

                await group.SendAsync("MatchState", new
                {
                    Tick = current.Tick,
                    Minute = current.Tick / 60,
                    current.BallX,
                    current.BallY,
                    current.IsHomeTeamPossession,
                    current.HomeMomentum,
                    current.AwayMomentum,
                    match.HomeScore,
                    match.AwayScore,
                    Status = match.Status.ToString()
                }, ct);

                foreach (var evt in match.Events.Where(e => !sentEventIds.Contains(e.Id)).OrderBy(e => e.Tick).ThenBy(e => e.Id).ToList())
                {
                    sentEventIds.Add(evt.Id);
                    await group.SendAsync("MatchEvent", new
                    {
                        evt.Id,
                        evt.Tick,
                        evt.Minute,
                        Type = evt.Type.ToString(),
                        evt.IsHomeTeam,
                        evt.Description,
                        evt.IsKeyEvent,
                        evt.IsImportantEvent
                    }, ct);
                }

                if (match.Status == MatchStatus.Finished)
                {
                    await group.SendAsync("MatchEnded", new
                    {
                        match.HomeScore,
                        match.AwayScore,
                        Winner = match.HomeScore > match.AwayScore ? "Home" :
                                 match.AwayScore > match.HomeScore ? "Away" : "Draw"
                    }, ct);
                    break;
                }

                if (match.Status == MatchStatus.HalfTime)
                {
                    await Task.Delay(HalfTimeBreakMs, ct);
                    await group.SendAsync("SecondHalfStarted", ct);
                    continue;
                }

                await Task.Delay(StepDelayMs, ct);
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            await group.SendAsync("Error", $"Match simulation error: {ex.Message}");
        }
        finally
        {
            if (_runningMatches.TryRemove(matchId, out var cts))
                cts.Dispose();
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    private async Task<Manager?> GetManagerForUser(Guid userId, Guid matchId)
    {
        var match = await _db.Matches
            .Include(m => m.Fixture)
                .ThenInclude(f => f.HomeTeam)
            .Include(m => m.Fixture)
                .ThenInclude(f => f.AwayTeam)
            .FirstOrDefaultAsync(m => m.Id == matchId);

        if (match == null) return null;

        var manager = await _db.Managers
            .Include(m => m.CurrentTeam)
            .FirstOrDefaultAsync(m => m.UserId == userId &&
                (m.CurrentTeam != null &&
                 (m.CurrentTeam.Id == match.Fixture.HomeTeam.BaseTeamId ||
                  m.CurrentTeam.Id == match.Fixture.AwayTeam.BaseTeamId)));

        return manager;
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;

        foreach (var kvp in _matchConnections)
        {
            kvp.Value.TryRemove(connectionId, out _);
            if (kvp.Value.IsEmpty && _matchConnections.TryRemove(kvp.Key, out _))
            {
                if (_runningMatches.TryRemove(kvp.Key, out var cts))
                {
                    cts.Cancel();
                    cts.Dispose();
                }
                _pausedMatches.TryRemove(kvp.Key, out _);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }
}
