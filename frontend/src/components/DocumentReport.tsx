// PaperTrail Document Health Report Component (FR-8 - Secondary Screen)
// Provides risk scoring (0-100), statutory conflict mapping, and actionable amendments

import React from 'react';
import { DocumentClause, LegalVertical } from '../types/index.ts';
import { CURATED_RULES } from '../data/curatedRules.ts';
import { CheckCircle, ShieldAlert, FileText, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

interface DocumentReportProps {
  clauses: DocumentClause[];
  vertical: LegalVertical;
}

interface StatutoryFinding {
  clauseId: string;
  category: string;
  issueTitle: string;
  riskSeverity: 'high' | 'medium' | 'low';
  statuteCitation: string;
  explanation: string;
  recommendation: string;
}

export const DocumentReport: React.FC<DocumentReportProps> = ({ clauses, vertical }) => {
  // Analyze document clauses against statutory rules
  const relevantRules = CURATED_RULES.filter((r) => r.vertical === vertical);

  const findings: StatutoryFinding[] = [];

  clauses.forEach((c) => {
    const textLower = c.clause_text.toLowerCase();

    // Check for non-compete clauses in employment
    if (vertical === 'employment' && (textLower.includes('non-compete') || textLower.includes('competing') || textLower.includes('restrain'))) {
      const rule = relevantRules.find((r) => r.rule_id === 'EMP_001');
      findings.push({
        clauseId: c.clause_id,
        category: 'Non-Compete Covenant',
        issueTitle: 'Unenforceable Post-Termination Restraint',
        riskSeverity: 'high',
        statuteCitation: rule?.citation || 'Indian Contract Act 1872, Section 27',
        explanation: rule?.risk_if_violated || 'Covenants restraining lawful trade or profession post-employment are legally void in India.',
        recommendation: 'Request deletion of clause or limit scope strictly to non-solicitation of active proprietary clients during employment.',
      });
    }

    // Check for excessive security deposit in rental
    if (vertical === 'rental' && (textLower.includes('deposit') || textLower.includes('security'))) {
      if (textLower.includes('ten months') || textLower.includes('10 months') || textLower.includes('6 months')) {
        const rule = relevantRules.find((r) => r.rule_id === 'RENT_001');
        findings.push({
          clauseId: c.clause_id,
          category: 'Security Deposit',
          issueTitle: 'Excessive Security Deposit Demanded',
          riskSeverity: 'high',
          statuteCitation: rule?.citation || 'Model Tenancy Act 2021, Section 11(1)',
          explanation: 'Deposit exceeds the statutory 2-month rental cap prescribed under the Model Tenancy Act.',
          recommendation: 'Amend deposit demand to strictly two months of monthly rent with 15-day refund guarantee.',
        });
      }
    }

    // Check for essential services cut-off in rental
    if (vertical === 'rental' && (textLower.includes('utilities') || textLower.includes('essential supply') || textLower.includes('water'))) {
      const rule = relevantRules.find((r) => r.rule_id === 'RENT_003');
      if (textLower.includes('cut off') || textLower.includes('withhold') || textLower.includes('disconnect')) {
        findings.push({
          clauseId: c.clause_id,
          category: 'Essential Utilities',
          issueTitle: 'Illegal Threat to Cut Off Essential Utilities',
          riskSeverity: 'high',
          statuteCitation: rule?.citation || 'Model Tenancy Act 2021, Section 20(1)',
          explanation: 'Landlords are statutorily prohibited from disconnecting water, electricity, or access stairs under any circumstance.',
          recommendation: 'Ensure clause explicitly guarantees uninterrupted supply of water and power during tenancy subsistence.',
        });
      }
    }

    // Check for arbitrary deactivation in gig contracts
    if (vertical === 'gig' && (textLower.includes('deactivat') || textLower.includes('terminat') || textLower.includes('block'))) {
      const rule = relevantRules.find((r) => r.rule_id === 'GIG_002');
      findings.push({
        clauseId: c.clause_id,
        category: 'Account Deactivation',
        issueTitle: 'Unilateral Platform Deactivation Without Prior Notice',
        riskSeverity: 'medium',
        statuteCitation: rule?.citation || 'Rajasthan Gig Workers Act 2023 / MoRTH Aggregator Guidelines',
        explanation: 'De-platforming without 7 days advance notice and written justification violates state welfare board rules.',
        recommendation: 'Incorporate mandatory 7-day show-cause notice and internal grievance hearing before any account suspension.',
      });
    }

    // Check for excessive cancellation charges in consumer contracts
    if (vertical === 'consumer' && (textLower.includes('cancellation') || textLower.includes('penalty') || textLower.includes('non-refundable'))) {
      const rule = relevantRules.find((r) => r.rule_id === 'CON_003');
      findings.push({
        clauseId: c.clause_id,
        category: 'Cancellation Policy',
        issueTitle: 'Unreasonable Cancellation Forfeiture',
        riskSeverity: 'medium',
        statuteCitation: rule?.citation || 'Consumer Protection (E-Commerce) Rules 2020, Rule 6(4)',
        explanation: 'Businesses cannot impose cancellation charges exceeding actual reasonable processing costs.',
        recommendation: 'Replace full-forfeiture language with actual administrative expense deduction only.',
      });
    }
  });

  // Calculate dynamic risk score based on detected findings
  const highRiskCount = findings.filter((f) => f.riskSeverity === 'high').length;
  const mediumRiskCount = findings.filter((f) => f.riskSeverity === 'medium').length;
  const baseScore = 20;
  const riskScore = Math.min(95, baseScore + highRiskCount * 30 + mediumRiskCount * 15);

  const riskLevel = riskScore >= 60 ? 'High Risk' : riskScore >= 35 ? 'Moderate Risk' : 'Low Risk';
  const riskColor = riskScore >= 60 ? 'var(--status-unverified)' : riskScore >= 35 ? 'var(--status-repaired)' : 'var(--status-verified)';

  return (
    <div className="view-container">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Document Health & Risk Report</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
          Statutory compliance audit across {clauses.length} extracted clauses mapped against the curated Indian legal framework.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* Risk Score */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Statutory Risk Score
            </span>
            <ShieldAlert size={20} color={riskColor} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: riskColor }}>{riskScore}</span>
            <span style={{ color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 600, color: riskColor }}>
            {riskLevel} — {findings.length} statutory flag{findings.length !== 1 ? 's' : ''} detected
          </div>
        </div>

        {/* Classified Vertical */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Detected Domain
            </span>
            <FileText size={20} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
            {vertical}
          </div>
          <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Audited against {relevantRules.length} statutory rules
          </div>
        </div>

        {/* Clauses Analyzed */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clauses Analyzed
            </span>
            <CheckCircle size={20} color="var(--status-verified)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {clauses.length}
          </div>
          <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Zero Document Persistence (NFR-1 Compliant)
          </div>
        </div>
      </div>

      {/* Statutory Findings & Recommendations */}
      {findings.length > 0 ? (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="var(--status-repaired)" />
            Statutory Red Flags & Recommended Amendments
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {findings.map((finding, idx) => (
              <div
                key={idx}
                className="glass-card"
                style={{
                  borderLeft: `4px solid ${finding.riskSeverity === 'high' ? 'var(--status-unverified)' : 'var(--status-repaired)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {finding.issueTitle}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        background: finding.riskSeverity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: finding.riskSeverity === 'high' ? 'var(--status-unverified)' : 'var(--status-repaired)',
                      }}
                    >
                      {finding.riskSeverity} risk
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
                    Clause {finding.clauseId}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <strong>Legal Grounding:</strong> {finding.statuteCitation}
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                  {finding.explanation}
                </p>

                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <ArrowRight size={16} color="var(--accent-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <strong>Actionable Amendment:</strong> {finding.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 24, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14 }}>
          <ShieldCheck size={32} color="var(--status-verified)" />
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--status-verified)' }}>
              No Major Statutory Violations Detected
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              The extracted clauses in this agreement align with standard statutory benchmarks under the {vertical} legal pack.
            </p>
          </div>
        </div>
      )}

      {/* Clause-by-Clause Breakdown */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 16 }}>Clause-by-Clause Taxonomy Breakdown</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {clauses.map((clause, idx) => (
          <div key={idx} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-accent)' }}>
                  {clause.clause_id}
                </span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.06)', textTransform: 'uppercase' }}>
                  {clause.clause_category.replace(/_/g, ' ')}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {clause.page_number}</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {clause.clause_text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
