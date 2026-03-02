export interface ProposalTranslation {
  text: string;
  updatedAt: number;
}

export interface Proposal {
  id: string;
  epoch: number;
  title: string;
  url: string;
  status: number;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  approvalRate: number;
  proposerIdentity: string | null;
  translations: Record<string, ProposalTranslation>;
  contractName?: string;
  contractIndex?: number;
  proposalIndex?: number;
  numberOfOptions?: number;
  proposalType?: string;
  published?: string;
  publishedTick?: number;
  latestVoteTick?: number;
  ballots?: any[];
}

export interface Epoch {
  epoch: number;
  proposalCount: number;
  hasActive: boolean;
}

export const PROPOSAL_STATUS = {
  2: 'Active',
  3: 'Approved',
  4: 'Quorum not reached',
  5: 'Cancelled',
  6: 'Rejected'
} as const;

export type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];
