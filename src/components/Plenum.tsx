'use client';

import { useState, useEffect, ReactNode } from 'react';

interface PlenumData {
  computors: string[];
  ballots: { computorId: string; vote: number }[];
  proposal: {
    id: string;
    title: string;
    status: number;
    yesVotes: number;
    noVotes: number;
    totalVotes: number;
  } | null;
  quorumReached: boolean;
}

interface PlenumProps {
  epoch: number;
}

export default function Plenum({ epoch }: PlenumProps) {
  const [data, setData] = useState<PlenumData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/plenum/${epoch}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [epoch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#23ffff' }}></div>
      </div>
    );
  }

  if (!data || !data.computors || data.computors.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: '#94a3b8' }}>
        No voting data available for epoch {epoch}
      </div>
    );
  }

  const { computors, ballots, proposal, quorumReached } = data;
  const votedComputorIds = new Set(ballots.map(b => b.computorId));
  const yesVotes = ballots.filter(b => b.vote === 1).length;
  const noVotes = ballots.filter(b => b.vote === 0).length;
  const quorum = 451;
  const quorumProgress = Math.min((ballots.length / quorum) * 100, 100);

  const containerWidth = 900;
  const containerHeight = 450;
  const centerX = containerWidth / 2;
  const centerY = 340;
  const maxRadius = 340;
  const innerRadius = 22;
  const rowHeight = (maxRadius - innerRadius) / 19;
  const seatSize = 11;
  
  const renderHemisphere = (): ReactNode[] => {
    const elements: ReactNode[] = [];
    const totalSeats = computors.length;
    const numRows = Math.min(20, Math.ceil(totalSeats / 4));
    let seatIndex = 0;

    for (let row = 0; row < numRows; row++) {
      if (seatIndex >= totalSeats) break;
      
      const radius = maxRadius - (row * rowHeight);
      const circumference = Math.PI * radius;
      const seatsInRow = Math.max(4, Math.floor(circumference / (seatSize + 1.5)));
      const actualSeatsInRow = Math.min(seatsInRow, totalSeats - seatIndex);
      
      if (actualSeatsInRow <= 0) break;

      for (let seat = 0; seat < actualSeatsInRow; seat++) {
        if (seatIndex >= totalSeats) break;

        const computorId = computors[seatIndex];
        const hasVoted = votedComputorIds.has(computorId);
        const votedYes = ballots.find(b => b.computorId === computorId)?.vote === 1;
        const votedNo = ballots.find(b => b.computorId === computorId)?.vote === 0;

        let bgColor = '#1a2332';
        let borderColor = '#2d3748';
        
        if (hasVoted) {
          if (votedYes) {
            bgColor = '#22c55e';
            borderColor = '#22c55e';
          } else if (votedNo) {
            bgColor = '#ef4444';
            borderColor = '#ef4444';
          }
        }

        const angle = Math.PI * (seat / (actualSeatsInRow - 1 || 1));
        const x = centerX + radius * Math.cos(angle);
        const y = centerY - radius * Math.sin(angle);

        elements.push(
          <div
            key={`seat-${seatIndex}`}
            className="absolute rounded-full transition-all"
            style={{
              left: x,
              top: y,
              width: seatSize,
              height: seatSize,
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
              transform: 'translate(-50%, -50%)',
            }}
            title={computorId ? `Computor: ${computorId.slice(0, 12)}...` : ''}
          />
        );
        
        seatIndex++;
      }
    }
    
    return elements;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="px-4 py-2 rounded text-base font-medium" style={{ backgroundColor: '#23ffff', color: '#0f172a' }}>
          Current Epoch: {epoch}
        </span>
        {proposal && (
          <h2 className="text-3xl font-bold text-center" style={{ color: '#ffffff' }}>
            {proposal.title || 'Untitled Proposal'}
          </h2>
        )}
        <div className="w-28"></div>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-56">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
              Quorum
            </span>
            <span className="text-sm font-medium" style={{ color: quorumReached ? '#22c55e' : '#f59e0b' }}>
              {ballots.length}/{quorum}
            </span>
          </div>
          <div 
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: '#1a2332' }}
          >
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${quorumProgress}%`,
                backgroundColor: quorumReached ? '#22c55e' : '#f59e0b'
              }}
            />
          </div>
        </div>
      </div>

      <div 
        className="relative mx-auto"
        style={{ height: containerHeight, maxWidth: containerWidth }}
      >
        {renderHemisphere()}
      </div>

      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22c55e', border: '1px solid #22c55e' }}></div>
          <span className="text-sm" style={{ color: '#94a3b8' }}>Yes: {yesVotes}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444', border: '1px solid #ef4444' }}></div>
          <span className="text-sm" style={{ color: '#94a3b8' }}>No: {noVotes}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#1a2332', border: '1px solid #2d3748' }}></div>
          <span className="text-sm" style={{ color: '#94a3b8' }}>Not Voted: {computors.length - ballots.length}</span>
        </div>
      </div>
    </div>
  );
}
