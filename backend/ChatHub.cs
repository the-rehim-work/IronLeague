using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace IronLeague.Hubs;

[Authorize]
public class ChatHub : Hub
{
    public async Task JoinThread(Guid threadId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"chat_{threadId}");
    }

    public async Task LeaveThread(Guid threadId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"chat_{threadId}");
    }
}