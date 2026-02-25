using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IronLeague.DTOs;
using IronLeague.Services;

namespace IronLeague.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InstructionController : ControllerBase
{
    private readonly IInGameInstructionService _instructionService;
    public InstructionController(IInGameInstructionService instructionService) => _instructionService = instructionService;

    [HttpGet]
    public async Task<ActionResult<List<InGameInstructionDto>>> GetAll() =>
        Ok(await _instructionService.GetAllInstructionsAsync());

    [HttpGet("available")]
    public async Task<ActionResult<List<InGameInstructionDto>>> GetAvailable([FromQuery] int reputation = 0) =>
        Ok(await _instructionService.GetAvailableInstructionsAsync(reputation));

    [HttpPost("seed")]
    public async Task<ActionResult> Seed()
    {
        await _instructionService.SeedDefaultInstructionsAsync();
        return Ok();
    }
}