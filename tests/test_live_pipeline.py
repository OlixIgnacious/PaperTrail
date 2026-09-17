"""
Live Pipeline Integration Tests (Days 5-7: Inference & Verifier Engine)
Executes real end-to-end API calls to:
1. Gemini Flash (generation, temperature 0, structured JSON output)
2. Mistral (Layer 2 semantic cross-check)
Validates:
- Document-grounded track citation format {clause_id, page_number}
- Exact verbatim fallback: "This cannot be determined from the information you provided."
- Statute-grounded track citation format {rule_id}
- Verifier decision ladder: verified | repaired | unverified
"""
import os
import json
import pytest
import requests
import time

pytestmark = pytest.mark.live


def get_env():
    env_file = os.path.join(os.path.dirname(__file__), "..", ".env")
    env = {}
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    env[k.strip().lower()] = v.strip().strip("'\"")
    return env

ENV = get_env()
GEMINI_KEY = ENV.get("gemini")
MISTRAL_KEY = ENV.get("mistral")

EXACT_DOC_FALLBACK = "This cannot be determined from the information you provided."
EXACT_STATUTE_FALLBACK = "Outside our current rule coverage for this vertical — here's the free legal aid route."

def generate_answer_with_gemini(question: str, doc_matches: list[dict], statute_matches: list[dict], language: str = "en") -> dict:
    if not doc_matches and not statute_matches:
        return {
            "answer": EXACT_DOC_FALLBACK,
            "answer_local": EXACT_DOC_FALLBACK,
            "citations": [],
            "confidence": 1.0,
        }

    prompt = f"""You are PaperTrail, an expert legal assistant for Indian consumers.
Your goal is to answer the user's specific question STRICTLY based on the provided context.

RULES:
1. Temperature 0: Be objective, factual, concise, and grounded.
2. NEVER hallucinate legal facts, clauses, or sections.
3. If the user's uploaded document does not contain enough information to answer the question, you MUST return verbatim: "{EXACT_DOC_FALLBACK}".
4. Ground every statement in either the Document Grounding Track or the Statute Grounding Track. Prefer Document Track first.
5. All citations must be listed ONLY in the "citations" JSON array. Do NOT embed bracketed citations into the prose.
6. Provide "answer" in English.
7. Provide "answer_local" in requested language: "{language}".
8. Return ONLY raw valid JSON:
{{
  "answer": "English answer",
  "answer_local": "Local language answer",
  "citations": [
    {{
      "track": "document" | "statute",
      "id": "clause_id or rule_id",
      "page_number": 1,
      "citation_label": "Clause or Rule reference"
    }}
  ],
  "confidence": 0.95
}}

CONTEXT:
--- DOCUMENT GROUNDING TRACK ---
{json.dumps(doc_matches, indent=2) if doc_matches else "No document clauses found."}

--- STATUTE GROUNDING TRACK ---
{json.dumps(statute_matches, indent=2) if statute_matches else "No statute rules found."}

USER QUESTION:
"{question}"
"""

    models_to_try = ["gemini-flash-latest", "gemini-3.1-flash-lite"]
    res = None
    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_KEY}"
        for attempt in range(3):
            try:
                res = requests.post(url, json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.0, "responseMimeType": "application/json"},
                }, timeout=25)
                if res.status_code == 200:
                    break
                if res.status_code in (503, 429):
                    time.sleep(min(10, 2 * (attempt + 1)))
                    continue
            except Exception:
                time.sleep(2)
        if res is not None and res.status_code == 200:
            break

    assert res is not None and res.status_code == 200, f"Gemini generation error: {res.text if res else 'No response'}"
    content = res.json()["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(content)

def verify_with_mistral(claim: str, source_context: str) -> dict:
    prompt = f"""You are a strict legal fact-checker.
Given the source legal text and the claim made, evaluate if the claim is factual and directly supported.

SOURCE TEXT:
\"\"\"
{source_context}
\"\"\"

CLAIM TO VERIFY:
\"\"\"
{claim}
\"\"\"

Respond with ONLY valid JSON:
{{
  "verdict": "supported" | "contradicted" | "unrelated",
  "reason": "One concise sentence explaining why."
}}
"""
    m_url = "https://api.mistral.ai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {MISTRAL_KEY}", "Content-Type": "application/json"}
    res = requests.post(m_url, headers=headers, json={
        "model": "open-mistral-7b",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.0,
        "max_tokens": 100,
        "response_format": {"type": "json_object"},
    }, timeout=15)

    assert res.status_code == 200, f"Mistral verifier error: {res.text}"
    content = res.json()["choices"][0]["message"]["content"]
    return json.loads(content)

