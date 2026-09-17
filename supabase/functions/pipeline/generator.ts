// PaperTrail Edge Function: Generator Layer (FR-8, FR-10, FR-14, FR-20, FR-21, FR-23)
// Calls Gemini Flash at temperature 0, returns structured JSON with separate citations array

import { RetrievedRule, DocumentMatch } from './retrieval.ts';

export const EXACT_DOC_FALLBACK = "This cannot be determined from the information you provided.";
export const EXACT_STATUTE_FALLBACK = "Outside our current rule coverage for this vertical — here's the free legal aid route.";

export interface GeneratedCitation {
  track: 'document' | 'statute';
  id: string; // clause_id or rule_id
  page_number?: number;
  citation_label: string;
}

export interface GeneratorOutput {
  answer: string;
  answer_local: string;
  citations: GeneratedCitation[];
  confidence: number;
}

export async function generateGroundedAnswer(params: {
  question: string;
  language: string;
  documentMatches: DocumentMatch[];
  statuteMatches: RetrievedRule[];
  geminiApiKey: string;
}): Promise<GeneratorOutput> {
  const { question, language, documentMatches, statuteMatches, geminiApiKey } = params;

  // If neither track yielded any relevant context, skip generation and enforce strict fallback
  if (documentMatches.length === 0 && statuteMatches.length === 0) {
    return {
      answer: EXACT_DOC_FALLBACK,
      answer_local: EXACT_DOC_FALLBACK,
      citations: [],
      confidence: 1.0,
    };
  }

  const prompt = `You are PaperTrail, an expert legal assistant for Indian consumers.
Your goal is to answer the user's specific question STRICTLY based on the provided context.

RULES:
1. Temperature 0: Be objective, factual, concise, and grounded.
2. NEVER hallucinate legal facts, clauses, or sections.
3. If the user's uploaded document does not contain enough information to answer the question, you MUST return verbatim: "${EXACT_DOC_FALLBACK}".
4. Ground every statement in either the Document Grounding Track or the Statute Grounding Track. Prefer Document Track first.
5. All citations must be listed ONLY in the "citations" JSON array. Do NOT embed bracketed citations into the prose.
6. Provide "answer" in English.
7. Provide "answer_local" translated accurately into the requested language: "${language}".
8. Return ONLY raw valid JSON matching this schema:
{
  "answer": "English answer",
  "answer_local": "Answer translated to ${language}",
  "citations": [
    {
      "track": "document" | "statute",
      "id": "clause_id or rule_id",
      "page_number": 1,
      "citation_label": "e.g. Clause 4.2 (Page 2) or Transfer of Property Act Sec 106"
    }
  ],
  "confidence": 0.0 to 1.0
}

CONTEXT:
--- DOCUMENT GROUNDING TRACK (Uploaded Document Clauses) ---
${documentMatches.length === 0 ? "No relevant document clauses found." : JSON.stringify(documentMatches, null, 2)}

--- STATUTE GROUNDING TRACK (Hand-Curated Indian Legal Rules) ---
${statuteMatches.length === 0 ? "No relevant statute rules found." : JSON.stringify(statuteMatches, null, 2)}

USER QUESTION:
"${question}"
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.0,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Flash Generation API error: ${response.status} - ${errorText}`);
  }

  const resJson = await response.json();
  const rawOutput = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawOutput) {
    throw new Error('Gemini Flash returned empty response');
  }

  try {
    const parsed: GeneratorOutput = JSON.parse(rawOutput);
    return parsed;
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', rawOutput, err);
    return {
      answer: EXACT_DOC_FALLBACK,
      answer_local: EXACT_DOC_FALLBACK,
      citations: [],
      confidence: 0.0,
    };
  }
}
