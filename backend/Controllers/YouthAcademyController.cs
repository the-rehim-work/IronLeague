using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class YouthAcademyController : ControllerBase
{
    private readonly IYouthAcademyService _youthService;
    public YouthAcademyController(IYouthAcademyService youthService) => _youthService = youthService;

    [HttpGet("team/{teamId}")]
    public async Task<ActionResult<YouthAcademyDto>> Get(Guid teamId)
    {
        var result = await _youthService.GetAcademyAsync(teamId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost("team/{teamId}")]
    public async Task<ActionResult<YouthAcademyDto>> Create(Guid teamId)
    {
        var result = await _youthService.CreateAcademyAsync(teamId);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpPost("{academyId}/upgrade")]
    public async Task<ActionResult> Upgrade(Guid academyId) =>
        await _youthService.UpgradeAcademyAsync(academyId) ? Ok() : BadRequest();

    [HttpPost("{academyId}/intake")]
    public async Task<ActionResult<List<YouthPlayerDto>>> Intake(Guid academyId) =>
        Ok(await _youthService.GenerateIntakeAsync(academyId));

    [HttpPost("promote/{youthPlayerId}")]
    public async Task<ActionResult<PlayerDto>> Promote(Guid youthPlayerId)
    {
        var result = await _youthService.PromoteYouthPlayerAsync(youthPlayerId);
        return result == null ? BadRequest() : Ok(result);
    }
}