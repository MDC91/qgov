import { NextResponse } from 'next/server';
import { getCurrentEpoch } from '@/lib/qubic-api';
import { saveProposals, getLatestEpoch } from '@/lib/database';

const CRON_SECRET = process.env.CRON_SECRET;

const PROPOSALS_URL = 'https://api.qubic.li/Voting/Proposal';
const EPOCH_HISTORY_URL = 'https://api.qubic.li/Voting/EpochHistory';

async function getAuthToken(): Promise<string | null> {
  const response = await fetch('https://api.qubic.li/Auth/Login', {
    method: 'POST',
    headers: {
      'User-Agent': 'QGov/1.0',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      userName: 'guest@qubic.li',
      password: 'guest13@Qubic.li',
      twofactorCode: ''
    })
  });

  if (response.ok) {
    const data = await response.json();
    return data.token || null;
  }
  return null;
}

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
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Failed to get auth token' }, { status: 500 });
    }

    const currentEpoch = await getCurrentEpoch();
    const results: any[] = [];

    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const startEpoch = parseInt(url.searchParams.get('start') || '1', 10);
    const endEpoch = parseInt(url.searchParams.get('end') || String(currentEpoch), 10);

    const latestStoredEpoch = getLatestEpoch();

    for (let epoch = startEpoch; epoch <= endEpoch; epoch++) {
      if (!forceRefresh && epoch <= latestStoredEpoch) {
        continue;
      }

      let proposals: any[] = [];

      if (epoch === currentEpoch) {
        try {
          const response = await fetchWithTimeout(PROPOSALS_URL, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'User-Agent': 'QGov/1.0',
              'Accept': '*/*'
            }
          });

          if (response.ok) {
            const data = await response.json();
            proposals = data.filter((item: any) => item.status === 2);
          }
        } catch (error) {
          console.error(`Error fetching active proposals:`, error);
        }
      } else {
        try {
          const response = await fetchWithTimeout(`${EPOCH_HISTORY_URL}/${epoch}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'User-Agent': 'QGov/1.0',
              'Accept': '*/*'
            }
          });

          if (response.status === 404) {
            results.push({ epoch, proposalsStored: 0, status: 'no_data' });
            continue;
          }

          if (response.ok) {
            const data = await response.json();
            let items: any[] = [];
            
            if (data.result && Array.isArray(data.result)) {
              items = data.result;
            } else if (Array.isArray(data)) {
              items = data;
            }

            proposals = items.filter((item: any) => [3, 4, 5, 6].includes(item.status));
          }
        } catch (error) {
          console.error(`Error fetching epoch ${epoch}:`, error);
        }
      }

      if (proposals.length > 0) {
        const saved = saveProposals(proposals);
        results.push({ epoch, proposalsStored: saved, status: 'saved' });
      } else {
        results.push({ epoch, proposalsStored: 0, status: 'no_proposals' });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({ 
      success: true, 
      currentEpoch,
      imported: results.length,
      details: results
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
