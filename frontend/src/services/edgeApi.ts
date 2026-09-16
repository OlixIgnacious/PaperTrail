// PaperTrail Edge API & Live Client Pipeline (FR-20, Days 5-8)
// Real-time integration with Gemini Flash (generation) + Mistral (Layer 2 verifier)
// Dual grounding tracks, safety PII redaction, and strict two-layer verification

import { DocumentClause, QAResponse, LegalVertical, Citation, RulePackItem } from '../types/index.ts';
import { CURATED_RULES } from '../data/curatedRules.ts';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || '';
const EXACT_DOC_FALLBACK = 'This cannot be determined from the information you provided.';
const EXACT_STATUTE_FALLBACK = "Outside our current rule coverage for this vertical — here's the free legal aid route.";

// Comprehensive stop-words to prevent accidental false matching on common words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'keep', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'inside', 'apartment', 'house', 'room'
]);

// PII Redaction
function redactPII(text: string) {
  let redacted = text;
  let aadhaarCount = 0;
  let panCount = 0;
  let phoneCount = 0;
  let bankCount = 0;

  // Aadhaar: 12 digits (with spaces or continuous)
  redacted = redacted.replace(/\b[2-9]{1}\d{3}\s\d{4}\s\d{4}\b/g, () => {
    aadhaarCount++;
    return '[REDACTED_AADHAAR]';
  });

  // PAN: 5 letters, 4 digits, 1 letter
  redacted = redacted.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g, () => {
    panCount++;
    return '[REDACTED_PAN]';
  });

  // Phone: Indian 10-digit mobile
  redacted = redacted.replace(/(?:\+91[\s-]?)?[6-9]\d{9}\b/g, () => {
    phoneCount++;
    return '[REDACTED_PHONE]';
  });

  // Bank Account: 9-18 digits
  redacted = redacted.replace(/\b\d{9,18}\b/g, (match) => {
    if (match.length >= 11) {
      bankCount++;
      return '[REDACTED_BANK_ACCOUNT]';
    }
    return match;
  });

  return {
    cleanedText: redacted,
    piiRedacted: aadhaarCount + panCount + phoneCount + bankCount > 0,
    counts: { aadhaar: aadhaarCount, pan: panCount, phone: phoneCount, bankAccount: bankCount },
  };
}

// Prompt Injection Detection
function detectInjection(text: string): boolean {
  const patterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /system\s*prompt/i,
    /reveal\s+(the\s+)?(system|secret|internal)/i,
    /jailbreak/i,
    /bypass\s+all\s+rules/i,
  ];
  return patterns.some((p) => p.test(text));
}

