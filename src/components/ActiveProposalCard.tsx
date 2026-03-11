'use client';

import Link from 'next/link';
import { LANGUAGES } from '@/types';
import { createProposalSlug } from '@/lib/proposal';

interface Translation {
  text: string;
  updatedAt: number;
}

interface ActiveProposalCardProps {
  epoch: number;
  id: string;
  title: string;
  status: number;
  translations: Record<string, Translation>;
}

export default function ActiveProposalCard({ epoch, id, title, status, translations }: ActiveProposalCardProps) {
  const availableLangs = Object.keys(translations);
  const slug = createProposalSlug(title, id);

  return (
    <div
      className="p-4 rounded-lg transition-all"
      style={{ backgroundColor: '#1a2332', border: '1px solid #202e3c' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span 
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: '#23ffff', color: '#0f172a' }}
        >
          Active
        </span>
      </div>
      
      <Link href={`/proposal/${epoch}/${slug}`}>
        <p className="text-sm font-medium mb-3 hover:text-cyan-400 transition-colors" style={{ color: '#ffffff' }}>
          {title || 'Untitled'}
        </p>
      </Link>
      
      {availableLangs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableLangs.map((langCode) => {
            const lang = LANGUAGES.find(l => l.code === langCode);
            if (!lang) return null;
            
            return (
              <Link
                key={langCode}
                href={`/proposal/${epoch}/${slug}/${langCode}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all hover:opacity-80"
                style={{ 
                  backgroundColor: '#202e3c', 
                  color: '#ffffff',
                  border: '1px solid #2d3748'
                }}
              >
                <span>{lang.flag}</span>
                <span className="uppercase">{langCode}</span>
              </Link>
            );
          })}
        </div>
      )}
      
      {availableLangs.length === 0 && (
        <p className="text-xs" style={{ color: '#64748b' }}>
          No translations yet
        </p>
      )}
    </div>
  );
}
