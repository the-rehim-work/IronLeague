import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { teamsApi } from '@/api';
import type { TeamDetail } from '@/types';
import { ArrowLeft, MapPin, Users } from 'lucide-react';
import { formatCurrency, ovrColor, conditionColor, statBarColor, positionColor } from '@/lib/utils';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<TeamDetail['squad'][0] | null>(null);
  const [sortBy, setSortBy] = useState<'overall' | 'position' | 'age' | 'value'>('overall');

  useEffect(() => {
    if (id) teamsApi.getDetail(id).then(setTeam).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner /></div></Layout>;
  if (!team) return <Layout><div className="card p-8 text-center text-zinc-500">Team not found</div></Layout>;

  const sorted = [...(team.squad || [])].sort((a, b) => {
    if (sortBy === 'overall') return b.overall - a.overall;
    if (sortBy === 'age') return a.age - b.age;
    if (sortBy === 'value') return b.marketValue - a.marketValue;
    return a.position.localeCompare(b.position);
  });

  const avgOvr = team.squad.length > 0 ? Math.round(team.squad.reduce((s, p) => s + p.overall, 0) / team.squad.length) : 0;

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>

      <div className="card p-5 mb-5" style={{ borderColor: team.primaryColor + '40' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xl font-bold" style={{ background: team.primaryColor }}>
            {team.shortName}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{team.name}</h1>
            <div className="flex items-center gap-3 text-zinc-500 text-sm">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{team.stadiumName} ({team.stadiumCapacity.toLocaleString()})</span>
              {team.managerName && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{team.managerName}</span>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { k: 'Points', v: team.standings?.points || 0 },
            { k: 'Record', v: `${team.standings?.wins || 0}W ${team.standings?.draws || 0}D ${team.standings?.losses || 0}L` },
            { k: 'GD', v: team.standings?.goalDifference || 0 },
            { k: 'Played', v: team.standings?.played || 0 },
          ].map((s) => (
            <div key={s.k} className="text-center p-2.5 bg-zinc-800/40 rounded-lg">
              <p className="text-zinc-500 text-[10px]">{s.k}</p>
              <p className="text-white font-bold">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { k: 'Wage Budget', v: formatCurrency(team.wageBudget), c: 'text-white' },
          { k: 'Transfer Budget', v: formatCurrency(team.transferBudget), c: 'text-emerald-400' },
          { k: 'Fan Loyalty', v: `${team.fanLoyalty}%`, c: 'text-white' },
          { k: 'Fan Mood', v: `${team.fanMood}%`, c: 'text-white' },
        ].map((s) => (
          <div key={s.k} className="card p-3.5">
            <p className="text-zinc-500 text-[10px]">{s.k}</p>
            <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden mb-5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
          <h2 className="text-sm font-semibold text-white">Squad ({team.squad.length}) · Avg OVR: <span className={ovrColor(avgOvr)}>{avgOvr}</span></h2>
          <div className="flex gap-1">
            {(['overall', 'position', 'age', 'value'] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)} className={`px-2.5 py-1 rounded text-[10px] font-medium capitalize cursor-pointer transition-all ${sortBy === s ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60">
              <tr>
                {['Player', 'Pos', 'Age', 'OVR', 'POT', 'PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY', 'FIT', 'MOR', 'Value'].map((h) => (
                  <th key={h} className={`px-2.5 py-2 text-[10px] text-zinc-500 font-medium ${h === 'Player' || h === 'Value' ? (h === 'Value' ? 'text-right' : 'text-left') : 'text-center'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} onClick={() => setSelectedPlayer(p)} className="border-t border-zinc-800/30 hover:bg-zinc-800/30 cursor-pointer transition-colors">
                  <td className="px-2.5 py-2">
                    <p className="text-white font-medium text-xs">{p.lastName}</p>
                    <p className="text-zinc-600 text-[10px]">{p.firstName}</p>
                  </td>
                  <td className="px-2.5 py-2 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${positionColor(p.position)}`}>{p.position}</span></td>
                  <td className="px-2.5 py-2 text-center text-zinc-400 text-xs">{p.age}</td>
                  <td className={`px-2.5 py-2 text-center font-bold text-xs ${ovrColor(p.overall)}`}>{p.overall}</td>
                  <td className={`px-2.5 py-2 text-center text-xs ${p.potential > p.overall ? 'text-cyan-400' : 'text-zinc-600'}`}>{p.potential}</td>
                  {[p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical].map((v, i) => (
                    <td key={i} className="px-2.5 py-2 text-center text-zinc-400 text-xs">{v}</td>
                  ))}
                  <td className={`px-2.5 py-2 text-center text-xs ${conditionColor(p.fitness)}`}>{p.fitness}</td>
                  <td className={`px-2.5 py-2 text-center text-xs ${conditionColor(p.morale)}`}>{p.morale}</td>
                  <td className="px-2.5 py-2 text-right text-zinc-500 text-xs">{formatCurrency(p.marketValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {team.staff && team.staff.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">STAFF</h2>
          <div className="grid grid-cols-3 gap-2">
            {team.staff.map((s) => (
              <div key={s.id} className="p-3 bg-zinc-800/40 rounded-lg">
                <p className="text-white text-sm font-medium">{s.name}</p>
                <p className="text-zinc-500 text-xs">{s.role} · Ability: {s.ability}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedPlayer(null)}>
          <div className="card p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{selectedPlayer.fullName}</h2>
              <button onClick={() => setSelectedPlayer(null)} className="text-zinc-500 hover:text-white text-xl cursor-pointer">×</button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center">
                <div className={`text-3xl font-bold ${ovrColor(selectedPlayer.overall)}`}>{selectedPlayer.overall}</div>
                <div className="text-zinc-500 text-xs">Overall</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">{selectedPlayer.potential}</div>
                <div className="text-zinc-500 text-xs">Potential</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{selectedPlayer.age}</div>
                <div className="text-zinc-500 text-xs">Age</div>
              </div>
            </div>

            <div className="flex gap-1.5 mb-5">
              <span className={`px-2 py-1 rounded text-xs font-bold text-white ${positionColor(selectedPlayer.position)}`}>{selectedPlayer.position}</span>
              {selectedPlayer.secondaryPosition && <span className="px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-400">{selectedPlayer.secondaryPosition}</span>}
              <span className="px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-400">{selectedPlayer.nationality}</span>
            </div>

            <div className="space-y-2.5 mb-5">
              {[
                { name: 'Pace', value: selectedPlayer.pace },
                { name: 'Shooting', value: selectedPlayer.shooting },
                { name: 'Passing', value: selectedPlayer.passing },
                { name: 'Dribbling', value: selectedPlayer.dribbling },
                { name: 'Defending', value: selectedPlayer.defending },
                { name: 'Physical', value: selectedPlayer.physical },
              ].map((stat) => (
                <div key={stat.name} className="flex items-center gap-2.5">
                  <span className="w-16 text-xs text-zinc-500">{stat.name}</span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${statBarColor(stat.value)} transition-all`} style={{ width: `${stat.value}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs font-medium text-white">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800">
              {[
                { k: 'Fitness', v: selectedPlayer.fitness },
                { k: 'Morale', v: selectedPlayer.morale },
                { k: 'Form', v: selectedPlayer.form },
              ].map((s) => (
                <div key={s.k} className="text-center">
                  <div className={`text-lg font-bold ${conditionColor(s.v)}`}>{s.v}%</div>
                  <div className="text-zinc-600 text-[10px]">{s.k}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
              <div className="text-xl font-bold text-emerald-400">{formatCurrency(selectedPlayer.marketValue)}</div>
              <div className="text-zinc-600 text-[10px]">Market Value</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}