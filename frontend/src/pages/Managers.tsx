import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/Loadingspinner';
import { managersApi } from '../api';
import type { Manager } from '../types';
import { Plus, User, Trophy, Briefcase } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function Managers() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    try {
      const data = await managersApi.getMyManagers();
      setManagers(data);
    } catch (error) {
      console.error('Failed to load managers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner text="Loading managers..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Managers</h1>
            <p className="text-gray-400 mt-1">Create and manage your football managers</p>
          </div>
          <button
            onClick={() => navigate('/managers/create')}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus className="w-5 h-5" />
            Create Manager
          </button>
        </div>

        {managers.length === 0 ? (
          <div className="card p-12 text-center">
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Managers Yet</h2>
            <p className="text-gray-400 mb-6">Create your first manager to start your football journey</p>
            <button
              onClick={() => navigate('/managers/create')}
              className="btn-primary"
            >
              Create Your First Manager
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managers.map((manager) => (
              <div
                key={manager.id}
                onClick={() => navigate(`/managers/${manager.id}`)}
                className="card p-6 cursor-pointer hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {manager.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{manager.name}</h3>
                    <p className="text-gray-400">{manager.nationality}</p>
                    <p className="text-sm text-gray-500">Age: {manager.age}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-500">Physical</p>
                    <p className="text-lg font-bold text-white">{manager.physical}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-500">Mental</p>
                    <p className="text-lg font-bold text-white">{manager.mental}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-500">Technical</p>
                    <p className="text-lg font-bold text-white">{manager.technical}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Trophy className="w-4 h-4" />
                    <span>Rep: {manager.reputation}</span>
                  </div>
                  <span className="text-green-400">{formatCurrency(manager.personalBalance)}</span>
                </div>

                {manager.currentTeamName && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Briefcase className="w-4 h-4" />
                      <span>{manager.currentTeamName}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}