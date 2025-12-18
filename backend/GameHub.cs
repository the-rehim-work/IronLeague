using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using IronLeague.Services;
using IronLeague.DTOs;

namespace IronLeague.Hubs;

[Authorize]
public class MatchHub : Hub
{
    private readonly IMatchService _matchService;
    private readonly IMatchEngine _matchEngine;
    private static readonly Dictionary<Guid, CancellationTokenSource> _runningMatches = new();

    public MatchHub(IMatchService matchService, IMatchEngine matchEngine)
    {
        _matchService = matchService;
        _matchEngine = matchEngine;
    }

    public async Task JoinMatch(Guid matchId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"match_{matchId}");
        var match = await _matchService.GetMatchAsync(matchId);
        if (match != null) await Clients.Caller.SendAsync("MatchState", match);
    }

    public async Task LeaveMatch(Guid matchId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"match_{matchId}");
    }

    public async Task StartMatch(StartMatchDto dto)
    {
        var match = await _matchService.StartMatchAsync(dto);
        if (match == null) { await Clients.Caller.SendAsync("Error", "Failed to start match"); return; }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"match_{match.Id}");
        await Clients.Group($"match_{match.Id}").SendAsync("MatchStarted", match);

        var cts = new CancellationTokenSource();
        _runningMatches[match.Id] = cts;
        _ = RunMatchSimulation(match.Id, cts.Token);
    }

    public async Task PauseMatch(Guid matchId)
    {
        var userId = GetUserId();
        var manager = await GetManagerForUser(userId);
        if (manager == null) return;

        var success = await _matchService.PauseMatchAsync(matchId, manager.Id);
        if (success) await Clients.Group($"match_{matchId}").SendAsync("MatchPaused", manager.Id);
    }

    public async Task ResumeMatch(Guid matchId)
    {
        var userId = GetUserId();
        var manager = await GetManagerForUser(userId);
        if (manager == null) return;

        var success = await _matchService.ResumeMatchAsync(matchId, manager.Id);
        if (success) await Clients.Group($"match_{matchId}").SendAsync("MatchResumed");
    }

    public async Task GiveSpeech(SpeechDto dto)
    {
        var userId = GetUserId();
        var manager = await GetManagerForUser(userId);
        if (manager == null) return;

        var speech = await _matchService.GiveSpeechAsync(dto, manager.Id);
        if (speech != null)
        {
            await Clients.Group($"match_{dto.MatchId}").SendAsync("SpeechGiven", new
            {
                ManagerId = manager.Id,
                Type = speech.Type.ToString(),
                Backfired = speech.Backfired,
                Result = speech.ResultDescription
            });
        }
    }

    private async Task RunMatchSimulation(Guid matchId, CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested)
            {
                var match = await _matchService.GetMatchAsync(matchId);
                if (match == null || match.Status == "Finished") break;
                if (match.Status == "HalfTime") { await Task.Delay(15000, ct); continue; }

                await Task.Delay(1000, ct);
                await Clients.Group($"match_{matchId}").SendAsync("TickUpdate", match);
            }
        }
        finally
        {
            _runningMatches.Remove(matchId);
        }
    }

    private Guid GetUserId() => Guid.Parse(Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
    private Task<ManagerDto?> GetManagerForUser(Guid userId) => Task.FromResult<ManagerDto?>(null);

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}

public class NotificationHub : Hub
{
    public async Task JoinUserChannel(Guid userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }
}

public class LeagueHub : Hub
{
    public async Task JoinLeague(Guid leagueInstanceId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"league_{leagueInstanceId}");
    }

    public async Task LeaveLeague(Guid leagueInstanceId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"league_{leagueInstanceId}");
    }
}