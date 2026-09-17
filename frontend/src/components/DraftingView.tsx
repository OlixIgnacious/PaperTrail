// PaperTrail Legal Notice Drafting Component (FR-12)
// Template-assembled legal notices from vetted clause library (stops at "ready to print/post", no auto-submission)

import React, { useState } from 'react';
import { FileEdit, Printer, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';

interface NoticeTemplate {
  id: string;
  title: string;
  vertical: string;
  statuteCitation: string;
  defaultParams: {
    senderName: string;
    recipientName: string;
    address: string;
    amount: string;
    noticeDays: string;
    referenceNo: string;
  };
  generateText: (p: {
    senderName: string;
    recipientName: string;
    address: string;
    amount: string;
    noticeDays: string;
    referenceNo: string;
  }) => string;
}

const NOTICE_TEMPLATES: NoticeTemplate[] = [
  {
    id: 'TPL_RENT_DEPOSIT',
    title: 'Tenancy: Demand for Refund of Security Deposit',
    vertical: 'rental',
    statuteCitation: 'Model Tenancy Act 2021, Section 11(1)',
    defaultParams: {
      senderName: 'Karthik Menon',
      recipientName: 'Smt. Lakshmi R (Landlord)',
      address: 'Flat 302, Green Glen Layout, Indiranagar, Bengaluru - 560038',
      amount: '50,000',
      noticeDays: '15',
      referenceNo: 'LEASE-AGMT-2026/01',
    },
    generateText: (p) => `LEGAL NOTICE DEMANDING REFUND OF SECURITY DEPOSIT

BY REGISTERED POST WITH ACKNOWLEDGEMENT DUE (RPAD)

To,
${p.recipientName}
${p.address}

Subject: Statutory Demand Notice under the Model Tenancy Act / Transfer of Property Act 1882 for immediate refund of Security Deposit of INR ${p.amount}/-.

Sir/Madam,

Under instructions from myself / my client, Sri/Smt. ${p.senderName}, having lawfully vacated the subject premises situated at ${p.address} on handover of keys and vacant possession:

1. A sum of INR ${p.amount}/- was deposited as refundable interest-free security deposit in terms of Tenancy Agreement Ref: ${p.referenceNo}.
2. In accordance with Section 11 of the Model Tenancy Act and standard tenancy jurisprudence, the Landlord is statutorily obligated to refund the security deposit in full within ${p.noticeDays} days of vacant possession after deducting verified, documented utility arrears.
3. You have wrongfully and arbitrarily withheld the aforementioned deposit without assigning statutory grounds or furnishing verified bills of actual damage.

You are hereby called upon to remit the full sum of INR ${p.amount}/- directly to my designated bank account within ${p.noticeDays} (fifteen) days of receipt of this notice, failing which I shall be constrained to initiate appropriate legal proceedings before the Rent Authority, Rent Tribunal, and jurisdictional civil/consumer forums for recovery along with 18% per annum statutory penal interest, entirely at your cost and legal consequences.

Dated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

Yours sincerely,

___________________________
${p.senderName}
(Tenant / Complainant)`,
  },
  {
    id: 'TPL_RENT_UTILITIES',
    title: 'Tenancy: Notice against Withholding Essential Utilities',
    vertical: 'rental',
    statuteCitation: 'Model Tenancy Act 2021, Section 20(1)',
    defaultParams: {
      senderName: 'Karthik Menon',
      recipientName: 'Smt. Lakshmi R (Landlord)',
      address: 'Flat 302, Green Glen Layout, Indiranagar, Bengaluru - 560038',
      amount: 'N/A',
      noticeDays: '24 hours',
      referenceNo: 'LEASE-AGMT-2026/01',
    },
    generateText: (p) => `EMERGENCY STATUTORY NOTICE: UNLAWFUL DISCONNECTION OF ESSENTIAL UTILITIES

To,
${p.recipientName}
${p.address}

Subject: Statutory Notice under Section 20 of the Model Tenancy Act 2021 against unlawful withholding of essential services (Water/Electricity supply).

Sir/Madam,

I am writing with reference to my tenancy at ${p.address} (Agreement Ref: ${p.referenceNo}).

1. You have unlawfully disconnected or threatened to withhold essential services (water and electricity supply) to the tenanted premises.
2. Under Section 20(1) of the Model Tenancy Act 2021, a landlord is strictly prohibited from severing or withholding any essential supply or service under any pretext, including disputed rent arrears.
3. Your unilateral act constitutes an egregious violation of statutory tenancy protections and basic right to dignified shelter.

You are hereby requested to immediately restore all essential supply and utility connections within ${p.noticeDays} of receipt of this communication, failing which an urgent petition under Section 20(2) of the Model Tenancy Act will be lodged before the Rent Authority for immediate restoration orders and imposition of statutory compensatory penalties.

Dated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

___________________________
${p.senderName}`,
  },
  {
    id: 'TPL_SALARY_DUES',
    title: 'Employment: Statutory Demand for Unpaid Wages & Gratuity',
    vertical: 'employment',
    statuteCitation: 'Code on Wages 2019, Section 17(1) / Payment of Gratuity Act 1972',
    defaultParams: {
      senderName: 'Vikram Malhotra',
      recipientName: 'TechSolve India Pvt Ltd (Board of Directors)',
      address: 'Tech Park Phase 2, Whitefield, Bengaluru - 560066',
      amount: '2,40,000',
      noticeDays: '7',
      referenceNo: 'EMP-ID: TS-8841',
    },
    generateText: (p) => `FORMAL STATUTORY NOTICE FOR IMMEDIATE DISBURSEMENT OF ARREARS

To,
The Management & Board of Directors,
${p.recipientName}
${p.address}

Subject: Statutory Notice under Section 17 of Code on Wages 2019 and Payment of Gratuity Act 1972 for immediate clearance of INR ${p.amount}/-.

Dear Sir/Madam,

I was employed as Principal Systems Architect under Employee ID: ${p.referenceNo} at your organization:

1. As per Section 17(1) of the Code on Wages 2019, all wages must be settled within the statutory timeline following the completion of the wage period / separation.
2. My total outstanding dues comprising earned salary, encashment, and statutory gratuity amounting to INR ${p.amount}/- remain unpaid despite formal relieving and clearance.
3. Withholding wages constitutes an offense punishable with compounding fines and interest up to ten times under the Labour Code.

You are hereby called upon to transfer the full outstanding amount of INR ${p.amount}/- within ${p.noticeDays} days of receipt of this notice, failing which an application under Section 45 of Code on Wages 2019 shall be filed before the Labour Commissioner / Authority.

Dated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

___________________________
${p.senderName}
Employee ID: ${p.referenceNo}`,
  },
  {
    id: 'TPL_EMP_NON_COMPETE',
    title: 'Employment: Challenge to Void Non-Compete Restraint',
    vertical: 'employment',
    statuteCitation: 'Indian Contract Act 1872, Section 27',
    defaultParams: {
      senderName: 'Vikram Malhotra',
      recipientName: 'TechSolve India Pvt Ltd',
      address: 'Tech Park Phase 2, Whitefield, Bengaluru - 560066',
      amount: 'N/A',
      noticeDays: '7',
      referenceNo: 'OFFER-LETTER-2026/ANNEXURE-C',
    },
    generateText: (p) => `REPLY & REBUTTAL NOTICE: UNENFORCEABILITY OF POST-EMPLOYMENT NON-COMPETE

To,
${p.recipientName}
${p.address}

Subject: Rebuttal regarding void post-separation non-compete restraint under Section 27 of the Indian Contract Act 1872.

Dear Sir/Madam,

In reference to Clause 2 of Annexure (${p.referenceNo}) regarding post-termination non-compete covenants:

1. Section 27 of the Indian Contract Act 1872 explicitly states: "Every agreement by which anyone is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void."
2. The Hon'ble Supreme Court of India in landmark precedents (including Percept D'Mark v. Zaheer Khan and Niranjan Shankar Golikari) has settled that post-termination negative covenants restraining employment are void ab initio and unenforceable.
3. Any attempt to withhold my relieving letter, experience certificate, or earned dues on grounds of a non-compete covenant is unlawful and actionable.

You are requested to confirm my unencumbered separation and issue my relieving documentation within ${p.noticeDays} days.

Dated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

___________________________
${p.senderName}`,
  },
  {
    id: 'TPL_GIG_DEACTIVATION',
    title: 'Gig Worker: Appeal against Arbitrary Account Deactivation',
    vertical: 'gig',
    statuteCitation: 'Rajasthan Platform Gig Workers Act 2023 / MoRTH Guidelines 2020',
    defaultParams: {
      senderName: 'Rajesh Kumar',
      recipientName: 'Grievance Redressal Officer, UrbanRide Logistics Pvt Ltd',
      address: 'Plot 14, Sector 18, Udyog Vihar, Gurugram, Haryana - 122015',
      amount: '18,500',
      noticeDays: '7',
      referenceNo: 'PARTNER-ID: UR-DEL-49102',
    },
    generateText: (p) => `FORMAL APPEAL & STATUTORY NOTICE AGAINST ARBITRARY DE-PLATFORMING

To,
The State Grievance Redressal Officer,
${p.recipientName}
${p.address}

Subject: Grievance Escalation under Motor Vehicle Aggregator Guidelines 2020 and Gig Workers Protection Rules regarding Partner ID: ${p.referenceNo}.

Dear Sir/Madam,

1. On recent date, my delivery partner account (${p.referenceNo}) was deactivated without 7 days written notice or disclosure of specific customer logs.
2. In terms of Central Aggregator Guidelines Clause 13, deactivation without verifiable safety cause and prior show-cause violates fair platform rules.
3. My pending payout balance of INR ${p.amount}/- has also been blocked without lawful justification.

I hereby demand immediate restoration of my platform access and release of my earned payout within ${p.noticeDays} working days, failing which this dispute shall be submitted to the State Gig Workers Welfare Board and Consumer Commission.

Dated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

___________________________
${p.senderName}`,
  },
  {
    id: 'TPL_CON_REFUND',
    title: 'Consumer: Notice for Replacement / Refund of Defective Product',
    vertical: 'consumer',
    statuteCitation: 'Consumer Protection Act 2019, Section 84-86',
    defaultParams: {
      senderName: 'Ananya Sen',
      recipientName: 'Apex Retailers Ltd / Authorized Manufacturer Service',
      address: 'Commercial Hub, MG Road, Bengaluru - 560001',
      amount: '34,999',
      noticeDays: '14',
      referenceNo: 'INVOICE: APX-98214',
    },
    generateText: (p) => `LEGAL NOTICE: DEFICIENCY IN SERVICE & PRODUCT REPLACEMENT DEMAND

To,
${p.recipientName}
${p.address}

Subject: Statutory Legal Notice under Section 35 & 84 of Consumer Protection Act 2019 for Invoice: ${p.referenceNo}.

Sir/Madam,

1. On date, I purchased the appliance under Invoice No: ${p.referenceNo} for a total consideration of INR ${p.amount}/-.
2. The product developed severe manufacturing defects within the statutory warranty period, and repeated complaints have yielded no repair or resolution.
3. Under Section 84 of Consumer Protection Act 2019, the manufacturer and product seller are strictly liable for harm and deficiency in service.

You are called upon to replace the defective unit or refund the purchase amount of INR ${p.amount}/- within ${p.noticeDays} days, failing which an electronic complaint will be filed before the District Consumer Commission via e-Daakhil without further reference.

Dated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

___________________________
${p.senderName}`,
  },
];

interface DraftingViewProps {
  userName?: string;
}

export const DraftingView: React.FC<DraftingViewProps> = ({ userName }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<NoticeTemplate>(NOTICE_TEMPLATES[0]);
  const [params, setParams] = useState({
    ...NOTICE_TEMPLATES[0].defaultParams,
    ...(userName ? { senderName: userName } : {}),
  });
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (userName) {
      setParams((prev) => ({ ...prev, senderName: userName }));
    }
  }, [userName]);

  function handleSelectTemplate(tpl: NoticeTemplate) {
    setSelectedTemplate(tpl);
    setParams({
      ...tpl.defaultParams,
      ...(userName ? { senderName: userName } : {}),
    });
  }

  const generatedNotice = selectedTemplate.generateText(params);

  function handleCopy() {
    navigator.clipboard.writeText(generatedNotice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="view-container">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileEdit size={22} color="var(--accent-primary)" />
          Statutory Notice Drafter (Ready to Print/Post)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
          Assemble legally grounded demand notices grounded in Indian statutory provisions. Fill in parameters and export print-ready text for Registered Post (RPAD).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left Column: Templates & Form Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Template Selection */}
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Select Notice Type
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {NOTICE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  className="glass-card"
                  onClick={() => handleSelectTemplate(tpl)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    borderColor: selectedTemplate.id === tpl.id ? 'var(--accent-primary)' : undefined,
                    background: selectedTemplate.id === tpl.id ? 'rgba(99, 102, 241, 0.12)' : undefined,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                    {tpl.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-accent)', marginTop: 4 }}>
                    {tpl.statuteCitation}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Parameters Form */}
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Customize Notice Details</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sender Name</label>
                <input
                  type="text"
                  value={params.senderName}
                  onChange={(e) => setParams({ ...params, senderName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    marginTop: 2,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recipient Name / Organization</label>
                <input
                  type="text"
                  value={params.recipientName}
                  onChange={(e) => setParams({ ...params, recipientName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    marginTop: 2,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Premises / Office Address</label>
                <input
                  type="text"
                  value={params.address}
                  onChange={(e) => setParams({ ...params, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    marginTop: 2,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount (INR)</label>
                  <input
                    type="text"
                    value={params.amount}
                    onChange={(e) => setParams({ ...params, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      marginTop: 2,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notice Days</label>
                  <input
                    type="text"
                    value={params.noticeDays}
                    onChange={(e) => setParams({ ...params, noticeDays: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      marginTop: 2,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reference / Agreement No</label>
                <input
                  type="text"
                  value={params.referenceNo}
                  onChange={(e) => setParams({ ...params, referenceNo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    marginTop: 2,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Formatted Notice Preview */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selectedTemplate.title}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>
                Statutory Reference: {selectedTemplate.statuteCitation}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={handleCopy} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                {copied ? <Check size={14} color="var(--status-verified)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Notice'}</span>
              </button>
              <button className="btn-primary" onClick={handlePrint} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={generatedNotice}
            style={{
              flex: 1,
              minHeight: '480px',
              padding: '18px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              resize: 'none',
              whiteSpace: 'pre-wrap',
            }}
          />

          {/* Dispatch Guidance per AGENTS.md stop-at-print requirement */}
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <AlertCircle size={15} color="var(--accent-primary)" />
            <span>
              <strong>Postal Dispatch Guidance:</strong> Print 2 copies, sign with blue ink, and dispatch 1 copy via Indian Post Speed Post / RPAD. Retain the postal receipt and tracking slip as legal proof of service. No auto-submission or government e-filing.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
