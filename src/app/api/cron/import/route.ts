import { NextResponse } from 'next/server';
import { setEpochProposals } from '@/lib/cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    let epoch: number;
    let proposals: any[];

    // If URL provided, fetch from URL
    if (body.url) {
      const response = await fetch(body.url);
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch from URL' }, { status: 400 });
      }
      proposals = await response.json();
      if (!Array.isArray(proposals) || proposals.length === 0) {
        return NextResponse.json({ error: 'Invalid data from URL' }, { status: 400 });
      }
      epoch = proposals[0].epoch;
    } else if (Array.isArray(body)) {
      // Direct array format
      proposals = body;
      if (proposals.length === 0) {
        return NextResponse.json({ error: 'Empty array' }, { status: 400 });
      }
      epoch = proposals[0].epoch;
    } else {
      // Object format
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
