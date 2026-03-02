import { NextResponse } from 'next/server';
import { getCurrentEpoch } from '@/lib/qubic-api';
import { saveComputors, getLatestComputorEpoch } from '@/lib/database';

const CRON_SECRET = process.env.CRON_SECRET;
const COMPUTORS_URL = 'https://rpc.qubic.org/v1/epochs';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentEpoch = await getCurrentEpoch();
    const results: any[] = [];

    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const startEpoch = parseInt(url.searchParams.get('start') || '104', 10);
    const endEpoch = parseInt(url.searchParams.get('end') || String(currentEpoch), 10);

    const latestStoredEpoch = getLatestComputorEpoch();

    for (let epoch = startEpoch; epoch <= endEpoch; epoch++) {
      if (!forceRefresh && epoch <= latestStoredEpoch) {
        continue;
      }

      try {
        const response = await fetchWithTimeout(`${COMPUTORS_URL}/${epoch}/computors`, {
          headers: {
            'User-Agent': 'QGov/1.0',
            'Accept': 'application/json'
          }
        });

        if (response.status === 404 || response.status === 5) {
          results.push({ epoch, computorsStored: 0, status: 'not_found' });
          continue;
        }

        if (response.ok) {
          const data = await response.json();
          
          if (data.computors && data.computors.identities && Array.isArray(data.computors.identities)) {
            const computors = data.computors.identities;
            const saved = saveComputors(epoch, computors);
            results.push({ epoch, computorsStored: saved, status: 'saved' });
          } else {
            results.push({ epoch, computorsStored: 0, status: 'no_data' });
          }
        } else {
          results.push({ epoch, computorsStored: 0, status: 'error', code: response.status });
        }
      } catch (error) {
        console.error(`Error fetching computors for epoch ${epoch}:`, error);
        results.push({ epoch, computorsStored: 0, status: 'error' });
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return NextResponse.json({ 
      success: true, 
      currentEpoch,
      imported: results.length,
      details: results
    });
  } catch (error) {
    console.error('Computors import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
