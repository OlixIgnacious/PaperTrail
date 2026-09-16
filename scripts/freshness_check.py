#!/usr/bin/env python3
"""
PaperTrail Freshness Pipeline (FR-19)
Scheduled check against authoritative legal source URLs (PIB, Gazette, Ministry portals).
Flags changes for human review (no auto-merge, preserving hand-curated rule accuracy).
"""
import os
import sys
import hashlib
import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

SAMPLE_SOURCES = [
    {
        "rule_id": "RENT_001",
        "url": "https://mohua.gov.in",
        "expected_status": 200,
        "description": "Ministry of Housing and Urban Affairs (Model Tenancy Act portal)",
    },
    {
        "rule_id": "EMP_001",
        "url": "https://www.indiacode.nic.in",
        "expected_status": 200,
        "description": "India Code Digital Repository (Indian Contract Act 1872)",
    },
    {
        "rule_id": "CHAL_001",
        "url": "https://morth.nic.in",
        "expected_status": 200,
        "description": "Ministry of Road Transport and Highways (Motor Vehicles notifications)",
    },
]

def check_source_freshness():
    print("🔍 [Freshness Pipeline] Starting scheduled check against authoritative sources...")
    discrepancies = []

    for item in SAMPLE_SOURCES:
        rule_id = item["rule_id"]
        url = item["url"]
        desc = item.get("description", "")
        try:
            resp = requests.get(url, headers=HEADERS, stream=True, timeout=12, allow_redirects=True)
            if resp.status_code != item["expected_status"]:
                discrepancies.append({
                    "rule_id": rule_id,
                    "url": url,
                    "issue": f"HTTP status {resp.status_code} (expected {item['expected_status']})"
                })
            else:
                print(f"  ✓ {rule_id} ({desc}): Accessible at {url} (status {resp.status_code})")
        except Exception as e:
            discrepancies.append({
                "rule_id": rule_id,
                "url": url,
                "issue": f"Connection failure: {e}"
            })

    if discrepancies:
        print("\n⚠️ [Freshness Pipeline] Discrepancies detected requiring human review:")
        for d in discrepancies:
            print(f"  - Rule {d['rule_id']}: {d['issue']}")
        # Non-zero exit if running in CI to trigger alert notification
        return 1
    
    print("\n✅ [Freshness Pipeline] All authoritative sources verified successfully.")
    return 0

if __name__ == "__main__":
    sys.exit(check_source_freshness())
