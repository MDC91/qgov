import { createClient } from 'redis';
import { extractTitleFromUrl } from './proposal';

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

export async function getAllStoredEpochs(): Promise<number[]> {
  try {
    const client = await getRedisClient();
    const keys = await client.keys('epoch:*:proposals');
    const epochs: number[] = [];
    
    for (const key of keys) {
      const match = key.match(/^epoch:(\d+):proposals$/);
      if (match) {
        epochs.push(parseInt(match[1], 10));
      }
    }
    
    return epochs.sort((a, b) => b - a);
  } catch (error) {
    console.error('Redis get all epochs error:', error);
    return [];
  }
}

export interface SearchResult {
  epoch: number;
  id: string;
  title: string;
  url: string;
  status: number;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
}

export async function searchAllProposals(query: string, status?: number): Promise<SearchResult[]> {
  try {
    const epochs = await getAllStoredEpochs();
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];
    
    const epochPromises = epochs.map(async (epoch) => {
      const proposals = await getEpochProposals(epoch);
      
      for (const p of proposals) {
        const title = p.title || '';
        const url = p.url || '';
        
        if (queryLower && (title.toLowerCase().includes(queryLower) || url.toLowerCase().includes(queryLower))) {
          let yesVotes = 0;
          let noVotes = 0;
          let totalVotes = 0;
          let pStatus = p.status;
          
          if (p.yesVotes !== undefined) {
            yesVotes = p.yesVotes;
            noVotes = p.noVotes;
            totalVotes = p.totalVotes || 0;
          } else if (p.sumOption0 !== undefined || p.sumOption1 !== undefined) {
            yesVotes = parseInt(p.sumOption1 || '0', 10);
            noVotes = parseInt(p.sumOption0 || '0', 10);
            totalVotes = parseInt(p.totalVotes || '0', 10);
          }
          
          if (status === undefined || pStatus === status) {
            const displayTitle = title || extractTitleFromUrl(url) || 'Untitled Proposal';
            results.push({
              epoch,
              id: p.id?.toString() || p.url,
              title: displayTitle,
              url,
              status: pStatus,
              yesVotes,
              noVotes,
              totalVotes
            });
          }
        }
      }
    });
    
    await Promise.all(epochPromises);
    
    return results;
  } catch (error) {
    console.error('Redis search error:', error);
    return [];
  }
}
