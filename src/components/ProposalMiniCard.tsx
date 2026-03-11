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
  const quorum = 451;
  const quorumProgress = Math.min((proposal.totalVotes / quorum) * 100, 100);
  
  const hasQuorum = proposal.totalVotes >= quorum;
  const isLeadingYes = proposal.yesVotes > proposal.noVotes;
  
  const quorumColor = !hasQuorum 
    ? '#f59e0b' 
    : isLeadingYes 
      ? '#22c55e' 
      : '#ef4444';

  const circumference = Math.PI * 45;
  const strokeDashoffset = circumference - (quorumProgress / 100) * circumference;

  return (
    <div 
      onClick={onClick}
      className={`flex-1 p-3 rounded-lg cursor-pointer transition-all hover:opacity-80 min-h-[150px] flex flex-col ${isActive ? 'border-2' : ''}`}
      style={{ 
        backgroundColor: '#1a2332', 
        borderColor: isActive ? '#23ffff' : 'transparent' 
      }}
    >
      <p 
        className="text-sm font-semibold text-center mb-3" 
        style={{ color: '#ffffff' }}
      >
        {proposal.title || 'Untitled Proposal'}
      </p>
      
      <div className="flex-1 flex items-center justify-center">
        <svg width="120" height="70" viewBox="0 0 120 70" className="overflow-visible">
          <defs>
            <linearGradient id={`quorumGradient-${proposal.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={quorumColor} stopOpacity="0.3" />
              <stop offset="50%" stopColor={quorumColor} />
              <stop offset="100%" stopColor={quorumColor} stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#2d3748"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={quorumColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          
          <text
            x="60"
            y="55"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="bold"
          >
            {Math.round(quorumProgress)}%
          </text>
        </svg>
      </div>
      
      <div className="text-center mt-2">
        <span className="text-xs" style={{ color: '#94a3b8' }}>
          {proposal.totalVotes}/{quorum}
        </span>
      </div>
    </div>
  );
}
