// PaperTrail Functional Document Comparison Component (FR-9, Use Case 2)
// Compares two contracts in real-time with algorithmic clause alignment,
// numerical shift analysis, rights regression scoring, and statutory cross-referencing.

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus, FileText, CheckCircle2, SlidersHorizontal, AlertTriangle, Sparkles, Copy, Check } from 'lucide-react';
import { compareDocumentClauses, DocumentComparisonSummary, ClauseDiffResult } from '../services/comparisonEngine.ts';
import { extractClausesFromText } from '../services/pdfExtractor.ts';
import { DocumentClause } from '../types/index.ts';

interface BenchmarkPreset {
  id: string;
  title: string;
  vertical: string;
  docAName: string;
  docBName: string;
  docAText: string;
  docBText: string;
}

const BENCHMARK_PRESETS: BenchmarkPreset[] = [
  {
    id: 'rental_rev',
    title: 'Rental Agreement: Model Tenancy Standard vs Landlord Lease',
    vertical: 'rental',
    docAName: 'Version 1.0 (Standard Model Draft)',
    docBName: 'Version 2.0 (Landlord Modified Draft)',
    docAText: `1. PREMISES & TERM: The Landlord hereby leases the residential premises to the Tenant for a period of 11 (eleven) months commencing on 1st January 2026.

2. SECURITY DEPOSIT: The Tenant has deposited a refundable sum of Rs. 50,000 as security deposit. The security deposit shall be refundable in full to the Tenant within 15 days of handing over vacant peaceful possession, subject to deduction of unpaid electricity or legitimate arrears.

3. NOTICE PERIOD & TERMINATION: Either party may terminate this agreement prior to expiry of the term by providing a minimum of 30 (thirty) days advance written notice to the other party without assigning reasons.

4. MAINTENANCE & REPAIRS: The Landlord shall be responsible for all structural repairs, plumbing shafts, and external wall waterproofing. The Tenant shall be responsible for routine internal consumables such as bulb replacements and tap washers.

5. DISPUTE RESOLUTION: Any dispute arising out of this tenancy shall be subject to the exclusive jurisdiction of the statutory Rent Tribunal at Bengaluru under the Karnataka Rent Act.`,
    docBText: `1. PREMISES & TERM: The Landlord leases the residential premises for 11 months, with a mandatory lock-in period of 6 months during which Tenant cannot vacate.

2. SECURITY DEPOSIT & WITHHOLDING: The Tenant deposits Rs. 50,000. The security deposit shall be refundable within 60 days following comprehensive repainting, structural inspection, and clearance by the Landlord at the Landlord's sole discretion.

3. NOTICE PERIOD & PENALTY: The Tenant must provide a minimum of 90 (ninety) days advance written notice to terminate. If the Tenant vacates earlier, the Tenant shall forfeit three full months rent as liquidated penalty.

4. TENANT REPAIR OBLIGATIONS: The Tenant shall bear 100% of all maintenance costs including external waterproofing, civil plumbing cracks, and structural repairs incurred during the term.

5. DISPUTE RESOLUTION: Any dispute arising out of this tenancy shall be subject to the exclusive jurisdiction of the Rent Tribunal at Bengaluru.

6. UNILATERAL ENTRY & TERMINATION: Landlord reserves the right to terminate this tenancy with 48 hours notice and take immediate possession without assigning any reason if deemed necessary.`,
  },
  {
    id: 'employment_rev',
    title: 'Employment Offer: Standard Terms vs Annexure Covenant',
    vertical: 'employment',
    docAName: 'Baseline Offer Letter',
    docBName: 'Separation & Restraint Annexure',
    docAText: `1. POSITION & DUTIES: The Employee is appointed as Senior Software Engineer. The Employee agrees to devote full working time and best efforts to the business of the Company.

2. COMPENSATION & GRATUITY: Gross remuneration shall be payable monthly. Gratuity shall be payable upon separation after 5 years continuous service under the Payment of Gratuity Act 1972 within 30 days of the last working day.

3. PROBATION & NOTICE PERIOD: The Employee shall serve a probation of 3 months. Either party may terminate employment during or after probation by providing 30 (thirty) days written notice or gross salary in lieu thereof.

4. CONFIDENTIALITY: The Employee agrees to protect the Company's proprietary information, source code, and trade secrets during and after employment.`,
    docBText: `1. POSITION & DUTIES: The Employee is appointed as Senior Software Engineer and agrees to perform assigned duties diligently.

2. STATUTORY GRATUITY: Gratuity shall be disbursed strictly in compliance with statutory timelines under the Payment of Gratuity Act 1972 within 30 days of clearance.

3. NOTICE BUYOUT RESTRICTION: The Employee must serve 90 days mandatory physical notice. The Company reserves the sole discretion to reject any notice buyout request and withhold relieving documents until physical handover.

4. POST-TERMINATION NON-COMPETE: The Employee covenants that for a period of 24 (twenty-four) months following termination, the Employee shall not engage with, advise, or join any competing software technology company operating in India.

5. INTELLECTUAL PROPERTY & INDEMNITY: Employee shall indemnify the Company against all third party claims arising from any code contribution without limitation of liability.`,
  },
  {
    id: 'gig_rev',
    title: 'Gig Platform Terms: 2023 Agreement vs 2026 Revision',
    vertical: 'gig',
    docAName: '2023 Partner Agreement',
    docBName: '2026 Terms of Service',
    docAText: `1. INDEPENDENT CONTRACTOR STATUS: The Delivery Partner acts as an independent contractor using the Platform to fulfill delivery requests.

2. COMMISSION & FARE DEDUCTION: The Platform deducts a commission capped at a maximum of 20% of the net delivery fare for marketplace software facilitation.

3. SUMMARY ACCOUNT DEACTIVATION: The Platform may deactivate partner accounts immediately upon customer complaint without prior notice.

4. VOLUNTARY ACCIDENT COVER: Delivery Partners are encouraged to purchase independent personal accident insurance for road transit.`,
    docBText: `1. INDEPENDENT CONTRACTOR: Partner operates as an independent service provider utilizing the digital aggregation network.

2. DYNAMIC CONVENIENCE FEES: Platform charges a dynamic convenience fee up to 28% of the total customer bill during surge and high-demand weather conditions.

3. PROCEDURAL NOTICE BEFORE DE-BOARDING: The Platform shall provide written reasons and a minimum of 7 days advance notice before non-emergency account de-boarding, affording an appeal hearing.

4. MANDATORY GROUP ACCIDENT INSURANCE: Platform provides group accidental death and injury insurance of Rs. 5,00,000 to active partners at zero cost under the Code on Social Security 2020.`,
  },
];

