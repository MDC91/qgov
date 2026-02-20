'use client';

import { useState, useEffect } from 'react';
import { Proposal } from '@/types';
import EpochSelector from '@/components/EpochSelector';
import ProposalCard from '@/components/ProposalCard';

export default function Home() {
  const [epochs, setEpochs] = useState<{ epoch: number; proposalCount: number; hasActive: boolean }[]>([]);
  const [selectedEpoch, setSelectedEpoch] = useState<number | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/epoches')
      .then(res => res.json())
      .then(data => {
        if (data.epochs && data.epochs.length > 0) {
          setEpochs(data.epochs);
          setSelectedEpoch(data.epochs[0].epoch);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedEpoch) return;

    setLoading(true);
    fetch(`/api/proposals/${selectedEpoch}`)
      .then(res => res.json())
      .then(data => {
        setProposals(data.proposals || []);
        setLoading(false);
      })
      .catch(console.error);
  }, [selectedEpoch]);

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#101820' }}>
      <header className="border backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: '#151e27', borderColor: '#202e3c' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/Qubic-Logo-White.svg" alt="Qubic" className="h-10" style={{ width: 'auto' }} />
              <span className="text-3xl font-light font-governance" style={{ color: '#23ffff' }}>governance</span>
            </div>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Qubic Proposal Translations</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <EpochSelector
            epochs={epochs}
            selectedEpoch={selectedEpoch || 0}
            onSelect={setSelectedEpoch}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#23ffff' }}></div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#94a3b8' }}>
            No proposals found for this epoch
          </div>
        ) : (
          <div className="grid gap-4">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
