import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Swords } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [userOrEmail, setUserOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(userOrEmail, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(userName, password, email || undefined, displayName || undefined);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Swords className="w-10 h-10 text-sky-500" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">IRON LEAGUE</h1>
          <p className="text-zinc-500 text-sm mt-1">Football Manager</p>
        </div>

        <div className="card p-6">
          <div className="flex mb-5 bg-zinc-800/60 rounded-lg p-1 gap-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                isLogin ? 'bg-sky-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                !isLogin ? 'bg-sky-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Username or Email</label>
                <input
                  type="text"
                  value={userOrEmail}
                  onChange={(e) => setUserOrEmail(e.target.value)}
                  className="input"
                  placeholder="Enter username or email"
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter password"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="input" placeholder="Choose a username" required />
              </div>
              <div>
                <label className="label">Email <span className="text-zinc-600">(optional)</span></label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="Your email" />
              </div>
              <div>
                <label className="label">Display Name <span className="text-zinc-600">(optional)</span></label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" placeholder="How others see you" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Min 6 characters" required />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-zinc-600">
            Demo: <span className="text-zinc-400">Admin</span> / <span className="text-zinc-400">Admin123!</span>
          </p>
        </div>
      </div>
    </div>
  );
}