using IronLeague.Data;
using IronLeague.Entities;
using IronLeague.Hubs;
using IronLeague.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ??
              new[] { "http://localhost:8090", "http://127.0.0.1:8090" };

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key missing");
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddIdentityCore<AppUser>(opt =>
    {
        opt.ClaimsIdentity.UserIdClaimType = ClaimTypes.NameIdentifier;
        opt.ClaimsIdentity.UserNameClaimType = ClaimTypes.Name;
        opt.ClaimsIdentity.RoleClaimType = ClaimTypes.Role;
        opt.User.RequireUniqueEmail = false;
        opt.Password.RequireDigit = false;
        opt.Password.RequireNonAlphanumeric = false;
        opt.Password.RequireUppercase = false;
        opt.Password.RequireLowercase = false;
        opt.Password.RequiredLength = 6;
    })
    .AddRoles<AppRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders()
    .AddSignInManager();

builder.Services.AddScoped<IManagerService, ManagerService>();
builder.Services.AddScoped<ILeagueInstanceService, LeagueInstanceService>();
builder.Services.AddScoped<IFixtureService, FixtureService>();
builder.Services.AddScoped<IMatchEngine, MatchEngine>();
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITransferService, TransferService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<ICompetitionService, CompetitionService>();
builder.Services.AddScoped<ITacticService, TacticService>();
builder.Services.AddScoped<ITrainingService, TrainingService>();
builder.Services.AddScoped<IYouthAcademyService, YouthAcademyService>();
builder.Services.AddScoped<IFriendshipService, FriendshipService>();
builder.Services.AddScoped<ILeagueInviteService, LeagueInviteService>();
builder.Services.AddScoped<IPressService, PressService>();
builder.Services.AddScoped<IVoteService, VoteService>();
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IInternationalService, InternationalService>();
builder.Services.AddScoped<ISaveExportService, SaveExportService>();
builder.Services.AddScoped<IInGameInstructionService, InGameInstructionService>();
builder.Services.AddScoped<ISimulationService, SimulationService>();

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(o =>
    {
        o.RequireHttpsMetadata = false;
        o.SaveToken = true;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = !string.IsNullOrWhiteSpace(jwtIssuer),
            ValidIssuer = jwtIssuer,
            ValidateAudience = !string.IsNullOrWhiteSpace(jwtAudience),
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
        o.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                var logger = ctx.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtBearer");

                logger.LogError(ctx.Exception, "JWT auth failed. Path={Path}. HasAuth={HasAuth}",
                    ctx.HttpContext.Request.Path,
                    ctx.Request.Headers.ContainsKey("Authorization"));

                return Task.CompletedTask;
            },

            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/hubs/match")
                        || path.StartsWithSegments("/hubs/league")
                        || path.StartsWithSegments("/hubs/notifications")
                        || path.StartsWithSegments("/hubs/chat")))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddSignalR();
builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        logger.LogInformation("Ensuring database exists and applying migrations...");

        await db.Database.MigrateAsync();

        logger.LogInformation("Database created and migrations applied successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration failed.");
        logger.LogError("Connection string: {ConnectionString}",
            builder.Configuration.GetConnectionString("DefaultConnection")?.Split("Password=")[0] + "Password=***");
        throw;
    }

    try
    {
        logger.LogInformation("Seeding initial data...");
        var adminService = scope.ServiceProvider.GetRequiredService<IAdminService>();
        await adminService.SeedInitialDataAsync();
        logger.LogInformation("Initial data seeded successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Data seeding failed.");
        throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<MatchHub>("/hubs/match");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<LeagueHub>("/hubs/league");
app.MapHub<ChatHub>("/hubs/chat");
app.MapControllers();

app.Run();