'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ActiveProposal {
  epoch: number;
  id: string;
  title: string;
  status: number;
}

export default function Home() {
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [activeProposals, setActiveProposals] = useState<ActiveProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/epoches')
      .then(res => res.json())
      .then(data => {
        if (data.epochs && data.epochs.length > 0) {
          const epoch = data.epochs[0].epoch;
          setCurrentEpoch(epoch);
          
          fetch(`/api/proposals/${epoch}`)
            .then(res => res.json())
            .then(data => {
              const active = (data.proposals || []).filter((p: any) => p.status === 2);
              setActiveProposals(active.slice(0, 5));
              setLoading(false);
            })
            .catch(console.error);
        } else {
          setLoading(false);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#101820' }}>
      <header className="border backdrop-blur-sm sticky top-0 z-10 w-full" style={{ backgroundColor: '#151e27', borderColor: '#202e3c' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/Qubic-Logo-White.svg" alt="Qubic" className="h-10" style={{ width: 'auto' }} />
              <span className="text-3xl font-light font-governance" style={{ color: '#23ffff' }}>governance</span>
            </Link>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Qubic Proposal Translations</p>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-8">
          <div className="flex-1 min-w-[250px]">
            <div className="rounded-xl p-6" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#23ffff' }}>Info</h2>
              <div style={{ color: '#94a3b8' }}>
                <p className="mb-4">Coming soon...</p>
              </div>
            </div>
          </div>

          <div className="flex-[3] min-w-[300px]">
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c', minHeight: '400px' }}>
              <h1 className="text-4xl font-bold mb-4" style={{ color: '#ffffff' }}>Welcome to QGov</h1>
              <p className="text-lg mb-6" style={{ color: '#94a3b8' }}>
                Explore and translate Qubic proposals
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/proposals"
                  className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{ backgroundColor: '#23ffff', color: '#0f172a' }}
                >
                  View All Proposals
                </a>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[250px]">
            <div className="rounded-xl p-6" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#23ffff' }}>Active Proposals</h2>
              
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#23ffff' }}></div>
                </div>
              ) : activeProposals.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No active proposals</p>
              ) : (
                <div className="space-y-3">
                  {activeProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: '#1a2332', border: '1px solid #202e3c' }}
                    >
                      <p className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>
                        {proposal.title || 'Untitled'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                        Epoch {proposal.epoch}
                      </p>
                    </div>
                  ))}
                  
                  <a
                    href={`/proposals?epoch=${currentEpoch}`}
                    className="block text-center text-sm mt-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: '#23ffff', color: '#0f172a' }}
                  >
                    History →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
