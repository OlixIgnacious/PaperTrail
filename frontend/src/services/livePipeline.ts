// PaperTrail Live Inference Pipeline (Gemini Flash + Mistral Verifier)
// Handles generation at temperature 0, multi-turn conversational context, and Mistral Layer 2 cross-checking

import { DocumentClause, RulePackItem, Citation } from '../types/index.ts';
import { EXACT_DOC_FALLBACK } from './clientEngine.ts';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface ConversationTurn {
  question: string;
  answer: string;
}

export interface LiveGenerationResult {
  answer: string;
  answer_local: string;
  citations: Citation[];
  confidence: number;
}

export interface MistralVerdict {
  verdict: 'supported' | 'contradicted' | 'unrelated';
  reason: string;
}

/**
 * Attempts to execute the full pipeline via Supabase Edge Function if configured.
 * This keeps all LLM API keys server-side in production.
 */
export async function callSupabaseEdgePipeline(params: {
  question: string;
  language: string;
  documentClauses: DocumentClause[];
  filterVertical?: string;
  conversationHistory?: ConversationTurn[];
}): Promise<any | null> {
  if (!SUPABASE_URL) return null;

  try {
    const url = `${SUPABASE_URL}/functions/v1/pipeline`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Supabase Edge Pipeline unavailable, falling back:', err);
  }
  return null;
}

/**
 * Calls Gemini Flash directly with temperature 0 and structured JSON schema.
 * Incorporates session-scoped multi-turn conversation context when available.
 */
export async function generateWithGemini(params: {
  question: string;
  docMatches: DocumentClause[];
  statuteMatches: RulePackItem[];
  language: string;
  conversationHistory?: ConversationTurn[];
}): Promise<LiveGenerationResult> {
  const { question, docMatches, statuteMatches, language, conversationHistory = [] } = params;

  if (!GEMINI_API_KEY) {
    throw new Error('No Gemini API key available');
  }

  const historyContext = conversationHistory.length > 0
    ? `\n--- PRIOR CONVERSATION TURNS (SESSION CONTEXT) ---\n${conversationHistory
        .slice(-2)
        .map((t) => `User: "${t.question}"\nAssistant: "${t.answer}"`)
        .join('\n\n')}\n`
    : '';

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
${historyContext}
CONTEXT:
--- DOCUMENT GROUNDING TRACK ---
${docMatches.length > 0 ? JSON.stringify(docMatches, null, 2) : 'No document clauses found.'}

--- STATUTE GROUNDING TRACK ---
${statuteMatches.length > 0 ? JSON.stringify(statuteMatches, null, 2) : 'No statute rules found.'}

USER QUESTION:
"${question}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

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

/**
 * Calls Mistral to perform Layer 2 semantic fact-checking on the generated claim.
 */
export async function verifyWithMistral(
  claim: string,
  sourceContext: string
): Promise<MistralVerdict> {
  if (!MISTRAL_API_KEY) {
    throw new Error('No Mistral API key available');
  }

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
