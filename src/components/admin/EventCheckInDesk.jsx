import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserCheck, Search, CheckCircle, Clock, DollarSign, Users, Award, Shield } from 'lucide-react';

export const EventCheckInDesk = () => {
  const { courses, enrollments, markStudentAttendance, updateStudentFee, showToast } = useApp();
  
  // Default to first general/workshop/camp course
  const generalCourses = courses.filter(c => c.category !== 'MAHALLU');
  const [selectedCourseId, setSelectedCourseId] = useState(generalCourses[0]?.id || courses[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCourse = courses.find(c => c.id === selectedCourseId);
  const courseEnrollments = enrollments.filter(e => e.course_id === selectedCourseId);

  const filteredApplicants = courseEnrollments.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.student_name.toLowerCase().includes(q) || e.account_phone.includes(q) || e.admission_number.toLowerCase().includes(q);
  });

  const checkedInCount = courseEnrollments.filter(e => (e.classes_attended || 0) > 0 || e.completion_status === 'COMPLETED').length;
  const feesCollectedHere = courseEnrollments.filter(e => e.fee_status === 'PAID_ON_SPOT' || e.fee_status === 'OFFICE_CONFIRMED').reduce((s, e) => s + (e.amount_paid || 0), 0);

  const handleGateCheckIn = (enr) => {
    markStudentAttendance(enr.id);
    showToast(`Checked in: ${enr.student_name} (${enr.admission_number})`);
  };

  const handleCollectGateFee = (enr) => {
    const fee = activeCourse?.standard_fee || 0;
    updateStudentFee(enr.id, 'PAID_ON_SPOT', fee);
    showToast(`Collected ₹${fee} from ${enr.student_name} at entrance desk!`);
  };

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h2 className="cpet-card-title">
            <UserCheck size={22} />
            On-Desk Event Gate Check-In Mode
          </h2>
          <p className="cpet-card-desc">
            Ultra-fast mobile view for entrance desks at 1-day workshops, residential camps, and offline seminars.
          </p>
        </div>
      </div>

      {/* Course Switcher */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label className="form-label">Select Active Event / Program:</label>
        <select
          className="form-select"
          style={{ maxWidth: '450px', fontWeight: 700, color: 'var(--cpet-primary)' }}
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

      {/* Live Gate Counter Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <p>Total Pre-Registered</p>
            <h3>{courseEnrollments.length}</h3>
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
            <span>{courseEnrollments.length > 0 ? Math.round((checkedInCount / courseEnrollments.length) * 100) : 0}% turn-out</span>
          </div>
          <div className="stat-icon" style={{ background: 'var(--cpet-success-soft)', color: 'var(--cpet-success)' }}>
            <CheckCircle size={20} />
          </div>
        </div>

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
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: '2.5rem', fontSize: '1rem' }}
          placeholder="Type student name, 10-digit mobile, or Admission No..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Mobile-Friendly Gate Cards */}
      <div className="mobile-card-list">
        {filteredApplicants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', color: '#64748b' }}>
            No registered students found for this event matching search query.
          </div>
        ) : (
          filteredApplicants.map(applicant => {
            const hasCheckedIn = (applicant.classes_attended || 0) > 0 || applicant.completion_status === 'COMPLETED';
            const isFeePaid = applicant.fee_status === 'OFFICE_CONFIRMED' || applicant.fee_status === 'PAID_ON_SPOT' || applicant.fee_status === 'PAID_TO_RP' || applicant.fee_status === 'FREE';

            return (
              <div
                key={applicant.id}
                className="mobile-data-card"
                style={{
                  borderLeft: hasCheckedIn ? '5px solid var(--cpet-success)' : '5px solid var(--cpet-border)',
                  background: hasCheckedIn ? '#f0fdf4' : 'white'
                }}
              >
                <div className="card-top">
                  <div>
                    <h4 className="card-title" style={{ fontSize: '1.05rem' }}>{applicant.student_name}</h4>
                    <p className="card-subtitle">📱 {applicant.account_phone} | Adm: <span style={{ fontFamily: 'monospace' }}>{applicant.admission_number}</span></p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className={`badge ${hasCheckedIn ? 'badge-success' : 'badge-neutral'}`}>
                      {hasCheckedIn ? '✓ ATTENDED' : 'NOT ARRIVED'}
                    </span>
                    <span className={`badge ${isFeePaid ? 'badge-primary' : 'badge-warning'}`}>
                      {applicant.fee_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Custom Intake Answers snippet for event coordinators */}
                {applicant.custom_responses && Object.keys(applicant.custom_responses).length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', margin: '0.5rem 0', border: '1px solid #edf2f7' }}>
                    {Object.entries(applicant.custom_responses).map(([k, v]) => (
                      <span key={k} style={{ display: 'inline-block', marginRight: '1rem', color: '#475569' }}>
                        <strong>{k}:</strong> {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Gate Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                  {!hasCheckedIn ? (
                    <button
                      className="btn btn-success btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleGateCheckIn(applicant)}
                    >
                      <CheckCircle size={15} /> Check-In Attended
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, color: '#16a34a' }}
                      disabled
                    >
                      ✓ Already Checked-In
                    </button>
                  )}

                  {!isFeePaid && activeCourse?.standard_fee > 0 && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleCollectGateFee(applicant)}
                    >
                      <DollarSign size={14} /> Collect ₹{activeCourse.standard_fee}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
