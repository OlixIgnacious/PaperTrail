"""
Position-Aware PDF Parser for PaperTrail (FR-6, FR-21, FR-22)
Uses PyMuPDF (fitz) to extract coherent legal clauses with page numbers and
normalized coordinates [x0, y0, x1, y1] for exact frontend jump-to-source highlighting.

Preserves NFR-1: Session-scoped only, never persisted.
"""
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Any
import re
import pymupdf

SHARED_CATEGORIES = [
    "payment_terms",
    "termination",
    "liability",
    "penalty",
    "dispute_resolution",
    "obligations",
    "procedural_validity",
]

CATEGORY_KEYWORDS = {
    "payment_terms": ["rent", "deposit", "security deposit", "payment", "salary", "wage", "ctc", "fee", "fare", "refund"],
    "termination": ["terminate", "termination", "notice period", "resign", "resignation", "vacate", "eviction", "deactivation"],
    "liability": ["liability", "liable", "indemnify", "indemnity", "damages", "loss", "injury", "accidental", "insurance", "structural repairs"],
    "penalty": ["penalty", "penal", "fine", "forfeit", "forfeiture", "deduction", "deduct", "interest", "compounding fee"],
    "dispute_resolution": ["dispute", "arbitration", "jurisdiction", "court", "tribunal", "rent authority", "lok adalat", "grievance"],
    "procedural_validity": ["registered", "registration", "stamp duty", "notarized", "validity", "digilocker", "mparivahan", "receipt"],
    "obligations": ["obligations", "covenant", "maintenance", "repairs", "duties", "shall provide", "agrees to", "essential supply", "utilities"],
}

@dataclass
class ExtractedClause:
    clause_id: str
    clause_text: str
    clause_category: str
    page_number: int
    position: Dict[str, Any]  # {"bbox": [x0, y0, x1, y1], "char_offset": int}

def categorize_text(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        scores[cat] = score

    top_cat = max(scores, key=scores.get)
    return top_cat if scores[top_cat] > 0 else "obligations"

def parse_pdf_with_positions(file_path_or_bytes, is_bytes: bool = False) -> List[ExtractedClause]:
    """
    Parses a PDF document, extracting coherent numbered clauses/paragraphs with
    normalized bounding boxes [x0, y0, x1, y1] where values range from 0.0 to 1.0.
    """
    if is_bytes:
        doc = pymupdf.open(stream=file_path_or_bytes, filetype="pdf")
    else:
        doc = pymupdf.open(file_path_or_bytes)

    extracted_clauses: List[ExtractedClause] = []
    clause_counter = 1

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_num = page_idx + 1
        page_width = page.rect.width
        page_height = page.rect.height

        blocks = page.get_text("blocks")

        # Filter out header/footer noise
        valid_blocks = []
        for b in blocks:
            x0, y0, x1, y1, text, block_no, block_type = b
            clean_text = text.strip()
            if block_type != 0 or not clean_text:
                continue
            if "DOCUMENT VERIFICATION" in clean_text or re.match(r"^Page\s+\d+\s+of", clean_text):
                continue
            if len(clean_text) < 5:
                continue
            valid_blocks.append((x0, y0, x1, y1, clean_text))

        current_group = []
        for b in valid_blocks:
            x0, y0, x1, y1, clean_text = b
            # Check if this block starts a new numbered clause or major section
            is_new_section = bool(re.match(r"^(\d+\.|\([a-z0-9]{1,3}\)|Section\s+\d+|Clause\s+\d+)", clean_text))

            if is_new_section and current_group:
                # Flush the preceding group as a clause
                combined_text = " ".join(item[4].replace("\n", " ") for item in current_group)
                min_x0 = min(item[0] for item in current_group)
                min_y0 = min(item[1] for item in current_group)
                max_x1 = max(item[2] for item in current_group)
                max_y1 = max(item[3] for item in current_group)

                norm_bbox = [
                    round(max(0.0, min(1.0, min_x0 / page_width)), 4),
                    round(max(0.0, min(1.0, min_y0 / page_height)), 4),
                    round(max(0.0, min(1.0, max_x1 / page_width)), 4),
                    round(max(0.0, min(1.0, max_y1 / page_height)), 4),
                ]
                cat = categorize_text(combined_text)
                extracted_clauses.append(ExtractedClause(
                    clause_id=f"CL_{clause_counter}",
                    clause_text=combined_text,
                    clause_category=cat,
                    page_number=page_num,
                    position={"bbox": norm_bbox},
                ))
                clause_counter += 1
                current_group = [b]
            else:
                current_group.append(b)

        if current_group:
            combined_text = " ".join(item[4].replace("\n", " ") for item in current_group)
            min_x0 = min(item[0] for item in current_group)
            min_y0 = min(item[1] for item in current_group)
            max_x1 = max(item[2] for item in current_group)
            max_y1 = max(item[3] for item in current_group)

            norm_bbox = [
                round(max(0.0, min(1.0, min_x0 / page_width)), 4),
                round(max(0.0, min(1.0, min_y0 / page_height)), 4),
                round(max(0.0, min(1.0, max_x1 / page_width)), 4),
                round(max(0.0, min(1.0, max_y1 / page_height)), 4),
            ]
            cat = categorize_text(combined_text)
            extracted_clauses.append(ExtractedClause(
                clause_id=f"CL_{clause_counter}",
                clause_text=combined_text,
                clause_category=cat,
                page_number=page_num,
                position={"bbox": norm_bbox},
            ))
            clause_counter += 1

    doc.close()
    return extracted_clauses

def clauses_to_dict_list(clauses: List[ExtractedClause]) -> List[Dict[str, Any]]:
    return [asdict(c) for c in clauses]
