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

  return (
    <div 
      onClick={onClick}
      className={`w-44 p-3 rounded-lg cursor-pointer transition-all hover:opacity-80 ${isActive ? 'border-2' : ''}`}
      style={{ 
        backgroundColor: '#1a2332', 
        borderColor: isActive ? '#23ffff' : 'transparent' 
      }}
    >
      <p 
        className="text-xs font-medium line-clamp-2" 
        style={{ color: '#ffffff' }}
      >
        {proposal.title || 'Untitled Proposal'}
      </p>
      
      <div className="mt-2">
        <div 
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: '#151e27' }}
        >
          <div 
            className="h-full transition-all duration-500"
            style={{ 
              width: `${quorumProgress}%`,
              backgroundColor: quorumColor
            }}
          />
        </div>
      </div>
    </div>
  );
}
