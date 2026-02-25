import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { tacticsApi } from '@/api';
import type { TacticDto, CreateTacticDto } from '@/types';
import { ArrowLeft, Plus, Star, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '5-4-1', '4-5-1', '4-1-4-1', '4-3-2-1'];

const emptyTactic = (): CreateTacticDto => ({
  name: '',
  formation: '4-4-2',
  defensiveLine: 50,
  width: 50,
  tempo: 50,
  pressing: 50,
  counterAttack: false,
  playOutFromBack: false,
  directPassing: false,
  highPress: false,
  parkTheBus: false,
});

export default function Tactics() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [tactics, setTactics] = useState<TacticDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TacticDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateTacticDto>(emptyTactic());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!teamId) return;
    try {
      const data = await tacticsApi.getForTeam(teamId);
      setTactics(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [teamId]);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyTactic());
    setCreating(true);
  };

  const startEdit = (t: TacticDto) => {
    setCreating(false);
    setEditing(t);
    setForm({
      name: t.name, formation: t.formation, defensiveLine: t.defensiveLine,
      width: t.width, tempo: t.tempo, pressing: t.pressing,
      counterAttack: t.counterAttack, playOutFromBack: t.playOutFromBack,
      directPassing: t.directPassing, highPress: t.highPress, parkTheBus: t.parkTheBus,
    });
  };

  const cancel = () => { setCreating(false); setEditing(null); };

  const handleSave = async () => {
    if (!teamId || !form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await tacticsApi.update(editing.id, form);
        toast.success('Tactic updated');
      } else {
        await tacticsApi.create(teamId, form);
        toast.success('Tactic created');
      }
      cancel();
      await load();
    } catch {
      toast.error('Failed to save tactic');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await tacticsApi.remove(id);
      toast.success('Deleted');
      await load();
      if (editing?.id === id) cancel();
    } catch { toast.error('Delete failed'); }
  };

  const handleSetDefault = async (tacticId: string) => {
    if (!teamId) return;
    try {
      await tacticsApi.setDefault(teamId, tacticId);
      toast.success('Default tactic set');
      await load();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner /></div></Layout>;

  const showForm = creating || editing;

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-white">Tactics</h1>
        {!showForm && (
          <button onClick={startCreate} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" />New Tactic
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className={showForm ? '' : 'col-span-3'}>
          <div className={`grid ${showForm ? 'grid-cols-1' : 'grid-cols-3'} gap-3`}>
            {tactics.length === 0 ? (
              <div className="card p-8 text-center text-zinc-500 text-sm col-span-3">No tactics yet. Create one to get started.</div>
            ) : (
              tactics.map((t) => (
                <div
                  key={t.id}
                  onClick={() => startEdit(t)}
                  className={`card p-4 cursor-pointer transition-all hover:border-zinc-700 ${editing?.id === t.id ? 'border-sky-500/50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm">{t.name}</h3>
                    <div className="flex items-center gap-1.5">
                      {t.isDefault && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sky-400 text-xs font-mono mb-2">{t.formation}</p>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="flex justify-between"><span className="text-zinc-600">Line</span><span className="text-zinc-400">{t.defensiveLine}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">Width</span><span className="text-zinc-400">{t.width}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">Tempo</span><span className="text-zinc-400">{t.tempo}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">Press</span><span className="text-zinc-400">{t.pressing}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.counterAttack && <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded text-[9px]">Counter</span>}
                    {t.highPress && <span className="px-1.5 py-0.5 bg-rose-500/15 text-rose-400 rounded text-[9px]">High Press</span>}
                    {t.parkTheBus && <span className="px-1.5 py-0.5 bg-sky-500/15 text-sky-400 rounded text-[9px]">Park Bus</span>}
                    {t.playOutFromBack && <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-[9px]">Build-up</span>}
                    {t.directPassing && <span className="px-1.5 py-0.5 bg-violet-500/15 text-violet-400 rounded text-[9px]">Direct</span>}
                  </div>
                  {!t.isDefault && (
                    <button onClick={(e) => { e.stopPropagation(); handleSetDefault(t.id); }} className="mt-2 text-[10px] text-sky-400 hover:text-sky-300 cursor-pointer">
                      Set as default
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {showForm && (
          <div className="col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{editing ? 'Edit Tactic' : 'New Tactic'}</h2>
              <button onClick={cancel} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Attacking 4-3-3" />
              </div>

              <div>
                <label className="label">Formation</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {FORMATIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setForm({ ...form, formation: f })}
                      className={`p-2 rounded text-xs font-mono text-center cursor-pointer transition-all ${form.formation === f ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >{f}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'defensiveLine' as const, label: 'Defensive Line', low: 'Deep', high: 'High' },
                  { key: 'width' as const, label: 'Width', low: 'Narrow', high: 'Wide' },
                  { key: 'tempo' as const, label: 'Tempo', low: 'Slow', high: 'Fast' },
                  { key: 'pressing' as const, label: 'Pressing', low: 'Low', high: 'Intense' },
                ].map((s) => (
                  <div key={s.key}>
                    <div className="flex justify-between mb-1">
                      <label className="label mb-0">{s.label}</label>
                      <span className="text-xs text-white font-mono">{form[s.key]}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form[s.key]}
                      onChange={(e) => setForm({ ...form, [s.key]: +e.target.value })}
                      className="w-full accent-sky-500"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-600">
                      <span>{s.low}</span><span>{s.high}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Style Toggles</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'counterAttack' as const, label: 'Counter Attack' },
                    { key: 'playOutFromBack' as const, label: 'Play Out Back' },
                    { key: 'directPassing' as const, label: 'Direct Passing' },
                    { key: 'highPress' as const, label: 'High Press' },
                    { key: 'parkTheBus' as const, label: 'Park the Bus' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setForm({ ...form, [t.key]: !form[t.key] })}
                      className={`p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${form[t.key] ? 'bg-sky-600 text-white' : 'bg-zinc-800/60 text-zinc-500 hover:text-white'}`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>

              <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Tactic'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}