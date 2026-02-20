import { NextResponse } from 'next/server';
import { getCurrentEpoch, getActiveProposals, getEpochHistory } from '@/lib/qubic-api';
import { getAllTranslations } from '@/lib/cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ epoch: string }> }
) {
  try {
    const { epoch: epochStr } = await params;
    const epoch = parseInt(epochStr, 10);
    const currentEpoch = await getCurrentEpoch();

    let proposals: any[] = [];

    if (epoch === currentEpoch) {
      proposals = await getActiveProposals();
    } else {
      proposals = await getEpochHistory(epoch);
    }

    const proposalsWithTranslations = proposals.map((p: any) => {
      const translations = getAllTranslations(epoch, p.id?.toString() || p.url);
      return {
        id: p.id || p.url,
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
    });

    return NextResponse.json({ proposals: proposalsWithTranslations });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}
