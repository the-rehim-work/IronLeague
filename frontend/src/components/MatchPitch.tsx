interface MatchPitchProps {
  ballX: number;
  ballY: number;
  homeScore: number;
  awayScore: number;
  minute: number;
  homeTeamName: string;
  awayTeamName: string;
  homeColor: string;
  awayColor: string;
}

export default function MatchPitch({ ballX, ballY, homeScore, awayScore, minute, homeTeamName, awayTeamName, homeColor, awayColor }: MatchPitchProps) {
  return (
    <div className="w-full">
      <div className="bg-zinc-800 rounded-t-lg p-4 flex items-center justify-between border-b-2 border-emerald-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: homeColor }} />
          <span className="text-white font-bold text-lg">{homeTeamName}</span>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{homeScore} - {awayScore}</div>
          <div className="text-xs text-zinc-400">{minute}'</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg">{awayTeamName}</span>
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: awayColor }} />
        </div>
      </div>

      <svg viewBox="0 0 100 65" className="w-full bg-emerald-700 rounded-b-lg border-4 border-zinc-800" style={{ aspectRatio: '100/65' }}>
        <defs>
          <pattern id="grass" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#16a34a" />
            <rect width="10" height="5" fill="#15803d" />
          </pattern>
        </defs>
        <rect width="100" height="65" fill="url(#grass)" />
        <rect x="1" y="1" width="98" height="63" fill="none" stroke="white" strokeWidth="0.3" />
        <line x1="50" y1="1" x2="50" y2="64" stroke="white" strokeWidth="0.3" />
        <circle cx="50" cy="32.5" r="9" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="50" cy="32.5" r="0.5" fill="white" />
        <rect x="1" y="17" width="16" height="31" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="83" y="17" width="16" height="31" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="1" y="24" width="6" height="17" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="93" y="24" width="6" height="17" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="0" y="28" width="1" height="9" fill="white" opacity="0.5" />
        <rect x="99" y="28" width="1" height="9" fill="white" opacity="0.5" />

        <circle cx={ballX} cy={ballY * 0.65} r="1.2" fill="white" stroke="#000" strokeWidth="0.2">
          <animate attributeName="r" values="1.2;1.4;1.2" dur="0.5s" repeatCount="indefinite" />
        </circle>
        <ellipse cx={ballX} cy={ballY * 0.65 + 0.3} rx="1" ry="0.4" fill="rgba(0,0,0,0.3)" />
      </svg>
    </div>
  );
}