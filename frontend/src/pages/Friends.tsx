import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { socialApi } from '@/api';
import type { FriendshipDto, LeagueInviteDto } from '@/types';
import { UserPlus, UserMinus, Check, X, Mail, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<FriendshipDto[]>([]);
  const [pending, setPending] = useState<FriendshipDto[]>([]);
  const [invites, setInvites] = useState<LeagueInviteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [addName, setAddName] = useState('');
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<'friends' | 'pending' | 'invites'>('friends');

  const load = async () => {
    try {
      const [f, p, i] = await Promise.all([
        socialApi.getFriends().catch(() => []),
        socialApi.getPendingRequests().catch(() => []),
        socialApi.getInvites().catch(() => []),
      ]);
      setFriends(f);
      setPending(p);
      setInvites(i);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!addName.trim()) return;
    setAdding(true);
    try {
      await socialApi.sendRequest(addName.trim());
      toast.success(`Request sent to ${addName}`);
      setAddName('');
      await load();
    } catch {
      toast.error('Failed to send request');
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await socialApi.acceptRequest(id);
      toast.success('Friend request accepted');
      await load();
    } catch {
      toast.error('Failed');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await socialApi.declineRequest(id);
      await load();
    } catch {
      toast.error('Failed');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await socialApi.removeFriend(id);
      toast.success('Friend removed');
      await load();
    } catch {
      toast.error('Failed');
    }
  };

  const handleAcceptInvite = async (id: string) => {
    try {
      await socialApi.acceptInvite(id);
      toast.success('Invite accepted');
      await load();
    } catch {
      toast.error('Failed');
    }
  };

  const handleDeclineInvite = async (id: string) => {
    try {
      await socialApi.declineInvite(id);
      await load();
    } catch {
      toast.error('Failed');
    }
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner text="Loading..." /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Friends & Invites</h1>
        <p className="text-zinc-500 text-sm mb-5">Manage your social connections</p>

        <div className="card p-4 mb-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="input flex-1"
              placeholder="Add friend by username..."
            />
            <button onClick={handleAdd} disabled={adding || !addName.trim()} className="btn-primary flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />{adding ? 'Sending...' : 'Add'}
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 mb-5">
          {([
            { k: 'friends' as const, l: `Friends (${friends.length})`, icon: null },
            { k: 'pending' as const, l: `Pending (${pending.length})`, icon: pending.length > 0 },
            { k: 'invites' as const, l: `Invites (${invites.length})`, icon: invites.length > 0 },
          ]).map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer relative ${tab === t.k ? 'bg-sky-600 text-white' : 'bg-zinc-800/60 text-zinc-400 hover:text-white'}`}>
              {t.l}
              {t.icon && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
          ))}
        </div>

        {tab === 'friends' && (
          <div className="space-y-2">
            {friends.length === 0 ? (
              <div className="card p-10 text-center">
                <UserPlus className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No friends yet. Add someone above.</p>
              </div>
            ) : friends.map((f) => (
              <div key={f.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(f.displayName?.[0] || f.userName[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{f.displayName || f.userName}</p>
                    <p className="text-zinc-500 text-xs">@{f.userName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/chat')} className="btn-ghost text-xs flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />Message
                  </button>
                  <button onClick={() => handleRemove(f.id)} className="btn-ghost text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                    <UserMinus className="w-3.5 h-3.5" />Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'pending' && (
          <div className="space-y-2">
            {pending.length === 0 ? (
              <div className="card p-10 text-center"><p className="text-zinc-500 text-sm">No pending requests</p></div>
            ) : pending.map((p) => (
              <div key={p.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm font-bold shrink-0">
                    {(p.displayName?.[0] || p.userName[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{p.displayName || p.userName}</p>
                    <p className="text-zinc-500 text-xs">@{p.userName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(p.id)} className="btn-success text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />Accept
                  </button>
                  <button onClick={() => handleDecline(p.id)} className="btn-ghost text-xs flex items-center gap-1">
                    <X className="w-3.5 h-3.5" />Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'invites' && (
          <div className="space-y-2">
            {invites.length === 0 ? (
              <div className="card p-10 text-center"><p className="text-zinc-500 text-sm">No league invites</p></div>
            ) : invites.map((inv) => (
              <div key={inv.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{inv.leagueName}</p>
                    <p className="text-zinc-500 text-xs">Invited by {inv.invitedByName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAcceptInvite(inv.id)} className="btn-success text-xs">Accept</button>
                  <button onClick={() => handleDeclineInvite(inv.id)} className="btn-ghost text-xs">Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}