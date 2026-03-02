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

function isWednesday12UTC(): boolean {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  
  const isWednesday = utcDay === 3;
  const isAround12UTC = utcHours === 12 && utcMinutes >= 0 && utcMinutes <= 5;
  
  return isWednesday && isAround12UTC;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && querySecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const forceRun = url.searchParams.get('force') === 'true';
  
  if (!forceRun && !isWednesday12UTC()) {
    return NextResponse.json({ 
      status: 'skipped',
      reason: 'Not in epoch transition window (Wednesday 12:00-12:05 UTC)',
      currentTime: new Date().toISOString()
    });
  }

  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Failed to get auth token' }, { status: 500 });
    }

    const currentEpoch = await getCurrentEpoch();
    const storedLatestEpoch = getLatestEpoch();
    const results: any[] = [];

    if (currentEpoch > storedLatestEpoch) {
      const previousEpoch = storedLatestEpoch;
      
      if (previousEpoch > 0) {
        try {
          const response = await fetchWithTimeout(`${EPOCH_HISTORY_URL}/${previousEpoch}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'User-Agent': 'QGov/1.0',
              'Accept': '*/*'
            }
          });

          if (response.ok) {
            const data = await response.json();
            let items: any[] = [];
            
            if (data.result && Array.isArray(data.result)) {
              items = data.result;
            } else if (Array.isArray(data)) {
              items = data;
            }

            const finalProposals = items.filter((item: any) => [3, 4, 5, 6].includes(item.status));
            
            if (finalProposals.length > 0) {
              const saved = saveProposals(finalProposals);
              results.push({ 
                epoch: previousEpoch, 
                proposalsStored: saved, 
                status: 'saved',
                note: 'Final state captured before epoch transition'
              });
            }
          }
        } catch (error) {
          console.error(`Error capturing previous epoch ${previousEpoch}:`, error);
        }
      }

      try {
        const liveResponse = await fetchWithTimeout(PROPOSALS_URL, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'QGov/1.0',
            'Accept': '*/*'
          }
        });

        if (liveResponse.ok) {
          const data = await liveResponse.json();
          const activeProposals = data.filter((item: any) => item.status === 2);
          
          if (activeProposals.length > 0) {
            const saved = saveProposals(activeProposals);
            results.push({ 
              epoch: currentEpoch, 
              proposalsStored: saved, 
              status: 'saved',
              note: 'New epoch proposals captured'
            });
          }
        }
      } catch (error) {
        console.error(`Error capturing current epoch ${currentEpoch}:`, error);
      }

      return NextResponse.json({ 
        success: true, 
        epochTransition: true,
        currentEpoch,
        previousEpoch: storedLatestEpoch,
        actions: results
      });
    } else {
      return NextResponse.json({ 
        status: 'no_transition',
        currentEpoch,
        storedLatestEpoch,
        currentTime: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Epoch transition error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
