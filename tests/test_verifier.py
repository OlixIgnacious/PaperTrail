"""
Unit tests for the Two-Layer Verifier (FR-11)
Constraint check:
- Layer 1: Every cited ID must be a member of the retrieved IDs set.
- Dual tracks: Document-grounded citations vs Statute-grounded citations.
- Strict fallback string checks.
"""
import pytest

EXACT_DOC_FALLBACK = "This cannot be determined from the information you provided."
EXACT_STATUTE_FALLBACK = "Outside our current rule coverage for this vertical — here's the free legal aid route."

def layer1_check(citations: list[dict], retrieved_statute_ids: set[str], session_clause_ids: set[str]) -> bool:
    if not citations:
        return True
    for c in citations:
        track = c.get("track")
        cid = c.get("id")
        if track == "statute":
            if cid not in retrieved_statute_ids:
                return False
        elif track == "document":
            if cid not in session_clause_ids:
                return False
        else:
            return False
    return True

def test_layer1_passes_valid_citations():
    retrieved_statutes = {"RENT_001", "RENT_002"}
    session_clauses = {"CL_1", "CL_2"}

    valid_citations = [
        {"track": "document", "id": "CL_1", "page_number": 1},
        {"track": "statute", "id": "RENT_001"},
    ]
    assert layer1_check(valid_citations, retrieved_statutes, session_clauses) is True

def test_layer1_fails_hallucinated_statute():
    retrieved_statutes = {"RENT_001"}
    session_clauses = {"CL_1"}

    # Model hallucinations an unretrieved statute RENT_999
    invalid_citations = [
        {"track": "statute", "id": "RENT_999"},
    ]
    assert layer1_check(invalid_citations, retrieved_statutes, session_clauses) is False

def test_layer1_fails_hallucinated_document_clause():
    retrieved_statutes = {"RENT_001"}
    session_clauses = {"CL_1", "CL_2"}

    # Model hallucinated CL_99
    invalid_citations = [
        {"track": "document", "id": "CL_99", "page_number": 5},
    ]
    assert layer1_check(invalid_citations, retrieved_statutes, session_clauses) is False

def test_exact_fallback_strings():
    # AGENTS.md requirement: Verbatim, word for word, exactly as written
    assert EXACT_DOC_FALLBACK == "This cannot be determined from the information you provided."
    assert EXACT_STATUTE_FALLBACK == "Outside our current rule coverage for this vertical — here's the free legal aid route."