interface CompareViewProps {
  activeClauses?: DocumentClause[];
  activeDocumentName?: string;
}

export const CompareView: React.FC<CompareViewProps> = ({ activeClauses = [], activeDocumentName = 'Active Contract' }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<BenchmarkPreset>(BENCHMARK_PRESETS[0]);

  // Custom comparison inputs
  const [customDocAName, setCustomDocAName] = useState<string>('Document A (Original)');
  const [customDocBName, setCustomDocBName] = useState<string>('Document B (Revision)');
  const [customDocAText, setCustomDocAText] = useState<string>('');
  const [customDocBText, setCustomDocBText] = useState<string>('');

  // Real-time comparison summary generated by comparisonEngine.ts
  const [summary, setSummary] = useState<DocumentComparisonSummary | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Compute preset comparison on mount or selection change using real functional engine
  useEffect(() => {
    if (activeTab === 'presets') {
      runPresetComparison(selectedPreset);
    }
  }, [selectedPreset, activeTab]);

  const runPresetComparison = async (preset: BenchmarkPreset) => {
    setIsComparing(true);
    try {
      const clausesA = await extractClausesFromText(preset.docAText, preset.docAName);
      const clausesB = await extractClausesFromText(preset.docBText, preset.docBName);
      const result = compareDocumentClauses(clausesA, clausesB, preset.docAName, preset.docBName);
      setSummary(result);
    } finally {
      setIsComparing(false);
    }
  };

  const handleRunCustomComparison = async () => {
    if (!customDocAText.trim() || !customDocBText.trim()) return;
    setIsComparing(true);
    try {
      const clausesA = await extractClausesFromText(customDocAText, customDocAName);
      const clausesB = await extractClausesFromText(customDocBText, customDocBName);
      const result = compareDocumentClauses(clausesA, clausesB, customDocAName, customDocBName);
      setSummary(result);
    } finally {
      setIsComparing(false);
    }
  };

  const handleUseActiveDocForA = () => {
    if (activeClauses.length > 0) {
      const compiledText = activeClauses.map((c) => c.clause_text).join('\n\n');
      setCustomDocAText(compiledText);
      setCustomDocAName(activeDocumentName);
    }
  };

  const handleCopyComparison = () => {
    if (!summary) return;
    const brief = [
      `=== CONTRACT COMPARISON & RISK SHIFT REPORT ===`,
      `Baseline: ${summary.docAName} (${summary.totalClausesA} clauses)`,
      `Revised:  ${summary.docBName} (${summary.totalClausesB} clauses)`,
      `Risk Assessment: ${summary.overallRiskShift.toUpperCase()}`,
      `Rights Regressed: ${summary.worsenedCount} | Improved: ${summary.improvedCount} | Neutral: ${summary.neutralCount}`,
      `Executive Summary: ${summary.executiveSummary}`,
      ``,
      `--- DETAILED CLAUSE-BY-CLAUSE ALIGNMENT ---`,
      ...summary.diffs.map((d, i) =>
        `[${i + 1}] Category: ${d.category} (${d.shift.toUpperCase()})\n` +
        `Baseline: ${d.docAClause}\n` +
        `Revised:  ${d.docBClause}\n` +
        `Legal Impact: ${d.commentary}\n` +
        (d.statutoryReference ? `Statute: ${d.statutoryReference}\n` : '')
      ),
    ].join('\n');

    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="view-container">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ArrowLeftRight size={22} color="var(--accent-primary)" />
          Multi-Revision Document Comparison & Risk Shift
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
          Algorithmic clause-by-clause diffing. Automatically aligns provisions, identifies stealth additions, detects deleted protections, and highlights rights regressions.
        </p>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={`btn-secondary ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
          style={{
            padding: '8px 16px',
            fontSize: '0.85rem',
            borderColor: activeTab === 'presets' ? 'var(--accent-primary)' : undefined,
            background: activeTab === 'presets' ? 'rgba(99, 102, 241, 0.15)' : undefined,
          }}
        >
          <FileText size={14} />
          <span>Benchmark Legal Presets</span>
        </button>
        <button
          className={`btn-secondary ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
          style={{
            padding: '8px 16px',
            fontSize: '0.85rem',
            borderColor: activeTab === 'custom' ? 'var(--accent-primary)' : undefined,
            background: activeTab === 'custom' ? 'rgba(99, 102, 241, 0.15)' : undefined,
          }}
        >
          <SlidersHorizontal size={14} />
          <span>Compare My Own Documents</span>
        </button>
      </div>

      {/* Preset Selector */}
      {activeTab === 'presets' ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {BENCHMARK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`btn-secondary ${selectedPreset.id === preset.id ? 'active' : ''}`}
              onClick={() => setSelectedPreset(preset)}
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                borderColor: selectedPreset.id === preset.id ? 'var(--accent-primary)' : undefined,
                background: selectedPreset.id === preset.id ? 'rgba(99, 102, 241, 0.15)' : undefined,
              }}
            >
              <FileText size={13} />
              <span>{preset.title.split(':')[0]}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Custom Contract Comparison Inputs</h3>
            {activeClauses.length > 0 && (
              <button
                className="btn-secondary"
                onClick={handleUseActiveDocForA}
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              >
                Insert Active Document into Doc A
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Document A Name:
              </label>
              <input
                type="text"
                value={customDocAName}
                onChange={(e) => setCustomDocAName(e.target.value)}
                style={{ width: '100%', marginBottom: 8, padding: '6px 10px', fontSize: '0.85rem' }}
              />
              <textarea
                rows={5}
                placeholder="Paste clauses or text for Document A (Baseline / Standard draft)..."
                value={customDocAText}
                onChange={(e) => setCustomDocAText(e.target.value)}
                style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Document B Name:
              </label>
              <input
                type="text"
                value={customDocBName}
                onChange={(e) => setCustomDocBName(e.target.value)}
                style={{ width: '100%', marginBottom: 8, padding: '6px 10px', fontSize: '0.85rem' }}
              />
              <textarea
                rows={5}
                placeholder="Paste clauses or text for Document B (Counterparty revision / Modified draft)..."
                value={customDocBText}
                onChange={(e) => setCustomDocBText(e.target.value)}
                style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical' }}
              />
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={handleRunCustomComparison}
            disabled={!customDocAText.trim() || !customDocBText.trim() || isComparing}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            <Sparkles size={16} />
            <span>{isComparing ? 'Running Algorithmic Comparison...' : 'Run Real-Time Comparison & Risk Shift Analysis'}</span>
          </button>
        </div>
      )}

      {/* Dynamic Summary Card */}
      {summary && (
        <>
          <div className="glass-card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {summary.docAName} vs {summary.docBName}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Aligned {summary.alignedPairsCount} clause pairs across {summary.totalClausesA} baseline and {summary.totalClausesB} revision clauses
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 9999,
                    background:
                      summary.overallRiskShift === 'significantly_worse'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : summary.overallRiskShift === 'improved'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                    color:
                      summary.overallRiskShift === 'significantly_worse'
                        ? 'var(--status-unverified)'
                        : summary.overallRiskShift === 'improved'
                        ? 'var(--status-verified)'
                        : 'var(--status-warning, #f59e0b)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <AlertTriangle size={13} />
                  <span>Risk Shift: {summary.overallRiskShift.replace('_', ' ').toUpperCase()}</span>
                </span>

                <button
                  className="btn-secondary"
                  onClick={handleCopyComparison}
                  style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {copied ? <Check size={13} color="var(--status-verified)" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied Brief' : 'Copy Comparison'}</span>
                </button>
              </div>
            </div>

            {/* Metric counters */}
            <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', fontWeight: 600, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ color: 'var(--status-unverified)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingDown size={14} /> {summary.worsenedCount} Regressed
              </span>
              <span style={{ color: 'var(--status-verified)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={14} /> {summary.improvedCount} Improved
              </span>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Minus size={14} /> {summary.neutralCount} Neutral
              </span>
              {summary.addedClausesCount > 0 && (
                <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  + {summary.addedClausesCount} Added Clauses
                </span>
              )}
              {summary.removedClausesCount > 0 && (
                <span style={{ color: 'var(--status-unverified)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  - {summary.removedClausesCount} Omitted Clauses
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {summary.executiveSummary}
            </p>
          </div>

          {/* Dynamic Diff Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {summary.diffs.map((item: ClauseDiffResult, idx: number) => (
              <div key={idx} className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.category}</span>
                    {item.similarityScore > 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: 4 }}>
                        {Math.round(item.similarityScore * 100)}% Match
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
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
                    {item.shift === 'improved' && <TrendingUp size={11} />}
                    {item.shift === 'worsened' && <TrendingDown size={11} />}
                    {item.shift === 'neutral' && <Minus size={11} />}
                    {item.shift === 'worsened' ? 'Risk Shift / Regressed' : item.shift}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 10 }}>
                  <div style={{ padding: 12, background: 'rgba(0, 0, 0, 0.28)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                      {summary.docAName}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {item.docAClause}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 12,
                      background: item.shift === 'worsened' ? 'rgba(239, 68, 68, 0.06)' : item.shift === 'improved' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(0, 0, 0, 0.28)',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${item.shift === 'worsened' ? 'rgba(239, 68, 68, 0.25)' : item.shift === 'improved' ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-accent)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                      {summary.docBName}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {item.docBClause}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="var(--accent-primary)" />
                    <span><strong>Legal Impact:</strong> {item.commentary}</span>
                  </div>
                  {item.statutoryReference && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-accent)', marginLeft: 20 }}>
                      ⚖️ <strong>Statutory Basis:</strong> {item.statutoryReference}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
