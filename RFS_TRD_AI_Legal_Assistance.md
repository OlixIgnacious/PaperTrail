# Request for Solution (RFS) & Technical Requirements Document (TRD)
## AI for Legal Assistance & Access — Hackathon Build

**Event:** Hack2Skill PromptWars 2026 (Virtual Edition)
**Track:** AI for Legal Assistance & Access
**Document status:** Draft v1
**Date:** 14 Sep 2026
**Submission deadline:** 26 Sep 2026, 11:59 PM IST (12 days remaining as of this document)
**Current rank:** #32 / 1003

---

## 1. Executive Summary

This solution is a grounded, multilingual legal document and situation assistant for Indian consumers, built to avoid the two failure modes most competing entries fall into: (a) generic "upload a contract, get a risk score" tools that are functionally indistinguishable from a dozen other submissions, and (b) ungrounded chatbots that risk hallucinating legal information.

The differentiator is architectural, not cosmetic: every AI-generated claim is grounded against a small, hand-verified rule pack and passes through a two-layer verifier before being shown to the user. The system is honest about its limited coverage (5 rules per vertical at launch) rather than silently overreaching, and includes a scheduled freshness-check pipeline that no competitor entry currently has.

**Update (problem-explainer meeting notes, post-lock):** The organizers clarified two things that reshape priority without changing the architecture's foundations. First, the core task is **not document summarization** — it's helping a user find and understand the *specific* piece of information they need, with the answer cited to the exact clause and page of *their own uploaded document* (not just the statute rule pack), with a clickable jump to that location. Second, out-of-scope questions have a prescribed exact response pattern: *"This cannot be determined from the information you provided."* Both are folded into the sections below — see Section 5.7 (Document-Citation Grounding) and Section 11 (Challenge-Specific Notes) for the full detail.

---

## 2. Background & Competitive Context

Research surfaced several near-identical hackathon entries already built for this exact track (legal-assist-ai, lexsahayak-ai, LegalLens AI, NyayaSetu ×2), most converging on: document upload → risk score (0-100) → plain-language rewrite → comparison → multilingual output. Two entries (NyayaSetuaI by Abbas Kapasi, NyayaSetu by Joseph-Gabriel008) are notably strong — 91% test coverage, BNS 2023 mapping, legal-aid navigators, offline fallback engines.

Professional-grade platforms (Amazon Quick, Thomson Reuters CoCounsel, Harvey AI) all converge on the same underlying pattern regardless of scale: **retrieve from a trusted, bounded, pre-vetted corpus → generate only from what was retrieved → attach the citation → log for audit.** This document specifies that same pattern at a scale appropriate for a 12-day build.

---

## 3. Goals & Non-Goals

### Goals
- Ground every generated claim in a verifiable, hand-curated source (no free-floating LLM legal opinions)
- Cover 5 real-world document verticals with a shared, extensible pipeline
- Support 15 Indian languages for output, cross-lingual retrieval from a single English corpus
- Be honest about coverage limits rather than overclaiming (explicit "coming soon" states)
- Score well on all six AI evaluation criteria: code quality, security, efficiency, testing, accessibility, problem statement alignment
- Build entirely on free-tier infrastructure
- **Prioritize targeted Q&A over full-document summarization as the primary interaction** — the user asks what they need to know, not "summarize this for me"
- **Ground every document-related answer in the specific clause + page of the user's own uploaded document**, with a clickable jump to that exact location — this is a separate, more central grounding track than the statute rule-pack citations

### Non-Goals (explicitly out of scope — see Section 4.3 for full gate list)
- Replacing a lawyer's judgment or providing definitive legal advice
- E-filing or auto-submitting anything to a government system
- Full unbounded legal knowledge coverage ("all of Indian law")
- Multi-user access control / firm-scale document management
- Production-grade compliance (SOC 2, ISO 27001)

---

## 4. Requirements

