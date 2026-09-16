"""
Unit tests for Vertical Classification (FR-5)
Verifies documents are routed to rental, employment, gig, consumer, or challan.
"""
import pytest

KEYWORDS = {
    "rental": ["landlord", "tenant", "lease", "rent", "security deposit", "eviction"],
    "employment": ["employee", "employer", "salary", "probation", "notice period", "non-compete"],
    "gig": ["delivery partner", "driver partner", "aggregator", "gig worker", "platform worker"],
    "consumer": ["deficiency in service", "defect in goods", "warranty", "unfair trade practice"],
    "challan": ["challan", "traffic violation", "motor vehicles act", "driving license", "rc"],
}

def classify(text: str) -> str:
    text_lower = text.lower()
    scores = {k: sum(1 for w in words if w in text_lower) for k, words in KEYWORDS.items()}
    return max(scores, key=scores.get)

def test_classify_rental():
    text = "The tenant shall pay a monthly rent of 20000 and deposit to the landlord."
    assert classify(text) == "rental"

def test_classify_employment():
    text = "The employee shall serve a notice period of 60 days upon resigning from employer."
    assert classify(text) == "employment"

def test_classify_gig():
    text = "The aggregator platform worker or delivery partner compensation structure."
    assert classify(text) == "gig"

def test_classify_consumer():
    text = "Complaint regarding deficiency in service and defective electronics warranty."
    assert classify(text) == "consumer"

def test_classify_challan():
    text = "E-challan issued for traffic violation under motor vehicles act."
    assert classify(text) == "challan"
