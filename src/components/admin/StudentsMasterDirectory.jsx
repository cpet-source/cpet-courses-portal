import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Download, MessageCircle, Eye, CheckCircle, Clock, AlertCircle, Filter, UserCheck, Calendar, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { KERALA_DISTRICTS } from '../../data/districts';

export const StudentsMasterDirectory = () => {
  const {
    students,
    enrollments,
    courses,
    centres,
    updateStudentFee,
    updateStudentProfile,
    deleteStudentEnrollment,
    deleteStudentCompletely,
    showToast,
    fetchLatestFromCloud
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [selectedFeeFilter, setSelectedFeeFilter] = useState('ALL');
  const [selectedStudentFor360, setSelectedStudentFor360] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Student Deletion State
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteScope, setDeleteScope] = useState('ALL'); // 'ALL' | 'THIS_COURSE_ONLY'
  const [isDeleting, setIsDeleting] = useState(false);

  // Student Edit State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    student_name: '',
    gender: '',
    date_of_birth: '',
    phone: '',
    place: '',
    district: 'Malappuram',
    student_profile_id: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEdit = (enr) => {
    const cleanPhone = (enr.account_phone || '').trim().replace(/\D/g, '').slice(-10);
    const account = students.find(s => (s.account_phone || '').trim().replace(/\D/g, '').slice(-10) === cleanPhone);
    const member = account?.members?.find(m => 
      (enr.student_profile_id && m.id === enr.student_profile_id) ||
      m.full_name?.toLowerCase() === (enr.student_name || '').toLowerCase()
    ) || account?.members?.[0];

    setEditingStudent(enr);
    setEditFormData({
      student_name: enr.student_name || member?.full_name || '',
      gender: enr.gender || member?.gender || '',
      date_of_birth: enr.date_of_birth || member?.date_of_birth || '',
      phone: cleanPhone,
      place: member?.place || '',
      district: member?.district || 'Malappuram',
      student_profile_id: enr.student_profile_id || member?.id || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    const finalName = editFormData.student_name?.trim() || editingStudent.student_name || 'Student';
    const cleanPhone = editFormData.phone ? editFormData.phone.trim().replace(/\D/g, '').slice(-10) : (editingStudent.account_phone || '').trim().replace(/\D/g, '').slice(-10);

    if (cleanPhone && cleanPhone.length !== 10) {
      showToast('If updating mobile number, please provide a valid 10-digit number', 'warning');
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateStudentProfile({
        enrollmentId: editingStudent.id,
        account_phone: editingStudent.account_phone,
        student_profile_id: editFormData.student_profile_id,
        full_name: finalName,
        gender: editFormData.gender || '',
        date_of_birth: editFormData.date_of_birth || '',
        place: (editFormData.place || '').trim(),
        district: editFormData.district,
        new_phone: cleanPhone || editingStudent.account_phone
      });
      setEditingStudent(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to update student profile', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };



  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLatestFromCloud();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Live student records synced from cloud!');
    }, 600);
  };

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

    const selectedCourse = selectedCourseFilter !== 'ALL' ? courses.find(c => c.id === selectedCourseFilter) : null;
    const customQuestions = selectedCourse?.custom_questions || [];

    const formatCustomResponses = (responses, courseId) => {
      if (!responses || typeof responses !== 'object') return '';
      const cObj = courses.find(c => c.id === courseId);
      return Object.entries(responses)
        .map(([k, v]) => {
          const qDef = cObj?.custom_questions?.find(q => q.id === k);
          const label = qDef ? qDef.label : k;
          const formattedVal = Array.isArray(v) ? v.join(', ') : String(v ?? '');
          return `${label}: ${formattedVal}`;
        })
        .join(' | ');
    };

    const headers = customQuestions.length > 0
      ? [
          'Admission No',
          'Student Name',
          'Phone Number',
          'Gender',
          'Date of Birth',
          'Course Title',
          'Centre / Venue',
          'Enrollment Date',
          'Fee Status',
          'Amount Paid (INR)',
          ...customQuestions.map(q => `"${(q.label || 'Question').replace(/"/g, '""')}"`),
          'Payment UTR / Ref',
          'Classes Attended',
          'Completion Status'
        ]
      : [
          'Admission No',
          'Student Name',
          'Phone Number',
          'Gender',
          'Date of Birth',
          'Course Title',
          'Centre / Venue',
          'Enrollment Date',
          'Fee Status',
          'Amount Paid (INR)',
          'Classes Attended',
          'Completion Status',
          'Custom Intake Answers'
        ];

    const rows = filteredEnrollments.map(e => {
      const cleanPhone = (e.account_phone || '').trim().replace(/\D/g, '').slice(-10);
      const account = students.find(s => (s.account_phone || '').trim().replace(/\D/g, '').slice(-10) === cleanPhone);
      const member = account?.members?.find(m => 
        (e.student_profile_id && m.id === e.student_profile_id) ||
        m.full_name?.toLowerCase() === (e.student_name || '').toLowerCase()
      ) || account?.members?.[0];
      const g = e.gender || member?.gender || '';
      const dob = e.date_of_birth || member?.date_of_birth || '';

      if (customQuestions.length > 0) {
        const qAnswers = customQuestions.map(q => {
          const val = e.custom_responses?.[q.id] !== undefined
            ? e.custom_responses[q.id]
            : (e.custom_responses?.[q.label] !== undefined ? e.custom_responses[q.label] : '');
          return `"${String(val || '').replace(/"/g, '""')}"`;
        });
        const utrVal = e.custom_responses?.['Payment UTR / Ref'] || '';

        return [
          `"${e.admission_number || ''}"`,
          `"${(e.student_name || '').replace(/"/g, '""')}"`,
          `"${e.account_phone || ''}"`,
          `"${g}"`,
          `"${dob}"`,
          `"${(e.course_title || '').replace(/"/g, '""')}"`,
          `"${(e.centre_name || 'N/A').replace(/"/g, '""')}"`,
          `"${e.enrollment_date || ''}"`,
          `"${e.fee_status || ''}"`,
          e.amount_paid || 0,
          ...qAnswers,
          `"${String(utrVal).replace(/"/g, '""')}"`,
          e.classes_attended || 0,
          `"${e.completion_status || ''}"`
        ];
      }

      return [
        `"${e.admission_number || ''}"`,
        `"${(e.student_name || '').replace(/"/g, '""')}"`,
        `"${e.account_phone || ''}"`,
        `"${g}"`,
        `"${dob}"`,
        `"${(e.course_title || '').replace(/"/g, '""')}"`,
        `"${(e.centre_name || 'N/A').replace(/"/g, '""')}"`,
        `"${e.enrollment_date || ''}"`,
        `"${e.fee_status || ''}"`,
        e.amount_paid || 0,
        e.classes_attended || 0,
        `"${e.completion_status || ''}"`,
        `"${formatCustomResponses(e.custom_responses, e.course_id).replace(/"/g, '""')}"`
      ];
    });

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const courseSlug = selectedCourse ? `_${(selectedCourse.course_code || selectedCourse.title || 'course').toLowerCase().replace(/\s+/g, '_')}` : '';
    link.setAttribute('download', `CPET_Students${courseSlug}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredEnrollments.length} records to Excel (CSV)!`);
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
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            title="Fetch latest student registrations from MongoDB cloud"
            disabled={isRefreshing}
          >
            <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Live'}</span>
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} />
            Export to Excel (CSV)
          </button>
        </div>
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
                      {(() => {
                        const cleanPhone = (enr.account_phone || '').trim().replace(/\D/g, '').slice(-10);
                        const account = students.find(s => (s.account_phone || '').trim().replace(/\D/g, '').slice(-10) === cleanPhone);
                        const member = account?.members?.find(m => 
                          (enr.student_profile_id && m.id === enr.student_profile_id) ||
                          m.full_name?.toLowerCase() === (enr.student_name || '').toLowerCase()
                        ) || account?.members?.[0];
                        const enrGender = enr.gender || member?.gender;
                        const enrDoB = enr.date_of_birth || member?.date_of_birth;

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '3px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--cpet-text-muted)' }}>
                              📱 {enr.account_phone}
                            </span>
                            {enrGender ? (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: enrGender.toUpperCase() === 'FEMALE' ? '#fdf2f8' : '#eff6ff',
                                color: enrGender.toUpperCase() === 'FEMALE' ? '#be185d' : '#1d4ed8',
                                border: `1px solid ${enrGender.toUpperCase() === 'FEMALE' ? '#fbcfe8' : '#bfdbfe'}`
                              }}>
                                {enrGender.toUpperCase() === 'FEMALE' ? '♀ Female' : '♂ Male'}
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a'
                              }}>
                                ⚠️ No Gender
                              </span>
                            )}
                            {enrDoB ? (
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                🎂 {enrDoB}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>
                                🎂 Missing DoB
                              </span>
                            )}
                          </div>
                        );
                      })()}
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

                        {/* Edit Student Profile */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleOpenEdit(enr)}
                          title="Edit Student Information (Gender, DoB, Phone, Name)"
                        >
                          <Edit2 size={13} />
                          <span className="hide-on-mobile">Edit</span>
                        </button>

                        {/* View 360° Profile */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedStudentFor360(enr)}
                          title="View 360° Lifetime Student Profile"
                        >
                          <Eye size={14} />
                          <span className="hide-on-mobile">360° View</span>
                        </button>

                        {/* Delete Student Record */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fff5f5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            setStudentToDelete(enr);
                            setDeleteScope('ALL');
                          }}
                          title="Permanently Delete Student & Erase Records"
                        >
                          <Trash2 size={13} />
                          <span className="hide-on-mobile">Delete</span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cpet-primary)', margin: 0 }}>
                      {selectedStudentFor360.student_name}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                      Registered Mobile: <strong>+91 {selectedStudentFor360.account_phone}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => {
                        const target = selectedStudentFor360;
                        setSelectedStudentFor360(null);
                        handleOpenEdit(target);
                      }}
                      title="Edit Student Information"
                    >
                      <Edit2 size={13} /> Edit Profile
                    </button>
                    <span className="badge badge-primary">
                      {selectedStudentFor360.admission_number}
                    </span>
                  </div>
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
                            {Object.entries(enrItem.custom_responses).map(([k, v]) => {
                              const cObj = courses.find(c => c.id === enrItem.course_id || c.title === enrItem.course_title);
                              const qDef = cObj?.custom_questions?.find(q => q.id === k);
                              const label = qDef ? qDef.label : k;
                              return (
                                <li key={k}>
                                  <strong>{label}:</strong> {Array.isArray(v) ? v.join(', ') : String(v)}
                                </li>
                              );
                            })}
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

              {/* Danger Zone: Erase Student Records */}
              <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <strong style={{ color: '#991b1b', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={14} /> Danger Zone: Erase Student
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: '#b91c1c' }}>
                    Permanently delete this student and erase all courses, fees, and marks.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ background: '#dc2626', color: 'white', border: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  onClick={() => {
                    const target = selectedStudentFor360;
                    setSelectedStudentFor360(null);
                    setStudentToDelete(target);
                    setDeleteScope('ALL');
                  }}
                >
                  <Trash2 size={13} /> Erase All Records
                </button>
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

      {/* Permanently Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="modal-overlay" onClick={() => !isDeleting && setStudentToDelete(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid #fee2e2', background: '#fff5f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <Trash2 size={18} />
                </div>
                <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1.15rem' }}>Permanently Delete Student</h3>
              </div>
              {!isDeleting && (
                <button className="modal-close-btn" onClick={() => setStudentToDelete(null)}>✕</button>
              )}
            </div>

            <div className="modal-body" style={{ padding: '1.25rem' }}>
              {/* Target Student Identity Card */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--cpet-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--cpet-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                      {studentToDelete.student_name}
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      📱 Registered Mobile: <strong>+91 {studentToDelete.account_phone}</strong>
                    </span>
                  </div>
                  <span className="badge badge-neutral" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {studentToDelete.admission_number}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: '#475569', flexWrap: 'wrap', marginTop: '0.4rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem' }}>
                  <span>Course: <strong>{studentToDelete.course_title}</strong></span>
                  <span>•</span>
                  <span>Fee: <strong style={{ color: studentToDelete.fee_status === 'OFFICE_CONFIRMED' || studentToDelete.fee_status === 'FREE' ? '#16a34a' : '#dc2626' }}>{studentToDelete.fee_status.replace(/_/g, ' ')} (₹{studentToDelete.amount_paid || 0})</strong></span>
                </div>
              </div>

              {/* Multi-Course Scope Selection */}
              {(() => {
                const totalUnderPhone = enrollments.filter(e => e.account_phone === studentToDelete.account_phone);
                if (totalUnderPhone.length > 1) {
                  return (
                    <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                        This phone number has {totalUnderPhone.length} course enrollments. Choose deletion scope:
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', marginBottom: '0.4rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="deleteScope"
                          value="ALL"
                          checked={deleteScope === 'ALL'}
                          onChange={() => setDeleteScope('ALL')}
                        />
                        <span><strong>Erase all records for this student</strong> (All {totalUnderPhone.length} courses, fees & account profile)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="deleteScope"
                          value="THIS_COURSE_ONLY"
                          checked={deleteScope === 'THIS_COURSE_ONLY'}
                          onChange={() => setDeleteScope('THIS_COURSE_ONLY')}
                        />
                        <span><strong>Delete only this enrollment</strong> ({studentToDelete.course_title})</span>
                      </label>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Warning List */}
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', color: '#9f1239', fontSize: '0.82rem', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                  <AlertCircle size={15} />
                  <span>Warning: This action is permanent and cannot be undone!</span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  Confirming deletion will completely erase:
                  <br />• Course enrollment & Admission Number
                  <br />• Fee records, receipts, and payment statuses
                  <br />• Gate check-in status, attendance logs, and exam marks
                  <br />• Student account from local storage and MongoDB cloud
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--cpet-border)', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isDeleting}
                onClick={() => setStudentToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ background: '#dc2626', color: 'white', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    if (deleteScope === 'THIS_COURSE_ONLY') {
                      deleteStudentEnrollment(studentToDelete.id);
                    } else {
                      deleteStudentCompletely(
                        studentToDelete.account_phone,
                        studentToDelete.student_profile_id,
                        studentToDelete.student_name
                      );
                    }
                    setStudentToDelete(null);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                <Trash2 size={15} />
                <span>{isDeleting ? 'Erasing Records...' : 'Permanently Delete Student'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Information Modal */}
      {editingStudent && (
        <div className="modal-overlay" onClick={() => !isSavingEdit && setEditingStudent(null)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--cpet-border)', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <Edit2 size={16} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--cpet-primary)', fontSize: '1.15rem', fontWeight: 800 }}>Edit Student Information</h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--cpet-text-muted)' }}>
                      Admission No: <strong style={{ fontFamily: 'monospace' }}>{editingStudent.admission_number}</strong>
                    </p>
                  </div>
                </div>
                {!isSavingEdit && (
                  <button type="button" className="modal-close-btn" onClick={() => setEditingStudent(null)}>✕</button>
                )}
              </div>

              <div className="modal-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#166534' }}>
                  💡 <strong>Admin Edit:</strong> None of these fields are mandatory when editing. You can correct the student's gender with 1 click without needing Date of Birth.
                </div>

                {/* Full Name */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.student_name}
                    onChange={e => setEditFormData({ ...editFormData, student_name: e.target.value })}
                    placeholder="Enter student's name"
                  />
                </div>

                {/* Gender - Quick Toggle Pills */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Gender {editFormData.gender && <span style={{ fontWeight: 400, color: 'var(--cpet-text-muted)', fontSize: '0.8rem' }}>({editFormData.gender === 'FEMALE' ? 'Female selected' : 'Male selected'})</span>}
                  </label>
                  
                  {/* Quick 1-click Toggle buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, gender: editFormData.gender === 'FEMALE' ? '' : 'FEMALE' })}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: editFormData.gender === 'FEMALE' ? '2px solid #db2777' : '1px solid #e2e8f0',
                        background: editFormData.gender === 'FEMALE' ? '#fdf2f8' : 'white',
                        color: editFormData.gender === 'FEMALE' ? '#be185d' : '#475569',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>♀ Female</span>
                      {editFormData.gender === 'FEMALE' && <CheckCircle size={15} color="#db2777" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, gender: editFormData.gender === 'MALE' ? '' : 'MALE' })}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: editFormData.gender === 'MALE' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: editFormData.gender === 'MALE' ? '#eff6ff' : 'white',
                        color: editFormData.gender === 'MALE' ? '#1d4ed8' : '#475569',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>♂ Male</span>
                      {editFormData.gender === 'MALE' && <CheckCircle size={15} color="#2563eb" />}
                    </button>
                  </div>
                </div>

                {/* Date of Birth & Mobile Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      Date of Birth <span style={{ fontWeight: 400, color: 'var(--cpet-text-muted)', fontSize: '0.75rem' }}>(Optional)</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={editFormData.date_of_birth}
                      onChange={e => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      maxLength={10}
                      value={editFormData.phone}
                      onChange={e => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="10-digit mobile"
                    />
                  </div>
                </div>

                {/* District & Place */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      District
                    </label>
                    <select
                      className="form-select"
                      value={editFormData.district}
                      onChange={e => setEditFormData({ ...editFormData, district: e.target.value })}
                    >
                      {KERALA_DISTRICTS.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      Place / Mahallu
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.place}
                      onChange={e => setEditFormData({ ...editFormData, place: e.target.value })}
                      placeholder="e.g. Chemmad"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--cpet-border)', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isSavingEdit}
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  disabled={isSavingEdit}
                >
                  <CheckCircle size={15} />
                  <span>{isSavingEdit ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
