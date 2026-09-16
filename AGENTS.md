# Project constraints — read before every task

This file is project context for every Antigravity task in this repo.
If a task's instructions ever conflict with this file, this file wins.

## Stack (locked — do not substitute or add to this)

- Generation LLM: Gemini Flash (free tier, Google AI Studio)
- Embedding model: `gemini-embedding-001` (free tier, 768-dim, Matryoshka-truncated)
- Verifier LLM: Mistral, free "Experiment" tier (La Plateforme) — deliberately a
  different model family from the generator, not a second Gemini call
- Database: Supabase Postgres + pgvector (free tier). Exact/no-index vector
  search — the corpus is ~25 rows, do NOT add HNSW/IVFFlat indexing
- Backend compute: Supabase Edge Functions — no separate server
- Freshness pipeline: GitHub Actions cron — no GCP, no Cloud Scheduler
- PDF parsing: PyMuPDF or pdfplumber (position-aware — must expose
  page/word-level coordinates, not just flat text)
- OCR: Tesseract, self-hosted
- Document viewer (frontend): `react-pdf` (PDF.js-based)
- Delivery: WhatsApp Cloud API, sandbox/test mode only

Do not introduce GCP, a second LLM provider, a different vector DB, or a
traditional server (Express/FastAPI on a VM) without an explicit instruction
to do so in a task.

## Schema (do not redesign — extend only if a task explicitly asks)

### `rule_pack` (Postgres, persisted)
rule_id (PK), vertical, clause_category, rule_summary (English only),
citation, risk_if_violated (English only), embedding (vector(768)),
embedded_at, source_url, last_verified_at

### `audit_log` (Postgres, persisted)
id (PK), created_at, input_hash, vertical, retrieved_rule_ids (text[]),
requested_language, verifier_state (verified | repaired | unverified),
output_hash

### `clause_library` (Postgres, persisted — for the drafting feature)
clause_id (PK), category, template_text, vertical

### `document_clauses` — SESSION-SCOPED ONLY, NEVER PERSISTED
clause_id, clause_text, clause_category, page_number, position (bbox or
char offset), embedding (vector(768))
This structure lives in memory / short-TTL cache for one session only.
**It must never be written to Postgres, ever, under any circumstance.**
Writing uploaded-document content to a persisted table is a zero-persistence
violation (NFR-1) and a security regression — treat any code path that does
this as a bug, not a feature.

## The two citation tracks — never conflate them

There are two independent grounding sources. Every generated answer must be
clearly attributed to exactly one of them, never blended or left ambiguous:

| Track | Source | Citation shape | Fallback when ungrounded |
|---|---|---|---|
| Document-grounded | The user's own uploaded document (`document_clauses`) | `{clause_id, page_number}` | Exact string: `"This cannot be determined from the information you provided."` |
| Statute-grounded | The curated rule pack (`rule_pack`) | `{rule_id}` | `"Outside our current rule coverage for this vertical — here's the free legal aid route."` |

Rules:
- Never cite a `rule_id` as if it were a document clause, or vice versa.
- Never merge the two fallback messages or paraphrase either one — the
  document-grounded fallback text above must appear **verbatim, word for
  word**, exactly as written. Do not reword it for style, tone, or brevity.
- If a question could be answered by either track, prefer the document track
  first (the user's own document is the primary source per the problem
  statement) and only fall back to the rule pack if the document doesn't
  cover it.

## Verifier — two layers, in this order, no exceptions

1. **Layer 1 (deterministic, always runs, free):** every cited ID must be a
   member of the set that was actually retrieved for this request — check
   against `retrieved_rule_ids` for statute citations, or the current
   session's `extracted_clause_ids` for document citations. Plain set
   membership in code. If it fails, regenerate ONCE with a stricter prompt;
   if it still fails, use the appropriate fallback text above. Never ship an
   uncited or wrongly-cited claim.
2. **Layer 2 (Mistral semantic cross-check, only runs if Layer 1 passes):**
   a narrow fact-checker prompt — given the cited source text and the
   generated claim, verdict is `supported | contradicted | unrelated`. If
   not `supported`, downgrade that specific claim only (replace with "we
   found a related source but couldn't fully verify this point — consult a
   professional"). Do NOT auto-regenerate on a Layer 2 failure — downgrade
   and ship, to keep latency bounded.
3. Log every attempt's outcome to `audit_log` with state
   `verified | repaired | unverified`, regardless of pass or fail.

## Never build (gated — do not implement even if it seems like a natural extension)

- ACL / multi-user access control on documents
- E-filing or auto-submission to any government system — stop at
  "ready to print/post"
- Live/real-time web scraping — freshness checks are scheduled
  (GitHub Actions) only, never triggered at request time
- Agentic multi-step tool orchestration for the verifier — it is exactly
  two fixed layers, not a planning loop
- Auto-regeneration loops on Layer 2 verifier failures
- Any persistence of uploaded document content or its extracted clauses
- DLSA/legal-aid appointment booking (directory + eligibility check only)
- SOC 2 / ISO 27001 / firm-level audit sign-off workflows
- Open-ended Q&A that is not grounded in either the `rule_pack` or the
  current session's `document_clauses`

## Always do

- Generation output must be structured JSON with a `citations` array —
  never citations woven into free-text prose
- PII (Aadhaar, PAN, phone numbers, bank account numbers) must be redacted
  before any content is sent to an external API (Gemini or Mistral)
- Prompt-injection patterns in uploaded content must be detected and
  neutralized before that content reaches a generation prompt
- Every response's language is driven by a `language` parameter passed into
  the generation prompt — never a separate translation step, never
  pre-translated data in the rule pack (which stays English-only)
- Temperature 0 for both the generator and the verifier calls
