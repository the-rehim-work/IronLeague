import { useState } from 'react';
import { X } from 'lucide-react';
import type { Player } from '@/types';

interface SpeechModalProps {
  players: Player[];
  onSubmit: (speech: { type: string; target: string; targetPlayerId?: string; tone: string }) => void;
  onClose: () => void;
  speechesRemaining: number;
}

const SPEECH_TYPES = ['Motivational', 'Tactical', 'Calm', 'Aggressive', 'Encouragement', 'Warning'];
const SPEECH_TONES = ['Calm', 'Passionate', 'Aggressive', 'Supportive', 'Critical'];

export default function SpeechModal({ players, onSubmit, onClose, speechesRemaining }: SpeechModalProps) {
  const [type, setType] = useState('Motivational');
  const [target, setTarget] = useState<'WholeTeam' | 'SinglePlayer'>('WholeTeam');
  const [targetPlayerId, setTargetPlayerId] = useState<string | undefined>(undefined);
  const [tone, setTone] = useState('Passionate');

  const handleSubmit = () => {
    onSubmit({
      type,
      target,
      targetPlayerId: target === 'SinglePlayer' ? targetPlayerId : undefined,
      tone,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Give Speech</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-sm text-zinc-400 mb-4">
          Speeches remaining: <span className="text-white font-bold">{speechesRemaining}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="label">Speech Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input">{SPEECH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </div>

          <div>
            <label className="label">Target</label>
            <div className="flex gap-2">
              <button onClick={() => setTarget('WholeTeam')} className={`flex-1 py-2 rounded text-sm font-medium cursor-pointer ${target === 'WholeTeam' ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Whole Team</button>
              <button onClick={() => setTarget('SinglePlayer')} className={`flex-1 py-2 rounded text-sm font-medium cursor-pointer ${target === 'SinglePlayer' ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Single Player</button>
            </div>
          </div>

          {target === 'SinglePlayer' && (
            <div>
              <label className="label">Select Player</label>
              <select value={targetPlayerId || ''} onChange={(e) => setTargetPlayerId(e.target.value)} className="input">
                <option value="">Select a player...</option>
                {players.map((p) => <option key={p.id} value={p.id}>{p.fullName} ({p.primaryPosition})</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="input">{SPEECH_TONES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={speechesRemaining <= 0 || (target === 'SinglePlayer' && !targetPlayerId)} className="flex-1 btn-primary">Give Speech</button>
        </div>
      </div>
    </div>
  );
}