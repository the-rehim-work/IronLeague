/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

interface User {
  id: string;
  userName: string;
  email: string;
  displayName: string;
  isAdmin?: boolean;
}

interface Manager {
  id: string;
  name: string;
  nationality: string;
  age: number;
  physical: number;
  mental: number;
  technical: number;
  reputation: number;
  personalBalance: number;
  isRetired: boolean;
  currentTeamId?: string;
  currentTeamName?: string;
  leagueInstanceId?: string
  languages: { languageCode: string; proficiency: number }[];
}

interface Country {
  code: string;
  name: string;
  currency: string;
  exchangeRateToEur: number;
  primaryLanguage: string;
}

interface League {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  tier: number;
  maxTeams: number;
  promotionSpots: number;
  relegationSpots: number;
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  leagueName: string;
  primaryColor: string;
  secondaryColor: string;
  stadiumCapacity: number;
  stadiumName: string;
  wageBudget: number;
  transferBudget: number;
  totalBalance: number;
  fanLoyalty: number;
  fanMood: number;
  managerId?: string;
  managerName?: string;
}

interface LeagueInstance {
  id: string;
  name: string;
  baseLeagueName?: string;
  ownerId: string;
  ownerName: string;
  isPrivate: boolean;
  maxPlayers: number;
  currentPlayerCount: number;
  currentSeason: number;
  currentDate: string;
  status: string;
}

interface LeagueTeam {
  id: string;
  baseTeamId: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  isControlledByPlayer: boolean;
  managerId?: string;
  managerName?: string;
}

