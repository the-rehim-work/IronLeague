using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using IronLeague.Data;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TacticController : ControllerBase
{
    private readonly ITacticService _tacticService;
    private readonly AppDbContext _db;

    public TacticController(ITacticService tacticService, AppDbContext db)
    {
        _tacticService = tacticService;
        _db = db;
    }

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> OwnsTeamInstance(Guid teamInstanceId)
    {
        var userId = UserId();
        return await _db.LeagueTeamInstances
            .Include(t => t.Manager)
            .AnyAsync(t => t.Id == teamInstanceId && t.Manager != null && t.Manager.UserId == userId);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TacticDto>> Get(Guid id)
    {
        var result = await _tacticService.GetTacticAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("team/{teamInstanceId}")]
    public async Task<ActionResult<List<TacticDto>>> GetForTeam(Guid teamInstanceId) =>
        Ok(await _tacticService.GetTeamTacticsAsync(teamInstanceId));

    [HttpPost("team/{teamInstanceId}")]
    public async Task<ActionResult<TacticDto>> Create(Guid teamInstanceId, CreateTacticDto dto)
    {
        if (!await OwnsTeamInstance(teamInstanceId)) return Forbid();
        var result = await _tacticService.CreateTacticAsync(teamInstanceId, dto);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TacticDto>> Update(Guid id, CreateTacticDto dto)
    {
        var existing = await _tacticService.GetTacticAsync(id);
        if (existing == null) return NotFound();
        var result = await _tacticService.UpdateTacticAsync(id, dto);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        return await _tacticService.DeleteTacticAsync(id) ? Ok() : BadRequest();
    }

    [HttpPost("team/{teamInstanceId}/default/{tacticId}")]
    public async Task<ActionResult> SetDefault(Guid teamInstanceId, Guid tacticId)
    {
        if (!await OwnsTeamInstance(teamInstanceId)) return Forbid();
        return await _tacticService.SetDefaultTacticAsync(teamInstanceId, tacticId) ? Ok() : BadRequest();
    }
}