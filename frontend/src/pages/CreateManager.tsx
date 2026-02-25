/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/Loadingspinner';
import { managersApi } from '../api';
import type { Country } from '../types';
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
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const data = await managersApi.getCountries();
      setCountries(data);
      if (data.length > 0) {
        setNationality(data[0].code);
      }
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nationality) return;

    setError('');
    setSubmitting(true);

    try {
      const manager = await managersApi.create({
        name: name.trim(),
        nationality,
        earlyBonus,
      });
      navigate(`/managers/${manager.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create manager');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/managers')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Managers
        </button>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Create New Manager</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Manager Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Enter manager name"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label className="label">Nationality</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="input"
                required
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="card p-4 bg-gray-900/50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={earlyBonus}
                  onChange={(e) => setEarlyBonus(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p className="text-white font-medium">Early Career Bonus</p>
                  <p className="text-sm text-gray-400">
                    Start with +20 to Physical, Mental, and Technical attributes. 
                    Recommended for first-time managers.
                  </p>
                </div>
              </label>
            </div>

            <div className="card p-4 bg-blue-500/10 border-blue-500/30">
              <h3 className="text-white font-medium mb-2">Starting Attributes Preview</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-sm">Physical</p>
                  <p className="text-xl font-bold text-white">{earlyBonus ? 60 : 40}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Mental</p>
                  <p className="text-xl font-bold text-white">{earlyBonus ? 60 : 40}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Technical</p>
                  <p className="text-xl font-bold text-white">{earlyBonus ? 60 : 40}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/managers')}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Manager'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}