import React, { useState } from 'react';
import {
  X,
  Briefcase,
  CheckSquare,
  Copy,
  Check,
  Share2,
  FileText,
  HelpCircle,
  ShieldAlert,
  Scale,
} from 'lucide-react';
import { LegalVertical, Citation } from '../types/index.ts';

interface LawyerPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedVertical: LegalVertical;
  documentTitle: string;
  lastQuestion?: string;
  lastAnswer?: string;
  citations?: Citation[];
  onNavigateTab?: (tab: 'qa' | 'report' | 'compare' | 'legalaid' | 'drafting') => void;
}

const CHECKLIST_BY_VERTICAL: Record<LegalVertical, Array<{ item: string; reason: string }>> = {
  rental: [
    { item: 'Original Executed Tenancy Agreement / Lease', reason: 'Establishes agreed deposit amount, notice period, and signed terms.' },
    { item: 'Bank Statements / UTR Receipts of Deposit & Rent Paid', reason: 'Unambiguous proof of advance transfer to the landlord.' },
    { item: 'Move-in & Move-out Inspection Photos / Videos', reason: 'Rebuts unjustified deductions for normal wear & tear under MTA.' },
    { item: 'Written Notices & WhatsApp / Email Correspondence', reason: 'Proves delivery of 30-day termination notice or refund demand.' },
  ],
  employment: [
    { item: 'Signed Appointment / Offer Letter & Employment Contract', reason: 'Examines validity of post-service restrictive covenants (Sec 27).' },
    { item: 'Past 3 Months Salary Slips & Bank Credit Statements', reason: 'Establishes earned wage entitlements under Payment of Wages Act.' },
    { item: 'Resignation Letter & Employer Acknowledgment', reason: 'Evidences compliance with contractual notice period / buyout tender.' },
    { item: 'Correspondence regarding Relieving / Experience Certificate', reason: 'Documents wrongful withholding of mandatory separation clearances.' },
  ],
  gig: [
    { item: 'Platform Partner Terms of Service & Onboarding Agreement', reason: 'Reviews deactivation thresholds and grievance escalation clauses.' },
    { item: 'Payout Ledger / Outstanding Wallet Balance Screenshots', reason: 'Quantifies withheld earnings and arbitrary deduction amounts.' },
    { item: 'Notice / Reason Given for Account Deactivation (if any)', reason: 'Proves violation of show-cause hearing requirements under MoRTH 2020.' },
    { item: 'Ticket / Grievance Escalation Reference Numbers', reason: 'Shows exhaustion of internal tier-1 aggregator support before legal steps.' },
  ],
  consumer: [
    { item: 'Tax Invoice / Retail Bill & Warranty Card', reason: 'Establishes privity of contract, defect warranty date, and merchant identity.' },
    { item: 'Defect Photographs, Diagnostic Reports, or Technician Notes', reason: 'Evidence of manufacturing defect or deficient service under CPA 2019.' },
    { item: 'Customer Support Tickets, Emails, or Chat Logs', reason: 'Proves refusal of replacement/repair within statutory liability windows.' },
    { item: 'Proof of Delivery / Return Pickup Tracking (if applicable)', reason: 'Demonstrates timely initiation of dispute or return window compliance.' },
  ],
  challan: [
    { item: 'Electronic Notice / E-Challan Printout with Number & Date', reason: 'Verifies whether notice was dispatched within statutory 15-day limit.' },
    { item: 'Photographic Evidence Attached to E-Challan', reason: 'Scrutinizes license plate clarity, vehicle model, and timestamp discrepancy.' },
    { item: 'Vehicle Registration Certificate (RC) & Insurance Copy', reason: 'Proves vehicle ownership and accurate vehicle classification.' },
    { item: 'Alibi Evidence (Toll Fastag logs, GPS tracking, CCTV footage)', reason: 'Substantiates wrong vehicle capture or absence from violation location.' },
  ],
};

const QUESTIONS_FOR_LAWYER: Record<LegalVertical, string[]> = {
  rental: [
    'Can we approach the local Rent Authority under Section 10/20 of the Model Tenancy Act for an urgent refund order?',
    'Does the forfeiture clause in this agreement qualify as an unenforceable penal penalty under Section 74 of the Indian Contract Act?',
    'Can we claim 18% p.a. statutory interest on the withheld deposit from the 16th day after handover?',
    'If the landlord refuses mediation, should we issue a formal Registered Post (RPAD) demand notice before filing a summary suit?',
  ],
  employment: [
    'Given Section 27 of the Indian Contract Act 1872 and the Supreme Court ruling in Niranjan Shankar Golikari, is this non-compete void on its face?',
    'Can the employer legally withhold my final settlement and relieving letter without obtaining an interim injunction from a civil court?',
    'Should we lodge a recovery complaint before the Deputy Labour Commissioner under Section 15 of the Payment of Wages Act?',
    'Does the non-solicitation or liquidated damages clause withstand scrutiny as reasonable protection of trade secrets?',
  ],
  gig: [
    'Did the platform violate Clause 15 of the MoRTH Aggregator Guidelines 2020 by deactivating my account without a 3-day show-cause window?',
    'Can we file a consumer complaint for unfair trade practice under Section 2(46) of the Consumer Protection Act 2019 for arbitrary termination?',
    'Are my withheld wallet earnings recoverable under the Code on Social Security 2020 provisions for gig worker welfare?',
    'What representative petition options exist through gig worker welfare unions before the state transport authority?',
  ],
  consumer: [
    'Does the merchant\'s "No Returns / No Refunds" adhesion clause constitute an unfair contract term under Section 2(46) of the CPA 2019?',
    'Should we lodge the complaint electronically via the national e-Daakhil portal or through the District Consumer Disputes Redressal Commission?',
    'What quantum of compensation should we claim for mental agony, harassment, and litigation expenses under Section 39(1)?',
    'Can we hold the marketplace e-commerce entity jointly liable alongside the third-party seller under the E-Commerce Rules 2020?',
  ],
  challan: [
    'Because the electronic notice was issued after 15 days, is the challan liable to be quashed under Rule 167A of the Central Motor Vehicles Rules?',
    'How do we present our toll GPS/Fastag logs before the Virtual Traffic Court to challenge the automated camera identification error?',
    'Should we seek compounding and dispute referral to the upcoming National Lok Adalat for waiver or formal dismissal?',
    'Does the photographic evidence meet the certificate standards required under Section 65B of the Indian Evidence Act / BSA 2023?',
  ],
};

