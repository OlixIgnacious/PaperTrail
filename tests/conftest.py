"""
Pytest configuration and shared fixtures for PaperTrail test harness.
"""
import pytest

@pytest.fixture
def sample_lease_agreement():
    return """
    RESIDENTIAL LEASE AGREEMENT
    This Agreement is entered into between Landlord and Tenant.
    1. Notice Period: Either party must provide 30 days written notice to vacate.
    2. Security Deposit: Tenant has deposited INR 50,000, refundable within 15 days of key handover.
    3. Utilities: Landlord cannot disconnect electricity or water supply under Section 20 of Model Tenancy Act.
    4. Contact: Tenant Aadhaar 5489 1234 5678, Phone +91 9876543210, Account 123456789012.
    """

@pytest.fixture
def sample_offer_letter():
    return """
    EMPLOYMENT OFFER LETTER
    Designation: Senior Software Engineer. CTC: INR 24,00,000.
    1. Notice Period: 60 days written notice required for voluntary separation.
    2. Non-Compete: Employee covenants not to work for any competitor globally for 2 years post separation.
    3. Deductions: Maximum deduction shall not exceed 50% of monthly wage.
    """
