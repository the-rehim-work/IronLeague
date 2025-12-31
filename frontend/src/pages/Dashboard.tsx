import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { managersApi, leaguesApi, matchesApi } from '../api';
import type { Manager, LeagueInstance } from '../types';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [leagues, setLeagues] = useState<LeagueInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [managersData, leaguesData] = await Promise.all([
        managersApi.getMyManagers(),
        leaguesApi.getAll(),
      ]);
      setManagers(managersData);
      setLeagues(leaguesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartDemoMatch = async () => {
    try {
      setLoading(true);
      const match = await matchesApi.createDemoMatch();
      navigate(`/match/${match.id}`);
    } catch (error) {
      console.error('Failed to create demo match:', error);
      alert('Failed to create demo match. Make sure the backend is running and database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">IRON LEAGUE</h1>
              <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.displayName || user?.userName}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleStartDemoMatch}
                disabled={loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Creating Match...' : '⚽ Watch Demo Match'}
              </button>
              <div className="text-right">
                <p className="text-white font-semibold">{user?.userName}</p>
                <p className="text-gray-400 text-sm">
                  {user?.matchesWon}W - {user?.matchesDrawn}D - {user?.matchesLost}L
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Matches Played</p>
            <p className="text-3xl font-bold text-white mt-1">{user?.matchesPlayed || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Win Rate</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {user?.matchesPlayed ? Math.round((user.matchesWon / user.matchesPlayed) * 100) : 0}%
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Trophies</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">{user?.trophiesWon || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Active Managers</p>
            <p className="text-3xl font-bold text-blue-500 mt-1">{managers.length}</p>
          </div>
        </div>

        {/* Managers */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Your Managers</h2>
            <button
              onClick={() => navigate('/managers/create')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            >
              + Create Manager
            </button>
          </div>

          {managers.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <p className="text-gray-400 mb-4">You don't have any managers yet</p>
              <button
                onClick={() => navigate('/managers/create')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
              >
                Create Your First Manager
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managers.map((manager) => (
                <div
                  key={manager.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition cursor-pointer"
                  onClick={() => navigate(`/managers/${manager.id}`)}
                >
                  <h3 className="text-xl font-bold text-white mb-2">{manager.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{manager.nationality}</p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Physical</p>
                      <p className="text-lg font-bold text-white">{manager.physical}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Mental</p>
                      <p className="text-lg font-bold text-white">{manager.mental}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Technical</p>
                      <p className="text-lg font-bold text-white">{manager.technical}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Reputation: {manager.reputation}</span>
                    {manager.currentTeamName && (
                      <span className="text-blue-400">{manager.currentTeamName}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leagues */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Available Leagues</h2>
            <button
              onClick={() => navigate('/leagues/create')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
            >
              + Create League
            </button>
          </div>

          {leagues.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <p className="text-gray-400 mb-4">No leagues available</p>
              <button
                onClick={() => navigate('/leagues/create')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
              >
                Create a League
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leagues.map((league) => (
                <div
                  key={league.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-500 transition cursor-pointer"
                  onClick={() => navigate(`/leagues/${league.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{league.name}</h3>
                      {league.baseLeagueName && (
                        <p className="text-gray-400 text-sm">{league.baseLeagueName}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      league.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                      league.status === 'Lobby' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {league.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Players</p>
                      <p className="text-white font-semibold">
                        {league.currentPlayerCount} / {league.maxPlayers}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Season</p>
                      <p className="text-white font-semibold">{league.currentSeason}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Owner</p>
                      <p className="text-white font-semibold">{league.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="text-white font-semibold">
                        {league.isPrivate ? '🔒 Private' : '🌐 Public'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
