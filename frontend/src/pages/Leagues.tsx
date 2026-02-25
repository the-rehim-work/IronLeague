import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/Loadingspinner';
import { leaguesApi } from '../api';
import type { LeagueInstance } from '../types';
import { Plus, Trophy, Users, Lock, Globe } from 'lucide-react';
import { getStatusBadgeClass, formatDate } from '../lib/utils';

export default function Leagues() {
  const navigate = useNavigate();
  const [publicLeagues, setPublicLeagues] = useState<LeagueInstance[]>([]);
  const [myLeagues, setMyLeagues] = useState<LeagueInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');

  useEffect(() => {
    loadLeagues();
  }, []);

  const loadLeagues = async () => {
    try {
      const [publicData, myData] = await Promise.all([
        leaguesApi.getPublic().catch(() => []),
        leaguesApi.getMine().catch(() => []),
      ]);
      setPublicLeagues(publicData);
      setMyLeagues(myData);
    } catch (error) {
      console.error('Failed to load leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading leagues..." />
        </div>
      </Layout>
    );
  }

  const displayLeagues = activeTab === 'my' ? myLeagues : publicLeagues;

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Leagues</h1>
            <p className="text-gray-400 mt-1">Join or create football leagues</p>
          </div>
          <button
            onClick={() => navigate('/leagues/create')}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus className="w-5 h-5" />
            Create League
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'my'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            My Leagues ({myLeagues.length})
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'public'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Public Leagues ({publicLeagues.length})
          </button>
        </div>

        {displayLeagues.length === 0 ? (
          <div className="card p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {activeTab === 'my' ? 'No Leagues Yet' : 'No Public Leagues Available'}
            </h2>
            <p className="text-gray-400 mb-6">
              {activeTab === 'my'
                ? 'Join a public league or create your own'
                : 'Be the first to create a public league'}
            </p>
            <button
              onClick={() => navigate('/leagues/create')}
              className="btn-primary"
            >
              Create a League
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayLeagues.map((league) => (
              <div
                key={league.id}
                onClick={() => navigate(`/leagues/${league.id}`)}
                className="card p-6 cursor-pointer hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {league.isPrivate ? (
                      <Lock className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <Globe className="w-5 h-5 text-green-400" />
                    )}
                    <h3 className="text-lg font-bold text-white">{league.name}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(league.status)}`}>
                    {league.status}
                  </span>
                </div>

                {league.baseLeagueName && (
                  <p className="text-sm text-gray-400 mb-3">Based on: {league.baseLeagueName}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Players</p>
                    <p className="text-white font-semibold flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {league.currentPlayerCount} / {league.maxPlayers}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Season</p>
                    <p className="text-white font-semibold">{league.currentSeason}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Owner</span>
                    <span className="text-white">{league.ownerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-400">Date</span>
                    <span className="text-white">{formatDate(league.currentDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}