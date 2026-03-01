import { NextResponse } from 'next/server';
import { getCurrentEpoch } from '@/lib/qubic-api';
import { getAllStoredEpochs, getProposalsByEpoch } from '@/lib/database';

const EARLIEST_EPOCH = 134;

export async function GET() {
  try {
    const currentEpoch = await getCurrentEpoch();
    const epochs: { epoch: number; proposalCount: number; hasActive: boolean }[] = [];

    epochs.push({ epoch: currentEpoch, proposalCount: 0, hasActive: false });

    const storedEpochs = getAllStoredEpochs();
    const storedEpochSet = new Set(storedEpochs);
    
    for (let e = currentEpoch - 1; e >= EARLIEST_EPOCH; e--) {
      if (storedEpochSet.has(e)) {
        const proposals = getProposalsByEpoch(e);
        epochs.push({ epoch: e, proposalCount: proposals.length, hasActive: false });
      }
    }

    return NextResponse.json({ epochs });
  } catch (error) {
    console.error('Error fetching epochs:', error);
    return NextResponse.json({ error: 'Failed to fetch epochs' }, { status: 500 });
  }
}
