import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { managersApi } from '@/api';
import type { Country } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function CreateManager() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [earlyBonus, setEarlyBonus] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    managersApi.getCountries().then((data) => {
      setCountries(data);
      if (data.length > 0) setNationality(data[0].code);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nationality) return;
    setError('');
    setSubmitting(true);
    try {
      const manager = await managersApi.create({ name: name.trim(), nationality, earlyBonus });
      navigate(`/managers/${manager.id}`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create manager');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate('/managers')} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back to Managers
        </button>
        <div className="card p-6">
          <h1 className="text-xl font-bold text-white mb-5">Create New Manager</h1>
          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Manager Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Enter manager name" required maxLength={50} />
            </div>
            <div>
              <label className="label">Nationality</label>
              <select value={nationality} onChange={(e) => setNationality(e.target.value)} className="input" required>
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <label className="flex items-start gap-3 p-3 bg-zinc-800/40 rounded-lg cursor-pointer border border-zinc-800 hover:border-zinc-700 transition-all">
              <input type="checkbox" checked={earlyBonus} onChange={(e) => setEarlyBonus(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-900 accent-sky-500" />
              <div>
                <p className="text-white text-sm font-medium">Early Career Bonus</p>
                <p className="text-zinc-500 text-xs">+20 to all starting attributes. Recommended for first-timers.</p>
              </div>
            </label>
            <div className="grid grid-cols-3 gap-3 p-3 bg-sky-500/5 border border-sky-500/20 rounded-lg">
              {['Physical', 'Mental', 'Technical'].map((attr) => (
                <div key={attr} className="text-center">
                  <p className="text-zinc-500 text-xs">{attr}</p>
                  <p className="text-lg font-bold text-white">{earlyBonus ? 60 : 40}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/managers')} className="flex-1 btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting || !name.trim()} className="flex-1 btn-primary">{submitting ? 'Creating...' : 'Create Manager'}</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}