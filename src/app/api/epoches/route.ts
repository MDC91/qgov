import { NextResponse } from 'next/server';
import { getCurrentEpoch } from '@/lib/qubic-api';
import { getProposalsByEpoch } from '@/lib/database';

const EARLIEST_EPOCH = 134;

export async function GET() {
  try {
    const currentEpoch = await getCurrentEpoch();
    const epochs: { epoch: number; proposalCount: number; hasActive: boolean }[] = [];

    // Show current epoch first
    const currentProposals = getProposalsByEpoch(currentEpoch);
    epochs.push({ 
      epoch: currentEpoch, 
      proposalCount: currentProposals.length, 
      hasActive: currentProposals.length > 0 
    });

    // Show all historical epochs (even empty ones)
    for (let e = currentEpoch - 1; e >= EARLIEST_EPOCH; e--) {
      const proposals = getProposalsByEpoch(e);
      epochs.push({ epoch: e, proposalCount: proposals.length, hasActive: false });
    }

    return NextResponse.json({ epochs });
  } catch (error) {
    console.error('Error fetching epochs:', error);
    return NextResponse.json({ error: 'Failed to fetch epochs' }, { status: 500 });
  }
}
