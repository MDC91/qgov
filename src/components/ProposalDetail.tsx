'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Proposal, LANGUAGES, PROPOSAL_STATUS } from '@/types';
import LanguageTabs from './LanguageTabs';

interface ProposalDetailProps {
  epoch: number;
  id: string;
  initialProposal: Proposal;
}

const statusColors: Record<string, string> = {
  Active: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  'Quorum not reached': 'bg-yellow-600/20 text-yellow-500 border-yellow-600/30'
};

export default function ProposalDetail({ epoch, id, initialProposal }: ProposalDetailProps) {
  const [selectedLang, setSelectedLang] = useState('en');
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = PROPOSAL_STATUS[initialProposal.status as keyof typeof PROPOSAL_STATUS] || 'unknown';
  const statusClass = statusColors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  const cachedLangs = Object.keys(initialProposal.translations || {});
  const availableLangs: string[] = LANGUAGES.map(l => l.code);
  
  const totalVotes = initialProposal.totalVotes || (initialProposal.yesVotes + initialProposal.noVotes);
  const yesVotes = initialProposal.yesVotes;
  const noVotes = initialProposal.noVotes;
  const approvalRate = totalVotes > 0 ? (yesVotes / totalVotes * 100) : 0;
  const rejectionRate = totalVotes > 0 ? (noVotes / totalVotes * 100) : 0;
  
  const displayRate = status === 'Approved' ? approvalRate : status === 'Rejected' ? rejectionRate : 0;
  const rateLabel = status === 'Approved' ? 'Approval Rate' : status === 'Rejected' ? 'Rejection Rate' : 'Approval Rate';

  useEffect(() => {
    const cachedTranslation = initialProposal.translations?.[selectedLang]?.text;
    if (cachedTranslation) {
      setTranslation(cachedTranslation);
      setError(null);
    } else {
      setTranslation(null);
    }
  }, [selectedLang, initialProposal.translations]);

  const generateTranslation = async () => {
    setLoading(true);
    setError(null);

    try {
      const encodedId = encodeURIComponent(id);
      const response = await fetch(`/api/translate/${epoch}/${encodedId}/${selectedLang}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: initialProposal.url,
          title: initialProposal.title
        })
      });

      const data = await response.json();

      if (response.ok && data.translation) {
        setTranslation(data.translation);
      } else {
        setError(data.error || 'Failed to generate translation');
      }
    } catch (err) {
      setError('Failed to generate translation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>{initialProposal.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusClass}`}>
            {status}
          </span>
        </div>

        <a 
          href={initialProposal.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ 
            backgroundColor: '#202e3c', 
            color: '#23ffff',
            border: '1px solid #202e3c'
          }}
        >
          Proposal Origin
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        <div className="flex items-center gap-6 mt-6" style={{ borderColor: '#202e3c', borderTopWidth: '1px', borderStyle: 'solid', paddingTop: '24px' }}>
          <div className="text-center" style={{ minWidth: '80px' }}>
            <span className="text-xs block" style={{ color: '#94a3b8' }}>Yes Votes</span>
            <p className="text-lg font-semibold" style={{ color: '#22c55e' }}>
              {yesVotes.toLocaleString()}
            </p>
          </div>
          <div className="text-center" style={{ minWidth: '80px' }}>
            <span className="text-xs block" style={{ color: '#94a3b8' }}>No Votes</span>
            <p className="text-lg font-semibold" style={{ color: '#ef4444' }}>
              {noVotes.toLocaleString()}
            </p>
          </div>
          <div className="text-center" style={{ minWidth: '80px' }}>
            <span className="text-xs block" style={{ color: '#94a3b8' }}>Total Votes</span>
            <p className="text-lg font-semibold" style={{ color: '#ffffff' }}>
              {totalVotes.toLocaleString()}
            </p>
          </div>
          <div className="text-center" style={{ minWidth: '80px' }}>
            <span className="text-xs block" style={{ color: '#94a3b8' }}>{rateLabel}</span>
            <p className="text-lg font-semibold" style={{ color: '#ffffff' }}>
              {displayRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <LanguageTabs
          selectedLang={selectedLang}
          availableLangs={availableLangs}
          onSelect={setSelectedLang}
        />
      </div>

      <div className="rounded-xl p-6 min-h-[300px]" style={{ backgroundColor: '#151e27', border: '1px solid #202e3c' }}>
        {translation ? (
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 style={{color: '#ffffff', fontSize: '1.5em', fontWeight: 'bold', marginBottom: '0.5em', marginTop: '1em'}} {...props} />,
                h2: ({node, ...props}) => <h2 style={{color: '#ffffff', fontSize: '1.3em', fontWeight: 'bold', marginTop: '1em', marginBottom: '0.5em'}} {...props} />,
                h3: ({node, ...props}) => <h3 style={{color: '#ffffff', fontSize: '1.1em', fontWeight: 'bold', marginTop: '0.8em', marginBottom: '0.4em'}} {...props} />,
                p: ({node, ...props}) => <p style={{color: '#e2e8f0', marginBottom: '0.75em', lineHeight: '1.6'}} {...props} />,
                ul: ({node, ...props}) => <ul style={{color: '#e2e8f0', marginLeft: '1.5em', marginBottom: '0.75em'}} {...props} />,
                ol: ({node, ...props}) => <ol style={{color: '#e2e8f0', marginLeft: '1.5em', marginBottom: '0.75em'}} {...props} />,
                li: ({node, ...props}) => <li style={{color: '#e2e8f0', marginBottom: '0.25em'}} {...props} />,
                code: ({node, ...props}) => <code style={{backgroundColor: '#0f172a', color: '#23ffff', padding: '0.2em 0.4em', borderRadius: '0.25em', fontSize: '0.9em', fontFamily: 'monospace'}} {...props} />,
                pre: ({node, ...props}) => <pre style={{backgroundColor: '#0f172a', color: '#e2e8f0', padding: '1em', borderRadius: '0.5em', overflow: 'auto', marginBottom: '1em', fontFamily: 'monospace'}} {...props} />,
                a: ({node, ...props}) => <a style={{color: '#23ffff', textDecoration: 'underline'}} {...props} />,
                table: ({node, ...props}) => <table style={{borderCollapse: 'collapse', width: '100%', marginBottom: '1em', overflowX: 'auto', display: 'table'}} {...props} />,
                thead: ({node, ...props}) => <thead style={{backgroundColor: '#1e293b'}} {...props} />,
                tbody: ({node, ...props}) => <tbody {...props} />,
                tr: ({node, ...props}) => <tr style={{borderBottom: '1px solid #202e3c'}} {...props} />,
                th: ({node, ...props}) => <th style={{border: '1px solid #202e3c', padding: '12px', backgroundColor: '#1e293b', color: '#ffffff', textAlign: 'left', fontWeight: 'bold'}} {...props} />,
                td: ({node, ...props}) => <td style={{border: '1px solid #202e3c', padding: '12px', color: '#e2e8f0'}} {...props} />,
                blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '4px solid #23ffff', paddingLeft: '1em', color: '#94a3b8', marginBottom: '0.75em', fontStyle: 'italic'}} {...props} />,
                hr: ({node, ...props}) => <hr style={{borderColor: '#202e3c', margin: '1.5em 0'}} {...props} />,
              }}
            >
              {translation}
            </ReactMarkdown>
          </div>
        ) : loading ? (
          <div className="text-center py-12" style={{ color: '#94a3b8' }}>
            Translation loading...
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="mb-4" style={{ color: '#94a3b8' }}>
              Translation not available for {LANGUAGES.find(l => l.code === selectedLang)?.name}
            </p>
            <button
              onClick={generateTranslation}
              disabled={loading}
              className="px-6 py-2 rounded-lg font-medium transition-colors"
              style={{ 
                backgroundColor: '#23ffff', 
                color: '#101820',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Generating...' : 'Generate Translation'}
            </button>
            {error && <p className="mt-4" style={{ color: '#ef4444' }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
