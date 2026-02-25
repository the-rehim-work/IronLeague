using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class VoteController : ControllerBase
{
    private readonly IVoteService _voteService;
    public VoteController(IVoteService voteService) => _voteService = voteService;

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("skip")]
    public async Task<ActionResult<VoteResult>> Skip([FromBody] VoteSkipDto dto) =>
        Ok(await _voteService.VoteToSkipAsync(dto.LeagueInstanceId, UserId()));

    [HttpGet("status/{leagueInstanceId}")]
    public async Task<ActionResult<VoteResult>> Status(Guid leagueInstanceId) =>
        Ok(await _voteService.GetVoteStatusAsync(leagueInstanceId));
}