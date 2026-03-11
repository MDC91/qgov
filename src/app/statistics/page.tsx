'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface GlobalStats {
  totalComputors: number;
  totalProposals: number;
  totalVotes: number;
  avgParticipation: number;
  yesPercentage: number;
  noPercentage: number;
  abstainPercentage: number;
  sinceEpoch: number;
}

interface ComputorStats {
  computor_id: string;
  epochs: number[];
  total_epochs: number;
  total_proposals: number;
  votes_cast: number;
  votes_yes: number;
  votes_no: number;
  votes_abstain: number;
  participation_rate: number;
  first_vote_tick: number | null;
  last_vote_tick: number | null;
}

interface VoteDetail {
  proposal_id: string;
  epoch: number;
  vote: number;
  vote_tick: number;
  proposal_title: string | null;
}

interface SearchResult {
  computor_id: string;
  total_epochs: number;
  total_proposals: number;
  votes_cast: number;
  votes_yes: number;
  votes_no: number;
  votes_abstain: number;
  participation_rate: number;
}

export default function StatisticsPage() {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedComputor, setSelectedComputor] = useState<ComputorStats | null>(null);
  const [computorVotes, setComputorVotes] = useState<VoteDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch('/api/statistics?action=global')
      .then(res => res.json())
      .then(data => {
        setGlobalStats(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/statistics?action=search&q=${encodeURIComponent(query)}`);
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
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  const handleSelectComputor = async (computorId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/statistics?action=detail&id=${encodeURIComponent(computorId)}`);
      const data = await res.json();
      if (data.stats) {
        setSelectedComputor(data.stats);
        setComputorVotes(data.votes || []);
      }
    } catch (error) {
      console.error('Error loading computor detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const getVoteLabel = (vote: number) => {
    if (vote === 1) return { label: 'Yes', color: '#22c55e' };
    if (vote === 0) return { label: 'No', color: '#ef4444' };
    return { label: 'Abstain', color: '#94a3b8' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101820' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#23ffff' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#101820' }}>
      <header className="border backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: '#151e27', borderColor: '#202e3c' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/Qubic-Logo-White.svg" alt="Qubic" className="h-10" style={{ width: 'auto' }} />
              <span className="text-3xl font-light" style={{ color: '#23ffff' }}>governance</span>
            </Link>
            <Link href="/" className="text-sm hover:underline" style={{ color: '#23ffff' }}>
              ← Back to Proposals
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: '#ffffff' }}>
          📊 Computor Statistics
        </h1>

        {globalStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
              <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Total Computors</p>
              <p className="text-2xl font-bold" style={{ color: '#23ffff' }}>{globalStats.totalComputors.toLocaleString()}</p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>since epoch {globalStats.sinceEpoch}</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
              <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Total Proposals</p>
              <p className="text-2xl font-bold" style={{ color: '#23ffff' }}>{globalStats.totalProposals.toLocaleString()}</p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>since epoch {globalStats.sinceEpoch}</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
              <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Total Votes</p>
              <p className="text-2xl font-bold" style={{ color: '#23ffff' }}>{globalStats.totalVotes.toLocaleString()}</p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>since epoch {globalStats.sinceEpoch}</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
              <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Avg Participation</p>
              <p className="text-2xl font-bold" style={{ color: '#23ffff' }}>{(globalStats.avgParticipation ?? 0).toFixed(1)}%</p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>since epoch {globalStats.sinceEpoch}</p>
            </div>
          </div>
        )}

        {globalStats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
              <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Yes Votes</p>
              <p className="text-xl font-bold" style={{ color: '#22c55e' }}>{(globalStats.yesPercentage ?? 0).toFixed(1)}%</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
              <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>No Votes</p>
              <p className="text-xl font-bold" style={{ color: '#ef4444' }}>{(globalStats.noPercentage ?? 0).toFixed(1)}%</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
              <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Abstain</p>
              <p className="text-xl font-bold" style={{ color: '#94a3b8' }}>{(globalStats.abstainPercentage ?? 0).toFixed(1)}%</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search computor ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
            style={{ backgroundColor: '#1a2332', borderColor: '#2d3748', color: '#e2e8f0' }}
          />
        </div>

        {searchLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#23ffff' }}></div>
          </div>
        ) : searchQuery && searchResults.length > 0 ? (
          <div className="mb-8">
            <p className="mb-4 text-sm" style={{ color: '#94a3b8' }}>
              Found {searchResults.length} computor(s)
            </p>
            <div className="grid gap-3">
              {searchResults.map((result) => (
                <button
                  key={result.computor_id}
                  onClick={() => handleSelectComputor(result.computor_id)}
                  className="text-left rounded-xl p-4 transition-all"
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm" style={{ color: '#ffffff' }}>
                        {result.computor_id.slice(0, 20)}...
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                        Epochs: {result.total_epochs} | Proposals: {result.total_proposals}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: '#23ffff' }}>
                        {(result.participation_rate ?? 0).toFixed(1)}%
                      </p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>participation</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : searchQuery ? (
          <div className="text-center py-10" style={{ color: '#94a3b8' }}>
            No computors found matching "{searchQuery}"
          </div>
        ) : null}

        {selectedComputor && (
          <div className="rounded-xl p-6" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>
                Detail: {selectedComputor.computor_id.slice(0, 24)}...
              </h2>
              <button
                onClick={() => setSelectedComputor(null)}
                className="text-sm hover:underline"
                style={{ color: '#23ffff' }}
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Total Epochs</p>
                <p className="text-lg font-bold" style={{ color: '#ffffff' }}>{selectedComputor.total_epochs}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Epoch Range</p>
                <p className="text-lg font-bold" style={{ color: '#ffffff' }}>
                  {Math.min(...selectedComputor.epochs)} - {Math.max(...selectedComputor.epochs)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Participation</p>
                <p className="text-lg font-bold" style={{ color: '#23ffff' }}>{selectedComputor.participation_rate}%</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Votes Cast</p>
                <p className="text-lg font-bold" style={{ color: '#ffffff' }}>{selectedComputor.votes_cast}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg p-3" style={{ backgroundColor: '#1a2332' }}>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Yes</p>
                <p className="text-xl font-bold" style={{ color: '#22c55e' }}>{selectedComputor.votes_yes}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#1a2332' }}>
                <p className="text-xs" style={{ color: '#94a3b8' }}>No</p>
                <p className="text-xl font-bold" style={{ color: '#ef4444' }}>{selectedComputor.votes_no}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#1a2332' }}>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Abstain</p>
                <p className="text-xl font-bold" style={{ color: '#94a3b8' }}>{selectedComputor.votes_abstain}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4" style={{ color: '#ffffff' }}>
              Vote History ({computorVotes.length} votes)
            </h3>

            {detailLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#23ffff' }}></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #202e3c' }}>
                      <th className="text-left py-2 px-3" style={{ color: '#94a3b8' }}>Epoch</th>
                      <th className="text-left py-2 px-3" style={{ color: '#94a3b8' }}>Proposal</th>
                      <th className="text-left py-2 px-3" style={{ color: '#94a3b8' }}>Vote</th>
                      <th className="text-right py-2 px-3" style={{ color: '#94a3b8' }}>Tick</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computorVotes.slice(0, 50).map((vote, idx) => {
                      const voteInfo = getVoteLabel(vote.vote);
                      return (
                        <tr key={`${vote.proposal_id}-${idx}`} style={{ borderBottom: '1px solid #1a2332' }}>
                          <td className="py-2 px-3" style={{ color: '#ffffff' }}>{vote.epoch}</td>
                          <td className="py-2 px-3 font-mono" style={{ color: '#94a3b8' }}>
                            {vote.proposal_title || vote.proposal_id.slice(0, 16)}...
                          </td>
                          <td className="py-2 px-3">
                            <span 
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ backgroundColor: voteInfo.color + '20', color: voteInfo.color }}
                            >
                              {voteInfo.label}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono" style={{ color: '#94a3b8' }}>
                            {vote.vote_tick.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {computorVotes.length > 50 && (
                  <p className="text-center py-2 text-xs" style={{ color: '#94a3b8' }}>
                    Showing first 50 of {computorVotes.length} votes
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
