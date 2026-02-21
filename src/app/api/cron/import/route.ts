import { NextResponse } from 'next/server';
import { setEpochProposals } from '@/lib/cache';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    let epochsToImport: { epoch: number; proposals: any[] }[] = [];

    // If URL provided, fetch from URL
    if (body.url) {
      const response = await fetch(body.url);
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch from URL' }, { status: 400 });
      }
      const data = await response.json();
      
      // Check if it's an object with epoch keys (like {"163": [...], "162": [...]})
      if (!Array.isArray(data)) {
        for (const [epochStr, proposals] of Object.entries(data)) {
          const epoch = parseInt(epochStr, 10);
          if (!isNaN(epoch) && Array.isArray(proposals)) {
            epochsToImport.push({ epoch, proposals });
          }
        }
      } else if (Array.isArray(data)) {
        // Direct array format
        if (data.length > 0 && data[0].epoch) {
          const epoch = parseInt(data[0].epoch, 10);
          epochsToImport.push({ epoch, proposals: data });
        }
      }
    } else if (typeof body === 'object' && !Array.isArray(body)) {
      // Check if object with epoch keys
      for (const [epochStr, proposals] of Object.entries(body)) {
        const epoch = parseInt(epochStr, 10);
        if (!isNaN(epoch) && Array.isArray(proposals)) {
          epochsToImport.push({ epoch, proposals });
        }
      }
    }

    if (epochsToImport.length === 0) {
      return NextResponse.json({ error: 'No valid data found' }, { status: 400 });
    }

    const results: any[] = [];
    for (const { epoch, proposals } of epochsToImport) {
      await setEpochProposals(epoch, proposals);
      results.push({ epoch, proposalsStored: proposals.length });
    }

    return NextResponse.json({ 
      success: true, 
      imported: results
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
