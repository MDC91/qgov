import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'translations');

interface TranslationEntry {
  text: string;
  updatedAt: number;
}

type ProposalTranslations = Record<string, TranslationEntry>;
type EpochCache = Record<string, ProposalTranslations>;

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCacheFilePath(epoch: number): string {
  return path.join(CACHE_DIR, `epoch-${epoch}.json`);
}

export function getTranslation(epoch: number, proposalId: string, lang: string): string | null {
  try {
    const cachePath = getCacheFilePath(epoch);
    if (!fs.existsSync(cachePath)) {
      return null;
    }
    const data: EpochCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    return data[proposalId]?.[lang]?.text || null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export function setTranslation(epoch: number, proposalId: string, lang: string, text: string): void {
  try {
    ensureCacheDir();
    const cachePath = getCacheFilePath(epoch);
    
    let data: EpochCache = {};
    if (fs.existsSync(cachePath)) {
      data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }

    if (!data[proposalId]) {
      data[proposalId] = {};
    }

    data[proposalId][lang] = {
      text,
      updatedAt: Date.now()
    };

    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export function getAllTranslations(epoch: number, proposalId: string): Record<string, TranslationEntry> {
  try {
    const cachePath = getCacheFilePath(epoch);
    if (!fs.existsSync(cachePath)) {
      return {};
    }
    const data: EpochCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    return data[proposalId] || {};
  } catch (error) {
    console.error('Cache read error:', error);
    return {};
  }
}

export function getProposalList(epoch: number): string[] {
  try {
    const cachePath = getCacheFilePath(epoch);
    if (!fs.existsSync(cachePath)) {
      return [];
    }
    const data: EpochCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    return Object.keys(data);
  } catch (error) {
    console.error('Cache read error:', error);
    return [];
  }
}
