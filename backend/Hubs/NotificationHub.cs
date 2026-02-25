using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace IronLeague.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public async Task JoinUserChannel(Guid userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    public async Task LeaveUserChannel(Guid userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
    }
}
