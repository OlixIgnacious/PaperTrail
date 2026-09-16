// PaperTrail Legal Aid Navigator Component (FR-13)
// Section 12 Eligibility Checker & NALSA/DLSA Directory (Directory + Eligibility check ONLY, no booking)

import React, { useState } from 'react';
import { Scale, CheckCircle, AlertCircle, Phone, MapPin, ExternalLink, Shield, Info } from 'lucide-react';

interface DLSAContact {
  state: string;
  district: string;
  address: string;
  helpline: string;
  email: string;
}

const NATIONWIDE_DLSA_DIRECTORY: DLSAContact[] = [
  {
    state: 'Delhi',
    district: 'Central Delhi',
    address: 'Room No. 287, Tis Hazari Courts, Delhi - 110054',
    helpline: '15100 / 011-23968052',
    email: 'dlsa-central@nic.in',
  },
  {
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: 'City Civil Court Complex, Bengaluru - 560001',
    helpline: '15100 / 080-22211756',
    email: 'dlsa-bengaluru@karnataka.gov.in',
  },
  {
    state: 'Maharashtra',
    district: 'Mumbai City',
    address: 'Old City Civil Court Bldg, Fort, Mumbai - 400032',
    helpline: '15100 / 022-22676798',
    email: 'dlsa-mumbai@gov.in',
  },
  {
    state: 'Tamil Nadu',
    district: 'Chennai',
    address: 'High Court Campus, Chennai - 600104',
    helpline: '15100 / 044-25342834',
    email: 'dlsa-chennai@tn.gov.in',
  },
  {
    state: 'Telangana',
    district: 'Hyderabad',
    address: 'City Civil Court Complex, Purani Haveli, Hyderabad - 500002',
    helpline: '15100 / 040-24520286',
    email: 'dlsa-hyd@telangana.gov.in',
  },
  {
    state: 'West Bengal',
    district: 'Kolkata',
    address: 'City Civil Court, 2 & 3 Kiran Shankar Roy Road, Kolkata - 700001',
    helpline: '15100 / 033-22485741',
    email: 'dlsa-kolkata@wb.gov.in',
  },
  {
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    address: 'District Court Compound, Kaiserbagh, Lucknow - 226001',
    helpline: '15100 / 0522-2615481',
    email: 'dlsa-lucknow@up.gov.in',
  },
  {
    state: 'Gujarat',
    district: 'Ahmedabad',
    address: 'Mirzapur Court Complex, Ahmedabad - 380001',
    helpline: '15100 / 079-25624102',
    email: 'dlsa-ahmedabad@gujarat.gov.in',
  },
  {
    state: 'Kerala',
    district: 'Ernakulam (Kochi)',
    address: 'District Court Complex, Park Avenue, Kochi - 682011',
    helpline: '15100 / 0484-2365288',
    email: 'dlsa-ekm@kerala.gov.in',
  },
  {
    state: 'Rajasthan',
    district: 'Jaipur Metropolitan',
    address: 'Sessions Court Campus, Bani Park, Jaipur - 302016',
    helpline: '15100 / 0141-2209148',
    email: 'dlsa-jaipur@rajasthan.gov.in',
  },
];

