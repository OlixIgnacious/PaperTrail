// PaperTrail Language Selector Component (FR-14)
// Supports English + 15 scheduled Indian languages

import React from 'react';
import { SUPPORTED_LANGUAGES } from '../types/index.ts';
import { Languages } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Languages size={16} color="var(--text-muted)" />
      <select
        value={selectedLanguage}
        onChange={(e) => onSelectLanguage(e.target.value)}
        aria-label="Select translation language"
        style={{
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 8px',
          fontSize: '0.82rem',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name} ({lang.nativeName})
          </option>
        ))}
      </select>
    </div>
  );
};
