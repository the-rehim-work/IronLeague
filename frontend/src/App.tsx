import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { getStoredUser } from '@/api/client';
import { authApi } from '@/api/auth';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Managers from '@/pages/Managers';
import CreateManager from '@/pages/CreateManager';
import ManagerDetail from '@/pages/ManagerDetail';
import Leagues from '@/pages/Leagues';
import CreateLeague from '@/pages/CreateLeague';
import LeagueDetail from '@/pages/LeagueDetail';
import TeamDetail from '@/pages/TeamDetail';
import PlayerDetail from '@/pages/PlayerDetail';
import MatchPage from '@/pages/Match';
import Admin from '@/pages/Admin';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-700 border-t-sky-500" />
          <p className="text-zinc-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    const stored = getStoredUser();
    const token = localStorage.getItem('il_token');

    if (stored && token) {
      useAuthStore.setState({ user: stored, isAuthenticated: true, isLoading: false });
      authApi.me().then((fresh) => {
        useAuthStore.setState({ user: fresh });
      }).catch(() => {
        useAuthStore.getState().logout();
      });
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#18181b', border: '1px solid #27272a', color: '#fafafa', fontSize: '13px' },
        }}
      />
      <Routes>
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />

        <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/managers" element={<AuthGuard><Managers /></AuthGuard>} />
        <Route path="/managers/create" element={<AuthGuard><CreateManager /></AuthGuard>} />
        <Route path="/managers/:id" element={<AuthGuard><ManagerDetail /></AuthGuard>} />
        <Route path="/leagues" element={<AuthGuard><Leagues /></AuthGuard>} />
        <Route path="/leagues/create" element={<AuthGuard><CreateLeague /></AuthGuard>} />
        <Route path="/leagues/:id" element={<AuthGuard><LeagueDetail /></AuthGuard>} />
        <Route path="/teams/:id" element={<AuthGuard><TeamDetail /></AuthGuard>} />
        <Route path="/players/:id" element={<AuthGuard><PlayerDetail /></AuthGuard>} />
        <Route path="/match/:matchId" element={<AuthGuard><MatchPage /></AuthGuard>} />
        <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}