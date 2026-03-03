import { Proposal } from '@/types';
import ProposalDetail from '@/components/ProposalDetail';
import { getCurrentEpoch } from '@/lib/qubic-api';
import { getProposalsByEpoch, getProposalById, getAllTranslations } from '@/lib/database';

interface PageProps {
  params: Promise<{ epoch: string; id: string }>;
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

async function getProposal(epoch: number, slugOrId: string): Promise<Proposal | null> {
  try {
    const decodedSlug = decodeURIComponent(slugOrId);
    
    // First try to find by ID directly
    let proposal = getProposalById(decodedSlug);
    
    // If not found, search through all proposals for this epoch
    if (!proposal) {
      const proposals = getProposalsByEpoch(epoch);
      proposal = proposals.find(p => {
        const slug = titleToSlug(p.title || '');
        return slug === decodedSlug || p.id === decodedSlug;
      });
    }

    if (!proposal) return null;

    const translations = getAllTranslations(proposal.id);

    const translationsObj: Record<string, any> = {};
    for (const t of translations) {
      translationsObj[t.lang_code] = {
        text: t.text,
        updatedAt: new Date(t.updated_at).getTime()
      };
    }

    return {
      id: proposal.id,
      epoch: proposal.epoch,
      title: proposal.title || 'Untitled',
      url: proposal.url || '',
      status: proposal.status || 2,
      yesVotes: proposal.yes_votes,
      noVotes: proposal.no_votes,
      totalVotes: proposal.total_votes,
      approvalRate: proposal.total_votes > 0 ? (proposal.yes_votes / proposal.total_votes) * 100 : 0,
      proposerIdentity: proposal.proposer_identity,
      contractName: proposal.contract_name || undefined,
      contractIndex: proposal.contract_index || undefined,
      proposalIndex: proposal.proposal_index || undefined,
      numberOfOptions: proposal.number_of_options || undefined,
      proposalType: proposal.proposal_type || undefined,
      published: proposal.published || undefined,
      publishedTick: proposal.published_tick || undefined,
      latestVoteTick: proposal.latest_vote_tick || undefined,
      translations: translationsObj
    };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
}

export default async function Page({ params }: PageProps) {
  const { epoch: epochStr, id: slugOrId } = await params;
  const epoch = parseInt(epochStr, 10);

  const proposal = await getProposal(epoch, slugOrId);

  if (!proposal) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{ backgroundColor: '#101820' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: '#94a3b8' }}>Proposal not found</h1>
          <a href="/" className="hover:underline mt-4 inline-block" style={{ color: '#23ffff' }}>
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#101820' }}>
      <header className="border backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: '#151e27', borderColor: '#202e3c' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between proposal-page-header-row">
            <a href="/" className="flex items-center gap-3 proposal-page-brand">
              <img src="/Qubic-Logo-White.svg" alt="Qubic" className="h-10" style={{ width: 'auto' }} />
              <span className="text-3xl font-light font-governance" style={{ color: '#23ffff' }}>governance</span>
            </a>
            <div className="flex items-center gap-4 proposal-page-header-meta">
              <span className="text-sm" style={{ color: '#94a3b8' }}>Epoch {epoch}</span>
              <span className="text-sm proposal-page-header-separator" style={{ color: '#23ffff' }}>|</span>
              <p className="text-sm truncate max-w-md proposal-page-header-title" style={{ color: '#ffffff' }}>{proposal?.title}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <ProposalDetail epoch={epoch} id={proposal.id} initialProposal={proposal} />
      </main>
    </div>
  );
}
