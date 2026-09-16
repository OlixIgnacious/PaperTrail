// PaperTrail Edge Function: Retrieval Layer (FR-7 & FR-21)
// Handles cross-lingual embeddings via gemini-embedding-001 (768-dim) and exact vector retrieval

export interface SessionDocumentClause {
  clause_id: string;
  clause_text: string;
  clause_category: string;
  page_number: number;
  position: {
    bbox?: [number, number, number, number]; // [x0, y0, x1, y1] normalized or pts
    char_offset?: number;
  };
  embedding?: number[];
}

export interface RetrievedRule {
  rule_id: string;
  vertical: string;
  clause_category: string;
  rule_summary: string;
  citation: string;
  risk_if_violated: string;
  similarity: number;
}

export interface DocumentMatch {
  clause_id: string;
  clause_text: string;
  clause_category: string;
  page_number: number;
  position: SessionDocumentClause['position'];
  similarity: number;
}

// Compute cosine similarity between two 768-dim vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate embedding using gemini-embedding-001 with 768-dim Matryoshka truncation
export async function getGeminiEmbedding(text: string, apiKey: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const values = data.embedding?.values as number[];
  if (!values) throw new Error('No embedding returned from Gemini');
  return values.slice(0, 768);
}

// Search session document clauses in-memory (NFR-1: Zero Document Persistence)
export function matchDocumentClauses(
  queryEmbedding: number[],
  documentClauses: SessionDocumentClause[],
  threshold = 0.45,
  limit = 3
): DocumentMatch[] {
  const matches: DocumentMatch[] = [];

  for (const clause of documentClauses) {
    if (clause.embedding) {
      const sim = cosineSimilarity(queryEmbedding, clause.embedding);
      if (sim >= threshold) {
        matches.push({
          clause_id: clause.clause_id,
          clause_text: clause.clause_text,
          clause_category: clause.clause_category,
          page_number: clause.page_number,
          position: clause.position,
          similarity: sim,
        });
      }
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}
