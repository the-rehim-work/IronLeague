import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/Loadingspinner';
import { managersApi, leaguesApi, matchesApi } from '../api';
import type { Manager, LeagueInstance } from '../types';
import { Trophy, Users, Gamepad, Plus, Play } from 'lucide-react';
import { getStatusBadgeClass } from '../lib/utils';

export default function Dashboard() {
  const { user, setManagers } = useAuthStore();
  const navigate = useNavigate();
  const [managers, setLocalManagers] = useState<Manager[]>([]);
  const [leagues, setLeagues] = useState<LeagueInstance[]>([]);
  const [myLeagues, setMyLeagues] = useState<LeagueInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [managersData, publicLeagues, userLeagues] = await Promise.all([
        managersApi.getMyManagers(),
        leaguesApi.getPublic().catch(() => []),
        leaguesApi.getMine().catch(() => []),
      ]);
      setLocalManagers(managersData);
      setManagers(managersData);
      setLeagues(publicLeagues);
      setMyLeagues(userLeagues);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDemoMatch = async () => {
    try {
      setDemoLoading(true);
      const match = await matchesApi.createDemoMatch();
      navigate(`/match/${match.id}`);
    } catch (error) {
      console.error('Failed to create demo match:', error);
      alert('Failed to create demo match. Make sure the backend is running.');
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.displayName || user?.userName}!</h1>
          <p className="text-gray-400">Manage your football empire</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Gamepad className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Matches Played</p>
                <p className="text-2xl font-bold text-white">{user?.matchesPlayed || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="text-2xl font-bold text-green-400">
                  {user?.matchesPlayed ? Math.round((user.matchesWon / user.matchesPlayed) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Trophies</p>
                <p className="text-2xl font-bold text-yellow-400">{user?.trophiesWon || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Managers</p>
                <p className="text-2xl font-bold text-purple-400">{managers.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleStartDemoMatch}
              disabled={demoLoading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              {demoLoading ? 'Starting...' : 'Watch Demo Match'}
            </button>
            <button
              onClick={() => navigate('/managers/create')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Manager
            </button>
            <button
              onClick={() => navigate('/leagues/create')}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create League
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Your Managers</h2>
              <button
                onClick={() => navigate('/managers')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View All →
              </button>
            </div>

            {managers.length === 0 ? (
              <div className="card p-8 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No managers yet</p>
                <button
                  onClick={() => navigate('/managers/create')}
                  className="btn-primary"
                >
                  Create Your First Manager
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {managers.slice(0, 3).map((manager) => (
                  <div
                    key={manager.id}
                    onClick={() => navigate(`/managers/${manager.id}`)}
                    className="card p-4 cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-bold">{manager.name}</h3>
                        <p className="text-sm text-gray-400">{manager.nationality} • Rep: {manager.reputation}</p>
                      </div>
                      {manager.currentTeamName && (
                        <span className="text-blue-400 text-sm">{manager.currentTeamName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Your Leagues</h2>
              <button
                onClick={() => navigate('/leagues')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View All →
              </button>
            </div>

            {myLeagues.length === 0 ? (
              <div className="card p-8 text-center">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Not in any leagues yet</p>
                <button
                  onClick={() => navigate('/leagues')}
                  className="btn-primary"
                >
                  Browse Leagues
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myLeagues.slice(0, 3).map((league) => (
                  <div
                    key={league.id}
                    onClick={() => navigate(`/leagues/${league.id}`)}
                    className="card p-4 cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-bold">{league.name}</h3>
                        <p className="text-sm text-gray-400">
                          Season {league.currentSeason} • {league.currentPlayerCount}/{league.maxPlayers} players
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(league.status)}`}>
                        {league.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {leagues.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Public Leagues</h2>
              <button
                onClick={() => navigate('/leagues')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagues.slice(0, 6).map((league) => (
                <div
                  key={league.id}
                  onClick={() => navigate(`/leagues/${league.id}`)}
                  className="card p-4 cursor-pointer hover:border-green-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-bold">{league.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(league.status)}`}>
                      {league.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {league.currentPlayerCount}/{league.maxPlayers} players • Owner: {league.ownerName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}