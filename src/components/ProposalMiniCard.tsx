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
  const quorumProgress = Math.min((proposal.totalVotes / totalComputors) * 100, 100);
  const quorumMarkerPercent = (quorum / totalComputors) * 100;
  
  const hasQuorum = proposal.totalVotes >= quorum;
  const isLeadingYes = proposal.yesVotes > proposal.noVotes;
  
  const quorumColor = !hasQuorum 
    ? '#f59e0b' 
    : isLeadingYes 
      ? '#22c55e' 
      : '#ef4444';

  const circumference = Math.PI * 50;
  const strokeDashoffset = circumference - (quorumProgress / 100) * circumference;
  const markerDashoffset = circumference - (quorumMarkerPercent / 100) * circumference;

  return (
    <div 
      onClick={onClick}
      className="flex-1 p-3 rounded-lg cursor-pointer transition-all min-h-[150px] flex flex-col"
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
        className="text-sm font-semibold text-center mb-3" 
        style={{ color: '#ffffff' }}
      >
        {proposal.title || 'Untitled Proposal'}
      </p>
      
      <div className="flex-1 flex items-center justify-center">
        <svg width="140" height="80" viewBox="0 0 140 80" className="overflow-visible">
          <path
            d="M 15 70 A 55 55 0 0 1 125 70"
            fill="none"
            stroke="#2d3748"
            strokeWidth="14"
            strokeLinecap="round"
          />
          
          <path
            d="M 15 70 A 55 55 0 0 1 125 70"
            fill="none"
            stroke={quorumColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          
          <path
            d="M 15 70 A 55 55 0 0 1 125 70"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeDashoffset={markerDashoffset}
            style={{ opacity: 0.8 }}
          />
          
          <text
            x="70"
            y="65"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="14"
            fontWeight="bold"
          >
            {Math.round(quorumProgress)}%
          </text>
        </svg>
      </div>
      
      <div className="text-center mt-1">
        <span className="text-xs" style={{ color: '#94a3b8' }}>
          {proposal.totalVotes}/{quorum}
        </span>
      </div>
    </div>
  );
}
