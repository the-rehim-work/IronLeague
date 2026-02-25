using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SaveController : ControllerBase
{
    private readonly ISaveExportService _saveService;
    public SaveController(ISaveExportService saveService) => _saveService = saveService;

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("export/{leagueInstanceId}")]
    public async Task<ActionResult<SaveExportDto>> Export(Guid leagueInstanceId)
    {
        var result = await _saveService.ExportLeagueAsync(leagueInstanceId, UserId());
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpPost("import")]
    public async Task<ActionResult> Import([FromBody] ImportSaveDto dto) =>
        await _saveService.ImportLeagueAsync(UserId(), dto) ? Ok() : BadRequest();

    [HttpGet("exports")]
    public async Task<ActionResult<List<SaveExportDto>>> GetExports() =>
        Ok(await _saveService.GetUserExportsAsync(UserId()));
}