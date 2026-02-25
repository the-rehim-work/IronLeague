import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { transferApi } from '@/api';
import type { Player } from '@/types';
import { ArrowLeft, Search, DollarSign, X } from 'lucide-react';
import { formatCurrency, positionColor, ovrColor, playerOverall } from '@/lib/utils';
import { toast } from 'sonner';

export default function Transfers() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const [sortBy, setSortBy] = useState<'overall' | 'age' | 'value'>('overall');
  const [offerTarget, setOfferTarget] = useState<Player | null>(null);
  const [fee, setFee] = useState('');
  const [wage, setWage] = useState('');
  const [years, setYears] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    transferApi.getFreeAgents().then(setAgents).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = agents
    .filter((p) => {
      if (search && !p.fullName.toLowerCase().includes(search.toLowerCase())) return false;
      if (posFilter && p.primaryPosition !== posFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'overall') return playerOverall(b) - playerOverall(a);
      if (sortBy === 'age') return a.age - b.age;
      return b.marketValue - a.marketValue;
    });

  const positions = [...new Set(agents.map((p) => p.primaryPosition))].sort();

  const handleOffer = async () => {
    if (!offerTarget) return;
    setSubmitting(true);
    try {
      await transferApi.makeOffer({
        playerId: offerTarget.id,
        offeredFee: parseInt(fee) || 0,
        offeredWage: parseInt(wage) || 0,
        contractYears: years,
        isLoan: false,
      });
      toast.success(`Offer sent to ${offerTarget.fullName}`);
      setOfferTarget(null);
      setFee('');
      setWage('');
    } catch {
      toast.error('Offer failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner /></div></Layout>;

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>

      <h1 className="text-2xl font-bold text-white mb-5">Transfer Market</h1>

      <div className="card p-4 mb-5">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players..." className="input pl-9" />
          </div>
          <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)} className="input w-32">
            <option value="">All Pos</option>
            {positions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="input w-32">
            <option value="overall">Overall</option>
            <option value="age">Age</option>
            <option value="value">Value</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60">
            <tr>
              {['Player', 'Pos', 'Age', 'OVR', 'PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY', 'Value', ''].map((h) => (
                <th key={h} className={`px-2.5 py-2.5 text-[10px] text-zinc-500 font-medium ${h === 'Player' ? 'text-left' : h === '' ? 'text-right' : 'text-center'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={12} className="py-8 text-center text-zinc-500 text-sm">No free agents found</td></tr>
            ) : (
              filtered.slice(0, 50).map((p) => {
                const ovr = playerOverall(p);
                return (
                  <tr key={p.id} className="border-t border-zinc-800/30 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-2.5 py-2">
                      <p className="text-white font-medium text-xs">{p.lastName}</p>
                      <p className="text-zinc-600 text-[10px]">{p.firstName} · {p.nationality}</p>
                    </td>
                    <td className="px-2.5 py-2 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${positionColor(p.primaryPosition)}`}>{p.primaryPosition}</span></td>
                    <td className="px-2.5 py-2 text-center text-zinc-400 text-xs">{p.age}</td>
                    <td className={`px-2.5 py-2 text-center font-bold text-xs ${ovrColor(ovr)}`}>{ovr}</td>
                    {[p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical].map((v, i) => (
                      <td key={i} className="px-2.5 py-2 text-center text-zinc-400 text-xs">{v}</td>
                    ))}
                    <td className="px-2.5 py-2 text-center text-zinc-500 text-xs">{formatCurrency(p.marketValue)}</td>
                    <td className="px-2.5 py-2 text-right">
                      <button onClick={() => { setOfferTarget(p); setFee(String(p.marketValue)); setWage(String(Math.round(p.marketValue / 52))); }} className="text-sky-400 hover:text-sky-300 text-xs cursor-pointer">
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {filtered.length > 50 && <p className="text-center text-zinc-600 text-xs py-3">Showing 50 of {filtered.length}</p>}
      </div>

      {offerTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setOfferTarget(null)}>
          <div className="card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Make Offer</h2>
              <button onClick={() => setOfferTarget(null)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-800/60 rounded-lg">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${positionColor(offerTarget.primaryPosition)}`}>{offerTarget.primaryPosition}</div>
              <div>
                <p className="text-white font-medium text-sm">{offerTarget.fullName}</p>
                <p className="text-zinc-500 text-xs">Age {offerTarget.age} · OVR {playerOverall(offerTarget)} · {formatCurrency(offerTarget.marketValue)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Transfer Fee (€)</label>
                <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Weekly Wage (€)</label>
                <input type="number" value={wage} onChange={(e) => setWage(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Contract Years</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((y) => (
                    <button key={y} onClick={() => setYears(y)} className={`flex-1 py-2 rounded text-xs font-medium cursor-pointer transition-all ${years === y ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{y}yr</button>
                  ))}
                </div>
              </div>
              <button onClick={handleOffer} disabled={submitting} className="btn-success w-full">
                {submitting ? 'Sending...' : 'Send Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}