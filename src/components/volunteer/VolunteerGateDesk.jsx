import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';

export const VolunteerGateDesk = ({ onExit }) => {
  const {
    courses,
    enrollments,
    volunteerCourseTarget,
    checkInStudentAtGate,
    undoGateCheckIn,
    registerOrEnrollStudent,
    setActiveRole,
    showToast
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

  // Per-card local gate input state: { [enrollmentId]: { companions: 0, remarks: '', collectFee: boolean } }
  const [cardInputs, setCardInputs] = useState({});

  // Spot Walk-In Registration Modal state
  const [showSpotModal, setShowSpotModal] = useState(false);
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

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      setActiveRole('student');
    }
    if (window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

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

        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          onClick={() => setShowSpotModal(true)}
        >
          <Plus size={16} />
          <span>Spot Walk-In Candidate</span>
        </button>
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

      {/* Candidate Cards List */}
      <div className="mobile-card-list">
        {filteredApplicants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', color: '#64748b' }}>
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
                className="mobile-data-card"
                style={{
                  borderLeft: hasCheckedIn ? '5px solid #22c55e' : '5px solid #cbd5e1',
                  background: hasCheckedIn ? '#f0fdf4' : 'white',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.75rem',
                  padding: '1rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--cpet-primary)', margin: '0 0 2px' }}>
                      {applicant.student_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Phone size={12} /> +91 {applicant.account_phone}
                      </span>
                      <span>•</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--cpet-primary)' }}>
                        {applicant.admission_number}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {hasCheckedIn ? (
                      <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        ✓ ATTENDED
                      </span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                        YET TO ARRIVE
                      </span>
                    )}

                    {/* Payment Status Badge */}
                    {isPayAtRegistration ? (
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        ✓ Paid Online
                      </span>
                    ) : isFree ? (
                      <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                        Free Entry
                      </span>
                    ) : isFeePaid ? (
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        ✓ Paid ₹{applicant.amount_paid || standardFee}
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#92400e' }}>
                        ⏳ Gate Fee Due: ₹{standardFee}
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Intake Responses (e.g. food preference, accommodation, size) */}
                {applicant.custom_responses && Object.keys(applicant.custom_responses).length > 0 && (
                  <div style={{ background: hasCheckedIn ? '#ffffff' : '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', margin: '0.4rem 0', border: '1px solid #e2e8f0' }}>
                    {Object.entries(applicant.custom_responses).map(([k, v]) => (
                      <span key={k} style={{ display: 'inline-block', marginRight: '0.85rem', color: '#475569' }}>
                        <strong style={{ color: 'var(--cpet-primary)' }}>{k}:</strong> {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Already Checked In Details strip */}
                {hasCheckedIn ? (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #dcfce7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem', color: '#166534' }}>
                    <div>
                      <span>Checked-in: {applicant.gate_checked_in_at ? new Date(applicant.gate_checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Arrived'}</span>
                      {Number(applicant.gate_companions_count) > 0 && (
                        <strong style={{ marginLeft: '8px', color: '#0369a1' }}>
                          (+{applicant.gate_companions_count} Guests)
                        </strong>
                      )}
                      {applicant.gate_remarks && (
                        <span style={{ display: 'block', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                          Note: "{applicant.gate_remarks}"
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={() => handleUndoCheckIn(applicant)}
                    >
                      <RotateCcw size={12} /> Undo
                    </button>
                  </div>
                ) : (
                  /* Check-In Action Form */
                  <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9' }}>
                    {/* Optional Inputs: Companions & Remarks & Spot Fee */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', marginBottom: '0.65rem' }}>
                      {/* Companions counter */}
                      <div style={{ background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Companions:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 700 }}
                            onClick={() => updateCardInput(applicant.id, 'companions', Math.max(0, (inputs.companions || 0) - 1))}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                            {inputs.companions || 0}
                          </span>
                          <button
                            type="button"
                            style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 700 }}
                            onClick={() => updateCardInput(applicant.id, 'companions', (inputs.companions || 0) + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Special Remarks Input */}
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem', height: '100%' }}
                          placeholder="Special remarks (optional)..."
                          value={inputs.remarks || ''}
                          onChange={e => updateCardInput(applicant.id, 'remarks', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Spot Fee Collection Checkbox (ONLY for PAY_ON_SPOT or PAY_AFTER_CONFIRMATION if fee is due) */}
                    {!isPayAtRegistration && !isFree && !isFeePaid && standardFee > 0 && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.4rem 0.65rem', borderRadius: '6px', marginBottom: '0.65rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(inputs.collectFee)}
                          onChange={e => updateCardInput(applicant.id, 'collectFee', e.target.checked)}
                        />
                        <span style={{ fontWeight: 600, color: '#92400e' }}>
                          Collect Entrance Fee: ₹{standardFee} (Cash / Spot UPI)
                        </span>
                      </label>
                    )}

                    {/* Check In Button */}
                    <button
                      type="button"
                      className="btn btn-success"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.55rem', fontWeight: 700, fontSize: '0.92rem' }}
                      onClick={() => handleGateCheckIn(applicant)}
                    >
                      <CheckCircle size={17} />
                      <span>Check-In Attended</span>
                    </button>
                  </div>
                )}
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
    </div>
  );
};
