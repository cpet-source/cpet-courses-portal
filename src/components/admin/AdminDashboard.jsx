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
  ArrowRight
} from 'lucide-react';

export const AdminDashboard = () => {
  const { courses, centres, enrollments, classLogs, remittances, resourcePersons } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

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
        </div>
      )}

      {activeTab === 'courses' && <CoursesManager />}
      {activeTab === 'centres' && <CentresManager />}
      {activeTab === 'students' && <StudentsMasterDirectory />}
      {activeTab === 'remuneration' && <RemunerationAudits />}
      {activeTab === 'finance' && <FinanceReconciliations />}
      {activeTab === 'faculty' && <RPManager />}
      {activeTab === 'eventdesk' && <EventCheckInDesk />}
    </div>
  );
};
