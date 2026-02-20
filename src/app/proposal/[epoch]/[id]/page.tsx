import { Proposal } from '@/types';
import ProposalDetail from '@/components/ProposalDetail';
import { getCurrentEpoch, getActiveProposals, getEpochHistory } from '@/lib/qubic-api';
import { getAllTranslations } from '@/lib/cache';
import { createProposalSlug } from '@/lib/proposal';

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

async function getProposal(epoch: number, slug: string): Promise<Proposal | null> {
  try {
    const currentEpoch = await getCurrentEpoch();
    let proposals: any[] = [];

    if (epoch === currentEpoch) {
      proposals = await getActiveProposals();
    } else {
      proposals = await getEpochHistory(epoch);
    }

    const matchedProposal = proposals.find((p: any) => {
      const proposalId = p.id?.toString() || p.url;
      return titleToSlug(p.title || '') === slug || proposalId === slug;
    });

    if (!matchedProposal) return null;

    const proposalId = matchedProposal.id?.toString() || matchedProposal.url;
    const translations = await getAllTranslations(epoch, proposalId);

    return {
      id: proposalId,
      epoch: matchedProposal.epoch || epoch,
      title: matchedProposal.title,
      url: matchedProposal.url,
      status: matchedProposal.status,
      yesVotes: matchedProposal.options?.[1]?.numberOfVotes || matchedProposal.yes_votes || 0,
      noVotes: matchedProposal.options?.[0]?.numberOfVotes || matchedProposal.no_votes || 0,
      totalVotes: matchedProposal.totalVotes || 0,
      approvalRate: matchedProposal.approval_rate || 0,
      translations
    };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
}

export default async function Page({ params }: PageProps) {
  const { epoch: epochStr, id: slug } = await params;
  const epoch = parseInt(epochStr, 10);

  const proposal = await getProposal(epoch, slug);

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
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src="/Qubic-Logo-White.svg" alt="Qubic" className="h-10" style={{ width: 'auto' }} />
              <span className="text-3xl font-light font-governance" style={{ color: '#23ffff' }}>governance</span>
            </a>
            <div className="flex items-center gap-4">
              <span className="text-sm" style={{ color: '#94a3b8' }}>Epoch {epoch}</span>
              <span className="text-sm" style={{ color: '#23ffff' }}>|</span>
              <p className="text-sm truncate max-w-md" style={{ color: '#ffffff' }}>{proposal?.title}</p>
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
