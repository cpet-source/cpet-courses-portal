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
  Link,
  Plus,
  RotateCcw,
  X,
  Phone,
  Copy,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import { StudentBulkImporterModal } from './StudentBulkImporterModal';

export const EventCheckInDesk = () => {
  const {
    courses,
    enrollments,
    checkInStudentAtGate,
    undoGateCheckIn,
    registerOrEnrollStudent,
    showToast
  } = useApp();

  const generalCourses = courses.filter(c => c.category !== 'MAHALLU');
  const [selectedCourseId, setSelectedCourseId] = useState(generalCourses[0]?.id || courses[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'YET_TO_ARRIVE' | 'CHECKED_IN'

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

  const activeCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const courseEnrollments = enrollments.filter(e => e.course_id === selectedCourseId);

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

  // Initialize card inputs
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

  const filteredApplicants = courseEnrollments.filter(e => {
    const isCheckedIn = (e.classes_attended || 0) > 0 || e.completion_status === 'COMPLETED';

    if (filterTab === 'YET_TO_ARRIVE' && isCheckedIn) return false;
    if (filterTab === 'CHECKED_IN' && !isCheckedIn) return false;

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

  const copyVolunteerLink = () => {
    const gateTarget = activeCourse?.slug || activeCourse?.course_code?.toLowerCase() || activeCourse?.id;
    const url = `${window.location.origin}/?gate=${gateTarget}`;
    navigator.clipboard.writeText(url);
    showToast('Volunteer Gate Desk link copied! Share this with your student volunteers via WhatsApp.');
  };

  return (
    <div>
      <div className="cpet-card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 className="cpet-card-title">
            <UserCheck size={22} />
            On-Desk Event Gate Check-In Mode
          </h2>
          <p className="cpet-card-desc">
            Entrance check-in manager for workshops, camps, and offline seminars.
          </p>
        </div>
      </div>

      {/* Share with Volunteers Banner */}
      {activeCourse && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>STUDENT VOLUNTEER LINK</span>
              <strong style={{ fontSize: '0.88rem', color: '#166534' }}>{activeCourse.title}</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563' }}>
              Volunteers can open this link on their mobile devices to check-in candidates at the entrance without needing Super Admin credentials.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ background: 'white', borderColor: '#86efac', color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={copyVolunteerLink}
            >
              <Copy size={14} /> Copy Volunteer Link
            </button>
            <a
              href={`/?gate=${activeCourse.slug || activeCourse.course_code?.toLowerCase() || activeCourse.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ background: 'white', borderColor: '#86efac', color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <ExternalLink size={13} /> Test View
            </a>
          </div>
        </div>
      )}

      {/* Event Selector & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <label className="form-label" style={{ marginBottom: '4px' }}>Select Active Event / Program:</label>
          <select
            className="form-select"
            style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.category.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px' }}
            onClick={() => setShowImportModal(true)}
            title="Import student admissions from Excel or Google Form into this course"
          >
            <FileSpreadsheet size={16} color="#16a34a" />
            <span>Import from Excel</span>
          </button>

          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px' }}
            onClick={() => setShowSpotModal(true)}
          >
            <Plus size={16} />
            <span>Spot Walk-In Candidate</span>
          </button>
        </div>
      </div>

      {/* Live Gate Counter Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <p>Total Pre-Registered</p>
            <h3>{totalRegistered}</h3>
            <span>Online applicants</span>
          </div>
          <div className="stat-icon">
            <Users size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Checked-In at Gate</p>
            <h3 style={{ color: 'var(--cpet-success)' }}>{checkedInCount}</h3>
            <span>{turnoutPercentage}% turn-out</span>
          </div>
          <div className="stat-icon" style={{ background: 'var(--cpet-success-soft)', color: 'var(--cpet-success)' }}>
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Accompanying Guests</p>
            <h3 style={{ color: '#0284c7' }}>{totalCompanions}</h3>
            <span>Companions / Parents</span>
          </div>
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <UserCheck size={20} />
          </div>
        </div>

        {activeCourse?.standard_fee > 0 && activeCourse?.payment_policy !== 'PAY_AT_REGISTRATION' && (
          <div className="stat-card">
            <div className="stat-info">
              <p>Gate Fees Collected</p>
              <h3>₹{feesCollectedHere.toLocaleString('en-IN')}</h3>
              <span>Cash / Spot UPI</span>
            </div>
            <div className="stat-icon" style={{ background: 'var(--cpet-accent-soft)', color: 'var(--cpet-accent)' }}>
              <DollarSign size={20} />
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="cpet-tabs" style={{ margin: 0 }}>
          <button
            className={`tab-btn ${filterTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterTab('ALL')}
          >
            <span>All ({totalRegistered})</span>
          </button>
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
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
            placeholder="Search candidate or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Candidate Cards List */}
      <div className="mobile-card-list">
        {filteredApplicants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', color: '#64748b' }}>
            No registered students found matching your criteria.
          </div>
        ) : (
          filteredApplicants.map(applicant => {
            const hasCheckedIn = (applicant.classes_attended || 0) > 0 || applicant.completion_status === 'COMPLETED';
            const inputs = cardInputs[applicant.id] || { companions: 0, remarks: '', collectFee: false };

            const isPayAtRegistration = activeCourse?.payment_policy === 'PAY_AT_REGISTRATION';
            const isFree = activeCourse?.payment_policy === 'FREE_COURSE';
            const isFeePaid = isFree || isPayAtRegistration || applicant.fee_status === 'OFFICE_CONFIRMED' || applicant.fee_status === 'PAID_ON_SPOT' || applicant.fee_status === 'PAID_TO_RP';
            const standardFee = activeCourse?.standard_fee || 0;

            return (
              <div
                key={applicant.id}
                className="mobile-data-card"
                style={{
                  borderLeft: hasCheckedIn ? '5px solid var(--cpet-success)' : '5px solid var(--cpet-border)',
                  background: hasCheckedIn ? '#f0fdf4' : 'white',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.75rem',
                  padding: '1rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <div className="card-top">
                  <div>
                    <h4 className="card-title" style={{ fontSize: '1.05rem', margin: '0 0 2px' }}>
                      {applicant.student_name}
                    </h4>
                    <p className="card-subtitle" style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      📱 +91 {applicant.account_phone} | Adm: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--cpet-primary)' }}>{applicant.admission_number}</span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className={`badge ${hasCheckedIn ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.72rem' }}>
                      {hasCheckedIn ? '✓ ATTENDED' : 'YET TO ARRIVE'}
                    </span>

                    {/* Payment Badge */}
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
                        ⏳ Fee Due: ₹{standardFee}
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Responses */}
                {applicant.custom_responses && Object.keys(applicant.custom_responses).length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', margin: '0.4rem 0', border: '1px solid #edf2f7' }}>
                    {Object.entries(applicant.custom_responses).map(([k, v]) => (
                      <span key={k} style={{ display: 'inline-block', marginRight: '0.85rem', color: '#475569' }}>
                        <strong style={{ color: 'var(--cpet-primary)' }}>{k}:</strong> {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Already Checked-In View */}
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
                  /* Check-In Inputs & Action */
                  <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9' }}>
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

                      {/* Remarks input */}
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

                    {/* Spot Fee Checkbox (only if due) */}
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

                    <button
                      type="button"
                      className="btn btn-success"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.55rem', fontWeight: 700 }}
                      onClick={() => handleGateCheckIn(applicant)}
                    >
                      <CheckCircle size={16} />
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

      {/* Bulk Student & Google Form Importer Modal */}
      <StudentBulkImporterModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        initialCourseId={selectedCourseId}
      />
    </div>
  );
};
