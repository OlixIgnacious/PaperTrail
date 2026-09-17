// PaperTrail Functional Document Comparison Engine (FR-9, Use Case 2)
// Real-time algorithmic comparison of two contracts with semantic clause alignment,
// numerical term change detection, rights regression scoring, and statutory impact cross-referencing.

import { DocumentClause, ClauseCategory } from '../types/index.ts';
import { CURATED_RULES } from '../data/curatedRules.ts';

export interface ClauseDiffResult {
  category: string;
  docAClause: string;
  docBClause: string;
  diffType: 'modified' | 'added_in_b' | 'removed_in_b' | 'unchanged';
  shift: 'improved' | 'worsened' | 'neutral';
  commentary: string;
  statutoryReference?: string;
  similarityScore: number;
}

export interface DocumentComparisonSummary {
  docAName: string;
  docBName: string;
  totalClausesA: number;
  totalClausesB: number;
  alignedPairsCount: number;
  addedClausesCount: number;
  removedClausesCount: number;
  worsenedCount: number;
  improvedCount: number;
  neutralCount: number;
  overallRiskShift: 'significantly_worse' | 'slightly_worse' | 'balanced' | 'improved';
  executiveSummary: string;
  diffs: ClauseDiffResult[];
}

/**
 * Tokenizes text, strips common stop words, and returns a set of normalized word tokens.
 */
function tokenize(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'and', 'or', 'to', 'in', 'of', 'for', 'with', 'on', 'at', 'from',
    'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between',
    'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among',
    'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'an',
    'shall', 'will', 'may', 'must', 'party', 'parties', 'agreement', 'clause'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return new Set(words);
}

/**
 * Calculates Jaccard similarity between two token sets.
 */
function calculateJaccardSimilarity(tokensA: Set<string>, tokensB: Set<string>): number {
  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersectionSize = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionSize++;
    }
  }

  const unionSize = tokensA.size + tokensB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

/**
 * Extracts numbers with their immediate surrounding units (e.g. 30 days, 2 months, 20%, Rs. 50,000)
 */
function extractNumericEntities(text: string): Array<{ raw: string; value: number; unit: string }> {
  const entities: Array<{ raw: string; value: number; unit: string }> = [];
  const regex = /(\d+(?:,\d+)*(?:\.\d+)?)\s*(days?|months?|years?|weeks?|hours?|%|percent|rupees?|rs\.?|lakhs?)/gi;
  
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const rawVal = match[1].replace(/,/g, '');
    const num = parseFloat(rawVal);
    const unit = match[2].toLowerCase();
    entities.push({ raw: match[0], value: num, unit });
  }

  return entities;
}

/**
 * Assesses whether changes between clause A and clause B represent a regression or improvement.
 */
