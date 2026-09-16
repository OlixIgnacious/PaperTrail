#!/usr/bin/env python3
"""
PaperTrail Seed Rules & Embeddings Generator (FR-7)
Generates 768-dimensional Matryoshka-truncated embeddings via gemini-embedding-001
for all 25 hand-curated Indian legal rules across 5 verticals.
Updates supabase/seed.sql with exact vector(768) literals.
"""
import os
import sys
import time
import requests

def load_env():
    env_file = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'").strip('"')
                    os.environ[k] = v
                    os.environ[k.upper()] = v

load_env()
GEMINI_API_KEY = os.getenv("GEMINI") or os.getenv("GEMINI_API_KEY")

RULES = [
    # ---------------- RENTAL ----------------
    {
        "rule_id": "RENT_001",
        "vertical": "rental",
        "clause_category": "payment_terms",
        "rule_summary": "Security deposit for residential premises cannot exceed two months of rent under Model Tenancy Act standards.",
        "citation": "Model Tenancy Act 2021, Section 11(1)",
        "risk_if_violated": "Landlord may be ordered to refund excess deposit with statutory interest or face Rent Authority penalties.",
        "source_url": "https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf",
    },
    {
        "rule_id": "RENT_002",
        "vertical": "rental",
        "clause_category": "termination",
        "rule_summary": "Notice period for termination of tenancy by either party must be at least one month unless otherwise agreed in writing.",
        "citation": "Transfer of Property Act 1882, Section 106",
        "risk_if_violated": "Eviction notice declared null and void; landlord cannot recover possession without valid statutory notice.",
        "source_url": "https://indiacode.nic.in/handle/123456789/2338",
    },
    {
        "rule_id": "RENT_003",
        "vertical": "rental",
        "clause_category": "obligations",
        "rule_summary": "Landlord cannot withhold essential supply or service (water, electricity, access) to the tenant for non-payment of rent.",
        "citation": "Model Tenancy Act 2021, Section 20(1)",
        "risk_if_violated": "Rent Authority can impose heavy compensatory fines on landlord and restore utilities immediately.",
        "source_url": "https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf",
    },
    {
        "rule_id": "RENT_004",
        "vertical": "rental",
        "clause_category": "procedural_validity",
        "rule_summary": "Every tenancy agreement must be registered or intimated to the Rent Authority within two months of execution.",
        "citation": "Model Tenancy Act 2021, Section 4",
        "risk_if_violated": "Unregistered tenancy agreements may not be admissible in Rent Tribunal proceedings for relief.",
        "source_url": "https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf",
    },
    {
        "rule_id": "RENT_005",
        "vertical": "rental",
        "clause_category": "liability",
        "rule_summary": "Structural repairs and external maintenance are the legal obligation of the landlord, whereas routine day-to-day maintenance lies with tenant.",
        "citation": "Model Tenancy Act 2021, Section 15(1) & Second Schedule",
        "risk_if_violated": "Tenant may deduct repair expenditure from rent after notice if landlord neglects essential structural maintenance.",
        "source_url": "https://mohua.gov.in/upload/uploadfiles/files/Model_Tenancy_Act_English.pdf",
    },

    # ---------------- EMPLOYMENT ----------------
    {
        "rule_id": "EMP_001",
        "vertical": "employment",
        "clause_category": "termination",
        "rule_summary": "Post-termination non-compete clauses that restrain an employee from practicing a lawful profession or business are void in India.",
        "citation": "Indian Contract Act 1872, Section 27",
        "risk_if_violated": "Restraint covenants are legally unenforceable in Indian courts; employer cannot forfeit dues or sue for damages based on non-compete.",
        "source_url": "https://indiacode.nic.in/handle/123456789/2187",
    },
    {
        "rule_id": "EMP_002",
        "vertical": "employment",
        "clause_category": "payment_terms",
        "rule_summary": "Wages must be paid before the expiry of the 7th or 10th day after the last day of the wage period based on establishment size.",
        "citation": "Code on Wages 2019, Section 17(1) / Payment of Wages Act 1936, Section 5",
        "risk_if_violated": "Employer is liable to pay compensation up to ten times the delayed amount along with penal interest.",
        "source_url": "https://labour.gov.in/sites/default/files/the_code_on_wages_2019_no._29_of_2019.pdf",
    },
    {
        "rule_id": "EMP_003",
        "vertical": "employment",
        "clause_category": "penalty",
        "rule_summary": "Deduction from employee wages cannot exceed 50 percent of the total wage payable in any single wage period.",
        "citation": "Code on Wages 2019, Section 18(3)",
        "risk_if_violated": "Unlawful deductions constitute an offense under the Labour Code punishable with compounding fines.",
        "source_url": "https://labour.gov.in/sites/default/files/the_code_on_wages_2019_no._29_of_2019.pdf",
    },
    {
        "rule_id": "EMP_004",
        "vertical": "employment",
        "clause_category": "obligations",
        "rule_summary": "Every female employee who has worked for at least 80 days is entitled to 26 weeks of paid maternity leave.",
        "citation": "Maternity Benefit Amendment Act 2017, Section 5",
        "risk_if_violated": "Imprisonment up to one year and mandatory payment of full statutory wages and benefits.",
        "source_url": "https://labour.gov.in/sites/default/files/the_maternity_benefit_amendment_act2017.pdf",
    },
    {
        "rule_id": "EMP_005",
        "vertical": "employment",
        "clause_category": "termination",
        "rule_summary": "Employees with over 5 years of continuous service are statutorily entitled to gratuity on termination or resignation.",
        "citation": "Payment of Gratuity Act 1972, Section 4",
        "risk_if_violated": "Employer faces penal interest at standard bank rates plus prosecution for withholding gratuity.",
        "source_url": "https://indiacode.nic.in/handle/123456789/1572",
    },

    # ---------------- GIG WORKER ----------------
    {
        "rule_id": "GIG_001",
        "vertical": "gig",
        "clause_category": "obligations",
        "rule_summary": "Aggregators and platforms must contribute 1-2% of annual turnover towards social security funds for gig and platform workers.",
        "citation": "Code on Social Security 2020, Section 114",
        "risk_if_violated": "Aggregator defaults attract recovery as land revenue arrears and disqualification from operating licenses.",
        "source_url": "https://labour.gov.in/sites/default/files/the_code_on_social_security_2020_no._36_of_2020.pdf",
    },
    {
        "rule_id": "GIG_002",
        "vertical": "gig",
        "clause_category": "termination",
        "rule_summary": "Arbitrary de-platforming or account blocking without reasonable written grounds and prior notice violates fair platform principles.",
        "citation": "Rajasthan Platform Based Gig Workers Act 2023, Section 13 / Motor Vehicle Aggregator Guidelines 2020",
        "risk_if_violated": "State Gig Workers Welfare Board can impose financial penalties up to Rs 50,000 for arbitrary termination.",
        "source_url": "https://rajassembly.nic.in/BillsPDF/Bill29-2023.pdf",
    },
    {
        "rule_id": "GIG_003",
        "vertical": "gig",
        "clause_category": "payment_terms",
        "rule_summary": "Fares and compensation deductions must transparently reflect base fare, surge, and aggregator commission cap (maximum 20%).",
        "citation": "Motor Vehicle Aggregator Guidelines 2020, Clause 13",
        "risk_if_violated": "Violation results in suspension of aggregator operating authorization.",
        "source_url": "https://morth.nic.in/sites/default/files/notifications_document/Motor%20Vehicle%20Aggregator%20Guidelines%202020.pdf",
    },
    {
        "rule_id": "GIG_004",
        "vertical": "gig",
        "clause_category": "dispute_resolution",
        "rule_summary": "Aggregators must provide an accessible grievance redressal mechanism with mandatory dispute resolution within 7 days.",
        "citation": "Consumer Protection (E-Commerce) Rules 2020 / Rajasthan Gig Workers Act 2023, Section 15",
        "risk_if_violated": "Non-compliance leads to Consumer Commission penalties and regulatory investigation.",
        "source_url": "https://consumeraffairs.nic.in/sites/default/files/E-commerce_Rules.pdf",
    },
    {
        "rule_id": "GIG_005",
        "vertical": "gig",
        "clause_category": "liability",
        "rule_summary": "Aggregators must provide mandatory life and accidental disability insurance coverage to active delivery partners and drivers.",
        "citation": "Code on Social Security 2020, Section 112 / MoRTH Aggregator Guidelines",
        "risk_if_violated": "Platform held directly liable for medical expenses and compensation in fatal on-duty accidents.",
        "source_url": "https://morth.nic.in/sites/default/files/notifications_document/Motor%20Vehicle%20Aggregator%20Guidelines%202020.pdf",
    },

    # ---------------- CONSUMER ----------------
    {
        "rule_id": "CON_001",
        "vertical": "consumer",
        "clause_category": "liability",
        "rule_summary": "Manufacturers and service providers are strictly liable for harm caused by defective products or deficiency in services.",
        "citation": "Consumer Protection Act 2019, Section 84-86",
        "risk_if_violated": "Consumer Commissions can award punitive compensation, product recall, and damages for emotional and physical harm.",
        "source_url": "https://consumeraffairs.nic.in/sites/default/files/CP%20Act%202019.pdf",
    },
    {
        "rule_id": "CON_002",
        "vertical": "consumer",
        "clause_category": "procedural_validity",
        "rule_summary": "Unfair contracts containing unilateral termination, unreasonable penalty, or excessive security deposit are declared void.",
        "citation": "Consumer Protection Act 2019, Section 2(46) & Section 49(2)",
        "risk_if_violated": "State and National Consumer Commissions have authority to invalidate unfair clauses unconditionally.",
        "source_url": "https://consumeraffairs.nic.in/sites/default/files/CP%20Act%202019.pdf",
    },
    {
        "rule_id": "CON_003",
        "vertical": "consumer",
        "clause_category": "payment_terms",
        "rule_summary": "No business can demand or collect cancellation charges exceeding actual processing expenses for cancelled pre-bookings or services.",
        "citation": "Consumer Protection (E-Commerce) Rules 2020, Rule 6(4)",
        "risk_if_violated": "Full refund order with statutory interest and CCPA penalties for unfair trade practices.",
        "source_url": "https://consumeraffairs.nic.in/sites/default/files/E-commerce_Rules.pdf",
    },
    {
        "rule_id": "CON_004",
        "vertical": "consumer",
        "clause_category": "dispute_resolution",
        "rule_summary": "Consumers have the statutory right to file complaints online via the e-Daakhil portal without mandatory lawyer representation.",
        "citation": "Consumer Protection Act 2019, Section 35(1)",
        "risk_if_violated": "Denial of complaint admission on technical or geographical grounds is prohibited under the 2019 Act.",
        "source_url": "https://edaakhil.nic.in/edaakhil/",
    },
    {
        "rule_id": "CON_005",
        "vertical": "consumer",
        "clause_category": "penalty",
        "rule_summary": "Misleading advertisements and false claims of warranty or guarantees attract penalties up to Rs 10 Lakhs on the manufacturer.",
        "citation": "Consumer Protection Act 2019, Section 21",
        "risk_if_violated": "Central Consumer Protection Authority (CCPA) can ban endorsers and suspend commercial operations.",
        "source_url": "https://consumeraffairs.nic.in/sites/default/files/CP%20Act%202019.pdf",
    },

    # ---------------- TRAFFIC CHALLAN ----------------
    {
        "rule_id": "CHAL_001",
        "vertical": "challan",
        "clause_category": "procedural_validity",
        "rule_summary": "Traffic police cannot seize your physical driving license or RC if valid digital copies are presented via DigiLocker or mParivahan.",
        "citation": "Central Motor Vehicles Rules 1989, Rule 139 / MoRTH Notification RT-11036/64/2017-MVL",
        "risk_if_violated": "Officer demanding physical documents unlawfully is liable to departmental inquiry and procedural invalidation.",
        "source_url": "https://morth.nic.in/sites/default/files/circulars_document/Notification_19_Nov_2018.pdf",
    },
    {
        "rule_id": "CHAL_002",
        "vertical": "challan",
        "clause_category": "penalty",
        "rule_summary": "Compounding fines cannot be levied in cash without issuing an authentic electronic or printed receipt with officer designation.",
        "citation": "Motor Vehicles Act 1988 (as amended 2019), Section 200",
        "risk_if_violated": "Challan issued without verified machine receipt is deemed invalid and unenforceable in Lok Adalat.",
        "source_url": "https://morth.nic.in/sites/default/files/Motor%20Vehicles%20Amendment%20Act%202019.pdf",
    },
    {
        "rule_id": "CHAL_003",
        "vertical": "challan",
        "clause_category": "procedural_validity",
        "rule_summary": "E-challan notices sent through automated cameras must be served within the statutory window with timestamped photographic evidence.",
        "citation": "Motor Vehicles Act 1988, Section 136A & CMV Rules Rule 167A",
        "risk_if_violated": "Unserved or delayed photo-challans lacking clear number plate legibility can be struck down in virtual traffic courts.",
        "source_url": "https://morth.nic.in/sites/default/files/notifications_document/GSR_575_E.pdf",
    },
    {
        "rule_id": "CHAL_004",
        "vertical": "challan",
        "clause_category": "obligations",
        "rule_summary": "Only a police officer of the rank of Sub-Inspector (one star) or above is empowered to issue challans exceeding Rs 100 on the spot.",
        "citation": "Motor Vehicles Act 1988, Section 130 & State Police Regulations",
        "risk_if_violated": "Constables or head constables attempting to fine without an SI present act ultra vires (beyond jurisdiction).",
        "source_url": "https://morth.nic.in/sites/default/files/Motor%20Vehicles%20Amendment%20Act%202019.pdf",
    },
    {
        "rule_id": "CHAL_005",
        "vertical": "challan",
        "clause_category": "dispute_resolution",
        "rule_summary": "Citizens have the right to contest disputed challans through Virtual Courts or National Lok Adalat for compounding or dismissal.",
        "citation": "Legal Services Authorities Act 1987, Section 19 / eCourts Virtual Court Portal",
        "risk_if_violated": "Virtual courts allow dispute submission without physical court appearance, often offering mediated settlements.",
        "source_url": "https://vcourts.gov.in/virtualcourt/",
    },
]

