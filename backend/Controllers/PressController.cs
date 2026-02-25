using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PressController : ControllerBase
{
    private readonly IPressService _pressService;
    public PressController(IPressService pressService) => _pressService = pressService;

    [HttpGet("league/{leagueInstanceId}")]
    public async Task<ActionResult<List<PressEventDto>>> GetForLeague(Guid leagueInstanceId, [FromQuery] int limit = 20) =>
        Ok(await _pressService.GetLeaguePressEventsAsync(leagueInstanceId, limit));

    [HttpPost("match/{matchId}/report")]
    public async Task<ActionResult<PressEventDto>> GenerateReport(Guid matchId)
    {
        var result = await _pressService.GenerateMatchReportAsync(matchId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost("scandal")]
    public async Task<ActionResult<PressEventDto>> GenerateScandal([FromBody] GenerateScandalDto dto)
    {
        var result = await _pressService.GenerateScandalAsync(dto.LeagueInstanceId, dto.ManagerId, dto.PlayerId);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpPost("rumor")]
    public async Task<ActionResult<PressEventDto>> GenerateRumor([FromBody] GenerateRumorDto dto)
    {
        var result = await _pressService.GenerateTransferRumorAsync(dto.PlayerId, dto.InterestedTeamId, dto.LeagueInstanceId);
        return result == null ? BadRequest() : Ok(result);
    }
}

public sealed record GenerateScandalDto(Guid LeagueInstanceId, Guid? ManagerId, Guid? PlayerId);
public sealed record GenerateRumorDto(Guid PlayerId, Guid? InterestedTeamId, Guid LeagueInstanceId);