function evaluateLegalShift(
  clauseA: string,
  clauseB: string,
  category: string
): { shift: 'improved' | 'worsened' | 'neutral'; commentary: string; statutoryRef?: string } {
  const lowerA = clauseA.toLowerCase();
  const lowerB = clauseB.toLowerCase();

  // Find relevant statutory rule for citation
  const matchingRule = CURATED_RULES.find((r) => 
    r.clause_category.toLowerCase() === category.toLowerCase() ||
    r.rule_summary.toLowerCase().includes(category.toLowerCase())
  );
  const statutoryRef = matchingRule ? `${matchingRule.citation}` : undefined;

  // 1. Notice Period Analysis
  if (category.toLowerCase().includes('terminat') || category.toLowerCase().includes('notice') || lowerA.includes('notice') || lowerB.includes('notice')) {
    const numA = extractNumericEntities(clauseA).find((e) => e.unit.includes('day') || e.unit.includes('month'));
    const numB = extractNumericEntities(clauseB).find((e) => e.unit.includes('day') || e.unit.includes('month'));

    if (numA && numB) {
      // Normalize to days
      const daysA = numA.unit.includes('month') ? numA.value * 30 : numA.value;
      const daysB = numB.unit.includes('month') ? numB.value * 30 : numB.value;

      if (daysB > daysA * 1.5) {
        return {
          shift: 'worsened',
          commentary: `Notice period increased from ${numA.raw} to ${numB.raw}, restricting exit mobility and imposing higher lockout.`,
          statutoryRef: statutoryRef || 'Transfer of Property Act Sec 106 / Contract Act',
        };
      }
      if (daysB < daysA) {
        return {
          shift: 'improved',
          commentary: `Notice period shortened from ${numA.raw} to ${numB.raw}, allowing faster separation.`,
          statutoryRef,
        };
      }
    }

    if (lowerB.includes('forfeit') && !lowerA.includes('forfeit')) {
      return {
        shift: 'worsened',
        commentary: 'Added clause forfeiting salary/deposit upon early departure without judicial mitigation.',
        statutoryRef: statutoryRef || 'Indian Contract Act Sec 74',
      };
    }
  }

  // 2. Security Deposit / Payment Terms
  if (category.toLowerCase().includes('deposit') || category.toLowerCase().includes('payment') || lowerA.includes('deposit') || lowerB.includes('deposit')) {
    const numA = extractNumericEntities(clauseA).find((e) => e.unit.includes('day') || e.unit.includes('month'));
    const numB = extractNumericEntities(clauseB).find((e) => e.unit.includes('day') || e.unit.includes('month'));

    if (numA && numB && (lowerA.includes('refund') || lowerB.includes('refund'))) {
      const daysA = numA.unit.includes('month') ? numA.value * 30 : numA.value;
      const daysB = numB.unit.includes('month') ? numB.value * 30 : numB.value;

      if (daysB > daysA) {
        return {
          shift: 'worsened',
          commentary: `Deposit refund timeline delayed from ${numA.raw} to ${numB.raw}, exceeding Model Tenancy Act norms.`,
          statutoryRef: statutoryRef || 'Model Tenancy Act 2021 Sec 11',
        };
      }
    }

    // Deduction rights expanded
    if ((lowerB.includes('deduct') || lowerB.includes('forfeit') || lowerB.includes('sole discretion')) && !lowerA.includes('sole discretion')) {
      return {
        shift: 'worsened',
        commentary: 'Counterparty granted unilateral discretion to deduct or withhold deposits/settlement funds.',
        statutoryRef,
      };
    }
  }

  // 3. Post-Termination Non-Compete & Restraints
  if (lowerB.includes('non-compete') || lowerB.includes('competing') || lowerB.includes('restrain') || lowerB.includes('not engage')) {
    if (!lowerA.includes('non-compete') && !lowerA.includes('competing')) {
      return {
        shift: 'worsened',
        commentary: 'Introduced post-separation non-compete restraint; legally void under Section 27 of Indian Contract Act 1872.',
        statutoryRef: 'Indian Contract Act 1872, Section 27',
      };
    }
  }

  // 4. Maintenance / Structural Repairs / Liability Shift
  if (lowerB.includes('structural') || lowerB.includes('repair') || lowerB.includes('maintenance')) {
    if (lowerB.includes('tenant shall bear') || lowerB.includes('at sole cost of tenant') || lowerB.includes('100%')) {
      return {
        shift: 'worsened',
        commentary: 'Structural maintenance obligations shifted entirely to tenant in violation of standard tenancy rules.',
        statutoryRef: statutoryRef || 'Model Tenancy Act 2021, Second Schedule',
      };
    }
  }

  // 5. Deactivation / Grievance & Redressal
  if (lowerB.includes('prior notice') || lowerB.includes('written reasons') || lowerB.includes('opportunity to be heard')) {
    if (!lowerA.includes('written reasons') && !lowerA.includes('prior notice')) {
      return {
        shift: 'improved',
        commentary: 'Added mandatory procedural fairness: requires written reasons and advance notice before adverse action.',
        statutoryRef: statutoryRef || 'Rajasthan Gig Workers Act 2023 Sec 13',
      };
    }
  }

  // 6. Insurance Coverage / Worker Welfare
  if (lowerB.includes('insurance') || lowerB.includes('accidental cover') || lowerB.includes('statutory benefit')) {
    if (!lowerA.includes('insurance') || lowerA.includes('voluntary')) {
      return {
        shift: 'improved',
        commentary: 'Introduced non-contributory insurance coverage aligning with worker protection mandates.',
        statutoryRef: statutoryRef || 'Code on Social Security 2020 Sec 114',
      };
    }
  }

  // 7. General unilateral powers
  const regressivePatterns = [
    { pattern: /unilateral/i, label: 'Unilateral modification power granted' },
    { pattern: /without assigning (?:any )?reason/i, label: 'Summary termination without reason permitted' },
    { pattern: /indemnify.*against all/i, label: 'Broad uncapped indemnity obligation imposed' },
    { pattern: /waives? all rights/i, label: 'Express waiver of statutory remedies inserted' },
  ];

  for (const reg of regressivePatterns) {
    if (reg.pattern.test(clauseB) && !reg.pattern.test(clauseA)) {
      return {
        shift: 'worsened',
        commentary: `Rights regression: ${reg.label}.`,
        statutoryRef,
      };
    }
  }

  // If text has minor textual alterations but no adverse legal effect
  return {
    shift: 'neutral',
    commentary: 'Terms updated with stylistic or administrative adjustments without shifting fundamental legal liabilities.',
    statutoryRef,
  };
}

