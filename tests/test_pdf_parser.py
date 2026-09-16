"""
Unit tests for Position-Aware PDF Parsing (FR-6, FR-21, FR-22)
Validates PyMuPDF extraction:
- Exact page numbers
- Word / block-level normalized bounding boxes [x0, y0, x1, y1] (0.0 to 1.0)
- Shared taxonomy categorization
- Zero document persistence (session structures only)
"""
import os
import pytest
from scripts.pdf_parser import parse_pdf_with_positions, ExtractedClause

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

@pytest.fixture
def rental_pdf_path():
    path = os.path.join(FIXTURES_DIR, "rental_agreement.pdf")
    assert os.path.exists(path), f"Fixture not found at {path}"
    return path

@pytest.fixture
def employment_pdf_path():
    path = os.path.join(FIXTURES_DIR, "employment_offer.pdf")
    assert os.path.exists(path), f"Fixture not found at {path}"
    return path

def test_rental_pdf_extraction(rental_pdf_path):
    clauses = parse_pdf_with_positions(rental_pdf_path)
    assert len(clauses) >= 4, "Expected at least 4 text blocks extracted"

    pages_found = set()
    categories_found = set()

    for c in clauses:
        assert isinstance(c, ExtractedClause)
        assert c.clause_id.startswith("CL_")
        assert len(c.clause_text) > 15
        assert c.page_number in (1, 2)
        pages_found.add(c.page_number)
        categories_found.add(c.clause_category)

        # Validate bounding box normalization: [x0, y0, x1, y1]
        bbox = c.position.get("bbox")
        assert bbox is not None, "Missing bounding box position"
        assert len(bbox) == 4
        x0, y0, x1, y1 = bbox
        assert 0.0 <= x0 < x1 <= 1.0, f"Invalid x coordinates: {x0}, {x1}"
        assert 0.0 <= y0 < y1 <= 1.0, f"Invalid y coordinates: {y0}, {y1}"

    # Verify multi-page span
    assert 1 in pages_found
    assert 2 in pages_found

    # Verify category assignments
    assert "payment_terms" in categories_found or "termination" in categories_found

def test_employment_pdf_extraction(employment_pdf_path):
    clauses = parse_pdf_with_positions(employment_pdf_path)
    assert len(clauses) >= 3

    has_notice_or_noncompete = any(
        "notice" in c.clause_text.lower() or "non-compete" in c.clause_text.lower()
        for c in clauses
    )
    assert has_notice_or_noncompete is True

@pytest.mark.parametrize("pdf_name", [
    "rental_agreement.pdf",
    "employment_offer.pdf",
    "gig_platform_terms.pdf",
    "consumer_warranty.pdf",
    "traffic_echallan.pdf",
])
def test_all_five_verticals_fixtures(pdf_name):
    pdf_path = os.path.join(FIXTURES_DIR, pdf_name)
    assert os.path.exists(pdf_path), f"Missing fixture: {pdf_name}"

    clauses = parse_pdf_with_positions(pdf_path)
    assert len(clauses) > 0, f"Failed to extract clauses from {pdf_name}"

    for c in clauses:
        assert c.page_number >= 1
        bbox = c.position["bbox"]
        assert 0.0 <= bbox[0] < bbox[2] <= 1.0
        assert 0.0 <= bbox[1] < bbox[3] <= 1.0
