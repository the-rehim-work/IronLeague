import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { leaguesApi } from '@/api';
import type { LeagueInstance } from '@/types';
import { Plus, Trophy, Users, Lock, Globe } from 'lucide-react';
import { statusBadge, formatDate } from '@/lib/utils';

export default function Leagues() {
  const navigate = useNavigate();
  const [publicLeagues, setPublic] = useState<LeagueInstance[]>([]);
  const [myLeagues, setMy] = useState<LeagueInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my' | 'public'>('my');

  useEffect(() => {
    Promise.all([leaguesApi.getPublic().catch(() => []), leaguesApi.getMine().catch(() => [])])
      .then(([p, m]) => { setPublic(p); setMy(m); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner text="Loading leagues..." /></div></Layout>;

  const list = tab === 'my' ? myLeagues : publicLeagues;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leagues</h1>
          <p className="text-zinc-500 text-sm mt-1">Join or create football leagues</p>
        </div>
        <button onClick={() => navigate('/leagues/create')} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Create League</button>
      </div>

      <div className="flex gap-2 mb-5">
        {[{ k: 'my' as const, l: `My Leagues (${myLeagues.length})` }, { k: 'public' as const, l: `Public (${publicLeagues.length})` }].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === t.k ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>{t.l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">{tab === 'my' ? 'Not in any leagues yet' : 'No public leagues'}</p>
          <button onClick={() => navigate('/leagues/create')} className="btn-primary">Create League</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {list.map((l) => (
            <div key={l.id} onClick={() => navigate(`/leagues/${l.id}`)} className="card p-5 cursor-pointer hover:border-zinc-700 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {l.isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                  <h3 className="text-white font-bold text-sm">{l.name}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge(l.status)}`}>{l.status}</span>
              </div>
              {l.baseLeagueName && <p className="text-zinc-600 text-xs mb-2">Based on: {l.baseLeagueName}</p>}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-zinc-600 text-[10px]">Players</p>
                  <p className="text-white text-sm font-medium flex items-center gap-1"><Users className="w-3 h-3 text-zinc-500" />{l.currentPlayerCount}/{l.maxPlayers}</p>
                </div>
                <div>
                  <p className="text-zinc-600 text-[10px]">Season</p>
                  <p className="text-white text-sm font-medium">{l.currentSeason}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-zinc-800/60 flex justify-between text-xs text-zinc-500">
                <span>{l.ownerName}</span>
                <span>{formatDate(l.currentDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}