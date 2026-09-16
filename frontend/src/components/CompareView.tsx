// PaperTrail Document Comparison Component (FR-9)
// Compares two documents with clause-by-clause favorability tagging and risk-shift visualization

import React, { useState } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus, FileText, CheckCircle2 } from 'lucide-react';

interface CompareDiffItem {
  category: string;
  docAClause: string;
  docBClause: string;
  shift: 'improved' | 'worsened' | 'neutral';
  commentary: string;
}

interface ComparisonScenario {
  id: string;
  title: string;
  vertical: string;
  docAName: string;
  docBName: string;
  summary: string;
  diffs: CompareDiffItem[];
}

const COMPARISON_SCENARIOS: ComparisonScenario[] = [
  {
    id: 'rental_rev',
    title: 'Rental Agreement: Standard Draft vs Landlord Revision',
    vertical: 'rental',
    docAName: 'Version 1.0 (Standard Model Draft)',
    docBName: 'Version 2.0 (Landlord Modified Draft)',
    summary: 'The revised draft introduces a 300% longer notice period and shifts structural repairs entirely to the tenant.',
    diffs: [
      {
        category: 'Notice Period',
        docAClause: 'Either party may terminate this agreement by providing a minimum of 30 (thirty) days written notice.',
        docBClause: 'Tenant must provide 90 (ninety) days written notice to vacate or forfeit three full months rent in lieu.',
        shift: 'worsened',
        commentary: 'Notice period tripled from 30 to 90 days; severe unilateral financial penalty introduced against tenant.',
      },
      {
        category: 'Security Deposit Refund Timeline',
        docAClause: 'Security deposit refundable in full within 15 days of key handover.',
        docBClause: 'Security deposit refundable within 60 days following full repainting and structural inspection.',
        shift: 'worsened',
        commentary: 'Refund timeline quadrupled from statutory 15 days under Model Tenancy Act to 60 days.',
      },
      {
        category: 'Maintenance & Structural Repairs',
        docAClause: 'Landlord is obligated to maintain all structural repairs, plumbing shafts, and external walls.',
        docBClause: 'Tenant shall bear 100% of all maintenance costs including external waterproofing and structural repairs.',
        shift: 'worsened',
        commentary: 'Direct violation of Second Schedule of Model Tenancy Act which mandates landlord liability for structural defects.',
      },
      {
        category: 'Dispute Resolution Forum',
        docAClause: 'Subject to exclusive jurisdiction of Rent Tribunal at Bengaluru.',
        docBClause: 'Subject to exclusive jurisdiction of Rent Tribunal at Bengaluru.',
        shift: 'neutral',
        commentary: 'Forum remains the statutory Rent Authority under local state tenancy legislation.',
      },
    ],
  },
  {
    id: 'employment_rev',
    title: 'Employment Offer: Standard Terms vs Annexure Covenant',
    vertical: 'employment',
    docAName: 'Initial Offer Letter',
    docBName: 'Separation & Restraint Annexure',
    summary: 'The annexure adds an unenforceable 2-year post-termination non-compete restraint and extends notice buyout.',
    diffs: [
      {
        category: 'Post-Termination Restraint',
        docAClause: 'Employee agrees to keep proprietary information confidential following separation.',
        docBClause: 'Employee shall not engage with, consult for, or join any competing technology company in India for 24 months.',
        shift: 'worsened',
        commentary: 'Severe post-employment restraint inserted; legally void under Section 27 of Indian Contract Act 1872.',
      },
      {
        category: 'Notice Period Buyout',
        docAClause: 'Either party may terminate with 30 days notice or gross salary in lieu thereof.',
        docBClause: 'Company reserves sole discretion to reject notice buyout and require mandatory physical presence.',
        shift: 'worsened',
        commentary: 'Eliminates mutual buyout flexibility, forcing employee to serve full period without alternative.',
      },
      {
        category: 'Statutory Gratuity Settlement',
        docAClause: 'Gratuity payable upon completion of 5 years continuous service under Payment of Gratuity Act 1972.',
        docBClause: 'Gratuity payable strictly in compliance with statutory timelines within 30 days of last working day.',
        shift: 'improved',
        commentary: 'Explicit commitment to 30-day statutory settlement timeline added.',
      },
    ],
  },
  {
    id: 'gig_rev',
    title: 'Gig Platform Terms: 2023 Agreement vs 2026 Revision',
    vertical: 'gig',
    docAName: '2023 Partner Agreement',
    docBName: '2026 Terms of Service',
    summary: 'Comparison of fare deductions, commission caps, and de-platforming appeal mechanisms.',
    diffs: [
      {
        category: 'Account Deactivation Rights',
        docAClause: 'Platform may deactivate partner accounts immediately upon customer complaint.',
        docBClause: 'Platform shall provide written reasons and 7 days advance notice before non-emergency de-boarding.',
        shift: 'improved',
        commentary: 'Complies with Section 13 of Rajasthan Gig Workers Act 2023 prohibiting arbitrary immediate deactivation.',
      },
      {
        category: 'Aggregator Commission Cap',
        docAClause: 'Commission deduction fixed at maximum 20% of net ride fare.',
        docBClause: 'Platform charges dynamic convenience fee up to 28% of total fare during peak demand periods.',
        shift: 'worsened',
        commentary: 'Exceeds the statutory 20% commission cap mandated by Central Motor Vehicle Aggregator Guidelines 2020.',
      },
      {
        category: 'Accident Insurance Coverage',
        docAClause: 'Drivers encouraged to purchase voluntary personal accident cover.',
        docBClause: 'Platform provides mandatory Rs 5,00,000 group term life and accidental injury policy at zero partner cost.',
        shift: 'improved',
        commentary: 'Brings platform in compliance with Code on Social Security 2020 mandatory worker insurance.',
      },
    ],
  },
];

