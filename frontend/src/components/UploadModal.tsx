// PaperTrail Document Upload Modal Component (FR-1, FR-2)
// Full drag-and-drop support with client-side PDF.js extraction & Zero-Persistence privacy guarantee (NFR-1)

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle, Shield, Loader2 } from 'lucide-react';
import { extractClausesFromPdfFile, extractClausesFromText } from '../services/pdfExtractor.ts';
import { DocumentClause, LegalVertical } from '../types/index.ts';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentLoaded: (file: File | string, clauses: DocumentClause[], vertical: LegalVertical, rawTextFallback?: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onDocumentLoaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  async function processFile(file: File) {
    setIsProcessing(true);
    setError(null);

    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const { clauses, detectedVertical } = await extractClausesFromPdfFile(file);
        if (clauses.length === 0) {
          throw new Error('No readable text content found in the PDF. Please check if the document is scanned or password protected.');
        }
        onDocumentLoaded(file, clauses, detectedVertical);
        onClose();
      } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        const text = await file.text();
        const clauses = await extractClausesFromText(text, file.name);
        const lower = text.toLowerCase();
        const vertical: LegalVertical = lower.includes('employee') ? 'employment' : lower.includes('challan') ? 'challan' : 'rental';
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 520,
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
              Upload any PDF or TXT contract to analyze clauses and citations
            </p>
          </div>
        </div>

        {/* Zero-Persistence Guarantee Banner */}
        <div
          style={{
            margin: '16px 0',
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
            <strong>Zero-Persistence Privacy (NFR-1):</strong> Processed strictly in-memory in your browser. Document text is never written to any database or server disk.
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: isProcessing ? 'wait' : 'pointer',
            background: dragActive ? 'rgba(99, 102, 241, 0.06)' : 'var(--bg-tertiary)',
            transition: 'all 0.2s ease',
            margin: '16px 0',
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Loader2 size={32} className="spin" color="var(--accent-primary)" />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Parsing Document & Extracting Clauses...
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Computing position coordinates and bounding boxes with PDF.js
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                }}
              >
                <FileText size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  Click to choose a file
                </span>{' '}
                <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>or drag and drop</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Supports PDF or TXT contracts (Rental, Employment, Gig, Consumer, Challan) up to 25MB
              </div>
            </div>
          )}
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
