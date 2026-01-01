import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/Loadingspinner';
import { playersApi } from '../api';
import { ArrowLeft, User, Flag, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, getPositionColor, getMoraleColor } from '../lib/utils';

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadPlayer(id);
  }, [id]);

  const loadPlayer = async (playerId: string) => {
    try {
      const data = await playersApi.getById(playerId);
      setPlayer(data);
    } catch (error) {
      console.error('Failed to load player:', error);
      setError('Player not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading player..." />
        </div>
      </Layout>
    );
  }

  if (error || !player) {
    return (
      <Layout>
        <div className="p-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="card p-8 text-center">
            <p className="text-red-400">{error || 'Player not found'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const overall = Math.round((player.pace + player.shooting + player.passing + player.dribbling + player.defending + player.physical) / 6);

  return (
    <Layout>
      <div className="p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mx-auto mb-4">
                  <span className={`text-3xl font-bold text-white`}>{overall}</span>
                </div>
                <h1 className="text-2xl font-bold text-white">{player.fullName}</h1>
                <span className={`inline-block mt-2 px-3 py-1 rounded text-sm font-bold text-white ${getPositionColor(player.primaryPosition)}`}>
                  {player.primaryPosition}
                  {player.secondaryPosition && ` / ${player.secondaryPosition}`}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Nationality
                  </span>
                  <span className="text-white">{player.nationality}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Age
                  </span>
                  <span className="text-white">{player.age}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Value
                  </span>
                  <span className="text-green-400">{formatCurrency(player.marketValue)}</span>
                </div>
                {player.teamName && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Team</span>
                    <span className="text-blue-400">{player.teamName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6 mt-6">
              <h2 className="text-lg font-bold text-white mb-4">Condition</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Morale</span>
                    <span className={getMoraleColor(player.morale)}>{player.morale}</span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${player.morale >= 75 ? 'bg-green-500' : player.morale >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${player.morale}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Fitness</span>
                    <span className={getMoraleColor(player.fitness)}>{player.fitness}</span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${player.fitness >= 75 ? 'bg-green-500' : player.fitness >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${player.fitness}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Form</span>
                    <span className={getMoraleColor(player.form)}>{player.form}</span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${player.form >= 75 ? 'bg-green-500' : player.form >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${player.form}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-6">Attributes</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { name: 'Pace', value: player.pace, color: 'from-green-500 to-green-600' },
                  { name: 'Shooting', value: player.shooting, color: 'from-red-500 to-red-600' },
                  { name: 'Passing', value: player.passing, color: 'from-blue-500 to-blue-600' },
                  { name: 'Dribbling', value: player.dribbling, color: 'from-yellow-500 to-yellow-600' },
                  { name: 'Defending', value: player.defending, color: 'from-purple-500 to-purple-600' },
                  { name: 'Physical', value: player.physical, color: 'from-orange-500 to-orange-600' },
                ].map((attr) => (
                  <div key={attr.name} className="text-center">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${attr.color} flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-2xl font-bold text-white">{attr.value}</span>
                    </div>
                    <p className="text-gray-400">{attr.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Potential</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Current: {overall}</span>
                    <span className="text-green-400">Potential: {player.potential}</span>
                  </div>
                  <div className="h-4 bg-gray-900 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-blue-600 absolute left-0"
                      style={{ width: `${overall}%` }}
                    />
                    <div 
                      className="h-full bg-green-600/30 absolute left-0"
                      style={{ width: `${player.potential}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Growth</p>
                  <p className="text-xl font-bold text-green-400">+{player.potential - overall}</p>
                </div>
              </div>
            </div>

            {player.contract && (
              <div className="card p-6 mt-6">
                <h2 className="text-xl font-bold text-white mb-4">Contract</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Weekly Wage</p>
                    <p className="text-white font-bold">{formatCurrency(player.contract.weeklyWage)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Expires</p>
                    <p className="text-white font-bold">{new Date(player.contract.endDate).toLocaleDateString()}</p>
                  </div>
                  {player.contract.releaseClause && (
                    <div>
                      <p className="text-gray-400 text-sm">Release Clause</p>
                      <p className="text-green-400 font-bold">{formatCurrency(player.contract.releaseClause)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {player.languages && player.languages.length > 0 && (
              <div className="card p-6 mt-6">
                <h2 className="text-xl font-bold text-white mb-4">Languages</h2>
                <div className="flex flex-wrap gap-2">
                  {player.languages.map((lang: any) => (
                    <span 
                      key={lang.languageCode}
                      className={`px-3 py-1 rounded-full text-sm ${lang.isNative ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}
                    >
                      {lang.languageCode.toUpperCase()}
                      {lang.isNative && ' (Native)'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}