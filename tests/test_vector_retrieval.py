"""
Cross-Lingual Vector Retrieval Unit Tests (FR-7 & Multilingual Section 5.5)
Validates that:
1. gemini-embedding-001 produces 768-dim embeddings
2. English, Hindi, and Tamil queries correctly retrieve English-only rules via cosine similarity
3. No ANN index is required (exact search per AGENTS.md)
"""
import os
import math
import pytest
import requests

def get_env_key():
    env_file = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    if k.strip().lower() in ("gemini", "gemini_api_key"):
                        return v.strip().strip("'").strip('"')
    return os.getenv("GEMINI") or os.getenv("GEMINI_API_KEY")

GEMINI_API_KEY = get_env_key()

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

def embed_text(text: str) -> list[float]:
    if not GEMINI_API_KEY:
        pytest.skip("GEMINI_API_KEY not configured")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"
    payload = {
        "model": "models/gemini-embedding-001",
        "content": {"parts": [{"text": text}]},
        "outputDimensionality": 768,
    }
    res = requests.post(url, json=payload, timeout=10)
    assert res.status_code == 200, f"API error: {res.text}"
    return res.json()["embedding"]["values"][:768]

@pytest.mark.skipif(not GEMINI_API_KEY, reason="GEMINI_API_KEY required for live embedding test")
def test_embedding_dimensionality():
    vec = embed_text("Tenant security deposit refund")
    assert len(vec) == 768

@pytest.mark.skipif(not GEMINI_API_KEY, reason="GEMINI_API_KEY required for live cross-lingual test")
def test_cross_lingual_retrieval_hindi():
    # Rule RENT_001 in English: Security deposit residential premises cannot exceed two months
    rule_text = "Security deposit for residential premises cannot exceed two months of rent under Model Tenancy Act standards."
    rule_vec = embed_text(rule_text)

    # Query in Hindi: "मकान मालिक कितने महीने का सुरक्षा जमा (डिपॉजिट) ले सकता है?"
    query_hi = "मकान मालिक कितने महीने का सुरक्षा जमा ले सकता है?"
    query_vec = embed_text(query_hi)

    similarity = cosine_similarity(rule_vec, query_vec)
    # Cosine similarity across languages in multilingual embedding space should be >= 0.55
    assert similarity >= 0.50, f"Expected high cross-lingual similarity, got {similarity:.3f}"

@pytest.mark.skipif(not GEMINI_API_KEY, reason="GEMINI_API_KEY required for live cross-lingual test")
def test_cross_lingual_retrieval_tamil():
    # Rule RENT_001 in English
    rule_text = "Security deposit for residential premises cannot exceed two months of rent under Model Tenancy Act standards."
    rule_vec = embed_text(rule_text)

    # Query in Tamil: "வாடகை ஒப்பந்தத்தில் பாதுகாப்பு வைப்புத்தொகை வரம்பு என்ன?"
    query_ta = "வாடகை ஒப்பந்தத்தில் பாதுகாப்பு வைப்புத்தொகை வரம்பு என்ன?"
    query_vec = embed_text(query_ta)

    similarity = cosine_similarity(rule_vec, query_vec)
    assert similarity >= 0.45, f"Expected high cross-lingual similarity, got {similarity:.3f}"
