import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchHubClient } from '../lib/signalr';
import MatchPitch from '../components/MatchPitch';

interface MatchState {
  matchId: string;
  tick: number;
  ballX: number;
  ballY: number;
  homeScore: number;
  awayScore: number;
  status: 'NotStarted' | 'InProgress' | 'Paused' | 'Finished';
  homeTeam: {
    teamName: string;
    primaryColor: string;
  };
  awayTeam: {
    teamName: string;
    primaryColor: string;
  };
  pausesRemaining: {
    home: number;
    away: number;
  };
  canPause: boolean;
  canGiveSpeech: boolean;
  speechesRemaining: number;
}

interface MatchEvent {
  tick: number;
  eventType: string;
  description: string;
  team?: string;
  playerName?: string;
}

export default function Match() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const hubRef = useRef<MatchHubClient | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId) {
      setError('No match ID provided');
      return;
    }

    connectToMatch();

    return () => {
      if (hubRef.current) {
        hubRef.current.disconnect();
      }
    };
  }, [matchId]);

  useEffect(() => {
    // Auto-scroll to latest event
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  async function connectToMatch() {
    try {
      const hub = new MatchHubClient();
      hubRef.current = hub;

      await hub.connect(matchId!);
      setIsConnected(true);

      hub.onMatchState((state: MatchState) => {
        setMatchState(state);
      });

      hub.onMatchEvent((event: MatchEvent) => {
        setEvents((prev) => [...prev, event]);
      });

      hub.onMatchFinished((summary: any) => {
        console.log('Match finished:', summary);
        // Could show a summary modal here
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
    if (!hubRef.current || !matchState?.canPause) return;
    try {
      await hubRef.current.pauseMatch(30); // 30 second pause
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleResume() {
    if (!hubRef.current) return;
    try {
      await hubRef.current.resumeMatch();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleSpeechClick() {
    if (matchState?.canGiveSpeech && matchState.speechesRemaining > 0) {
      setShowSpeechModal(true);
    }
  }

  async function handleSpeechSubmit(message: string) {
    if (!hubRef.current) return;
    try {
      await hubRef.current.giveSpeech(message);
      setShowSpeechModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || !matchState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-400">Connecting to match...</p>
        </div>
      </div>
    );
  }

  const minute = Math.floor(matchState.tick / 60);
  const isHalfTime = minute === 45;
  const isPaused = matchState.status === 'Paused';
  const isFinished = matchState.status === 'Finished';

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            {isPaused && (
              <span className="px-3 py-1 bg-yellow-600 text-white rounded-full text-sm font-semibold">
                PAUSED
              </span>
            )}
            {isHalfTime && (
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold">
                HALF TIME
              </span>
            )}
            {isFinished && (
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">
                FULL TIME
              </span>
            )}
          </div>

          <div className="text-gray-400 text-sm">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Match Controls */}
          <div className="space-y-4">
            {/* Controls Card */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">Controls</h3>

              <div className="space-y-3">
                {isPaused ? (
                  <button
                    onClick={handleResume}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
                  >
                    ▶ Resume Match
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    disabled={!matchState.canPause || isFinished}
                    className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                      matchState.canPause && !isFinished
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    ⏸ Pause ({matchState.pausesRemaining.home} left)
                  </button>
                )}

                <button
                  onClick={handleSpeechClick}
                  disabled={!matchState.canGiveSpeech || matchState.speechesRemaining === 0 || isFinished}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                    matchState.canGiveSpeech && matchState.speechesRemaining > 0 && !isFinished
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  🎤 Give Speech ({matchState.speechesRemaining} left)
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">Match Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Time:</span>
                  <span className="font-semibold text-white">{minute}'</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Status:</span>
                  <span className="font-semibold text-white">{matchState.status}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Pauses Left:</span>
                  <span className="font-semibold text-white">
                    {matchState.pausesRemaining.home} vs {matchState.pausesRemaining.away}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Pitch */}
          <div className="lg:col-span-2">
            <MatchPitch
              ballX={matchState.ballX}
              ballY={matchState.ballY}
              homeScore={matchState.homeScore}
              awayScore={matchState.awayScore}
              minute={minute}
              homeTeamName={matchState.homeTeam.teamName}
              awayTeamName={matchState.awayTeam.teamName}
              homeColor={matchState.homeTeam.primaryColor || '#3b82f6'}
              awayColor={matchState.awayTeam.primaryColor || '#ef4444'}
            />

            {/* Events Feed */}
            <div className="mt-4 bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">Match Events</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-sm">Waiting for match events...</p>
                ) : (
                  events.map((event, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        event.eventType === 'Goal'
                          ? 'bg-green-900/30 border border-green-500'
                          : event.eventType === 'YellowCard'
                          ? 'bg-yellow-900/30 border border-yellow-500'
                          : event.eventType === 'RedCard'
                          ? 'bg-red-900/30 border border-red-500'
                          : 'bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400 font-semibold">
                              {Math.floor(event.tick / 60)}'
                            </span>
                            <span className="text-xs font-bold text-white">
                              {event.eventType}
                            </span>
                            {event.team && (
                              <span className="text-xs text-gray-400">
                                ({event.team})
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300">{event.description}</p>
                          {event.playerName && (
                            <p className="text-xs text-gray-500 mt-1">{event.playerName}</p>
                          )}
                        </div>
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

      {/* Speech Modal */}
      {showSpeechModal && (
        <SpeechModal
          onClose={() => setShowSpeechModal(false)}
          onSubmit={handleSpeechSubmit}
          speechesRemaining={matchState.speechesRemaining}
        />
      )}
    </div>
  );
}

interface SpeechModalProps {
  onClose: () => void;
  onSubmit: (message: string) => void;
  speechesRemaining: number;
}

function SpeechModal({ onClose, onSubmit, speechesRemaining }: SpeechModalProps) {
  const [message, setMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState<'Motivational' | 'Aggressive' | 'Calm'>('Motivational');

  const tones = [
    { value: 'Motivational', label: 'Motivational', emoji: '💪', desc: 'Inspire your team' },
    { value: 'Aggressive', label: 'Aggressive', emoji: '🔥', desc: 'Light a fire' },
    { value: 'Calm', label: 'Calm', emoji: '🧘', desc: 'Keep composure' },
  ] as const;

  const templates = {
    Motivational: [
      "This is our moment! Let's show them what we're made of!",
      "We've trained for this - now go out there and give it everything!",
      "Believe in yourselves! We can win this!",
    ],
    Aggressive: [
      "They think they can beat us? Show them they're wrong!",
      "No mercy! Press them harder!",
      "This is OUR pitch! Let's dominate!",
    ],
    Calm: [
      "Stay focused. Stick to the plan.",
      "Keep your composure. We're in control.",
      "Play smart. The goals will come.",
    ],
  };

  function handleSubmit() {
    if (message.trim()) {
      onSubmit(message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Give Team Speech</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">
            Speeches remaining: <span className="font-semibold text-white">{speechesRemaining}</span>
          </p>
          <p className="text-xs text-yellow-400">
            ⚠️ Warning: Speeches can backfire if your language proficiency is low!
          </p>
        </div>

        {/* Tone Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Speech Tone</label>
          <div className="grid grid-cols-3 gap-2">
            {tones.map((tone) => (
              <button
                key={tone.value}
                onClick={() => setSelectedTone(tone.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedTone === tone.value
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{tone.emoji}</div>
                <div className="text-sm font-semibold text-white">{tone.label}</div>
                <div className="text-xs text-gray-400">{tone.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Quick Templates</label>
          <div className="space-y-1">
            {templates[selectedTone].map((template, idx) => (
              <button
                key={idx}
                onClick={() => setMessage(template)}
                className="w-full text-left px-3 py-2 bg-gray-900/50 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors"
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Message */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Custom Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your own speech..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            rows={4}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">{message.length}/200 characters</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!message.trim()}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              message.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Give Speech
          </button>
        </div>
      </div>
    </div>
  );
}
