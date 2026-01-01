import { getPositionColor, getOverallColor, formatCurrency, getMoraleColor } from '../lib/utils';

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
        className={`flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 ${
          onClick ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''
        }`}
      >
        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getPositionColor(position)}`}>
          {position}
        </span>
        <span className="text-white font-medium flex-1">{name}</span>
        <span className={`font-bold ${getOverallColor(player.overall)}`}>{player.overall}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`card p-4 ${onClick ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getPositionColor(position)}`}>
            {position}
          </span>
        </div>
        <span className={`text-2xl font-bold ${getOverallColor(player.overall)}`}>{player.overall}</span>
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
      <p className="text-sm text-gray-400 mb-3">Age: {player.age} • {formatCurrency(player.marketValue)}</p>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Morale</span>
          <span className={getMoraleColor(player.morale)}>{player.morale}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Fitness</span>
          <span className={getMoraleColor(player.fitness)}>{player.fitness}</span>
        </div>
      </div>

      {player.pace !== undefined && (
        <div className="grid grid-cols-3 gap-1 text-xs">
          <div className="text-center p-1 bg-gray-900/50 rounded">
            <div className="text-gray-500">PAC</div>
            <div className="text-white font-bold">{player.pace}</div>
          </div>
          <div className="text-center p-1 bg-gray-900/50 rounded">
            <div className="text-gray-500">SHO</div>
            <div className="text-white font-bold">{player.shooting}</div>
          </div>
          <div className="text-center p-1 bg-gray-900/50 rounded">
            <div className="text-gray-500">PAS</div>
            <div className="text-white font-bold">{player.passing}</div>
          </div>
          <div className="text-center p-1 bg-gray-900/50 rounded">
            <div className="text-gray-500">DRI</div>
            <div className="text-white font-bold">{player.dribbling}</div>
          </div>
          <div className="text-center p-1 bg-gray-900/50 rounded">
            <div className="text-gray-500">DEF</div>
            <div className="text-white font-bold">{player.defending}</div>
          </div>
          <div className="text-center p-1 bg-gray-900/50 rounded">
            <div className="text-gray-500">PHY</div>
            <div className="text-white font-bold">{player.physical}</div>
          </div>
        </div>
      )}
    </div>
  );
}