'use client';

import Link from 'next/link';
import { Proposal, PROPOSAL_STATUS } from '@/types';

interface ProposalCardProps {
  proposal: Proposal;
}

const statusColors: Record<string, string> = {
  Active: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  'Quorum not reached': 'bg-yellow-600/20 text-yellow-500 border-yellow-600/30'
};

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const status = PROPOSAL_STATUS[proposal.status as keyof typeof PROPOSAL_STATUS] || 'unknown';
  const statusClass = statusColors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';

  const translationCount = Object.keys(proposal.translations || {}).length;
  
  const totalVotes = proposal.totalVotes || (proposal.yesVotes + proposal.noVotes);
  const approvalRate = totalVotes > 0 ? (proposal.yesVotes / totalVotes * 100) : 0;
  const rejectionRate = totalVotes > 0 ? (proposal.noVotes / totalVotes * 100) : 0;
  
  const displayRate = status === 'Approved' ? approvalRate : status === 'Rejected' ? rejectionRate : approvalRate;
  const rateLabel = status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Approval';

  return (
    <Link
      href={`/proposal/${proposal.epoch}/${encodeURIComponent(proposal.id)}`}
      className="block rounded-xl p-5 transition-all group"
      style={{ 
        backgroundColor: '#151e27', 
        border: '1px solid #202e3c' 
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#202e3c';
        e.currentTarget.style.borderColor = '#23ffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#151e27';
        e.currentTarget.style.borderColor = '#202e3c';
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate transition-colors hover:text-cyan-400" style={{ color: '#ffffff' }}>
            {proposal.title}
          </h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
          {status}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4" style={{ borderColor: '#202e3c', borderTopWidth: '1px', borderStyle: 'solid' }}>
        <div className="flex items-center gap-6">
          <div className="text-center" style={{ minWidth: '60px' }}>
            <span className="text-xs block" style={{ color: '#94a3b8' }}>Yes</span>
            <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
              {proposal.yesVotes.toLocaleString()}
            </p>
          </div>
          <div className="text-center" style={{ minWidth: '60px' }}>
            <span className="text-xs block" style={{ color: '#94a3b8' }}>No</span>
            <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
              {proposal.noVotes.toLocaleString()}
            </p>
          </div>
          <div className="text-center" style={{ minWidth: '60px' }}>
            <span className="text-xs block" style={{ color: '#94a3b8' }}>{rateLabel}</span>
            <p className="text-sm font-medium" style={{ color: '#ffffff' }}>
              {displayRate.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="text-xs" style={{ color: '#94a3b8' }}>
          {translationCount > 0 && (
            <span style={{ color: '#23ffff' }}>{translationCount} translations</span>
          )}
        </div>
      </div>
    </Link>
  );
}
