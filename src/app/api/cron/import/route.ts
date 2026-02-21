import { NextResponse } from 'next/server';
import { setEpochProposals } from '@/lib/cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { epoch, proposals } = body;

    if (!epoch || !proposals || !Array.isArray(proposals)) {
      return NextResponse.json({ error: 'Invalid data format. Expected { epoch: number, proposals: array }' }, { status: 400 });
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
