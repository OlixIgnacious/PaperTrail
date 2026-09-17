import React, { useState, useEffect } from 'react';
import { DocumentClause, CitationTarget, LegalVertical } from './types/index.ts';
import { DocumentViewer } from './components/DocumentViewer.tsx';
import { TargetedQA } from './components/TargetedQA.tsx';
import { DocumentReport } from './components/DocumentReport.tsx';
import { CompareView } from './components/CompareView.tsx';
import { LegalAidNavigator } from './components/LegalAidNavigator.tsx';
import { DraftingView } from './components/DraftingView.tsx';
import { LanguageSelector } from './components/LanguageSelector.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import { AuthModal, AuthUser } from './components/AuthModal.tsx';
import { extractClausesFromText } from './services/pdfExtractor.ts';
import {
  UploadCloud,
  HelpCircle,
  Activity,
  ArrowLeftRight,
  Scale,
  FileEdit,
  User,
  FileText,
} from 'lucide-react';
import './styles/index.css';

type ActiveTab = 'qa' | 'report' | 'compare' | 'legalaid' | 'drafting';

const SAMPLE_LEASE_TEXT = `RESIDENTIAL LEASE AGREEMENT
This Tenancy Agreement is entered into on 1st January 2026 between Landlord and Tenant for the premises located at Indiranagar, Bengaluru, Karnataka.

1. TERM & POSSESSION
The tenancy shall commence from 1st January 2026 and expire on 31st December 2026. Either party may terminate this agreement by providing a minimum of 30 (thirty) days written notice to the other party.

2. RENT & SECURITY DEPOSIT
The Monthly Rent shall be INR 25,000 payable by the 5th of each calendar month. The Tenant has deposited a Security Deposit of INR 50,000, equivalent to strictly two months rent, refundable in full within 15 days of peaceful handover of keys upon tenancy termination.

3. UTILITIES & ESSENTIAL SERVICES
The Landlord covenants not to withhold or cut off any essential supply or service, including water supply, electricity, or stairway access, during the subsistence of this tenancy under any circumstances.

4. MAINTENANCE & REPAIRS
The Landlord agrees to undertake all major structural repairs, dampness treatments, and external maintenance at own expense. The Tenant shall be responsible for routine day-to-day maintenance, minor electrical bulb replacements, and interior cleanliness.

5. DISPUTE RESOLUTION
Any dispute arising from or related to this tenancy agreement shall be subject to the exclusive jurisdiction of the Rent Authority and Rent Tribunal established under the Karnataka Rent / Model Tenancy Act provisions.`;

