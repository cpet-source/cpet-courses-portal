import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Building,
  Users,
  UserPlus,
  CheckCircle,
  Award,
  DollarSign,
  Search,
  Plus,
  AlertCircle,
  Layers,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

export const RPCentreStudents = ({ onNavigateToNewCentre }) => {
  const {
    currentRp,
    centres,
    courses,
    enrollments,
    lookupStudentByPhone,
    registerOrEnrollStudent,
    updateStudentMarks,
    updateStudentFee,
    markStudentAttendance,
    addCourseToCentre,
    showToast
  } = useApp();

  // 1. Course Filter (Mahallu courses prioritized)
  const mahalluCourses = courses.filter(c => c.category === 'MAHALLU');
  const availableCourses = mahalluCourses.length > 0 ? mahalluCourses : courses;

  const [selectedCourseId, setSelectedCourseId] = useState(availableCourses[0]?.id || '');

  // Keep selectedCourseId valid when courses load
  useEffect(() => {
    if (!selectedCourseId && availableCourses.length > 0) {
      setSelectedCourseId(availableCourses[0].id);
    } else if (selectedCourseId && !courses.some(c => c.id === selectedCourseId) && availableCourses.length > 0) {
      setSelectedCourseId(availableCourses[0].id);
    }
  }, [availableCourses, selectedCourseId, courses]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || availableCourses[0];

  // 2. Centres running the selected course
  // A centre runs a course if active_course_id matches, course_ids includes it, or students are enrolled in it
  const centresForCourse = centres.filter(c => {
    if (!selectedCourseId) return false;
    const isDirect = c.active_course_id === selectedCourseId;
    const inList = Array.isArray(c.course_ids) && c.course_ids.includes(selectedCourseId);
    const hasStudents = enrollments.some(e => e.course_id === selectedCourseId && e.centre_id === c.id);
    return isDirect || inList || hasStudents;
  });

  const [selectedCentreId, setSelectedCentreId] = useState(centresForCourse[0]?.id || '');

  // Keep selectedCentreId valid when selectedCourseId changes or centres load
  useEffect(() => {
    if (centresForCourse.length > 0) {
      const exists = centresForCourse.some(c => c.id === selectedCentreId);
      if (!exists) {
        setSelectedCentreId(centresForCourse[0].id);
      }
    } else {
      setSelectedCentreId('');
    }
  }, [selectedCourseId, centres, enrollments]);

  const selectedCentre = centres.find(c => c.id === selectedCentreId);

  // 3. Search & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAttachCentreModal, setShowAttachCentreModal] = useState(false);
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState(null);

  // Add Student Modal Chained State
  const [modalCourseId, setModalCourseId] = useState(selectedCourseId || availableCourses[0]?.id || '');
  const [modalCentreId, setModalCentreId] = useState(selectedCentreId || '');

  // Compute available centres for the course selected inside modal
  const modalCentresForCourse = centres.filter(c => {
    if (!modalCourseId) return false;
    const isDirect = c.active_course_id === modalCourseId;
    const inList = Array.isArray(c.course_ids) && c.course_ids.includes(modalCourseId);
    const hasStudents = enrollments.some(e => e.course_id === modalCourseId && e.centre_id === c.id);
    return isDirect || inList || hasStudents;
  });

  // Keep modal centre in sync when modal course changes
  const handleModalCourseChange = (newCourseId) => {
    setModalCourseId(newCourseId);
    const availableForNewCourse = centres.filter(c => {
      const isDirect = c.active_course_id === newCourseId;
      const inList = Array.isArray(c.course_ids) && c.course_ids.includes(newCourseId);
      const hasStudents = enrollments.some(e => e.course_id === newCourseId && e.centre_id === c.id);
      return isDirect || inList || hasStudents;
    });
    setModalCentreId(availableForNewCourse[0]?.id || '');
  };

  // Student Phone Lookup state
  const [phoneInput, setPhoneInput] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [hasSearchedPhone, setHasSearchedPhone] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [newMemberForm, setNewMemberForm] = useState({
    full_name: '',
    gender: 'MALE',
    date_of_birth: '',
    relationship: 'Self',
    place: ''
  });

  // Attach Existing Centre to Course State
  const [centreToAttachId, setCentreToAttachId] = useState(centres[0]?.id || '');

  // Open Add Student Modal initialized to current selections
  const openAddStudentModal = () => {
    setModalCourseId(selectedCourseId || availableCourses[0]?.id || '');
    setModalCentreId(selectedCentreId || centresForCourse[0]?.id || '');
    setPhoneInput('');
    setLookupResult(null);
    setHasSearchedPhone(false);
    setSelectedMemberId(null);
    setNewMemberForm({
      full_name: '',
      gender: 'MALE',
      date_of_birth: '',
      relationship: 'Self',
      place: selectedCentre?.place || ''
    });
    setShowAddStudentModal(true);
  };

  // Filter students in current (Course, Centre)
  const batchStudents = enrollments.filter(e => {
    return e.course_id === selectedCourseId && e.centre_id === selectedCentreId;
  });

  const filteredStudents = batchStudents.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.student_name && e.student_name.toLowerCase().includes(q)) ||
      (e.account_phone && e.account_phone.includes(q)) ||
      (e.admission_number && e.admission_number.toLowerCase().includes(q))
    );
  });

  // Lookup Phone in Modal
  const handlePhoneCheck = (e) => {
    e.preventDefault();
    if (!phoneInput || phoneInput.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'danger');
      return;
    }
    const found = lookupStudentByPhone(phoneInput);
    setLookupResult(found);
    setHasSearchedPhone(true);
    if (found && found.members.length > 0) {
      setSelectedMemberId(found.members[0].id);
    } else {
      setSelectedMemberId(null);
    }
  };

  // Submit Enrollment
  const handleEnrollSubmit = (e) => {
    e.preventDefault();
    if (!modalCourseId) {
      showToast('Please select a course', 'danger');
      return;
    }
    if (!modalCentreId) {
      showToast('Please select a study centre for this course', 'danger');
      return;
    }

    const courseObj = courses.find(c => c.id === modalCourseId);

    registerOrEnrollStudent({
      phone: phoneInput,
      existingMemberId: selectedMemberId,
      newMemberData: newMemberForm,
      courseId: modalCourseId,
      centreId: modalCentreId,
      feeStatus: 'PAID_TO_RP',
      amountPaid: courseObj?.standard_fee || 0
    });

    // Automatically navigate view to this course & centre so RP sees the new student
    setSelectedCourseId(modalCourseId);
    setSelectedCentreId(modalCentreId);

    setShowAddStudentModal(false);
    setPhoneInput('');
    setLookupResult(null);
    setHasSearchedPhone(false);
  };

  // Handle attaching course to existing centre
  const handleAttachCourseToCentre = (e) => {
    e.preventDefault();
    if (!centreToAttachId || !selectedCourseId) {
      showToast('Please select a centre and course', 'danger');
      return;
    }

    addCourseToCentre(centreToAttachId, selectedCourseId);
    setSelectedCentreId(centreToAttachId);
    setShowAttachCentreModal(false);
    showToast(`Course added to Study Centre! Now you can enroll students.`, 'success');
  };

  // Summary stats for currently selected batch
  const paidCount = batchStudents.filter(
    s => s.fee_status === 'PAID_TO_RP' || s.fee_status === 'OFFICE_CONFIRMED'
  ).length;

  return (
    <div>
      {/* Header Bar */}
      <div className="cpet-card-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h3 className="cpet-card-title">
            <GraduationCap size={22} style={{ color: 'var(--cpet-primary)' }} />
            Mahallu Courses & Evaluation
          </h3>
          <p className="cpet-card-desc">
            Select a Mahallu course to view active study centres, track enrolled students, mark attendance, and submit exam scores.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setShowAttachCentreModal(true)}>
            <Plus size={15} />
            Launch Course at Centre
          </button>
          <button className="btn btn-primary" onClick={openAddStudentModal}>
            <UserPlus size={15} />
            Onboard Student
          </button>
        </div>
      </div>

      {/* STEP 1: Mahallu Course Selector */}
      <div className="cpet-card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cpet-primary)', background: '#e0e7ff', padding: '3px 8px', borderRadius: '4px' }}>
              Step 1
            </span>
            <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>Select Mahallu Course:</strong>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {availableCourses.length} Mahallu Course{availableCourses.length !== 1 ? 's' : ''} available
          </span>
        </div>

        {availableCourses.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#64748b' }}>
            No Mahallu courses configured yet. Please ask Super Admin to create a course first.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {availableCourses.map(course => {
              const isSelected = course.id === selectedCourseId;
              const courseCentres = centres.filter(c => {
                const isDirect = c.active_course_id === course.id;
                const inList = Array.isArray(c.course_ids) && c.course_ids.includes(course.id);
                const hasStudents = enrollments.some(e => e.course_id === course.id && e.centre_id === c.id);
                return isDirect || inList || hasStudents;
              });
              const courseEnrolledCount = enrollments.filter(e => e.course_id === course.id).length;

              return (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--cpet-primary)' : '1px solid var(--cpet-border)',
                    background: isSelected ? 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%)' : 'white',
                    boxShadow: isSelected ? '0 4px 12px rgba(50, 53, 126, 0.12)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? 'var(--cpet-primary)' : '#64748b', background: isSelected ? '#dbeafe' : '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {course.course_code || 'COURSE'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cpet-accent)' }}>
                      {course.standard_fee > 0 ? `₹${course.standard_fee}` : 'FREE'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: isSelected ? 'var(--cpet-primary)' : '#1e293b', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                    {course.title}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>🏛️ <strong>{courseCentres.length}</strong> {courseCentres.length === 1 ? 'Centre' : 'Centres'}</span>
                    <span>•</span>
                    <span>👥 <strong>{courseEnrolledCount}</strong> Students</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STEP 2: Centres Under Selected Course */}
      {selectedCourse && (
        <div className="cpet-card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cpet-primary)', background: '#e0e7ff', padding: '3px 8px', borderRadius: '4px' }}>
                Step 2
              </span>
              <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                Centres Offering "{selectedCourse.title}":
              </strong>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAttachCentreModal(true)}
                title="Launch this course at an existing centre"
              >
                + Launch at Existing Centre
              </button>
              {onNavigateToNewCentre && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={onNavigateToNewCentre}
                  title="Register completely new centre"
                >
                  + New Centre Form
                </button>
              )}
            </div>
          </div>

          {centresForCourse.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed var(--cpet-border)' }}>
              <AlertCircle size={32} style={{ color: '#94a3b8', margin: '0 auto 0.5rem' }} />
              <h4 style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.35rem' }}>
                No Study Centres currently offering this course
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 1rem' }}>
                A Mahallu centre that completed its first course can now launch <strong>{selectedCourse.title}</strong> as its next batch!
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAttachCentreModal(true)}>
                  <Plus size={14} /> Launch at an Existing Centre
                </button>
                {onNavigateToNewCentre && (
                  <button className="btn btn-secondary btn-sm" onClick={onNavigateToNewCentre}>
                    <Building size={14} /> Register New Centre
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {centresForCourse.map(centre => {
                const isSelected = centre.id === selectedCentreId;
                const centreStudentsInCourse = enrollments.filter(
                  e => e.course_id === selectedCourseId && e.centre_id === centre.id
                ).length;

                return (
                  <button
                    key={centre.id}
                    onClick={() => setSelectedCentreId(centre.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.55rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--cpet-primary)' : '1px solid var(--cpet-border)',
                      background: isSelected ? 'var(--cpet-primary)' : 'white',
                      color: isSelected ? 'white' : 'var(--cpet-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Building size={14} />
                    <span>{centre.centre_name} ({centre.place})</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#e0e7ff',
                        color: isSelected ? 'white' : 'var(--cpet-primary)'
                      }}
                    >
                      {centreStudentsInCourse}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Student Roster & Evaluation */}
      {selectedCourse && selectedCentre && (
        <div>
          {/* Active Batch Summary Banner */}
          <div
            style={{
              background: 'white',
              border: '1px solid var(--cpet-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <span className="badge badge-primary">{selectedCourse.course_code}</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--cpet-primary)', margin: 0 }}>
                  {selectedCourse.title}
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                Centre: <strong>{selectedCentre.centre_name}</strong> ({selectedCentre.place}, {selectedCentre.district})
                {selectedCentre.committee_president_phone && ` | Pres: ${selectedCentre.committee_president_phone}`}
              </p>
            </div>

            {/* Batch Metrics */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--cpet-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Enrolled</span>
                <strong style={{ fontSize: '1rem', color: 'var(--cpet-primary)' }}>{batchStudents.length}</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--cpet-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Fee Paid</span>
                <strong style={{ fontSize: '1rem', color: '#16a34a' }}>{paidCount}</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--cpet-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Syllabus</span>
                <strong style={{ fontSize: '1rem', color: '#334155' }}>{selectedCourse.total_planned_classes || 0} Classes</strong>
              </div>
            </div>
          </div>

          {/* Search & Onboard Row */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem' }}
                placeholder="Search by student name, phone, admission no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={openAddStudentModal}>
              <UserPlus size={16} /> Onboard Student to this Batch
            </button>
          </div>

          {/* Student Cards Roster */}
          <div className="mobile-card-list">
            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', color: '#64748b' }}>
                <Users size={36} style={{ color: '#cbd5e1', margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '0.25rem' }}>
                  No students enrolled in this batch yet
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                  Enroll candidates from the Mahallu using their 10-digit mobile number.
                </p>
                <button className="btn btn-primary btn-sm" onClick={openAddStudentModal}>
                  <UserPlus size={14} /> Onboard First Student
                </button>
              </div>
            ) : (
              filteredStudents.map(student => {
                const isFeePaid = student.fee_status === 'PAID_TO_RP' || student.fee_status === 'OFFICE_CONFIRMED';
                const gradedCount = Object.keys(student.marks || {}).length;
                const totalSubjects = selectedCourse.subjects?.length || 0;

                return (
                  <div key={student.id} className="mobile-data-card">
                    <div className="card-top">
                      <div>
                        <h4 className="card-title">{student.student_name}</h4>
                        <p className="card-subtitle">
                          📱 {student.account_phone} | Adm: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{student.admission_number}</span>
                        </p>
                      </div>
                      <span className={`badge ${isFeePaid ? 'badge-success' : 'badge-warning'}`}>
                        {student.fee_status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Academic & Attendance Quick Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', margin: '0.5rem 0' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Attendance</span>
                        <strong>{student.classes_attended || 0} Sessions Attended</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Exam Evaluation</span>
                        <strong>
                          {totalSubjects > 0
                            ? (gradedCount > 0 ? `${gradedCount}/${totalSubjects} Subjects Graded` : 'Pending Mark Entry')
                            : 'Attendance-based'}
                        </strong>
                      </div>
                    </div>

                    {/* Quick Touch Actions */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                      {/* Attendance Tap */}
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => markStudentAttendance(student.id)}
                        title="Increment attended classes"
                      >
                        +1 Attendance
                      </button>

                      {/* Fee Collection Tap */}
                      {!isFeePaid && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateStudentFee(student.id, 'PAID_TO_RP', selectedCourse.standard_fee)}
                        >
                          <DollarSign size={13} /> Collect ₹{selectedCourse.standard_fee}
                        </button>
                      )}

                      {/* Marks Entry Modal Trigger */}
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedStudentForMarks(student)}
                      >
                        <Award size={13} /> Enter Marks
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Enter Subject Marks */}
      {selectedStudentForMarks && (
        <div className="modal-overlay" onClick={() => setSelectedStudentForMarks(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Subject Marks Entry</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Student: <strong>{selectedStudentForMarks.student_name}</strong> (Adm: {selectedStudentForMarks.admission_number})
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedStudentForMarks(null)}>✕</button>
            </div>

            <div className="modal-body">
              {(!selectedCourse?.subjects || selectedCourse.subjects.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                  This course is evaluated by attendance only. No exam subjects configured.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedCourse.subjects.map(subject => {
                    const currentMark = selectedStudentForMarks.marks?.[subject.id] || '';

                    return (
                      <div key={subject.id} style={{ background: '#f8fafc', border: '1px solid var(--cpet-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <strong style={{ color: 'var(--cpet-primary)' }}>{subject.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Pass: {subject.pass_marks} / Max: {subject.max_marks}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="number"
                            className="form-input"
                            style={{ maxWidth: '120px', fontWeight: 700, fontSize: '1.1rem' }}
                            placeholder="Score"
                            defaultValue={currentMark}
                            onBlur={(e) => {
                              if (e.target.value !== '') {
                                updateStudentMarks(selectedStudentForMarks.id, subject.id, e.target.value);
                              }
                            }}
                          />
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {subject.max_marks}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedStudentForMarks(null)}>
                Done & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Onboard Student (Requirement 3: Course -> Chained Centre -> Phone Lookup) */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Onboard Student to Course</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Select the course and centre, then verify student mobile number.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddStudentModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Chained Selectors: Course First, Then Centre */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
                    1. Select Course: <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={modalCourseId}
                    onChange={e => handleModalCourseChange(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    {availableCourses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.course_code}) — {c.standard_fee > 0 ? `₹${c.standard_fee}` : 'FREE'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
                    2. Select Study Centre (Under this Course): <span className="required">*</span>
                  </label>
                  {modalCentresForCourse.length === 0 ? (
                    <div>
                      <select className="form-select" disabled>
                        <option>No study centres currently offer this course</option>
                      </select>
                      <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '0.35rem' }}>
                        Please launch this course at an existing centre first using "+ Launch Course at Centre".
                      </p>
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={modalCentreId}
                      onChange={e => setModalCentreId(e.target.value)}
                      style={{ fontWeight: 600 }}
                    >
                      {modalCentresForCourse.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.centre_name} ({c.place}, {c.district})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Phone Lookup Step */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  3. Student Mobile Number (10 Digits):
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9847112233"
                    value={phoneInput}
                    onChange={e => {
                      setPhoneInput(e.target.value);
                      setHasSearchedPhone(false);
                    }}
                  />
                  <button className="btn btn-primary" type="button" onClick={handlePhoneCheck}>
                    Check Phone
                  </button>
                </div>
                <span className="form-helper">
                  Lookup if this family member already has a CPET lifetime ID.
                </span>
              </div>

              {/* Step 3: Registration / Selection Details */}
              {hasSearchedPhone && (
                <form onSubmit={handleEnrollSubmit}>
                  {lookupResult && lookupResult.members && lookupResult.members.length > 0 ? (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <CheckCircle size={16} /> Existing CPET Phone Account Found!
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                        Select which family member is joining this course, or add a new family member:
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {lookupResult.members.map(member => (
                          <label
                            key={member.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.75rem',
                              border: selectedMemberId === member.id ? '2px solid var(--cpet-primary)' : '1px solid var(--cpet-border)',
                              borderRadius: 'var(--radius-md)',
                              background: selectedMemberId === member.id ? '#f1f5f9' : 'white',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              type="radio"
                              name="family_member"
                              checked={selectedMemberId === member.id}
                              onChange={() => setSelectedMemberId(member.id)}
                            />
                            <div>
                              <strong style={{ color: 'var(--cpet-primary)' }}>{member.full_name}</strong>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                                Relation: {member.relationship} | Gender: {member.gender}
                              </span>
                            </div>
                          </label>
                        ))}

                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            border: selectedMemberId === null ? '2px solid var(--cpet-accent)' : '1px solid var(--cpet-border)',
                            borderRadius: 'var(--radius-md)',
                            background: selectedMemberId === null ? 'var(--cpet-accent-soft)' : 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="radio"
                            name="family_member"
                            checked={selectedMemberId === null}
                            onChange={() => setSelectedMemberId(null)}
                          />
                          <span style={{ fontWeight: 700, color: 'var(--cpet-accent)' }}>
                            + Add New Family Member with this Phone Number
                          </span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1rem', color: '#475569', fontSize: '0.85rem' }}>
                      New student phone number. Fill in basic details below:
                    </div>
                  )}

                  {/* New Profile Form Fields */}
                  {selectedMemberId === null && (
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Student Full Name <span className="required">*</span></label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          placeholder="e.g. Muhammed Ameen"
                          value={newMemberForm.full_name}
                          onChange={e => setNewMemberForm({ ...newMemberForm, full_name: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Gender</label>
                          <select
                            className="form-select"
                            value={newMemberForm.gender}
                            onChange={e => setNewMemberForm({ ...newMemberForm, gender: e.target.value })}
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Date of Birth</label>
                          <input
                            type="date"
                            className="form-input"
                            value={newMemberForm.date_of_birth}
                            onChange={e => setNewMemberForm({ ...newMemberForm, date_of_birth: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Place / Mahallu</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Tanur"
                            value={newMemberForm.place}
                            onChange={e => setNewMemberForm({ ...newMemberForm, place: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Relationship Tag</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Son, Daughter, Self"
                            value={newMemberForm.relationship}
                            onChange={e => setNewMemberForm({ ...newMemberForm, relationship: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="modal-footer" style={{ padding: '0.75rem 0 0' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddStudentModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={!modalCentreId}>
                      Enroll & Generate Admission Number
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Launch Course at Existing Study Centre (Solves Mahallu Course Progression) */}
      {showAttachCentreModal && (
        <div className="modal-overlay" onClick={() => setShowAttachCentreModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Launch Course at Existing Centre</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  A Mahallu starts with Course 1, then progresses to Course 2, 3... Connect them without creating duplicate centres.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAttachCentreModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAttachCourseToCentre}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
                    Course to Launch:
                  </label>
                  <select
                    className="form-select"
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    {availableCourses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.course_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
                    Select Existing Study Centre:
                  </label>
                  {centres.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: '#dc2626' }}>
                      No study centres found in database. Please register a centre first.
                    </p>
                  ) : (
                    <select
                      className="form-select"
                      value={centreToAttachId}
                      onChange={e => setCentreToAttachId(e.target.value)}
                      style={{ fontWeight: 600 }}
                    >
                      {centres.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.centre_name} ({c.place}, {c.district}) — Code: {c.centre_code}
                        </option>
                      ))}
                    </select>
                  )}
                  <span className="form-helper">
                    The centre committee, founder RP, and address remain intact while allowing this new course offering.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAttachCentreModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={centres.length === 0}>
                  <CheckCircle size={16} /> Confirm Course Launch at Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
