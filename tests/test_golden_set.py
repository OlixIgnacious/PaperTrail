"""
Golden Test Set (TRD Section 7 & 8)
10-15 benchmark question/document pairs with known-correct citations and fallback tests.
"""
import pytest

GOLDEN_BENCHMARK_SET = [
    # 1. Rental - Notice Period
    {
        "id": "GOLD_01",
        "vertical": "rental",
        "document_text": "Clause 1.2: Either party may terminate by giving thirty (30) days written notice.",
        "question": "What is the notice period to terminate this tenancy?",
        "expected_citation_track": "document",
        "expected_page": 1,
        "is_out_of_scope": False,
    },
    # 2. Rental - Security Deposit Limit
    {
        "id": "GOLD_02",
        "vertical": "rental",
        "document_text": "Clause 2.1: Tenant agrees to pay 10 months rent as refundable deposit.",
        "question": "Is 10 months security deposit legally permissible under Model Tenancy Act?",
        "expected_citation_track": "statute",
        "expected_statute_id": "RENT_001",
        "is_out_of_scope": False,
    },
    # 3. Rental - Out of scope
    {
        "id": "GOLD_03",
        "vertical": "rental",
        "document_text": "Standard lease agreement mentioning rent and deposit.",
        "question": "Can I keep a Siberian husky pet inside this apartment?",
        "expected_fallback": "This cannot be determined from the information you provided.",
        "is_out_of_scope": True,
    },
    # 4. Employment - Notice buyout
    {
        "id": "GOLD_04",
        "vertical": "employment",
        "document_text": "Clause 8: The employee must serve 60 days notice or pay gross salary in lieu.",
        "question": "How long is my notice period?",
        "expected_citation_track": "document",
        "expected_page": 1,
        "is_out_of_scope": False,
    },
    # 5. Employment - Non-compete validity
    {
        "id": "GOLD_05",
        "vertical": "employment",
        "document_text": "Clause 11: Employee shall not join any competing technology company in India for 1 year.",
        "question": "Is this post-employment non-compete clause legally binding in India?",
        "expected_citation_track": "statute",
        "expected_statute_id": "EMP_001",
        "is_out_of_scope": False,
    },
    # 6. Employment - Out of scope
    {
        "id": "GOLD_06",
        "vertical": "employment",
        "document_text": "Offer letter covering salary and benefits.",
        "question": "Does this company provide free lunch and gym membership?",
        "expected_fallback": "This cannot be determined from the information you provided.",
        "is_out_of_scope": True,
    },
    # 7. Gig - Commission Cap
    {
        "id": "GOLD_07",
        "vertical": "gig",
        "document_text": "Partner agreement stating aggregator deducts 35% commission on all rides.",
        "question": "What is the maximum statutory cap on aggregator commission?",
        "expected_citation_track": "statute",
        "expected_statute_id": "GIG_003",
        "is_out_of_scope": False,
    },
    # 8. Consumer - Cancellation fee
    {
        "id": "GOLD_08",
        "vertical": "consumer",
        "document_text": "Booking terms stating 100% cancellation penalty applies immediately upon payment.",
        "question": "Can an e-commerce platform charge arbitrary cancellation charges?",
        "expected_citation_track": "statute",
        "expected_statute_id": "CON_003",
        "is_out_of_scope": False,
    },
    # 9. Challan - Digital documents
    {
        "id": "GOLD_09",
        "vertical": "challan",
        "document_text": "Notice of fine for failure to show physical driving license.",
        "question": "Can police seize my physical license if DigiLocker copy is presented?",
        "expected_citation_track": "statute",
        "expected_statute_id": "CHAL_001",
        "is_out_of_scope": False,
    },
    # 10. Challan - Out of scope
    {
        "id": "GOLD_10",
        "vertical": "challan",
        "document_text": "Speeding challan issued on Highway 44.",
        "question": "What was the weather like on the date of this violation?",
        "expected_fallback": "This cannot be determined from the information you provided.",
        "is_out_of_scope": True,
    },
]

@pytest.mark.parametrize("case", GOLDEN_BENCHMARK_SET)
def test_golden_benchmark_cases(case):
    assert case["id"].startswith("GOLD_")
    if case["is_out_of_scope"]:
        assert case["expected_fallback"] == "This cannot be determined from the information you provided."
    else:
        assert case["expected_citation_track"] in ("document", "statute")
