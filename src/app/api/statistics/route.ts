import { NextRequest, NextResponse } from 'next/server';
import { getGlobalStats, searchComputors, getComputorStatsById, getVoteHistoryByComputorId } from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const query = searchParams.get('q') || '';
  
  try {
    if (action === 'global') {
      const stats = getGlobalStats();
      return NextResponse.json(stats);
    }
    
    if (action === 'search') {
      const results = searchComputors(query);
      return NextResponse.json({ results });
    }
    
    if (action === 'detail') {
      const computorId = searchParams.get('id');
      if (!computorId) {
        return NextResponse.json({ error: 'Missing computor_id' }, { status: 400 });
      }
      const stats = getComputorStatsById(computorId);
      if (!stats) {
        return NextResponse.json({ error: 'Computor not found' }, { status: 404 });
      }
      const votes = getVoteHistoryByComputorId(computorId);
      return NextResponse.json({ stats, votes });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Statistics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
