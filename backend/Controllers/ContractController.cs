using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ContractController : ControllerBase
{
    private readonly IContractService _contractService;
    public ContractController(IContractService contractService) => _contractService = contractService;

    [HttpGet("player/{playerId}")]
    public async Task<ActionResult<ContractDto>> Get(Guid playerId)
    {
        var result = await _contractService.GetContractAsync(playerId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ContractDto>> Create(CreateContractDto dto)
    {
        var result = await _contractService.CreateContractAsync(dto);
        return result == null ? BadRequest() : Ok(result);
    }

    [HttpDelete("player/{playerId}")]
    public async Task<ActionResult> Terminate(Guid playerId) =>
        await _contractService.TerminateContractAsync(playerId) ? Ok() : BadRequest();

    [HttpPut("player/{playerId}/extend")]
    public async Task<ActionResult> Extend(Guid playerId, [FromBody] ExtendContractDto dto) =>
        await _contractService.ExtendContractAsync(playerId, dto.AdditionalYears, dto.NewWage) ? Ok() : BadRequest();

    [HttpGet("team/{teamId}/expiring")]
    public async Task<ActionResult<List<ContractDto>>> GetExpiring(Guid teamId, [FromQuery] int monthsAhead = 6) =>
        Ok(await _contractService.GetExpiringContractsAsync(teamId, monthsAhead));
}

public sealed record ExtendContractDto(int AdditionalYears, decimal? NewWage);