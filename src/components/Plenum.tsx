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
  const voteByComputor = new Map(ballots.map(b => [b.computorId, b.vote]));
  const yesVotes = ballots.filter(b => b.vote === 1).length;
  const noVotes = ballots.filter(b => b.vote === 0).length;
  const quorum = 451;
  const quorumProgress = Math.min((ballots.length / quorum) * 100, 100);

  const containerWidth = 1120;
  const maxRadius = 420;
  const innerRadius = 170;
  const seatSize = 12;
  const topPadding = 4;
  const centerX = containerWidth / 2;
  const centerY = maxRadius + topPadding;
  const containerHeight = Math.ceil(centerY + seatSize / 2 + 2);
  const maxRows = 20;
  const minSeatsPerRow = 8;
  const estimatedRows = Math.floor(computors.length / minSeatsPerRow);
  const numRows = Math.max(1, Math.min(maxRows, estimatedRows > 0 ? estimatedRows : 1));
  const rowHeight = numRows > 1 ? (maxRadius - innerRadius) / (numRows - 1) : 0;
  
  const renderHemisphere = (): ReactNode[] => {
    const elements: ReactNode[] = [];
    const totalSeats = computors.length;
    const radii = Array.from({ length: numRows }, (_, row) => maxRadius - (row * rowHeight));
    const seatsPerRow = Array.from({ length: numRows }, () => minSeatsPerRow);

    const baseSeatTotal = seatsPerRow.reduce((sum, seats) => sum + seats, 0);
    const remainingSeats = Math.max(0, totalSeats - baseSeatTotal);
    const distributionPower = 0.82;
    const rowWeights = radii.map((radius) => Math.pow(radius, distributionPower));
    const weightTotal = rowWeights.reduce((sum, weight) => sum + weight, 0);

    if (remainingSeats > 0 && weightTotal > 0) {
      let distributed = 0;
      const fractions: { row: number; fraction: number }[] = [];

      for (let row = 0; row < numRows; row++) {
        const exactExtra = (rowWeights[row] / weightTotal) * remainingSeats;
        const extra = Math.floor(exactExtra);
        seatsPerRow[row] += extra;
        distributed += extra;
        fractions.push({ row, fraction: exactExtra - extra });
      }

      let leftovers = remainingSeats - distributed;
      fractions.sort((a, b) => b.fraction - a.fraction);

      let pointer = 0;
      while (leftovers > 0 && fractions.length > 0) {
        seatsPerRow[fractions[pointer % fractions.length].row] += 1;
        pointer++;
        leftovers--;
      }
    }

    let assignedSeats = seatsPerRow.reduce((sum, seats) => sum + seats, 0);
    if (assignedSeats > totalSeats) {
      for (let row = numRows - 1; row >= 0 && assignedSeats > totalSeats; row--) {
        while (seatsPerRow[row] > 1 && assignedSeats > totalSeats) {
          seatsPerRow[row] -= 1;
          assignedSeats--;
        }
      }
    }

    let seatIndex = 0;

    for (let row = 0; row < numRows; row++) {
      if (seatIndex >= totalSeats) break;
      
      const radius = radii[row];
      const seatsInRow = seatsPerRow[row];
      
      if (seatsInRow <= 0) continue;

      for (let seat = 0; seat < seatsInRow; seat++) {
        if (seatIndex >= totalSeats) break;

        const computorId = computors[seatIndex];
        const vote = voteByComputor.get(computorId);
        const hasVoted = vote !== undefined;
        const votedYes = vote === 1;
        const votedNo = vote === 0;

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

        const angle = seatsInRow > 1 ? Math.PI * (seat / (seatsInRow - 1)) : Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY - radius * Math.sin(angle);

        elements.push(
          <div
            key={`seat-${seatIndex}`}
            className="absolute rounded-full transition-all"
            style={{
              left: `${(x / containerWidth) * 100}%`,
              top: `${(y / containerHeight) * 100}%`,
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
      <div className="flex items-center mb-3">
        <div className="w-64 shrink-0">
          <span className="inline-block px-4 py-2 rounded text-base font-medium" style={{ backgroundColor: '#23ffff', color: '#0f172a' }}>
            Current Epoch: {epoch}
          </span>
        </div>
        <div className="flex-1 text-center">
          {proposal && (
            <h2 className="text-3xl font-bold leading-tight" style={{ color: '#ffffff' }}>
              {proposal.title || 'Untitled Proposal'}
            </h2>
          )}
        </div>
        <div className="w-64 shrink-0"></div>
      </div>

      <div className="flex items-start gap-4 mb-2">
        <div className="w-56">
          <div className="flex items-center justify-between mb-1">
            <span className="text-base font-medium" style={{ color: '#94a3b8' }}>
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
        style={{ height: containerHeight, width: '100%', maxWidth: containerWidth }}
      >
        {renderHemisphere()}
      </div>

      <div className="flex justify-center gap-6 mt-1">
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
