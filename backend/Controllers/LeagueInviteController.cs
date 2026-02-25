using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LeagueInviteController : ControllerBase
{
    private readonly ILeagueInviteService _inviteService;
    public LeagueInviteController(ILeagueInviteService inviteService) => _inviteService = inviteService;

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("pending")]
    public async Task<ActionResult<List<LeagueInviteDto>>> GetPending() =>
        Ok(await _inviteService.GetPendingInvitesAsync(UserId()));

    [HttpPost]
    public async Task<ActionResult<LeagueInviteDto>> Send(SendLeagueInviteDto dto)
    {
        var result = await _inviteService.SendInviteAsync(UserId(), dto);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpPost("{id}/accept")]
    public async Task<ActionResult> Accept(Guid id) =>
        await _inviteService.AcceptInviteAsync(id, UserId()) ? Ok() : BadRequest();

    [HttpPost("{id}/decline")]
    public async Task<ActionResult> Decline(Guid id) =>
        await _inviteService.DeclineInviteAsync(id, UserId()) ? Ok() : BadRequest();

    [HttpDelete("{id}")]
    public async Task<ActionResult> Cancel(Guid id) =>
        await _inviteService.CancelInviteAsync(id, UserId()) ? Ok() : BadRequest();
}