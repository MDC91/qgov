'use client';

import { useState, useEffect, useCallback } from 'react';
import { Proposal } from '@/types';
import EpochSelector from '@/components/EpochSelector';
import ProposalCard from '@/components/ProposalCard';

interface SearchResult {
  epoch: number;
  id: string;
  title: string;
  url: string;
  status: number;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
}

export default function Home() {
  const [epochs, setEpochs] = useState<{ epoch: number; proposalCount: number; hasActive: boolean }[]>([]);
  const [selectedEpoch, setSelectedEpoch] = useState<number | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<number | ''>('');

  const handleSearch = useCallback(async (query: string, status: number | '') => {
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setIsSearching(true);

    try {
      const params = new URLSearchParams({ q: query });
      if (status !== '') {
        params.set('status', status.toString());
      }

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery, statusFilter);
      } else {
        setIsSearching(false);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, statusFilter, handleSearch]);

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
    if (!selectedEpoch || isSearching) return;

    setLoading(true);
    fetch(`/api/proposals/${selectedEpoch}`)
      .then(res => res.json())
      .then(data => {
        setProposals(data.proposals || []);
        setLoading(false);
      })
      .catch(console.error);
  }, [selectedEpoch, isSearching]);

  const getStatusLabel = (status: number) => {
    const labels: Record<number, string> = {
      2: 'Active',
      3: 'Accepted',
      4: 'Rejected',
      5: 'Expired',
      6: 'Rejected'
    };
    return labels[status] || `Status ${status}`;
  };

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
        <div className="mb-6 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <input
                type="text"
                placeholder="Search proposals across all epochs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#1a2332', 
                  borderColor: '#2d3748',
                  color: '#e2e8f0'
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="px-4 py-3 rounded-lg border focus:outline-none"
              style={{ 
                backgroundColor: '#1a2332', 
                borderColor: '#2d3748',
                color: '#e2e8f0'
              }}
            >
              <option value="">All Status</option>
              <option value="2">Active</option>
              <option value="3">Accepted</option>
              <option value="4">Rejected</option>
              <option value="5">Expired</option>
              <option value="6">Rejected</option>
            </select>
          </div>

          {isSearching && (
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="text-sm hover:underline"
              style={{ color: '#23ffff' }}
            >
              ← Back to epoch view
            </button>
          )}
        </div>

        {isSearching ? (
          searchLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#23ffff' }}></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-20" style={{ color: '#94a3b8' }}>
              No proposals found for "{searchQuery}"
            </div>
          ) : (
            <div>
              <p className="mb-4 text-sm" style={{ color: '#94a3b8' }}>
                Found {searchResults.length} proposal(s) for "{searchQuery}"
              </p>
              <div className="grid gap-4">
                {searchResults.map((result) => (
                  <a
                    key={`${result.epoch}-${result.id}`}
                    href={`/proposal/${result.epoch}/${encodeURIComponent(result.id)}`}
                    className="block p-4 rounded-lg border transition-colors hover:border-opacity-80"
                    style={{ 
                      backgroundColor: '#1a2332', 
                      borderColor: '#2d3748' 
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium px-2 py-1 rounded" style={{ backgroundColor: '#23ffff', color: '#0f172a' }}>
                        Epoch {result.epoch}
                      </span>
                      <span className="text-sm px-2 py-1 rounded" style={{ 
                        backgroundColor: result.status === 3 ? '#22c55e' : result.status === 6 ? '#ef4444' : '#64748b',
                        color: '#ffffff'
                      }}>
                        {getStatusLabel(result.status)}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium mb-1" style={{ color: '#e2e8f0' }}>{result.title}</h3>
                    <p className="text-sm truncate mb-2" style={{ color: '#94a3b8' }}>{result.url}</p>
                    <div className="flex gap-4 text-sm" style={{ color: '#94a3b8' }}>
                      <span>Yes: {result.yesVotes}</span>
                      <span>No: {result.noVotes}</span>
                      <span>Total: {result.totalVotes}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  );
}
