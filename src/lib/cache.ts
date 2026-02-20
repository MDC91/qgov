import { kv } from '@vercel/kv';

interface TranslationEntry {
  text: string;
  updatedAt: number;
}

type ProposalTranslations = Record<string, TranslationEntry>;

const epochPrefix = (epoch: number) => `translations:epoch:${epoch}`;

export function getTranslation(epoch: number, proposalId: string, lang: string): string | null {
  try {
    const data = kv.get<ProposalTranslations>(`${epochPrefix(epoch)}:${proposalId}`);
    return data?.[lang]?.text || null;
  } catch (error) {
    console.error('KV read error:', error);
    return null;
  }
}

export function setTranslation(epoch: number, proposalId: string, lang: string, text: string): void {
  try {
    const key = `${epochPrefix(epoch)}:${proposalId}`;
    let data: ProposalTranslations = {};
    
    try {
      const existing = kv.get<ProposalTranslations>(key);
      if (existing) data = existing;
    } catch {}

    data[lang] = {
      text,
      updatedAt: Date.now()
    };

    kv.set(key, data);
  } catch (error) {
    console.error('KV write error:', error);
  }
}

export function getAllTranslations(epoch: number, proposalId: string): Record<string, TranslationEntry> {
  try {
    const data = kv.get<ProposalTranslations>(`${epochPrefix(epoch)}:${proposalId}`);
    return data || {};
  } catch (error) {
    console.error('KV read error:', error);
    return {};
  }
}

export function getProposalList(epoch: number): string[] {
  try {
    const keys = kv.keys(`${epochPrefix(epoch)}:*`);
    return keys.map((k: string) => k.split(':').pop() || '');
  } catch (error) {
    console.error('KV keys error:', error);
    return [];
  }
}