/**
 * Functional comparison engine: Aligns clauses from Document A with Document B,
 * detects changes, added clauses, removed clauses, and computes rights regression.
 */
export function compareDocumentClauses(
  clausesA: DocumentClause[],
  clausesB: DocumentClause[],
  docAName = 'Document A',
  docBName = 'Document B'
): DocumentComparisonSummary {
  const diffs: ClauseDiffResult[] = [];
  const matchedIndicesInB = new Set<number>();

  // For each clause in Doc A, find best matching clause in Doc B
  for (const clauseA of clausesA) {
    const tokensA = tokenize(clauseA.clause_text);
    let bestMatchIdx = -1;
    let highestSim = 0.0;

    for (let j = 0; j < clausesB.length; j++) {
      if (matchedIndicesInB.has(j)) continue;
      const tokensB = tokenize(clausesB[j].clause_text);
      
      let sim = calculateJaccardSimilarity(tokensA, tokensB);
      // Category bonus
      if (clauseA.clause_category === clausesB[j].clause_category) {
        sim += 0.15;
      }

      if (sim > highestSim) {
        highestSim = sim;
        bestMatchIdx = j;
      }
    }

    if (bestMatchIdx !== -1 && highestSim >= 0.22) {
      matchedIndicesInB.add(bestMatchIdx);
      const matchedB = clausesB[bestMatchIdx];
      const isUnchanged = highestSim >= 0.92 && clauseA.clause_text.trim() === matchedB.clause_text.trim();

      const evaluation = isUnchanged
        ? { shift: 'neutral' as const, commentary: 'Identical terms preserved across both versions without alteration.' }
        : evaluateLegalShift(clauseA.clause_text, matchedB.clause_text, clauseA.clause_category);

      diffs.push({
        category: formatCategoryTitle(clauseA.clause_category),
        docAClause: clauseA.clause_text,
        docBClause: matchedB.clause_text,
        diffType: isUnchanged ? 'unchanged' : 'modified',
        shift: evaluation.shift,
        commentary: evaluation.commentary,
        statutoryReference: evaluation.statutoryRef,
        similarityScore: Math.min(1.0, Math.round(highestSim * 100) / 100),
      });
    } else {
      // Clause was in Doc A but removed in Doc B
      const evalRemoved = evaluateLegalShift(clauseA.clause_text, '', clauseA.clause_category);
      diffs.push({
        category: formatCategoryTitle(clauseA.clause_category),
        docAClause: clauseA.clause_text,
        docBClause: '[Clause omitted / removed in revised document]',
        diffType: 'removed_in_b',
        shift: evalRemoved.shift === 'neutral' ? 'worsened' : evalRemoved.shift,
        commentary: `Protective clause present in ${docAName} was omitted in ${docBName}, stripping explicit safeguards.`,
        statutoryReference: evalRemoved.statutoryRef,
        similarityScore: 0.0,
      });
    }
  }

  // Any unmatched clauses in Doc B are newly added clauses
  for (let j = 0; j < clausesB.length; j++) {
    if (!matchedIndicesInB.has(j)) {
      const addedB = clausesB[j];
      const evalAdded = evaluateLegalShift('', addedB.clause_text, addedB.clause_category);
      const shift = addedB.clause_text.toLowerCase().includes('penalty') || 
                    addedB.clause_text.toLowerCase().includes('non-compete') ||
                    addedB.clause_text.toLowerCase().includes('forfeit')
        ? 'worsened'
        : evalAdded.shift;

      diffs.push({
        category: formatCategoryTitle(addedB.clause_category),
        docAClause: `[Not present in ${docAName}]`,
        docBClause: addedB.clause_text,
        diffType: 'added_in_b',
        shift,
        commentary: shift === 'worsened'
          ? `Stealth obligation inserted in ${docBName} that did not exist in ${docAName}.`
          : `New clause introduced specifying terms for ${formatCategoryTitle(addedB.clause_category)}.`,
        statutoryReference: evalAdded.statutoryRef,
        similarityScore: 0.0,
      });
    }
  }

  // Calculate high-level metrics
  const worsenedCount = diffs.filter((d) => d.shift === 'worsened').length;
  const improvedCount = diffs.filter((d) => d.shift === 'improved').length;
  const neutralCount = diffs.filter((d) => d.shift === 'neutral').length;
  const alignedPairsCount = diffs.filter((d) => d.diffType === 'modified' || d.diffType === 'unchanged').length;
  const addedClausesCount = diffs.filter((d) => d.diffType === 'added_in_b').length;
  const removedClausesCount = diffs.filter((d) => d.diffType === 'removed_in_b').length;

  let overallRiskShift: DocumentComparisonSummary['overallRiskShift'] = 'balanced';
  if (worsenedCount >= improvedCount + 2) {
    overallRiskShift = 'significantly_worse';
  } else if (worsenedCount > improvedCount) {
    overallRiskShift = 'slightly_worse';
  } else if (improvedCount > worsenedCount) {
    overallRiskShift = 'improved';
  }

  const executiveSummary = generateComparisonExecutiveSummary({
    docAName,
    docBName,
    worsenedCount,
    improvedCount,
    neutralCount,
    addedClausesCount,
    removedClausesCount,
    overallRiskShift,
  });

  return {
    docAName,
    docBName,
    totalClausesA: clausesA.length,
    totalClausesB: clausesB.length,
    alignedPairsCount,
    addedClausesCount,
    removedClausesCount,
    worsenedCount,
    improvedCount,
    neutralCount,
    overallRiskShift,
    executiveSummary,
    diffs,
  };
}

