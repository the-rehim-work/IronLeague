/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/Loadingspinner';
import { leaguesApi, teamsApi, managersApi } from '../api';
import type { LeagueInstance, LeagueTeamInstance, Manager, Competition, Team } from '../types';
import { ArrowLeft, Play, FastForward, Users, Trophy, Calendar, Settings } from 'lucide-react';
import { getStatusBadgeClass, formatDate, formatCurrency } from '../lib/utils';
import Toast, { ToastType } from '../components/Toast';

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [league, setLeague] = useState<LeagueInstance | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [standings, setStandings] = useState<LeagueTeamInstance[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'standings' | 'fixtures' | 'teams'>('overview');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    if (id) loadLeague(id);
  }, [id]);

  const loadLeague = async (leagueId: string) => {
    try {
      const [leagueData, teamsData, compsData, myManagers] = await Promise.all([
        leaguesApi.getById(leagueId),
        leaguesApi.getTeams(leagueId).catch(() => []),
        leaguesApi.getCompetitions(leagueId).catch(() => []),
        managersApi.getMyManagers().catch(() => []),
      ]);

      setLeague(leagueData);
      setTeams(teamsData);
      setCompetitions(compsData);
      setManagers(myManagers.filter(m => !m.leagueInstanceId));

      if (compsData.length > 0) {
        const standingsData = await leaguesApi.getStandings(compsData[0].id).catch(() => []);
        setStandings(standingsData);
      }

      const myTeamData = await leaguesApi.getMyTeam(leagueId).catch(() => null);
      setMyTeam(myTeamData);

      if (leagueData.baseLeagueName) {
        const baseLeagues = await leaguesApi.getBaseLeagues();
        const baseLeague = baseLeagues.find(l => l.name === leagueData.baseLeagueName);
        if (baseLeague) {
          const baseTeams = await teamsApi.getByLeague(baseLeague.id);
          const takenTeamIds = teamsData.filter((t: any) => t.isControlledByPlayer).map((t: any) => t.baseTeamId);
          setAvailableTeams(baseTeams.filter(t => !takenTeamIds.includes(t.id)));
        }
      }
    } catch (error) {
      console.error('Failed to load league:', error);
      setError('Failed to load league');
    } finally {
      setLoading(false);
    }
  };

  const handleStartLeague = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await leaguesApi.start(id);
      await loadLeague(id);
    } catch (error) {
      console.error('Failed to start league:', error);
      setToast({ message: 'Failed to start league', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceDay = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const result = await leaguesApi.advanceDay(id);
      await loadLeague(id);
      if (result.playerMatchUpcoming) {
        setToast({ message: `Your match is scheduled! ${result.playerMatchUpcoming.homeTeamName} vs ${result.playerMatchUpcoming.awayTeamName}`, type: 'info' });
      }
    } catch (error) {
      console.error('Failed to advance day:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceUntilMatch = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const result = await leaguesApi.advanceUntilMatch(id);
      await loadLeague(id);
      if (result.playerMatchUpcoming) {
        setToast({ message: `Your next match: ${result.playerMatchUpcoming.homeTeamName} vs ${result.playerMatchUpcoming.awayTeamName}`, type: 'info' });
      }
    } catch (error) {
      console.error('Failed to advance:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinLeague = async (managerId: string, teamId: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await leaguesApi.join(id, managerId, teamId);
      setShowJoinModal(false);
      await loadLeague(id);
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to join league', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading league..." />
        </div>
      </Layout>
    );
  }

  if (error || !league) {
    return (
      <Layout>
        <div className="p-8">
          <button onClick={() => navigate('/leagues')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back to Leagues
          </button>
          <div className="card p-8 text-center">
            <p className="text-red-400">{error || 'League not found'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <button onClick={() => navigate('/leagues')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to Leagues
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{league.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(league.status)}`}>
                {league.status}
              </span>
            </div>
            <p className="text-gray-400">
              Season {league.currentSeason} • {formatDate(league.currentDate)} • Owner: {league.ownerName}
            </p>
          </div>

          <div className="flex gap-2">
            {league.status === 'Lobby' && !myTeam && managers.length > 0 && (
              <button onClick={() => setShowJoinModal(true)} className="btn-success">
                Join League
              </button>
            )}
            {league.status === 'Lobby' && (
              <button onClick={handleStartLeague} disabled={actionLoading} className="btn-primary">
                {actionLoading ? 'Starting...' : 'Start League'}
              </button>
            )}
            {league.status === 'Active' && myTeam && (
              <>
                <button onClick={handleAdvanceDay} disabled={actionLoading} className="btn-secondary flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  {actionLoading ? 'Simulating...' : 'Next Day'}
                </button>
                <button onClick={handleAdvanceUntilMatch} disabled={actionLoading} className="btn-primary flex items-center gap-2">
                  <FastForward className="w-4 h-4" />
                  Skip to Match
                </button>
              </>
            )}
          </div>
        </div>

        {myTeam && (
          <div className="card p-6 mb-6 border-blue-500">
            <h2 className="text-lg font-bold text-white mb-4">Your Team: {myTeam.name}</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Position</p>
                <p className="text-2xl font-bold text-white">
                  #{standings.findIndex(s => s.id === myTeam.teamInstanceId) + 1 || '-'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Points</p>
                <p className="text-2xl font-bold text-white">{myTeam.standings?.points || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">W-D-L</p>
                <p className="text-2xl font-bold text-white">
                  {myTeam.standings?.wins || 0}-{myTeam.standings?.draws || 0}-{myTeam.standings?.losses || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Goal Diff</p>
                <p className="text-2xl font-bold text-white">{myTeam.standings?.goalDifference || 0}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {['overview', 'standings', 'fixtures', 'teams'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">League Info</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Players</span>
                  <span className="text-white">{league.currentPlayerCount} / {league.maxPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Season</span>
                  <span className="text-white">{league.currentSeason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Date</span>
                  <span className="text-white">{formatDate(league.currentDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white">{league.isPrivate ? 'Private' : 'Public'}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Competitions</h2>
              {competitions.length === 0 ? (
                <p className="text-gray-400">No competitions yet</p>
              ) : (
                <div className="space-y-2">
                  {competitions.map((comp) => (
                    <div key={comp.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <span className="text-white">{comp.name}</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(comp.status)}`}>
                        {comp.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-gray-400">#</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400">Team</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400">P</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400">W</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400">D</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400">L</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400">GF</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400">GA</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400">GD</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, idx) => (
                  <tr
                    key={team.id}
                    className={`border-t border-gray-800 ${team.id === myTeam?.teamInstanceId ? 'bg-blue-900/20' : ''}`}
                  >
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.teamColors }} />
                        <span className="text-white font-medium">{team.teamName}</span>
                        {team.isControlledByPlayer && <Users className="w-4 h-4 text-blue-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">{team.played}</td>
                    <td className="px-4 py-3 text-center text-green-400">{team.wins}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{team.draws}</td>
                    <td className="px-4 py-3 text-center text-red-400">{team.losses}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{team.goalsFor}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{team.goalsAgainst}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{team.goalDifference}</td>
                    <td className="px-4 py-3 text-center text-white font-bold">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'fixtures' && (
          <FixturesTab leagueId={id!} />
        )}

        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => navigate(`/teams/${team.id}`)}
                className="card p-4 cursor-pointer hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: team.primaryColor }} />
                  <div>
                    <h3 className="text-white font-bold">{team.name}</h3>
                    <p className="text-sm text-gray-400">{team.shortName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {team.isControlledByPlayer ? (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Users className="w-4 h-4" />
                        {team.managerName || 'Player'}
                      </span>
                    ) : (
                      'AI'
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {showJoinModal && (
          <JoinLeagueModal
            managers={managers}
            teams={availableTeams}
            onJoin={handleJoinLeague}
            onClose={() => setShowJoinModal(false)}
            loading={actionLoading}
          />
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}

function FixturesTab({ leagueId }: { leagueId: string }) {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFixtures();
  }, [leagueId]);

  const loadFixtures = async () => {
    try {
      const data = await leaguesApi.getFixturesGrouped(leagueId);
      setWeeks(data.weeks || []);
      setUserTeamId(data.userTeamInstanceId || null);
    } catch (error) {
      console.error('Failed to load fixtures:', error);
      setWeeks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading fixtures..." />;
  }

  if (weeks.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-400">No fixtures scheduled yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {weeks.map((week: any) => (
        <div key={week.matchDay} className="card p-4">
          <h3 className="text-lg font-bold text-white mb-4">Matchday {week.matchDay}</h3>
          <div className="space-y-2">
            {week.fixtures.map((f: any) => (
              <div
                key={f.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  f.involvesUser ? 'bg-blue-900/30 border border-blue-500/50' : 'bg-gray-900/50 hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-white font-medium">{f.homeTeamName}</span>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: f.homeTeamColor }}
                    />
                  </div>

                  <div className="px-4 py-1 bg-gray-800 rounded min-w-[60px] text-center">
                    {f.status === 'Completed' && f.homeScore !== null ? (
                      <span className="text-white font-bold">
                        {f.homeScore} - {f.awayScore}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">vs</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: f.awayTeamColor }}
                    />
                    <span className="text-white font-medium">{f.awayTeamName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    f.status === 'Completed' ? 'bg-green-900/50 text-green-400' :
                    f.status === 'InProgress' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {f.status}
                  </span>
                  {f.matchId && (
                    <button
                      onClick={() => navigate(`/match/${f.matchId}`)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function JoinLeagueModal({ managers, teams, onJoin, onClose, loading }: {
  managers: Manager[];
  teams: Team[];
  onJoin: (managerId: string, teamId: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [selectedManager, setSelectedManager] = useState(managers[0]?.id || '');
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-4">Join League</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="label">Select Manager</label>
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="input"
            >
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.nationality})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Select Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="input"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onJoin(selectedManager, selectedTeam)}
            disabled={loading || !selectedManager || !selectedTeam}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}