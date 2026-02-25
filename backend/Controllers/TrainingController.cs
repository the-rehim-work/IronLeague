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
public class TrainingController : ControllerBase
{
    private readonly ITrainingService _trainingService;
    private readonly AppDbContext _db;

    public TrainingController(ITrainingService trainingService, AppDbContext db)
    {
        _trainingService = trainingService;
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

    [HttpGet("{sessionId}")]
    public async Task<ActionResult<TrainingSessionDto>> Get(Guid sessionId)
    {
        var result = await _trainingService.GetSessionAsync(sessionId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("team/{teamInstanceId}")]
    public async Task<ActionResult<List<TrainingSessionDto>>> GetForTeam(Guid teamInstanceId, [FromQuery] int limit = 10) =>
        Ok(await _trainingService.GetTeamSessionsAsync(teamInstanceId, limit));

    [HttpPost("team/{teamInstanceId}")]
    public async Task<ActionResult<TrainingSessionDto>> Create(Guid teamInstanceId, CreateTrainingSessionDto dto)
    {
        if (!await OwnsTeamInstance(teamInstanceId)) return Forbid();
        var result = await _trainingService.CreateSessionAsync(teamInstanceId, dto);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpPost("{sessionId}/process")]
    public async Task<ActionResult> Process(Guid sessionId)
    {
        await _trainingService.ProcessTrainingAsync(sessionId);
        return Ok();
    }
}