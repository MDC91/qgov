import { NextResponse } from 'next/server';
import { searchAllProposals } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const statusParam = url.searchParams.get('status');
    const status = statusParam ? parseInt(statusParam, 10) : undefined;

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const results = await searchAllProposals(query, status);

    return NextResponse.json({ 
      query,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