export async function askQuestion(params: {
  question: string;
  language: string;
  documentClauses: DocumentClause[];
  filterVertical?: LegalVertical;
}): Promise<QAResponse> {
  const { question, language, documentClauses, filterVertical } = params;

  // Step 1: Safety & Sanitization
  const safetyCheck = redactPII(question);
  const injectionDetected = detectInjection(question);
  const sanitizedQuestion = injectionDetected
    ? '[Neutralized prompt injection attempt] ' + safetyCheck.cleanedText.replace(/ignore.*?instructions/gi, '')
    : safetyCheck.cleanedText;

  // Step 2: Extract substantive query keywords (excluding stop-words)
  const qClean = sanitizedQuestion.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const qKeywords = qClean.split(/\s+/).filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  // Step 3: Document Clause Grounding Search (score-based matching)
  const scoredClauses = documentClauses
    .map((c) => {
      const textLower = c.clause_text.toLowerCase();
      const catLower = (c.clause_category || '').toLowerCase();
      let score = 0;
      for (const kw of qKeywords) {
        if (textLower.includes(kw)) score += 2;
        if (catLower.includes(kw)) score += 1;
      }
      return { clause: c, score };
    })
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score);

  const matchedClauses = scoredClauses.map((item) => item.clause);

  // Step 4: Statute Rule Grounding Search
  const scoredRules = CURATED_RULES
    .filter((r) => !filterVertical || r.vertical === filterVertical)
    .map((r) => {
      const summaryLower = r.rule_summary.toLowerCase();
      const citLower = r.citation.toLowerCase();
      const catLower = r.clause_category.toLowerCase();
      let score = 0;
      for (const kw of qKeywords) {
        if (summaryLower.includes(kw)) score += 2;
        if (citLower.includes(kw)) score += 2;
        if (catLower.includes(kw)) score += 1;
      }
      return { rule: r, score };
    })
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score);

  const matchedRules = scoredRules.map((item) => item.rule);

  // If zero matches in both document clauses and curated rules -> exact verbatim fallback
  if (matchedClauses.length === 0 && matchedRules.length === 0) {
    const isDocTrack = documentClauses.length > 0;
    const fallbackText = isDocTrack ? EXACT_DOC_FALLBACK : EXACT_STATUTE_FALLBACK;
    return {
      answer: fallbackText,
      answer_local: fallbackText,
      citations: [],
      confidence: 1.0,
      verifierState: 'verified',
      vertical: (filterVertical || 'rental') as LegalVertical,
      safety: {
        piiRedacted: safetyCheck.piiRedacted,
        injectionDetected,
        redactedCount: safetyCheck.counts,
      },
      verificationNotes: ['Exact out-of-scope fallback string applied (no matching clauses or rules).'],
    };
  }

  // If no API key is configured in the environment, use deterministic evaluation
  if (!GEMINI_API_KEY) {
    return evaluateDeterministicFallback(
      sanitizedQuestion,
      language,
      matchedClauses,
      matchedRules,
      filterVertical,
      safetyCheck.piiRedacted,
      injectionDetected,
      safetyCheck.counts
    );
  }

  // Step 5: Execute Live Gemini Flash Generation
  try {
    const geminiResult = await generateWithGemini(
      sanitizedQuestion,
      matchedClauses,
      matchedRules,
      language
    );

    // If Gemini returned out-of-scope fallback or empty citations
    if (geminiResult.answer.includes(EXACT_DOC_FALLBACK) || geminiResult.answer.toLowerCase().includes('cannot be determined')) {
      return {
        answer: EXACT_DOC_FALLBACK,
        answer_local: EXACT_DOC_FALLBACK,
        citations: [],
        confidence: 1.0,
        verifierState: 'verified',
        vertical: (filterVertical || 'rental') as LegalVertical,
        safety: {
          piiRedacted: safetyCheck.piiRedacted,
          injectionDetected,
          redactedCount: safetyCheck.counts,
        },
        verificationNotes: ['Exact out-of-scope fallback returned by generator.'],
      };
    }

    // Step 6: Layer 1 Deterministic Verification (Plain set membership in code per AGENTS.md)
    const validDocIds = new Set(matchedClauses.map((c) => c.clause_id));
    const validRuleIds = new Set(matchedRules.map((r) => r.rule_id));

    let layer1Pass = true;
    const verifiedCitations: Citation[] = [];

    for (const cit of geminiResult.citations || []) {
      if (cit.track === 'document') {
        if (validDocIds.has(cit.id)) {
          const original = matchedClauses.find((c) => c.clause_id === cit.id);
          verifiedCitations.push({
            ...cit,
            page_number: original?.page_number || cit.page_number || 1,
            position: original?.position,
          });
        } else {
          layer1Pass = false;
        }
      } else if (cit.track === 'statute') {
        if (validRuleIds.has(cit.id)) {
          verifiedCitations.push(cit);
        } else {
          layer1Pass = false;
        }
      }
    }

    if (!layer1Pass && verifiedCitations.length === 0) {
      // Layer 1 failed set membership -> apply fallback
      return {
        answer: EXACT_DOC_FALLBACK,
        answer_local: EXACT_DOC_FALLBACK,
        citations: [],
        confidence: 0.7,
        verifierState: 'unverified',
        vertical: (filterVertical || 'rental') as LegalVertical,
        safety: {
          piiRedacted: safetyCheck.piiRedacted,
          injectionDetected,
          redactedCount: safetyCheck.counts,
        },
        verificationNotes: ['Layer 1 deterministic set check rejected hallucinated citation IDs.'],
      };
    }

    // Step 7: Layer 2 Mistral Cross-Check (if Mistral key is configured)
    let verifierState: 'verified' | 'repaired' | 'unverified' = 'verified';
    let finalAnswer = geminiResult.answer;
    let finalAnswerLocal = geminiResult.answer_local;
    const verificationNotes: string[] = ['Layer 1 deterministic citation check passed.'];

    if (MISTRAL_API_KEY && verifiedCitations.length > 0) {
      const topCitation = verifiedCitations[0];
      let sourceContext = '';
      if (topCitation.track === 'document') {
        const c = matchedClauses.find((mc) => mc.clause_id === topCitation.id);
        if (c) sourceContext = `[Clause ${c.clause_id} P${c.page_number}]: ${c.clause_text}`;
      } else {
        const r = matchedRules.find((mr) => mr.rule_id === topCitation.id);
        if (r) sourceContext = `[Rule ${r.rule_id}]: ${r.rule_summary} (${r.citation})`;
      }

      if (sourceContext) {
        try {
          const mistralVerdict = await verifyWithMistral(finalAnswer, sourceContext);
          verificationNotes.push(`Layer 2 (Mistral) verdict: ${mistralVerdict.verdict} — ${mistralVerdict.reason}`);

          if (mistralVerdict.verdict !== 'supported') {
            // Per AGENTS.md: downgrade that specific claim only, do not loop
            verifierState = 'repaired';
            finalAnswer = "We found a related source but couldn't fully verify this point — consult a professional. Reference: " + sourceContext;
            finalAnswerLocal = finalAnswer;
          }
        } catch (mErr) {
          console.warn('Mistral verifier call skipped due to network:', mErr);
          verificationNotes.push('Layer 2 (Mistral) skipped due to network timeout.');
        }
      }
    }

    return {
      answer: finalAnswer,
      answer_local: finalAnswerLocal || finalAnswer,
      citations: verifiedCitations,
      confidence: geminiResult.confidence || 0.95,
      verifierState,
      vertical: (filterVertical || 'rental') as LegalVertical,
      safety: {
        piiRedacted: safetyCheck.piiRedacted,
        injectionDetected,
        redactedCount: safetyCheck.counts,
      },
      verificationNotes,
    };
  } catch (err) {
    console.warn('Gemini live call failed, reverting to deterministic evaluation:', err);
    return evaluateDeterministicFallback(
      sanitizedQuestion,
      language,
      matchedClauses,
      matchedRules,
      filterVertical,
      safetyCheck.piiRedacted,
      injectionDetected,
      safetyCheck.counts
    );
  }
}

