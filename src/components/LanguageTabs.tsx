'use client';

import { LANGUAGES } from '@/types';

interface LanguageTabsProps {
  selectedLang: string;
  availableLangs: string[];
  onSelect: (lang: string) => void;
}

export default function LanguageTabs({ selectedLang, availableLangs, onSelect }: LanguageTabsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {LANGUAGES.map((lang) => {
        const isAvailable = availableLangs.includes(lang.code);
        const isSelected = selectedLang === lang.code;

        return (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            disabled={!isAvailable}
            className="flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all min-w-[80px]"
            style={{
              backgroundColor: isSelected ? '#23ffff' : (isAvailable ? '#202e3c' : '#151e27'),
              color: isSelected ? '#101820' : (isAvailable ? '#ffffff' : '#94a3b8'),
              cursor: isAvailable ? 'pointer' : 'not-allowed',
              opacity: isAvailable ? 1 : 0.5
            }}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.name}
          </button>
        );
      })}
    </div>
  );
}
