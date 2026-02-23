'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Proposal } from '@/types';
import EpochSelector from '@/components/EpochSelector';
import ProposalCard from '@/components/ProposalCard';
import { createProposalSlug } from '@/lib/proposal';

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

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [epochs, setEpochs] = useState<{ epoch: number; proposalCount: number; hasActive: boolean }[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const epochParam = searchParams.get('epoch');
  const selectedEpoch = epochParam ? parseInt(epochParam, 10) : null;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [authorQuery, setAuthorQuery] = useState('');
  const [publisherQuery, setPublisherQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<number | ''>('');

  const setSelectedEpoch = useCallback((epoch: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('epoch', epoch.toString());
    router.push(`/?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    fetch('/api/epoches')
      .then(res => res.json())
      .then(data => {
        if (data.epochs && data.epochs.length > 0) {
          setEpochs(data.epochs);
          if (!selectedEpoch) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('epoch', data.epochs[0].epoch.toString());
            router.replace(`/?${params.toString()}`, { scroll: false });
          }
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

  const handleSearch = useCallback(async (query: string, author: string, publisher: string, status: number | '') => {
    if (!query.trim() && !author.trim() && !publisher.trim() && status === '') {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setIsSearching(true);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query);
      if (author.trim()) params.set('author', author);
      if (publisher.trim()) params.set('publisher', publisher);
      if (status !== '') params.set('status', status.toString());

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
      handleSearch(searchQuery, authorQuery, publisherQuery, statusFilter);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, authorQuery, publisherQuery, statusFilter, handleSearch]);

  const getStatusLabel = (status: number) => {
    const labels: Record<number, string> = {
      2: 'Active',
      3: 'Approved',
      4: 'Quorum not reached',
      5: 'Cancelled',
      6: 'Rejected'
    };
    return labels[status] || `Status ${status}`;
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#101820' }}>
      <header className="border backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: '#151e27', borderColor: '#202e3c' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src="/Qubic-Logo-White.svg" alt="Qubic" className="h-10" style={{ width: 'auto' }} />
              <span className="text-3xl font-light font-governance" style={{ color: '#23ffff' }}>governance</span>
            </a>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Qubic Proposal Translations</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{ backgroundColor: '#1a2332', borderColor: '#2d3748', color: '#e2e8f0' }}
            />
            <input
              type="text"
              placeholder="Author..."
              value={authorQuery}
              onChange={(e) => setAuthorQuery(e.target.value)}
              className="w-28 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{ backgroundColor: '#1a2332', borderColor: '#2d3748', color: '#e2e8f0' }}
            />
            <input
              type="text"
              placeholder="Publisher..."
              value={publisherQuery}
              onChange={(e) => setPublisherQuery(e.target.value)}
              className="w-48 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{ backgroundColor: '#1a2332', borderColor: '#2d3748', color: '#e2e8f0' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-lg border focus:outline-none"
              style={{ backgroundColor: '#1a2332', borderColor: '#2d3748', color: '#e2e8f0' }}
            >
              <option value="">All Status</option>
              <option value="2">Active</option>
              <option value="3">Approved</option>
              <option value="4">Quorum</option>
              <option value="5">Cancelled</option>
              <option value="6">Rejected</option>
            </select>
          </div>

          {isSearching && (
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
                setAuthorQuery('');
                setPublisherQuery('');
                setStatusFilter('');
                setSearchResults([]);
              }}
              className="text-sm hover:underline mt-2"
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
              No proposals found
            </div>
          ) : (
            <div>
              <p className="mb-4 text-sm" style={{ color: '#94a3b8' }}>
                Found {searchResults.length} proposal(s)
              </p>
              <div className="grid gap-4">
                {searchResults.map((result) => {
                  const totalVotes = result.totalVotes || (result.yesVotes + result.noVotes);
                  const approvalRate = totalVotes > 0 ? (result.yesVotes / totalVotes * 100) : 0;
                  const statusLabel = getStatusLabel(result.status);
                  
                  let statusClass = 'bg-slate-500/20 text-slate-400 border-slate-500/30';
                  if (result.status === 3) statusClass = 'bg-green-500/20 text-green-400 border-green-500/30';
                  else if (result.status === 6) statusClass = 'bg-red-500/20 text-red-400 border-red-500/30';
                  else if (result.status === 4) statusClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                  else if (result.status === 2) statusClass = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
                  else if (result.status === 5) statusClass = 'bg-red-900/80 text-white border-red-900';
                  
                  const slug = createProposalSlug(result.title, result.id);
                  
                  return (
                    <a
                      key={`${result.epoch}-${result.id}`}
                      href={`/proposal/${result.epoch}/${slug}`}
                      className="block rounded-xl p-5 transition-all group"
                      style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#202e3c';
                        e.currentTarget.style.borderColor = '#23ffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#151e27';
                        e.currentTarget.style.borderColor = '#202e3c';
                      }}
                    >
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="text-sm font-medium px-2 py-1 rounded" style={{ backgroundColor: '#23ffff', color: '#0f172a' }}>
                          Epoch {result.epoch}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold truncate transition-colors hover:text-cyan-400" style={{ color: '#ffffff' }}>
                            {result.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4" style={{ borderColor: '#202e3c', borderTopWidth: '1px', borderStyle: 'solid' }}>
                        <div className="flex items-center gap-6">
                          <div className="text-center" style={{ minWidth: '60px' }}>
                            <span className="text-xs block" style={{ color: '#94a3b8' }}>Yes</span>
                            <p className="text-sm font-medium" style={{ color: '#22c55e' }}>{result.yesVotes.toLocaleString()}</p>
                          </div>
                          <div className="text-center" style={{ minWidth: '60px' }}>
                            <span className="text-xs block" style={{ color: '#94a3b8' }}>No</span>
                            <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{result.noVotes.toLocaleString()}</p>
                          </div>
                          <div className="text-center" style={{ minWidth: '60px' }}>
                            <span className="text-xs block" style={{ color: '#94a3b8' }}>Approval</span>
                            <p className="text-sm font-medium" style={{ color: '#ffffff' }}>{approvalRate.toFixed(1)}%</p>
                          </div>
                          <div className="text-center" style={{ minWidth: '60px' }}>
                            <span className="text-xs block" style={{ color: '#94a3b8' }}>Total</span>
                            <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>{totalVotes.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101820' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#23ffff' }}></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
