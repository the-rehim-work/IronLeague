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

export default function MatchPitch({
  ballX,
  ballY,
  homeScore,
  awayScore,
  minute,
  homeTeamName,
  awayTeamName,
  homeColor,
  awayColor,
}: MatchPitchProps) {
  const adjustedBallY = ballY * 0.75;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-t-lg p-4 flex items-center justify-between border-b-2 border-green-600">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: homeColor }}></div>
          <span className="text-white font-bold text-xl">{homeTeamName}</span>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-white">
            {homeScore} - {awayScore}
          </div>
          <div className="text-sm text-gray-400">{minute}'</div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white font-bold text-xl">{awayTeamName}</span>
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: awayColor }}></div>
        </div>
      </div>

      <svg
        viewBox="0 0 100 75"
        className="w-full bg-green-700 rounded-b-lg border-4 border-gray-800"
        style={{ aspectRatio: '4/3' }}
      >
        <defs>
          <pattern id="grass" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#16a34a" />
            <rect width="10" height="5" fill="#15803d" />
          </pattern>
        </defs>
        <rect width="100" height="75" fill="url(#grass)" />

        <rect x="1" y="1" width="98" height="73" fill="none" stroke="white" strokeWidth="0.3" />
        <line x1="50" y1="1" x2="50" y2="74" stroke="white" strokeWidth="0.3" />
        <circle cx="50" cy="37.5" r="9" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="50" cy="37.5" r="0.5" fill="white" />

        <rect x="1" y="22.5" width="16" height="30" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="83" y="22.5" width="16" height="30" fill="none" stroke="white" strokeWidth="0.3" />

        <rect x="1" y="30" width="6" height="15" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="93" y="30" width="6" height="15" fill="none" stroke="white" strokeWidth="0.3" />

        <circle cx="11" cy="37.5" r="0.5" fill="white" />
        <circle cx="89" cy="37.5" r="0.5" fill="white" />

        <rect x="0" y="33" width="1" height="9" fill="white" opacity="0.5" />
        <rect x="99" y="33" width="1" height="9" fill="white" opacity="0.5" />

        <circle
          cx={ballX}
          cy={adjustedBallY}
          r="1.2"
          fill="white"
          stroke="#000"
          strokeWidth="0.2"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
        >
          <animate
            attributeName="r"
            values="1.2;1.4;1.2"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </circle>

        <ellipse
          cx={ballX}
          cy={adjustedBallY + 0.3}
          rx="1"
          ry="0.4"
          fill="rgba(0,0,0,0.3)"
        />
      </svg>
    </div>
  );
}