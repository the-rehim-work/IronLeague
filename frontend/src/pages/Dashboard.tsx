import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { managersApi, leaguesApi, matchesApi } from '@/api';
import type { Manager, LeagueInstance } from '@/types';
import { Trophy, Users, Gamepad, Plus, Play } from 'lucide-react';
import { statusBadge } from '@/lib/utils';

export default function Dashboard() {
  const { user, setManagers } = useAuthStore();
  const navigate = useNavigate();
  const [managers, setLocal] = useState<Manager[]>([]);
  const [myLeagues, setMyLeagues] = useState<LeagueInstance[]>([]);
  const [publicLeagues, setPublicLeagues] = useState<LeagueInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      managersApi.getMine().catch(() => []),
      leaguesApi.getMine().catch(() => []),
      leaguesApi.getPublic().catch(() => []),
    ]).then(([m, ml, pl]) => {
      setLocal(m);
      setManagers(m);
      setMyLeagues(ml);
      setPublicLeagues(pl);
    }).finally(() => setLoading(false));
  }, [setManagers]);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      const match = await matchesApi.createDemo();
      navigate(`/match/${match.id}`);
    } catch {
      alert('Failed to create demo match');
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading) {
    return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner text="Loading dashboard..." /></div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.displayName || user?.userName}</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your football empire</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Matches', value: user?.matchesPlayed || 0, icon: Gamepad, color: 'text-sky-400 bg-sky-500/10' },
          { label: 'Win Rate', value: user?.matchesPlayed ? `${Math.round(((user?.matchesWon || 0) / user.matchesPlayed) * 100)}%` : '0%', icon: Trophy, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Trophies', value: user?.trophiesWon || 0, icon: Trophy, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Managers', value: managers.length, icon: Users, color: 'text-violet-400 bg-violet-500/10' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-zinc-500 text-xs">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 mb-3">QUICK ACTIONS</h2>
        <div className="flex gap-3">
          <button onClick={handleDemo} disabled={demoLoading} className="btn-success flex items-center gap-2">
            <Play className="w-4 h-4" />{demoLoading ? 'Starting...' : 'Demo Match'}
          </button>
          <button onClick={() => navigate('/managers/create')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />Manager
          </button>
          <button onClick={() => navigate('/leagues/create')} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" />League
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400">YOUR MANAGERS</h2>
            <button onClick={() => navigate('/managers')} className="text-xs text-sky-400 hover:text-sky-300">View All</button>
          </div>
          {managers.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-zinc-500 text-sm mb-3">No managers yet</p>
              <button onClick={() => navigate('/managers/create')} className="btn-primary text-sm">Create Manager</button>
            </div>
          ) : (
            <div className="space-y-2">
              {managers.slice(0, 4).map((m) => (
                <div key={m.id} onClick={() => navigate(`/managers/${m.id}`)} className="card p-3.5 cursor-pointer hover:border-zinc-700 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{m.name}</p>
                      <p className="text-zinc-500 text-xs">{m.nationality} · Rep {m.reputation}</p>
                    </div>
                    {m.currentTeamName && <span className="text-sky-400 text-xs">{m.currentTeamName}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400">YOUR LEAGUES</h2>
            <button onClick={() => navigate('/leagues')} className="text-xs text-sky-400 hover:text-sky-300">View All</button>
          </div>
          {myLeagues.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-zinc-500 text-sm mb-3">Not in any leagues</p>
              <button onClick={() => navigate('/leagues')} className="btn-primary text-sm">Browse Leagues</button>
            </div>
          ) : (
            <div className="space-y-2">
              {myLeagues.slice(0, 4).map((l) => (
                <div key={l.id} onClick={() => navigate(`/leagues/${l.id}`)} className="card p-3.5 cursor-pointer hover:border-zinc-700 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{l.name}</p>
                      <p className="text-zinc-500 text-xs">Season {l.currentSeason} · {l.currentPlayerCount}/{l.maxPlayers}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge(l.status)}`}>{l.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {publicLeagues.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">PUBLIC LEAGUES</h2>
          <div className="grid grid-cols-3 gap-3">
            {publicLeagues.slice(0, 6).map((l) => (
              <div key={l.id} onClick={() => navigate(`/leagues/${l.id}`)} className="card p-3.5 cursor-pointer hover:border-zinc-700 transition-all">
                <p className="text-white font-medium text-sm">{l.name}</p>
                <p className="text-zinc-500 text-xs">{l.currentPlayerCount}/{l.maxPlayers} · {l.ownerName}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}