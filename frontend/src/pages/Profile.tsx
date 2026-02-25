import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import { User, Shield, Trophy, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) { navigate('/login'); return null; }

  const winRate = user.matchesPlayed > 0 ? Math.round((user.matchesWon / user.matchesPlayed) * 100) : 0;

  const handleChangePw = async () => {
    if (!currentPw || !newPw || newPw.length < 6) { toast.error('Password must be 6+ chars'); return; }
    setSaving(true);
    try {
      await authApi.changePassword(currentPw, newPw);
      toast.success('Password changed');
      setCurrentPw('');
      setNewPw('');
    } catch {
      toast.error('Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-5">
          <div className="card p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center mx-auto mb-3">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{user.displayName || user.userName}</h2>
            <p className="text-zinc-500 text-sm">@{user.userName}</p>
            {user.email && <p className="text-zinc-600 text-xs mt-1">{user.email}</p>}
            {user.isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded text-xs mt-2">
                <Shield className="w-3 h-3" />Admin
              </span>
            )}
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">CHANGE PASSWORD</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Current Password</label>
                <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="input" />
              </div>
              <button onClick={handleChangePw} disabled={saving} className="btn-secondary w-full text-sm">
                {saving ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="card p-6 mb-5">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4">CAREER STATISTICS</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Gamepad2, label: 'Played', value: user.matchesPlayed, color: 'text-white' },
                { icon: Trophy, label: 'Won', value: user.matchesWon, color: 'text-emerald-400' },
                { icon: Gamepad2, label: 'Drawn', value: user.matchesDrawn, color: 'text-amber-400' },
                { icon: Gamepad2, label: 'Lost', value: user.matchesLost, color: 'text-red-400' },
              ].map((s) => (
                <div key={s.label} className="text-center p-4 bg-zinc-800/40 rounded-lg">
                  <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-zinc-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">WIN RATE</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#27272a" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke={winRate > 60 ? '#10b981' : winRate > 40 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${winRate * 2.51} 251`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{winRate}%</span>
                  </div>
                </div>
                <div className="text-sm text-zinc-500">
                  <p>{user.matchesWon}W / {user.matchesDrawn}D / {user.matchesLost}L</p>
                  <p className="mt-1">from {user.matchesPlayed} matches</p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">TROPHIES</h3>
              <div className="flex items-center gap-4">
                <Trophy className={`w-12 h-12 ${user.trophiesWon > 0 ? 'text-amber-400' : 'text-zinc-700'}`} />
                <div>
                  <p className="text-3xl font-bold text-white">{user.trophiesWon}</p>
                  <p className="text-zinc-500 text-xs">titles won</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}