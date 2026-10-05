import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RPClassLogger } from './RPClassLogger';
import { RPCentreStudents } from './RPCentreStudents';
import { RPFeeRemittance } from './RPFeeRemittance';
import { RPNewCentreForm } from './RPNewCentreForm';
import {
  GraduationCap,
  BookOpen,
  Users,
  CreditCard,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin
} from 'lucide-react';

export const RPDashboard = () => {
  const { currentRp, centres, classLogs, payouts } = useApp();
  const [activeTab, setActiveTab] = useState('classes');

  const assignedCentres = centres.filter(c => c.assigned_rp_id === currentRp.id);
  const rpLogs = classLogs.filter(l => l.rp_id === currentRp.id);

  // Financial statistics for current RP
  const verifiedLogs = rpLogs.filter(l => l.status === 'VERIFIED_BY_ADMIN');
  const pendingLogs = rpLogs.filter(l => l.status === 'SUBMITTED');
  const totalVerifiedWage = verifiedLogs.reduce((sum, l) => sum + (l.total_claim || 0), 0);
  const totalPendingWage = pendingLogs.reduce((sum, l) => sum + (l.total_claim || 0), 0);

  return (
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
              📱 {currentRp.phone} | {currentRp.qualification}
            </p>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
              Bank A/C: <strong>{currentRp.bank_account_details}</strong>
            </p>
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

      {/* RP Mobile-Friendly Navigation Tabs */}
      <div className="cpet-tabs" style={{ marginBottom: '1.25rem' }}>
        <button
          className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <BookOpen size={16} />
          <span>Class Logs ({rpLogs.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <GraduationCap size={16} />
          <span>Courses & Students</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'remittance' ? 'active' : ''}`}
          onClick={() => setActiveTab('remittance')}
        >
          <CreditCard size={16} />
          <span>Fee Remittance</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'newcentre' ? 'active' : ''}`}
          onClick={() => setActiveTab('newcentre')}
        >
          <Building size={16} />
          <span>New Study Centre</span>
        </button>
      </div>

      {/* Tab Views */}
      {activeTab === 'classes' && <RPClassLogger />}
      {activeTab === 'students' && (
        <RPCentreStudents onNavigateToNewCentre={() => setActiveTab('newcentre')} />
      )}
      {activeTab === 'remittance' && <RPFeeRemittance />}
      {activeTab === 'newcentre' && <RPNewCentreForm onCentreCreated={() => setActiveTab('students')} />}
    </div>
  );
};
