import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CoursesManager } from './CoursesManager';
import { CentresManager } from './CentresManager';
import { StudentsMasterDirectory } from './StudentsMasterDirectory';
import { RemunerationAudits } from './RemunerationAudits';
import { FinanceReconciliations } from './FinanceReconciliations';
import { EventCheckInDesk } from './EventCheckInDesk';
import { RPManager } from './RPManager';
import {
  LayoutDashboard,
  BookOpen,
  Building,
  UserCheck,
  DollarSign,
  CreditCard,
  QrCode,
  AlertCircle,
  GraduationCap,
  Users,
  MapPin,
  TrendingUp,
  ArrowRight,
  RotateCcw,
  Cloud,
  HelpCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const AdminDashboard = () => {
  const {
    courses,
    centres,
    enrollments,
    classLogs,
    remittances,
    resourcePersons,
    resetAllData,
    isCloudConnected,
    cloudError,
    syncAllLocalDataToCloud
  } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDbGuideModal, setShowDbGuideModal] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  // Pending counts
  const pendingCentres = centres.filter(c => c.status === 'PENDING_APPROVAL');
  const pendingLogs = classLogs.filter(l => l.status === 'SUBMITTED');
  const pendingRemittances = remittances.filter(r => r.status === 'PENDING_VERIFICATION');

  return (
    <div>
      {/* Sub Navigation Bar */}
      <div className="cpet-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen size={16} />
          <span>Course Builder</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'centres' ? 'active' : ''}`}
          onClick={() => setActiveTab('centres')}
        >
          <Building size={16} />
          <span>Mahallu Centres {pendingCentres.length > 0 && `(${pendingCentres.length})`}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <UserCheck size={16} />
          <span>Student Directory</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'remuneration' ? 'active' : ''}`}
          onClick={() => setActiveTab('remuneration')}
        >
          <DollarSign size={16} />
          <span>RP Wages & Logs {pendingLogs.length > 0 && `(${pendingLogs.length})`}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          <CreditCard size={16} />
          <span>Fee Remittance {pendingRemittances.length > 0 && `(${pendingRemittances.length})`}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'faculty' ? 'active' : ''}`}
          onClick={() => setActiveTab('faculty')}
        >
          <GraduationCap size={16} />
          <span>Faculty (RPs)</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'eventdesk' ? 'active' : ''}`}
          onClick={() => setActiveTab('eventdesk')}
        >
          <QrCode size={16} />
          <span>Gate Check-In</span>
        </button>
      </div>

      {/* Main Admin Tab Views */}
      {activeTab === 'overview' && (
        <div>
          {/* Cloud Database Status Banner */}
          <div style={{
            background: isCloudConnected ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${isCloudConnected ? '#bbf7d0' : '#fde68a'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Cloud size={20} style={{ color: isCloudConnected ? '#16a34a' : '#d97706' }} />
                <h4 style={{ margin: 0, fontWeight: 800, color: isCloudConnected ? '#166534' : '#92400e', fontSize: '1.05rem' }}>
                  {isCloudConnected ? 'MongoDB Cloud Database: Connected & Live' : 'MongoDB Cloud Database: Sync Attention Needed'}
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: isCloudConnected ? '#15803d' : '#b45309' }}>
                {isCloudConnected
                  ? 'All courses, Mahallu centres, and student records are securely synced across all public devices and phones.'
                  : (cloudError
                      ? `Issue: "${cloudError}". Any courses created are currently stored safely in this browser only. To publish them publicly, verify your Vercel credentials.`
                      : 'Connecting to MongoDB Atlas... If taking longer than usual, your Vercel database credentials may need verification.')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={syncAllLocalDataToCloud}
                style={{ background: isCloudConnected ? 'var(--cpet-primary)' : '#d97706' }}
              >
                <Cloud size={14} /> Sync Local Data to Cloud
              </button>
              {!isCloudConnected && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowDbGuideModal(true)}
                >
                  <HelpCircle size={14} /> How to Fix Credentials
                </button>
              )}
            </div>
          </div>

          {/* Action Banners */}
          {(pendingCentres.length > 0 || pendingLogs.length > 0 || pendingRemittances.length > 0) && (
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: 700, fontSize: '0.95rem' }}>
                <AlertCircle size={18} />
                <span>Pending Approvals Requiring Super Admin Action:</span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                {pendingCentres.length > 0 && (
                  <a
                    href="#centres"
                    onClick={(e) => { e.preventDefault(); setActiveTab('centres'); }}
                    style={{ color: '#b45309', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    • {pendingCentres.length} Mahallu Study Centre awaiting approval
                  </a>
                )}
                {pendingLogs.length > 0 && (
                  <a
                    href="#logs"
                    onClick={(e) => { e.preventDefault(); setActiveTab('remuneration'); }}
                    style={{ color: '#b45309', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    • {pendingLogs.length} RP Class Logs submitted for audit
                  </a>
                )}
                {pendingRemittances.length > 0 && (
                  <a
                    href="#finance"
                    onClick={(e) => { e.preventDefault(); setActiveTab('finance'); }}
                    style={{ color: '#b45309', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    • {pendingRemittances.length} Fee Remittances pending office receipt check
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Key Executive KPI Cards */}
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveTab('students')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <p>Total Student Enrollments</p>
                <h3>{enrollments.length}</h3>
                <span>Across all Kerala programs</span>
              </div>
              <div className="stat-icon" style={{ background: 'var(--cpet-accent-soft)', color: 'var(--cpet-accent)' }}>
                <Users size={22} />
              </div>
            </div>

            <div className="stat-card" onClick={() => setActiveTab('centres')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <p>Mahallu Study Centres</p>
                <h3>{centres.filter(c => c.status === 'ACTIVE').length}</h3>
                <span>{pendingCentres.length} pending review</span>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(50, 53, 126, 0.1)', color: 'var(--cpet-primary)' }}>
                <Building size={22} />
              </div>
            </div>

            <div className="stat-card" onClick={() => setActiveTab('courses')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <p>Active Programs & Courses</p>
                <h3>{courses.length}</h3>
                <span>Mahallu & General</span>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--cpet-success)' }}>
                <BookOpen size={22} />
              </div>
            </div>

            <div className="stat-card" onClick={() => setActiveTab('remuneration')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <p>Resource Persons (Teachers)</p>
                <h3>{resourcePersons.length}</h3>
                <span>Active teaching faculty</span>
              </div>
              <div className="stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                <GraduationCap size={22} />
              </div>
            </div>
          </div>

          {/* Quick Hub Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
            <div className="cpet-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cpet-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={18} /> Mahallu-Based System
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5 }}>
                Localized weekend classes conducted at Mahallu committees across districts. Track travelling Resource Persons, student rosters, weekly class logs, and fee remissions.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('centres')}>
                  Manage Centres
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('remuneration')}>
                  Audit Wages
                </button>
              </div>
            </div>

            <div className="cpet-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cpet-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} /> General Online & Offline Programs
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5 }}>
                Manage diplomas, residential leadership camps, and 1-day workshops with the dynamic intake question builder ("Google Form Killer") and on-desk gate check-in.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('courses')}>
                  Course Builder
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('eventdesk')}>
                  Gate Check-In Mode
                </button>
              </div>
            </div>

            <div className="cpet-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cpet-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} /> Unified Student 360° Archive
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5 }}>
                Look up any student by phone or name to see their complete lifetime journey with CPET across all courses, certificates, marks, and family members.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('students')}>
                Open Student Directory
              </button>
            </div>
          </div>

          {/* Production Database Initialization Banner */}
          <div style={{ marginTop: '1.5rem', background: '#f8fafc', border: '1px solid var(--cpet-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ color: 'var(--cpet-primary)', margin: 0, fontWeight: 700 }}>Production Data Initialization</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '3px 0 0' }}>
                Wipe all test records across MongoDB and start completely fresh for official CPET operations.
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ color: '#dc2626' }}
              disabled={isWiping}
              onClick={async () => {
                if (window.confirm('Are you sure you want to wipe all records from MongoDB and start completely fresh? This will delete all records across all devices and cannot be undone.')) {
                  setIsWiping(true);
                  try {
                    await resetAllData();
                  } finally {
                    setIsWiping(false);
                  }
                }
              }}
            >
              <RotateCcw size={14} className={isWiping ? 'spin' : ''} /> {isWiping ? 'Wiping All Records...' : 'Wipe All Test Records'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'courses' && <CoursesManager />}
      {activeTab === 'centres' && <CentresManager />}
      {activeTab === 'students' && <StudentsMasterDirectory />}
      {activeTab === 'remuneration' && <RemunerationAudits />}
      {activeTab === 'finance' && <FinanceReconciliations />}
      {activeTab === 'faculty' && <RPManager />}
      {activeTab === 'eventdesk' && <EventCheckInDesk />}

      {/* Database Credentials Fix Modal */}
      {showDbGuideModal && (
        <div className="modal-overlay" onClick={() => setShowDbGuideModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cloud size={20} style={{ color: 'var(--cpet-accent)' }} />
                <h3>Fix MongoDB Cloud Connection in 3 Steps</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDbGuideModal(false)}>✕</button>
            </div>

            <div style={{ padding: '1.25rem', fontSize: '0.88rem', lineHeight: 1.6, color: '#334155' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--cpet-primary)' }}>
                  Current Status: <span style={{ color: '#dc2626' }}>{cloudError || 'Authentication Failed'}</span>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  This happens when the MongoDB Atlas Database User password does not match or contains special characters like <code>@</code> or <code>#</code>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderLeft: '3px solid var(--cpet-accent)', paddingLeft: '0.75rem' }}>
                  <strong style={{ display: 'block', color: 'var(--cpet-primary)' }}>1. Check Database User in MongoDB Atlas</strong>
                  <span>Go to <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" style={{ color: 'var(--cpet-accent)', textDecoration: 'underline' }}>MongoDB Atlas</a> → Click <strong>Database Access</strong> on left sidebar. Ensure a user exists (e.g. <code>cpet_admin</code>), click <strong>Edit</strong> → set password (e.g. <code>CPETportal2026</code>) and ensure role is "Read and write to any database".</span>
                </div>

                <div style={{ borderLeft: '3px solid var(--cpet-accent)', paddingLeft: '0.75rem' }}>
                  <strong style={{ display: 'block', color: 'var(--cpet-primary)' }}>2. Update MONGODB_URI in Vercel</strong>
                  <span>Go to <a href="https://vercel.com" target="_blank" rel="noreferrer" style={{ color: 'var(--cpet-accent)', textDecoration: 'underline' }}>Vercel</a> → Project <strong>cpet-courses-portal</strong> → <strong>Settings</strong> → <strong>Environment Variables</strong>. Edit <code>MONGODB_URI</code> to:</span>
                  <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', overflowX: 'auto', margin: '6px 0 0' }}>
mongodb+srv://YOUR_USER:YOUR_PASSWORD@cpet-portal.fw7o9tr.mongodb.net/cpet_prod?retryWrites=true&w=majority&appName=CPET-Portal
                  </pre>
                </div>

                <div style={{ borderLeft: '3px solid var(--cpet-accent)', paddingLeft: '0.75rem' }}>
                  <strong style={{ display: 'block', color: 'var(--cpet-primary)' }}>3. Redeploy in Vercel & Sync Data</strong>
                  <span>In Vercel, go to <strong>Deployments</strong> → Click the three dots (<code>...</code>) on the latest deployment → Click <strong>Redeploy</strong>. Once finished, refresh this page and click <strong>Sync Local Data to Cloud</strong> above!</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowDbGuideModal(false)}>
                Got it, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
