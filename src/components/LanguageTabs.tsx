'use client';

import { LANGUAGES } from '@/types';

interface LanguageTabsProps {
  selectedLang: string;
  availableLangs: string[];
  onSelect: (lang: string) => void;
}

export default function LanguageTabs({ selectedLang, availableLangs, onSelect }: LanguageTabsProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-1 min-w-max md:min-w-0">
        {LANGUAGES.map((lang) => {
          const isAvailable = availableLangs.includes(lang.code);
          const isSelected = selectedLang === lang.code;

          return (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              disabled={!isAvailable}
              className="flex-1 px-2 py-2 rounded-lg text-xs md:text-sm font-medium transition-all min-w-[70px] md:min-w-0"
              style={{
                backgroundColor: isSelected ? '#23ffff' : (isAvailable ? '#202e3c' : '#151e27'),
                color: isSelected ? '#101820' : (isAvailable ? '#ffffff' : '#94a3b8'),
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                opacity: isAvailable ? 1 : 0.5
              }}
            >
              <span className="mr-1">{lang.flag}</span>
              <span className="hidden sm:inline">{lang.name}</span>
              <span className="sm:hidden">{lang.code.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
