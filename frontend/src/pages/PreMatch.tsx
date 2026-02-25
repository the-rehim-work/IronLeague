import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { matchesApi, tacticsApi, leaguesApi } from '@/api';
import type { TacticDto, MyTeamResponse } from '@/types';
import { ArrowLeft, Swords } from 'lucide-react';
import { toast } from 'sonner';

const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '5-4-1', '4-5-1'];

export default function PreMatch() {
  const { fixtureId, leagueId } = useParams<{ fixtureId: string; leagueId: string }>();
  const navigate = useNavigate();
  const [tactics, setTactics] = useState<TacticDto[]>([]);
  const [myTeam, setMyTeam] = useState<MyTeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [formation, setFormation] = useState('4-4-2');
  const [tacticStyle, setTacticStyle] = useState('Balanced');
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (leagueId) {
          const mt = await leaguesApi.getMyTeam(leagueId);
          setMyTeam(mt);
          const t = await tacticsApi.getForTeam(mt.teamInstanceId);
          setTactics(t);
          const def = t.find((x) => x.isDefault);
          if (def) {
            setSelectedTactic(def.id);
            setFormation(def.formation);
            setTacticStyle(def.name);
          }
        }
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [leagueId]);

  const handleStart = async () => {
    if (!fixtureId) return;
    setStarting(true);
    try {
      const match = await matchesApi.start({
        fixtureId,
        homeFormation: formation,
        homeTactics: tacticStyle,
        awayFormation: '4-4-2',
        awayTactics: 'Balanced',
      });
      navigate(`/match/${match.id}`, { replace: true });
    } catch {
      toast.error('Failed to start match');
      setStarting(false);
    }
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner /></div></Layout>;

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Swords className="w-10 h-10 text-sky-400 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-white">Match Setup</h1>
          {myTeam && <p className="text-zinc-500 text-sm mt-1">{myTeam.name}</p>}
        </div>

        {tactics.length > 0 && (
          <div className="card p-5 mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 mb-3">SAVED TACTICS</h2>
            <div className="grid grid-cols-3 gap-2">
              {tactics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTactic(t.id); setFormation(t.formation); setTacticStyle(t.name); }}
                  className={`p-3 rounded-lg text-left cursor-pointer transition-all ${selectedTactic === t.id ? 'bg-sky-600/20 border border-sky-500/50' : 'bg-zinc-800/40 border border-transparent hover:border-zinc-700'}`}
                >
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-sky-400 text-xs font-mono">{t.formation}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card p-5 mb-4">
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">FORMATION</h2>
          <div className="grid grid-cols-4 gap-2">
            {FORMATIONS.map((f) => (
              <button
                key={f}
                onClick={() => { setFormation(f); setSelectedTactic(null); }}
                className={`p-2.5 rounded-lg text-center text-sm font-mono cursor-pointer transition-all ${formation === f ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              >{f}</button>
            ))}
          </div>
        </div>

        {myTeam && myTeam.squad.length > 0 && (
          <div className="card p-5 mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 mb-3">SQUAD ({myTeam.squad.length})</h2>
            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
              {myTeam.squad.sort((a, b) => b.overall - a.overall).slice(0, 16).map((p) => (
                <div key={p.id} className="p-2 bg-zinc-800/40 rounded text-center">
                  <p className="text-white text-xs font-medium truncate">{p.lastName}</p>
                  <p className="text-zinc-500 text-[10px]">{p.position} · {p.overall}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleStart} disabled={starting} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
          <Swords className="w-5 h-5" />{starting ? 'Starting...' : 'Start Match'}
        </button>
      </div>
    </Layout>
  );
}