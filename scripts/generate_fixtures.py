"""
Fixture Generator for PaperTrail
Generates 5 realistic sample PDFs across 5 verticals using PyMuPDF:
1. rental_agreement.pdf
2. employment_offer.pdf
3. gig_platform_terms.pdf
4. consumer_warranty.pdf
5. traffic_echallan.pdf

Outputs files to tests/fixtures/ and frontend/public/fixtures/.
"""
import os
import fitz  # PyMuPDF

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "..", "tests", "fixtures")
FRONTEND_FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "fixtures")

os.makedirs(FIXTURES_DIR, exist_ok=True)
os.makedirs(FRONTEND_FIXTURES_DIR, exist_ok=True)

def create_sample_pdf(file_name: str, pages_data: list[list[str]]):
    """
    Creates a multi-page PDF with clear paragraphs and layout coordinates.
    """
    doc = fitz.open()

    for page_idx, paragraphs in enumerate(pages_data):
        page = doc.new_page(width=595, height=842) # A4 size in points
        y_offset = 60

        # Header
        page.insert_text((50, y_offset), f"DOCUMENT VERIFICATION SAMPLE: {file_name.upper()}", fontsize=11, fontname="helv", color=(0.4, 0.4, 0.4))
        y_offset += 30

        for p_text in paragraphs:
            # Insert textbox so it wraps nicely
            rect = fitz.Rect(50, y_offset, 545, y_offset + 90)
            page.insert_textbox(rect, p_text.strip(), fontsize=10, fontname="helv", lineheight=1.4)
            y_offset += 100

        # Footer
        page.insert_text((260, 810), f"Page {page_idx + 1} of {len(pages_data)}", fontsize=9, fontname="helv", color=(0.5, 0.5, 0.5))

    paths = [
        os.path.join(FIXTURES_DIR, file_name),
        os.path.join(FRONTEND_FIXTURES_DIR, file_name),
    ]

    for p in paths:
        doc.save(p)

    doc.close()
    print(f"✓ Generated {file_name} in {FIXTURES_DIR} and {FRONTEND_FIXTURES_DIR}")

