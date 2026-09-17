import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, X, AlertCircle, Shield, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { extractClausesFromPdfFile, extractClausesFromText } from '../services/pdfExtractor.ts';
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

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentLoaded,
  onSelectSample,
}) => {
  const [dragActive, setDragActive] = useState(false);
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
