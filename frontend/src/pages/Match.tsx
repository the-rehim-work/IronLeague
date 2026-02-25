import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchHubClient } from '@/lib/signalr';
import { matchesApi } from '@/api';
import Spinner from '@/components/Spinner';
import type { MatchState, MatchEvent, Match } from '@/types';
import { ArrowLeft, Pause, Play, MessageSquare, FastForward } from 'lucide-react';

function norm(obj: Record<string, unknown>, key: string): unknown {
  return obj[key] ?? obj[key[0].toUpperCase() + key.slice(1)];
}

export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<MatchState | null>(null);
  const [matchInfo, setMatchInfo] = useState<{ homeTeamName: string; awayTeamName: string; homeFormation: string; awayFormation: string; homeColor: string; awayColor: string } | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const hubRef = useRef<MatchHubClient | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const [matchData, setMatchData] = useState<Match | null>(null);

  useEffect(() => {
    if (!matchId) { setError('No match ID'); return; }

    const hub = new MatchHubClient();
    hubRef.current = hub;

    hub.connect(matchId).then(() => {
      setConnected(true);

      hub.on('MatchState', (raw: unknown) => {
        const d = raw as Record<string, unknown>;
        setState({
          tick: (norm(d, 'tick') as number) || 0,
          ballX: (norm(d, 'ballX') as number) || 50,
          ballY: (norm(d, 'ballY') as number) || 50,
          homeScore: (norm(d, 'homeScore') as number) || 0,
          awayScore: (norm(d, 'awayScore') as number) || 0,
          status: (norm(d, 'status') as string) || 'InProgress',
          isHomeTeamPossession: (norm(d, 'isHomeTeamPossession') as boolean) ?? true,
          homeMomentum: (norm(d, 'homeMomentum') as number) || 50,
          awayMomentum: (norm(d, 'awayMomentum') as number) || 50,
        });
      });

      hub.on('MatchInfo', (raw: unknown) => {
        const d = raw as Record<string, unknown>;
        setMatchInfo({
          homeTeamName: (norm(d, 'homeTeamName') as string) || 'Home',
          awayTeamName: (norm(d, 'awayTeamName') as string) || 'Away',
          homeFormation: (norm(d, 'homeFormation') as string) || '4-4-2',
          awayFormation: (norm(d, 'awayFormation') as string) || '4-4-2',
          homeColor: '#3b82f6',
          awayColor: '#ef4444',
        });
      });

      hub.on('MatchEvent', (raw: unknown) => {
        const d = raw as Record<string, unknown>;
        const evt: MatchEvent = {
          id: (norm(d, 'id') as string) || String(Date.now()),
          tick: (norm(d, 'tick') as number) || 0,
          minute: (norm(d, 'minute') as number) || Math.floor(((norm(d, 'tick') as number) || 0) / 60),
          type: (norm(d, 'type') as string) || '',
          description: (norm(d, 'description') as string) || '',
          isHomeTeam: (norm(d, 'isHomeTeam') as boolean) ?? true,
          isKeyEvent: (norm(d, 'isKeyEvent') as boolean) ?? false,
          isImportantEvent: (norm(d, 'isImportantEvent') as boolean) ?? false,
          primaryPlayerName: norm(d, 'primaryPlayerName') as string | undefined,
          secondaryPlayerName: norm(d, 'secondaryPlayerName') as string | undefined,
        };
        setEvents((prev) => [...prev, evt]);
      });

      hub.on('MatchPaused', () => setPaused(true));
      hub.on('MatchResumed', () => setPaused(false));
      hub.on('MatchEnded', () => setFinished(true));
      hub.on('MatchFinished', () => setFinished(true));
      hub.on('Error', (msg: unknown) => setError(String(msg)));
    }).catch((err) => {
      setError(String((err as Error)?.message || 'Connection failed'));
      matchesApi.getById(matchId).then((m) => {
        setMatchData(m);
        setState({
          tick: m.currentTick, ballX: 50, ballY: 50,
          homeScore: m.homeScore, awayScore: m.awayScore,
          status: m.status, isHomeTeamPossession: true,
          homeMomentum: 50, awayMomentum: 50,
        });
        setMatchInfo({
          homeTeamName: m.homeTeam?.teamName || 'Home',
          awayTeamName: m.awayTeam?.teamName || 'Away',
          homeFormation: m.homeTeam?.formation || '4-4-2',
          awayFormation: m.awayTeam?.formation || '4-4-2',
          homeColor: '#3b82f6', awayColor: '#ef4444',
        });
        setEvents(m.events || []);
        if (m.status === 'Finished') setFinished(true);
        setConnected(true);
        setError(null);
      }).catch(() => {});
    });

    return () => { hub.disconnect(); };
  }, [matchId]);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const handlePause = async () => {
    if (!hubRef.current || !matchId) return;
    try { paused ? await hubRef.current.resumeMatch(matchId) : await hubRef.current.pauseMatch(matchId); } catch {}
  };

  const handleSimRest = async () => {
    if (!matchData?.fixtureId && !matchId) return;
    setSimulating(true);
    try {
      if (matchData?.fixtureId) {
        await matchesApi.simulateFixture(matchData.fixtureId);
      }
      setFinished(true);
      if (matchId) {
        const m = await matchesApi.getById(matchId);
        setState((prev) => prev ? { ...prev, homeScore: m.homeScore, awayScore: m.awayScore, status: 'Finished' } : prev);
        setEvents(m.events || []);
      }
    } catch {} finally { setSimulating(false); }
  };

  if (!connected && !error) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Spinner text="Connecting to match..." /></div>;
  }

  if (error && !state) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="card p-8 max-w-sm text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-secondary text-sm">Back</button>
        </div>
      </div>
    );
  }

  const minute = state ? Math.floor(state.tick / 60) : 0;
  const homeName = matchInfo?.homeTeamName || 'Home';
  const awayName = matchInfo?.awayTeamName || 'Away';

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          <div className="flex items-center gap-2">
            {paused && <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">PAUSED</span>}
            {state?.status === 'HalfTime' && <span className="px-2 py-0.5 bg-sky-600 text-white rounded text-[10px] font-bold">HALF TIME</span>}
            {finished && <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">FULL TIME</span>}
            <span className={`text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>{connected ? '● Live' : '○ Offline'}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-3">
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-zinc-400 mb-3">CONTROLS</h3>
              <div className="space-y-2">
                <button onClick={handlePause} disabled={finished} className="w-full btn-secondary flex items-center justify-center gap-1.5 text-xs disabled:opacity-30">
                  {paused ? <><Play className="w-3.5 h-3.5" />Resume</> : <><Pause className="w-3.5 h-3.5" />Pause</>}
                </button>
                {!finished && (
                  <button onClick={handleSimRest} disabled={simulating || finished} className="w-full btn-ghost flex items-center justify-center gap-1.5 text-xs">
                    <FastForward className="w-3.5 h-3.5" />{simulating ? 'Simulating...' : 'Sim Rest'}
                  </button>
                )}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-xs font-semibold text-zinc-400 mb-3">INFO</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Minute</span><span className="text-white font-bold">{minute}'</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className="text-white">{state?.status}</span></div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Possession</span>
                  <span className={state?.isHomeTeamPossession ? 'text-sky-400' : 'text-rose-400'}>
                    {state?.isHomeTeamPossession ? homeName : awayName}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-xs font-semibold text-zinc-400 mb-3">MOMENTUM</h3>
              {[{ name: homeName, val: state?.homeMomentum || 50, color: 'bg-sky-500' }, { name: awayName, val: state?.awayMomentum || 50, color: 'bg-rose-500' }].map((m) => (
                <div key={m.name} className="mb-2.5">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-zinc-500">{m.name}</span>
                    <span className="text-white">{Math.round(m.val)}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${m.color} transition-all duration-500`} style={{ width: `${m.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-3 space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="text-center flex-1">
                  <p className="text-xl font-bold text-white">{homeName}</p>
                  <p className="text-zinc-500 text-xs">{matchInfo?.homeFormation}</p>
                </div>
                <div className="px-6 text-center">
                  <p className="text-4xl font-bold text-white">{state?.homeScore || 0} - {state?.awayScore || 0}</p>
                  <p className="text-zinc-500 text-xs mt-1">{minute}' · {state?.status}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xl font-bold text-white">{awayName}</p>
                  <p className="text-zinc-500 text-xs">{matchInfo?.awayFormation}</p>
                </div>
              </div>

              <div className="relative w-full aspect-[16/10] bg-gradient-to-b from-emerald-800 to-emerald-900 rounded-lg overflow-hidden border-2 border-white/10">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
                  <circle cx="50" cy="50" r="12" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
                  <circle cx="50" cy="50" r="0.8" fill="white" fillOpacity="0.4" />
                  <rect x="0" y="18" width="16" height="64" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
                  <rect x="84" y="18" width="16" height="64" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
                  <rect x="0" y="32" width="6" height="36" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
                  <rect x="94" y="32" width="6" height="36" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="0.3" />
                </svg>
                <div
                  className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-lg transition-all duration-500 z-10"
                  style={{
                    left: `${state?.ballX || 50}%`,
                    top: `${state?.ballY || 50}%`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                  }}
                />
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-xs font-semibold text-zinc-400 mb-3">EVENTS</h3>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {events.length === 0 ? (
                  <p className="text-zinc-600 text-xs text-center py-4">Waiting for events...</p>
                ) : (
                  events.filter((e) => e.isKeyEvent || e.type === 'Goal' || e.type === 'YellowCard' || e.type === 'RedCard').reverse().map((e) => (
                    <div key={e.id} className={`p-2.5 rounded-lg flex items-center gap-2.5 text-xs ${
                      e.type === 'Goal' ? 'bg-emerald-500/15 border-l-2 border-emerald-500' :
                      e.type === 'YellowCard' ? 'bg-amber-500/15 border-l-2 border-amber-500' :
                      e.type === 'RedCard' ? 'bg-red-500/15 border-l-2 border-red-500' :
                      'bg-zinc-800/40'
                    }`}>
                      <span className="text-zinc-500 w-8 text-right font-mono">{e.minute}'</span>
                      <span className={`w-5 text-center font-bold ${e.isHomeTeam ? 'text-sky-400' : 'text-rose-400'}`}>
                        {e.isHomeTeam ? 'H' : 'A'}
                      </span>
                      <span className={e.type === 'Goal' ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}>
                        {e.type === 'Goal' ? '⚽ ' : e.type === 'YellowCard' ? '🟨 ' : e.type === 'RedCard' ? '🟥 ' : ''}
                        {e.description || e.type}
                      </span>
                      {e.primaryPlayerName && <span className="text-zinc-600">({e.primaryPlayerName})</span>}
                    </div>
                  ))
                )}
                <div ref={eventsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}