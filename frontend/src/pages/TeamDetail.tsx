/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/Loadingspinner';
import PlayerCard from '../components/PlayerCard';
import { teamsApi } from '../api';
import { ArrowLeft, Users, Trophy, MapPin, DollarSign } from 'lucide-react';
import { formatCurrency, getPositionColor } from '../lib/utils';

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'squad' | 'stats' | 'staff'>('squad');

  useEffect(() => {
    if (id) loadTeam(id);
  }, [id]);

  const loadTeam = async (teamId: string) => {
    try {
      const data = await teamsApi.getDetail(teamId);
      setTeam(data);
    } catch (error) {
      console.error('Failed to load team:', error);
      setError('Team not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading team..." />
        </div>
      </Layout>
    );
  }

  if (error || !team) {
    return (
      <Layout>
        <div className="p-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="card p-8 text-center">
            <p className="text-red-400">{error || 'Team not found'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="card p-6 mb-6" style={{ borderColor: team.primaryColor }}>
          <div className="flex items-start gap-6">
            <div 
              className="w-24 h-24 rounded-lg flex items-center justify-center text-white text-3xl font-bold"
              style={{ backgroundColor: team.primaryColor }}
            >
              {team.shortName}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">{team.name}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {team.stadiumName} ({team.stadiumCapacity.toLocaleString()})
                </span>
                {team.managerName && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {team.managerName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Points</p>
              <p className="text-2xl font-bold text-white">{team.standings?.points || 0}</p>
            </div>
            <div className="text-center p-3 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Played</p>
              <p className="text-2xl font-bold text-white">{team.standings?.played || 0}</p>
            </div>
            <div className="text-center p-3 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">W-D-L</p>
              <p className="text-2xl font-bold text-white">
                {team.standings?.wins || 0}-{team.standings?.draws || 0}-{team.standings?.losses || 0}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Goal Diff</p>
              <p className="text-2xl font-bold text-white">{team.standings?.goalDifference || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="card p-4">
            <p className="text-gray-400 text-sm">Wage Budget</p>
            <p className="text-xl font-bold text-white">{formatCurrency(team.wageBudget)}</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-400 text-sm">Transfer Budget</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(team.transferBudget)}</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-400 text-sm">Fan Loyalty</p>
            <p className="text-xl font-bold text-white">{team.fanLoyalty}%</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-400 text-sm">Fan Mood</p>
            <p className="text-xl font-bold text-white">{team.fanMood}%</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {['squad', 'staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'squad' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Squad ({team.squad?.length || 0} players)</h2>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-gray-400">Player</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400">Pos</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400">Age</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400">OVR</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400">PAC</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400">SHO</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400">PAS</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400">DRI</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400">DEF</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400">PHY</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-400">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {team.squad?.map((player: any) => (
                    <tr 
                      key={player.id}
                      onClick={() => navigate(`/players/${player.id}`)}
                      className="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="text-white font-medium">{player.fullName}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getPositionColor(player.position)}`}>
                          {player.position}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{player.age}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${player.overall >= 80 ? 'text-green-400' : player.overall >= 70 ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {player.overall}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{player.pace}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{player.shooting}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{player.passing}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{player.dribbling}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{player.defending}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{player.physical}</td>
                      <td className="px-4 py-3 text-right text-green-400">{formatCurrency(player.marketValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.staff?.length === 0 ? (
              <div className="col-span-full card p-8 text-center">
                <p className="text-gray-400">No staff members</p>
              </div>
            ) : (
              team.staff?.map((s: any) => (
                <div key={s.id} className="card p-4">
                  <h3 className="text-white font-bold">{s.name}</h3>
                  <p className="text-gray-400 text-sm">{s.role}</p>
                  <div className="mt-2">
                    <span className="text-gray-500 text-sm">Ability: </span>
                    <span className="text-white font-medium">{s.ability}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}