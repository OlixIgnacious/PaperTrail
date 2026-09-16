// PaperTrail Document Viewer Component (FR-21, FR-22)
// Built with react-pdf & jump-to-source highlighting support for Case A and Case B

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { CitationTarget } from '../types/index.ts';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import '../styles/viewer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface DocumentViewerProps {
  file: File | string | null;
  citationTarget?: CitationTarget | null;
  rawTextFallback?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  file,
  citationTarget,
  rawTextFallback,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [activeHighlight, setActiveHighlight] = useState<CitationTarget | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Listen for citation jumps
  useEffect(() => {
    if (citationTarget && citationTarget.page_number) {
      const targetPage = citationTarget.page_number;
      setPageNumber(targetPage);
      setActiveHighlight(citationTarget);

      // Scroll smoothly to target page element
      const pageEl = pageRefs.current.get(targetPage);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [citationTarget]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoadError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error('react-pdf load error:', err);
    setLoadError(err.message);
  }

  // Fallback: If no PDF file is provided but raw text exists
  if (!file || loadError) {
    return (
      <div className="viewer-wrapper">
        <div className="viewer-toolbar">
          <div className="viewer-info">
            <FileText size={16} />
            <span>Document Preview (Text Mode)</span>
          </div>
        </div>
        <div className="viewer-scroll-canvas" style={{ alignItems: 'stretch' }}>
          {rawTextFallback ? (
            <div className="glass-card" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              {rawTextFallback}
            </div>
          ) : (
            <div className="dropzone-container">
              <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
              <h3>No Document Loaded</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8, maxWidth: 360 }}>
                Upload a lease agreement, employment offer letter, gig contract, or challan PDF to view side-by-side evidence citations.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="viewer-wrapper" ref={containerRef}>
      {/* Top Toolbar */}
      <div className="viewer-toolbar">
        <div className="viewer-info">
          <FileText size={16} />
          <span>Page {pageNumber} of {numPages || '--'}</span>
        </div>
        <div className="viewer-controls">
          <button
            className="btn-secondary"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
            title="Zoom Out"
            style={{ padding: '6px 10px' }}
          >
            <ZoomOut size={16} />
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            className="btn-secondary"
            onClick={() => setScale((s) => Math.min(2.0, s + 0.1))}
            title="Zoom In"
            style={{ padding: '6px 10px' }}
          >
            <ZoomIn size={16} />
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 4px' }} />
          <button
            className="btn-secondary"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            style={{ padding: '6px 10px' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn-secondary"
            disabled={numPages === null || pageNumber >= numPages}
            onClick={() => setPageNumber((p) => Math.min(numPages || p, p + 1))}
            style={{ padding: '6px 10px' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* PDF Scroll Area */}
      <div className="viewer-scroll-canvas">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div style={{ color: 'var(--text-secondary)', padding: 40 }}>
              Loading PDF pages...
            </div>
          }
        >
          {Array.from(new Array(numPages || 0), (_, index) => {
            const currentPg = index + 1;
            const isHighlighted = activeHighlight?.page_number === currentPg;
            const hasPreciseBox = isHighlighted && activeHighlight?.position?.bbox;

            return (
              <div
                key={`page_${currentPg}`}
                className="pdf-page-container"
                ref={(el) => {
                  if (el) pageRefs.current.set(currentPg, el);
                  else pageRefs.current.delete(currentPg);
                }}
              >
                {/* Case B: Scanned / OCR Document Banner (Page-level jump only) */}
                {isHighlighted && !hasPreciseBox && (
                  <div className="page-fallback-banner">
                    📍 Cited Source: Page {currentPg}
                  </div>
                )}

                {/* Case A: Text-native Precise Highlight Box */}
                {hasPreciseBox && activeHighlight?.position?.bbox && (
                  <div
                    className="citation-highlight-box"
                    style={{
                      left: `${activeHighlight.position.bbox[0] * 100}%`,
                      top: `${activeHighlight.position.bbox[1] * 100}%`,
                      width: `${(activeHighlight.position.bbox[2] - activeHighlight.position.bbox[0]) * 100}%`,
                      height: `${(activeHighlight.position.bbox[3] - activeHighlight.position.bbox[1]) * 100}%`,
                    }}
                  />
                )}

                <Page
                  pageNumber={currentPg}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
};
