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
} from 'lucide-react';

interface TargetedQAProps {
  documentClauses: DocumentClause[];
  selectedLanguage: string;
  onSelectCitation: (target: CitationTarget) => void;
  detectedVertical: LegalVertical;
}

const SAMPLE_QUESTIONS = [
  'What is the notice period for terminating this contract?',
  'How much security deposit is required and when is it refundable?',
  'Does the agreement contain any non-compete or penalty clauses?',
  'Are there any arbitrary account deactivation conditions?',
  'Who is responsible for repairs and maintenance charges?',
];

export const TargetedQA: React.FC<TargetedQAProps> = ({
  documentClauses,
  selectedLanguage,
  onSelectCitation,
  detectedVertical,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QAResponse | null>(null);

  async function handleAsk(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    onSelectCitation(null as any);

    try {
      const res = await askQuestion({
        question: q,
        language: selectedLanguage,
        documentClauses,
        filterVertical: detectedVertical,
      });
      setResponse(res);
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
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Vertical: <strong style={{ color: 'var(--text-primary)' }}>{detectedVertical}</strong>
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          Ask specific questions. Every answer is grounded directly in your uploaded document or hand-curated Indian statutes.
        </p>
      </div>

      {/* Suggested Quick Questions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {SAMPLE_QUESTIONS.slice(0, 3).map((sq, idx) => (
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
              {response.safety.piiRedacted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Lock size={12} />
                  PII Redacted
                </div>
              )}
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
    </div>
  );
};