### 4.1 Functional Requirements (Build)

| # | Requirement | Vertical/Area |
|---|---|---|
| FR-1 | Accept document upload (PDF/TXT/image) or pasted text | Input |
| FR-2 | OCR scanned/photographed documents | Input |
| FR-3 | Redact PII (Aadhaar, PAN, phone, bank account) before any AI call | Security |
| FR-4 | Detect and defang prompt-injection attempts | Security |
| FR-5 | Classify uploaded document into one of 5 verticals | Pipeline |
| FR-6 | Extract and categorize clauses into a shared taxonomy | Pipeline |
| FR-7 | Retrieve relevant rules via cross-lingual vector search | Pipeline |
| FR-8 | Generate plain-language summary + risk score (0-100), grounded and cited | Output |
| FR-9 | Compare two documents with favorability tagging and risk-shift visualization | Output |
| FR-10 | Grounded Q&A — both document-attached and open-ended (corpus-grounded) | Q&A |
| FR-11 | Verify every generated claim via citation check + semantic cross-check | Verifier |
| FR-12 | Generate template-assembled notices/drafts from a vetted clause library | Drafting |
| FR-13 | Check Section 12 legal aid eligibility + surface NALSA/DLSA directory | Legal Aid |
| FR-14 | Support output in 15 Indian languages (see Section 6.4) | i18n |
| FR-15 | Voice input (STT) and read-aloud (TTS) where browser support allows | Accessibility |
| FR-16 | WCAG 2.1 AA compliant UI | Accessibility |
| FR-17 | Deliver summary via WhatsApp sandbox (optional channel) | Delivery |
| FR-18 | Log every AI call with input hash, retrieved rules, verifier state (PII-redacted) | Audit |
| FR-19 | Scheduled freshness check against authoritative sources, flag changes for review | Data pipeline |
| FR-20 | **Targeted Q&A as the primary screen** — user asks a specific question, gets a specific cited answer, not a full-document dump | Q&A / UX |
| FR-21 | **Document-clause citation** — every answer sourced from the user's own document cites the exact clause + page number, distinct from statute rule-pack citations | Grounding |
| FR-22 | **Clickable jump-to-source** — clicking a citation scrolls the rendered document to and highlights the exact clause/page it came from | UX |
| FR-23 | **Exact out-of-scope phrasing** — when the document doesn't contain the answer, respond with "This cannot be determined from the information you provided," never a guess | Q&A / Trust |

### 4.2 Non-Functional Requirements

| # | Requirement |
|---|---|
| NFR-1 | Zero document persistence — in-memory processing only |
| NFR-2 | Repo size under 10MB |
| NFR-3 | All infrastructure on free tiers (Gemini, Mistral, Supabase, GitHub Actions) |
| NFR-4 | Test coverage target ≥80% on pipeline logic |
| NFR-5 | Response latency: retrieval sub-second (small corpus, exact search) |
| NFR-6 | Every generated claim traceable to a specific rule ID |
| NFR-7 | Public GitHub repo, MIT or similar permissive license |

### 4.3 Explicit Non-Requirements (Gated)

DLSA appointment booking, e-filing/court submission, ACL/multi-user access control, agentic multi-step orchestration, full offline mobile app, SOC2/ISO27001 audit trails, live (non-scheduled) scraping, open-ended Q&A ungrounded by the rule-pack corpus.

---

## 5. System Architecture

### 5.1 Stack

