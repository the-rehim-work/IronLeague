import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { playersApi } from '@/api';
import type { Player } from '@/types';
import { ArrowLeft, Flag, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, positionColor, conditionColor, statBarColor, playerOverall } from '@/lib/utils';

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) playersApi.getById(id).then(setPlayer).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner /></div></Layout>;
  if (!player) return <Layout><div className="card p-8 text-center text-zinc-500">Player not found</div></Layout>;

  const ovr = playerOverall(player);

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="card p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-white">{ovr}</span>
            </div>
            <h1 className="text-xl font-bold text-white">{player.fullName}</h1>
            <span className={`inline-block mt-2 px-2.5 py-1 rounded text-xs font-bold text-white ${positionColor(player.primaryPosition)}`}>
              {player.primaryPosition}{player.secondaryPosition ? ` / ${player.secondaryPosition}` : ''}
            </span>
            <div className="space-y-3 mt-5 text-sm">
              {[
                { icon: Flag, k: 'Nationality', v: player.nationality },
                { icon: Calendar, k: 'Age', v: player.age },
                { icon: DollarSign, k: 'Value', v: formatCurrency(player.marketValue) },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5"><r.icon className="w-3.5 h-3.5" />{r.k}</span>
                  <span className="text-white font-medium">{r.v}</span>
                </div>
              ))}
              {player.teamName && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Team</span>
                  <span className="text-sky-400">{player.teamName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white mb-3">Condition</h2>
            {[
              { k: 'Morale', v: player.morale },
              { k: 'Fitness', v: player.fitness },
              { k: 'Form', v: player.form },
            ].map((s) => (
              <div key={s.k} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">{s.k}</span>
                  <span className={conditionColor(s.v)}>{s.v}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${statBarColor(s.v)}`} style={{ width: `${s.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 space-y-5">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-5">Attributes</h2>
            <div className="grid grid-cols-3 gap-5">
              {[
                { name: 'Pace', value: player.pace, gradient: 'from-emerald-500 to-emerald-600' },
                { name: 'Shooting', value: player.shooting, gradient: 'from-rose-500 to-rose-600' },
                { name: 'Passing', value: player.passing, gradient: 'from-sky-500 to-sky-600' },
                { name: 'Dribbling', value: player.dribbling, gradient: 'from-amber-500 to-amber-600' },
                { name: 'Defending', value: player.defending, gradient: 'from-violet-500 to-violet-600' },
                { name: 'Physical', value: player.physical, gradient: 'from-orange-500 to-orange-600' },
              ].map((a) => (
                <div key={a.name} className="text-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${a.gradient} flex items-center justify-center mx-auto mb-1.5`}>
                    <span className="text-xl font-bold text-white">{a.value}</span>
                  </div>
                  <p className="text-zinc-400 text-xs">{a.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white mb-3">Potential</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-500">Current: {ovr}</span>
                  <span className="text-emerald-400">Potential: {player.potential}</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden relative">
                  <div className="h-full bg-emerald-600/30 absolute left-0" style={{ width: `${player.potential}%` }} />
                  <div className="h-full bg-sky-600 absolute left-0" style={{ width: `${ovr}%` }} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-400">+{player.potential - ovr}</p>
                <p className="text-zinc-600 text-[10px]">Growth</p>
              </div>
            </div>
          </div>

          {player.contract && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-white mb-3">Contract</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-zinc-500 text-xs">Weekly Wage</p>
                  <p className="text-white font-bold">{formatCurrency(player.contract.weeklyWage)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Expires</p>
                  <p className="text-white font-bold">{new Date(player.contract.endDate).toLocaleDateString()}</p>
                </div>
                {player.contract.releaseClause && (
                  <div>
                    <p className="text-zinc-500 text-xs">Release Clause</p>
                    <p className="text-emerald-400 font-bold">{formatCurrency(player.contract.releaseClause)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}