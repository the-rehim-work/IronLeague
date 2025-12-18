using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using IronLeague.Data;
using IronLeague.DTOs;
using IronLeague.Entities;

namespace IronLeague.Services;

public interface IAdminService
{
    Task<bool> CreateCountryAsync(AdminCreateCountryDto dto);
    Task<bool> CreateLeagueAsync(CreateLeagueDto dto);
    Task<bool> CreateTeamAsync(AdminCreateTeamDto dto);
    Task<bool> CreatePlayerAsync(AdminCreatePlayerDto dto);
    Task SeedInitialDataAsync();
}

public class AdminService : IAdminService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<AppRole> _roleManager;

    public AdminService(AppDbContext db, UserManager<AppUser> userManager, RoleManager<AppRole> roleManager) 
    { 
        _db = db; 
        _userManager = userManager; 
        _roleManager = roleManager; 
    }

    public async Task<bool> CreateCountryAsync(AdminCreateCountryDto dto)
    {
        if (await _db.Countries.AnyAsync(c => c.Code == dto.Code)) return false;
        _db.Countries.Add(new Country { Code = dto.Code, Name = dto.Name, Currency = dto.Currency, ExchangeRateToEur = dto.ExchangeRateToEur, PrimaryLanguage = dto.PrimaryLanguage });
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CreateLeagueAsync(CreateLeagueDto dto)
    {
        _db.Leagues.Add(new League { Id = Guid.NewGuid(), Name = dto.Name, CountryCode = dto.CountryCode, Tier = dto.Tier, MaxTeams = dto.MaxTeams, PromotionSpots = dto.PromotionSpots, RelegationSpots = dto.RelegationSpots });
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CreateTeamAsync(AdminCreateTeamDto dto)
    {
        _db.Teams.Add(new Team { Id = Guid.NewGuid(), Name = dto.Name, ShortName = dto.ShortName, LeagueId = dto.LeagueId, PrimaryColor = dto.PrimaryColor, SecondaryColor = dto.SecondaryColor, StadiumCapacity = dto.StadiumCapacity, StadiumName = dto.StadiumName, WageBudget = dto.WageBudget, TransferBudget = dto.TransferBudget, TotalBalance = dto.WageBudget + dto.TransferBudget });
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CreatePlayerAsync(AdminCreatePlayerDto dto)
    {
        var player = new Player
        {
            Id = Guid.NewGuid(),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Nationality = dto.Nationality,
            DateOfBirth = dto.DateOfBirth,
            PrimaryPosition = Enum.Parse<Position>(dto.PrimaryPosition),
            SecondaryPosition = dto.SecondaryPosition != null ? Enum.Parse<Position>(dto.SecondaryPosition) : null,
            Pace = dto.Pace,
            Shooting = dto.Shooting,
            Passing = dto.Passing,
            Dribbling = dto.Dribbling,
            Defending = dto.Defending,
            Physical = dto.Physical,
            Potential = dto.Potential,
            CurrentAbility = (dto.Pace + dto.Shooting + dto.Passing + dto.Dribbling + dto.Defending + dto.Physical) / 6,
            MarketValue = dto.MarketValue,
            IsLegend = dto.IsLegend,
            IsSpecialLegend = dto.IsSpecialLegend,
            TeamId = dto.TeamId
        };
        foreach (var lang in dto.Languages) player.Languages.Add(new PlayerLanguage { Id = Guid.NewGuid(), PlayerId = player.Id, LanguageCode = lang, IsNative = dto.Languages.IndexOf(lang) == 0 });
        _db.Players.Add(player);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task SeedInitialDataAsync()
    {
        if (!(await _db.Countries.AnyAsync()))
        {
            var countries = new[]
            {
                new Country { Code = "ENG", Name = "England", Currency = "GBP", ExchangeRateToEur = 0.85m, PrimaryLanguage = "en" },
                new Country { Code = "ESP", Name = "Spain", Currency = "EUR", ExchangeRateToEur = 1m, PrimaryLanguage = "es" },
                new Country { Code = "GER", Name = "Germany", Currency = "EUR", ExchangeRateToEur = 1m, PrimaryLanguage = "de" },
                new Country { Code = "ITA", Name = "Italy", Currency = "EUR", ExchangeRateToEur = 1m, PrimaryLanguage = "it" },
                new Country { Code = "FRA", Name = "France", Currency = "EUR", ExchangeRateToEur = 1m, PrimaryLanguage = "fr" },
                new Country { Code = "POR", Name = "Portugal", Currency = "EUR", ExchangeRateToEur = 1m, PrimaryLanguage = "pt" },
                new Country { Code = "NED", Name = "Netherlands", Currency = "EUR", ExchangeRateToEur = 1m, PrimaryLanguage = "nl" },
                new Country { Code = "TUR", Name = "Turkey", Currency = "TRY", ExchangeRateToEur = 35m, PrimaryLanguage = "tr" },
                new Country { Code = "ARG", Name = "Argentina", Currency = "ARS", ExchangeRateToEur = 1000m, PrimaryLanguage = "es" },
                new Country { Code = "BRA", Name = "Brazil", Currency = "BRL", ExchangeRateToEur = 5.5m, PrimaryLanguage = "pt" }
            };
            _db.Countries.AddRange(countries);

            var leagues = new[]
            {
                new League { Id = Guid.NewGuid(), Name = "Premier League", CountryCode = "ENG", Tier = 1, MaxTeams = 20, RelegationSpots = 3 },
                new League { Id = Guid.NewGuid(), Name = "La Liga", CountryCode = "ESP", Tier = 1, MaxTeams = 20, RelegationSpots = 3 },
                new League { Id = Guid.NewGuid(), Name = "Bundesliga", CountryCode = "GER", Tier = 1, MaxTeams = 18, RelegationSpots = 2 },
                new League { Id = Guid.NewGuid(), Name = "Serie A", CountryCode = "ITA", Tier = 1, MaxTeams = 20, RelegationSpots = 3 },
                new League { Id = Guid.NewGuid(), Name = "Ligue 1", CountryCode = "FRA", Tier = 1, MaxTeams = 18, RelegationSpots = 2 }
            };
            _db.Leagues.AddRange(leagues);

            var rng = new Random(42);
            
            var firstNames = new[] { "James", "John", "Michael", "David", "Robert", "William", "Richard", "Joseph", "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian", "George", "Timothy", "Ronald", "Edward", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon", "Benjamin", "Samuel", "Raymond", "Gregory", "Frank", "Alexander", "Patrick", "Jack", "Dennis", "Jerry", "Tyler" };
            var lastNames = new[] { "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts" };

            var teamNames = new Dictionary<string, string[]>
            {
                ["ENG"] = new[] { "Manchester United", "Manchester City", "Liverpool", "Chelsea", "Arsenal", "Tottenham", "Newcastle", "Aston Villa", "Brighton", "West Ham", "Bournemouth", "Fulham", "Wolves", "Crystal Palace", "Brentford", "Everton", "Nottingham Forest", "Leicester", "Southampton", "Ipswich" },
                ["ESP"] = new[] { "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Real Sociedad", "Real Betis", "Villarreal", "Athletic Bilbao", "Valencia", "Osasuna", "Celta Vigo", "Mallorca", "Girona", "Rayo Vallecano", "Getafe", "Alaves", "Las Palmas", "Leganes", "Espanyol", "Valladolid" },
                ["GER"] = new[] { "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen", "Union Berlin", "Freiburg", "Eintracht Frankfurt", "Wolfsburg", "Mainz", "Borussia Mgladbach", "Werder Bremen", "Augsburg", "Hoffenheim", "Stuttgart", "Koln", "Bochum", "Heidenheim", "Darmstadt" },
                ["ITA"] = new[] { "Inter Milan", "AC Milan", "Juventus", "Napoli", "Roma", "Lazio", "Atalanta", "Fiorentina", "Bologna", "Torino", "Monza", "Udinese", "Sassuolo", "Empoli", "Salernitana", "Lecce", "Verona", "Cagliari", "Frosinone", "Genoa" },
                ["FRA"] = new[] { "PSG", "Marseille", "Monaco", "Lille", "Lyon", "Nice", "Lens", "Rennes", "Montpellier", "Strasbourg", "Nantes", "Toulouse", "Reims", "Brest", "Clermont", "Lorient", "Metz", "Le Havre" }
            };

            var teamStrength = new Dictionary<string, int[]>
            {
                ["ENG"] = new[] { 85, 90, 87, 82, 83, 78, 76, 77, 75, 74, 70, 72, 73, 71, 74, 68, 69, 73, 67, 65 },
                ["ESP"] = new[] { 88, 86, 82, 78, 77, 76, 77, 76, 74, 72, 71, 70, 75, 69, 68, 67, 69, 66, 70, 65 },
                ["GER"] = new[] { 88, 83, 80, 82, 74, 75, 76, 73, 71, 72, 73, 70, 74, 76, 69, 67, 66, 64 },
                ["ITA"] = new[] { 86, 82, 83, 80, 78, 77, 79, 76, 77, 73, 71, 72, 70, 69, 67, 68, 69, 68, 66, 70 },
                ["FRA"] = new[] { 87, 78, 79, 77, 76, 75, 76, 74, 71, 72, 71, 72, 70, 73, 68, 67, 66, 65 }
            };

            foreach (var league in leagues)
            {
                var names = teamNames[league.CountryCode];
                var strengths = teamStrength[league.CountryCode];
                var country = countries.First(c => c.Code == league.CountryCode);

                for (int t = 0; t < Math.Min(league.MaxTeams, names.Length); t++)
                {
                    var teamBaseStrength = strengths[t];
                    var team = new Team
                    {
                        Id = Guid.NewGuid(),
                        Name = names[t],
                        ShortName = names[t].Length > 3 ? names[t][..3].ToUpper() : names[t].ToUpper(),
                        LeagueId = league.Id,
                        PrimaryColor = GetTeamColor(names[t]),
                        SecondaryColor = GetTeamSecondaryColor(names[t]),
                        StadiumCapacity = GetStadiumCapacity(teamBaseStrength, rng),
                        StadiumName = $"{names[t]} Stadium",
                        WageBudget = GetBudget(teamBaseStrength, rng) * 2,
                        TransferBudget = GetBudget(teamBaseStrength, rng),
                        FanLoyalty = 50 + (teamBaseStrength - 65) + rng.Next(-5, 6),
                        FanMood = 50 + rng.Next(-10, 11)
                    };
                    team.TotalBalance = team.WageBudget + team.TransferBudget;
                    team.TicketIncome = team.StadiumCapacity * 50;
                    team.SponsorIncome = team.WageBudget / 2;
                    team.TvIncome = 30_000_000 + (teamBaseStrength - 65) * 5_000_000 + rng.Next(20_000_000);

                    var positions = GetSquadPositions();

                    for (int p = 0; p < 25; p++)
                    {
                        var pos = positions[p];
                        var isStarter = p < 11;
                        
                        var playerStrength = isStarter 
                            ? teamBaseStrength + rng.Next(-5, 6)
                            : teamBaseStrength - 10 + rng.Next(-5, 6);
                        
                        playerStrength = Math.Clamp(playerStrength, 45, 94);

                        var age = GeneratePlayerAge(pos, playerStrength, rng);
                        var potential = GeneratePotential(age, playerStrength, rng);

                        var (pace, shooting, passing, dribbling, defending, physical) = 
                            GenerateAttributes(pos, playerStrength, rng);

                        var player = new Player
                        {
                            Id = Guid.NewGuid(),
                            FirstName = firstNames[rng.Next(firstNames.Length)],
                            LastName = lastNames[rng.Next(lastNames.Length)],
                            Nationality = league.CountryCode,
                            DateOfBirth = DateTime.UtcNow.AddYears(-age).AddDays(-rng.Next(365)),
                            PrimaryPosition = pos,
                            SecondaryPosition = GetSecondaryPosition(pos, rng),
                            Pace = pace,
                            Shooting = shooting,
                            Passing = passing,
                            Dribbling = dribbling,
                            Defending = defending,
                            Physical = physical,
                            Potential = potential,
                            CurrentAbility = (pace + shooting + passing + dribbling + defending + physical) / 6,
                            MarketValue = CalculateMarketValue(playerStrength, age, potential, rng),
                            TeamId = team.Id,
                            Morale = 60 + rng.Next(-15, 21),
                            Fitness = 80 + rng.Next(-15, 16),
                            Form = 50 + rng.Next(-20, 21)
                        };

                        player.Languages.Add(new PlayerLanguage 
                        { 
                            Id = Guid.NewGuid(), 
                            PlayerId = player.Id, 
                            LanguageCode = country.PrimaryLanguage, 
                            IsNative = true 
                        });
                        
                        if (rng.NextDouble() < 0.3)
                        {
                            var extraLangs = new[] { "en", "es", "pt", "fr", "de", "it" };
                            var extraLang = extraLangs[rng.Next(extraLangs.Length)];
                            if (extraLang != country.PrimaryLanguage)
                            {
                                player.Languages.Add(new PlayerLanguage
                                {
                                    Id = Guid.NewGuid(),
                                    PlayerId = player.Id,
                                    LanguageCode = extraLang,
                                    IsNative = false
                                });
                            }
                        }

                        team.Players.Add(player);
                    }

                    _db.Teams.Add(team);
                }
            }
        }

        if (!await _roleManager.RoleExistsAsync("Player"))
        {
            var roleRes = await _roleManager.CreateAsync(new AppRole { Name = "Player" });
            if (!roleRes.Succeeded) throw new InvalidOperationException(string.Join("; ", roleRes.Errors.Select(e => e.Description)));
        }

        if (!await _roleManager.RoleExistsAsync("Admin"))
        {
            var roleRes = await _roleManager.CreateAsync(new AppRole { Name = "Admin" });
            if (!roleRes.Succeeded) throw new InvalidOperationException(string.Join("; ", roleRes.Errors.Select(e => e.Description)));
        }

        var adminUser = await _userManager.FindByNameAsync("Admin");

        if (adminUser == null)
        {
            adminUser = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = "Admin",
                Email = "admin@ironleague.com",
                DisplayName = "Admin",
                IsAdmin = true
            };

            var createRes = await _userManager.CreateAsync(adminUser, "Admin123!");
            if (!createRes.Succeeded) throw new InvalidOperationException(string.Join("; ", createRes.Errors.Select(e => e.Description)));

            adminUser = await _userManager.FindByNameAsync("Admin");
            if (adminUser == null) throw new InvalidOperationException("Admin user was created but cannot be reloaded.");
        }

        if (!await _userManager.IsInRoleAsync(adminUser, "Admin"))
        {
            var addRes = await _userManager.AddToRoleAsync(adminUser, "Admin");
            if (!addRes.Succeeded) throw new InvalidOperationException(string.Join("; ", addRes.Errors.Select(e => e.Description)));
        }

        if (!await _userManager.IsInRoleAsync(adminUser, "Player"))
        {
            var addRes = await _userManager.AddToRoleAsync(adminUser, "Player");
            if (!addRes.Succeeded) throw new InvalidOperationException(string.Join("; ", addRes.Errors.Select(e => e.Description)));
        }

        await _db.SaveChangesAsync();
    }

    private static Position[] GetSquadPositions()
    {
        return new[]
        {
            Position.GK,
            Position.CB, Position.CB, Position.LB, Position.RB,
            Position.CDM, Position.CM, Position.CM, Position.CAM,
            Position.LW, Position.ST,
            
            Position.GK,
            Position.CB, Position.CB, Position.RB,
            Position.CDM, Position.CM, Position.CAM,
            Position.RW, Position.LW,
            Position.ST,
            
            Position.CB, Position.CM, Position.LW, Position.ST
        };
    }

    private static Position? GetSecondaryPosition(Position primary, Random rng)
    {
        if (rng.NextDouble() < 0.4) return null;

        return primary switch
        {
            Position.CB => rng.Next(2) == 0 ? Position.CDM : Position.RB,
            Position.LB => Position.LWB,
            Position.RB => Position.RWB,
            Position.CDM => rng.Next(2) == 0 ? Position.CB : Position.CM,
            Position.CM => rng.Next(2) == 0 ? Position.CDM : Position.CAM,
            Position.CAM => rng.Next(2) == 0 ? Position.CM : Position.RW,
            Position.LW => rng.Next(2) == 0 ? Position.LM : Position.ST,
            Position.RW => rng.Next(2) == 0 ? Position.RM : Position.ST,
            Position.ST => rng.Next(2) == 0 ? Position.CF : Position.LW,
            _ => null
        };
    }

    private static int GeneratePlayerAge(Position pos, int strength, Random rng)
    {
        var baseAge = pos == Position.GK ? 27 : 25;
        
        if (strength >= 85) baseAge += rng.Next(-2, 4);
        else if (strength >= 75) baseAge += rng.Next(-4, 4);
        else baseAge += rng.Next(-6, 3);

        return Math.Clamp(baseAge, 17, 38);
    }

    private static int GeneratePotential(int age, int current, Random rng)
    {
        var potentialBonus = age switch
        {
            <= 21 => rng.Next(5, 15),
            <= 25 => rng.Next(2, 8),
            <= 30 => rng.Next(0, 3),
            _ => 0
        };

        return Math.Clamp(current + potentialBonus, current, 99);
    }

    private static (int pace, int shooting, int passing, int dribbling, int defending, int physical) 
        GenerateAttributes(Position pos, int baseStrength, Random rng)
    {
        var variance = () => rng.Next(-8, 9);

        return pos switch
        {
            Position.GK => (
                Math.Clamp(baseStrength - 20 + variance(), 30, 70),
                Math.Clamp(baseStrength - 30 + variance(), 20, 50),
                Math.Clamp(baseStrength - 15 + variance(), 30, 70),
                Math.Clamp(baseStrength - 25 + variance(), 25, 60),
                Math.Clamp(baseStrength + 5 + variance(), 40, 99),
                Math.Clamp(baseStrength - 5 + variance(), 40, 85)
            ),
            Position.CB => (
                Math.Clamp(baseStrength - 10 + variance(), 40, 85),
                Math.Clamp(baseStrength - 20 + variance(), 30, 70),
                Math.Clamp(baseStrength - 10 + variance(), 40, 80),
                Math.Clamp(baseStrength - 15 + variance(), 35, 75),
                Math.Clamp(baseStrength + 5 + variance(), 50, 99),
                Math.Clamp(baseStrength + 3 + variance(), 50, 95)
            ),
            Position.LB or Position.RB or Position.LWB or Position.RWB => (
                Math.Clamp(baseStrength + 5 + variance(), 55, 95),
                Math.Clamp(baseStrength - 15 + variance(), 35, 75),
                Math.Clamp(baseStrength - 5 + variance(), 45, 85),
                Math.Clamp(baseStrength - 5 + variance(), 45, 85),
                Math.Clamp(baseStrength + variance(), 50, 90),
                Math.Clamp(baseStrength + variance(), 50, 90)
            ),
            Position.CDM => (
                Math.Clamp(baseStrength - 5 + variance(), 45, 85),
                Math.Clamp(baseStrength - 15 + variance(), 40, 75),
                Math.Clamp(baseStrength + variance(), 50, 90),
                Math.Clamp(baseStrength - 10 + variance(), 45, 80),
                Math.Clamp(baseStrength + 5 + variance(), 55, 95),
                Math.Clamp(baseStrength + 3 + variance(), 55, 95)
            ),
            Position.CM => (
                Math.Clamp(baseStrength - 5 + variance(), 50, 85),
                Math.Clamp(baseStrength - 5 + variance(), 50, 85),
                Math.Clamp(baseStrength + 5 + variance(), 55, 95),
                Math.Clamp(baseStrength + variance(), 50, 90),
                Math.Clamp(baseStrength - 5 + variance(), 45, 80),
                Math.Clamp(baseStrength + variance(), 50, 90)
            ),
            Position.CAM => (
                Math.Clamp(baseStrength + variance(), 55, 90),
                Math.Clamp(baseStrength + 3 + variance(), 55, 92),
                Math.Clamp(baseStrength + 5 + variance(), 60, 95),
                Math.Clamp(baseStrength + 5 + variance(), 60, 95),
                Math.Clamp(baseStrength - 20 + variance(), 30, 65),
                Math.Clamp(baseStrength - 10 + variance(), 40, 80)
            ),
            Position.LM or Position.RM => (
                Math.Clamp(baseStrength + 5 + variance(), 60, 95),
                Math.Clamp(baseStrength - 5 + variance(), 50, 85),
                Math.Clamp(baseStrength + variance(), 55, 90),
                Math.Clamp(baseStrength + 3 + variance(), 55, 92),
                Math.Clamp(baseStrength - 15 + variance(), 35, 70),
                Math.Clamp(baseStrength - 5 + variance(), 45, 85)
            ),
            Position.LW or Position.RW => (
                Math.Clamp(baseStrength + 8 + variance(), 65, 99),
                Math.Clamp(baseStrength + variance(), 55, 90),
                Math.Clamp(baseStrength + variance(), 55, 90),
                Math.Clamp(baseStrength + 8 + variance(), 65, 99),
                Math.Clamp(baseStrength - 25 + variance(), 25, 60),
                Math.Clamp(baseStrength - 10 + variance(), 40, 80)
            ),
            Position.CF or Position.ST => (
                Math.Clamp(baseStrength + 3 + variance(), 55, 92),
                Math.Clamp(baseStrength + 10 + variance(), 65, 99),
                Math.Clamp(baseStrength - 5 + variance(), 45, 85),
                Math.Clamp(baseStrength + 5 + variance(), 55, 95),
                Math.Clamp(baseStrength - 25 + variance(), 25, 55),
                Math.Clamp(baseStrength + variance(), 50, 90)
            ),
            _ => (
                Math.Clamp(baseStrength + variance(), 40, 95),
                Math.Clamp(baseStrength + variance(), 40, 95),
                Math.Clamp(baseStrength + variance(), 40, 95),
                Math.Clamp(baseStrength + variance(), 40, 95),
                Math.Clamp(baseStrength + variance(), 40, 95),
                Math.Clamp(baseStrength + variance(), 40, 95)
            )
        };
    }

    private static decimal CalculateMarketValue(int strength, int age, int potential, Random rng)
    {
        var baseValue = strength switch
        {
            >= 90 => 80_000_000m,
            >= 85 => 50_000_000m,
            >= 80 => 30_000_000m,
            >= 75 => 15_000_000m,
            >= 70 => 8_000_000m,
            >= 65 => 4_000_000m,
            >= 60 => 2_000_000m,
            _ => 500_000m
        };

        var ageMultiplier = age switch
        {
            <= 21 => 1.5m,
            <= 25 => 1.3m,
            <= 28 => 1.0m,
            <= 32 => 0.7m,
            _ => 0.3m
        };

        var potentialBonus = (potential - strength) * 500_000m;
        var randomVariance = 1m + (rng.Next(-20, 21) / 100m);

        return (baseValue * ageMultiplier + potentialBonus) * randomVariance;
    }

    private static int GetStadiumCapacity(int strength, Random rng)
    {
        var baseCapacity = strength switch
        {
            >= 88 => 70000,
            >= 83 => 55000,
            >= 78 => 45000,
            >= 73 => 35000,
            >= 68 => 25000,
            _ => 18000
        };
        return baseCapacity + rng.Next(-5000, 10000);
    }

    private static decimal GetBudget(int strength, Random rng)
    {
        var baseBudget = strength switch
        {
            >= 88 => 150_000_000m,
            >= 83 => 80_000_000m,
            >= 78 => 50_000_000m,
            >= 73 => 30_000_000m,
            >= 68 => 15_000_000m,
            _ => 8_000_000m
        };
        return baseBudget + rng.Next((int)baseBudget / -4, (int)baseBudget / 4);
    }

    private static string GetTeamColor(string teamName)
    {
        return teamName switch
        {
            "Manchester United" => "#DA291C",
            "Manchester City" => "#6CABDD",
            "Liverpool" => "#C8102E",
            "Chelsea" => "#034694",
            "Arsenal" => "#EF0107",
            "Tottenham" => "#132257",
            "Newcastle" => "#241F20",
            "Real Madrid" => "#FEBE10",
            "Barcelona" => "#A50044",
            "Bayern Munich" => "#DC052D",
            "Borussia Dortmund" => "#FDE100",
            "Juventus" => "#000000",
            "Inter Milan" => "#0068A8",
            "AC Milan" => "#FB090B",
            "PSG" => "#004170",
            _ => $"#{new Random(teamName.GetHashCode()).Next(0x1000000):X6}"
        };
    }

    private static string GetTeamSecondaryColor(string teamName)
    {
        return teamName switch
        {
            "Manchester United" => "#FBE122",
            "Manchester City" => "#1C2C5B",
            "Liverpool" => "#00B2A9",
            "Chelsea" => "#DBA111",
            "Arsenal" => "#063672",
            "Tottenham" => "#FFFFFF",
            "Real Madrid" => "#FFFFFF",
            "Barcelona" => "#004D98",
            "Bayern Munich" => "#FFFFFF",
            "Borussia Dortmund" => "#000000",
            "Juventus" => "#FFFFFF",
            "Inter Milan" => "#000000",
            "AC Milan" => "#000000",
            "PSG" => "#DA291C",
            _ => "#FFFFFF"
        };
    }
}