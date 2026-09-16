// PaperTrail Shared TypeScript Types

export type LegalVertical = 'rental' | 'employment' | 'gig' | 'consumer' | 'challan';

export type ClauseCategory =
  | 'payment_terms'
  | 'termination'
  | 'liability'
  | 'penalty'
  | 'dispute_resolution'
  | 'obligations'
  | 'procedural_validity';

export interface Position {
  bbox?: [number, number, number, number]; // [x0, y0, x1, y1] normalized or coordinates
  char_offset?: number;
}

export interface DocumentClause {
  clause_id: string;
  clause_text: string;
  clause_category: ClauseCategory | string;
  page_number: number;
  position: Position;
  embedding?: number[];
}

export interface Citation {
  track: 'document' | 'statute';
  id: string;
  page_number?: number;
  citation_label: string;
  position?: Position;
}

export type VerifierState = 'verified' | 'repaired' | 'unverified';

export interface QAResponse {
  answer: string;
  answer_local: string;
  citations: Citation[];
  confidence: number;
  verifierState: VerifierState;
  vertical: LegalVertical;
  safety: {
    piiRedacted: boolean;
    injectionDetected: boolean;
    redactedCount: {
      aadhaar: number;
      pan: number;
      phone: number;
      bankAccount: number;
    };
  };
  verificationNotes?: string[];
}

export interface RulePackItem {
  rule_id: string;
  vertical: LegalVertical;
  clause_category: ClauseCategory;
  rule_summary: string;
  citation: string;
  risk_if_violated: string;
  source_url?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
];

export interface CitationTarget {
  page_number: number;
  position?: Position;
  label?: string;
}
