-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Set search path to include extensions
SET search_path TO public, extensions;

-- 1. rule_pack (persisted statute & legal rules)
-- CRITICAL CONSTRAINT (AGENTS.md):
-- Exact/no-index vector search — corpus is ~25 rows, do NOT add HNSW or IVFFlat index!
CREATE TABLE IF NOT EXISTS public.rule_pack (
    rule_id TEXT PRIMARY KEY,
    vertical TEXT NOT NULL,
    clause_category TEXT NOT NULL,
    rule_summary TEXT NOT NULL,
    citation TEXT NOT NULL,
    risk_if_violated TEXT NOT NULL,
    embedding vector(768),
    embedded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    source_url TEXT,
    last_verified_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. audit_log (persisted audit trail for AI compliance)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    input_hash TEXT NOT NULL,
    vertical TEXT,
    retrieved_rule_ids TEXT[] DEFAULT '{}',
    requested_language TEXT DEFAULT 'en',
    verifier_state TEXT NOT NULL CHECK (verifier_state IN ('verified', 'repaired', 'unverified')),
    output_hash TEXT NOT NULL
);

-- 3. clause_library (persisted clause templates for drafting)
CREATE TABLE IF NOT EXISTS public.clause_library (
    clause_id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    template_text TEXT NOT NULL,
    vertical TEXT NOT NULL
);

-- NOTE ON DOCUMENT CONTENT:
-- document_clauses is strictly session-scoped and lives ONLY in memory or short-lived
-- request cache. It is NEVER written to Postgres per Zero-Persistence NFR-1.

-- Stored Procedure: match_rules
-- Exact cosine similarity search against rule_pack without ANN indexing
CREATE OR REPLACE FUNCTION public.match_rules (
    query_embedding vector(768),
    match_threshold float DEFAULT 0.4,
    match_count int DEFAULT 5,
    filter_vertical text DEFAULT NULL
)
RETURNS TABLE (
    rule_id text,
    vertical text,
    clause_category text,
    rule_summary text,
    citation text,
    risk_if_violated text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        rp.rule_id,
        rp.vertical,
        rp.clause_category,
        rp.rule_summary,
        rp.citation,
        rp.risk_if_violated,
        1 - (rp.embedding <=> query_embedding) AS similarity
    FROM public.rule_pack rp
    WHERE (filter_vertical IS NULL OR rp.vertical = filter_vertical)
      AND (rp.embedding IS NOT NULL)
      AND (1 - (rp.embedding <=> query_embedding) >= match_threshold)
    ORDER BY rp.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