export const LawyerPrepModal: React.FC<LawyerPrepModalProps> = ({
  isOpen,
  onClose,
  detectedVertical,
  documentTitle,
  lastQuestion,
  lastAnswer,
  citations = [],
  onNavigateTab,
}) => {
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const checklist = CHECKLIST_BY_VERTICAL[detectedVertical] || CHECKLIST_BY_VERTICAL.rental;
  const lawyerQuestions = QUESTIONS_FOR_LAWYER[detectedVertical] || QUESTIONS_FOR_LAWYER.rental;

  function toggleItem(idx: number) {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  function generateBriefingText(): string {
    const lines = [
      '===========================================================',
      'PAPERTRAIL — LEGAL CONSULTATION BRIEF & ACTION CHECKLIST',
      '===========================================================',
      `Document Title: ${documentTitle}`,
      `Vertical Domain: ${detectedVertical.toUpperCase()}`,
      `Date Generated: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      '--- USER QUESTION & GROUNDED FINDINGS ---',
      `Inquiry: ${lastQuestion || 'Contract Clause & Statutory Rights Assessment'}`,
      `Grounded Analysis: ${lastAnswer || 'Identified potential violation of statutory standards.'}`,
      '',
      citations.length > 0
        ? `Citations: ${citations.map((c) => `${c.citation_label} (${c.track})`).join(', ')}\n`
        : '',
      '--- EVIDENTIARY CHECKLIST FOR ADVOCATE ---',
      ...checklist.map(
        (c, idx) => `[${checkedItems[idx] ? 'X' : ' '}] ${c.item} (Purpose: ${c.reason})`
      ),
      '',
      '--- STRUCTURED QUESTIONS TO ASK COUNSEL ---',
      ...lawyerQuestions.map((q, idx) => `${idx + 1}. ${q}`),
      '',
      '-----------------------------------------------------------',
      'DISCLAIMER: PaperTrail provides legal assistance and information to help users prepare for professional legal advice; it does not constitute formal legal representation.',
      '===========================================================',
    ];
    return lines.join('\n');
  }

  function handleCopy() {
    const text = generateBriefingText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareWhatsApp() {
    const text = generateBriefingText();
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card modal-dialog"
        style={{
          maxWidth: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Briefcase size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Prepare for a Legal Professional & Action Checklist
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Generate an organized evidence checklist and specific legal questions for your advocate or DLSA counsel
            </p>
          </div>
        </div>

        {/* Legal Disclaimer Note (Mandatory Mandate) */}
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <ShieldAlert size={18} color="var(--status-repaired)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            <strong>Legal Assistance Notice:</strong> PaperTrail empowers you to understand, compare, and organize your legal documents. In accordance with the hackathon mandate, this tool provides information and assistance, rather than replacing professional legal advice.
          </div>
        </div>

        {/* Section 1: Evidence Checklist (Use Case 6) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <CheckSquare size={16} color="var(--accent-primary)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Evidentiary Document Checklist ({detectedVertical})
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {checklist.map((item, idx) => (
              <label
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  background: checkedItems[idx] ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${checkedItems[idx] ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[idx]}
                  onChange={() => toggleItem(idx)}
                  style={{ marginTop: 3, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.item}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Why your advocate needs this: {item.reason}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section 2: Structured Questions for Legal Counsel (Use Case 7) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <HelpCircle size={16} color="var(--accent-primary)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2. Key Questions to Ask Your Advocate
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lawyerQuestions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 12px',
                  background: 'rgba(99, 102, 241, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: 'var(--accent-primary)',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{q}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Direct Action Shortcuts */}
        <div style={{ marginBottom: 20, padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: 8 }}>
            Available Action Outputs:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {onNavigateTab && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  onNavigateTab('drafting');
                  onClose();
                }}
                style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 6 }}
              >
                <FileText size={14} color="var(--accent-primary)" />
                <span>Draft Statutory Demand Notice (RPAD)</span>
              </button>
            )}
            {onNavigateTab && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  onNavigateTab('legalaid');
                  onClose();
                }}
                style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 6 }}
              >
                <Scale size={14} color="var(--status-verified)" />
                <span>NALSA 15100 & DLSA Free Legal Aid</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          >
            Close
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopy}
              style={{ padding: '8px 14px', fontSize: '0.82rem', gap: 6 }}
            >
              {copied ? <Check size={14} color="var(--status-verified)" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Brief!' : 'Copy Lawyer Brief'}</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleShareWhatsApp}
              style={{ padding: '8px 14px', fontSize: '0.82rem', gap: 6 }}
            >
              <Share2 size={14} />
              <span>Share via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
