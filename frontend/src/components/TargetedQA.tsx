// PaperTrail Targeted Q&A Component (FR-20 - Primary Hero Screen)
// Dedicated to targeted legal inquiries with side-by-side evidence links

import React, { useState } from 'react';
import { QAResponse, Citation, LegalVertical, CitationTarget } from '../types/index.ts';
import { askQuestion } from '../services/edgeApi.ts';
import { DocumentClause } from '../types/index.ts';
import { VoiceInputOutput } from './VoiceInputOutput.tsx';
import {
  Send,
  HelpCircle,
  ShieldCheck,
  FileCheck,
  ExternalLink,
  Sparkles,
  Lock,
  Copy,
  Check,
  FileEdit,
  Scale,
  MessageCircle,
  RotateCcw,
  History,
  ClipboardCheck,
} from 'lucide-react';
import { LawyerPrepModal } from './LawyerPrepModal.tsx';

interface TargetedQAProps {
  documentClauses: DocumentClause[];
  selectedLanguage: string;
  onSelectCitation: (target: CitationTarget) => void;
  detectedVertical: LegalVertical;
  onOpenUpload?: () => void;
  activeDocumentName?: string;
  onNavigateTab?: (tab: 'qa' | 'report' | 'compare' | 'legalaid' | 'drafting') => void;
}

const VERTICAL_QUESTIONS: Record<LegalVertical, string[]> = {
  rental: [
    'What is the notice period for terminating this lease agreement?',
    'What is the security deposit cap under the Model Tenancy Act?',
    'Can the landlord deduct painting or repair costs from my deposit?',
    'Who is responsible for major structural repairs vs minor maintenance?',
  ],
  employment: [
    'Is the 2-year post-termination non-compete clause legally enforceable in India?',
    'What are the statutory rules for notice period buyout and salary in lieu?',
    'Can an employer legally forfeit earned salary or statutory gratuity?',
    'What are the statutory working hours and overtime rules under the Labour Code?',
  ],
  gig: [
    'Can the aggregator platform arbitrarily deactivate my delivery account?',
    'What is the statutory cap on aggregator commission fees under MoRTH 2020?',
    'What appeal mechanisms exist against algorithmic rating penalties?',
    'Does the platform provide accidental injury or life insurance coverage?',
  ],
  consumer: [
    'Can the manufacturer deny warranty service for lack of original retail box?',
    'What is the statutory product replacement timeline under CPA 2019?',
    'Can I file a consumer complaint online on e-Daakhil without hiring a lawyer?',
    'Who is strictly liable for a defective unit: seller or manufacturer?',
  ],
  challan: [
    'What is the statutory compounding fine for speeding under the Motor Vehicles Act?',
    'Can traffic police impound my vehicle or seize my physical driving license?',
    'What is the timeline to contest an electronic e-challan in virtual court?',
    'Is a camera-based e-challan contestable if speed detection is disputed?',
  ],
};

