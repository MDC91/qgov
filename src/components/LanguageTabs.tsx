'use client';

import { LANGUAGES } from '@/types';

interface LanguageTabsProps {
  selectedLang: string;
  availableLangs: string[];
  onSelect: (lang: string) => void;
}

export default function LanguageTabs({ selectedLang, availableLangs, onSelect }: LanguageTabsProps) {
  const buttonsPerRow = 4;
  const rows = [];
  
  for (let i = 0; i < LANGUAGES.length; i += buttonsPerRow) {
    rows.push(LANGUAGES.slice(i, i + buttonsPerRow));
  }

  return (
    <div className="flex flex-col gap-1 overflow-x-auto">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 min-w-0">
          {row.map((lang) => {
            const isAvailable = availableLangs.includes(lang.code);
            const isSelected = selectedLang === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => onSelect(lang.code)}
                disabled={!isAvailable}
                className="flex-1 px-1 md:px-2 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: isSelected ? '#23ffff' : (isAvailable ? '#202e3c' : '#151e27'),
                  color: isSelected ? '#101820' : (isAvailable ? '#ffffff' : '#94a3b8'),
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  opacity: isAvailable ? 1 : 0.5
                }}
              >
                <span className="mr-0.5 md:mr-1">{lang.flag}</span>
                {lang.name}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