CLAUSE_TEMPLATES = [
    {
        "clause_id": "LIB_RENT_DEPOSIT",
        "category": "payment_terms",
        "template_text": "The Tenant has deposited with the Landlord an amount of INR {{deposit_amount}}, equivalent to strictly two months rent, refundable in full within 15 days of peaceful handover of keys upon tenancy termination.",
        "vertical": "rental",
    },
    {
        "clause_id": "LIB_RENT_NOTICE",
        "category": "termination",
        "template_text": "Either party may terminate this tenancy by serving a formal written notice of at least 30 (thirty) days. In the event of emergency repairs or landlord default, tenant retains right to 7 days notice.",
        "vertical": "rental",
    },
    {
        "clause_id": "LIB_EMP_NOTICE",
        "category": "termination",
        "template_text": "The Employee shall provide {{notice_days}} days written notice or gross salary in lieu thereof. The Company agrees to relieve the Employee immediately upon buyout payment without withholding relieving letter or PF transfer.",
        "vertical": "employment",
    },
    {
        "clause_id": "LIB_EMP_IP",
        "category": "liability",
        "template_text": "All intellectual property developed solely during working hours using Company equipment belongs to the Company. Prior independent works and non-confidential personal skills remain the exclusive property of the Employee.",
        "vertical": "employment",
    },
    {
        "clause_id": "LIB_GIG_DISPUTE",
        "category": "dispute_resolution",
        "template_text": "In the event of account deactivation or payout dispute, the Aggregator must provide detailed logs and conduct a fair hearing within 7 working days before final suspension.",
        "vertical": "gig",
    },
    {
        "clause_id": "LIB_CON_REFUND",
        "category": "payment_terms",
        "template_text": "If the services are not delivered within the guaranteed timeline of {{sla_hours}} hours, the Consumer is entitled to 100% full refund credited back to the original source of payment within 48 hours.",
        "vertical": "consumer",
    },
]

