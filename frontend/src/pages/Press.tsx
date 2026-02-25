import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Spinner from '@/components/Spinner';
import { pressApi } from '@/api';
import type { PressEventDto } from '@/types';
import { ArrowLeft, Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function Press() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<PressEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (leagueId) pressApi.getForLeague(leagueId, 50).then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, [leagueId]);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Spinner /></div></Layout>;

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>

      <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-5"><Newspaper className="w-6 h-6 text-sky-400" />Press Room</h1>

      {events.length === 0 ? (
        <div className="card p-8 text-center text-zinc-500 text-sm">No press events yet</div>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{e.headline}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{formatDate(e.createdAt)} · {e.type}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {e.reputationImpact !== 0 && (
                    <span className={`flex items-center gap-0.5 text-[10px] ${e.reputationImpact > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {e.reputationImpact > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      Rep
                    </span>
                  )}
                  {e.moraleImpact !== 0 && (
                    <span className={`flex items-center gap-0.5 text-[10px] ${e.moraleImpact > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {e.moraleImpact > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      Mor
                    </span>
                  )}
                  {e.fanMoodImpact !== 0 && (
                    <span className={`flex items-center gap-0.5 text-[10px] ${e.fanMoodImpact > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {e.fanMoodImpact > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      Fans
                    </span>
                  )}
                  {e.reputationImpact === 0 && e.moraleImpact === 0 && e.fanMoodImpact === 0 && (
                    <Minus className="w-3 h-3 text-zinc-700" />
                  )}
                </div>
              </button>
              {expanded === e.id && (
                <div className="border-t border-zinc-800/60 p-4">
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{e.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}