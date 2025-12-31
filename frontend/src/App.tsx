import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { getStoredUser } from './api/client';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Match from './pages/Match';

function App() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = getStoredUser();
    if (storedUser) {
      useAuthStore.setState({ user: storedUser, isAuthenticated: true, isLoading: false });
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Iron League...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/match/:matchId"
          element={isAuthenticated ? <Match /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