def fetch_embedding(text: str) -> list[float]:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI API key not found in environment")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"
    payload = {
        "model": "models/gemini-embedding-001",
        "content": {"parts": [{"text": text}]},
        "outputDimensionality": 768,
    }

    res = requests.post(url, json=payload, timeout=15)
    if res.status_code != 200:
        raise RuntimeError(f"Embedding API failed ({res.status_code}): {res.text}")

    data = res.json()
    vals = data["embedding"]["values"]
    return vals[:768]

def escape_sql_str(s: str) -> str:
    return s.replace("'", "''")

def generate_seed_sql():
    print(f"🚀 Starting embedding generation for {len(RULES)} curated rules...")
    print("Using model: gemini-embedding-001 (768-dim, Matryoshka-truncated)")

    embedded_rules = []
    for idx, r in enumerate(RULES):
        rule_id = r["rule_id"]
        # Combine summary, citation, and risk for rich semantic matching
        embed_input = f"{r['rule_summary']} Reference: {r['citation']} Risk: {r['risk_if_violated']}"
        print(f"[{idx + 1}/{len(RULES)}] Embedding {rule_id}...")

        try:
            vec = fetch_embedding(embed_input)
            assert len(vec) == 768, f"Expected 768 dims, got {len(vec)}"
            embedded_rules.append((r, vec))
            # Rate limit politeness
            time.sleep(0.5)
        except Exception as e:
            print(f"Error embedding {rule_id}: {e}")
            raise

    print(f"\n✅ Successfully generated {len(embedded_rules)} embeddings!")

    # Format into SQL
    sql_lines = [
        "-- Seed data for PaperTrail",
        "-- Hand-curated Indian Legal Rules with real 768-dim gemini-embedding-001 vectors",
        "-- Exact pgvector cosine search without ANN indexes (per AGENTS.md)",
        "",
        "TRUNCATE TABLE public.rule_pack;",
        "TRUNCATE TABLE public.clause_library;",
        "",
    ]

    for r, vec in embedded_rules:
        vec_str = "[" + ", ".join(f"{v:.6f}" for v in vec) + "]"
        sql_lines.append(
            f"INSERT INTO public.rule_pack (rule_id, vertical, clause_category, rule_summary, citation, risk_if_violated, source_url, embedding) VALUES ("
            f"'{r['rule_id']}', "
            f"'{r['vertical']}', "
            f"'{r['clause_category']}', "
            f"'{escape_sql_str(r['rule_summary'])}', "
            f"'{escape_sql_str(r['citation'])}', "
            f"'{escape_sql_str(r['risk_if_violated'])}', "
            f"'{r['source_url']}', "
            f"'{vec_str}'::vector(768)"
            f");"
        )

    sql_lines.append("")
    sql_lines.append("-- Starter Clause Library (Notice Templates)")
    for tpl in CLAUSE_TEMPLATES:
        sql_lines.append(
            f"INSERT INTO public.clause_library (clause_id, category, template_text, vertical) VALUES ("
            f"'{tpl['clause_id']}', "
            f"'{tpl['category']}', "
            f"'{escape_sql_str(tpl['template_text'])}', "
            f"'{tpl['vertical']}'"
            f");"
        )

    seed_path = os.path.join(os.path.dirname(__file__), "..", "supabase", "seed.sql")
    with open(seed_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines) + "\n")

    print(f"🎉 Updated {seed_path} with {len(embedded_rules)} vector rows!")

if __name__ == "__main__":
    generate_seed_sql()
