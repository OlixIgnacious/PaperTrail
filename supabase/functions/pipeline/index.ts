// PaperTrail Edge Function Orchestrator (Pipeline Endpoint)
// Follows the linear 6-step pipeline specified in Section 5.4 of RFS_TRD_AI_Legal_Assistance.md

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { processInputSafety } from './safety.ts';
import { classifyVertical } from './classify.ts';
import { getGeminiEmbedding, matchDocumentClauses, SessionDocumentClause, RetrievedRule } from './retrieval.ts';
import { generateGroundedAnswer, EXACT_DOC_FALLBACK } from './generator.ts';
import { executeVerifierPipeline } from './verifier.ts';
import { recordAuditLog, sha256Hex } from './audit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      question,
      language = 'en',
      documentClauses = [], // SessionDocumentClause[] (Session-scoped only, never stored in DB!)
      filterVertical,
    } = await req.json();

    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabase = supabaseUrl && supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    // Step 1: Input Safety (PII redaction & Injection Defanging)
    const safety = processInputSafety(question);
    const cleanedQuestion = safety.cleanedText;

    // Step 2: Classify Vertical
    const classification = classifyVertical(cleanedQuestion);
    const vertical = filterVertical || classification.vertical;

    // Step 3: Compute Query Embedding
    let queryEmbedding: number[] = [];
    if (geminiApiKey) {
      try {
        queryEmbedding = await getGeminiEmbedding(cleanedQuestion, geminiApiKey);
      } catch (err) {
        console.warn('Embedding API failed or rate-limited:', err);
      }
    }

    // Step 4: Retrieval Tracks (Two Independent Tracks)
    // Track A: Session Document Clauses (In-memory, Zero Persistence NFR-1)
    const documentMatches = queryEmbedding.length > 0 && documentClauses.length > 0
      ? matchDocumentClauses(queryEmbedding, documentClauses, 0.40, 3)
      : [];

    // Track B: Statute Rule Pack (Supabase exact pgvector match_rules RPC)
    let statuteMatches: RetrievedRule[] = [];
    if (supabase && queryEmbedding.length > 0) {
      const { data, error } = await supabase.rpc('match_rules', {
        query_embedding: queryEmbedding,
        match_threshold: 0.35,
        match_count: 3,
        filter_vertical: vertical,
      });

      if (!error && data) {
        statuteMatches = data as RetrievedRule[];
      }
    }

    // Step 5: Generation Layer (Gemini Flash, structured JSON, temperature 0)
    let generatorOutput = {
      answer: EXACT_DOC_FALLBACK,
      answer_local: EXACT_DOC_FALLBACK,
      citations: [] as any[],
      confidence: 1.0,
    };

    if (geminiApiKey && (documentMatches.length > 0 || statuteMatches.length > 0)) {
      try {
        generatorOutput = await generateGroundedAnswer({
          question: cleanedQuestion,
          language,
          documentMatches,
          statuteMatches,
          geminiApiKey,
        });
      } catch (err) {
        console.error('Generator error:', err);
      }
    }

    // Step 6: Verifier Layer (Layer 1 deterministic check + Layer 2 Mistral check)
    const verification = await executeVerifierPipeline({
      output: generatorOutput,
      retrievedRules: statuteMatches,
      documentMatches,
      mistralApiKey,
    });

    // Step 7: Audit Logging (NFR-1 compliant: only hashes and IDs logged, NO raw document text)
    const inputHash = await sha256Hex(cleanedQuestion);
    const outputHash = await sha256Hex(verification.verifiedOutput.answer);

    if (supabase) {
      await recordAuditLog(supabase, {
        input_hash: inputHash,
        vertical,
        retrieved_rule_ids: statuteMatches.map((r) => r.rule_id),
        requested_language: language,
        verifier_state: verification.verifierState,
        output_hash: outputHash,
      });
    }

    const responsePayload = {
      answer: verification.verifiedOutput.answer,
      answer_local: verification.verifiedOutput.answer_local,
      citations: verification.verifiedOutput.citations,
      confidence: verification.verifiedOutput.confidence,
      verifierState: verification.verifierState,
      vertical,
      safety: {
        piiRedacted: safety.piiRedacted,
        injectionDetected: safety.injectionDetected,
        redactedCount: safety.redactedCount,
      },
      verificationNotes: verification.notes,
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Pipeline unhandled error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
