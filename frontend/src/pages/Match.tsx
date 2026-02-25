/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchHubClient } from '../lib/signalr';
import MatchPitch from '../components/MatchPitch';
import LoadingSpinner from '../components/Loadingspinner';
import { ArrowLeft, Pause, Play, MessageSquare } from 'lucide-react';
import SpeechModal from '../components/SpeechModal';

interface MatchState {
  tick: number;
  ballX: number;
  ballY: number;
  homeScore: number;
  awayScore: number;
  status: string;
  isHomeTeamPossession: boolean;
  homeMomentum: number;
  awayMomentum: number;
}

interface MatchEvent {
  id: string;
  tick: number;
  minute: number;
  type: string;
  description: string;
  isHomeTeam: boolean;
  isKeyEvent: boolean;
  isImportantEvent: boolean;
}

export default function Match() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const hubRef = useRef<MatchHubClient | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [speechesRemaining, setSpeechesRemaining] = useState(3);

  useEffect(() => {
    if (!matchId) {
      setError('No match ID provided');
      return;
    }

    connectToMatch();

    return () => {
      hubRef.current?.disconnect();
    };
  }, [matchId]);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  async function connectToMatch() {
    try {
      const hub = new MatchHubClient();
      hubRef.current = hub;

      await hub.connect(matchId!);
      setIsConnected(true);

      hub.onMatchState((state: any) => {
        setMatchState({
          tick: state.Tick || state.tick,
          ballX: state.BallX || state.ballX || 50,
          ballY: state.BallY || state.ballY || 50,
          homeScore: state.HomeScore || state.homeScore || 0,
          awayScore: state.AwayScore || state.awayScore || 0,
          status: state.Status || state.status || 'InProgress',
          isHomeTeamPossession: state.IsHomeTeamPossession ?? state.isHomeTeamPossession ?? true,
          homeMomentum: state.HomeMomentum || state.homeMomentum || 50,
          awayMomentum: state.AwayMomentum || state.awayMomentum || 50,
        });

        if (state.homeTeam || state.HomeTeam) {
          setMatchData({
            homeTeam: state.homeTeam || state.HomeTeam,
            awayTeam: state.awayTeam || state.AwayTeam,
          });
        }
      });

      hub.onMatchEvent((event: any) => {
        const newEvent: MatchEvent = {
          id: event.Id || event.id || Date.now().toString(),
          tick: event.Tick || event.tick,
          minute: event.Minute || event.minute || Math.floor((event.Tick || event.tick) / 60),
          type: event.Type || event.type,
          description: event.Description || event.description || '',
          isHomeTeam: event.IsHomeTeam ?? event.isHomeTeam,
          isKeyEvent: event.IsKeyEvent ?? event.isKeyEvent ?? false,
          isImportantEvent: event.IsImportantEvent ?? event.isImportantEvent ?? false,
        };
        setEvents((prev) => [...prev, newEvent]);
      });

      hub.onMatchPaused(() => setIsPaused(true));
      hub.onMatchResumed(() => setIsPaused(false));

      hub.onMatchEnded((data: any) => {
        console.log('Match ended:', data);
      });

      hub.onError((errorMsg: string) => {
        setError(errorMsg);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect to match');
      setIsConnected(false);
    }
  }

  async function handlePause() {
    if (!hubRef.current || !matchId) return;
    try {
      await hubRef.current.pauseMatch(matchId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleResume() {
    if (!hubRef.current || !matchId) return;
    try {
      await hubRef.current.resumeMatch(matchId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSpeech(speech: { type: string; target: string; targetPlayerId?: string; tone: string }) {
    if (!hubRef.current || !matchId) return;
    try {
      await hubRef.current.giveSpeech({
        matchId,
        ...speech,
      });
      setSpeechesRemaining((prev) => prev - 1);
      setShowSpeechModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">Connection Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || !matchState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner text="Connecting to match..." />
      </div>
    );
  }

  const minute = Math.floor(matchState.tick / 60);
  const homeTeamName = matchData?.homeTeam?.teamName || 'Home';
  const awayTeamName = matchData?.awayTeam?.teamName || 'Away';
  const homeColor = matchData?.homeTeam?.primaryColor || '#3b82f6';
  const awayColor = matchData?.awayTeam?.primaryColor || '#ef4444';

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            {isPaused && (
              <span className="px-3 py-1 bg-yellow-600 text-white rounded-full text-sm font-semibold">
                PAUSED
              </span>
            )}
            {matchState.status === 'HalfTime' && (
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold">
                HALF TIME
              </span>
            )}
            {matchState.status === 'Finished' && (
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">
                FULL TIME
              </span>
            )}
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? '● Live' : '○ Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="text-lg font-bold text-white mb-4">Match Controls</h3>
              <div className="space-y-2">
                {isPaused ? (
                  <button onClick={handleResume} className="w-full btn-success flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    disabled={matchState.status === 'Finished'}
                    className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                )}
                <button
                  onClick={() => setShowSpeechModal(true)}
                  disabled={matchState.status === 'Finished' || speechesRemaining <= 0}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <MessageSquare className="w-5 h-5" />
                  Speech ({speechesRemaining})
                </button>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-lg font-bold text-white mb-4">Match Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Minute</span>
                  <span className="text-white font-bold">{minute}'</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-white">{matchState.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Possession</span>
                  <span className={matchState.isHomeTeamPossession ? 'text-blue-400' : 'text-red-400'}>
                    {matchState.isHomeTeamPossession ? homeTeamName : awayTeamName}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-lg font-bold text-white mb-4">Momentum</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{homeTeamName}</span>
                    <span className="text-white">{Math.round(matchState.homeMomentum)}</span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${matchState.homeMomentum}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{awayTeamName}</span>
                    <span className="text-white">{Math.round(matchState.awayMomentum)}</span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${matchState.awayMomentum}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <MatchPitch
              ballX={matchState.ballX}
              ballY={matchState.ballY}
              homeScore={matchState.homeScore}
              awayScore={matchState.awayScore}
              minute={minute}
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
              homeColor={homeColor}
              awayColor={awayColor}
            />

            <div className="card p-4">
              <h3 className="text-lg font-bold text-white mb-4">Match Events</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Waiting for match events...</p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg ${event.type === 'Goal'
                        ? 'bg-green-900/30 border border-green-500'
                        : event.type === 'YellowCard'
                          ? 'bg-yellow-900/30 border border-yellow-500'
                          : event.type === 'RedCard'
                            ? 'bg-red-900/30 border border-red-500'
                            : event.isKeyEvent
                              ? 'bg-blue-900/20 border border-blue-500/30'
                              : 'bg-gray-800/50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-mono w-8">{event.minute}'</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${event.isHomeTeam ? 'bg-blue-500/30 text-blue-400' : 'bg-red-500/30 text-red-400'
                          }`}>
                          {event.type}
                        </span>
                        <span className="text-sm text-gray-300 flex-1">{event.description}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={eventsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {showSpeechModal && (
        <SpeechModal
          players={[]}
          onSubmit={handleSpeech}
          onClose={() => setShowSpeechModal(false)}
          speechesRemaining={speechesRemaining}
        />
      )}
    </div>
  );
}