const SAMPLE_CONTRACTS = [
  { label: 'Sample: Rental Lease (PDF)', file: 'rental_agreement.pdf', vertical: 'rental' as LegalVertical },
  { label: 'Sample: Employment Offer (PDF)', file: 'employment_offer.pdf', vertical: 'employment' as LegalVertical },
  { label: 'Sample: Gig Partner Terms (PDF)', file: 'gig_platform_terms.pdf', vertical: 'gig' as LegalVertical },
  { label: 'Sample: Appliance Warranty (PDF)', file: 'consumer_warranty.pdf', vertical: 'consumer' as LegalVertical },
  { label: 'Sample: Traffic E-Challan (PDF)', file: 'traffic_echallan.pdf', vertical: 'challan' as LegalVertical },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('qa');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [uploadedFile, setUploadedFile] = useState<File | string | null>('/fixtures/rental_agreement.pdf');
  const [documentName, setDocumentName] = useState<string>('Sample: Rental Lease (PDF)');
  const [rawText, setRawText] = useState<string>('');
  const [clauses, setClauses] = useState<DocumentClause[]>([]);
  const [detectedVertical, setDetectedVertical] = useState<LegalVertical>('rental');
  const [citationTarget, setCitationTarget] = useState<CitationTarget | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Restore session from localStorage on startup
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('papertrail_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.warn('Failed to restore auth user:', err);
    }
  }, []);

  // Initialize with rental agreement sample clauses
  useEffect(() => {
    loadSampleContract('rental_agreement.pdf', 'rental');
  }, []);

  async function loadSampleContract(fileName: string, vertical: LegalVertical) {
    const found = SAMPLE_CONTRACTS.find((c) => c.file === fileName);
    setDocumentName(found ? found.label : fileName);
    try {
      setUploadedFile(`/fixtures/${fileName}`);
      setRawText('');
      setDetectedVertical(vertical);
      const res = await fetch('/fixtures/extracted_fixtures.json');
      if (res.ok) {
        const data = await res.json();
        if (data[fileName]) {
          setClauses(data[fileName]);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load pre-extracted fixture JSON:', err);
    }
    // Fallback to text
    setUploadedFile(null);
    setRawText(SAMPLE_LEASE_TEXT);
    const extracted = await extractClausesFromText(SAMPLE_LEASE_TEXT, fileName);
    setClauses(extracted);
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-logo">PT</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="brand-title">PaperTrail</span>
              <span className="brand-badge">Grounded Legal Aid</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="tabs-nav" aria-label="Main Navigation">
          <button
            className={`tab-btn ${activeTab === 'qa' ? 'active' : ''}`}
            onClick={() => setActiveTab('qa')}
          >
            <HelpCircle size={15} />
            <span>Targeted Q&A</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            <Activity size={15} />
            <span>Health Report</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <ArrowLeftRight size={15} />
            <span>Compare</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'legalaid' ? 'active' : ''}`}
            onClick={() => setActiveTab('legalaid')}
          >
            <Scale size={15} />
            <span>Legal Aid (DLSA)</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'drafting' ? 'active' : ''}`}
            onClick={() => setActiveTab('drafting')}
          >
            <FileEdit size={15} />
            <span>Notice Drafter</span>
          </button>
        </nav>

        {/* Controls: Sample selector, Language, Upload & Auth */}
        <div className="nav-controls">
          <select
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
            onChange={(e) => {
              const selected = SAMPLE_CONTRACTS.find((c) => c.file === e.target.value);
              if (selected) loadSampleContract(selected.file, selected.vertical);
            }}
            defaultValue="rental_agreement.pdf"
            aria-label="Select sample contract"
          >
            {SAMPLE_CONTRACTS.map((c) => (
              <option key={c.file} value={c.file}>
                {c.label}
              </option>
            ))}
          </select>

          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
          />

          {/* Prominent Upload Contract Button */}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsUploadModalOpen(true)}
            title="Upload any PDF or TXT contract"
            style={{ padding: '6px 12px', fontSize: '0.82rem', gap: 6 }}
            aria-label="Upload Document"
          >
            <UploadCloud size={14} />
            <span>Upload Document</span>
          </button>

          {/* User Profile / Authentication Button */}
          {currentUser ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                padding: '5px 10px',
                fontSize: '0.82rem',
                gap: 6,
                borderColor: 'var(--accent-primary)',
              }}
              title="User Account"
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span>{currentUser.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsAuthModalOpen(true)}
              style={{ padding: '6px 14px', fontSize: '0.82rem', gap: 6 }}
            >
              <User size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Active Document Context Bar */}
      <div className="active-doc-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Active Contract:
          </span>
          <div className="active-doc-pill">
            <FileText size={14} color="var(--accent-primary)" />
            <span style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {documentName}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ({clauses.length} clauses)
            </span>
          </div>
          <span className={`vertical-tag ${detectedVertical}`}>
            {detectedVertical}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsUploadModalOpen(true)}
            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: 5 }}
            title="Upload another contract or choose a sample"
          >
            <UploadCloud size={13} />
            <span>Replace / Upload Document</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'qa' && (
          <div className="split-view-container">
            {/* Left Hero Pane: Targeted Q&A */}
            <section className="panel-qa">
              <TargetedQA
                documentClauses={clauses}
                selectedLanguage={selectedLanguage}
                onSelectCitation={(target) => setCitationTarget({ ...target })}
                detectedVertical={detectedVertical}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                activeDocumentName={documentName}
                onNavigateTab={setActiveTab}
              />
            </section>

            {/* Right Pane: Document Viewer with Jump-to-Source (FR-21, FR-22) */}
            <section className="panel-viewer">
              <DocumentViewer
                file={uploadedFile}
                citationTarget={citationTarget}
                rawTextFallback={rawText}
              />
            </section>
          </div>
        )}

        {activeTab === 'report' && (
          <DocumentReport clauses={clauses} vertical={detectedVertical} />
        )}

        {activeTab === 'compare' && <CompareView />}

        {activeTab === 'legalaid' && <LegalAidNavigator />}

        {activeTab === 'drafting' && <DraftingView userName={currentUser?.name} />}
      </main>

      {/* Upload Document Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentLoaded={(file, extractedClauses, vertical, textFallback) => {
          setUploadedFile(file);
          const name = typeof file === 'string'
            ? (file.startsWith('/fixtures/')
                ? (SAMPLE_CONTRACTS.find((c) => `/fixtures/${c.file}` === file)?.label || 'Contract')
                : (file || 'Custom Contract'))
            : file.name;
          setDocumentName(name);
          setRawText(textFallback || '');
          setClauses(extractedClauses);
          setDetectedVertical(vertical);
          setCitationTarget(null);
        }}
        onSelectSample={loadSampleContract}
      />

      {/* User Login & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
        currentUser={currentUser}
        onSignOut={() => {
          setCurrentUser(null);
          localStorage.removeItem('papertrail_user');
        }}
      />
    </div>
  );
};

