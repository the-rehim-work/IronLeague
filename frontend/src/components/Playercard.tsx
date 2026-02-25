import { positionColor, ovrColor, formatCurrency, conditionColor } from '@/lib/utils';

interface PlayerCardProps {
  player: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    primaryPosition?: string;
    overall: number;
    age: number;
    marketValue: number;
    morale: number;
    fitness: number;
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physical?: number;
  };
  onClick?: () => void;
  compact?: boolean;
}

export default function PlayerCard({ player, onClick, compact = false }: PlayerCardProps) {
  const name = player.fullName || `${player.firstName} ${player.lastName}`;
  const position = player.position || player.primaryPosition || 'N/A';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-800 ${onClick ? 'cursor-pointer hover:border-sky-500/30 transition-colors' : ''}`}
      >
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${positionColor(position)}`}>{position}</span>
        <span className="text-white font-medium text-sm flex-1 truncate">{name}</span>
        <span className={`font-bold text-sm ${ovrColor(player.overall)}`}>{player.overall}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`card p-4 ${onClick ? 'cursor-pointer hover:border-zinc-700 transition-colors' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${positionColor(position)}`}>{position}</span>
        <span className={`text-2xl font-bold ${ovrColor(player.overall)}`}>{player.overall}</span>
      </div>

      <h3 className="text-sm font-bold text-white mb-1">{name}</h3>
      <p className="text-xs text-zinc-500 mb-3">Age: {player.age} · {formatCurrency(player.marketValue)}</p>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="flex justify-between">
          <span className="text-zinc-500">Morale</span>
          <span className={conditionColor(player.morale)}>{player.morale}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Fitness</span>
          <span className={conditionColor(player.fitness)}>{player.fitness}</span>
        </div>
      </div>

      {player.pace !== undefined && (
        <div className="grid grid-cols-3 gap-1 text-xs">
          {[
            { k: 'PAC', v: player.pace },
            { k: 'SHO', v: player.shooting },
            { k: 'PAS', v: player.passing },
            { k: 'DRI', v: player.dribbling },
            { k: 'DEF', v: player.defending },
            { k: 'PHY', v: player.physical },
          ].map((s) => (
            <div key={s.k} className="text-center p-1 bg-zinc-900/50 rounded">
              <div className="text-zinc-600 text-[9px]">{s.k}</div>
              <div className="text-white font-bold">{s.v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}