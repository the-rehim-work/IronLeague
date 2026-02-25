using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using IronLeague.Data;
using IronLeague.Services;
using IronLeague.DTOs;
using IronLeague.Entities;

namespace IronLeague.Hubs;

[Authorize]
public class MatchHub : Hub
{
    private readonly IMatchService _matchService;
    private readonly IMatchEngine _matchEngine;
    private readonly AppDbContext _db;
    private static readonly Dictionary<Guid, CancellationTokenSource> _runningMatches = new();
    private static readonly Dictionary<Guid, HashSet<string>> _matchConnections = new();

    public MatchHub(IMatchService matchService, IMatchEngine matchEngine, AppDbContext db)
    {
        _matchService = matchService;
        _matchEngine = matchEngine;
        _db = db;
    }

    public async Task JoinMatch(Guid matchId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"match_{matchId}");

        lock (_matchConnections)
        {
            if (!_matchConnections.ContainsKey(matchId))
                _matchConnections[matchId] = new HashSet<string>();
            _matchConnections[matchId].Add(Context.ConnectionId);
        }

        var match = await _matchService.GetMatchAsync(matchId);
        if (match != null)
            await Clients.Caller.SendAsync("MatchState", match);
    }

    public async Task LeaveMatch(Guid matchId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"match_{matchId}");

        lock (_matchConnections)
        {
            if (_matchConnections.ContainsKey(matchId))
            {
                _matchConnections[matchId].Remove(Context.ConnectionId);
                if (_matchConnections[matchId].Count == 0)
                    _matchConnections.Remove(matchId);
            }
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
            await Clients.Group($"match_{match.Id}").SendAsync("MatchStarted", match);

            var cts = new CancellationTokenSource();
            _runningMatches[match.Id] = cts;
            _ = RunMatchSimulation(match.Id, cts.Token);
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

    // TODO: Implement ChangeTactics when ITacticService is integrated
    // public async Task ChangeTactics(TacticalChangeDto dto) { }

    private async Task RunMatchSimulation(Guid matchId, CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested)
            {
                var match = await _db.Matches
                    .Include(m => m.Fixture)
                        .ThenInclude(f => f.Competition)
                        .ThenInclude(c => c.LeagueInstance)
                        .ThenInclude(l => l.Governance)
                    .FirstOrDefaultAsync(m => m.Id == matchId, ct);

                if (match == null || match.Status == MatchStatus.Finished)
                    break;

                if (match.IsPaused)
                {
                    await Task.Delay(1000, ct);
                    continue;
                }

                if (match.Status == MatchStatus.HalfTime)
                {
                    await Task.Delay(5000, ct);
                    match.Status = MatchStatus.SecondHalf;
                    await _db.SaveChangesAsync(ct);
                    await Clients.Group($"match_{matchId}").SendAsync("SecondHalfStarted");
                    continue;
                }

                var governance = match.Fixture.Competition.LeagueInstance.Governance;
                var state = await _matchEngine.ProcessTickAsync(match, governance);

                await Clients.Group($"match_{matchId}").SendAsync("MatchState", new
                {
                    Tick = state.Tick,
                    Minute = state.Tick / 60,
                    BallX = state.BallX,
                    BallY = state.BallY,
                    IsHomeTeamPossession = state.IsHomeTeamPossession,
                    HomeMomentum = state.HomeMomentum,
                    AwayMomentum = state.AwayMomentum,
                    HomeScore = match.HomeScore,
                    AwayScore = match.AwayScore,
                    Status = match.Status.ToString()
                });

                var recentEvents = match.Events
                    .Where(e => e.Tick == state.Tick)
                    .OrderBy(e => e.Id)
                    .ToList();

                foreach (var evt in recentEvents)
                {
                    await Clients.Group($"match_{matchId}").SendAsync("MatchEvent", new
                    {
                        Id = evt.Id,
                        Tick = evt.Tick,
                        Minute = evt.Minute,
                        Type = evt.Type.ToString(),
                        IsHomeTeam = evt.IsHomeTeam,
                        Description = evt.Description,
                        IsKeyEvent = evt.IsKeyEvent,
                        IsImportantEvent = evt.IsImportantEvent
                    });
                }

                await Task.Delay(1000, ct);

                if (match.Status == MatchStatus.Finished)
                {
                    await Clients.Group($"match_{matchId}").SendAsync("MatchEnded", new
                    {
                        HomeScore = match.HomeScore,
                        AwayScore = match.AwayScore,
                        Winner = match.HomeScore > match.AwayScore ? "Home" :
                                 match.AwayScore > match.HomeScore ? "Away" : "Draw"
                    });
                    break;
                }
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            await Clients.Group($"match_{matchId}").SendAsync("Error", $"Match simulation error: {ex.Message}");
        }
        finally
        {
            _runningMatches.Remove(matchId);
            lock (_matchConnections)
            {
                _matchConnections.Remove(matchId);
            }
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
        string? connectionId = Context.ConnectionId;

        lock (_matchConnections)
        {
            foreach (var matchId in _matchConnections.Keys.ToList())
            {
                _matchConnections[matchId].Remove(connectionId);
                if (_matchConnections[matchId].Count == 0)
                {
                    _matchConnections.Remove(matchId);
                    if (_runningMatches.TryGetValue(matchId, out var cts))
                    {
                        cts.Cancel();
                        _runningMatches.Remove(matchId);
                    }
                }
            }
        }

        await base.OnDisconnectedAsync(exception);
    }
}
