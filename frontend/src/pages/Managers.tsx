import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { managersApi } from '@/api';
import type { Manager } from '@/types';
import { Plus, User, Briefcase } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function Managers() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managersApi.getMine().then(setManagers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner text="Loading managers..." /></div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Managers</h1>
          <p className="text-zinc-500 text-sm mt-1">Create and manage your football managers</p>
        </div>
        <button onClick={() => navigate('/managers/create')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />Create Manager
        </button>
      </div>

      {managers.length === 0 ? (
        <div className="card p-12 text-center">
          <User className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">No Managers Yet</h2>
          <p className="text-zinc-500 text-sm mb-5">Create your first manager to start</p>
          <button onClick={() => navigate('/managers/create')} className="btn-primary">Create Manager</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {managers.map((m) => (
            <div key={m.id} onClick={() => navigate(`/managers/${m.id}`)} className="card p-5 cursor-pointer hover:border-zinc-700 transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {m.name[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{m.name}</h3>
                  <p className="text-zinc-500 text-sm">{m.nationality} · Age {m.age}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { k: 'PHY', v: m.physical },
                  { k: 'MEN', v: m.mental },
                  { k: 'TEC', v: m.technical },
                ].map((a) => (
                  <div key={a.k} className="text-center p-2 bg-zinc-800/60 rounded-lg">
                    <p className="text-[10px] text-zinc-500">{a.k}</p>
                    <p className="text-sm font-bold text-white">{a.v}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Rep: {m.reputation}</span>
                <span className="text-emerald-400">{formatCurrency(m.personalBalance)}</span>
              </div>
              {m.currentTeamName && (
                <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-1.5 text-sky-400 text-xs">
                  <Briefcase className="w-3 h-3" />{m.currentTeamName}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}