export const LegalAidNavigator: React.FC = () => {
  // Eligibility criteria under Section 12 of the Legal Services Authorities Act 1987
  const [isWomanOrChild, setIsWomanOrChild] = useState(false);
  const [isSCST, setIsSCST] = useState(false);
  const [isIndustrialWorkman, setIsIndustrialWorkman] = useState(false);
  const [isDifferentlyAbled, setIsDifferentlyAbled] = useState(false);
  const [isTraffickingVictim, setIsTraffickingVictim] = useState(false);
  const [isDisasterVictim, setIsDisasterVictim] = useState(false);
  const [incomeUnderThreshold, setIncomeUnderThreshold] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isEligible =
    isWomanOrChild ||
    isSCST ||
    isIndustrialWorkman ||
    isDifferentlyAbled ||
    isTraffickingVictim ||
    isDisasterVictim ||
    incomeUnderThreshold;

  const filteredContacts = NATIONWIDE_DLSA_DIRECTORY.filter(
    (c) =>
      c.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Scale size={24} color="var(--accent-primary)" />
          Legal Aid Navigator (Section 12 Assessment & DLSA Directory)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
          Determine eligibility for free state-funded legal aid under the Legal Services Authorities Act 1987 and locate your District Legal Services Authority.
        </p>
      </div>

      {/* NALSA 24x7 National Helpline Banner */}
      <div
        className="glass-card"
        style={{
          marginBottom: 24,
          padding: 18,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Phone size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              NALSA National Legal Aid Helpline: 15100 (Toll-Free, 24x7)
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Free telephone legal advice across 22 scheduled languages provided by the National Legal Services Authority.
            </div>
          </div>
        </div>
        <a
          href="https://nalsa.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <span>NALSA Official Portal</span>
          <ExternalLink size={14} />
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Section 12 Eligibility Wizard */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Section 12 Eligibility Assessment
            </h3>
            <Shield size={18} color="var(--accent-primary)" />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Select any criteria applicable to you under Section 12 of the Legal Services Authorities Act 1987:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isWomanOrChild}
                onChange={(e) => setIsWomanOrChild(e.target.checked)}
              />
              <span>Woman or child (Section 12(c))</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isSCST}
                onChange={(e) => setIsSCST(e.target.checked)}
              />
              <span>Member of Scheduled Caste or Scheduled Tribe (Section 12(a))</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isIndustrialWorkman}
                onChange={(e) => setIsIndustrialWorkman(e.target.checked)}
              />
              <span>Industrial workman or gig/platform delivery partner (Section 12(f))</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isDifferentlyAbled}
                onChange={(e) => setIsDifferentlyAbled(e.target.checked)}
              />
              <span>Person with disability or mental health challenge (Section 12(d))</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isTraffickingVictim}
                onChange={(e) => setIsTraffickingVictim(e.target.checked)}
              />
              <span>Victim of human trafficking or bonded labour (Section 12(g))</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isDisasterVictim}
                onChange={(e) => setIsDisasterVictim(e.target.checked)}
              />
              <span>Victim of natural disaster, industrial disaster, or ethnic violence (Section 12(b))</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={incomeUnderThreshold}
                onChange={(e) => setIncomeUnderThreshold(e.target.checked)}
              />
              <span>Annual income under state statutory limit (&le; ₹3,00,000 in most states) (Section 12(h))</span>
            </label>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 'var(--radius-sm)',
              background: isEligible ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isEligible ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: isEligible ? 'var(--status-verified)' : 'var(--text-secondary)' }}>
              {isEligible ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{isEligible ? 'Statutorily Eligible for Free Legal Aid' : 'Select any category to assess eligibility'}</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              {isEligible
                ? 'Under Section 12, the state is statutorily mandated to assign you an empanelled advocate free of cost, cover all court fees, and prepare legal pleadings without fee.'
                : 'Free legal aid is an unconditional statutory right under Article 39A of the Constitution of India for qualifying categories.'}
            </p>
          </div>
        </div>

        {/* NALSA / DLSA Directory */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              District Legal Services Authority (DLSA) Directory
            </h3>
            <MapPin size={18} color="var(--accent-primary)" />
          </div>
          <input
            type="text"
            placeholder="Search state or city (e.g. Delhi, Bengaluru, Mumbai, Chennai)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              marginBottom: 14,
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '340px', overflowY: 'auto' }}>
            {filteredContacts.map((contact, idx) => (
              <div key={idx} style={{ padding: 12, background: 'rgba(0, 0, 0, 0.28)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-accent)' }}>
                  DLSA {contact.district}, {contact.state}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{contact.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  <Phone size={14} /> <span>{contact.helpline}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12 }}>
            <Info size={13} />
            <span>PaperTrail provides directory lookups and eligibility guidance only (no third-party booking).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
