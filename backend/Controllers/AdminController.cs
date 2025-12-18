using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    public AdminController(IAdminService adminService) => _adminService = adminService;

    private bool IsAdmin() => User.FindFirst("IsAdmin")?.Value == "True";

    [HttpPost("seed")]
    public async Task<ActionResult> Seed()
    {
        if (!IsAdmin()) return Forbid();
        await _adminService.SeedInitialDataAsync();
        return Ok("Seeded");
    }

    [HttpPost("country")]
    public async Task<ActionResult> CreateCountry(AdminCreateCountryDto dto)
    {
        if (!IsAdmin()) return Forbid();
        return await _adminService.CreateCountryAsync(dto) ? Ok() : BadRequest();
    }

    [HttpPost("league")]
    public async Task<ActionResult> CreateLeague(CreateLeagueDto dto)
    {
        if (!IsAdmin()) return Forbid();
        return await _adminService.CreateLeagueAsync(dto) ? Ok() : BadRequest();
    }

    [HttpPost("team")]
    public async Task<ActionResult> CreateTeam(AdminCreateTeamDto dto)
    {
        if (!IsAdmin()) return Forbid();
        return await _adminService.CreateTeamAsync(dto) ? Ok() : BadRequest();
    }

    [HttpPost("player")]
    public async Task<ActionResult> CreatePlayer(AdminCreatePlayerDto dto)
    {
        if (!IsAdmin()) return Forbid();
        return await _adminService.CreatePlayerAsync(dto) ? Ok() : BadRequest();
    }
}