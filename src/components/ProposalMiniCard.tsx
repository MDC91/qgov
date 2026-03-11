'use client';

interface ProposalMiniCardProps {
  proposal: {
    id: string;
    title: string;
    status: number;
    yesVotes: number;
    noVotes: number;
    totalVotes: number;
    ballots: { computorId: string; vote: number }[];
  };
  computors: string[];
  isActive?: boolean;
  onClick?: () => void;
}

export default function ProposalMiniCard({ proposal, computors, isActive, onClick }: ProposalMiniCardProps) {
  const totalComputors = 676;
  const quorum = 451;
  const quorumProgress = (proposal.totalVotes / totalComputors) * 100;
  
  const hasQuorum = proposal.totalVotes >= quorum;
  const isLeadingYes = proposal.yesVotes > proposal.noVotes;
  
  const quorumColor = !hasQuorum 
    ? '#f59e0b' 
    : isLeadingYes 
      ? '#22c55e' 
      : '#ef4444';

  const arcRadius = 45;
  const strokeWidth = 38;
  const circumference = Math.PI * arcRadius;
  const progressOffset = circumference - (quorumProgress / 100) * circumference;

  const quorumAngle = (quorum / totalComputors) * Math.PI;
  const markerInnerX = 70 - (arcRadius - strokeWidth/2 - 2) * Math.cos(quorumAngle);
  const markerInnerY = 70 - (arcRadius - strokeWidth/2 - 2) * Math.sin(quorumAngle);
  const markerOuterX = 70 - (arcRadius + strokeWidth/2 + 2) * Math.cos(quorumAngle);
  const markerOuterY = 70 - (arcRadius + strokeWidth/2 + 2) * Math.sin(quorumAngle);

  return (
    <div 
      onClick={onClick}
      className="flex-1 p-3 rounded-lg cursor-pointer transition-all min-h-[180px] flex flex-col"
      style={{ 
        backgroundColor: '#1a2332', 
        border: '1px solid #202e3c' 
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#202e3c';
        e.currentTarget.style.borderColor = '#23ffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#1a2332';
        e.currentTarget.style.borderColor = isActive ? '#23ffff' : '#202e3c';
      }}
    >
      <p 
        className="text-sm font-semibold text-center mb-2" 
        style={{ color: '#ffffff' }}
      >
        {proposal.title || 'Untitled Proposal'}
      </p>
      
      <div className="flex-1 flex items-center justify-center">
        <svg width="140" height="80" viewBox="0 0 140 80" className="overflow-visible">
          <path
            d="M 25 70 A 45 45 0 0 1 115 70"
            fill="none"
            stroke="#2d3748"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          <path
            d="M 25 70 A 45 45 0 0 1 115 70"
            fill="none"
            stroke={quorumColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          
          <line
            x1={markerInnerX}
            y1={markerInnerY}
            x2={markerOuterX}
            y2={markerOuterY}
            stroke="#ffffff"
            strokeWidth="2"
            style={{ opacity: 0.8 }}
          />
          
          <text
            x="70"
            y="68"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="14"
            fontWeight="bold"
          >
            {Math.round(quorumProgress)}%
          </text>
        </svg>
      </div>
      
      <div className="text-center">
        <span className="text-xs" style={{ color: '#94a3b8' }}>
          {proposal.totalVotes}/{quorum}
        </span>
      </div>
    </div>
  );
}
