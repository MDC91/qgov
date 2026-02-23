import { NextResponse } from 'next/server';
import { getCurrentEpoch, getActiveProposals, getEpochHistory } from '@/lib/qubic-api';
import { getEpochProposals, getAllStoredEpochs } from '@/lib/cache';

export async function GET() {
  try {
    const currentEpoch = await getCurrentEpoch();
    const epochs: { epoch: number; proposalCount: number; hasActive: boolean }[] = [];

    // First add current epoch
    const activeProposals = await getActiveProposals();
    if (activeProposals.length > 0) {
      epochs.push({ epoch: currentEpoch, proposalCount: activeProposals.length, hasActive: true });
    }

    // Get all stored epochs from Redis in one call
    const storedEpochs = await getAllStoredEpochs();
    
    for (const e of storedEpochs) {
      if (e < currentEpoch) {
        const stored = await getEpochProposals(e);
        if (stored && stored.length > 0) {
          epochs.push({ epoch: e, proposalCount: stored.length, hasActive: false });
        }
      }
    }

    return NextResponse.json({ epochs });
  } catch (error) {
    console.error('Error fetching epochs:', error);
    return NextResponse.json({ error: 'Failed to fetch epochs' }, { status: 500 });
  }
}