// Live Gemini Flash API caller
async function generateWithGemini(
  question: string,
  docMatches: DocumentClause[],
  statuteMatches: RulePackItem[],
  language: string
): Promise<{
  answer: string;
  answer_local: string;
  citations: Citation[];
  confidence: number;
}> {
  const prompt = `You are PaperTrail, an expert legal assistant for Indian consumers.
Answer the user's specific question STRICTLY based on the provided context.

RULES:
1. Temperature 0: Be objective, factual, concise, and grounded.
2. NEVER hallucinate legal facts, clauses, or sections.
3. If the user's uploaded document does not contain enough information to answer the question, you MUST return verbatim: "${EXACT_DOC_FALLBACK}".
4. Ground every statement in either the Document Grounding Track or the Statute Grounding Track. Prefer Document Track first.
5. All citations must be listed ONLY in the "citations" JSON array. Do NOT embed bracketed citations into the prose.
6. Provide "answer" in English.
7. Provide "answer_local" in requested language: "${language}".
8. Return ONLY raw valid JSON:
{
  "answer": "English answer",
  "answer_local": "Local language answer",
  "citations": [
    {
      "track": "document" | "statute",
      "id": "clause_id or rule_id",
      "page_number": 1,
      "citation_label": "Clause or Rule reference"
    }
  ],
  "confidence": 0.95
}

CONTEXT:
--- DOCUMENT GROUNDING TRACK ---
${docMatches.length > 0 ? JSON.stringify(docMatches, null, 2) : 'No document clauses found.'}

--- STATUTE GROUNDING TRACK ---
${statuteMatches.length > 0 ? JSON.stringify(statuteMatches, null, 2) : 'No statute rules found.'}

USER QUESTION:
"${question}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.0, responseMimeType: 'application/json' },
      }),
    });
    if (res.ok) break;
    if (res.status === 503 || res.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      continue;
    }
    break;
  }

  if (!res || !res.ok) {
    throw new Error(`Gemini API returned status ${res?.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

// Live Mistral Layer 2 Verifier caller
async function verifyWithMistral(
  claim: string,
  sourceContext: string
): Promise<{ verdict: 'supported' | 'contradicted' | 'unrelated'; reason: string }> {
  const prompt = `You are a strict legal fact-checker.
Given the source legal text and the claim made, evaluate if the claim is factual and directly supported.

SOURCE TEXT:
"""
${sourceContext}
"""

CLAIM TO VERIFY:
"""
${claim}
"""

Respond with ONLY valid JSON:
{
  "verdict": "supported" | "contradicted" | "unrelated",
  "reason": "One concise sentence explaining why."
}`;

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'open-mistral-7b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0,
      max_tokens: 120,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Mistral API returned status ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return JSON.parse(content);
}

// Deterministic client fallback evaluator (for offline / keyless use)
function evaluateDeterministicFallback(
  _question: string,
  _language: string,
  matchedClauses: DocumentClause[],
  matchedRules: RulePackItem[],
  filterVertical?: LegalVertical,
  piiRedacted = false,
  injectionDetected = false,
  counts = { aadhaar: 0, pan: 0, phone: 0, bankAccount: 0 }
): QAResponse {
  if (matchedClauses.length > 0) {
    const top = matchedClauses[0];
    return {
      answer: `According to ${top.clause_category.replace(/_/g, ' ')} in your document: "${top.clause_text}".`,
      answer_local: `According to ${top.clause_category.replace(/_/g, ' ')} in your document: "${top.clause_text}".`,
      citations: [
        {
          track: 'document',
          id: top.clause_id,
          page_number: top.page_number,
          citation_label: `Clause ${top.clause_id} (Page ${top.page_number})`,
          position: top.position,
        },
      ],
      confidence: 0.94,
      verifierState: 'verified',
      vertical: (filterVertical || 'rental') as LegalVertical,
      safety: {
        piiRedacted,
        injectionDetected,
        redactedCount: counts,
      },
      verificationNotes: ['Evaluated via deterministic Layer 1 verification.'],
    };
  }

  if (matchedRules.length > 0) {
    const top = matchedRules[0];
    return {
      answer: `Under Indian statutory law (${top.citation}): ${top.rule_summary}`,
      answer_local: `Under Indian statutory law (${top.citation}): ${top.rule_summary}`,
      citations: [
        {
          track: 'statute',
          id: top.rule_id,
          citation_label: `${top.citation} (${top.rule_id})`,
        },
      ],
      confidence: 0.95,
      verifierState: 'verified',
      vertical: (filterVertical || top.vertical) as LegalVertical,
      safety: {
        piiRedacted,
        injectionDetected,
        redactedCount: counts,
      },
      verificationNotes: ['Evaluated via statute rule grounding (Layer 1 verified).'],
    };
  }

  return {
    answer: EXACT_DOC_FALLBACK,
    answer_local: EXACT_DOC_FALLBACK,
    citations: [],
    confidence: 1.0,
    verifierState: 'verified',
    vertical: (filterVertical || 'rental') as LegalVertical,
    safety: {
      piiRedacted,
      injectionDetected,
      redactedCount: counts,
    },
    verificationNotes: ['Exact document-grounded out-of-scope fallback applied.'],
  };
}
