import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { trainingApi } from '@/api';
import type { TrainingSessionDto } from '@/types';
import { ArrowLeft, Dumbbell, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

const TYPES = ['General', 'Attacking', 'Defending', 'Fitness', 'Set Pieces', 'Tactical', 'Recovery'];
const FOCUS_ATTRS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

export default function Training() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TrainingSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState('General');
  const [intensity, setIntensity] = useState(50);
  const [focus, setFocus] = useState<string | undefined>();
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    if (!teamId) return;
    try {
      const data = await trainingApi.getForTeam(teamId, 20);
      setSessions(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [teamId]);

  const handleCreate = async () => {
    if (!teamId) return;
    setSaving(true);
    try {
      await trainingApi.create(teamId, { type, intensity, focusAttribute: focus });
      setCreating(false);
      toast.success('Training session created');
      await load();
    } catch {
      toast.error('Failed to create session');
    } finally { setSaving(false); }
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner /></div></Layout>;

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Dumbbell className="w-6 h-6 text-sky-400" />Training</h1>
        {!creating && (
          <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" />New Session
          </button>
        )}
      </div>

      {creating && (
        <div className="card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Schedule Training</h2>
            <button onClick={() => setCreating(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TYPES.map((t) => (
                  <button key={t} onClick={() => setType(t)} className={`p-2 rounded text-xs cursor-pointer transition-all ${type === t ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Intensity: {intensity}%</label>
              <input type="range" min={10} max={100} value={intensity} onChange={(e) => setIntensity(+e.target.value)} className="w-full accent-sky-500 mb-2" />
              <div className="flex justify-between text-[10px] text-zinc-600"><span>Light</span><span>Intense</span></div>
              <div className="mt-4 p-3 bg-zinc-800/40 rounded-lg text-xs text-zinc-500">
                {intensity > 80 ? 'Risk of injuries, high attribute gains' : intensity > 50 ? 'Balanced session, moderate gains' : intensity > 30 ? 'Light session, good recovery' : 'Recovery session, minimal fitness loss'}
              </div>
            </div>
            <div>
              <label className="label">Focus Attribute (optional)</label>
              <div className="grid grid-cols-2 gap-1.5">
                {FOCUS_ATTRS.map((a) => (
                  <button key={a} onClick={() => setFocus(focus === a ? undefined : a)} className={`p-2 rounded text-xs capitalize cursor-pointer transition-all ${focus === a ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>{a}</button>
                ))}
              </div>
              <button onClick={handleCreate} disabled={saving} className="btn-primary w-full mt-4">
                {saving ? 'Creating...' : 'Schedule Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sessions.length === 0 ? (
          <div className="card p-8 text-center text-zinc-500 text-sm">No training sessions yet</div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.processedAt ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
                    <Dumbbell className={`w-5 h-5 ${s.processedAt ? 'text-emerald-400' : 'text-amber-400'}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{s.type}</p>
                    <p className="text-zinc-500 text-xs">Intensity: {s.intensity}%{s.focusAttribute ? ` · Focus: ${s.focusAttribute}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${s.processedAt ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {s.processedAt ? 'Completed' : 'Pending'}
                  </span>
                  {s.processedAt && <span className="text-zinc-600 text-xs">{formatDate(s.processedAt)}</span>}
                </div>
              </button>
              {expanded === s.id && s.results && s.results.length > 0 && (
                <div className="border-t border-zinc-800/60 p-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left text-zinc-500 font-medium pb-2">Player</th>
                        <th className="text-center text-zinc-500 font-medium pb-2">Fitness Δ</th>
                        <th className="text-center text-zinc-500 font-medium pb-2">Morale Δ</th>
                        <th className="text-center text-zinc-500 font-medium pb-2">Improved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.results.map((r, i) => (
                        <tr key={i} className="border-t border-zinc-800/30">
                          <td className="py-1.5 text-white">{r.playerName}</td>
                          <td className="py-1.5 text-center">
                            <span className={`inline-flex items-center gap-0.5 ${r.fitnessChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {r.fitnessChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {r.fitnessChange > 0 ? '+' : ''}{r.fitnessChange}
                            </span>
                          </td>
                          <td className="py-1.5 text-center">
                            <span className={`inline-flex items-center gap-0.5 ${r.moraleChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {r.moraleChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {r.moraleChange > 0 ? '+' : ''}{r.moraleChange}
                            </span>
                          </td>
                          <td className="py-1.5 text-center">
                            {r.attributeImproved ? (
                              <span className="px-1.5 py-0.5 bg-cyan-500/15 text-cyan-400 rounded capitalize">{r.attributeImproved}</span>
                            ) : (
                              <span className="text-zinc-700">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}