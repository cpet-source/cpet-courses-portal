import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RPClassLogger } from './RPClassLogger';
import { RPCentreStudents } from './RPCentreStudents';
import { RPAcademicEvaluation } from './RPAcademicEvaluation';
import { RPFeeRemittance } from './RPFeeRemittance';
import { RPNewCentreForm } from './RPNewCentreForm';
import {
  GraduationCap,
  BookOpen,
  Users,
  CreditCard,
  Building,
  Award,
  Home,
  MapPin,
  CheckCircle,
  Clock,
  Phone,
  Landmark
} from 'lucide-react';

export const RPDashboard = () => {
  const { currentRp, centres, classLogs, payouts } = useApp();
  const [activeTab, setActiveTab] = useState('home');

  const assignedCentres = centres.filter(c => c.founded_by_rp_id === currentRp.id || c.assigned_rp_id === currentRp.id);
  const rpLogs = classLogs.filter(l => l.rp_id === currentRp.id);

  // Financial statistics for current RP
  const verifiedLogs = rpLogs.filter(l => l.status === 'VERIFIED_BY_ADMIN');
  const pendingLogs = rpLogs.filter(l => l.status === 'SUBMITTED');
  const totalVerifiedWage = verifiedLogs.reduce((sum, l) => sum + (l.total_claim || 0), 0);
  const totalPendingWage = pendingLogs.reduce((sum, l) => sum + (l.total_claim || 0), 0);

  const navItems = [
    { key: 'home',       label: 'Home',     icon: Home },
    { key: 'classes',    label: 'Classes',  icon: BookOpen },
    { key: 'students',   label: 'Students', icon: GraduationCap },
    { key: 'evaluation', label: 'Marks',    icon: Award },
    { key: 'remittance', label: 'Fee',      icon: CreditCard },
    { key: 'newcentre',  label: 'Centre',   icon: Building },
  ];

  return (
    <div>
      {/* ═══════════════════════════════════════════
          DESKTOP TABS — hidden on mobile via CSS
      ═══════════════════════════════════════════ */}
      <div className="cpet-tabs rp-desktop-tabs" style={{ marginBottom: '1.25rem' }}>
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} />
            <span>
              {key === 'home' && 'Home'}
              {key === 'classes' && `Class Logs (${rpLogs.length})`}
              {key === 'students' && 'Courses & Students'}
              {key === 'evaluation' && 'Marks & Attendance'}
              {key === 'remittance' && 'Fee Remittance'}
              {key === 'newcentre' && 'New Study Centre'}
            </span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          TAB CONTENT
      ═══════════════════════════════════════════ */}

      {/* HOME / PROFILE TAB */}
      {activeTab === 'home' && (
        <div>
          {/* Teacher Profile Card */}
          <div className="cpet-card" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)', borderLeft: '4px solid var(--cpet-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--cpet-primary)' }}>
                    {currentRp.full_name}
                  </h2>
                  <span className="badge badge-accent">Resource Person</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  <Phone size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  {currentRp.phone}
                  {currentRp.qualification && <span style={{ marginLeft: 8 }}>· {currentRp.qualification}</span>}
                </p>
                {currentRp.bank_account_details && (
                  <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                    <Landmark size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Bank A/C: <strong>{currentRp.bank_account_details}</strong>
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'white', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Verified Payout Dues</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--cpet-primary)' }}>₹{totalVerifiedWage.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ background: 'white', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Pending Logs</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--cpet-warning)' }}>{pendingLogs.length} classes</strong>
                </div>
              </div>
            </div>

            {/* Assigned Centres Bar */}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Assigned Study Centres:</span>
              {assignedCentres.length === 0 ? (
                <span style={{ color: '#94a3b8' }}>None currently assigned</span>
              ) : (
                assignedCentres.map(c => (
                  <span key={c.id} className="badge badge-primary">
                    <MapPin size={11} /> {c.centre_name} ({c.place})
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Quick-Access Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
            {[
              { key: 'classes',    icon: BookOpen,      label: 'Class Logs',      count: rpLogs.length,       color: '#3b82f6' },
              { key: 'students',   icon: GraduationCap, label: 'Courses',         count: assignedCentres.length + ' Centres', color: '#8b5cf6' },
              { key: 'evaluation', icon: Award,         label: 'Marks',           count: 'Attendance',        color: '#f59e0b' },
              { key: 'remittance', icon: CreditCard,    label: 'Fee Remittance',  count: `₹${totalVerifiedWage.toLocaleString('en-IN')}`, color: '#10b981' },
              { key: 'newcentre',  icon: Building,      label: 'New Centre',      count: 'Register',          color: '#6366f1' },
            ].map(({ key, icon: Icon, label, count, color }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  background: 'white',
                  border: `1.5px solid ${color}22`,
                  borderRadius: '12px',
                  padding: '1rem 0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={e => e.currentTarget.style.boxShadow = `0 4px 12px ${color}30`}
                onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
              >
                <div style={{ background: `${color}15`, width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>{label}</div>
                  <div style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{count}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'classes' && <RPClassLogger />}
      {activeTab === 'students' && (
        <RPCentreStudents
          onNavigateToNewCentre={() => setActiveTab('newcentre')}
          onNavigateToEvaluation={() => setActiveTab('evaluation')}
        />
      )}
      {activeTab === 'evaluation' && <RPAcademicEvaluation />}
      {activeTab === 'remittance' && <RPFeeRemittance />}
      {activeTab === 'newcentre' && <RPNewCentreForm onCentreCreated={() => setActiveTab('students')} />}

      {/* ═══════════════════════════════════════════
          MOBILE BOTTOM NAV BAR
          Shown only on screens ≤ 768px via CSS
      ═══════════════════════════════════════════ */}
      <nav className="rp-bottom-nav" aria-label="Portal navigation">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`rp-bottom-nav-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
            aria-label={label}
          >
            <Icon size={22} strokeWidth={activeTab === key ? 2.2 : 1.8} />
            <span className="rp-bottom-nav-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