| Layer | Choice | Why |
|---|---|---|
| Generation LLM | Gemini Flash (free API tier, AI Studio) | Permanent free tier, no card required |
| Embedding model | `gemini-embedding-001` | Free tier, cross-lingual (15/22 Indian languages), Matryoshka truncation to 768-dim |
| Verifier LLM | Mistral (free "Experiment" tier, La Plateforme) | Different model family from generator — genuine second opinion, not self-check |
| Database | Supabase Postgres + pgvector | Free tier: 500MB, 50K MAUs, pgvector included, exact search (no ANN index needed at this corpus size) |
| Backend compute | Supabase Edge Functions | Free tier: 500K invocations, no separate server needed |
| Freshness pipeline | GitHub Actions (cron) | Free minutes, no GCP account required |
| Frontend hosting | Local dev now; Vercel/Netlify or Supabase Edge Functions later if a live link is wanted | No deployment required for submission (repo + video only) |
| Delivery channel | WhatsApp Cloud API (sandbox/test mode) | Free, no business verification needed for demo |
| OCR | Tesseract (self-hosted) | Free, no external dependency |
| PDF parsing (position-aware) | PyMuPDF or pdfplumber | Both expose per-word/per-line coordinates, needed for page/position-accurate citations (Section 5.7) — plain text extraction is no longer sufficient |
| Document viewer (frontend) | `react-pdf` (PDF.js-based) | Renders the document and supports programmatic scroll-to + highlight on citation click |

GCP is explicitly parked — not needed given the above; revisit only if a specific gap appears.

### 5.2 Request Path

```
User (Web app / WhatsApp)
   -> Frontend (local dev, React)
   -> Supabase Edge Function (pipeline orchestrator)
       -> [Gemini + Mistral: generate & verify]
       -> [Supabase Postgres: rules, vectors, audit log]
   -> Response back to User
```

### 5.3 Async Path

```
GitHub Actions (daily cron)
   -> web_search against fixed authoritative sources (PIB, gazette/ministry pages)
   -> diff against last-known rule pack
   -> flag changes for human review (no auto-merge)
   -> Supabase Postgres (on approval)
```

### 5.4 Edge Function Pipeline (linear, 6 steps)

1. **Input safety** — OCR, PII redaction, prompt-injection guardrails
2. **Classify vertical** — which of the 5 document types
3. **Extract clauses with position metadata** — clause text + category + **page number + bounding box/char offset**, so each extracted clause can later be scrolled-to and highlighted in the rendered document (new — see Section 5.7)
4. **Retrieve** — two parallel retrieval tracks: (a) cross-lingual pgvector search against the English-only statute rule pack (exact/no-index, ~25 rows), pre-filtered by vertical; (b) semantic match against the current document's own extracted clauses (session-scoped, not persisted)
5. **Generate (Gemini)** — grounded strictly in whichever track(s) apply to the question; document-sourced answers cite `{clause_id, page_number}`, statute-sourced answers cite `{rule_id}`; language parameter drives output translation in the same call; structured JSON required; temperature 0; if neither track has a match, generation is skipped in favor of the fixed out-of-scope response (Section 5.7)
6. **Verify** — Layer 1 (deterministic citation check, now checked against *either* `retrieved_rule_ids` or `extracted_clause_ids` depending on citation source) + Layer 2 (Mistral semantic cross-check), both language-agnostic
7. **Output** — targeted answer (primary) or full report (secondary, on request) + structured audit log entry, with citations rendered as clickable jump-to-source links

### 5.5 Multilingual Design

- Rule pack canonical in **English only** — single source of truth, single update path
- Embeddings generated once per rule (English), reused across all query languages
- Cross-lingual retrieval: a query in any supported language embeds into the same vector space and retrieves the correct English rule via cosine similarity — no translation needed at retrieval time
- Translation happens only inside the generation prompt (`"respond in {language}"`)
- **Supported (15/22 scheduled languages):** Assamese, Bengali, Gujarati, Hindi, Kannada, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sindhi, Tamil, Telugu, Urdu
- **Not supported by the embedding model:** Bodo, Dogri, Kashmiri, Konkani, Maithili, Sanskrit, Santali
- Voice (STT/TTS) language coverage is separate and narrower — verify per-language before claiming full voice support in the demo

### 5.6 Verifier Design (detail)

**Precondition:** Gemini returns structured JSON: `{answer, answer_local, citations: [rule_id...], confidence}`.

