import { NextResponse } from 'next/server';
import { getCurrentEpoch } from '@/lib/qubic-api';
import { saveProposals, getLatestEpoch } from '@/lib/database';

const CRON_SECRET = process.env.CRON_SECRET;

const PROPOSALS_URL = 'https://api.qubic.li/Voting/Proposal';

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
    const storedLatestEpoch = getLatestEpoch();

    let proposals: any[] = [];

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
      console.error(`Error fetching live proposals:`, error);
      return NextResponse.json({ 
        error: 'Failed to fetch proposals',
        currentEpoch,
        storedLatestEpoch
      }, { status: 500 });
    }

    if (proposals.length > 0) {
      const saved = saveProposals(proposals);
      
      if (saved > 0 && process.env.CRON_SECRET) {
        try {
          const translateUrl = `http://localhost:3000/api/cron/translate?current=true&secret=${process.env.CRON_SECRET}`;
          fetch(translateUrl, { signal: AbortSignal.timeout(300000) }).catch(() => {});
        } catch {}
      }
      
      return NextResponse.json({ 
        success: true, 
        currentEpoch,
        storedLatestEpoch,
        proposalsStored: saved,
        proposalCount: proposals.length
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        currentEpoch,
        storedLatestEpoch,
        proposalsStored: 0,
        proposalCount: 0,
        note: 'No active proposals in current epoch'
      });
    }
  } catch (error) {
    console.error('Live import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
