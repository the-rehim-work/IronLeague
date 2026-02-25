import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { useAuthStore } from '@/stores/authStore';
import { leaguesApi, managersApi, matchesApi } from '@/api';
import type {
  LeagueInstance, LeagueTeam, LeagueTeamInstance,
  FixtureWeek, GroupedFixture, SimulationResult, Manager, MyTeamResponse,
} from '@/types';
import { ArrowLeft, Play, FastForward, Users, Zap, Bot } from 'lucide-react';
import { statusBadge, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, managers: storeManagers, setManagers: setStoreManagers } = useAuthStore();

  const [league, setLeague] = useState<LeagueInstance | null>(null);
  const [teams, setTeams] = useState<LeagueTeam[]>([]);
  const [standings, setStandings] = useState<LeagueTeamInstance[]>([]);
  const [weeks, setWeeks] = useState<FixtureWeek[]>([]);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [myTeam, setMyTeam] = useState<MyTeamResponse | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [tab, setTab] = useState<'overview' | 'standings' | 'fixtures' | 'teams'>('overview');
  const [lastSim, setLastSim] = useState<SimulationResult | null>(null);
  const [pendingMatch, setPendingMatch] = useState<GroupedFixture | null>(null);
  const [filterTeam, setFilterTeam] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [joinManager, setJoinManager] = useState('');
  const [joinTeam, setJoinTeam] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const leagueData = await leaguesApi.getById(id);
      setLeague(leagueData);

      const teamsData = await leaguesApi.getTeams(id).catch(() => []);
      setTeams(teamsData);

      const myManagers = await managersApi.getMine().catch(() => []);
      setManagers(myManagers.filter((m) => !m.leagueInstanceId));
      setStoreManagers(myManagers);

      if (leagueData.status === 'Active') {
        const comps = await leaguesApi.getCompetitions(id).catch(() => []);
        if (comps.length > 0) {
          const s = await leaguesApi.getStandings(comps[0].id).catch(() => []);
          setStandings(s);
        }

        const grouped = await leaguesApi.getFixturesGrouped(id).catch(() => ({ userTeamInstanceId: null, weeks: [] }));
        setUserTeamId(grouped.userTeamInstanceId);
        setWeeks(grouped.weeks || []);

        const mt = await leaguesApi.getMyTeam(id).catch(() => null);
        setMyTeam(mt);
      }
    } catch {
      toast.error('Failed to load league');
    } finally {
      setLoading(false);
    }
  }, [id, setStoreManagers]);

  useEffect(() => { load(); }, [load]);

  const handleStart = async () => {
    if (!id) return;
    setSimulating(true);
    try {
      await leaguesApi.start(id);
      await load();
      toast.success('League started!');
    } catch {
      toast.error('Failed to start league');
    } finally {
      setSimulating(false);
    }
  };

  const handleAdvance = async (untilMatch: boolean, simulateOwn = false) => {
    if (!id) return;
    setSimulating(true);
    try {
      const result = untilMatch
        ? await leaguesApi.advanceUntilMatch(id, simulateOwn)
        : await leaguesApi.advanceDay(id, simulateOwn);
      setLastSim(result);
      if (result.playerMatchUpcoming && !simulateOwn) {
        setPendingMatch(result.playerMatchUpcoming);
      }
      await load();
    } catch {
      toast.error('Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleJoin = async () => {
    if (!id || !joinManager || !joinTeam) { setJoinError('Select both'); return; }
    setJoinError('');
    setJoinLoading(true);
    try {
      await leaguesApi.join(id, joinManager, joinTeam);
      setJoinManager('');
      setJoinTeam('');
      await load();
      toast.success('Joined league!');
    } catch (err: unknown) {
      setJoinError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally {
      setJoinLoading(false);
    }
  };

  const handlePlayMatch = async () => {
    if (!pendingMatch) return;
    try {
      const match = await matchesApi.start({
        fixtureId: pendingMatch.id,
        homeFormation: '4-4-2',
        homeTactics: 'Balanced',
        awayFormation: '4-4-2',
        awayTactics: 'Balanced',
      });
      setPendingMatch(null);
      navigate(`/match/${match.id}`);
    } catch {
      toast.error('Failed to start match, simulating instead');
      setPendingMatch(null);
      await handleAdvance(false, true);
    }
  };

  const handleSimOwn = async () => {
    setPendingMatch(null);
    await handleAdvance(false, true);
  };

  const filteredWeeks = weeks
    .map((w) => ({
      ...w,
      fixtures: w.fixtures.filter((f) => {
        if (filterTeam && f.homeTeamId !== filterTeam && f.awayTeamId !== filterTeam) return false;
        if (filterStatus === 'completed' && f.status !== 'Completed') return false;
        if (filterStatus === 'scheduled' && f.status !== 'Scheduled') return false;
        if (filterStatus === 'mine' && !f.involvesUser) return false;
        return true;
      }),
    }))
    .filter((w) => w.fixtures.length > 0);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner text="Loading league..." /></div></Layout>;
  if (!league) return <Layout><div className="card p-8 text-center text-zinc-500">League not found</div></Layout>;

  const isOwner = user?.id === league.ownerId;
  const userHasTeam = storeManagers.some((m) => m.leagueInstanceId === id);
  const freeManagers = managers;
  const availableTeams = teams.filter((t) => !t.isControlledByPlayer);

  return (
    <Layout>
      <button onClick={() => navigate('/leagues')} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>

      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{league.name}</h1>
            <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${statusBadge(league.status)}`}>{league.status}</span>
          </div>
          <p className="text-zinc-500 text-sm">Season {league.currentSeason} · {formatDate(league.currentDate)} · {league.ownerName}</p>
        </div>
        <div className="flex gap-2">
          {isOwner && league.status === 'Lobby' && (
            <button onClick={handleStart} disabled={simulating} className="btn-primary">{simulating ? 'Starting...' : 'Start League'}</button>
          )}
        </div>
      </div>

      {league.status === 'Active' && userHasTeam && (
        <div className="card p-4 mb-5 border-sky-500/20 bg-gradient-to-r from-sky-950/30 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-sky-400" />
              <div>
                <p className="text-white text-sm font-semibold">Game Controls</p>
                <p className="text-zinc-500 text-xs">{formatDate(league.currentDate)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAdvance(false)} disabled={simulating} className="btn-secondary flex items-center gap-1.5 text-xs">
                <Play className="w-3.5 h-3.5" />{simulating ? 'Simulating...' : 'Next Day'}
              </button>
              <button onClick={() => handleAdvance(true)} disabled={simulating} className="btn-primary flex items-center gap-1.5 text-xs">
                <FastForward className="w-3.5 h-3.5" />Skip to Match
              </button>
              <button onClick={() => handleAdvance(true, true)} disabled={simulating} className="btn-ghost flex items-center gap-1.5 text-xs">
                <Bot className="w-3.5 h-3.5" />Auto-Sim
              </button>
            </div>
          </div>
          {lastSim && lastSim.simulatedMatches.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800/60 flex flex-wrap gap-1.5">
              {lastSim.simulatedMatches.map((m, i) => (
                <span key={i} className={`px-2 py-0.5 rounded text-xs ${m.involvesPlayer ? 'bg-sky-500/20 text-sky-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  {m.homeTeamName} {m.homeScore}-{m.awayScore} {m.awayTeamName}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {myTeam && (
        <div className="card p-4 mb-5 border-sky-500/20">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm">Your Team: {myTeam.name}</p>
            <button onClick={() => userTeamId && navigate(`/teams/${userTeamId}`)} className="text-xs text-sky-400 hover:text-sky-300 cursor-pointer">View Squad</button>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-3">
            {[
              { k: 'Position', v: `#${(standings.findIndex((s) => s.id === userTeamId) + 1) || '-'}` },
              { k: 'Points', v: myTeam.standings?.points || 0 },
              { k: 'W-D-L', v: `${myTeam.standings?.wins || 0}-${myTeam.standings?.draws || 0}-${myTeam.standings?.losses || 0}` },
              { k: 'GD', v: myTeam.standings?.goalDifference || 0 },
            ].map((s) => (
              <div key={s.k} className="text-center">
                <p className="text-zinc-500 text-[10px]">{s.k}</p>
                <p className="text-white font-bold">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {league.status === 'Lobby' && !userHasTeam && freeManagers.length > 0 && availableTeams.length > 0 && (
        <div className="card p-5 mb-5">
          <h2 className="text-sm font-semibold text-white mb-3">Join This League</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Manager</label>
              <select value={joinManager} onChange={(e) => setJoinManager(e.target.value)} className="input text-sm">
                <option value="">Select...</option>
                {freeManagers.map((m) => <option key={m.id} value={m.id}>{m.name} (Rep {m.reputation})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Team</label>
              <select value={joinTeam} onChange={(e) => setJoinTeam(e.target.value)} className="input text-sm">
                <option value="">Select...</option>
                {availableTeams.map((t) => <option key={t.baseTeamId} value={t.baseTeamId}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleJoin} disabled={joinLoading || !joinManager || !joinTeam} className="w-full btn-success">{joinLoading ? 'Joining...' : 'Join'}</button>
            </div>
          </div>
          {joinError && <p className="text-red-400 text-xs mt-2">{joinError}</p>}
        </div>
      )}

      {league.status === 'Lobby' && !userHasTeam && freeManagers.length === 0 && (
        <div className="card p-5 mb-5 text-center">
          <p className="text-zinc-500 text-sm mb-3">Create a manager first to join this league</p>
          <button onClick={() => navigate('/managers/create')} className="btn-primary text-sm">Create Manager</button>
        </div>
      )}

      {league.status === 'Active' && (
        <div className="flex gap-1.5 mb-5">
          {(['overview', 'standings', 'fixtures', 'teams'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${tab === t ? 'bg-sky-600 text-white' : 'bg-zinc-800/60 text-zinc-400 hover:text-white'}`}>{t}</button>
          ))}
        </div>
      )}

      {(tab === 'overview' || league.status === 'Lobby') && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 card p-5">
            <h2 className="text-sm font-semibold text-zinc-400 mb-3">TEAMS ({teams.length})</h2>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
              {teams.map((t) => (
                <button key={t.id} onClick={() => navigate(`/teams/${t.id}`)} className={`p-3 rounded-lg flex items-center gap-3 text-left transition-all cursor-pointer ${t.id === userTeamId ? 'bg-sky-500/10 border border-sky-500/30' : 'bg-zinc-800/40 hover:bg-zinc-800/60 border border-transparent'}`}>
                  <div className="w-8 h-8 rounded-full shrink-0" style={{ background: t.primaryColor }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{t.name}</p>
                    <p className={`text-xs ${t.managerName ? 'text-sky-400' : 'text-zinc-600'}`}>{t.managerName || 'AI Managed'}</p>
                  </div>
                  {t.id === userTeamId && <span className="text-[10px] bg-sky-500 text-white px-1.5 py-0.5 rounded font-semibold">YOU</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-zinc-400 mb-3">INFO</h2>
            <div className="space-y-3 text-sm">
              {[
                ['Owner', league.ownerName],
                ['Players', `${teams.filter((t) => t.isControlledByPlayer).length}/${league.maxPlayers}`],
                ['Type', league.isPrivate ? 'Private' : 'Public'],
                ['Base', league.baseLeagueName || 'Custom'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-zinc-500">{k}</span>
                  <span className="text-white">{v}</span>
                </div>
              ))}
            </div>

            {standings.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-zinc-400 mb-2 mt-5">TOP 5</h2>
                <div className="space-y-1.5">
                  {standings.slice(0, 5).map((s, i) => (
                    <div key={s.id} className={`flex items-center justify-between text-xs p-2 rounded ${s.id === userTeamId ? 'bg-sky-500/10' : 'bg-zinc-800/30'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 w-4">{i + 1}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.teamColors }} />
                        <span className="text-white">{s.teamName}</span>
                      </div>
                      <span className="text-white font-bold">{s.points}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'standings' && league.status === 'Active' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80">
              <tr>
                {['#', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'].map((h) => (
                  <th key={h} className={`px-3 py-2.5 text-xs text-zinc-500 font-medium ${h === 'Team' ? 'text-left' : 'text-center'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => (
                <tr key={s.id} onClick={() => navigate(`/teams/${s.id}`)} className={`border-t border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors ${s.id === userTeamId ? 'bg-sky-900/15' : ''}`}>
                  <td className="px-3 py-2.5 text-zinc-500">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: s.teamColors }} />
                      <span className={`font-medium ${s.id === userTeamId ? 'text-sky-400' : s.isControlledByPlayer ? 'text-white' : 'text-zinc-300'}`}>{s.teamName}</span>
                      {s.isControlledByPlayer && <Users className="w-3 h-3 text-sky-500" />}
                      {s.id === userTeamId && <span className="text-[9px] bg-sky-500 text-white px-1 rounded font-bold">YOU</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-zinc-400">{s.played}</td>
                  <td className="px-3 py-2.5 text-center text-emerald-400">{s.wins}</td>
                  <td className="px-3 py-2.5 text-center text-zinc-400">{s.draws}</td>
                  <td className="px-3 py-2.5 text-center text-red-400">{s.losses}</td>
                  <td className="px-3 py-2.5 text-center text-zinc-400">{s.goalsFor}</td>
                  <td className="px-3 py-2.5 text-center text-zinc-400">{s.goalsAgainst}</td>
                  <td className="px-3 py-2.5 text-center text-zinc-400">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
                  <td className="px-3 py-2.5 text-center text-white font-bold">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'fixtures' && league.status === 'Active' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Team</label>
                <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} className="input text-sm">
                  <option value="">All Teams</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="label">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input text-sm">
                  <option value="all">All</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="mine">My Matches</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
            {filteredWeeks.length === 0 ? (
              <div className="card p-8 text-center text-zinc-500 text-sm">No fixtures match filters</div>
            ) : (
              filteredWeeks.map((w) => (
                <div key={w.matchDay}>
                  <div className="flex items-center justify-between mb-2 sticky top-0 bg-zinc-950 py-1 z-10">
                    <h3 className="text-sm font-semibold text-white">Matchday {w.matchDay}</h3>
                    <span className="text-xs text-zinc-600">{w.weekStart}</span>
                  </div>
                  <div className="space-y-1.5">
                    {w.fixtures.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => f.matchId && navigate(`/match/${f.matchId}`)}
                        className={`card p-3 flex items-center transition-all ${f.matchId ? 'cursor-pointer hover:border-zinc-700' : ''} ${f.involvesUser ? 'border-sky-500/30 bg-sky-950/20' : ''}`}
                      >
                        <div className="flex items-center gap-2 flex-1 justify-end text-right">
                          {f.involvesUser && f.homeTeamId === userTeamId && <span className="text-[9px] bg-sky-500 text-white px-1 rounded font-bold">YOU</span>}
                          <span className="text-sm text-white font-medium">{f.homeTeamName}</span>
                          <div className="w-3 h-3 rounded-full" style={{ background: f.homeTeamColor }} />
                        </div>
                        <div className="px-4 min-w-[70px] text-center">
                          {f.status === 'Completed' && f.homeScore !== undefined ? (
                            <span className="text-white font-bold text-sm">{f.homeScore} - {f.awayScore}</span>
                          ) : (
                            <span className="text-zinc-600 text-xs">vs</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-3 h-3 rounded-full" style={{ background: f.awayTeamColor }} />
                          <span className="text-sm text-white font-medium">{f.awayTeamName}</span>
                          {f.involvesUser && f.awayTeamId === userTeamId && <span className="text-[9px] bg-sky-500 text-white px-1 rounded font-bold">YOU</span>}
                        </div>
                        <span className={`ml-3 px-2 py-0.5 rounded text-[10px] font-medium ${f.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          {f.status === 'Scheduled' ? formatDate(f.scheduledDate) : f.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'teams' && league.status === 'Active' && (
        <div className="grid grid-cols-3 gap-3">
          {teams.map((t) => (
            <div key={t.id} onClick={() => navigate(`/teams/${t.id}`)} className="card p-4 cursor-pointer hover:border-zinc-700 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full" style={{ background: t.primaryColor }} />
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-zinc-500 text-xs">{t.shortName}</p>
                </div>
              </div>
              <p className={`text-xs ${t.isControlledByPlayer ? 'text-sky-400' : 'text-zinc-600'}`}>
                {t.isControlledByPlayer ? t.managerName || 'Player' : 'AI'}
              </p>
            </div>
          ))}
        </div>
      )}

      {pendingMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-white text-center mb-4">Your Match Today!</h2>
            <div className="flex items-center justify-center gap-5 py-5 mb-4 bg-zinc-800/60 rounded-lg">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-2" style={{ background: pendingMatch.homeTeamColor }} />
                <p className="text-white font-medium text-sm">{pendingMatch.homeTeamName}</p>
              </div>
              <span className="text-2xl font-bold text-zinc-600">VS</span>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-2" style={{ background: pendingMatch.awayTeamColor }} />
                <p className="text-white font-medium text-sm">{pendingMatch.awayTeamName}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSimOwn} className="flex-1 btn-secondary text-sm">Simulate</button>
              <button onClick={handlePlayMatch} className="flex-1 btn-primary text-sm">Play Match</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}