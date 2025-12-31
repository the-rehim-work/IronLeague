using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace IronLeague.Hubs;

[Authorize]
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
