import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/stores/authStore';
import { adminApi } from '@/api';
import { toast } from 'sonner';

export default function Admin() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);

  if (!user?.isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await adminApi.seed();
      toast.success('Data seeded successfully');
    } catch {
      toast.error('Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Panel</h1>
      <div className="card p-6 max-w-md">
        <h2 className="text-sm font-semibold text-zinc-400 mb-2">DATABASE</h2>
        <p className="text-zinc-500 text-xs mb-4">Seed initial data: countries, leagues, teams, players.</p>
        <button onClick={handleSeed} disabled={seeding} className="btn-primary text-sm">
          {seeding ? 'Seeding...' : 'Seed Initial Data'}
        </button>
      </div>
    </Layout>
  );
}