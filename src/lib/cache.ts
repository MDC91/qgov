import { kv } from '@vercel/kv';

interface TranslationEntry {
  text: string;
  updatedAt: number;
}

type ProposalTranslations = Record<string, TranslationEntry>;

const epochPrefix = (epoch: number) => `translations:epoch:${epoch}`;
const epochDataPrefix = (epoch: number) => `epoch:${epoch}`;

export async function getTranslation(epoch: number, proposalId: string, lang: string): Promise<string | null> {
  try {
    const data = await kv.get<ProposalTranslations>(`${epochPrefix(epoch)}:${proposalId}`);
    return data?.[lang]?.text || null;
  } catch (error) {
    console.error('KV read error:', error);
    return null;
  }
}

export async function setTranslation(epoch: number, proposalId: string, lang: string, text: string): Promise<void> {
  try {
    const key = `${epochPrefix(epoch)}:${proposalId}`;
    let data: ProposalTranslations = {};
    
    try {
      const existing = await kv.get<ProposalTranslations>(key);
      if (existing) data = existing;
    } catch {}

    data[lang] = {
      text,
      updatedAt: Date.now()
    };

    await kv.set(key, data);
  } catch (error) {
    console.error('KV write error:', error);
  }
}

export async function getAllTranslations(epoch: number, proposalId: string): Promise<Record<string, TranslationEntry>> {
  try {
    const data = await kv.get<ProposalTranslations>(`${epochPrefix(epoch)}:${proposalId}`);
    return data || {};
  } catch (error) {
    console.error('KV read error:', error);
    return {};
  }
}

export async function getProposalList(epoch: number): Promise<string[]> {
  try {
    const keys = await kv.keys(`${epochPrefix(epoch)}:*`);
    return keys.map((k: string) => k.split(':').pop() || '');
  } catch (error) {
    console.error('KV keys error:', error);
    return [];
  }
}

export async function getEpochProposals(epoch: number): Promise<any[]> {
  try {
    const data = await kv.get<any[]>(`${epochDataPrefix(epoch)}:proposals`);
    return data || [];
  } catch (error) {
    console.error('KV read epoch proposals error:', error);
    return [];
  }
}

export async function setEpochProposals(epoch: number, proposals: any[]): Promise<void> {
  try {
    await kv.set(`${epochDataPrefix(epoch)}:proposals`, proposals);
  } catch (error) {
    console.error('KV write epoch proposals error:', error);
  }
}