export const TargetedQA: React.FC<TargetedQAProps> = ({
  documentClauses,
  selectedLanguage,
  onSelectCitation,
  detectedVertical,
  onOpenUpload,
  activeDocumentName,
  onNavigateTab,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QAResponse | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [history, setHistory] = useState<{ question: string; response: QAResponse }[]>([]);
  const [isLawyerPrepOpen, setIsLawyerPrepOpen] = useState(false);

  function handleCopyAnswer(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  }

  function handleWhatsAppShare(resp: QAResponse, query: string) {
    const citationText = resp.citations?.length
      ? `\n*Citation:* ${resp.citations.map((c) => c.citation_label).join(', ')}`
      : '';
    const text = `📋 *PaperTrail Legal Verification*\n\n*Question:* ${query || 'Legal Inquiry'}\n\n*Answer:* ${resp.answer}${citationText}\n\n_Verified by PaperTrail AI Legal Assistant (Grounded & Cited)_`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleClearSession() {
    setHistory([]);
    setResponse(null);
    setQuestion('');
  }

  const sampleQuestions = VERTICAL_QUESTIONS[detectedVertical] || VERTICAL_QUESTIONS.rental;

  async function handleAsk(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    onSelectCitation(null as any);

    try {
      const conversationHistory = history.slice(-2).map((h) => ({
        question: h.question,
        answer: h.response.answer,
      }));

      const res = await askQuestion({
        question: q,
        language: selectedLanguage,
        documentClauses,
        filterVertical: detectedVertical,
        conversationHistory,
      });
      setResponse(res);
      setHistory((prev) => [...prev, { question: q, response: res }]);
    } catch (err) {
      console.error('QA request error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleAsk(question);
    }
  }

  function handleCitationClick(citation: Citation) {
    if (citation.page_number) {
      onSelectCitation({
        page_number: citation.page_number,
        position: citation.position,
        label: citation.citation_label,
      });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="var(--accent-primary)" />
            Targeted Legal Q&A
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Vertical: <strong style={{ color: 'var(--text-primary)' }}>{detectedVertical}</strong>
            </span>
            {onOpenUpload && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onOpenUpload}
                style={{ padding: '3px 8px', fontSize: '0.75rem', gap: 4 }}
                title="Upload any PDF or TXT contract"
              >
                <span>+ Upload Contract</span>
              </button>
            )}
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          Ask specific questions. Every answer is grounded directly in your uploaded document or hand-curated Indian statutes.
        </p>
      </div>

      {/* Suggested Quick Questions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {sampleQuestions.slice(0, 4).map((sq, idx) => (
          <button
            key={idx}
            className="btn-secondary"
            onClick={() => {
              setQuestion(sq);
              handleAsk(sq);
            }}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Search Input Box with STT Voice Input Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="qa-input"
            aria-label="Legal question input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Can my landlord deduct my deposit without proof?"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>
        <VoiceInputOutput
          onTranscript={(t) => {
            setQuestion(t);
            handleAsk(t);
          }}
          lang={selectedLanguage}
          showTts={false}
        />
        <button
          className="btn-primary"
          onClick={() => handleAsk(question)}
          disabled={loading || !question.trim()}
          title="Send Question"
          style={{ padding: '10px 16px' }}
        >
          {loading ? 'Verifying...' : <Send size={16} />}
        </button>
      </div>

      {/* Session Conversation Banner */}
      {history.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <History size={13} color="var(--accent-primary)" />
            <span>
              Session Conversation ({history.length} {history.length === 1 ? 'query' : 'queries'})
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearSession}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
            }}
            title="Reset conversation context for this session"
          >
            <RotateCcw size={11} />
            <span>Reset Context</span>
          </button>
        </div>
      )}

      {/* Answer & Evidence Display Container */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {response ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top Status & Verifier Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`status-badge ${response.verifierState}`}>
                  <ShieldCheck size={14} />
                  {response.verifierState}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Confidence: {Math.round(response.confidence * 100)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleCopyAnswer(response.answer)}
                  style={{ padding: '3px 8px', fontSize: '0.75rem', gap: 4 }}
                  title="Copy verified answer to clipboard"
                >
                  {copiedAnswer ? <Check size={12} color="var(--status-verified)" /> : <Copy size={12} />}
                  <span>{copiedAnswer ? 'Copied!' : 'Copy Answer'}</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleWhatsAppShare(response, question)}
                  style={{ padding: '3px 8px', fontSize: '0.75rem', gap: 4 }}
                  title="Share verified legal answer via WhatsApp"
                >
                  <MessageCircle size={12} color="#25D366" />
                  <span>Share via WhatsApp</span>
                </button>
                {response.safety.piiRedacted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Lock size={12} />
                    PII Redacted
                  </div>
                )}
              </div>
            </div>

            {/* English Answer */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  Answer (English)
                </h4>
                <VoiceInputOutput textToRead={response.answer} lang="en" showStt={false} />
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {response.answer}
              </p>
            </div>

            {/* Local Language Answer (if not en) */}
            {selectedLanguage !== 'en' && response.answer_local && (
              <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-accent)' }}>
                    Local Language Translation ({selectedLanguage.toUpperCase()})
                  </h4>
                  <VoiceInputOutput textToRead={response.answer_local} lang={selectedLanguage} showStt={false} />
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {response.answer_local}
                </p>
              </div>
            )}

            {/* Clickable Grounded Citations (FR-21, FR-22) */}
            {response.citations && response.citations.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>
                  Grounded Citations (Click to jump):
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {response.citations.map((c, idx) => (
                    <button
                      key={idx}
                      className="citation-pill"
                      onClick={() => handleCitationClick(c)}
                      title="Click to jump and highlight in document"
                    >
                      <FileCheck size={14} />
                      <span>{c.citation_label}</span>
                      <ExternalLink size={12} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Next Legal Remedies Action Box */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 4 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: 8 }}>
                Recommended Action Pathways:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {onNavigateTab && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => onNavigateTab('drafting')}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
                  >
                    <FileEdit size={14} />
                    <span>Draft Statutory Demand Notice</span>
                  </button>
                )}
                {onNavigateTab && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onNavigateTab('legalaid')}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
                  >
                    <Scale size={14} color="var(--accent-primary)" />
                    <span>Find Free Legal Aid (DLSA)</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsLawyerPrepOpen(true)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
                  title="Generate actionable checklist and questions for an advocate"
                >
                  <ClipboardCheck size={14} color="var(--accent-primary)" />
                  <span>Prepare for Lawyer & Action Checklist</span>
                </button>
              </div>
            </div>

            {/* Verifier Audit Notes */}
            {response.verificationNotes && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                {response.verificationNotes.map((note, idx) => (
                  <div key={idx}>• {note}</div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: 'var(--text-muted)', textAlign: 'center' }}>
            <HelpCircle size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: '0.9rem' }}>Type a legal question above to get a verified, cited answer.</p>
            <p style={{ fontSize: '0.8rem', marginTop: 4, maxWidth: 300 }}>
              Answers cite either your uploaded document or the curated Indian statute rule pack.
            </p>
          </div>
        )}
      </div>

      <LawyerPrepModal
        isOpen={isLawyerPrepOpen}
        onClose={() => setIsLawyerPrepOpen(false)}
        detectedVertical={detectedVertical}
        documentTitle={documentClauses[0]?.clause_id ? (activeDocumentName || 'Active Legal Document') : 'Legal Matter'}
        lastQuestion={question}
        lastAnswer={response?.answer}
        citations={response?.citations}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
