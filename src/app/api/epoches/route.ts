import { NextResponse } from 'next/server';
import { getCurrentEpoch, getActiveProposals, getEpochHistory } from '@/lib/qubic-api';

export async function GET() {
  try {
    const currentEpoch = await getCurrentEpoch();
    const epochs: { epoch: number; proposalCount: number; hasActive: boolean }[] = [];

    for (let e = currentEpoch; e >= Math.max(1, currentEpoch - 10); e--) {
      const activeProposals = e === currentEpoch ? await getActiveProposals() : [];
      const historyProposals = e < currentEpoch ? await getEpochHistory(e) : [];
      
      const proposalCount = activeProposals.length + historyProposals.length;
      const hasActive = activeProposals.length > 0;

      if (proposalCount > 0) {
        epochs.push({ epoch: e, proposalCount, hasActive });
      }
    }

    return NextResponse.json({ epochs });
  } catch (error) {
    console.error('Error fetching epochs:', error);
    return NextResponse.json({ error: 'Failed to fetch epochs' }, { status: 500 });
  }
}
