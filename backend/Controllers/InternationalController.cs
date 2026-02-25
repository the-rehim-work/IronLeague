using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InternationalController : ControllerBase
{
    private readonly IInternationalService _internationalService;
    public InternationalController(IInternationalService internationalService) => _internationalService = internationalService;

    [HttpGet("teams")]
    public async Task<ActionResult<List<InternationalTeamDto>>> GetTeams() =>
        Ok(await _internationalService.GetTeamsAsync());

    [HttpGet("teams/{id}")]
    public async Task<ActionResult<InternationalTeamDto>> GetTeam(Guid id)
    {
        var result = await _internationalService.GetTeamAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("breaks")]
    public async Task<ActionResult<List<InternationalBreakDto>>> GetBreaks([FromQuery] int count = 5) =>
        Ok(await _internationalService.GetUpcomingBreaksAsync(count));

    [HttpGet("breaks/{id}/callups")]
    public async Task<ActionResult<List<InternationalCallDto>>> GetCallups(Guid id) =>
        Ok(await _internationalService.GetCallUpsForBreakAsync(id));

    [HttpPost("callup")]
    public async Task<ActionResult<InternationalCallDto>> CallUp([FromBody] CallUpDto dto)
    {
        var result = await _internationalService.CallUpPlayerAsync(dto.InternationalTeamId, dto.PlayerId, dto.BreakId);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpPost("breaks/{id}/process-return")]
    public async Task<ActionResult> ProcessReturn(Guid id)
    {
        await _internationalService.ProcessBreakReturnAsync(id);
        return Ok();
    }
}

public sealed record CallUpDto(Guid InternationalTeamId, Guid PlayerId, Guid BreakId);