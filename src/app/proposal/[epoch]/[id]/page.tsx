import { Proposal } from '@/types';
import ProposalDetail from '@/components/ProposalDetail';

interface PageProps {
  params: Promise<{ epoch: string; id: string }>;
}

async function getProposal(epoch: number, id: string): Promise<Proposal | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
      : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/proposals/${epoch}`, {
      cache: 'no-store'
    });
    const data = await response.json();
    console.log('API response for epoch', epoch, ':', data.proposals?.map((p: any) => ({ id: p.id, title: p.title })));
    const proposal = data.proposals?.find((p: Proposal) => String(p.id) === id);
    console.log('Looking for id:', id, 'Found:', proposal?.title);
    return proposal || null;
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
