using IronLeague.Data;
using IronLeague.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace IronLeague.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public sealed class ChatController : ControllerBase
{
    private readonly AppDbContext _db;
    public ChatController(AppDbContext db) => _db = db;

    private Guid MeId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("threads")]
    public async Task<IActionResult> ListThreads()
    {
        var meId = MeId();

        var threads = await _db.DirectThreads
            .Include(t => t.Members).ThenInclude(m => m.User)
            .Include(t => t.Messages)
            .Where(t => t.Members.Any(m => m.UserId == meId))
            .ToListAsync();

        var dto = threads.Select(t =>
        {
            var other = t.Members.FirstOrDefault(m => m.UserId != meId)?.User;
            var last = t.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault();
            return new
            {
                id = t.Id,
                withUser = other?.UserName ?? "(unknown)",
                withDisplayName = other?.DisplayName ?? "(unknown)",
                lastMessage = last?.Content,
                lastMessageAt = last?.SentAt.ToString("o"),
                unread = t.Messages.Count(m => m.SenderId != meId && m.ReadAt == null),
                updatedAt = t.Messages.Max(m => (DateTime?)m.SentAt)?.ToString("o")
            };
        })
        .OrderByDescending(x => x.updatedAt)
        .ToList();

        return Ok(dto);
    }

    [HttpGet("threads/{withUserName}")]
    public async Task<IActionResult> GetThreadWith(string withUserName, [FromQuery] int take = 50, [FromQuery] int skip = 0)
    {
        var meId = MeId();
        var other = await _db.Users.FirstOrDefaultAsync(u => u.UserName == withUserName);
        if (other is null) return NotFound();

        var thread = await _db.DirectThreads
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Members.Count == 2 &&
                                      t.Members.Any(m => m.UserId == meId) &&
                                      t.Members.Any(m => m.UserId == other.Id));

        if (thread is null)
            return Ok(new { threadId = (Guid?)null, items = Array.Empty<object>() });

        var items = await _db.DirectMessages
            .Where(m => m.ThreadId == thread.Id)
            .OrderByDescending(m => m.SentAt)
            .Skip(skip).Take(take)
            .Select(m => new
            {
                m.Id,
                m.SenderId,
                senderName = m.Sender.UserName,
                m.Content,
                m.SentAt,
                m.ReadAt
            })
            .ToListAsync();

        return Ok(new { threadId = thread.Id, items = items.OrderBy(x => x.SentAt) });
    }

    [HttpPost("start")]
    public async Task<IActionResult> EnsureThread([FromBody] StartThreadDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.WithUserName)) return BadRequest();
        var meId = MeId();
        var other = await _db.Users.FirstOrDefaultAsync(u => u.UserName == dto.WithUserName);
        if (other is null) return NotFound();
        if (other.Id == meId) return BadRequest("Cannot start a thread with yourself");

        var thread = await _db.DirectThreads
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Members.Count == 2 &&
                                      t.Members.Any(m => m.UserId == meId) &&
                                      t.Members.Any(m => m.UserId == other.Id));

        if (thread is null)
        {
            thread = new DirectThread();
            _db.DirectThreads.Add(thread);
            _db.DirectThreadMembers.Add(new DirectThreadMember { Thread = thread, UserId = meId });
            _db.DirectThreadMembers.Add(new DirectThreadMember { Thread = thread, UserId = other.Id });
            await _db.SaveChangesAsync();
        }

        return Ok(new { threadId = thread.Id });
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest();
        var meId = MeId();

        var thread = await _db.DirectThreads
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Id == dto.ThreadId);

        if (thread is null || !thread.Members.Any(m => m.UserId == meId))
            return NotFound();

        var message = new DirectMessage
        {
            ThreadId = thread.Id,
            SenderId = meId,
            Content = dto.Content.Trim()
        };

        _db.DirectMessages.Add(message);
        await _db.SaveChangesAsync();

        return Ok(new { message.Id, message.SenderId, message.Content, message.SentAt });
    }

    [HttpPost("mark-read/{withUserName}")]
    public async Task<IActionResult> MarkRead(string withUserName)
    {
        var meId = MeId();
        var other = await _db.Users.FirstOrDefaultAsync(u => u.UserName == withUserName);
        if (other is null) return NotFound();

        var thread = await _db.DirectThreads
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Members.Count == 2 &&
                                      t.Members.Any(m => m.UserId == meId) &&
                                      t.Members.Any(m => m.UserId == other.Id));

        if (thread is null) return NoContent();

        var now = DateTime.UtcNow;
        var count = await _db.DirectMessages
            .Where(m => m.ThreadId == thread.Id && m.SenderId == other.Id && m.ReadAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.ReadAt, now));

        return Ok(new { count });
    }

    [HttpGet("/api/users/search")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchUsers([FromQuery] string q)
    {
        q = (q ?? "").Trim();
        if (q.Length < 2) return Ok(Array.Empty<object>());

        var results = await _db.Users
            .Where(u => u.UserName != null && u.UserName.Contains(q))
            .OrderBy(u => u.UserName)
            .Take(20)
            .Select(u => new { u.Id, u.UserName, u.DisplayName })
            .ToListAsync();

        return Ok(results);
    }
}

public sealed record StartThreadDto(string WithUserName);
public sealed record SendMessageDto(Guid ThreadId, string Content);