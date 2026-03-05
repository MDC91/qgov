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
        No computors data available for epoch {epoch}
      </div>
    );
  }

  const { computors, ballots, proposal, quorumReached } = data;
  const totalComputors = computors.length;
  const votedComputorIds = new Set(ballots.map(b => b.computorId));
  const yesVotes = ballots.filter(b => b.vote === 1).length;
  const noVotes = ballots.filter(b => b.vote === 0).length;
  const quorum = 451;
  const quorumProgress = Math.min((ballots.length / quorum) * 100, 100);

  const rows = 26;
  const seatsPerRow = [6, 10, 14, 18, 22, 24, 26, 28, 30, 32, 34, 36, 38, 38, 38, 36, 34, 32, 30, 28, 26, 24, 22, 18, 14, 10];
  
  const totalSeats = seatsPerRow.reduce((a, b) => a + b, 0);

  let seatIndex = 0;
  const seatRows: { left: number; right: number }[] = [];
  
  for (let i = 0; i < rows; i++) {
    const seatsInRow = seatsPerRow[i] || 26;
    const centerOffset = Math.floor((26 - seatsInRow) / 2);
    
    const leftSeats: number[] = [];
    const rightSeats: number[] = [];
    
    for (let j = 0; j < seatsInRow; j++) {
      const globalIndex = seatIndex + j;
      const computorId = computors[globalIndex];
      const hasVoted = votedComputorIds.has(computorId);
      const votedYes = ballots.find(b => b.computorId === computorId)?.vote === 1;
      const votedNo = ballots.find(b => b.computorId === computorId)?.vote === 0;
      
      if (j < Math.ceil(seatsInRow / 2)) {
        leftSeats.push(votedYes ? 1 : votedNo ? 0 : -1);
      } else {
        rightSeats.push(votedYes ? 1 : votedNo ? 0 : -1);
      }
    }
    
    seatIndex += seatsInRow;
  }

  const renderSeats = () => {
    const elements: ReactNode[] = [];
    const maxWidth = 600;
    const rowHeight = 16;
    const seatSize = 10;
    
    for (let row = 0; row < Math.min(rows, 26); row++) {
      const seatsInRow = seatsPerRow[row] || 26;
      const rowWidth = seatsInRow * (seatSize + 2);
      const offsetX = (maxWidth - rowWidth) / 2;
      const y = row * rowHeight + 20;
      
      for (let col = 0; col < seatsInRow; col++) {
        const globalIndex = seatsPerRow.slice(0, row).reduce((a, b) => a + b, 0) + col;
        const computorId = computors[globalIndex];
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
        
        const x = offsetX + col * (seatSize + 2);
        
        elements.push(
          <div
            key={`${row}-${col}`}
            className="absolute rounded-full transition-all"
            style={{
              left: x,
              top: y,
              width: seatSize,
              height: seatSize,
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
            }}
            title={computorId ? `Computor: ${computorId.slice(0, 8)}...` : ''}
          />
        );
      }
    }
    
    return elements;
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
            Quorum Progress
          </span>
          <span className="text-sm font-medium" style={{ color: quorumReached ? '#22c55e' : '#f59e0b' }}>
            {ballots.length} / {quorum}
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

      {proposal && (
        <h3 className="text-xl font-semibold text-center mb-4" style={{ color: '#ffffff' }}>
          {proposal.title || 'Untitled Proposal'}
        </h3>
      )}

      <div className="relative" style={{ height: 450, width: '100%', maxWidth: 700, margin: '0 auto' }}>
        {renderSeats()}
      </div>

      <div className="flex justify-center gap-8 mt-6">
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
          <span className="text-sm" style={{ color: '#94a3b8' }}>Not Voted: {totalComputors - ballots.length}</span>
        </div>
      </div>
    </div>
  );
}
