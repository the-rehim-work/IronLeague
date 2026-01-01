import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { getStoredUser } from './api/client';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Managers from './pages/Managers';
import CreateManager from './pages/CreateManager';
import ManagerDetail from './pages/Managerdetail';
import Leagues from './pages/Leagues';
import CreateLeague from './pages/Createleague';
import LeagueDetail from './pages/LeagueDetail';
import TeamDetail from './pages/TeamDetail';
import PlayerDetail from './pages/PlayerDetail';
import Match from './pages/Match';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading Iron League...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading Iron League...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser && localStorage.getItem('token')) {
      useAuthStore.setState({ user: storedUser, isAuthenticated: true, isLoading: false });
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        
        <Route path="/managers" element={<PrivateRoute><Managers /></PrivateRoute>} />
        <Route path="/managers/create" element={<PrivateRoute><CreateManager /></PrivateRoute>} />
        <Route path="/managers/:id" element={<PrivateRoute><ManagerDetail /></PrivateRoute>} />
        
        <Route path="/leagues" element={<PrivateRoute><Leagues /></PrivateRoute>} />
        <Route path="/leagues/create" element={<PrivateRoute><CreateLeague /></PrivateRoute>} />
        <Route path="/leagues/:id" element={<PrivateRoute><LeagueDetail /></PrivateRoute>} />
        
        <Route path="/teams/:id" element={<PrivateRoute><TeamDetail /></PrivateRoute>} />
        <Route path="/players/:id" element={<PrivateRoute><PlayerDetail /></PrivateRoute>} />
        
        <Route path="/match/:matchId" element={<PrivateRoute><Match /></PrivateRoute>} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}