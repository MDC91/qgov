'use client';

import { useMemo, ReactNode } from 'react';

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

  const voteByComputor = new Map(proposal.ballots.map((b) => [b.computorId, b.vote]));

  const miniHemisphere = useMemo(() => {
    const elements: ReactNode[] = [];
    const totalSeats = computors.length;
    const containerWidth = 100;
    const containerHeight = 60;
    const maxRadius = 28;
    const innerRadius = 10;
    const seatSize = 4;
    const centerX = containerWidth / 2;
    const centerY = maxRadius + 2;
    const numRows = 4;
    const rowHeight = numRows > 1 ? (maxRadius - innerRadius) / (numRows - 1) : 0;
    const seatsPerRow = [3, 5, 7, 9];

    let seatIndex = 0;
    for (let row = 0; row < numRows; row++) {
      const radius = maxRadius - (row * rowHeight);
      const seatsInRow = seatsPerRow[row] || 3;
      
      for (let seat = 0; seat < seatsInRow; seat++) {
        if (seatIndex >= totalSeats) break;

        const computorId = computors[seatIndex];
        const vote = voteByComputor.get(computorId);
        
        let bgColor = '#1a2332';
        if (vote === 1) bgColor = '#22c55e';
        else if (vote === 0) bgColor = '#ef4444';

        const angle = seatsInRow > 1 ? Math.PI * (seat / (seatsInRow - 1)) : Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY - radius * Math.sin(angle);

        elements.push(
          <div
            key={`mini-${row}-${seat}`}
            className="absolute rounded-full"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: seatSize,
              height: seatSize,
              backgroundColor: bgColor,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
        seatIndex++;
      }
    }
    return elements;
  }, [computors, proposal.ballots]);

  return (
    <div 
      onClick={onClick}
      className={`flex-1 p-3 rounded-lg cursor-pointer transition-all hover:opacity-80 min-h-[200px] ${isActive ? 'border-2' : ''}`}
      style={{ 
        backgroundColor: '#1a2332', 
        borderColor: isActive ? '#23ffff' : 'transparent' 
      }}
    >
      <p 
        className="text-xs font-medium line-clamp-2 mb-2" 
        style={{ color: '#ffffff' }}
      >
        {proposal.title || 'Untitled Proposal'}
      </p>
      
      <div className="relative mx-auto" style={{ width: 100, height: 60 }}>
        {miniHemisphere}
      </div>
      
      <div className="mt-2">
        <div 
          className="h-2 rounded-full overflow-hidden"
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
