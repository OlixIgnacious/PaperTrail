// PaperTrail Edge Function: Vertical Classifier (FR-5)

export type LegalVertical = 'rental' | 'employment' | 'gig' | 'consumer' | 'challan';

export interface ClassificationResult {
  vertical: LegalVertical;
  confidence: number;
  signals: string[];
}

const VERTICAL_KEYWORDS: Record<LegalVertical, string[]> = {
  rental: [
    'landlord', 'tenant', 'lease', 'rent', 'premises', 'security deposit',
    'tenancy', 'licensor', 'licensee', 'maintenance charges', 'eviction', 'sublet'
  ],
  employment: [
    'employee', 'employer', 'salary', 'probation', 'notice period', 'non-compete',
    'gratuity', 'provident fund', 'termination of employment', 'designation', 'ctc', 'maternity'
  ],
  gig: [
    'delivery partner', 'driver partner', 'aggregator', 'gig worker', 'platform worker',
    'trip fee', 'surge pricing', 'de-platforming', 'account deactivation', 'commission rate'
  ],
  consumer: [
    'consumer', 'deficiency in service', 'defect in goods', 'warranty', 'guarantee',
    'refund', 'unfair trade practice', 'invoice', 'e-commerce', 'cancellation charge'
  ],
  challan: [
    'challan', 'traffic violation', 'motor vehicles act', 'driving license', 'registration certificate',
    'rc', 'speed limit', 'signal jump', 'compounding fee', 'traffic police', 'lok adalat'
  ],
};

export function classifyVertical(text: string): ClassificationResult {
  const normalized = text.toLowerCase();
  const scores: Record<LegalVertical, { count: number; signals: string[] }> = {
    rental: { count: 0, signals: [] },
    employment: { count: 0, signals: [] },
    gig: { count: 0, signals: [] },
    consumer: { count: 0, signals: [] },
    challan: { count: 0, signals: [] },
  };

  for (const [vertical, keywords] of Object.entries(VERTICAL_KEYWORDS) as [LegalVertical, string[]][]) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        scores[vertical].count++;
        scores[vertical].signals.push(kw);
      }
    }
  }

  let topVertical: LegalVertical = 'rental';
  let maxCount = -1;

  for (const [vertical, data] of Object.entries(scores) as [LegalVertical, { count: number; signals: string[] }][]) {
    if (data.count > maxCount) {
      maxCount = data.count;
      topVertical = vertical;
    }
  }

  const totalMatches = Object.values(scores).reduce((acc, curr) => acc + curr.count, 0);
  const confidence = totalMatches > 0 ? Math.min(1.0, maxCount / Math.max(1, totalMatches)) : 0.5;

  return {
    vertical: topVertical,
    confidence: Number(confidence.toFixed(2)),
    signals: scores[topVertical].signals.slice(0, 5),
  };
}
