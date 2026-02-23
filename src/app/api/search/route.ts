import { NextResponse } from 'next/server';
import { searchAllProposals } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const author = url.searchParams.get('author') || '';
    const publisher = url.searchParams.get('publisher') || '';
    const statusParam = url.searchParams.get('status');
    const status = statusParam ? parseInt(statusParam, 10) : undefined;

    if (!query && !author && !publisher && status === undefined) {
      return NextResponse.json({ error: 'At least one search parameter is required' }, { status: 400 });
    }

    const results = await searchAllProposals(query, author, publisher, status);

    return NextResponse.json({ 
      query,
      author,
      publisher,
      status,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
