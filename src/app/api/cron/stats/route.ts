import { NextResponse } from 'next/server';
import { updateStatistics, getLatestEpoch, getLatestComputorEpoch } from '@/lib/database';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const latestProposalEpoch = getLatestEpoch();
    const latestComputorEpoch = getLatestComputorEpoch();
    
    console.log(`[StatsCron] Latest proposal epoch: ${latestProposalEpoch}, Latest computor epoch: ${latestComputorEpoch}`);
    
    updateStatistics();
    
    console.log('[StatsCron] Statistics updated successfully');
    
    return NextResponse.json({ 
      success: true, 
      latestProposalEpoch,
      latestComputorEpoch,
      message: 'Statistics updated successfully'
    });
  } catch (error) {
    console.error('[StatsCron] Error updating statistics:', error);
    return NextResponse.json({ error: 'Failed to update statistics' }, { status: 500 });
  }
}
