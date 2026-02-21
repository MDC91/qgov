import { NextResponse } from 'next/server';
import { setEpochProposals } from '@/lib/cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    let epoch: number;
    let proposals: any[];

    if (Array.isArray(body)) {
      // Direct array format: use epoch from first proposal
      proposals = body;
      if (proposals.length === 0) {
        return NextResponse.json({ error: 'Empty array' }, { status: 400 });
      }
      epoch = proposals[0].epoch;
      if (!epoch) {
        return NextResponse.json({ error: 'No epoch in proposals' }, { status: 400 });
      }
    } else {
      // Object format: { epoch, proposals }
      epoch = body.epoch;
      proposals = body.proposals;
    }

    if (!epoch || !proposals || !Array.isArray(proposals)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    await setEpochProposals(epoch, proposals);

    return NextResponse.json({ 
      success: true, 
      epoch, 
      proposalsStored: proposals.length 
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
