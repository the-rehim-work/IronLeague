/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/Loadingspinner';
import { leaguesApi } from '../api';
import type { League } from '../types';
import { ArrowLeft, Lock, Globe } from 'lucide-react';

export default function CreateLeague() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [baseLeagueId, setBaseLeagueId] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [baseLeagues, setBaseLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBaseLeagues();
  }, []);

  const loadBaseLeagues = async () => {
    try {
      const data = await leaguesApi.getBaseLeagues();
      setBaseLeagues(data);
      if (data.length > 0) {
        setBaseLeagueId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load base leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError('');
    setSubmitting(true);

    try {
      const league = await leaguesApi.create({
        name: name.trim(),
        baseLeagueId: baseLeagueId || undefined,
        isPrivate,
        password: isPrivate ? password : undefined,
        maxPlayers,
      });
      navigate(`/leagues/${league.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create league');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/leagues')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Leagues
        </button>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Create New League</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">League Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Enter league name"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label className="label">Base League (Template)</label>
              <select
                value={baseLeagueId}
                onChange={(e) => setBaseLeagueId(e.target.value)}
                className="input"
              >
                <option value="">No template (empty league)</option>
                {baseLeagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} ({league.countryName}) - {league.maxTeams} teams
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selecting a base league will pre-populate teams from that league
              </p>
            </div>

            <div>
              <label className="label">Max Players</label>
              <input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 20)}
                className="input"
                min={2}
                max={30}
              />
            </div>

            <div className="card p-4 bg-gray-900/50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  {isPrivate ? (
                    <Lock className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Globe className="w-5 h-5 text-green-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">Private League</p>
                    <p className="text-sm text-gray-400">
                      {isPrivate
                        ? 'Only players with password can join'
                        : 'Anyone can join this league'}
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {isPrivate && (
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter league password"
                  required={isPrivate}
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/leagues')}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create League'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}