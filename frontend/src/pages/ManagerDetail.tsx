import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/Loadingspinner';
import { managersApi } from '../api';
import type { Manager } from '../types';
import { ArrowLeft, Trophy, Briefcase, Globe, DollarSign } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function ManagerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadManager(id);
  }, [id]);

  const loadManager = async (managerId: string) => {
    try {
      const data = await managersApi.getById(managerId);
      setManager(data);
    } catch (error) {
      console.error('Failed to load manager:', error);
      setError('Manager not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading manager..." />
        </div>
      </Layout>
    );
  }

  if (error || !manager) {
    return (
      <Layout>
        <div className="p-8">
          <button
            onClick={() => navigate('/managers')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Managers
          </button>
          <div className="card p-8 text-center">
            <p className="text-red-400">{error || 'Manager not found'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <button
          onClick={() => navigate('/managers')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Managers
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                  {manager.name[0]}
                </div>
                <h1 className="text-2xl font-bold text-white">{manager.name}</h1>
                <p className="text-gray-400">{manager.nationality}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Age</span>
                  <span className="text-white font-medium">{manager.age}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Reputation</span>
                  <span className="text-white font-medium">{manager.reputation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Balance</span>
                  <span className="text-green-400 font-medium">{formatCurrency(manager.personalBalance)}</span>
                </div>
                {manager.currentTeamName && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Current Team</span>
                    <span className="text-blue-400 font-medium">{manager.currentTeamName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Attributes</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-500 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-white">{manager.physical}</span>
                  </div>
                  <p className="text-gray-400">Physical</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-4 border-purple-500 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-white">{manager.mental}</span>
                  </div>
                  <p className="text-gray-400">Mental</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-white">{manager.technical}</span>
                  </div>
                  <p className="text-gray-400">Technical</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Languages</h2>
              {manager.languages.length === 0 ? (
                <p className="text-gray-400">No languages recorded</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {manager.languages.map((lang) => (
                    <div key={lang.languageCode} className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-lg">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{lang.languageCode.toUpperCase()}</span>
                      <span className="text-sm text-gray-400">({lang.proficiency}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!manager.currentTeamId && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Find a Team</h2>
                <p className="text-gray-400 mb-4">This manager is currently unemployed. Join a league to manage a team.</p>
                <button
                  onClick={() => navigate('/leagues')}
                  className="btn-primary"
                >
                  Browse Leagues
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}