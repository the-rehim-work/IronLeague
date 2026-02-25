import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, User, Trophy, Bell, LogOut, Swords, ChevronRight, Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationsApi } from '@/api';
import type { Notification } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/managers', icon: User, label: 'Managers' },
  { path: '/leagues', icon: Trophy, label: 'Leagues' },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    notificationsApi.getAll().then(setNotifications).catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="w-60 bg-zinc-900/50 border-r border-zinc-800/80 flex flex-col fixed h-full z-30">
        <div className="p-5 border-b border-zinc-800/80">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <Swords className="w-7 h-7 text-sky-500" />
            <span className="text-lg font-bold tracking-tight text-white">IRON LEAGUE</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(path)
                  ? 'bg-sky-600/15 text-sky-400 border border-sky-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{label}</span>
              {isActive(path) && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive('/admin')
                  ? 'bg-amber-600/15 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300 border border-transparent'
              }`}
            >
              <Shield className="w-[18px] h-[18px]" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-800/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {(user?.displayName?.[0] || user?.userName?.[0] || '?').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.displayName || user?.userName}</p>
              <p className="text-xs text-zinc-500">{user?.matchesWon || 0}W {user?.matchesDrawn || 0}D {user?.matchesLost || 0}L</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-60">
        <header className="sticky top-0 z-20 h-14 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50 flex items-center justify-end px-6 gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-all"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-full mt-2 w-80 card p-0 shadow-2xl max-h-96 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-sky-400 hover:text-sky-300">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-6">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-zinc-800/50 text-sm ${
                          n.isRead ? 'opacity-50' : ''
                        }`}
                      >
                        <p className="font-medium text-white text-xs">{n.title}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}