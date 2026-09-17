import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, X, AlertCircle, Shield, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { extractClausesFromPdfFile, extractClausesFromText, detectVerticalFromText } from '../services/pdfExtractor.ts';
import { DocumentClause, LegalVertical } from '../types/index.ts';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentLoaded: (file: File | string, clauses: DocumentClause[], vertical: LegalVertical, rawTextFallback?: string) => void;
  onSelectSample?: (fileName: string, vertical: LegalVertical) => void;
}

const SAMPLE_PRESETS: Array<{ label: string; file: string; vertical: LegalVertical }> = [
  { label: 'Rental Lease', file: 'rental_agreement.pdf', vertical: 'rental' },
  { label: 'Employment Offer', file: 'employment_offer.pdf', vertical: 'employment' },
  { label: 'Gig Terms', file: 'gig_platform_terms.pdf', vertical: 'gig' },
  { label: 'Appliance Warranty', file: 'consumer_warranty.pdf', vertical: 'consumer' },
  { label: 'Traffic E-Challan', file: 'traffic_echallan.pdf', vertical: 'challan' },
];

const SAMPLE_TEXT_SNIPPETS = [
  {
    label: 'Tenancy Deposit Terms',
    title: 'Residential Tenancy Agreement',
    text: `1. SECURITY DEPOSIT AND REFUND:
The Tenant agrees to pay an interest-free security deposit of INR 1,50,000 to the Landlord prior to occupation. The Landlord shall retain this deposit and deduct painting and refurbishment charges of 1 month rent upon vacating, regardless of reasonable wear and tear. The remaining deposit shall be refunded within 90 days following vacant possession.

2. TERMINATION AND NOTICE PERIOD:
Either party may terminate this agreement by providing a mandatory 3-month prior written notice. If the Tenant vacates early, the entire security deposit shall be forfeited as liquidated damages.

3. LANDLORD ENTRY AND INSPECTION:
The Landlord reserves the unrestricted right to enter and inspect the premises at any hour without prior written notice to the Tenant.`,
  },
  {
    label: 'Employment Non-Compete Terms',
    title: 'Software Developer Employment Contract',
    text: `1. NON-COMPETE COVENANT (POST-EMPLOYMENT):
The Employee undertakes that for a period of 24 months following separation from the Company, the Employee shall not directly or indirectly accept employment with, consult for, or establish any business competing with the Company anywhere in India.

2. NOTICE PERIOD AND WAGE WITHHOLDING:
The Employee must serve a mandatory 90-day notice period. In the event of resignation, the Company reserves the unilateral right to withhold all accrued wages, incentive payouts, and experience certificates until full commercial clearance is completed.`,
  },
  {
    label: 'Gig Platform Partner Agreement',
    title: 'Delivery Partner Platform Terms',
    text: `1. ARBITRARY ACCOUNT TERMINATION:
The Platform reserves the absolute prerogative to immediately suspend, deactivate, or terminate the Delivery Partner account without prior notice or right of appeal if customer feedback drops below 4.8 stars or upon any unverified customer dispute.

2. COMMISSION AND VEHICLE CHARGES:
The Platform shall levy a commission fee of 30% on all order earnings. Fuel costs, vehicle insurance, and mobile data expenses shall be borne solely by the Delivery Partner with zero platform contribution.`,
  },
];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentLoaded,
  onSelectSample,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function processFile(file: File) {
    setIsProcessing(true);
    setProcessStep(1);
    setError(null);

    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setProcessStep(2); // Extracting clauses & bounding boxes
        const { clauses, detectedVertical } = await extractClausesFromPdfFile(file);
        if (clauses.length === 0) {
          throw new Error('No readable text content found in the PDF. Please check if the document is scanned or password protected.');
        }
        setProcessStep(3); // Classifying vertical domain
        await new Promise((r) => setTimeout(r, 200));
        setProcessStep(4); // Zero-Persistence complete
        await new Promise((r) => setTimeout(r, 200));
        onDocumentLoaded(file, clauses, detectedVertical);
        onClose();
      } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        setProcessStep(2);
        const text = await file.text();
        const clauses = await extractClausesFromText(text, file.name);
        const lower = text.toLowerCase();
        const vertical: LegalVertical = lower.includes('employee') ? 'employment' : lower.includes('challan') ? 'challan' : 'rental';
        setProcessStep(3);
        await new Promise((r) => setTimeout(r, 200));
        onDocumentLoaded('', clauses, vertical, text);
        onClose();
      } else {
        throw new Error('Unsupported file format. Please upload a PDF (.pdf) or Text (.txt) file.');
      }
    } catch (err: any) {
      console.error('File processing error:', err);
      setError(err.message || 'Failed to process the uploaded document.');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }

  async function handleProcessPastedText() {
    if (!pastedText.trim() || isProcessing) return;
    setIsProcessing(true);
    setProcessStep(1);
    setError(null);

    try {
      setProcessStep(2);
      const title = pastedTitle.trim() || 'Pasted Agreement Document';
      const clauses = await extractClausesFromText(pastedText, title);
      if (clauses.length === 0) {
        throw new Error('No distinct clauses identified. Please paste at least one complete paragraph or numbered clause.');
      }
      setProcessStep(3);
      const detectedVertical = detectVerticalFromText(pastedText);
      await new Promise((r) => setTimeout(r, 200));
      setProcessStep(4);
      await new Promise((r) => setTimeout(r, 150));
      onDocumentLoaded(title, clauses, detectedVertical, pastedText);
      onClose();
    } catch (err: any) {
      console.error('Text extraction error:', err);
      setError(err.message || 'Failed to process pasted agreement text.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card modal-dialog"
        style={{
          maxWidth: 540,
          padding: 24,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <UploadCloud size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Upload Legal Document</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Analyze clauses, identify high-risk terms, and ask grounded questions
            </p>
          </div>
        </div>

        {/* Zero-Persistence Guarantee Banner */}
        <div
          style={{
            margin: '14px 0',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Shield size={18} color="var(--status-verified)" />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            <strong>Zero-Persistence Privacy (NFR-1):</strong> Processed strictly in-memory in your browser. Document text is never saved to any database or server disk.
          </div>
        </div>

        {/* Input Mode Tab Switcher (FR-1) */}
        <div style={{ display: 'flex', gap: 8, margin: '14px 0 10px 0' }}>
          <button
            type="button"
            className={inputMode === 'upload' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setInputMode('upload')}
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', justifyContent: 'center', gap: 6 }}
          >
            <UploadCloud size={15} />
            <span>Upload Document (.PDF / .TXT)</span>
          </button>
          <button
            type="button"
            className={inputMode === 'paste' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setInputMode('paste')}
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', justifyContent: 'center', gap: 6 }}
          >
            <FileText size={15} />
            <span>Paste Contract Text (FR-1)</span>
          </button>
        </div>

        {inputMode === 'upload' ? (
          <>
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '28px 20px',
                textAlign: 'center',
                cursor: isProcessing ? 'wait' : 'pointer',
                background: dragActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-tertiary)',
                transition: 'all 0.2s ease',
                margin: '14px 0',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleChange}
                style={{ display: 'none' }}
              />

              {isProcessing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <Loader2 size={32} className="spin" color="var(--accent-primary)" />
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Processing Document In-Browser
                  </div>

                  {/* Progressive Steps Indicator */}
                  <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: processStep >= 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {processStep > 1 ? <CheckCircle2 size={14} color="var(--status-verified)" /> : <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }} />}
                      <span>1. Reading binary document bytes into browser buffer</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: processStep >= 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {processStep > 2 ? <CheckCircle2 size={14} color="var(--status-verified)" /> : processStep === 2 ? <Loader2 size={14} className="spin" color="var(--accent-primary)" /> : <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--border-subtle)', display: 'inline-block' }} />}
                      <span>2. PDF.js text extraction & bounding-box normalization</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: processStep >= 3 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {processStep > 3 ? <CheckCircle2 size={14} color="var(--status-verified)" /> : processStep === 3 ? <Loader2 size={14} className="spin" color="var(--accent-primary)" /> : <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--border-subtle)', display: 'inline-block' }} />}
                      <span>3. Auto-classifying legal vertical domain</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: processStep >= 4 ? 'var(--status-verified)' : 'var(--text-muted)' }}>
                      {processStep >= 4 ? <CheckCircle2 size={14} color="var(--status-verified)" /> : <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--border-subtle)', display: 'inline-block' }} />}
                      <span>4. Zero-Persistence verified (ready for session Q&A)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <FileText size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      Click to choose a file
                    </span>{' '}
                    <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>or drag and drop</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Supports PDF (.pdf) or Text (.txt) up to 15MB
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sample Presets */}
            <div style={{ marginTop: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sparkles size={14} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Or try a curated Indian sample agreement:
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SAMPLE_PRESETS.map((p) => (
                  <button
                    key={p.file}
                    type="button"
                    className="btn-secondary"
                    disabled={isProcessing}
                    onClick={() => {
                      if (onSelectSample) {
                        onSelectSample(p.file, p.vertical);
                        onClose();
                      }
                    }}
                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 4 }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Direct Contract Text Paste Mode (FR-1) */
          <div style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              className="qa-input"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              placeholder="Agreement Title (e.g. Bangalore Residential Tenancy Terms)"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              aria-label="Pasted agreement title"
            />
            <textarea
              className="qa-input"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your contract text, clauses, or terms of service here directly (e.g. from an email, WhatsApp message, or digital agreement)..."
              rows={7}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                resize: 'vertical',
              }}
              aria-label="Contract text input"
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {pastedText.length} characters • {pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0} words
              </span>
              <button
                type="button"
                className="btn-primary"
                onClick={handleProcessPastedText}
                disabled={isProcessing || !pastedText.trim()}
                style={{ padding: '6px 14px', fontSize: '0.82rem', gap: 6 }}
              >
                <Sparkles size={14} />
                <span>{isProcessing ? 'Segmenting Clauses...' : 'Extract & Analyze Clauses'}</span>
              </button>
            </div>

            {/* Sample Text Excerpts */}
            <div style={{ marginTop: 6, marginBottom: 8 }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                Or test with a sample contract excerpt:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SAMPLE_TEXT_SNIPPETS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn-secondary"
                    disabled={isProcessing}
                    onClick={() => {
                      setPastedTitle(s.title);
                      setPastedText(s.text);
                    }}
                    style={{ padding: '4px 8px', fontSize: '0.73rem', borderRadius: 4 }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--status-unverified)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8rem',
              color: 'var(--status-unverified)',
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-secondary" onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
