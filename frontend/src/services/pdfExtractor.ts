// PaperTrail Document Clause Extractor (Client-side bridge)
// Extracts text with page numbers and positional metadata (session-scoped, Zero Persistence NFR-1)

import { DocumentClause, ClauseCategory } from '../types/index.ts';

export async function extractClausesFromText(rawText: string, _fileName: string): Promise<DocumentClause[]> {
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  return paragraphs.map((text, idx) => {
    const category = categorizeClauseText(text);
    return {
      clause_id: `CL_${idx + 1}`,
      clause_text: text,
      clause_category: category,
      page_number: Math.floor(idx / 4) + 1, // rough page estimation for plain text
      position: {
        char_offset: idx * 150,
      },
    };
  });
}

export function categorizeClauseText(text: string): ClauseCategory {
  const lower = text.toLowerCase();
  if (lower.includes('rent') || lower.includes('deposit') || lower.includes('payment') || lower.includes('salary') || lower.includes('fee')) {
    return 'payment_terms';
  }
  if (lower.includes('terminate') || lower.includes('notice') || lower.includes('quit') || lower.includes('reliev')) {
    return 'termination';
  }
  if (lower.includes('liable') || lower.includes('indemn') || lower.includes('damage') || lower.includes('loss')) {
    return 'liability';
  }
  if (lower.includes('penalty') || lower.includes('fine') || lower.includes('deduct') || lower.includes('forfeit')) {
    return 'penalty';
  }
  if (lower.includes('court') || lower.includes('arbitrat') || lower.includes('jurisdiction') || lower.includes('dispute')) {
    return 'dispute_resolution';
  }
  if (lower.includes('valid') || lower.includes('stamp') || lower.includes('notar') || lower.includes('regist')) {
    return 'procedural_validity';
  }
  return 'obligations';
}
