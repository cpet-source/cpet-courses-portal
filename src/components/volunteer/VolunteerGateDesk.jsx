import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Shield,
  ArrowLeft,
  Plus,
  RotateCcw,
  AlertCircle,
  X,
  Phone,
  User,
  MessageSquare,
  Sparkles,
  FileSpreadsheet,
  Wifi,
  WifiOff,
  RefreshCw,
  Download
} from 'lucide-react';
import { StudentBulkImporterModal } from '../admin/StudentBulkImporterModal';

export const VolunteerGateDesk = ({ onExit }) => {
  const {
    courses,
    enrollments,
    volunteerCourseTarget,
    checkInStudentAtGate,
    undoGateCheckIn,
    registerOrEnrollStudent,
    setActiveRole,
    showToast,
    isOnline,
    pendingSyncCount,
    isSyncingQueue,
    flushOfflineSyncQueue
  } = useApp();

  // Find targeted course from deep-link or default to first active non-Mahallu or any course
  const generalCourses = courses.filter(c => c.category !== 'MAHALLU');
  const defaultCourse = courses.find(c =>
    (c.id && c.id.toLowerCase() === (volunteerCourseTarget || '').toLowerCase()) ||
    (c.slug && c.slug.toLowerCase() === (volunteerCourseTarget || '').toLowerCase()) ||
    (c.course_code && c.course_code.toLowerCase() === (volunteerCourseTarget || '').toLowerCase())
  ) || generalCourses[0] || courses[0];

  const [selectedCourseId, setSelectedCourseId] = useState(defaultCourse?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('YET_TO_ARRIVE'); // 'ALL' | 'YET_TO_ARRIVE' | 'CHECKED_IN'

  // Sync selectedCourseId when courses load from cloud/storage
  useEffect(() => {
    if (defaultCourse?.id && !selectedCourseId) {
      setSelectedCourseId(defaultCourse.id);
    }
  }, [defaultCourse?.id, selectedCourseId]);

  // Safe time formatter
  const formatCheckInTime = (iso) => {
    if (!iso) return 'Arrived';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return 'Arrived';
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Arrived';
    }
  };

  // Per-card local gate input state: { [enrollmentId]: { companions: 0, remarks: '', collectFee: boolean } }
  const [cardInputs, setCardInputs] = useState({});

  // Spot Walk-In Registration Modal state
  const [showSpotModal, setShowSpotModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [spotForm, setSpotForm] = useState({
    full_name: '',
    phone: '',
    gender: 'MALE',
    companions_count: 0,
    remarks: '',
    collect_fee: true
  });

  const activeCourse = courses.find(c => c.id === selectedCourseId) || defaultCourse;
  const courseEnrollments = enrollments.filter(e => e.course_id === activeCourse?.id);

  // Stats calculation
  const totalRegistered = courseEnrollments.length;
  const checkedInList = courseEnrollments.filter(e => (e.classes_attended || 0) > 0 || e.completion_status === 'COMPLETED');
  const checkedInCount = checkedInList.length;
  const pendingCount = totalRegistered - checkedInCount;
  const turnoutPercentage = totalRegistered > 0 ? Math.round((checkedInCount / totalRegistered) * 100) : 0;

  const totalCompanions = checkedInList.reduce((acc, e) => acc + (Number(e.gate_companions_count) || 0), 0);
  const feesCollectedHere = courseEnrollments
    .filter(e => e.fee_status === 'PAID_ON_SPOT')
    .reduce((s, e) => s + (e.amount_paid || 0), 0);

  // Initialize card inputs when enrollments change
  useEffect(() => {
    if (activeCourse) {
      setCardInputs(prev => {
        const next = { ...prev };
        courseEnrollments.forEach(e => {
          if (!next[e.id]) {
            const isFeeDue = (activeCourse.payment_policy === 'PAY_ON_SPOT' || activeCourse.payment_policy === 'PAY_AFTER_CONFIRMATION')
              && e.fee_status !== 'OFFICE_CONFIRMED'
              && e.fee_status !== 'PAID_ON_SPOT'
              && e.fee_status !== 'PAID_TO_RP'
              && e.fee_status !== 'FREE';

            next[e.id] = {
              companions: e.gate_companions_count || 0,
              remarks: e.gate_remarks || '',
              collectFee: isFeeDue
            };
          }
        });
        return next;
      });
    }
  }, [selectedCourseId, enrollments.length]);

  const updateCardInput = (enrId, field, val) => {
    setCardInputs(prev => ({
      ...prev,
      [enrId]: {
        ...(prev[enrId] || {}),
        [field]: val
      }
    }));
  };

  // Filtered applicants
  const filteredApplicants = courseEnrollments.filter(e => {
    const isCheckedIn = (e.classes_attended || 0) > 0 || e.completion_status === 'COMPLETED';

    // Tab filter
    if (filterTab === 'YET_TO_ARRIVE' && isCheckedIn) return false;
    if (filterTab === 'CHECKED_IN' && !isCheckedIn) return false;

    // Search query filter
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (e.student_name || '').toLowerCase().includes(q);
    const phoneMatch = (e.account_phone || '').includes(q);
    const admMatch = (e.admission_number || '').toLowerCase().includes(q);
    return nameMatch || phoneMatch || admMatch;
  });

  const handleGateCheckIn = (enr) => {
    const inputs = cardInputs[enr.id] || { companions: 0, remarks: '', collectFee: false };
    const standardFee = activeCourse?.standard_fee || 0;
    const shouldCollect = Boolean(inputs.collectFee) && standardFee > 0;

    checkInStudentAtGate(enr.id, {
      companionsCount: inputs.companions || 0,
      remarks: inputs.remarks || '',
      collectFee: shouldCollect,
      feeAmount: shouldCollect ? standardFee : (enr.amount_paid || 0)
    });
  };

  const handleUndoCheckIn = (enr) => {
    if (window.confirm(`Revert check-in for ${enr.student_name}?`)) {
      undoGateCheckIn(enr.id);
    }
  };

  // Spot Walk-In Registration Submit
  const handleSpotSubmit = (e) => {
    e.preventDefault();
    if (!spotForm.full_name.trim()) {
      showToast('Please enter candidate name', 'danger');
      return;
    }
    const cleanPhone = spotForm.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'danger');
      return;
    }

    const feeAmt = activeCourse?.standard_fee || 0;
    const isFree = activeCourse?.payment_policy === 'FREE_COURSE';
    const isFeePaid = isFree || (spotForm.collect_fee && feeAmt > 0);

    const newEnr = registerOrEnrollStudent({
      phone: cleanPhone,
      newMemberData: {
        full_name: spotForm.full_name.trim(),
        gender: spotForm.gender
      },
      courseId: activeCourse.id,
      feeStatus: isFree ? 'FREE' : (isFeePaid ? 'PAID_ON_SPOT' : 'PENDING'),
      amountPaid: isFeePaid && !isFree ? feeAmt : 0
    });

    if (newEnr) {
      // Auto check-in the spot attendee
      checkInStudentAtGate(newEnr.id, {
        companionsCount: Number(spotForm.companions_count) || 0,
        remarks: spotForm.remarks ? `[Walk-in] ${spotForm.remarks}` : '[Walk-in Registration]',
        collectFee: isFeePaid && !isFree,
        feeAmount: feeAmt
      });
      showToast(`Spot candidate ${spotForm.full_name} admitted & checked-in!`);
      setShowSpotModal(false);
      setSpotForm({
        full_name: '',
        phone: '',
        gender: 'MALE',
        companions_count: 0,
        remarks: '',
        collect_fee: true
      });
    }
  };

  // Client-Side Offline Attendance Export to Excel (.xlsx)
  const handleExportAttendance = () => {
    try {
      const dataRows = courseEnrollments.map((e, idx) => ({
        'Sl No': idx + 1,
        'Admission No': e.admission_number || '',
        'Student Name': e.student_name || '',
        'Mobile Number': e.account_phone ? `+91 ${e.account_phone}` : '',
        'Check-In Status': ((e.classes_attended || 0) > 0 || e.completion_status === 'COMPLETED') ? 'ATTENDED' : 'YET TO ARRIVE',
        'Check-In Time': formatCheckInTime(e.gate_checked_in_at),
        'Companions / Guests': Number(e.gate_companions_count) || 0,
        'Fee Status': e.fee_status || '',
        'Amount Paid (₹)': e.amount_paid || 0,
        'Gate Remarks': e.gate_remarks || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Gate Attendance');
      const filename = `Gate_Attendance_${activeCourse?.course_code || 'Event'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      showToast('Attendance spreadsheet exported successfully!');
    } catch (err) {
      showToast('Failed to export Excel sheet: ' + err.message, 'danger');
    }
  };

  // Loading fallback while cloud data initializes
  if (courses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          width: '44px',
          height: '44px',
          border: '4px solid #e2e8f0',
          borderTopColor: 'var(--cpet-primary)',
          borderRadius: '50%',
          margin: '0 auto 1.5rem',
          animation: 'spin 1s linear infinite'
        }} />
        <h3 style={{ color: 'var(--cpet-primary)', marginBottom: '0.5rem' }}>Loading Gate Check-In Desk...</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Connecting to event candidate records...
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '0 0.5rem 3rem' }}>
      {/* Volunteer Gate Desk Top Header Bar */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cpet-primary) 0%, #1e1b4b 100%)',
        color: 'white',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1.25rem',
        boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge" style={{ background: '#22c55e', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                GATE VOLUNTEER DESK
              </span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.75rem' }}>
                {activeCourse?.course_code}
              </span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.2rem 0', color: 'white' }}>
              {activeCourse?.title || 'Event Check-In Desk'}
            </h1>
            <p style={{ fontSize: '0.82rem', opacity: 0.85, margin: 0 }}>
              Live Candidate Check-In & Gate Footfall Manager
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={handleExit}
              title="Return to Public Portal"
            >
              <ArrowLeft size={14} /> Exit Desk
            </button>
          </div>
        </div>

        {/* Event Selector (if multiple courses are available) */}
        {courses.length > 1 && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>Switch Event:</span>
            <select
              style={{
                fontSize: '0.82rem',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(0,0,0,0.25)',
                color: 'white',
                fontWeight: 600,
                maxWidth: '380px'
              }}
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id} style={{ color: '#0f172a', background: 'white' }}>
                  {c.title} ({c.course_code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Live Network & Offline Sync Status Strip */}
        <div style={{
          marginTop: '1rem',
          padding: '0.45rem 0.85rem',
          borderRadius: '8px',
          background: !isOnline
            ? 'rgba(245, 158, 11, 0.22)'
            : pendingSyncCount > 0
              ? 'rgba(234, 179, 8, 0.22)'
              : 'rgba(34, 197, 94, 0.22)',
          border: !isOnline
            ? '1px solid rgba(245, 158, 11, 0.45)'
            : pendingSyncCount > 0
              ? '1px solid rgba(234, 179, 8, 0.45)'
              : '1px solid rgba(34, 197, 94, 0.45)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
            {!isOnline ? (
              <>
                <WifiOff size={15} color="#fbbf24" />
                <span style={{ fontWeight: 700, color: '#fef3c7' }}>
                  Offline Mode Active
                </span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' }}>
                  • {pendingSyncCount} check-in(s) stored safely on this device
                </span>
              </>
            ) : pendingSyncCount > 0 ? (
              <>
                <RefreshCw size={15} color="#fde047" className={isSyncingQueue ? 'spin' : ''} />
                <span style={{ fontWeight: 700, color: '#fef08a' }}>
                  {pendingSyncCount} check-in(s) waiting to sync
                </span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' }}>
                  • Internet reconnected
                </span>
              </>
            ) : (
              <>
                <Wifi size={15} color="#4ade80" />
                <span style={{ fontWeight: 700, color: '#bbf7d0' }}>
                  Online & Synced
                </span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' }}>
                  • Cloud database connected
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline && pendingSyncCount > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  background: '#facc15',
                  color: '#713f12',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '3px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                disabled={isSyncingQueue}
                onClick={() => flushOfflineSyncQueue()}
              >
                <RefreshCw size={12} className={isSyncingQueue ? 'spin' : ''} />
                {isSyncingQueue ? 'Syncing...' : 'Sync to Cloud Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Gate Counter Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.25rem'
      }}>
        <div className="stat-card" style={{ padding: '0.85rem 1rem' }}>
          <div className="stat-info">
            <p style={{ fontSize: '0.75rem' }}>Pre-Registered</p>
            <h3 style={{ fontSize: '1.4rem' }}>{totalRegistered}</h3>
            <span style={{ fontSize: '0.72rem' }}>Total online list</span>
          </div>
          <div className="stat-icon" style={{ width: '38px', height: '38px' }}>
            <Users size={18} />
          </div>
        </div>

        <div className="stat-card" style={{ padding: '0.85rem 1rem' }}>
          <div className="stat-info">
            <p style={{ fontSize: '0.75rem' }}>Checked-In at Gate</p>
            <h3 style={{ fontSize: '1.4rem', color: '#16a34a' }}>{checkedInCount}</h3>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#16a34a' }}>{turnoutPercentage}% Turnout</span>
          </div>
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a', width: '38px', height: '38px' }}>
            <CheckCircle size={18} />
          </div>
        </div>

        <div className="stat-card" style={{ padding: '0.85rem 1rem' }}>
          <div className="stat-info">
            <p style={{ fontSize: '0.75rem' }}>Accompanying Guests</p>
            <h3 style={{ fontSize: '1.4rem', color: '#0284c7' }}>{totalCompanions}</h3>
            <span style={{ fontSize: '0.72rem' }}>Parents / Companions</span>
          </div>
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7', width: '38px', height: '38px' }}>
            <UserCheck size={18} />
          </div>
        </div>

        {activeCourse?.standard_fee > 0 && activeCourse?.payment_policy !== 'PAY_AT_REGISTRATION' && (
          <div className="stat-card" style={{ padding: '0.85rem 1rem' }}>
            <div className="stat-info">
              <p style={{ fontSize: '0.75rem' }}>Gate Fees Collected</p>
              <h3 style={{ fontSize: '1.35rem', color: '#d97706' }}>₹{feesCollectedHere.toLocaleString('en-IN')}</h3>
              <span style={{ fontSize: '0.72rem' }}>Cash & Spot UPI</span>
            </div>
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706', width: '38px', height: '38px' }}>
              <DollarSign size={18} />
            </div>
          </div>
        )}
      </div>

      {/* Spot Registration CTA & Search Strip */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', fontSize: '0.95rem' }}
            placeholder="Search candidate name, mobile, admission no..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            onClick={handleExportAttendance}
            title="Download offline Excel sheet backup of current attendance"
          >
            <Download size={15} color="#0284c7" />
            <span>Export Attendance</span>
          </button>

          <button
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            onClick={() => setShowImportModal(true)}
            title="Import students from Google Forms or Excel into this course"
          >
            <FileSpreadsheet size={16} color="#16a34a" />
            <span>Import from Excel</span>
          </button>

          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            onClick={() => setShowSpotModal(true)}
          >
            <Plus size={16} />
            <span>Spot Walk-In Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="cpet-tabs" style={{ marginBottom: '1rem' }}>
        <button
          className={`tab-btn ${filterTab === 'YET_TO_ARRIVE' ? 'active' : ''}`}
          onClick={() => setFilterTab('YET_TO_ARRIVE')}
        >
          <span>Yet to Arrive ({pendingCount})</span>
        </button>
        <button
          className={`tab-btn ${filterTab === 'CHECKED_IN' ? 'active' : ''}`}
          onClick={() => setFilterTab('CHECKED_IN')}
        >
          <span>Checked-In ({checkedInCount})</span>
        </button>
        <button
          className={`tab-btn ${filterTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterTab('ALL')}
        >
          <span>All Candidates ({totalRegistered})</span>
        </button>
      </div>

      {/* Candidate Cards Grid (Portrait 4-in-a-row) */}
      <div className="gate-cards-portrait-grid">
        {filteredApplicants.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', color: '#64748b' }}>
            <UserCheck size={36} color="#94a3b8" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
            <h4 style={{ color: 'var(--cpet-primary)', margin: '0 0 0.25rem' }}>No candidates found</h4>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              {searchQuery ? `No matching candidates for "${searchQuery}"` : 'All candidates in this view have been processed.'}
            </p>
          </div>
        ) : (
          filteredApplicants.map(applicant => {
            const hasCheckedIn = (applicant.classes_attended || 0) > 0 || applicant.completion_status === 'COMPLETED';
            const inputs = cardInputs[applicant.id] || { companions: 0, remarks: '', collectFee: false };

            // Payment Badge Analysis
            const isPayAtRegistration = activeCourse?.payment_policy === 'PAY_AT_REGISTRATION';
            const isFree = activeCourse?.payment_policy === 'FREE_COURSE';
            const isFeePaid = isFree || isPayAtRegistration || applicant.fee_status === 'OFFICE_CONFIRMED' || applicant.fee_status === 'PAID_ON_SPOT' || applicant.fee_status === 'PAID_TO_RP';
            const standardFee = activeCourse?.standard_fee || 0;

            return (
              <div
                key={applicant.id}
                className={`gate-portrait-card ${hasCheckedIn ? 'checked-in' : ''}`}
              >
                {/* Top Section */}
                <div>
                  {/* Status Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <span className={`badge ${hasCheckedIn ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                      {hasCheckedIn ? '✓ ATTENDED' : 'YET TO ARRIVE'}
                    </span>

                    {/* Payment Badge */}
                    {isPayAtRegistration ? (
                      <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        ✓ Paid
                      </span>
                    ) : isFree ? (
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        Free
                      </span>
                    ) : isFeePaid ? (
                      <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        ✓ Paid ₹{applicant.amount_paid || standardFee}
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '2px 6px', background: '#fef3c7', color: '#92400e' }}>
                        ⏳ Due ₹{standardFee}
                      </span>
                    )}
                  </div>

                  {/* Student Name */}
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 3px', color: 'var(--cpet-primary)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                    {applicant.student_name}
                  </h4>

                  {/* Phone & Admission Number */}
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>📱 +91 {applicant.account_phone}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Adm: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--cpet-primary)' }}>{applicant.admission_number}</span>
                    </div>
                  </div>

                  {/* District / Place if available */}
                  {(applicant.district || applicant.place) && (
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '4px' }}>
                      📍 {applicant.district} {applicant.place ? `• ${applicant.place}` : ''}
                    </div>
                  )}

                  {/* Custom Responses preview */}
                  {applicant.custom_responses && Object.keys(applicant.custom_responses).length > 0 && (
                    <div style={{ background: hasCheckedIn ? 'white' : '#f8fafc', padding: '4px 6px', borderRadius: '4px', fontSize: '0.7rem', margin: '4px 0', border: '1px solid #edf2f7' }}>
                      {Object.entries(applicant.custom_responses).slice(0, 2).map(([k, v]) => (
                        <div key={k} style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong style={{ color: 'var(--cpet-primary)' }}>{k}:</strong> {Array.isArray(v) ? v.join(', ') : String(v)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Middle & Bottom Section */}
                <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                  {hasCheckedIn ? (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '6px' }}>
                        <div>🕒 {formatCheckInTime(applicant.gate_checked_in_at)}</div>
                        {Number(applicant.gate_companions_count) > 0 && (
                          <div style={{ color: '#0369a1', fontWeight: 700 }}>+{applicant.gate_companions_count} Guests</div>
                        )}
                        {applicant.gate_remarks && (
                          <div style={{ fontStyle: 'italic', color: '#475569', fontSize: '0.7rem' }}>"{applicant.gate_remarks}"</div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', fontSize: '0.72rem', padding: '0.25rem', color: '#dc2626', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        onClick={() => handleUndoCheckIn(applicant)}
                      >
                        <RotateCcw size={12} /> Undo Check-In
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Compact Companions & Remarks row */}
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                        <div style={{ background: '#f8fafc', padding: '2px 4px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }} title="Companions/Guests">
                          <button
                            type="button"
                            style={{ width: '18px', height: '18px', borderRadius: '3px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', padding: 0, lineHeight: 1 }}
                            onClick={() => updateCardInput(applicant.id, 'companions', Math.max(0, (inputs.companions || 0) - 1))}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>
                            {inputs.companions || 0}
                          </span>
                          <button
                            type="button"
                            style={{ width: '18px', height: '18px', borderRadius: '3px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', padding: 0, lineHeight: 1 }}
                            onClick={() => updateCardInput(applicant.id, 'companions', (inputs.companions || 0) + 1)}
                          >
                            +
                          </button>
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.72rem', padding: '2px 6px', flex: 1, minWidth: 0 }}
                          placeholder="Note..."
                          value={inputs.remarks || ''}
                          onChange={e => updateCardInput(applicant.id, 'remarks', e.target.value)}
                        />
                      </div>

                      {/* Spot Fee Checkbox (only if due) */}
                      {!isPayAtRegistration && !isFree && !isFeePaid && standardFee > 0 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 4px', borderRadius: '4px', marginBottom: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(inputs.collectFee)}
                            onChange={e => updateCardInput(applicant.id, 'collectFee', e.target.checked)}
                          />
                          <span style={{ fontWeight: 600, color: '#92400e' }}>Collect ₹{standardFee}</span>
                        </label>
                      )}

                      {/* Big Check-In Button */}
                      <button
                        type="button"
                        className="btn btn-success"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '0.45rem', fontWeight: 700, fontSize: '0.85rem' }}
                        onClick={() => handleGateCheckIn(applicant)}
                      >
                        <CheckCircle size={15} />
                        <span>Check-In</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Spot Walk-In Registration Modal */}
      {showSpotModal && (
        <div className="modal-overlay" onClick={() => setShowSpotModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '500px', width: '92%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--cpet-accent-soft)', color: 'var(--cpet-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--cpet-primary)', fontSize: '1.15rem' }}>Spot Walk-In Candidate</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Admit and check-in directly at venue entrance</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowSpotModal(false)}
                style={{ padding: '0.25rem 0.5rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSpotSubmit} style={{ padding: '1rem 0' }}>
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Candidate full name"
                  value={spotForm.full_name}
                  onChange={e => setSpotForm({ ...spotForm, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="10-digit mobile"
                  value={spotForm.phone}
                  onChange={e => setSpotForm({ ...spotForm, phone: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={spotForm.gender}
                    onChange={e => setSpotForm({ ...spotForm, gender: e.target.value })}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Companions (Guests)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={spotForm.companions_count}
                    onChange={e => setSpotForm({ ...spotForm, companions_count: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Gate Remarks (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Kit given, cash received"
                  value={spotForm.remarks}
                  onChange={e => setSpotForm({ ...spotForm, remarks: e.target.value })}
                />
              </div>

              {activeCourse?.standard_fee > 0 && activeCourse?.payment_policy !== 'FREE_COURSE' && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '0.65rem 0.85rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>
                    <input
                      type="checkbox"
                      checked={spotForm.collect_fee}
                      onChange={e => setSpotForm({ ...spotForm, collect_fee: e.target.checked })}
                    />
                    <span>Collect Spot Entrance Fee: ₹{activeCourse.standard_fee}</span>
                  </label>
                </div>
              )}

              <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSpotModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={16} />
                  <span>Admit & Check-In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Student & Google Form Importer Modal */}
      <StudentBulkImporterModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        initialCourseId={selectedCourseId}
      />
    </div>
  );
};
