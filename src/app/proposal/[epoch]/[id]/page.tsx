import { Proposal } from '@/types';
import ProposalDetail from '@/components/ProposalDetail';
import { getCurrentEpoch, getActiveProposals, getEpochHistory } from '@/lib/qubic-api';
import { getAllTranslations } from '@/lib/cache';

interface PageProps {
  params: Promise<{ epoch: string; id: string }>;
}

async function getProposal(epoch: number, id: string): Promise<Proposal | null> {
  try {
    const currentEpoch = await getCurrentEpoch();
    let proposals: any[] = [];

    if (epoch === currentEpoch) {
      proposals = await getActiveProposals();
    } else {
      proposals = await getEpochHistory(epoch);
    }

    const proposalsWithTranslations = await Promise.all(proposals.map(async (p: any) => ({
      id: p.id || p.url,
      epoch: p.epoch || epoch,
      title: p.title,
      url: p.url,
      status: p.status,
      yesVotes: p.options?.[1]?.numberOfVotes || p.yes_votes || 0,
      noVotes: p.options?.[0]?.numberOfVotes || p.no_votes || 0,
      totalVotes: p.totalVotes || 0,
      approvalRate: p.approval_rate || 0,
      translations: await getAllTranslations(epoch, p.id?.toString() || p.url)
    })));

    return proposalsWithTranslations.find((p: Proposal) => String(p.id) === id) || null;
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
}

export default async function Page({ params }: PageProps) {
  const { epoch: epochStr, id: encodedId } = await params;
  const epoch = parseInt(epochStr, 10);
  const id = decodeURIComponent(encodedId);

  const proposal = await getProposal(epoch, id);

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
        <ProposalDetail epoch={epoch} id={id} initialProposal={proposal} />
      </main>
    </div>
  );
}
