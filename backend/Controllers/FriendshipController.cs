using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FriendshipController : ControllerBase
{
    private readonly IFriendshipService _friendshipService;
    public FriendshipController(IFriendshipService friendshipService) => _friendshipService = friendshipService;

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<FriendshipDto>>> GetFriends() =>
        Ok(await _friendshipService.GetFriendsAsync(UserId()));

    [HttpGet("pending")]
    public async Task<ActionResult<List<FriendshipDto>>> GetPending() =>
        Ok(await _friendshipService.GetPendingRequestsAsync(UserId()));

    [HttpPost("request")]
    public async Task<ActionResult<FriendshipDto>> SendRequest([FromBody] SendFriendRequestDto dto)
    {
        var result = await _friendshipService.SendRequestAsync(UserId(), dto.UserId);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpPost("{id}/accept")]
    public async Task<ActionResult> Accept(Guid id) =>
        await _friendshipService.AcceptRequestAsync(id, UserId()) ? Ok() : BadRequest();

    [HttpPost("{id}/decline")]
    public async Task<ActionResult> Decline(Guid id) =>
        await _friendshipService.DeclineRequestAsync(id, UserId()) ? Ok() : BadRequest();

    [HttpDelete("{id}")]
    public async Task<ActionResult> Remove(Guid id) =>
        await _friendshipService.RemoveFriendAsync(id, UserId()) ? Ok() : BadRequest();

    [HttpPost("block/{userId}")]
    public async Task<ActionResult> Block(Guid userId) =>
        await _friendshipService.BlockUserAsync(UserId(), userId) ? Ok() : BadRequest();
}