import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Download, MessageCircle, Eye, CheckCircle, Clock, AlertCircle, Filter, UserCheck, Calendar } from 'lucide-react';

export const StudentsMasterDirectory = () => {
  const { students, enrollments, courses, centres, updateStudentFee, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [selectedFeeFilter, setSelectedFeeFilter] = useState('ALL');
  const [selectedStudentFor360, setSelectedStudentFor360] = useState(null);

  // Filter enrollments
  const filteredEnrollments = enrollments.filter(enr => {
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = enr.student_name.toLowerCase().includes(term);
      const matchPhone = enr.account_phone.includes(term);
      const matchAdm = enr.admission_number.toLowerCase().includes(term);
      if (!matchName && !matchPhone && !matchAdm) return false;
    }
    // Course
    if (selectedCourseFilter !== 'ALL' && enr.course_id !== selectedCourseFilter) {
      return false;
    }
    // Fee Status
    if (selectedFeeFilter !== 'ALL') {
      if (selectedFeeFilter === 'PAID' && enr.fee_status !== 'OFFICE_CONFIRMED' && enr.fee_status !== 'PAID_TO_RP' && enr.fee_status !== 'PAID_ON_SPOT' && enr.fee_status !== 'FREE') return false;
      if (selectedFeeFilter === 'PENDING' && (enr.fee_status === 'OFFICE_CONFIRMED' || enr.fee_status === 'FREE')) return false;
    }
    return true;
  });

  // Export to CSV (The Google Sheets replacement)
  const handleExportCSV = () => {
    if (filteredEnrollments.length === 0) {
      showToast('No records to export', 'warning');
      return;
    }

    const headers = [
      'Admission No',
      'Student Name',
      'Phone Number',
      'Course Title',
      'Centre / Venue',
      'Enrollment Date',
      'Fee Status',
      'Amount Paid (INR)',
      'Classes Attended',
      'Completion Status',
      'Custom Intake Answers'
    ];

    const rows = filteredEnrollments.map(e => [
      `"${e.admission_number}"`,
      `"${e.student_name}"`,
      `"${e.account_phone}"`,
      `"${e.course_title}"`,
      `"${e.centre_name || 'N/A'}"`,
      `"${e.enrollment_date}"`,
      `"${e.fee_status}"`,
      e.amount_paid,
      e.classes_attended || 0,
      `"${e.completion_status}"`,
      `"${JSON.stringify(e.custom_responses || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CPET_Students_Master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported student directory to CSV spreadsheet!');
  };

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h2 className="cpet-card-title">
            <UserCheck size={22} />
            Universal Student Master Directory ("Google Sheets Killer")
          </h2>
          <p className="cpet-card-desc">
            Single institutional database of every student across all Mahallu centres, diplomas, workshops, and camps.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleExportCSV}>
          <Download size={16} />
          Export to Excel (CSV)
        </button>
      </div>

      {/* Live Search & Filter Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by Name, Mobile (10-digits), or Adm No..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            className="form-select"
            value={selectedCourseFilter}
            onChange={e => setSelectedCourseFilter(e.target.value)}
          >
            <option value="ALL">All Programs & Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            className="form-select"
            value={selectedFeeFilter}
            onChange={e => setSelectedFeeFilter(e.target.value)}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Confirmed / Paid Only</option>
            <option value="PENDING">Pending Payment / Verification</option>
          </select>
        </div>
      </div>

      {/* Results Count & Summary Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--cpet-text-muted)' }}>
        <span>Showing <strong>{filteredEnrollments.length}</strong> student enrollments</span>
        <span>Registered Mobile Accounts: <strong>{students.length}</strong></span>
      </div>

      {/* Desktop Responsive Table */}
      <div className="table-responsive">
        <table className="cpet-table">
          <thead>
            <tr>
              <th>Adm. No</th>
              <th>Student & Contact</th>
              <th>Course / Program</th>
              <th>Centre / Venue</th>
              <th>Fee Status</th>
              <th>Evaluation</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No students found matching current search and filters.
                </td>
              </tr>
            ) : (
              filteredEnrollments.map(enr => {
                const targetCourse = courses.find(c => c.id === enr.course_id);
                const isPaid = enr.fee_status === 'OFFICE_CONFIRMED' || enr.fee_status === 'PAID_TO_RP' || enr.fee_status === 'PAID_ON_SPOT' || enr.fee_status === 'FREE';

                return (
                  <tr key={enr.id}>
                    <td>
                      <span className="badge badge-neutral" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {enr.admission_number}
                      </span>
                    </td>
                    <td>
                      <strong style={{ display: 'block', color: 'var(--cpet-primary)', fontSize: '0.92rem' }}>
                        {enr.student_name}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--cpet-text-muted)' }}>
                        📱 {enr.account_phone}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.88rem' }}>{enr.course_title}</strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                        Enrolled: {enr.enrollment_date}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{enr.centre_name || 'Central Campus'}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        enr.fee_status === 'OFFICE_CONFIRMED' || enr.fee_status === 'FREE' ? 'badge-success' :
                        enr.fee_status === 'PAID_TO_RP' || enr.fee_status === 'PAID_ON_SPOT' ? 'badge-primary' : 'badge-warning'
                      }`}>
                        {enr.fee_status.replace(/_/g, ' ')}
                      </span>
                      {enr.amount_paid > 0 && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          ₹{enr.amount_paid}
                        </span>
                      )}
                    </td>
                    <td>
                      {targetCourse?.evaluation_type === 'EXAM_ONLY' && (
                        <span style={{ fontSize: '0.8rem' }}>
                          {Object.keys(enr.marks || {}).length > 0
                            ? `Marks: ${Object.values(enr.marks).join(', ')}`
                            : 'Pending Exam'}
                        </span>
                      )}
                      {targetCourse?.evaluation_type === 'ATTENDANCE_ONLY' && (
                        <span style={{ fontSize: '0.8rem' }}>
                          {enr.classes_attended || 0} / {targetCourse.total_planned_classes} Classes
                        </span>
                      )}
                      {targetCourse?.evaluation_type === 'HYBRID' && (
                        <span style={{ fontSize: '0.8rem' }}>
                          {enr.classes_attended || 0} cls / {Object.keys(enr.marks || {}).length} exams
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        {/* WhatsApp Trigger */}
                        <a
                          href={`https://wa.me/91${enr.account_phone}?text=${encodeURIComponent(
                            `Assalamu Alaikum ${enr.student_name},\nRegarding your enrollment at CPET (${enr.course_title}) with Admission No: ${enr.admission_number}.\n\nCenter for Public Education and Training — DHIU`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#16a34a' }}
                          title="Open WhatsApp Chat"
                        >
                          <MessageCircle size={14} />
                        </a>

                        {/* View 360° Profile */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedStudentFor360(enr)}
                          title="View 360° Lifetime Student Profile"
                        >
                          <Eye size={14} />
                          <span className="hide-on-mobile">360° View</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Student 360° Lifetime Profile Drawer / Modal */}
      {selectedStudentFor360 && (
        <div className="modal-overlay" onClick={() => setSelectedStudentFor360(null)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Student 360° Lifetime Profile</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--cpet-text-muted)', margin: 0 }}>
                  CPET Lifetime Learning & Institutional Record
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedStudentFor360(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Identity Header */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cpet-primary)' }}>
                      {selectedStudentFor360.student_name}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Registered Mobile: <strong>+91 {selectedStudentFor360.account_phone}</strong>
                    </p>
                  </div>
                  <span className="badge badge-primary">
                    {selectedStudentFor360.admission_number}
                  </span>
                </div>
              </div>

              {/* All Courses Attended by this Phone Number */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--cpet-primary)', marginBottom: '0.75rem' }}>
                Lifetime Course History Under This Phone:
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {enrollments
                  .filter(e => e.account_phone === selectedStudentFor360.account_phone)
                  .map(enrItem => (
                    <div key={enrItem.id} style={{ background: 'white', border: '1px solid var(--cpet-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                        <div>
                          <strong style={{ color: 'var(--cpet-primary)' }}>{enrItem.course_title}</strong>
                          <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b' }}>
                            Student: {enrItem.student_name} | Adm: {enrItem.admission_number}
                          </span>
                        </div>
                        <span className={`badge ${enrItem.completion_status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
                          {enrItem.completion_status.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#475569', marginTop: '0.4rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem' }}>
                        <span>Venue/Centre: <strong>{enrItem.centre_name}</strong></span>
                        <span>Fee: <strong>{enrItem.fee_status.replace(/_/g, ' ')}</strong></span>
                        <span>Attended: <strong>{enrItem.classes_attended || 0} classes</strong></span>
                      </div>

                      {/* Custom intake responses */}
                      {enrItem.custom_responses && Object.keys(enrItem.custom_responses).length > 0 && (
                        <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--cpet-accent)' }}>Intake Form Responses:</span>
                          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.2rem' }}>
                            {Object.entries(enrItem.custom_responses).map(([k, v]) => (
                              <li key={k}>
                                <strong>{k}:</strong> {Array.isArray(v) ? v.join(', ') : String(v)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Office Fee Reconciliation Control */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--cpet-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Office Payment Status Override:
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => {
                      updateStudentFee(selectedStudentFor360.id, 'OFFICE_CONFIRMED', selectedStudentFor360.amount_paid);
                      setSelectedStudentFor360(null);
                    }}
                  >
                    <CheckCircle size={14} /> Confirm Office Payment
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      updateStudentFee(selectedStudentFor360.id, 'PAID_TO_RP', selectedStudentFor360.amount_paid);
                      setSelectedStudentFor360(null);
                    }}
                  >
                    Mark Paid to RP
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedStudentFor360(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
