"""
Unit tests for PII Redaction (FR-3)
Validates that Aadhaar, PAN, phone numbers, and bank account numbers are redacted
before any text is sent to external LLMs.
"""
import re
import pytest

AADHAAR_PATTERN = re.compile(r"\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b")
PAN_PATTERN = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b")
PHONE_PATTERN = re.compile(r"(?:\+?91[\-\s]?)?[6-9]\d{9}\b")
BANK_ACCOUNT_PATTERN = re.compile(r"\b\d{9,18}\b")

VOTER_ID_PATTERN = re.compile(r"\b[A-Z]{3}[0-9]{7}\b")
DRIVING_LICENSE_PATTERN = re.compile(r"\b[A-Z]{2}[0-9]{2}\s?[0-9]{11}\b")

def redact_pii(text: str) -> str:
    text = AADHAAR_PATTERN.sub("[REDACTED_AADHAAR]", text)
    text = PAN_PATTERN.sub("[REDACTED_PAN]", text)
    text = PHONE_PATTERN.sub("[REDACTED_PHONE]", text)
    text = BANK_ACCOUNT_PATTERN.sub("[REDACTED_BANK_ACCOUNT]", text)
    text = VOTER_ID_PATTERN.sub("[REDACTED_VOTER_ID]", text)
    text = DRIVING_LICENSE_PATTERN.sub("[REDACTED_DRIVING_LICENSE]", text)
    return text

def test_aadhaar_redaction():
    text = "The tenant Aadhaar number is 5489 1234 5678 and spouse is 987654321098."
    redacted = redact_pii(text)
    assert "5489 1234 5678" not in redacted
    assert "987654321098" not in redacted
    assert "[REDACTED_AADHAAR]" in redacted

def test_pan_redaction():
    text = "Employer PAN is ABCDE1234F for tax deduction."
    redacted = redact_pii(text)
    assert "ABCDE1234F" not in redacted
    assert "[REDACTED_PAN]" in redacted

def test_phone_redaction():
    text = "Contact the landlord at +91 9876543210 or 8765432109 immediately."
    redacted = redact_pii(text)
    assert "9876543210" not in redacted
    assert "8765432109" not in redacted
    assert "[REDACTED_PHONE]" in redacted

def test_bank_account_redaction():
    text = "Security deposit must be wired to Account 501002345678912."
    redacted = redact_pii(text)
    assert "501002345678912" not in redacted
    assert "[REDACTED_BANK_ACCOUNT]" in redacted

def test_voter_id_redaction():
    text = "Tenant identity verified via Voter ID XYZ1234567 during verification."
    redacted = redact_pii(text)
    assert "XYZ1234567" not in redacted
    assert "[REDACTED_VOTER_ID]" in redacted

def test_driving_license_redaction():
    text = "Driver license registered as KA0120190012345 with transport authority."
    redacted = redact_pii(text)
    assert "KA0120190012345" not in redacted
    assert "[REDACTED_DRIVING_LICENSE]" in redacted

