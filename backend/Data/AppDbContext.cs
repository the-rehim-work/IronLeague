using IronLeague.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace IronLeague.Data;

public class AppDbContext : IdentityDbContext<AppUser, AppRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Manager> Managers => Set<Manager>();
    public DbSet<ManagerLanguage> ManagerLanguages => Set<ManagerLanguage>();
    public DbSet<ManagerTrophy> ManagerTrophies => Set<ManagerTrophy>();
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<League> Leagues => Set<League>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<PlayerLanguage> PlayerLanguages => Set<PlayerLanguage>();
    public DbSet<PlayerAttribute> PlayerAttributes => Set<PlayerAttribute>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Staff> StaffMembers => Set<Staff>();
    public DbSet<LeagueInstance> LeagueInstances => Set<LeagueInstance>();
    public DbSet<LeagueTeamInstance> LeagueTeamInstances => Set<LeagueTeamInstance>();
    public DbSet<LeagueInvite> LeagueInvites => Set<LeagueInvite>();
    public DbSet<GovernanceSettings> GovernanceSettings => Set<GovernanceSettings>();
    public DbSet<Competition> Competitions => Set<Competition>();
    public DbSet<CompetitionTeam> CompetitionTeams => Set<CompetitionTeam>();
    public DbSet<Fixture> Fixtures => Set<Fixture>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<MatchState> MatchStates => Set<MatchState>();
    public DbSet<MatchEvent> MatchEvents => Set<MatchEvent>();
    public DbSet<PlayerMatchStats> PlayerMatchStats => Set<PlayerMatchStats>();
    public DbSet<TrainingSession> TrainingSessions => Set<TrainingSession>();
    public DbSet<PlayerTrainingResult> PlayerTrainingResults => Set<PlayerTrainingResult>();
    public DbSet<Transfer> Transfers => Set<Transfer>();
    public DbSet<TransferOffer> TransferOffers => Set<TransferOffer>();
    public DbSet<YouthAcademy> YouthAcademies => Set<YouthAcademy>();
    public DbSet<YouthPlayer> YouthPlayers => Set<YouthPlayer>();
    public DbSet<Friendship> Friendships => Set<Friendship>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<PressEvent> PressEvents => Set<PressEvent>();
    public DbSet<Tactic> Tactics => Set<Tactic>();
    public DbSet<InGameInstruction> InGameInstructions => Set<InGameInstruction>();
    public DbSet<Speech> Speeches => Set<Speech>();
    public DbSet<InternationalTeam> InternationalTeams => Set<InternationalTeam>();
    public DbSet<InternationalCall> InternationalCalls => Set<InternationalCall>();
    public DbSet<InternationalBreak> InternationalBreaks => Set<InternationalBreak>();
    public DbSet<SaveExport> SaveExports => Set<SaveExport>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<LeagueInvite>()
            .Property(i => i.Status).HasConversion<string>();

        builder.Entity<LeagueInvite>()
            .HasOne(i => i.LeagueInstance)
            .WithMany(li => li.Invites)
            .HasForeignKey(i => i.LeagueInstanceId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<LeagueInvite>()
            .HasOne(i => i.InvitedUser)
            .WithMany(u => u.LeagueInvitesReceived)
            .HasForeignKey(i => i.InvitedUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<LeagueInvite>()
            .HasOne(i => i.InvitedByUser)
            .WithMany(u => u.LeagueInvitesSent)
            .HasForeignKey(i => i.InvitedByUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<LeagueInstance>()
            .HasOne(li => li.Owner)
            .WithMany()
            .HasForeignKey(li => li.OwnerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Country>().HasKey(c => c.Code);
        builder.Entity<Country>().Property(c => c.Code).HasMaxLength(3);

        builder.Entity<League>()
            .HasOne(l => l.Country)
            .WithMany(c => c.Leagues)
            .HasForeignKey(l => l.CountryCode);

        builder.Entity<League>()
            .HasOne(l => l.PromotesToLeague)
            .WithOne()
            .HasForeignKey<League>(l => l.PromotesToLeagueId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<League>()
            .HasOne(l => l.RelegatesFromLeague)
            .WithOne()
            .HasForeignKey<League>(l => l.RelegatesFromLeagueId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Team>()
            .HasOne(t => t.Manager)
            .WithOne(m => m.CurrentTeam)
            .HasForeignKey<Team>(t => t.ManagerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Player>()
            .HasOne(p => p.LoanedFromTeam)
            .WithMany()
            .HasForeignKey(p => p.LoanedFromTeamId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Player>()
            .Property(p => p.PrimaryPosition)
            .HasConversion<string>();

        builder.Entity<Player>()
            .Property(p => p.SecondaryPosition)
            .HasConversion<string>();

        builder.Entity<Contract>()
            .HasOne(c => c.Player)
            .WithOne(p => p.Contract)
            .HasForeignKey<Contract>(c => c.PlayerId);

        builder.Entity<Contract>()
            .HasOne(c => c.Team)
            .WithMany()
            .HasForeignKey(c => c.TeamId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<LeagueInstance>()
            .HasOne(li => li.Governance)
            .WithOne()
            .HasForeignKey<LeagueInstance>(li => li.GovernanceId);

        builder.Entity<LeagueTeamInstance>()
            .HasOne(lti => lti.Manager)
            .WithMany()
            .HasForeignKey(lti => lti.ManagerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<LeagueTeamInstance>()
            .HasOne(lti => lti.LeagueInstance)
            .WithMany(li => li.Teams)
            .HasForeignKey(lti => lti.LeagueInstanceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Fixture>()
            .HasOne(f => f.HomeTeam)
            .WithMany()
            .HasForeignKey(f => f.HomeTeamId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Fixture>()
            .HasOne(f => f.AwayTeam)
            .WithMany()
            .HasForeignKey(f => f.AwayTeamId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Match>()
            .HasOne(m => m.Fixture)
            .WithOne(f => f.Match)
            .HasForeignKey<Match>(m => m.FixtureId);

        builder.Entity<Friendship>()
            .HasOne(f => f.User1)
            .WithMany(u => u.FriendshipsInitiated)
            .HasForeignKey(f => f.User1Id)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Friendship>()
            .HasOne(f => f.User2)
            .WithMany(u => u.FriendshipsReceived)
            .HasForeignKey(f => f.User2Id)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Transfer>()
            .HasOne(t => t.FromTeam)
            .WithMany()
            .HasForeignKey(t => t.FromTeamId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Transfer>()
            .HasOne(t => t.ToTeam)
            .WithMany()
            .HasForeignKey(t => t.ToTeamId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<InternationalTeam>()
            .HasOne(it => it.Country)
            .WithMany()
            .HasForeignKey(it => it.CountryCode);

        builder.Entity<GovernanceSettings>()
            .Property(g => g.CrowdCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.CrowdCombination).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.LanguageCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.LanguageCombination).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.MoraleCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.MoraleCombination).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.SpeechCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.SpeechCombination).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.PressureCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.PressureCombination).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.WeatherCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.WeatherCombination).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.RefereeCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.RefereeCombination).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.ChemistryCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.ChemistryCombination).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.ExperienceCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.FormCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.ManagerReputationCurve).HasConversion<string>();
        builder.Entity<GovernanceSettings>()
            .Property(g => g.ScandalCurve).HasConversion<string>();

        builder.Entity<MatchEvent>()
            .Property(e => e.Type).HasConversion<string>();

        builder.Entity<Match>()
            .Property(m => m.Status).HasConversion<string>();
        builder.Entity<Match>()
            .Property(m => m.Weather).HasConversion<string>();

        builder.Entity<Competition>()
            .Property(c => c.Type).HasConversion<string>();
        builder.Entity<Competition>()
            .Property(c => c.Status).HasConversion<string>();

        builder.Entity<Competition>()
            .HasOne(c => c.LeagueInstance)
            .WithMany(li => li.Competitions)
            .HasForeignKey(c => c.LeagueInstanceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CompetitionTeam>()
            .HasOne(ct => ct.Competition)
            .WithMany(c => c.Teams)
            .HasForeignKey(ct => ct.CompetitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CompetitionTeam>()
            .HasOne(ct => ct.TeamInstance)
            .WithMany()
            .HasForeignKey(ct => ct.TeamInstanceId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Fixture>()
            .Property(f => f.Status).HasConversion<string>();

        builder.Entity<LeagueInstance>()
            .Property(li => li.Status).HasConversion<string>();

        builder.Entity<Transfer>()
            .Property(t => t.Type).HasConversion<string>();
        builder.Entity<Transfer>()
            .Property(t => t.Status).HasConversion<string>();

        builder.Entity<TransferOffer>()
            .Property(o => o.Status).HasConversion<string>();

        builder.Entity<TrainingSession>()
            .Property(t => t.Type).HasConversion<string>();

        builder.Entity<Friendship>()
            .Property(f => f.Status).HasConversion<string>();

        builder.Entity<Notification>()
            .Property(n => n.Type).HasConversion<string>();

        builder.Entity<PressEvent>()
            .Property(p => p.Type).HasConversion<string>();

        builder.Entity<Speech>()
            .Property(s => s.Type).HasConversion<string>();
        builder.Entity<Speech>()
            .Property(s => s.Target).HasConversion<string>();
        builder.Entity<Speech>()
            .Property(s => s.Tone).HasConversion<string>();

        builder.Entity<InGameInstruction>()
            .Property(i => i.Category).HasConversion<string>();

        builder.Entity<InternationalBreak>()
            .Property(ib => ib.Type).HasConversion<string>();

        builder.Entity<Player>().Property(p => p.MarketValue).HasPrecision(18, 2);
        builder.Entity<Contract>().Property(c => c.WeeklyWage).HasPrecision(18, 2);
        builder.Entity<Contract>().Property(c => c.ReleaseClause).HasPrecision(18, 2);
        builder.Entity<Contract>().Property(c => c.SigningBonus).HasPrecision(18, 2);
        builder.Entity<Contract>().Property(c => c.GoalBonus).HasPrecision(18, 2);
        builder.Entity<Contract>().Property(c => c.AssistBonus).HasPrecision(18, 2);
        builder.Entity<Team>().Property(t => t.WageBudget).HasPrecision(18, 2);
        builder.Entity<Team>().Property(t => t.TransferBudget).HasPrecision(18, 2);
        builder.Entity<Team>().Property(t => t.TotalBalance).HasPrecision(18, 2);
        builder.Entity<Team>().Property(t => t.TicketIncome).HasPrecision(18, 2);
        builder.Entity<Team>().Property(t => t.SponsorIncome).HasPrecision(18, 2);
        builder.Entity<Team>().Property(t => t.MerchandiseIncome).HasPrecision(18, 2);
        builder.Entity<Team>().Property(t => t.TvIncome).HasPrecision(18, 2);
        builder.Entity<Manager>().Property(m => m.PersonalBalance).HasPrecision(18, 2);
        builder.Entity<Transfer>().Property(t => t.Fee).HasPrecision(18, 2);
        builder.Entity<Transfer>().Property(t => t.LoanFee).HasPrecision(18, 2);
        builder.Entity<Transfer>().Property(t => t.LoanBuyOptionFee).HasPrecision(18, 2);
        builder.Entity<TransferOffer>().Property(o => o.OfferedFee).HasPrecision(18, 2);
        builder.Entity<TransferOffer>().Property(o => o.OfferedWage).HasPrecision(18, 2);
        builder.Entity<Country>().Property(c => c.ExchangeRateToEur).HasPrecision(18, 6);

        builder.Entity<Player>().HasIndex(p => p.TeamId);
        builder.Entity<Player>().HasIndex(p => p.Nationality);
        builder.Entity<Player>().HasIndex(p => p.IsLegend);
        builder.Entity<Team>().HasIndex(t => t.LeagueId);
        builder.Entity<LeagueTeamInstance>().HasIndex(lti => lti.LeagueInstanceId);
        builder.Entity<Fixture>().HasIndex(f => f.CompetitionId);
        builder.Entity<Fixture>().HasIndex(f => f.ScheduledDate);
        builder.Entity<Match>().HasIndex(m => m.Status);
        builder.Entity<MatchEvent>().HasIndex(e => e.MatchId);
        builder.Entity<MatchState>().HasIndex(s => new { s.MatchId, s.Tick });
        builder.Entity<Notification>().HasIndex(n => new { n.UserId, n.IsRead });
        builder.Entity<Transfer>().HasIndex(t => t.Status);
    }
}