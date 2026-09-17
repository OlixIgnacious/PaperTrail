// PaperTrail Document Clause Extractor (Client-side bridge)
// Extracts text with page numbers and positional metadata (session-scoped, Zero Persistence NFR-1)

import { pdfjs } from 'react-pdf';
import { DocumentClause, ClauseCategory, LegalVertical } from '../types/index.ts';

export function detectVerticalFromText(text: string): LegalVertical {
  const lower = text.toLowerCase();
  if (lower.includes('challan') || lower.includes('traffic') || lower.includes('motor vehicle') || lower.includes('morth') || lower.includes('speeding')) {
    return 'challan';
  }
  if (lower.includes('gig') || lower.includes('delivery partner') || lower.includes('aggregator') || lower.includes('payout') || lower.includes('deactivation')) {
    return 'gig';
  }
  if (lower.includes('warranty') || lower.includes('consumer') || lower.includes('defective') || lower.includes('replacement') || lower.includes('merchant')) {
    return 'consumer';
  }
  if (lower.includes('employee') || lower.includes('employment') || lower.includes('salary') || lower.includes('non-compete') || lower.includes('probation') || lower.includes('ctc')) {
    return 'employment';
  }
  return 'rental';
}

// Session-scoped in-memory extraction cache (Efficiency: 0ms re-extraction, Zero Persistence NFR-1)
const pdfExtractionCache = new Map<string, { clauses: DocumentClause[]; detectedVertical: LegalVertical }>();
const textExtractionCache = new Map<string, DocumentClause[]>();

export async function extractClausesFromPdfFile(file: File): Promise<{
  clauses: DocumentClause[];
  detectedVertical: LegalVertical;
}> {
  const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
  if (pdfExtractionCache.has(cacheKey)) {
    return pdfExtractionCache.get(cacheKey)!;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const clauses: DocumentClause[] = [];
  let fullText = '';
  let globalClauseIdx = 1;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    const items = textContent.items as Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
    }>;

    if (!items || items.length === 0) continue;

    let currentBlockText = '';
    let minX = 1.0;
    let minY = 1.0;
    let maxX = 0.0;
    let maxY = 0.0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.str || !item.str.trim()) continue;

      const tx = item.transform[4];
      const ty = item.transform[5];
      const itemH = item.height || 10;
      const itemW = item.width || 20;

      const normX0 = Math.max(0, Math.min(1, tx / pageWidth));
      const normY0 = Math.max(0, Math.min(1, (pageHeight - (ty + itemH)) / pageHeight));
      const normX1 = Math.max(0, Math.min(1, (tx + itemW) / pageWidth));
      const normY1 = Math.max(0, Math.min(1, (pageHeight - ty) / pageHeight));

      if (normX0 < minX) minX = normX0;
      if (normY0 < minY) minY = normY0;
      if (normX1 > maxX) maxX = normX1;
      if (normY1 > maxY) maxY = normY1;

      currentBlockText += (currentBlockText ? ' ' : '') + item.str.trim();

      const isHeading = /^[0-9]+[\.\)]\s+[A-Z\s]+/.test(item.str.trim());
      const nextItem = items[i + 1];
      const isLineBreak = nextItem && Math.abs(nextItem.transform[5] - ty) > itemH * 1.5;

      if ((currentBlockText.length > 80 && isLineBreak) || (isHeading && currentBlockText.length > 30)) {
        clauses.push({
          clause_id: `CL_${globalClauseIdx++}`,
          clause_text: currentBlockText,
          clause_category: categorizeClauseText(currentBlockText),
          page_number: pageNum,
          position: {
            bbox: [
              Math.max(0.02, minX - 0.01),
              Math.max(0.02, minY - 0.01),
              Math.min(0.98, maxX + 0.01),
              Math.min(0.98, maxY + 0.01),
            ],
          },
        });
        fullText += currentBlockText + '\n';
        currentBlockText = '';
        minX = 1.0;
        minY = 1.0;
        maxX = 0.0;
        maxY = 0.0;
      }
    }

    if (currentBlockText.trim().length > 15) {
      clauses.push({
        clause_id: `CL_${globalClauseIdx++}`,
        clause_text: currentBlockText,
        clause_category: categorizeClauseText(currentBlockText),
        page_number: pageNum,
        position: {
          bbox: [
            Math.max(0.02, minX - 0.01),
            Math.max(0.02, minY - 0.01),
            Math.min(0.98, maxX + 0.01),
            Math.min(0.98, maxY + 0.01),
          ],
        },
      });
      fullText += currentBlockText + '\n';
    }
  }

  const detectedVertical = detectVerticalFromText(fullText);
  const result = { clauses, detectedVertical };
  pdfExtractionCache.set(cacheKey, result);
  return result;
}