def generate_all_fixtures():
    # 1. Rental Agreement (2 Pages)
    rental_pages = [
        [
            "RESIDENTIAL TENANCY AGREEMENT\nThis Agreement is made on 1st January 2026 at Bengaluru, Karnataka between Smt. Lakshmi R (Landlord) and Sri Karthik Menon (Tenant).",
            "1. TERM & NOTICE PERIOD\nThe tenancy shall be for a period of 11 months commencing from 1st January 2026. Either party may terminate this agreement by providing a minimum of 30 (thirty) days written notice to the other party without assigning reasons.",
            "2. SECURITY DEPOSIT\nThe Tenant has paid an amount of INR 50,000 (Fifty Thousand Rupees), equivalent to two months rent, as refundable interest-free security deposit. The Landlord covenants to refund the deposit in full within 15 days of peaceful vacation and key handover.",
            "3. ESSENTIAL UTILITIES & SERVICES\nThe Landlord covenants not to withhold or cut off any essential supply or service including water, electricity, elevator, or access stairs during the subsistence of this tenancy under Section 20 of Model Tenancy Act.",
        ],
        [
            "4. MAINTENANCE & STRUCTURAL REPAIRS\nStructural repairs, major external seepage, and roof dampness remain the sole financial obligation of the Landlord. The Tenant shall undertake routine minor electrical and plumbing maintenance.",
            "5. DISPUTE JURISDICTION\nAny dispute arising hereunder shall be referred to the Rent Authority and Rent Tribunal established under the Karnataka Rent Control / Model Tenancy Act provisions at Bengaluru.",
        ]
    ]
    create_sample_pdf("rental_agreement.pdf", rental_pages)

    # 2. Employment Offer Letter (2 Pages)
    employment_pages = [
        [
            "APPOINTMENT AND OFFER LETTER - TECHSOLVE INDIA PVT LTD\nDate: 15th January 2026. Employee: Vikram Malhotra. Designation: Principal Systems Architect.",
            "1. PROBATION & NOTICE PERIOD\nYou will be on probation for 3 months. Post confirmation, either party may terminate employment by serving 60 (sixty) days prior written notice or gross salary in lieu thereof upon mutual consent.",
            "2. POST-TERMINATION NON-COMPETE COVENANT\nThe Employee agrees that for a period of 24 months following separation from the Company, they shall not directly or indirectly accept employment with any competing software firm in India.",
        ],
        [
            "3. STATUTORY WAGE DEDUCTIONS\nDeductions from monthly salary shall strictly comply with Code on Wages 2019 Section 18, and aggregate deductions shall never exceed fifty (50) percent of total monthly wages.",
            "4. GRATUITY & RETIREMENT BENEFITS\nUpon continuous service exceeding 5 years, statutory gratuity shall be payable in accordance with the Payment of Gratuity Act 1972.",
        ]
    ]
    create_sample_pdf("employment_offer.pdf", employment_pages)

    # 3. Gig Platform Terms
    gig_pages = [
        [
            "AGGREGATOR PLATFORM PARTNER AGREEMENT\nBetween UrbanRide Logistics Technologies Pvt Ltd and Registered Driver Partner.",
            "1. COMMISSION AND FARE TRANSPARENCY\nThe Platform shall deduct a maximum commission not exceeding twenty (20) percent of total gross fare per ride, in compliance with Central Motor Vehicle Aggregator Guidelines.",
            "2. ARBITRARY ACCOUNT DEACTIVATION\nThe Platform shall not deactivate or de-board any driver partner without providing written grounds and 7 days prior intimation, except in proven safety emergencies.",
            "3. GRIEVANCE REDRESSAL MECHANISM\nA designated state grievance officer shall investigate and resolve partner payout and rating disputes within a statutory timeline of seven working days.",
        ]
    ]
    create_sample_pdf("gig_platform_terms.pdf", gig_pages)

    # 4. Consumer Warranty & Service
    consumer_pages = [
        [
            "CONSUMER APPLIANCE PURCHASE & WARRANTY INVOICE\nIssued by Apex Retailers Ltd to Consumer Smt. Ananya Sen. Invoice No: APX-98214.",
            "1. CANCELLATION CHARGES LIMIT\nIf order cancellation is initiated prior to item dispatch, no cancellation charges exceeding actual bank processing fee shall be deducted under Consumer Protection E-Commerce Rules.",
            "2. DEFICIENCY IN SERVICE & PRODUCT LIABILITY\nThe manufacturer guarantees replacement or full refund within 14 days if the delivered product develops manufacturing defects within warranty period under CPA 2019.",
            "3. ONLINE COMPLAINTS (E-DAAKHIL)\nIn the event of unresolved deficiency, the consumer retains statutory right to file electronic complaints via the National e-Daakhil Consumer Forum without lawyer representation.",
        ]
    ]
    create_sample_pdf("consumer_warranty.pdf", consumer_pages)

    # 5. Traffic E-Challan Notice
    challan_pages = [
        [
            "TRAFFIC POLICE DEPARTMENT - ELECTRONIC VIOLATION NOTICE\nNotice No: KA-01-2026-CHAL-4819. Vehicle No: KA-01-MJ-2024.",
            "1. NOTICE OF ALLEGED OFFENSE\nAlleged violation of Rule 119 Motor Vehicles Act for failure to produce physical documents on demand.",
            "2. DIGITAL DOCUMENT ACCEPTANCE\nAs per Rule 139 of Central Motor Vehicles Rules and MoRTH Notification, valid electronic certificates presented via DigiLocker or mParivahan apps are legally equivalent to physical documents.",
            "3. VIRTUAL COURT CONTEST & COMPOUNDING\nNotice recipient may contest this fine online before the Virtual Traffic Court or settle via Lok Adalat without physical court appearance.",
        ]
    ]
    create_sample_pdf("traffic_echallan.pdf", challan_pages)

if __name__ == "__main__":
    generate_all_fixtures()