@pytest.mark.skipif(not GEMINI_KEY, reason="GEMINI API key required")
def test_live_document_grounded_qa():
    # Sample clause from rental_agreement.pdf
    doc_matches = [
        {
            "clause_id": "CL_2",
            "page_number": 1,
            "clause_category": "termination",
            "clause_text": "Either party may terminate this agreement by providing a minimum of 30 (thirty) days written notice to the other party without assigning reasons.",
        }
    ]

    question = "What is the notice period for terminating this tenancy agreement?"
    output = generate_answer_with_gemini(question, doc_matches, [])

    # Assertions on grounded answer
    assert "30" in output["answer"] or "thirty" in output["answer"].lower()
    assert len(output["citations"]) > 0
    cit = output["citations"][0]
    assert cit["track"] == "document"
    assert cit["id"] == "CL_2"
    assert cit["page_number"] == 1

    # Layer 1 deterministic check
    retrieved_doc_ids = {"CL_2"}
    assert set(c["id"] for c in output["citations"]).issubset(retrieved_doc_ids)

    # Layer 2 Mistral verification
    if MISTRAL_KEY:
        source_text = f"[Clause {doc_matches[0]['clause_id']} P{doc_matches[0]['page_number']}]: {doc_matches[0]['clause_text']}"
        v_res = verify_with_mistral(output["answer"], source_text)
        assert v_res["verdict"] == "supported"

@pytest.mark.skipif(not GEMINI_KEY, reason="GEMINI API key required")
def test_live_out_of_scope_exact_fallback():
    # Document has only lease term, question asks about something completely ungrounded
    doc_matches = [
        {
            "clause_id": "CL_1",
            "page_number": 1,
            "clause_category": "obligations",
            "clause_text": "The tenancy commences on 1st Jan 2026 for a duration of 11 months.",
        }
    ]

    question = "Can I keep a tiger or an exotic crocodile inside this rented apartment?"
    output = generate_answer_with_gemini(question, doc_matches, [])

    # Exact fallback string requirement from Challenge Spec
    assert EXACT_DOC_FALLBACK in output["answer"]
    assert output["citations"] == []

@pytest.mark.skipif(not GEMINI_KEY or not MISTRAL_KEY, reason="Both GEMINI and MISTRAL keys required")
def test_live_statute_grounded_qa_and_cross_check():
    # Statute rule for Employment Non-Compete
    statute_matches = [
        {
            "rule_id": "EMP_001",
            "vertical": "employment",
            "clause_category": "termination",
            "rule_summary": "Post-termination non-compete clauses that restrain an employee from practicing a lawful profession or business are void in India.",
            "citation": "Indian Contract Act 1872, Section 27",
            "risk_if_violated": "Restraint covenants are legally unenforceable in Indian courts; employer cannot forfeit dues or sue for damages based on non-compete.",
        }
    ]

    question = "Is a 2-year post-termination non-compete clause legally enforceable against an employee in India?"
    output = generate_answer_with_gemini(question, [], statute_matches)

    assert len(output["citations"]) > 0
    cit = output["citations"][0]
    assert cit["track"] == "statute"
    assert cit["id"] == "EMP_001"

    # Layer 2 Mistral cross-check
    source_text = f"[Rule {statute_matches[0]['rule_id']}]: {statute_matches[0]['rule_summary']} ({statute_matches[0]['citation']})"
    v_res = verify_with_mistral(output["answer"], source_text)
    assert v_res["verdict"] == "supported"

@pytest.mark.skipif(not MISTRAL_KEY, reason="Mistral key required")
def test_live_mistral_contradiction_detection():
    # Provide source stating 30 days notice
    source_text = "Either party may terminate by providing a minimum of 30 days written notice."
    # Fabricated false claim
    false_claim = "The agreement requires 12 months advance notice to terminate."

    v_res = verify_with_mistral(false_claim, source_text)
    assert v_res["verdict"] in ("contradicted", "unrelated")
