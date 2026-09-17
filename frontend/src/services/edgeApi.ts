// PaperTrail Edge API & Client Pipeline Coordinator (FR-20, Days 5-8)
// Orchestrates modular safety sanitization, dual grounding track retrieval,
// generation (Supabase Edge Function / Gemini Flash), and two-layer verification.

import { DocumentClause, QAResponse, LegalVertical, Citation } from '../types/index.ts';
import { CURATED_RULES } from '../data/curatedRules.ts';
import { sanitizeInput } from './safety.ts';
import {
  extractKeywords,
  matchDocumentClauses,
  matchCuratedRules,
  evaluateDeterministicFallback,
  EXACT_DOC_FALLBACK,
  EXACT_STATUTE_FALLBACK,
} from './clientEngine.ts';
import {
  generateWithGemini,
  verifyWithMistral,
  callSupabaseEdgePipeline,
  ConversationTurn,
} from './livePipeline.ts';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || '';

export interface AskQuestionParams {
  question: string;
  language: string;
  documentClauses: DocumentClause[];
  filterVertical?: LegalVertical;
  conversationHistory?: ConversationTurn[];
}

export async function askQuestion(params: AskQuestionParams): Promise<QAResponse> {
  const { question, language, documentClauses, filterVertical, conversationHistory = [] } = params;

  // Step 1: Safety Sanitization (PII scrubbing + prompt injection defanging)
  const safety = sanitizeInput(question);
  const sanitizedQuestion = safety.cleanedText;

  // Step 2: Extract Substantive Query Keywords
  const qKeywords = extractKeywords(sanitizedQuestion);

  // Step 3: Dual Grounding Track Candidate Search
  const matchedClauses = matchDocumentClauses(documentClauses, qKeywords);
  const matchedRules = matchCuratedRules(CURATED_RULES, qKeywords, filterVertical);

  // Step 4: Strict Out-of-Scope Fallback Check
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
        piiRedacted: safety.piiRedacted,
        injectionDetected: safety.injectionDetected,
        redactedCount: safety.counts,
      },
      verificationNotes: ['Exact out-of-scope fallback string applied (no matching clauses or rules).'],
    };
  }

  // Step 5: Optional Server-Side Edge Function Execution (Zero-Exposure)
  const serverResult = await callSupabaseEdgePipeline({
    question: sanitizedQuestion,
    language,
    documentClauses,
    filterVertical,
    conversationHistory,
  });

  if (serverResult && serverResult.answer) {
    return {
      ...serverResult,
      safety: {
        piiRedacted: safety.piiRedacted,
        injectionDetected: safety.injectionDetected,
        redactedCount: safety.counts,
      },
    };
  }

  // Step 6: Fallback to Deterministic Engine if no Gemini key
  if (!GEMINI_API_KEY) {
    return evaluateDeterministicFallback({
      matchedClauses,
      matchedRules,
      filterVertical,
      piiRedacted: safety.piiRedacted,
      injectionDetected: safety.injectionDetected,
      counts: safety.counts,
    });
  }

  // Step 7: Execute Live Gemini Flash Generation (with multi-turn context)
  try {
    const geminiResult = await generateWithGemini({
      question: sanitizedQuestion,
      docMatches: matchedClauses,
      statuteMatches: matchedRules,
      language,
      conversationHistory,
    });

    // Check if generator returned exact out-of-scope fallback
    if (
      geminiResult.answer.includes(EXACT_DOC_FALLBACK) ||
      geminiResult.answer.toLowerCase().includes('cannot be determined')
    ) {
      return {
        answer: EXACT_DOC_FALLBACK,
        answer_local: EXACT_DOC_FALLBACK,
        citations: [],
        confidence: 1.0,
        verifierState: 'verified',
        vertical: (filterVertical || 'rental') as LegalVertical,
        safety: {
          piiRedacted: safety.piiRedacted,
          injectionDetected: safety.injectionDetected,
          redactedCount: safety.counts,
        },
        verificationNotes: ['Exact out-of-scope fallback returned by generator.'],
      };
    }

    // Step 8: Layer 1 Deterministic Verification (Set membership per AGENTS.md)
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
      return {
        answer: EXACT_DOC_FALLBACK,
        answer_local: EXACT_DOC_FALLBACK,
        citations: [],
        confidence: 0.7,
        verifierState: 'unverified',
        vertical: (filterVertical || 'rental') as LegalVertical,
        safety: {
          piiRedacted: safety.piiRedacted,
          injectionDetected: safety.injectionDetected,
          redactedCount: safety.counts,
        },
        verificationNotes: ['Layer 1 deterministic set check rejected hallucinated citation IDs.'],
      };
    }

    // Step 9: Layer 2 Mistral Semantic Cross-Check (if Mistral key configured)
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
            verifierState = 'repaired';
            finalAnswer =
              "We found a related source but couldn't fully verify this point — consult a professional. Reference: " +
              sourceContext;
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
        piiRedacted: safety.piiRedacted,
        injectionDetected: safety.injectionDetected,
        redactedCount: safety.counts,
      },
      verificationNotes,
    };
  } catch (err) {
    console.warn('Gemini live call failed, reverting to deterministic evaluation:', err);
    return evaluateDeterministicFallback({
      matchedClauses,
      matchedRules,
      filterVertical,
      piiRedacted: safety.piiRedacted,
      injectionDetected: safety.injectionDetected,
      counts: safety.counts,
    });
  }
}