function formatCategoryTitle(category: ClauseCategory | string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function generateComparisonExecutiveSummary(data: {
  docAName: string;
  docBName: string;
  worsenedCount: number;
  improvedCount: number;
  neutralCount: number;
  addedClausesCount: number;
  removedClausesCount: number;
  overallRiskShift: DocumentComparisonSummary['overallRiskShift'];
}): string {
  const parts: string[] = [];

  if (data.overallRiskShift === 'significantly_worse') {
    parts.push(
      `Analysis reveals a critical risk-shift in "${data.docBName}" compared to "${data.docAName}". ` +
      `${data.worsenedCount} clause(s) regress consumer rights or increase liabilities.`
    );
  } else if (data.overallRiskShift === 'slightly_worse') {
    parts.push(
      `"${data.docBName}" introduces moderate adverse changes compared to "${data.docAName}", ` +
      `with ${data.worsenedCount} worsened term(s) and ${data.improvedCount} improved term(s).`
    );
  } else if (data.overallRiskShift === 'improved') {
    parts.push(
      `"${data.docBName}" provides stronger legal safeguards than "${data.docAName}", ` +
      `with ${data.improvedCount} favorable clause revisions.`
    );
  } else {
    parts.push(
      `The two documents are largely balanced with ${data.neutralCount} neutral/aligned clause(s), ` +
      `maintaining equivalent legal risk levels.`
    );
  }

  if (data.addedClausesCount > 0) {
    parts.push(`${data.addedClausesCount} newly inserted clause(s) require close review.`);
  }
  if (data.removedClausesCount > 0) {
    parts.push(`${data.removedClausesCount} protective clause(s) from the baseline document were omitted.`);
  }

  return parts.join(' ');
}
