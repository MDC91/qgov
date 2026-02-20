const AUTH_TOKEN_CACHE = {
  token: null as string | null,
  expiry: 0
};

const EPOCH_CACHE = {
  value: 0,
  expiry: 0
};

const AUTH_URL = 'https://api.qubic.li/Auth/Login';
const PROPOSALS_URL = 'https://api.qubic.li/Voting/Proposal';
const EPOCH_HISTORY_URL = 'https://api.qubic.li/Voting/EpochHistory';
const RPC_URL = 'https://rpc.qubic.org/v1/tick-info';

const AUTH_CREDENTIALS = {
  userName: 'guest@qubic.li',
  password: 'guest13@Qubic.li',
  twofactorCode: ''
};

const CACHE_DURATION = {
  AUTH: 3600 * 1000,
  EPOCH: 5 * 60 * 1000,
};

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
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

export async function getAuthToken(): Promise<string | null> {
  const now = Date.now();
  
  if (AUTH_TOKEN_CACHE.token && now < AUTH_TOKEN_CACHE.expiry) {
    return AUTH_TOKEN_CACHE.token;
  }

  try {
    const response = await fetchWithTimeout(AUTH_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'QGov/1.0',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(AUTH_CREDENTIALS)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.token) {
        AUTH_TOKEN_CACHE.token = data.token;
        AUTH_TOKEN_CACHE.expiry = now + CACHE_DURATION.AUTH;
        return data.token;
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
  }

  return null;
}

export async function getActiveProposals(): Promise<any[]> {
  const token = await getAuthToken();
  if (!token) {
    console.error('No valid auth token');
    return [];
  }

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
      return data.filter((item: any) => item.status === 2);
    }
  } catch (error) {
    console.error('Active proposals error:', error);
  }

  return [];
}

export async function getEpochHistory(epoch: number): Promise<any[]> {
  const token = await getAuthToken();
  if (!token) {
    console.error('No valid auth token');
    return [];
  }

  try {
    const response = await fetchWithTimeout(`${EPOCH_HISTORY_URL}/${epoch}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'QGov/1.0',
        'Accept': '*/*'
      }
    });

    if (response.status === 404) {
      return [];
    }

    if (response.ok) {
      const data = await response.json();
      let items: any[] = [];
      
      if (data.result && Array.isArray(data.result)) {
        items = data.result;
      } else if (Array.isArray(data)) {
        items = data;
      }

      return items.filter((item: any) => [3, 4, 6].includes(item.status));
    }
  } catch (error) {
    console.error(`Epoch history error for epoch ${epoch}:`, error);
  }

  return [];
}

export async function getCurrentEpoch(): Promise<number> {
  const now = Date.now();

  if (now < EPOCH_CACHE.expiry) {
    return EPOCH_CACHE.value;
  }

  try {
    const response = await fetchWithTimeout(RPC_URL, {
      headers: { 'User-Agent': 'QGov/1.0' }
    });

    if (response.ok) {
      const data = await response.json();
      const epochValue = parseInt(data.tickInfo.epoch, 10);
      
      EPOCH_CACHE.value = epochValue;
      EPOCH_CACHE.expiry = now + CACHE_DURATION.EPOCH;
      return epochValue;
    }
  } catch (error) {
    console.error('Current epoch error:', error);
  }

  return EPOCH_CACHE.value;
}