export const CompareView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<ComparisonScenario>(COMPARISON_SCENARIOS[0]);

  const improvedCount = selectedScenario.diffs.filter((d) => d.shift === 'improved').length;
  const worsenedCount = selectedScenario.diffs.filter((d) => d.shift === 'worsened').length;
  const neutralCount = selectedScenario.diffs.filter((d) => d.shift === 'neutral').length;

  return (
    <div className="view-container">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ArrowLeftRight size={22} color="var(--accent-primary)" />
          Multi-Revision Document Comparison & Risk Shift
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
          Analyze changes between two contract versions to identify stealth clauses, shifted obligations, and rights regressions.
        </p>
      </div>

      {/* Scenario Selector */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {COMPARISON_SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            className={`btn-secondary ${selectedScenario.id === sc.id ? 'active' : ''}`}
            onClick={() => setSelectedScenario(sc)}
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              borderColor: selectedScenario.id === sc.id ? 'var(--accent-primary)' : undefined,
              background: selectedScenario.id === sc.id ? 'rgba(99, 102, 241, 0.15)' : undefined,
            }}
          >
            <FileText size={14} />
            <span>{sc.title.split(':')[0]}</span>
          </button>
        ))}
      </div>

      {/* Overview Card */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedScenario.title}</h3>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--status-unverified)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingDown size={14} /> {worsenedCount} Rights Regressed
            </span>
            <span style={{ color: 'var(--status-verified)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={14} /> {improvedCount} Improved
            </span>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Minus size={14} /> {neutralCount} Neutral
            </span>
          </div>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {selectedScenario.summary}
        </p>
      </div>

      {/* Comparison Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {selectedScenario.diffs.map((item, idx) => (
          <div key={idx} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.category}</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background:
                    item.shift === 'improved'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : item.shift === 'worsened'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(255, 255, 255, 0.08)',
                  color:
                    item.shift === 'improved'
                      ? 'var(--status-verified)'
                      : item.shift === 'worsened'
                      ? 'var(--status-unverified)'
                      : 'var(--text-secondary)',
                }}
              >
                {item.shift === 'improved' && <TrendingUp size={12} />}
                {item.shift === 'worsened' && <TrendingDown size={12} />}
                {item.shift === 'neutral' && <Minus size={12} />}
                {item.shift === 'worsened' ? 'Risk Shift / Regressed' : item.shift}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 12 }}>
              <div style={{ padding: 14, background: 'rgba(0, 0, 0, 0.28)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>
                  {selectedScenario.docAName}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.docAClause}
                </div>
              </div>
              <div
                style={{
                  padding: 14,
                  background: item.shift === 'worsened' ? 'rgba(239, 68, 68, 0.06)' : item.shift === 'improved' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(0, 0, 0, 0.28)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${item.shift === 'worsened' ? 'rgba(239, 68, 68, 0.25)' : item.shift === 'improved' ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-accent)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>
                  {selectedScenario.docBName}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {item.docBClause}
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={15} color="var(--accent-primary)" />
              <span><strong>Legal Impact:</strong> {item.commentary}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
