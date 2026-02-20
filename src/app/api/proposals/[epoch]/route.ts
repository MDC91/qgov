import { NextResponse } from 'next/server';
import { getCurrentEpoch, getActiveProposals, getEpochHistory } from '@/lib/qubic-api';
import { getAllTranslations, getEpochProposals, setEpochProposals } from '@/lib/cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ epoch: string }> }
) {
  try {
    const { epoch: epochStr } = await params;
    const epoch = parseInt(epochStr, 10);
    const currentEpoch = await getCurrentEpoch();

    let proposals: any[] = [];

    // First check if we have stored proposals in Redis
    const storedProposals = await getEpochProposals(epoch);
    
    if (storedProposals && storedProposals.length > 0) {
      // Use stored proposals for historical data
      proposals = storedProposals;
    } else {
      // Fetch fresh from API
      if (epoch === currentEpoch) {
        proposals = await getActiveProposals();
      } else {
        proposals = await getEpochHistory(epoch);
      }
      
      // Store for future use (especially historical)
      if (proposals.length > 0 && epoch < currentEpoch) {
        await setEpochProposals(epoch, proposals);
      }
    }

    const proposalsWithTranslations = await Promise.all(proposals.map(async (p: any) => {
      const proposalId = p.id?.toString() || p.url;
      const translations = await getAllTranslations(epoch, proposalId);
      return {
        id: proposalId,
        epoch: p.epoch || epoch,
        title: p.title,
        url: p.url,
        status: p.status,
        yesVotes: p.options?.[1]?.numberOfVotes || p.yes_votes || 0,
        noVotes: p.options?.[0]?.numberOfVotes || p.no_votes || 0,
        totalVotes: p.totalVotes || 0,
        approvalRate: p.approval_rate || 0,
        translations
      };
    }));

    return NextResponse.json({ proposals: proposalsWithTranslations });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}
