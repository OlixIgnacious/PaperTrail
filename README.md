# PaperTrail 📜⚖️
**AI for Legal Assistance & Access** — Hack2Skill PromptWars 2026

PaperTrail is a grounded, multilingual legal document and situation assistant for Indian consumers. It helps users find and understand specific information in their contracts across 5 critical everyday domains, with answers cited to the exact clause and page of their uploaded document, accompanied by a position-accurate jump-to-source highlighter.

---

## 🌟 Core Architecture & Guarantees

1. **Zero Document Persistence (NFR-1)**: Uploaded documents and extracted `document_clauses` live strictly in memory / session-scoped client state and are **never** persisted to Supabase Postgres.
2. **Two Independent Grounding Tracks**:
   - **Document-Grounded**: Cites the user's uploaded document as `{clause_id, page_number}` with bounding box coordinates. Out-of-scope fallback is the verbatim string:
     > *"This cannot be determined from the information you provided."*
   - **Statute-Grounded**: Cites the hand-curated rule pack as `{rule_id}` (e.g., `RENT_001`, `EMP_001`). Uncovered fallback:
     > *"Outside our current rule coverage for this vertical — here's the free legal aid route."*
3. **Two-Layer Verifier Pipeline**:
   - **Layer 1 (Deterministic Set Check)**: Verifies that every cited ID is a subset of retrieved IDs (`retrieved_rule_ids` or session `extracted_clause_ids`). Plain set membership in code; failures downgrade or fall back immediately.
   - **Layer 2 (Mistral Semantic Cross-Check)**: Independent fact-checker prompt (`open-mistral-7b`, Experiment tier) evaluates claim against cited source text as `supported | contradicted | unrelated`. If unverified, the specific claim is downgraded without looping.
   - Every execution's outcome is logged to `audit_log` with SHA-256 hashes and verifier state (`verified | repaired | unverified`).
4. **Exact Vector Search**: Postgres + pgvector operates in exact cosine search mode without ANN indexes (HNSW/IVFFlat) for a tight 25-rule corpus embedded via `gemini-embedding-001` (768-dim, Matryoshka-truncated).
5. **Multilingual (15 Scheduled Indian Languages)**: Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Odia, Malayalam, Punjabi, Assamese, Maithili, Santali, and Kashmiri.
6. **Voice Accessibility (STT & TTS)**: Speech-to-Text voice query dictation and Text-to-Speech audio read-aloud in English and regional Indian languages.
7. **Delivery via WhatsApp Cloud API Sandbox (FR-17)**: Webhook handler supports incoming text legal queries and PDF document attachments with automated zero-persistence acknowledgments.
8. **Scheduled Freshness Pipeline (FR-19)**: Daily GitHub Actions cron checks authoritative government sources (PIB, Gazette, MOHUA, India Code, MoRTH) and flags discrepancies for human review (no auto-merges).

---

## ⚖️ Five Legal Verticals Covered

| Vertical | Legislation Grounding | Key Protections Audited |
|---|---|---|
| **Rental & Tenancy** | Model Tenancy Act 2021, Karnataka Rent Act | 2-month security deposit cap, 15-day refund window, essential service cutoff bans, 30-day notice period. |
| **Employment** | Indian Contract Act 1872 (Sec 27), Payment of Wages Act | Post-termination non-compete voidness, 7-day salary release, notice period buyout parity. |
| **Gig Economy** | Motor Vehicle Aggregator Guidelines 2020, Social Security Code | Show-cause requirement before account deactivation, grievance escalation, payout hold bans. |
| **Consumer Disputes** | Consumer Protection Act 2019, E-Commerce Rules 2020 | Unfair cancellation fees, statutory defect replacement liability, e-Daakhil filing guidance. |
| **Traffic E-Challans** | Motor Vehicles (Amendment) Act 2019 | 15-day electronic notice dispatch mandate, wrong vehicle representation, Lok Adalat resolution. |

---

## 📁 Repository Structure

```
PaperTrail/
├── .github/workflows/         # Scheduled freshness cron and CI test workflows
│   ├── freshness.yml          # Daily 06:00 UTC check against government portals
│   └── test.yml               # Automated Pytest + Playwright CI pipeline
├── frontend/                  # React + Vite application (Vanilla CSS design system)
│   ├── e2e/                   # 11 Playwright end-to-end test suites
│   │   ├── targeted-qa.spec.ts
│   │   ├── document-viewer.spec.ts
│   │   └── accessibility-and-tools.spec.ts
│   ├── public/fixtures/       # Multi-page sample contracts across all 5 verticals
│   └── src/
│       ├── components/        # TargetedQA, DocumentViewer, DocumentReport, CompareView, LegalAidNavigator, DraftingView, VoiceInputOutput
│       ├── data/              # 25 curated statutory rules
│       ├── services/          # Edge API, Supabase client, PDF extractor
│       ├── styles/            # Design system, CSS tokens, viewer styles
│       └── types/             # Shared TypeScript types
├── supabase/                  # Supabase Edge Functions & Migrations
│   ├── functions/pipeline/    # 6-step orchestrator Edge Function (Deno)
│   ├── functions/whatsapp/    # WhatsApp Cloud API sandbox webhook handler
│   ├── migrations/            # Postgres schema (rule_pack, audit_log, clause_library)
│   └── seed.sql               # 25 curated rules with 768-dim embeddings
├── tests/                     # Python test harness (44 tests)
│   ├── test_classifier.py     # 5-vertical document classifier tests
│   ├── test_golden_set.py     # 10 benchmark question/document pairs
│   ├── test_live_pipeline.py  # Real Gemini Flash + Mistral API integration tests
│   ├── test_pdf_parser.py     # Position-aware PDF coordinate extraction
│   ├── test_pii_redaction.py  # Aadhaar, PAN, phone, bank account redaction
│   ├── test_prompt_injection.py # Injection defanging tests
│   ├── test_vector_retrieval.py # 768-dim Matryoshka cross-lingual retrieval
│   ├── test_verifier.py       # Layer 1 & Layer 2 decision ladder tests
│   └── test_whatsapp_webhook.py # WhatsApp GET challenge & POST message tests
├── scripts/                   # Auxiliary automation scripts
│   ├── freshness_check.py     # Scheduled check against authoritative sources
│   ├── generate_fixtures.py   # PDF fixture generator
│   ├── pdf_parser.py          # PyMuPDF position-aware coordinate extractor
│   └── seed_rules.py          # Embedding generator for rule pack
├── pyproject.toml             # uv-managed Python project
└── AGENTS.md                  # Project constraints and locked stack rules
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- Python ≥ 3.9 & [`uv`](https://github.com/astral-sh/uv)

### 1. Environment Setup
```bash
cp .env.example .env
# Provide GEMINI_API_KEY and MISTRAL_API_KEY
```

### 2. Frontend Development & Playwright Tests
```bash
cd frontend
npm install
npm run dev

# Run all 11 Playwright E2E tests
npm run test:e2e
```

### 3. Python Tests with `uv`
```bash
# Sync dependencies and run full test suite (44 tests)
uv sync
uv run pytest tests/ -v
```

### 4. Freshness Pipeline
```bash
uv run python scripts/freshness_check.py
```

---

## ⚖️ License
MIT License

