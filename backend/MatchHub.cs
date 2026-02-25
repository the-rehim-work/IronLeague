using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using IronLeague.Data;
using IronLeague.Entities;
using IronLeague.Services;
using IronLeague.DTOs;

namespace IronLeague.Hubs;

[Authorize]
public class MatchHub : Hub
{
    private readonly IMatchService _matchService;
    private readonly IMatchEngine _matchEngine;
    private readonly AppDbContext _db;
    private static readonly Dictionary<Guid, CancellationTokenSource> _runningMatches = new();

    public MatchHub(IMatchService matchService, IMatchEngine matchEngine, AppDbContext db)
    {
        _matchService = matchService;
        _matchEngine = matchEngine;
        _db = db;
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
        var manager = await GetManagerForMatch(GetUserId(), matchId);
        if (manager == null) { await Clients.Caller.SendAsync("Error", "Not authorized"); return; }

        var success = await _matchService.PauseMatchAsync(matchId, manager.Id);
        if (success)
            await Clients.Group($"match_{matchId}").SendAsync("MatchPaused", new { ManagerId = manager.Id, ManagerName = manager.Name });
    }

    public async Task ResumeMatch(Guid matchId)
    {
        var manager = await GetManagerForMatch(GetUserId(), matchId);
        if (manager == null) { await Clients.Caller.SendAsync("Error", "Not authorized"); return; }

        var success = await _matchService.ResumeMatchAsync(matchId, manager.Id);
        if (success)
            await Clients.Group($"match_{matchId}").SendAsync("MatchResumed", new { ManagerId = manager.Id });
    }

    public async Task GiveSpeech(SpeechDto dto)
    {
        var manager = await GetManagerForMatch(GetUserId(), dto.MatchId);
        if (manager == null) { await Clients.Caller.SendAsync("Error", "Not authorized"); return; }

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

    private async Task RunMatchSimulation(Guid matchId, CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested)
            {
                var match = await _matchService.GetMatchAsync(matchId);
                if (match == null || match.Status == "Finished") break;

                if (match.Status == "HalfTime")
                {
                    await Task.Delay(15000, ct);
                    continue;
                }

                await Clients.Group($"match_{matchId}").SendAsync("TickUpdate", match);
                await Task.Delay(1000, ct);
            }

            var finalMatch = await _matchService.GetMatchAsync(matchId);
            if (finalMatch != null)
            {
                await Clients.Group($"match_{matchId}").SendAsync("MatchEnded", new
                {
                    finalMatch.HomeScore,
                    finalMatch.AwayScore,
                    Winner = finalMatch.HomeScore > finalMatch.AwayScore ? "Home" :
                             finalMatch.AwayScore > finalMatch.HomeScore ? "Away" : "Draw"
                });
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            await Clients.Group($"match_{matchId}").SendAsync("Error", $"Simulation error: {ex.Message}");
        }
        finally
        {
            _runningMatches.Remove(matchId);
        }
    }

    private Guid GetUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    private async Task<Manager?> GetManagerForMatch(Guid userId, Guid matchId)
    {
        if (userId == Guid.Empty) return null;

        var match = await _db.Matches
            .Include(m => m.Fixture).ThenInclude(f => f.HomeTeam)
            .Include(m => m.Fixture).ThenInclude(f => f.AwayTeam)
            .FirstOrDefaultAsync(m => m.Id == matchId);

        if (match == null) return null;

        return await _db.Managers
            .FirstOrDefaultAsync(m => m.UserId == userId &&
                (m.CurrentTeamId == match.Fixture.HomeTeam.BaseTeamId ||
                 m.CurrentTeamId == match.Fixture.AwayTeam.BaseTeamId));
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}