interface Competition {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Standing {
  id: string;
  baseTeamId: string;
  teamName: string;
  teamColors: string;
  managerId?: string;
  managerName?: string;
  isControlledByPlayer: boolean;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  wins: number;
  draws: number;
  losses: number;
  played: number;
}

interface Fixture {
  id: string;
  competitionId: string;
  competitionName: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamColors: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamColors: string;
  scheduledDate: string;
  matchDay?: number;
  round?: string;
  status: string;
  match?: MatchSummary;
}

interface MatchSummary {
  id: string;
  homeScore: number;
  awayScore: number;
  status: string;
}

interface Match {
  id: string;
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  currentTick: number;
  totalTicks: number;
  status: string;
  weather: string;
  attendance: number;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  events: MatchEvent[];
}

interface MatchTeam {
  teamId: string;
  teamName: string;
  formation: string;
  tactics: string;
  speechesUsed: number;
  pausesUsed: number;
}

interface MatchEvent {
  id: string;
  tick: number;
  minute: number;
  type: string;
  primaryPlayerName?: string;
  secondaryPlayerName?: string;
  isHomeTeam: boolean;
  description?: string;
  isKeyEvent: boolean;
  isImportantEvent: boolean;
  positionX?: number;
  positionY?: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface PlayerSummary {
  id: string;
  fullName: string;
  position: string;
  overall: number;
  age: number;
  marketValue: number;
  morale: number;
  fitness: number;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  managers: Manager[];
  setManagers: (m: Manager[]) => void;
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  refreshNotifications: () => Promise<void>;
  isDark: boolean;
  toggleTheme: () => void;
  logout: () => void;
  isAdmin: boolean;
}

interface FixtureWeek {
  matchDay: number;
  weekStart: string;
  fixtures: GroupedFixture[];
}

interface GroupedFixture {
  id: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamColor: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamColor: string;
  scheduledDate: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  matchId?: string;
  involvesUser: boolean;
}

interface SimulationResult {
  success: boolean;
  newDate: string;
  simulatedMatches: SimMatch[];
  playerMatchUpcoming?: GroupedFixture;
  message?: string;
}

interface SimMatch {
  fixtureId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  involvesPlayer: boolean;
}

interface TeamDetail {
  teamInstanceId: string;
  baseTeamId: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
  stadiumCapacity: number;
  wageBudget: number;
  transferBudget: number;
  totalBalance: number;
  fanLoyalty: number;
  fanMood: number;
  isControlledByPlayer: boolean;
  managerName?: string;
  standings: {
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
  };
  squad: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    position: string;
    secondaryPosition?: string;
    age: number;
    nationality: string;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
    overall: number;
    potential: number;
    morale: number;
    fitness: number;
    form: number;
    marketValue: number;
  }[];
  staff: { id: string; name: string; role: string; ability: number }[];
}

const API = 'http://172.22.111.136:5000/api';

const api = {
  get: async function <T>(endpoint: string, token?: string | null): Promise<T | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}${endpoint}`, { headers });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  post: async function <T>(endpoint: string, body: unknown, token?: string | null): Promise<{ ok: boolean; data?: T; error?: string }> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.message || `Error ${res.status}` };
      }
      const data = res.status === 204 ? undefined : await res.json();
      return { ok: true, data };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  }
};

const AppContext = createContext<AppContextType | null>(null);

function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function Auth({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { userOrEmail: userName, password }
        : { userName, password, displayName: displayName || userName, email: email || null };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Request failed');
        return;
      }

      if (data.token) {
        // Fetch full user to get isAdmin
        const meRes = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        if (meRes.ok) {
          const fullUser = await meRes.json();
          onLogin(data.token, {
            id: fullUser.id,
            userName: fullUser.userName,
            email: fullUser.email || '',
            displayName: fullUser.displayName || fullUser.userName,
            isAdmin: fullUser.roles?.includes('Admin') ?? false,
          });
        } else {
          onLogin(data.token, data.user);
        }
      } else if (mode === 'register') {
        setMode('login');
        setError('Registration successful! Please login.');
      }
    } catch {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="bg-zinc-800/90 backdrop-blur rounded-2xl shadow-2xl p-8 w-full max-w-md border border-zinc-700">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">⚽ Iron League</h1>
        <p className="text-zinc-400 text-center mb-6">Football Manager</p>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition ${mode === 'login' ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition ${mode === 'register' ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <input
                type="text"
                placeholder="Display Name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 bg-zinc-700/50 text-white rounded-lg border border-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-zinc-700/50 text-white rounded-lg border border-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </>
          )}
          <input
            type="text"
            placeholder={mode === 'login' ? 'Username or Email' : 'Username'}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full p-3 bg-zinc-700/50 text-white rounded-lg border border-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-zinc-700/50 text-white rounded-lg border border-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
            required
          />
          {error && (
            <p className={`text-sm px-3 py-2 rounded ${error.includes('successful') ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 ${onClick ? 'cursor-pointer hover:border-zinc-700' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const base = 'px-4 py-2 rounded-lg font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90',
    secondary: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
    ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-800',
    danger: 'bg-red-600 text-white hover:bg-red-500',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  required = false,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={`w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none transition ${className}`}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Layout({ children }: { children: ReactNode }) {
  const { user, notifications, isDark, toggleTheme, logout, isAdmin } = useApp();
  const nav = useNavigate();
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => nav('/dashboard')}
            className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer"
          >
            Iron League
          </button>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => nav('/leagues')}>Leagues</Button>
            <Button variant="ghost" onClick={() => nav('/managers')}>Manager</Button>
            {isAdmin && (
              <Button variant="ghost" onClick={() => nav('/admin')}>Admin</Button>
            )}
            <button onClick={toggleTheme} className="p-2 text-zinc-400 hover:text-white cursor-pointer">
              {isDark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => nav('/notifications')} className="relative p-2 text-zinc-400 hover:text-white cursor-pointer">
              🔔
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full">
              <span className="text-sm text-zinc-300">{user?.displayName}</span>
              <button onClick={logout} className="text-zinc-500 hover:text-red-400 cursor-pointer">✕</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function Pitch2D({ match }: { match?: Match }) {
  const ballX = 50;
  const ballY = 50;

  const parseFormation = (formation: string): number[] => {
    const parts = formation.split('-').map(n => parseInt(n) || 4);
    return [1, ...parts];
  };

  const getPlayerPositions = (formation: string, isHome: boolean): { x: number; y: number }[] => {
    const lines = parseFormation(formation);
    const positions: { x: number; y: number }[] = [];

    const totalLines = lines.length;
    lines.forEach((count, lineIndex) => {
      const x = isHome
        ? 5 + (lineIndex * 90 / totalLines)
        : 95 - (lineIndex * 90 / totalLines);

      for (let i = 0; i < count; i++) {
        const y = count === 1 ? 50 : 15 + (i * 70 / (count - 1));
        positions.push({ x, y });
      }
    });

    return positions;
  };

  const homeFormation = match?.homeTeam?.formation || '4-4-2';
  const awayFormation = match?.awayTeam?.formation || '4-4-2';
  const homePositions = getPlayerPositions(homeFormation, true);
  const awayPositions = getPlayerPositions(awayFormation, false);

  const lastEvent = match?.events?.filter(e => e.positionX !== undefined).slice(-1)[0];
  const eventBallX = lastEvent?.positionX ?? ballX;
  const eventBallY = lastEvent?.positionY ?? ballY;

  return (
    <div className="relative w-full aspect-[16/10] bg-gradient-to-b from-emerald-800 to-emerald-900 rounded-xl overflow-hidden border-4 border-white/20">
      {/* Pitch markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Center line */}
        <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
        {/* Center circle */}
        <circle cx="50" cy="50" r="10" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
        <circle cx="50" cy="50" r="0.5" fill="white" fillOpacity="0.5" />
        {/* Penalty boxes */}
        <rect x="0" y="20" width="16" height="60" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
        <rect x="84" y="20" width="16" height="60" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
        {/* Goal boxes */}
        <rect x="0" y="35" width="6" height="30" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
        <rect x="94" y="35" width="6" height="30" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
        {/* Goals */}
        <rect x="-2" y="42" width="2" height="16" fill="white" fillOpacity="0.2" />
        <rect x="100" y="42" width="2" height="16" fill="white" fillOpacity="0.2" />
      </svg>

      {/* Home players (cyan/blue) */}
      {homePositions.map((pos, i) => (
        <div
          key={`home-${i}`}
          className="absolute transition-all duration-1000 ease-out"
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          {/* Torso icon */}
          <div className="relative">
            <svg width="24" height="28" viewBox="0 0 24 28" className="drop-shadow-lg">
              {/* Head */}
              <circle cx="12" cy="6" r="5" fill="#06b6d4" stroke="#0891b2" strokeWidth="1" />
              {/* Body/Torso */}
              <path d="M4 28 L6 14 C6 11 8 10 12 10 C16 10 18 11 18 14 L20 28 Z"
                fill="#06b6d4" stroke="#0891b2" strokeWidth="1" />
              {/* Jersey number */}
              <text x="12" y="22" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                {i + 1}
              </text>
            </svg>
          </div>
        </div>
      ))}

      {/* Away players (orange/red) */}
      {awayPositions.map((pos, i) => (
        <div
          key={`away-${i}`}
          className="absolute transition-all duration-1000 ease-out"
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative">
            <svg width="24" height="28" viewBox="0 0 24 28" className="drop-shadow-lg">
              <circle cx="12" cy="6" r="5" fill="#f97316" stroke="#ea580c" strokeWidth="1" />
              <path d="M4 28 L6 14 C6 11 8 10 12 10 C16 10 18 11 18 14 L20 28 Z"
                fill="#f97316" stroke="#ea580c" strokeWidth="1" />
              <text x="12" y="22" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                {i + 1}
              </text>
            </svg>
          </div>
        </div>
      ))}

      {/* Ball */}
      <div
        className="absolute w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-500 z-10"
        style={{
          left: `${eventBallX}%`,
          top: `${eventBallY}%`,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 10px rgba(255,255,255,0.5)'
        }}
      >
        {/* Ball pattern */}
        <div className="absolute inset-0 rounded-full border border-zinc-400" />
      </div>

      {/* Event indicator */}
      {lastEvent?.type === 'Goal' && (
        <div
          className="absolute text-4xl animate-bounce z-20"
          style={{ left: `${eventBallX}%`, top: `${eventBallY - 10}%`, transform: 'translate(-50%, -50%)' }}
        >
          ⚽
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const { token, managers, setManagers } = useApp();
  const [leagues, setLeagues] = useState<LeagueInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [managersData, leaguesData] = await Promise.all([
        api.get<Manager[]>('/manager/mine', token),
        api.get<LeagueInstance[]>('/leagueinstance/mine', token),
      ]);
      if (managersData) setManagers(managersData);
      if (leaguesData) setLeagues(leaguesData);
      setLoading(false);
    };
    load();
  }, [token, setManagers]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20 text-zinc-400">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-3">
            <Button onClick={() => nav('/leagues/create')}>+ Create League</Button>
            <Button variant="secondary" onClick={() => nav('/leagues')}>Browse Leagues</Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Managers</h2>
              <Button variant="ghost" onClick={() => nav('/manager/create')}>+ New</Button>
            </div>
            {managers.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <p className="mb-4">No managers yet</p>
                <Button onClick={() => nav('/manager/create')}>Create Manager</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {managers.map((m) => (
                  <div key={m.id} className="p-4 bg-zinc-800/50 rounded-lg flex justify-between items-center hover:bg-zinc-700/50 transition cursor-pointer">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-zinc-400">{m.currentTeamName || 'Free Agent'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400">Rep: {m.reputation}</p>
                      <p className="text-sm text-zinc-500">Age: {m.age}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <h2 className="text-xl font-semibold mb-4">My Leagues</h2>
            {leagues.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <p className="mb-4">Not in any leagues yet</p>
                <Button onClick={() => nav('/leagues')}>Browse Leagues</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {leagues.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => nav(`/league/${l.id}`)}
                    className="w-full p-4 bg-zinc-800/50 rounded-lg flex justify-between items-center hover:bg-zinc-700/50 transition text-left cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{l.name}</p>
                      <p className="text-sm text-zinc-400">Season {l.currentSeason}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${l.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                    >
                      {l.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function ManagerPage() {
  const { managers } = useApp();
  const nav = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Managers</h1>
          <Button onClick={() => nav('/manager/create')}>+ Create Manager</Button>
        </div>
        {managers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-4">You haven't created any managers yet.</p>
              <Button onClick={() => nav('/manager/create')}>Create Your First Manager</Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managers.map((m) => (
              <Card key={m.id}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center text-2xl">👔</div>
                  <div>
                    <h3 className="font-semibold text-lg">{m.name}</h3>
                    <p className="text-sm text-zinc-400">
                      {m.nationality} • Age {m.age}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                  <div className="bg-zinc-800 rounded p-2">
                    <p className="text-zinc-400">PHY</p>
                    <p className="font-medium">{m.physical}</p>
                  </div>
                  <div className="bg-zinc-800 rounded p-2">
                    <p className="text-zinc-400">MEN</p>
                    <p className="font-medium">{m.mental}</p>
                  </div>
                  <div className="bg-zinc-800 rounded p-2">
                    <p className="text-zinc-400">TEC</p>
                    <p className="font-medium">{m.technical}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">{m.currentTeamName || 'Free Agent'}</span>
                  <span className="text-emerald-400">Rep: {m.reputation}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function CreateManagerPage() {
  const { token, setManagers } = useApp();
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [earlyBonus, setEarlyBonus] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/data/countries`);
        if (res.ok) {
          const data = await res.json();
          setCountries(data);
          if (data.length > 0) setNationality(data[0].code);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, nationality, earlyBonus }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to create manager');
        return;
      }
      const managersRes = await fetch(`${API}/manager/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (managersRes.ok) {
        const data = await managersRes.json();
        setManagers(data);
      }
      nav('/dashboard');
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create Manager</h1>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Name</label>
              <Input value={name} onChange={setName} placeholder="Manager name" required />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nationality</label>
              <Select
                value={nationality}
                onChange={setNationality}
                options={countries.map((c) => ({ value: c.code, label: c.name }))}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={earlyBonus}
                onChange={(e) => setEarlyBonus(e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-500"
              />
              <span className="text-zinc-300">Early grind mode (start weaker, grow faster)</span>
            </label>
            <p className="text-sm text-zinc-500">
              With early bonus: Start at 40 stats but faster growth. Without: Start at 60 but slower.
            </p>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Manager'}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}

function BrowseLeaguesPage() {
  const { token } = useApp();
  const [baseLeagues, setBaseLeagues] = useState<League[]>([]);
  const [publicLeagues, setPublicLeagues] = useState<LeagueInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [baseRes, publicRes] = await Promise.all([
          fetch(`${API}/data/leagues`),
          fetch(`${API}/leagueinstance/public`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (baseRes.ok) {
          const data = await baseRes.json();
          setBaseLeagues(data);
        }
        if (publicRes.ok) {
          const data = await publicRes.json();
          setPublicLeagues(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20 text-zinc-400">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Browse Leagues</h1>
          <Button onClick={() => nav('/leagues/create')}>+ Create League</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Base Leagues</h2>
            {baseLeagues.length === 0 ? (
              <p className="text-zinc-500">No leagues available. Admin needs to seed data.</p>
            ) : (
              <div className="space-y-3">
                {baseLeagues.map((l) => (
                  <div key={l.id} className="p-4 bg-zinc-800/50 rounded-lg">
                    <p className="font-medium">{l.name}</p>
                    <p className="text-sm text-zinc-400">
                      {l.countryName} • {l.maxTeams} teams
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <h2 className="text-xl font-semibold mb-4">Public Lobbies</h2>
            {publicLeagues.length === 0 ? (
              <p className="text-zinc-500 py-4">No public lobbies available</p>
            ) : (
              <div className="space-y-3">
                {publicLeagues.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => nav(`/league/${l.id}/join`)}
                    className="w-full p-4 bg-zinc-800/50 rounded-lg text-left hover:bg-zinc-700/50 transition"
                  >
                    <p className="font-medium">{l.name}</p>
                    <p className="text-sm text-zinc-400">
                      {l.currentPlayerCount}/{l.maxPlayers} players • {l.ownerName}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function CreateLeaguePage() {
  const { token } = useApp();
  const [name, setName] = useState('');
  const [baseLeagueId, setBaseLeagueId] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('20');
  const [baseLeagues, setBaseLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/data/leagues`);
        if (res.ok) {
          const data = await res.json();
          setBaseLeagues(data);
          if (data.length > 0) setBaseLeagueId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('League name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/leagueinstance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          baseLeagueId: baseLeagueId || undefined,
          isPrivate,
          password: isPrivate ? password : undefined,
          maxPlayers: parseInt(maxPlayers),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to create league');
        return;
      }
      const league = await res.json();
      nav(`/league/${league.id}`);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create League</h1>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">League Name</label>
              <Input value={name} onChange={setName} placeholder="My Awesome League" required />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Base League</label>
              <Select
                value={baseLeagueId}
                onChange={setBaseLeagueId}
                options={[
                  { value: '', label: 'Custom (no base)' },
                  ...baseLeagues.map((l) => ({ value: l.id, label: `${l.name} (${l.countryName})` })),
                ]}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Max Players</label>
              <Input type="number" value={maxPlayers} onChange={setMaxPlayers} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-500"
              />
              <span className="text-zinc-300">Private League</span>
            </label>
            {isPrivate && (
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Password</label>
                <Input type="password" value={password} onChange={setPassword} placeholder="League password" />
              </div>
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create League'}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}

function JoinLeaguePage() {
  const { id } = useParams();
  const { token, managers } = useApp();
  const [league, setLeague] = useState<LeagueInstance | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`${API}/leagueinstance/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLeague(data);
          if (data.baseLeagueName) {
            const leaguesRes = await fetch(`${API}/data/leagues`);
            if (leaguesRes.ok) {
              const leagues = await leaguesRes.json();
              const base = leagues.find((l: League) => l.name === data.baseLeagueName);
              if (base) {
                const teamsRes = await fetch(`${API}/data/teams/${base.id}`);
                if (teamsRes.ok) {
                  const teamsData = await teamsRes.json();
                  setTeams(teamsData.filter((t: Team) => !t.managerId));
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  const handleJoin = async () => {
    if (!selectedManager || !selectedTeam) {
      setError('Select a manager and team');
      return;
    }
    setJoining(true);
    setError('');
    try {
      const res = await fetch(`${API}/leagueinstance/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leagueInstanceId: id,
          managerId: selectedManager,
          teamId: selectedTeam,
          password: league?.isPrivate ? password : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to join');
        return;
      }
      nav(`/league/${id}`);
    } catch (err) {
      setError('Network error');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20 text-zinc-400">Loading...</div>
      </Layout>
    );
  }

  if (!league) {
    return (
      <Layout>
        <div className="text-center py-20 text-zinc-400">League not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Join {league.name}</h1>
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Select Manager</label>
              <Select
                value={selectedManager}
                onChange={setSelectedManager}
                options={[
                  { value: '', label: 'Choose a manager...' },
                  ...managers.filter((m) => !m.currentTeamId).map((m) => ({ value: m.id, label: m.name })),
                ]}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Select Team</label>
              <Select
                value={selectedTeam}
                onChange={setSelectedTeam}
                options={[{ value: '', label: 'Choose a team...' }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
              />
            </div>
            {league.isPrivate && (
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Password</label>
                <Input type="password" value={password} onChange={setPassword} placeholder="League password" />
              </div>
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button onClick={handleJoin} disabled={joining} className="w-full">
              {joining ? 'Joining...' : 'Join League'}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

function LeagueDetailPage() {
  const { id } = useParams();
  const { token, user, managers, setManagers } = useApp();
  const [league, setLeague] = useState<LeagueInstance | null>(null);
  const [teams, setTeams] = useState<LeagueTeam[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [fixtureWeeks, setFixtureWeeks] = useState<FixtureWeek[]>([]);
  const [userTeamInstanceId, setUserTeamInstanceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [joinError, setJoinError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'fixtures' | 'standings'>('overview');
  const [lastSimResult, setLastSimResult] = useState<SimulationResult | null>(null);
  const [showSimModal, setShowSimModal] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<GroupedFixture | null>(null);
  const [filterTeam, setFilterTeam] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [seasonComplete, setSeasonComplete] = useState(false);
  const nav = useNavigate();

  const loadLeague = async () => {
    if (!id) return;
    try {
      const leagueData = await api.get<LeagueInstance>(`/leagueinstance/${id}`, token);
      if (leagueData) {
        setLeague(leagueData);

        const teamsData = await api.get<LeagueTeam[]>(`/game/leagueinstance/${id}/teams`, token);
        if (teamsData) setTeams(teamsData);

        if (leagueData.status === 'Active') {
          const comps = await api.get<Competition[]>(`/game/leagueinstance/${id}/competitions`, token);
          if (comps) {
            if (comps.length > 0) {
              const standingsData = await api.get<Standing[]>(`/game/competition/${comps[0].id}/standings`, token);
              if (standingsData) setStandings(standingsData);
            }
          }

          const groupedData = await api.get<{ userTeamInstanceId: string | null; weeks: FixtureWeek[] }>(
            `/game/leagueinstance/${id}/fixtures/grouped`, token
          );
          if (groupedData) {
            setUserTeamInstanceId(groupedData.userTeamInstanceId);
            setFixtureWeeks(groupedData.weeks);
            const allCompleted = groupedData?.weeks?.every(w =>
              w.fixtures.every(f => f.status === 'Completed')
            ) ?? false;
            setSeasonComplete(allCompleted && (groupedData?.weeks?.length ?? 0) > 0);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeague();
  }, [id, token]);

  const handleStart = async () => {
    if (!id) return;
    setActionLoading(true);
    setJoinError(''); // Clear any previous error
    const result = await api.post(`/leagueinstance/${id}/start`, {}, token);
    if (result.ok) {
      await loadLeague();
    } else {
      setJoinError(result.error || 'Failed to start league');
    }
    setActionLoading(false);
  };

  const handleJoinTeam = async () => {
    if (!selectedTeam || !selectedManager) {
      setJoinError('Select both a manager and a team');
      return;
    }
    setJoinError('');
    setActionLoading(true);

    const result = await api.post('/leagueinstance/join', {
      leagueInstanceId: id,
      managerId: selectedManager,
      teamId: selectedTeam
    }, token);

    if (result.ok) {
      // Clear selections FIRST
      setSelectedTeam('');
      setSelectedManager('');
      // Then reload data
      const managersData = await api.get<Manager[]>('/manager/mine', token);
      if (managersData) setManagers(managersData);
      await loadLeague();
      // No error to show
    } else {
      setJoinError(result.error || 'Failed to join');
    }
    setActionLoading(false);
  };

  const handleAdvanceDay = async (simulateOwn = false) => {
    if (!id) return;
    setSimulating(true);
    const result = await api.post<SimulationResult>(`/game/leagueinstance/${id}/advance?simulateOwn=${simulateOwn}`, {}, token);
    if (result.ok && result.data) {
      setLastSimResult(result.data);
      if (result.data.playerMatchUpcoming && !simulateOwn) { setPendingMatch(result.data.playerMatchUpcoming); setShowSimModal(true); }
      await loadLeague();
    }
    setSimulating(false);
  };

  const handleContinue = async (simulateOwn = false) => {
    if (!id) return;
    setSimulating(true);
    const result = await api.post<SimulationResult>(`/game/leagueinstance/${id}/advance-until-match?simulateOwn=${simulateOwn}`, {}, token);
    if (result.ok && result.data) {
      setLastSimResult(result.data);
      if (result.data.playerMatchUpcoming && !simulateOwn) { setPendingMatch(result.data.playerMatchUpcoming); setShowSimModal(true); }
      await loadLeague();
    }
    setSimulating(false);
  };

  const handleSimulateOwn = async () => { setShowSimModal(false); setPendingMatch(null); await handleAdvanceDay(true); };
  const handlePlayMatch = async () => {
    if (!pendingMatch?.id) {
      setShowSimModal(false);
      setPendingMatch(null);
      return;
    }

    // Create match from fixture
    const result = await api.post<{ id: string }>('/match/start', {
      fixtureId: pendingMatch.id,
      homeFormation: '4-4-2',
      homeTactics: 'Balanced',
      awayFormation: '4-4-2',
      awayTactics: 'Balanced'
    }, token);

    if (result.ok && result.data?.id) {
      nav(`/match/${result.data.id}`);
    } else {
      // If match creation fails, just simulate
      await handleSimulateOwn();
    }

    setShowSimModal(false);
    setPendingMatch(null);
  };

  const filteredWeeks = fixtureWeeks.map(week => ({
    ...week,
    fixtures: week.fixtures.filter(f => {
      if (filterTeam && f.homeTeamId !== filterTeam && f.awayTeamId !== filterTeam) return false;
      if (filterStatus === 'completed' && f.status !== 'Completed') return false;
      if (filterStatus === 'scheduled' && f.status !== 'Scheduled') return false;
      if (filterStatus === 'mine' && !f.involvesUser) return false;
      return true;
    })
  })).filter(week => week.fixtures.length > 0);

  if (loading) return <Layout><div className="text-center py-20 text-zinc-400">Loading...</div></Layout>;
  if (!league) return <Layout><div className="text-center py-20 text-zinc-400">League not found</div></Layout>;

  const isOwner = user?.id === league.ownerId;
  const availableTeams = teams.filter((t) => !t.isControlledByPlayer);
  const freeManagers = managers.filter((m) => !m.currentTeamId);
  const userHasTeam = managers.some((m) => m.leagueInstanceId === id);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{league.name}</h1>
            <p className="text-zinc-400">Season {league.currentSeason} • {league.currentDate?.split('T')[0]}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full ${league.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{league.status}</span>
            {isOwner && league.status === 'Lobby' && <Button onClick={handleStart} disabled={actionLoading}>{actionLoading ? 'Starting...' : 'Start League'}</Button>}
          </div>
        </div>

        {/* SIMULATION CONTROLS */}
        {league.status === 'Active' && (
          <Card className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border-emerald-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">⚡ Game Controls</h2>
                <p className="text-sm text-zinc-400">Current date: {league.currentDate?.split('T')[0]}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => handleAdvanceDay(false)} disabled={simulating}>
                  {simulating ? '⏳' : '▶️'} Next Day
                </Button>
                <Button onClick={() => handleContinue(false)} disabled={simulating}>
                  {simulating ? '⏳ Simulating...' : '⏩ Continue Until Match'}
                </Button>
                {userHasTeam && (
                  <Button variant="ghost" onClick={() => handleContinue(true)} disabled={simulating}>
                    🤖 Auto-Sim All
                  </Button>
                )}
              </div>
            </div>
            {lastSimResult && lastSimResult.simulatedMatches.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-700">
                <p className="text-sm text-zinc-400 mb-2">Latest Results ({lastSimResult.simulatedMatches.length} matches):</p>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {lastSimResult.simulatedMatches.map((m, i) => (
                    <div key={i} className={`px-3 py-1 rounded text-sm ${m.involvesPlayer ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-zinc-800 text-zinc-300'}`}>
                      {m.homeTeamName} {m.homeScore}-{m.awayScore} {m.awayTeamName}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {seasonComplete && (
              <div className="mt-4 pt-4 border-t border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-emerald-400">🏆 Season Complete!</p>
                    <p className="text-sm text-zinc-400">All matches have been played</p>
                  </div>
                  <Button onClick={() => nav(`/league/${id}/summary`)}>
                    View Season Summary
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Match Decision Modal */}
        {showSimModal && pendingMatch && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 text-center">⚽ Your Match Today!</h2>
              <div className="text-center py-6 mb-4 bg-zinc-800 rounded-lg">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-2" style={{ background: pendingMatch.homeTeamColor }} />
                    <p className="font-semibold">{pendingMatch.homeTeamName}</p>
                  </div>
                  <span className="text-3xl font-bold text-zinc-500">VS</span>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-2" style={{ background: pendingMatch.awayTeamColor }} />
                    <p className="font-semibold">{pendingMatch.awayTeamName}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleSimulateOwn} className="flex-1">🤖 Simulate</Button>
                <Button onClick={handlePlayMatch} className="flex-1">🎮 Play Match</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Join section */}
        {league.status === 'Lobby' && !userHasTeam && freeManagers.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">Join This League</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-sm text-zinc-400 mb-1">Your Manager</label><Select value={selectedManager} onChange={setSelectedManager} options={[{ value: '', label: 'Select manager...' }, ...freeManagers.map((m) => ({ value: m.id, label: `${m.name} (Rep: ${m.reputation})` }))]} /></div>
              <div><label className="block text-sm text-zinc-400 mb-1">Select Team</label><Select value={selectedTeam} onChange={setSelectedTeam} options={[{ value: '', label: 'Select team...' }, ...availableTeams.map((t) => ({ value: t.baseTeamId, label: t.name }))]} /></div>
              <div className="flex items-end"><Button onClick={handleJoinTeam} disabled={actionLoading || !selectedTeam || !selectedManager} className="w-full">{actionLoading ? 'Joining...' : 'Join Team'}</Button></div>
            </div>
            {joinError && <p className="text-red-400 text-sm mt-2">{joinError}</p>}
          </Card>
        )}

        {league.status === 'Lobby' && freeManagers.length === 0 && !userHasTeam && (
          <Card><div className="text-center py-4"><p className="text-zinc-400 mb-3">Create a manager to join this league</p><Button onClick={() => nav('/managers/create')}>Create Manager</Button></div></Card>
        )}

        {/* Tabs */}
        {league.status === 'Active' && (
          <div className="flex gap-2 border-b border-zinc-800">
            {['overview', 'standings', 'fixtures'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)} className={`px-4 py-2 rounded-t-lg cursor-pointer capitalize ${activeTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>{tab}</button>
            ))}
          </div>
        )}

        {/* Overview */}
        {(activeTab === 'overview' || league.status === 'Lobby') && (
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Teams ({teams.length})</h2>
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {teams.map((t) => (
                  <button key={t.id} onClick={() => nav(`/team/${t.id}`)} className={`p-3 rounded-lg flex items-center gap-3 hover:bg-zinc-700/50 transition cursor-pointer text-left ${t.id === userTeamInstanceId ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-zinc-800/50'}`}>
                    <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: t.primaryColor }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{t.name}</p>
                      <p className={`text-xs ${t.managerName ? 'text-emerald-400' : 'text-zinc-500'}`}>{t.managerName || 'AI Managed'}</p>
                    </div>
                    {t.id === userTeamInstanceId && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded">YOU</span>}
                  </button>
                ))}
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-semibold mb-4">Info</h2>
              <div className="space-y-3 text-sm">
                {[
                  ['Owner', league.ownerName],
                  ['Players', `${teams.filter(t => t.isControlledByPlayer).length}/${league.maxPlayers}`],
                  ['Type', league.isPrivate ? 'Private' : 'Public'],
                  ['Base', league.baseLeagueName || 'Custom'],
                  ['Teams Taken', `${teams.filter(t => t.isControlledByPlayer).length}/${teams.length}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between"><span className="text-zinc-400">{label}</span><span>{value}</span></div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Standings */}
        {activeTab === 'standings' && league.status === 'Active' && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">League Table</h2>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-900">
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">Team</th>
                    <th className="text-center py-2 px-2">P</th>
                    <th className="text-center py-2 px-2">W</th>
                    <th className="text-center py-2 px-2">D</th>
                    <th className="text-center py-2 px-2">L</th>
                    <th className="text-center py-2 px-2">GF</th>
                    <th className="text-center py-2 px-2">GA</th>
                    <th className="text-center py-2 px-2">GD</th>
                    <th className="text-center py-2 px-2 font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, idx) => (
                    <tr key={s.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer ${s.id === userTeamInstanceId ? 'bg-emerald-500/10' : ''}`} onClick={() => nav(`/team/${s.id}`)}>
                      <td className="py-2 px-2">{idx + 1}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ background: s.teamColors }} />
                          <span className={s.id === userTeamInstanceId ? 'text-emerald-400 font-semibold' : s.isControlledByPlayer ? 'text-cyan-400' : ''}>{s.teamName}</span>
                          {s.id === userTeamInstanceId && <span className="text-xs bg-emerald-500 text-white px-1 rounded">YOU</span>}
                        </div>
                      </td>
                      <td className="text-center py-2 px-2">{s.played}</td>
                      <td className="text-center py-2 px-2">{s.wins}</td>
                      <td className="text-center py-2 px-2">{s.draws}</td>
                      <td className="text-center py-2 px-2">{s.losses}</td>
                      <td className="text-center py-2 px-2">{s.goalsFor}</td>
                      <td className="text-center py-2 px-2">{s.goalsAgainst}</td>
                      <td className="text-center py-2 px-2">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
                      <td className="text-center py-2 px-2 font-bold">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Fixtures with filters */}
        {activeTab === 'fixtures' && league.status === 'Active' && (
          <div className="space-y-4">
            <Card>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-zinc-400 mb-1">Filter by Team</label>
                  <Select value={filterTeam} onChange={setFilterTeam} options={[{ value: '', label: 'All Teams' }, ...teams.map(t => ({ value: t.id, label: t.name }))]} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-zinc-400 mb-1">Status</label>
                  <Select value={filterStatus} onChange={setFilterStatus} options={[{ value: 'all', label: 'All Fixtures' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'completed', label: 'Completed' }, { value: 'mine', label: 'My Matches' }]} />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold mb-4">Fixtures</h2>
              <div className="max-h-[600px] overflow-y-auto pr-2 space-y-6">
                {filteredWeeks.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">No fixtures match your filters</p>
                ) : (
                  filteredWeeks.map((week) => (
                    <div key={week.matchDay}>
                      <div className="flex items-center justify-between mb-3 sticky top-0 bg-zinc-900 py-2">
                        <h3 className="font-semibold text-lg">Matchday {week.matchDay}</h3>
                        <span className="text-sm text-zinc-500">{week.weekStart}</span>
                      </div>
                      <div className="space-y-2">
                        {week.fixtures.map((f) => (
                          <div key={f.id} className={`p-3 rounded-lg flex items-center justify-between transition ${f.matchId ? 'cursor-pointer' : ''} ${f.involvesUser ? 'bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-zinc-800/50 hover:bg-zinc-700/50'}`} onClick={() => f.matchId && nav(`/match/${f.matchId}`)}>
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-3 h-3 rounded-full" style={{ background: f.homeTeamColor }} />
                              <span className={`font-medium ${f.involvesUser && f.homeTeamId === userTeamInstanceId ? 'text-emerald-400' : ''}`}>{f.homeTeamName}</span>
                              {f.involvesUser && f.homeTeamId === userTeamInstanceId && <span className="text-xs bg-emerald-500 text-white px-1 rounded">YOU</span>}
                            </div>
                            <div className="px-4 text-center min-w-[80px]">
                              {f.status === 'Completed' ? <span className="font-bold text-lg">{f.homeScore} - {f.awayScore}</span> : <span className="text-zinc-500">vs</span>}
                            </div>
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              {f.involvesUser && f.awayTeamId === userTeamInstanceId && <span className="text-xs bg-emerald-500 text-white px-1 rounded">YOU</span>}
                              <span className={`font-medium ${f.involvesUser && f.awayTeamId === userTeamInstanceId ? 'text-emerald-400' : ''}`}>{f.awayTeamName}</span>
                              <div className="w-3 h-3 rounded-full" style={{ background: f.awayTeamColor }} />
                            </div>
                            <div className="ml-4 w-24 text-right">
                              <span className={`text-xs px-2 py-1 rounded ${f.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                {f.status === 'Scheduled' ? f.scheduledDate : f.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

function TeamDetailPage() {
  const { id } = useParams();
  const { token } = useApp();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<TeamDetail['squad'][0] | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const data = await api.get<TeamDetail>(`/game/team/${id}/detail`, token);
      if (data) setTeam(data);
      setLoading(false);
    };
    load();
  }, [id, token]);

  const formatMoney = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value}`;
  };

  const getOverallColor = (ovr: number) => {
    if (ovr >= 85) return 'text-emerald-400';
    if (ovr >= 75) return 'text-green-400';
    if (ovr >= 65) return 'text-yellow-400';
    if (ovr >= 55) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatColor = (stat: number) => {
    if (stat >= 85) return 'bg-emerald-500';
    if (stat >= 75) return 'bg-green-500';
    if (stat >= 65) return 'bg-yellow-500';
    if (stat >= 55) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getConditionColor = (val: number) => {
    if (val >= 80) return 'text-emerald-400';
    if (val >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20 text-zinc-400">Loading...</div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="text-center py-20 text-zinc-400">Team not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => nav(-1)} className="text-zinc-400 hover:text-white cursor-pointer">← Back</button>
          <div className="w-16 h-16 rounded-full" style={{ background: team.primaryColor }} />
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-zinc-400">
              {team.managerName || 'AI Managed'} • {team.stadiumName} ({team.stadiumCapacity.toLocaleString()})
            </p>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <h3 className="text-sm text-zinc-400 mb-2">Season Record</h3>
            <div className="text-2xl font-bold">{team.standings.points} pts</div>
            <div className="text-sm text-zinc-400">
              {team.standings.wins}W {team.standings.draws}D {team.standings.losses}L
            </div>
            <div className="text-sm text-zinc-500">
              GD: {team.standings.goalDifference > 0 ? '+' : ''}{team.standings.goalDifference}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm text-zinc-400 mb-2">Transfer Budget</h3>
            <div className="text-2xl font-bold text-emerald-400">{formatMoney(team.transferBudget)}</div>
            <div className="text-sm text-zinc-500">Wage: {formatMoney(team.wageBudget)}/w</div>
          </Card>
          <Card>
            <h3 className="text-sm text-zinc-400 mb-2">Fan Support</h3>
            <div className="text-2xl font-bold">{team.fanLoyalty}%</div>
            <div className="text-sm text-zinc-500">Mood: {team.fanMood}%</div>
          </Card>
          <Card>
            <h3 className="text-sm text-zinc-400 mb-2">Squad</h3>
            <div className="text-2xl font-bold">{team.squad.length} players</div>
            <div className="text-sm text-zinc-500">
              Avg OVR: {Math.round(team.squad.reduce((a, p) => a + p.overall, 0) / team.squad.length)}
            </div>
          </Card>
        </div>

        {/* Squad List */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Squad</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-2 px-2">Player</th>
                  <th className="text-center py-2 px-1">Pos</th>
                  <th className="text-center py-2 px-1">Age</th>
                  <th className="text-center py-2 px-1">OVR</th>
                  <th className="text-center py-2 px-1">POT</th>
                  <th className="text-center py-2 px-1 hidden md:table-cell">PAC</th>
                  <th className="text-center py-2 px-1 hidden md:table-cell">SHO</th>
                  <th className="text-center py-2 px-1 hidden md:table-cell">PAS</th>
                  <th className="text-center py-2 px-1 hidden md:table-cell">DRI</th>
                  <th className="text-center py-2 px-1 hidden md:table-cell">DEF</th>
                  <th className="text-center py-2 px-1 hidden md:table-cell">PHY</th>
                  <th className="text-center py-2 px-1">FIT</th>
                  <th className="text-center py-2 px-1">MOR</th>
                  <th className="text-right py-2 px-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {team.squad.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer"
                    onClick={() => setSelectedPlayer(p)}
                  >
                    <td className="py-2 px-2">
                      <div>
                        <p className="font-medium">{p.lastName}</p>
                        <p className="text-xs text-zinc-500">{p.firstName}</p>
                      </div>
                    </td>
                    <td className="text-center py-2 px-1">
                      <span className="px-1.5 py-0.5 rounded text-xs bg-zinc-700">{p.position}</span>
                    </td>
                    <td className="text-center py-2 px-1">{p.age}</td>
                    <td className={`text-center py-2 px-1 font-bold ${getOverallColor(p.overall)}`}>{p.overall}</td>
                    <td className={`text-center py-2 px-1 ${p.potential > p.overall ? 'text-cyan-400' : 'text-zinc-500'}`}>{p.potential}</td>
                    <td className="text-center py-2 px-1 hidden md:table-cell">{p.pace}</td>
                    <td className="text-center py-2 px-1 hidden md:table-cell">{p.shooting}</td>
                    <td className="text-center py-2 px-1 hidden md:table-cell">{p.passing}</td>
                    <td className="text-center py-2 px-1 hidden md:table-cell">{p.dribbling}</td>
                    <td className="text-center py-2 px-1 hidden md:table-cell">{p.defending}</td>
                    <td className="text-center py-2 px-1 hidden md:table-cell">{p.physical}</td>
                    <td className={`text-center py-2 px-1 ${getConditionColor(p.fitness)}`}>{p.fitness}</td>
                    <td className={`text-center py-2 px-1 ${getConditionColor(p.morale)}`}>{p.morale}</td>
                    <td className="text-right py-2 px-2 text-zinc-400">{formatMoney(p.marketValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Player Detail Modal */}
        {selectedPlayer && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{selectedPlayer.fullName}</h2>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="text-zinc-400 hover:text-white text-2xl cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getOverallColor(selectedPlayer.overall)}`}>
                    {selectedPlayer.overall}
                  </div>
                  <div className="text-sm text-zinc-400">Overall</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-400">{selectedPlayer.potential}</div>
                  <div className="text-sm text-zinc-400">Potential</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">{selectedPlayer.age}</div>
                  <div className="text-sm text-zinc-400">Age</div>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <span className="px-3 py-1 rounded bg-zinc-700">{selectedPlayer.position}</span>
                {selectedPlayer.secondaryPosition && (
                  <span className="px-3 py-1 rounded bg-zinc-800 text-zinc-400">{selectedPlayer.secondaryPosition}</span>
                )}
                <span className="px-3 py-1 rounded bg-zinc-800 text-zinc-400">{selectedPlayer.nationality}</span>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { name: 'Pace', value: selectedPlayer.pace },
                  { name: 'Shooting', value: selectedPlayer.shooting },
                  { name: 'Passing', value: selectedPlayer.passing },
                  { name: 'Dribbling', value: selectedPlayer.dribbling },
                  { name: 'Defending', value: selectedPlayer.defending },
                  { name: 'Physical', value: selectedPlayer.physical },
                ].map((stat) => (
                  <div key={stat.name} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-zinc-400">{stat.name}</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStatColor(stat.value)} transition-all`}
                        style={{ width: `${stat.value}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-700">
                <div className="text-center">
                  <div className={`text-xl font-bold ${getConditionColor(selectedPlayer.fitness)}`}>
                    {selectedPlayer.fitness}%
                  </div>
                  <div className="text-xs text-zinc-400">Fitness</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${getConditionColor(selectedPlayer.morale)}`}>
                    {selectedPlayer.morale}%
                  </div>
                  <div className="text-xs text-zinc-400">Morale</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${getConditionColor(selectedPlayer.form)}`}>
                    {selectedPlayer.form}%
                  </div>
                  <div className="text-xs text-zinc-400">Form</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-700 text-center">
                <div className="text-2xl font-bold text-emerald-400">{formatMoney(selectedPlayer.marketValue)}</div>
                <div className="text-sm text-zinc-400">Market Value</div>
              </div>
            </Card>
          </div>
        )}

        {/* Squad Summary */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <h3 className="font-semibold mb-3">Squad Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Players</span>
                <span>{team.squad.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Average Overall</span>
                <span className={getOverallColor(Math.round(team.squad.reduce((a, p) => a + p.overall, 0) / team.squad.length))}>
                  {Math.round(team.squad.reduce((a, p) => a + p.overall, 0) / team.squad.length)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Average Age</span>
                <span>{Math.round(team.squad.reduce((a, p) => a + p.age, 0) / team.squad.length)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Squad Value</span>
                <span className="text-emerald-400">{formatMoney(team.squad.reduce((a, p) => a + p.marketValue, 0))}</span>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold mb-3">Top Rated</h3>
            <div className="space-y-2">
              {team.squad
                .sort((a, b) => b.overall - a.overall)
                .slice(0, 5)
                .map((p, i) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span>{i + 1}. {p.lastName}</span>
                    <span className={getOverallColor(p.overall)}>{p.overall}</span>
                  </div>
                ))}
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold mb-3">Highest Potential</h3>
            <div className="space-y-2">
              {team.squad
                .sort((a, b) => b.potential - a.potential)
                .slice(0, 5)
                .map((p, i) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span>{i + 1}. {p.lastName} ({p.age})</span>
                    <span className="text-cyan-400">{p.potential}</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function MatchPage() {
  const { id } = useParams();
  const { token } = useApp();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [simulating, setSimulating] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!id || !token) return;

    const load = async () => {
      const data = await api.get<Match>(`/match/${id}`, token);
      if (data) setMatch(data);
      setLoading(false);
    };
    load();

    // SignalR connection with proper error handling
    const connectSignalR = async () => {
      try {
        const hub = new HubConnectionBuilder()
          .withUrl(`${API.replace('/api', '')}/hubs/match`, {
            accessTokenFactory: () => token
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Warning)
          .build();

        hub.on('TickUpdate', (m: Match) => setMatch(m));
        hub.on('MatchState', (m: Match) => setMatch(m));

        await hub.start();
        await hub.invoke('JoinMatch', id);
        setConnection(hub);
      } catch (err) {
        console.warn('SignalR connection failed, using polling mode');
        // Fallback to polling if SignalR fails
        const pollInterval = setInterval(async () => {
          const data = await api.get<Match>(`/match/${id}`, token);
          if (data) setMatch(data);
          if (data?.status === 'Finished') clearInterval(pollInterval);
        }, 2000);
        return () => clearInterval(pollInterval);
      }
    };

    connectSignalR();

    return () => {
      connection?.stop();
    };
  }, [id, token]);

  // Auto-simulate if leaving unfinished match
  const handleBackToLeague = async () => {
    if (match && match.status !== 'Finished' && match.fixtureId) {
      setSimulating(true);
      await api.post(`/game/fixture/${match.fixtureId}/simulate`, {}, token);
    }
    nav(-1);
  };

  const handleSimulateMatch = async () => {
    if (!match?.fixtureId) return;
    setSimulating(true);
    const result = await api.post<MatchSimResult>(`/game/fixture/${match.fixtureId}/simulate`, {}, token);
    if (result.ok) {
      // Reload match data
      const data = await api.get<Match>(`/match/${id}`, token);
      if (data) setMatch(data);
    }
    setSimulating(false);
  };

  if (loading) return <Layout><div className="text-center py-20 text-zinc-400">Loading match...</div></Layout>;
  if (!match) return <Layout><div className="text-center py-20 text-zinc-400">Match not found</div></Layout>;

  const minute = Math.floor(match.currentTick / 60);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back button and controls */}
        <div className="flex items-center justify-between">
          <button onClick={handleBackToLeague} className="text-zinc-400 hover:text-white cursor-pointer flex items-center gap-2">
            ← Back to League
          </button>
          {match.status !== 'Finished' && (
            <Button onClick={handleSimulateMatch} disabled={simulating}>
              {simulating ? '⏳ Simulating...' : '⏩ Simulate Rest'}
            </Button>
          )}
        </div>

        {/* Scoreboard */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold">{match.homeTeam.teamName}</p>
              <p className="text-sm text-zinc-400">{match.homeTeam.formation}</p>
            </div>
            <div className="px-8 text-center">
              <p className="text-5xl font-bold">{match.homeScore} - {match.awayScore}</p>
              <p className="text-zinc-400 mt-2">{minute}' • {match.status}</p>
              <p className="text-xs text-zinc-500 mt-1">{match.weather} • {match.attendance.toLocaleString()} fans</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-2xl font-bold">{match.awayTeam.teamName}</p>
              <p className="text-sm text-zinc-400">{match.awayTeam.formation}</p>
            </div>
          </div>

          {/* Enhanced Pitch with Player Icons */}
          <Pitch2D match={match} />
        </Card>

        {/* Events */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Match Events</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {match.events.filter((e) => e.isKeyEvent).slice().reverse().map((e) => (
              <div key={e.id} className={`p-3 rounded-lg flex items-center gap-3 ${e.type === 'Goal' ? 'bg-emerald-500/20 border-l-4 border-emerald-500' :
                e.type === 'YellowCard' ? 'bg-yellow-500/20 border-l-4 border-yellow-500' :
                  e.type === 'RedCard' ? 'bg-red-500/20 border-l-4 border-red-500' :
                    e.isImportantEvent ? 'bg-cyan-500/20' : 'bg-zinc-800/50'
                }`}>
                <span className="text-zinc-400 w-12 text-right">{e.minute}'</span>
                <span className={`w-8 text-center ${e.isHomeTeam ? 'text-cyan-400' : 'text-orange-400'}`}>
                  {e.isHomeTeam ? 'H' : 'A'}
                </span>
                <span className={e.type === 'Goal' ? 'text-emerald-400 font-bold' : ''}>
                  {e.type === 'Goal' ? '⚽ GOAL!' : e.type === 'YellowCard' ? '🟨' : e.type === 'RedCard' ? '🟥' : ''}
                  {' '}{e.description || e.type}
                </span>
                {e.primaryPlayerName && <span className="text-zinc-500">({e.primaryPlayerName})</span>}
              </div>
            ))}
            {match.events.filter((e) => e.isKeyEvent).length === 0 && (
              <p className="text-zinc-500 text-center py-4">No key events yet</p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}

function NotificationsPage() {
  const { token, notifications, setNotifications, refreshNotifications } = useApp();
  const [loading, setLoading] = useState(false);

  const markRead = async (notifId: string) => {
    try {
      await fetch(`${API}/notification/${notifId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch(`${API}/notification/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="secondary" onClick={markAllRead} disabled={loading}>
            {loading ? 'Marking...' : 'Mark All Read'}
          </Button>
        )}
      </div>
      <Card>
        {notifications.length === 0 ? (
          <p className="text-zinc-500 text-center py-8">No notifications</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`p-4 rounded-lg cursor-pointer transition ${n.isRead ? 'bg-zinc-800/30' : 'bg-zinc-800/50 hover:bg-zinc-700/50'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{n.title}</span>
                  <span className="text-xs text-zinc-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-zinc-400">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Layout>
  );
}

function ManagersPage() {
  const { managers } = useApp();
  const nav = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Managers</h1>
          <Button onClick={() => nav('/managers/create')}>+ Create Manager</Button>
        </div>
        {managers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-4">You haven't created any managers yet.</p>
              <Button onClick={() => nav('/managers/create')}>Create Your First Manager</Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managers.map((m) => (
              <Card key={m.id} className="cursor-pointer hover:border-emerald-500/50 transition" onClick={() => nav(`/manager/${m.id}`)}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center text-2xl">👔</div>
                  <div>
                    <h3 className="font-semibold text-lg">{m.name}</h3>
                    <p className="text-sm text-zinc-400">{m.nationality} • Age {m.age}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                  <div className="bg-zinc-800 rounded p-2"><p className="text-zinc-400">PHY</p><p className="font-medium">{m.physical}</p></div>
                  <div className="bg-zinc-800 rounded p-2"><p className="text-zinc-400">MEN</p><p className="font-medium">{m.mental}</p></div>
                  <div className="bg-zinc-800 rounded p-2"><p className="text-zinc-400">TEC</p><p className="font-medium">{m.technical}</p></div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">{m.currentTeamName || 'Free Agent'}</span>
                  <span className="text-emerald-400">Rep: {m.reputation}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function ManagerDetailPage() {
  const { id } = useParams();
  const { token, managers } = useApp();
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    const load = async () => {
      const cached = managers.find(m => m.id === id);
      if (cached) { setManager(cached); setLoading(false); return; }
      const data = await api.get<Manager>(`/manager/${id}`, token);
      if (data) setManager(data);
      setLoading(false);
    };
    load();
  }, [id, token, managers]);

  if (loading) return <Layout><div className="text-center py-20 text-zinc-400">Loading...</div></Layout>;
  if (!manager) return <Layout><div className="text-center py-20 text-zinc-400">Manager not found</div></Layout>;

  const getStatColor = (val: number) => val >= 80 ? 'text-emerald-400' : val >= 60 ? 'text-yellow-400' : val >= 40 ? 'text-orange-400' : 'text-red-400';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => nav(-1)} className="text-zinc-400 hover:text-white cursor-pointer">← Back</button>
          <div className="w-20 h-20 bg-zinc-700 rounded-full flex items-center justify-center text-4xl">👔</div>
          <div>
            <h1 className="text-3xl font-bold">{manager.name}</h1>
            <p className="text-zinc-400">{manager.nationality} • Age {manager.age} • {manager.currentTeamName || 'Free Agent'}</p>
          </div>
          {manager.isRetired && <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">Retired</span>}
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <h3 className="text-sm text-zinc-400 mb-2">Reputation</h3>
            <div className={`text-3xl font-bold ${getStatColor(manager.reputation)}`}>{manager.reputation}</div>
            <div className="text-sm text-zinc-500">Out of 100</div>
          </Card>
          <Card>
            <h3 className="text-sm text-zinc-400 mb-2">Personal Balance</h3>
            <div className="text-3xl font-bold text-emerald-400">€{(manager.personalBalance / 1000).toFixed(0)}K</div>
          </Card>
          <Card>
            <h3 className="text-sm text-zinc-400 mb-2">Current Team</h3>
            <div className="text-xl font-bold">{manager.currentTeamName || 'None'}</div>
            <div className="text-sm text-zinc-500">{manager.leagueInstanceId ? 'In League' : 'Free'}</div>
          </Card>
          <Card>
            <h3 className="text-sm text-zinc-400 mb-2">Languages</h3>
            <div className="space-y-1">
              {manager.languages.length === 0 ? (
                <p className="text-zinc-500 text-sm">None</p>
              ) : (
                manager.languages.map(l => (
                  <div key={l.languageCode} className="flex justify-between text-sm">
                    <span>{l.languageCode.toUpperCase()}</span>
                    <span className={getStatColor(l.proficiency)}>{l.proficiency}%</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Attributes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Physical', value: manager.physical, desc: 'Stamina, energy management' },
              { name: 'Mental', value: manager.mental, desc: 'Decision making, pressure handling' },
              { name: 'Technical', value: manager.technical, desc: 'Tactical knowledge, training quality' },
            ].map(attr => (
              <div key={attr.name}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{attr.name}</span>
                  <span className={`font-bold ${getStatColor(attr.value)}`}>{attr.value}</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${attr.value >= 80 ? 'bg-emerald-500' : attr.value >= 60 ? 'bg-yellow-500' : attr.value >= 40 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${attr.value}%` }} />
                </div>
                <p className="text-xs text-zinc-500 mt-1">{attr.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {manager.currentTeamId && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="flex gap-3">
              <Button onClick={() => nav(`/league/${manager.leagueInstanceId}`)}>Go to League</Button>
              <Button variant="secondary">View Team</Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function AdminPage() {
  const { token, isAdmin } = useApp();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    if (!isAdmin) nav('/dashboard');
  }, [isAdmin, nav]);

  const handleSeed = async () => {
    setLoading(true);
    setMessage('');
    const result = await api.post('/admin/seed', {}, token);
    setMessage(result.ok ? 'Data seeded successfully!' : `Failed: ${result.error}`);
    setLoading(false);
  };

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Card>
          <h2 className="text-xl font-semibold mb-4">Database</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Seed initial data: countries, leagues, teams, players, and admin user.
          </p>
          <Button onClick={handleSeed} disabled={loading}>
            {loading ? 'Seeding...' : 'Seed Initial Data'}
          </Button>
          {message && (
            <p className={`mt-4 px-3 py-2 rounded ${message.includes('success') ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
              {message}
            </p>
          )}
        </Card>
      </div>
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/managers" element={<ManagersPage />} />
      <Route path="/managers/create" element={<CreateManagerPage />} />
      <Route path="/manager/:id" element={<ManagerDetailPage />} />
      <Route path="/leagues" element={<BrowseLeaguesPage />} />
      <Route path="/leagues/browse" element={<BrowseLeaguesPage />} />
      <Route path="/leagues/create" element={<CreateLeaguePage />} />
      <Route path="/league/:id" element={<LeagueDetailPage />} />
      <Route path="/league/:id/join" element={<JoinLeaguePage />} />
      <Route path="/team/:id" element={<TeamDetailPage />} />
      <Route path="/match/:id" element={<MatchPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

function AppProvider({ children, token, user, logout }: { children: ReactNode; token: string; user: User; logout: () => void }) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDark, setIsDark] = useState(true);
  const isAdmin = user?.isAdmin ?? false;

  const refreshNotifications = async () => {
    try {
      const res = await fetch(`${API}/notification`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, [token]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        managers,
        setManagers,
        notifications,
        setNotifications,
        refreshNotifications,
        isDark,
        toggleTheme,
        logout,
        isAdmin
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!token || !user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <AppProvider token={token} user={user} logout={handleLogout}>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
