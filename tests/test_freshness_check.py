"""
Unit tests for the Scheduled Rule Pack Freshness Pipeline (FR-19).
Validates that source checking correctly flags discrepancies and passes on verified status.
"""
from unittest.mock import patch, MagicMock
from scripts.freshness_check import check_source_freshness

def test_freshness_check_all_success():
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    with patch("requests.get", return_value=mock_resp):
        exit_code = check_source_freshness()
        assert exit_code == 0

def test_freshness_check_detects_discrepancy():
    mock_resp = MagicMock()
    mock_resp.status_code = 404

    with patch("requests.get", return_value=mock_resp):
        exit_code = check_source_freshness()
        assert exit_code == 1

def test_freshness_check_handles_connection_error():
    with patch("requests.get", side_effect=Exception("Connection timeout")):
        exit_code = check_source_freshness()
        assert exit_code == 1
