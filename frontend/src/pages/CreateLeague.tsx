import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { leaguesApi } from '@/api';
import type { League } from '@/types';
import { ArrowLeft, Lock, Globe } from 'lucide-react';

export default function CreateLeague() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [baseLeagueId, setBaseLeagueId] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [baseLeagues, setBaseLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    leaguesApi.getBaseLeagues().then((data) => {
      setBaseLeagues(data);
      if (data.length > 0) setBaseLeagueId(data[0].id);
    }).finally(() => setLoading(false));
  }, []);

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
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate('/leagues')} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back
        </button>
        <div className="card p-6">
          <h1 className="text-xl font-bold text-white mb-5">Create New League</h1>
          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">League Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Enter league name" required maxLength={50} />
            </div>
            <div>
              <label className="label">Base League (Template)</label>
              <select value={baseLeagueId} onChange={(e) => setBaseLeagueId(e.target.value)} className="input">
                <option value="">No template</option>
                {baseLeagues.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.countryName}) - {l.maxTeams} teams</option>)}
              </select>
            </div>
            <div>
              <label className="label">Max Players</label>
              <input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 20)} className="input" min={2} max={30} />
            </div>
            <label className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-lg cursor-pointer border border-zinc-800 hover:border-zinc-700 transition-all">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="w-4 h-4 rounded accent-sky-500" />
              <div className="flex items-center gap-2">
                {isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                <div>
                  <p className="text-white text-sm font-medium">Private League</p>
                  <p className="text-zinc-500 text-xs">{isPrivate ? 'Password required to join' : 'Anyone can join'}</p>
                </div>
              </div>
            </label>
            {isPrivate && (
              <div>
                <label className="label">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="League password" required />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/leagues')} className="flex-1 btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting || !name.trim()} className="flex-1 btn-primary">{submitting ? 'Creating...' : 'Create League'}</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}