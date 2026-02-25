import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { socialApi } from '@/api';
import { ArrowLeft, GraduationCap, TrendingUp, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { ovrColor, positionColor, formatCurrency } from '@/lib/utils';

interface YouthPlayer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  age: number;
  overall: number;
  potential: number;
  marketValue: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

interface AcademyInfo {
  level: number;
  maxLevel: number;
  youthPlayers: YouthPlayer[];
  upgradeCost: number;
  nextIntakeDate?: string;
  canIntake: boolean;
}

export default function YouthAcademy() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [academy, setAcademy] = useState<AcademyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [intaking, setIntaking] = useState(false);

  const load = async () => {
    if (!teamId) return;
    try {
      const data = await socialApi.getYouthAcademy(teamId);
      setAcademy(data);
    } catch {
      toast.error('Failed to load academy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [teamId]);

  const handleUpgrade = async () => {
    if (!teamId) return;
    setUpgrading(true);
    try {
      await socialApi.upgradeAcademy(teamId);
      toast.success('Academy upgraded!');
      await load();
    } catch {
      toast.error('Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  const handleIntake = async () => {
    if (!teamId) return;
    setIntaking(true);
    try {
      await socialApi.triggerIntake(teamId);
      toast.success('Youth intake complete!');
      await load();
    } catch {
      toast.error('Intake failed');
    } finally {
      setIntaking(false);
    }
  };

  const handlePromote = async (playerId: string, name: string) => {
    if (!teamId) return;
    try {
      await socialApi.promoteYouth(teamId, playerId);
      toast.success(`${name} promoted to first team!`);
      await load();
    } catch {
      toast.error('Promotion failed');
    }
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner text="Loading academy..." /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back
        </button>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Youth Academy</h1>
            <p className="text-zinc-500 text-sm mt-1">Develop the next generation</p>
          </div>
        </div>

        {!academy ? (
          <div className="card p-10 text-center">
            <GraduationCap className="w-14 h-14 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Academy data unavailable</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Level</p>
                    <p className="text-xl font-bold text-white">{academy.level} / {academy.maxLevel}</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Youth Players</p>
                    <p className="text-xl font-bold text-white">{academy.youthPlayers?.length || 0}</p>
                  </div>
                </div>
              </div>
              <div className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-zinc-500 text-xs">Actions</p>
                  <div className="flex gap-2 mt-1.5">
                    {academy.level < academy.maxLevel && (
                      <button onClick={handleUpgrade} disabled={upgrading} className="btn-primary text-xs">
                        <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                        {upgrading ? 'Upgrading...' : `Upgrade (${formatCurrency(academy.upgradeCost)})`}
                      </button>
                    )}
                    {academy.canIntake && (
                      <button onClick={handleIntake} disabled={intaking} className="btn-success text-xs">
                        {intaking ? 'Scouting...' : 'Youth Intake'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800/60">
                <h2 className="text-sm font-semibold text-white">Youth Players</h2>
              </div>
              {(!academy.youthPlayers || academy.youthPlayers.length === 0) ? (
                <div className="p-10 text-center">
                  <p className="text-zinc-500 text-sm">No youth players. Trigger an intake to scout new talent.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900/60">
                    <tr>
                      {['Player', 'Pos', 'Age', 'OVR', 'POT', 'PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY', ''].map((h) => (
                        <th key={h} className={`px-2.5 py-2 text-[10px] text-zinc-500 font-medium ${h === 'Player' ? 'text-left' : 'text-center'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {academy.youthPlayers.map((p) => (
                      <tr key={p.id} className="border-t border-zinc-800/30 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-2.5 py-2">
                          <p className="text-white font-medium text-xs">{p.fullName || `${p.firstName} ${p.lastName}`}</p>
                        </td>
                        <td className="px-2.5 py-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${positionColor(p.position)}`}>{p.position}</span>
                        </td>
                        <td className="px-2.5 py-2 text-center text-zinc-400 text-xs">{p.age}</td>
                        <td className={`px-2.5 py-2 text-center font-bold text-xs ${ovrColor(p.overall)}`}>{p.overall}</td>
                        <td className={`px-2.5 py-2 text-center text-xs ${p.potential > p.overall ? 'text-cyan-400' : 'text-zinc-600'}`}>{p.potential}</td>
                        {[p.pace, p.shooting, p.passing, p.dribbling, p.defending, p.physical].map((v, i) => (
                          <td key={i} className="px-2.5 py-2 text-center text-zinc-400 text-xs">{v}</td>
                        ))}
                        <td className="px-2.5 py-2 text-center">
                          <button onClick={() => handlePromote(p.id, p.fullName || p.lastName)} className="btn-primary text-[10px] px-2 py-1">
                            Promote
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}