import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (redisClient) return redisClient;
  
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL not configured');
  }
  
  redisClient = createClient({ url });
  await redisClient.connect();
  return redisClient;
}

interface TranslationEntry {
  text: string;
  updatedAt: number;
}

type ProposalTranslations = Record<string, TranslationEntry>;

const epochPrefix = (epoch: number) => `translations:epoch:${epoch}`;
const epochDataPrefix = (epoch: number) => `epoch:${epoch}`;

export async function getTranslation(epoch: number, proposalId: string, lang: string): Promise<string | null> {
  try {
    const client = await getRedisClient();
    const data = await client.hGet(`${epochPrefix(epoch)}:${proposalId}`, lang);
    if (data) {
      const parsed = JSON.parse(data) as TranslationEntry;
      return parsed.text;
    }
    return null;
  } catch (error) {
    console.error('Redis read error:', error);
    return null;
  }
}

export async function setTranslation(epoch: number, proposalId: string, lang: string, text: string): Promise<void> {
  try {
    const client = await getRedisClient();
    const key = `${epochPrefix(epoch)}:${proposalId}`;
    
    await client.hSet(key, lang, JSON.stringify({
      text,
      updatedAt: Date.now()
    }));
  } catch (error) {
    console.error('Redis write error:', error);
  }
}

export async function getAllTranslations(epoch: number, proposalId: string): Promise<Record<string, TranslationEntry>> {
  try {
    const client = await getRedisClient();
    const data = await client.hGetAll(`${epochPrefix(epoch)}:${proposalId}`);
    const result: Record<string, TranslationEntry> = {};
    for (const [lang, value] of Object.entries(data)) {
      result[lang] = JSON.parse(value);
    }
    return result;
  } catch (error) {
    console.error('Redis read error:', error);
    return {};
  }
}

export async function getProposalList(epoch: number): Promise<string[]> {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(`${epochPrefix(epoch)}:*`);
    return keys.map(k => k.split(':').pop() || '');
  } catch (error) {
    console.error('Redis keys error:', error);
    return [];
  }
}

export async function getEpochProposals(epoch: number): Promise<any[]> {
  try {
    const client = await getRedisClient();
    const data = await client.get(`${epochDataPrefix(epoch)}:proposals`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Redis read epoch proposals error:', error);
    return [];
  }
}

export async function setEpochProposals(epoch: number, proposals: any[]): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.set(`${epochDataPrefix(epoch)}:proposals`, JSON.stringify(proposals));
  } catch (error) {
    console.error('Redis write epoch proposals error:', error);
  }
}