**Layer 1 — deterministic (always runs, free):**
```python
def layer1_check(response, retrieved_rule_ids):
    return set(response["citations"]).issubset(set(retrieved_rule_ids))
```

**Layer 2 — Mistral semantic cross-check (runs only if Layer 1 passes):**
Narrow fact-checker prompt: given the rule's exact text and the claim, verdict = `supported | contradicted | unrelated` + one-sentence reason. Temperature 0, ~80 max tokens.

**Decision ladder:**
- Layer 1 fails → regenerate once with a stricter prompt → still fails → fallback response, state = `unverified`. **Fallback text depends on the track:** document-grounded question → exact phrase *"This cannot be determined from the information you provided"* (per challenge spec, word-for-word); statute-grounded question → *"Outside our current rule coverage — here's the free legal aid route"*
- Layer 2 flags `contradicted`/`unrelated` → downgrade that specific claim only, state = `repaired` (no auto-regen loop on Layer 2 — bounded latency)
- Both pass → state = `verified`
- For legally ambiguous situations (question is answerable but the answer isn't a clean yes/no) → surface the relevant clause/rule and explicitly recommend clarification with a legal professional, rather than issuing a definitive legal judgment

Three-state audit logging (`verified` / `repaired` / `unverified`) per response.

### 5.7 Document-Citation Grounding & Jump-to-Source (new)

This is now the primary grounding mechanism per the problem-explainer clarification — more central than the statute rule pack for the core "find and understand specific information" task.

**Extraction with position metadata:** the clause-extraction step (pipeline step 3) must capture, per clause: `clause_id`, `clause_text`, `clause_category`, `page_number`, and a position reference (bounding box from OCR/PDF parsing, or character offset for text-native PDFs). This is a materially bigger lift than plain text extraction — it needs a PDF-parsing library that preserves layout/position (e.g. PyMuPDF/pdfplumber, which both expose per-word/per-line coordinates), not just a flat text dump.

**Two independent citation tracks, not one:**
| Track | Source | Citation shape | Fallback when ungrounded |
|---|---|---|---|
| Document-grounded | The user's own uploaded document | `{clause_id, page_number}` — e.g. "Clause 8.2, Page 14" | *"This cannot be determined from the information you provided."* (exact phrasing, per challenge spec) |
| Statute-grounded | The curated rule pack | `{rule_id}` — e.g. `KA_RENT_003` | *"Outside our current rule coverage for this vertical — here's the free legal aid route."* (existing 5-rules-per-vertical honesty pattern) |

These are deliberately different fallback messages — conflating them would blur "your document doesn't say this" with "we haven't curated a rule for this yet," which are different kinds of gaps a user needs to understand differently.

**Session-scoped, not persisted:** extracted clauses with position data live only for the duration of the session/request cycle (in memory or a short-TTL cache), never written to Postgres — this preserves NFR-1 (zero document persistence) while still enabling jump-to-source within a single session.

**Frontend requirement — Document Viewer with Jump-to-Source (scoped task):**

*Functionality:*
1. Render the uploaded PDF/image in-browser (not a text extract)
2. Accept a citation click from a Q&A answer — `{page_number, position}`
3. Scroll automatically to that page
4. Draw a visible highlight box over the exact region for ~3 seconds or until the user scrolls away
5. Allow normal manual scroll/browse of the rest of the document

*Two data-source cases, handled differently:*

| Case | Source | Position data | Handling |
|---|---|---|---|
| A — text-native PDF (most offer letters, T&Cs, typed agreements) | PyMuPDF/pdfplumber, word-level coordinates from the PDF's own text layer | Precise | Full highlight box |
| B — scanned/photographed document (photo of a lease, a challan) | Tesseract OCR bounding boxes | Unreliable (skew, lighting, handwriting) | **Page-level only** — scroll to page, show a "see page 14" label, no highlight box. Do not attempt pixel-accurate highlighting on low-OCR-confidence input — an honest imprecise citation beats a wrong-looking highlight |

*Concrete build task (hand this to Antigravity as one bounded unit):*
> Build a React component using `react-pdf` that: (1) accepts a PDF file and renders it page by page, (2) accepts a `citationTarget: {page_number, position}` prop, (3) on receiving a new citationTarget, scrolls the viewer to that page and overlays a highlighted rectangle at the given position for ~3 seconds or until the user scrolls, (4) gracefully handles missing/low-confidence position data by scrolling to the page only, with a "see page N" label instead of a highlight box, (5) includes a fallback UI state for when the PDF fails to render at all.

*Known risk areas — budget review time, not just build time:*
- `react-pdf` re-render performance on longer documents (10+ pages) if not virtualized — test early on a real multi-page contract, not after the UI is built around it
- Mobile/responsive rendering is fiddly for PDF viewers — deprioritize if the demo video is desktop-only
- OCR bounding-box accuracy (Case B) is the most likely thing to look visibly broken in a live demo if not scoped down as above

*Sizing call:* build Case A (text-native) properly first; treat Case B (scanned) as page-level-only from day one rather than chasing OCR pixel accuracy — an honest scope cut that still satisfies the core "clickable citation → jump to source" requirement without burning days on precision that's hard to guarantee anyway.

**Primary vs secondary screen (UX reprioritization):** the targeted Q&A view (ask a specific question, get a cited, clickable answer) is now the **primary/hero screen**. The full Document Health Report (risk score, clause-by-clause breakdown) remains valuable but is **secondary** — reachable via a tab or "full analysis" action, not the first thing shown.

---

## 6. Data Model

### 6.1 `rule_pack` table

| Column | Type | Notes |
|---|---|---|
| rule_id | text, PK | e.g. `KA_RENT_003` |
| vertical | text | rental / employment / gig / consumer / challan |
| clause_category | text | shared taxonomy: payment_terms, termination, liability, penalty, dispute_resolution, obligations, procedural_validity |
| rule_summary | text | English, canonical |
| citation | text | statute/section reference |
| risk_if_violated | text | English |
| embedding | vector(768) | `gemini-embedding-001`, Matryoshka-truncated |
| embedded_at | timestamptz | for freshness tracking |
| source_url | text | authoritative source, for the freshness pipeline to re-check |
| last_verified_at | timestamptz | |

### 6.2 `audit_log` table

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| created_at | timestamptz | |
| input_hash | text | never store raw input |
| vertical | text | classified |
| retrieved_rule_ids | text[] | |
| requested_language | text | |
| verifier_state | text | verified / repaired / unverified |
| output_hash | text | |

### 6.3 `clause_library` table (for drafting feature)

| Column | Type | Notes |
|---|---|---|
| clause_id | text, PK | |
| category | text | shared taxonomy |
| template_text | text | with placeholders |
| vertical | text | |

### 6.4 `document_clauses` — session-scoped only, NOT a persisted table

Per NFR-1 (zero document persistence), this is an in-memory/short-TTL structure held for the duration of one session — never written to Postgres.

| Field | Type | Notes |
|---|---|---|
| clause_id | text | session-local, regenerated per upload |
| clause_text | text | extracted |
| clause_category | text | shared taxonomy |
| page_number | int | |
| position | json | bounding box or character offset, for jump-to-source |
| embedding | vector(768) | generated on upload, discarded at session end |

---

## 7. Testing Strategy

- **Golden test set:** 10-15 question/document pairs with known-correct citations, run as pytest — the concrete evidence of verifier correctness
- **Classifier sanity check:** small sample set per vertical to catch misrouting early
- **Language smoke tests:** full pipeline tested deeply in English + Hindi + Tamil (script/family diversity); one sample query per remaining language, not full regression
- **Security tests:** PII redaction unit tests, prompt-injection defense tests
- **Coverage target:** ≥80% on pipeline/backend code

---

## 8. Build Plan (12 days, 14–26 Sep 2026)

| Days | Focus |
|---|---|
| 1–2 (14–15 Sep) | Finalize 25 rule-pack entries (5 per vertical) against real sources; Postgres schema; repo scaffolding |
| 3–4 (16–17 Sep) | Input safety layer (OCR, PII redaction, injection defense); classifier |
| 5–6 (18–19 Sep) | Retrieval (pgvector, cross-lingual) + Generate (Gemini, grounded, structured JSON) |
| 7 (20 Sep) | Verifier: Layer 1 + Layer 2 (Mistral), decision ladder, audit logging |
| 8–9 (21–22 Sep) | Frontend UI: upload, **targeted Q&A as primary screen with clickable citations**, PDF.js-based document viewer with jump-to-source/highlight, report view (secondary), compare mode, language toggle |
| 10 (23 Sep) | Legal aid navigator (Section 12 checker, DLSA directory); drafting/clause library |
| 11 (24 Sep) | GitHub Actions freshness pipeline; WhatsApp sandbox; accessibility (WCAG, voice) |
| 12 (25 Sep) | Golden test set, bug fixes, README, buffer |
| 26 Sep | Video recording + submission before 11:59 PM IST |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Rule pack too shallow vs. competitor entries with deeper coverage | Explicit "coverage: N of ~25 planned" UI honesty; depth-on-common-scenarios beats breadth |
| Classifier misroutes documents | Small sanity test set built early (Day 3-4) |
| Mistral/Gemini free-tier rate limits hit during testing | Layer 1 (free, deterministic) always runs first; Layer 2 only on Layer 1 pass, minimizing Mistral calls |
| Voice support overclaimed for languages without browser support | Verify per-language before scripting the demo video |
| WhatsApp sandbox can't demo with arbitrary numbers | Demo from pre-registered test number, scope claim honestly |
| Running out of time before deadline | Day 12 buffer explicitly reserved; core pipeline (Days 1-7) prioritized over polish |

---

## 11. Challenge-Specific Notes (from problem-explainer meeting)

Captured verbatim-in-spirit from the organizer clarification session, for reference during build and video prep.

**Core task framing:** Not document summarization — help the user find and understand the *specific* information they need. The system is a legal information aid, not a replacement for professional advice; responsible answers point to relevant sections and suggest what to clarify with a legal professional.

**Trust example (the bar to hit):** *"Your notice period is 60 days — see Contract Agreement, Clause 8.2, Page 14"* with a clickable link to the original context. Side-by-side explanation + evidence beats a well-written but ungrounded answer.

**Out-of-scope handling (Option B, confirmed correct):** If the document doesn't cover the question, say *"This cannot be determined from the information you provided"* — never hallucinate an answer. This is now the exact fallback string for the document-grounding track (Section 5.7).

**Rules confirmed:**
- Any LLM/ecosystem allowed (Gemini, OpenAI, Anthropic, etc.) — not Google-restricted
- Any deployment platform — Google Cloud not required
- Google services carry small scoring weightage but are not mandatory
- **Detailed code-analysis feedback is only shown after all 3 submission attempts are used** — treat the first submission as a real one, not a throwaway test, since no diagnostic feedback comes back until attempts are exhausted
- **Video must walk through the working prototype interactively** — every click and its result, not a concept explainer. Voiceover allowed and recommended. AI-generated explainer videos are acceptable, but only if the actual prototype walkthrough is included

---

## 12. Open Decisions

- Final confirmation of which 5 rules per vertical to lock (draft list exists, needs source verification)
- Whether to pursue a live deployment link (optional — not required for submission) or repo + video only
- Exact WhatsApp sandbox test-number setup timing

---

*This document consolidates decisions made through iterative design discussion and should be treated as living — update as build decisions evolve.*
