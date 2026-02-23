import { NextResponse } from 'next/server';
import { getCurrentEpoch, getActiveProposals, getEpochHistory } from '@/lib/qubic-api';
import { getEpochProposals, getAllStoredEpochs } from '@/lib/cache';

const EARLIEST_EPOCH = 134;

export async function GET() {
  try {
    const currentEpoch = await getCurrentEpoch();
    const epochs: { epoch: number; proposalCount: number; hasActive: boolean }[] = [];

    // First add current epoch with active proposals
    const activeProposals = await getActiveProposals();
    if (activeProposals.length > 0) {
      epochs.push({ epoch: currentEpoch, proposalCount: activeProposals.length, hasActive: true });
    } else {
      // Even if no active, show current epoch with 0
      epochs.push({ epoch: currentEpoch, proposalCount: 0, hasActive: false });
    }

    // Get all stored epochs from Redis
    const storedEpochs = await getAllStoredEpochs();
    const storedEpochSet = new Set(storedEpochs);
    
    // Iterate through all epochs from EARLIEST_EPOCH to currentEpoch - 1
    const allEpochs: { epoch: number; proposalCount: number; hasActive: boolean }[] = [];
    
    for (let e = currentEpoch - 1; e >= EARLIEST_EPOCH; e--) {
      if (storedEpochSet.has(e)) {
        const stored = await getEpochProposals(e);
        if (stored && stored.length > 0) {
          allEpochs.push({ epoch: e, proposalCount: stored.length, hasActive: false });
        }
      } else {
        // Try to get from API (cached)
        try {
          const proposals = await getEpochHistory(e);
          if (proposals && proposals.length > 0) {
            allEpochs.push({ epoch: e, proposalCount: proposals.length, hasActive: false });
          }
        } catch {}
      }
    }

    // Combine: current epoch first, then all others
    return NextResponse.json({ epochs: [...epochs, ...allEpochs] });
  } catch (error) {
    console.error('Error fetching epochs:', error);
    return NextResponse.json({ error: 'Failed to fetch epochs' }, { status: 500 });
  }
}
