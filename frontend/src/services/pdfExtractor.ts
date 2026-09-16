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

export async function extractClausesFromPdfFile(file: File): Promise<{
  clauses: DocumentClause[];
  detectedVertical: LegalVertical;
}> {
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
  return { clauses, detectedVertical };
}

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