export async function extractClausesFromText(rawText: string, _fileName: string): Promise<DocumentClause[]> {
  const cacheKey = `${rawText.length}_${rawText.slice(0, 100)}`;
  if (textExtractionCache.has(cacheKey)) {
    return textExtractionCache.get(cacheKey)!;
  }

  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const result = paragraphs.map((text, idx) => {
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

  textExtractionCache.set(cacheKey, result);
  return result;
}

interface SemanticCategoryProfile {
  category: ClauseCategory;
  primaryTokens: Array<{ term: string; weight: number }>;
  contextualPatterns: RegExp[];
}

const SEMANTIC_PROFILES: SemanticCategoryProfile[] = [
  {
    category: 'payment_terms',
    primaryTokens: [
      { term: 'rent', weight: 4 },
      { term: 'deposit', weight: 4 },
      { term: 'salary', weight: 4 },
      { term: 'remuneration', weight: 4 },
      { term: 'consideration', weight: 3 },
      { term: 'arrears', weight: 3 },
      { term: 'payout', weight: 3 },
      { term: 'gratuity', weight: 4 },
      { term: 'ctc', weight: 3 },
      { term: 'compensation', weight: 3 },
      { term: 'reimbursement', weight: 3 },
      { term: 'escrow', weight: 4 },
    ],
    contextualPatterns: [
      /payable\s+(?:on|by|before)\s+the\s+\d+/i,
      /(?:security\s+deposit|earnest\s+money)\s+(?:of|amounting|refundable)/i,
      /per\s+(?:month|annum|mensem|diem)/i,
      /(?:gross|basic)\s+(?:salary|pay|emoluments)/i,
    ],
  },
  {
    category: 'termination',
    primaryTokens: [
      { term: 'terminate', weight: 4 },
      { term: 'termination', weight: 4 },
      { term: 'notice period', weight: 5 },
      { term: 'vacate', weight: 4 },
      { term: 'relieve', weight: 4 },
      { term: 'resignation', weight: 4 },
      { term: 'severance', weight: 4 },
      { term: 'separation', weight: 3 },
      { term: 'handover', weight: 3 },
      { term: 'eviction', weight: 4 },
      { term: 'expiry', weight: 3 },
    ],
    contextualPatterns: [
      /(?:written\s+notice\s+of|\d+\s+days?\s+notice)/i,
      /terminate\s+this\s+agreement/i,
      /(?:vacate|hand\s*over)\s+(?:the\s+premises|peaceful\s+possession)/i,
      /without\s+assigning\s+(?:any\s+)?reasons?/i,
    ],
  },
  {
    category: 'liability',
    primaryTokens: [
      { term: 'indemnify', weight: 5 },
      { term: 'indemnity', weight: 5 },
      { term: 'hold harmless', weight: 5 },
      { term: 'liability', weight: 4 },
      { term: 'damages', weight: 3 },
      { term: 'structural', weight: 4 },
      { term: 'waterproofing', weight: 4 },
      { term: 'negligence', weight: 4 },
      { term: 'repair', weight: 3 },
      { term: 'defective', weight: 3 },
    ],
    contextualPatterns: [
      /indemnif(?:y|ication)\s+(?:and\s+keep\s+indemnified|against\s+all)/i,
      /limitation\s+of\s+liability/i,
      /structural\s+(?:repairs?|defects?|alterations?)/i,
      /shall\s+not\s+be\s+(?:liable|responsible)\s+for/i,
    ],
  },
  {
    category: 'penalty',
    primaryTokens: [
      { term: 'penalty', weight: 5 },
      { term: 'liquidated damages', weight: 5 },
      { term: 'forfeit', weight: 4 },
      { term: 'forfeiture', weight: 4 },
      { term: 'interest on default', weight: 5 },
      { term: 'late fee', weight: 4 },
      { term: 'penal interest', weight: 5 },
      { term: 'deduction', weight: 2 },
      { term: 'non-compete', weight: 4 },
      { term: 'lock-in', weight: 4 },
    ],
    contextualPatterns: [
      /subject\s+to\s+a\s+penalty/i,
      /liquidated\s+damages/i,
      /(?:forfeiture|forfeit)\s+of\s+(?:entire\s+deposit|security|dues)/i,
      /interest\s+(?:at|@)\s+\d+%/i,
      /lock-in\s+period/i,
    ],
  },
  {
    category: 'dispute_resolution',
    primaryTokens: [
      { term: 'arbitration', weight: 5 },
      { term: 'arbitrator', weight: 5 },
      { term: 'jurisdiction', weight: 4 },
      { term: 'tribunal', weight: 4 },
      { term: 'mediation', weight: 4 },
      { term: 'conciliation', weight: 4 },
      { term: 'exclusive jurisdiction', weight: 5 },
      { term: 'rent authority', weight: 5 },
    ],
    contextualPatterns: [
      /arbitration\s+and\s+conciliation\s+act/i,
      /sole\s+arbitrator/i,
      /exclusive\s+jurisdiction\s+of\s+the\s+courts/i,
      /disputes?\s+arising\s+out\s+of\s+or\s+in\s+connection/i,
      /rent\s+tribunal\s+at/i,
    ],
  },
  {
    category: 'procedural_validity',
    primaryTokens: [
      { term: 'stamp duty', weight: 5 },
      { term: 'notarized', weight: 4 },
      { term: 'registration', weight: 4 },
      { term: 'sub-registrar', weight: 5 },
      { term: 'attestation', weight: 4 },
      { term: 'stamp paper', weight: 4 },
      { term: 'witnesses', weight: 3 },
      { term: 'in witness whereof', weight: 5 },
    ],
    contextualPatterns: [
      /indian\s+stamp\s+act/i,
      /registered\s+(?:under|with)\s+(?:the\s+sub-registrar|registration\s+act)/i,
      /in\s+witness\s+whereof/i,
      /signed,\s+sealed\s+and\s+delivered/i,
    ],
  },
  {
    category: 'obligations',
    primaryTokens: [
      { term: 'covenant', weight: 4 },
      { term: 'undertaking', weight: 4 },
      { term: 'confidentiality', weight: 4 },
      { term: 'quiet enjoyment', weight: 5 },
      { term: 'inspection', weight: 3 },
      { term: 'compliance', weight: 3 },
    ],
    contextualPatterns: [
      /tenant\s+(?:covenants|undertakes|agrees)\s+to/i,
      /employee\s+shall\s+(?:devote|perform|observe)/i,
      /quiet\s+and\s+peaceable\s+possession/i,
      /non-disclosure\s+of\s+confidential/i,
    ],
  },
];

/**
 * Semantic multi-token concept classifier with obligation syntax pattern evaluation.
 * Evaluates semantic relevance scores across categories rather than naive substring matching.
 */
export function categorizeClauseText(text: string): ClauseCategory {
  const lower = text.toLowerCase();
  let bestCategory: ClauseCategory = 'obligations';
  let highestScore = 0;

  for (const profile of SEMANTIC_PROFILES) {
    let score = 0;

    // 1. Primary concept token matches with specific weights
    for (const token of profile.primaryTokens) {
      if (lower.includes(token.term)) {
        score += token.weight;
      }
    }

    // 2. Syntactic & contextual legal obligation patterns (boost factor: 6)
    for (const pattern of profile.contextualPatterns) {
      if (pattern.test(text)) {
        score += 6;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestCategory = profile.category;
    }
  }

  // Fallback to obligations if score threshold is below minimum confidence
  return highestScore >= 2 ? bestCategory : 'obligations';
}

