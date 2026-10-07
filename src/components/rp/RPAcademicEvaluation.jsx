import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Award,
  CalendarCheck,
  CheckCircle,
  Clock,
  Search,
  Users,
  Building,
  GraduationCap,
  Check,
  X,
  BookOpen,
  Filter,
  CheckCheck
} from 'lucide-react';

export const RPAcademicEvaluation = () => {
  const {
    courses,
    centres,
    enrollments,
    updateStudentMarks,
    toggleStudentSessionAttendance,
    batchMarkSessionAttendance,
    showToast
  } = useApp();

  // View Mode: 'ACTIVE' (Default) vs 'ARCHIVED' (Past / Completed Batches)
  const [viewMode, setViewMode] = useState('ACTIVE');

  // 1. Course Selection (filtered by active vs concluded)
  const baseCourses = courses.filter(c => {
    if (viewMode === 'ACTIVE') {
      return c.status !== 'COMPLETED';
    } else {
      return c.status === 'COMPLETED' || centres.some(ctr => ctr.completed_course_ids?.includes(c.id));
    }
  });

  const mahalluCourses = baseCourses.filter(c => c.category === 'MAHALLU');
  const availableCourses = mahalluCourses.length > 0 ? mahalluCourses : baseCourses;
  const [selectedCourseId, setSelectedCourseId] = useState(availableCourses[0]?.id || '');

  useEffect(() => {
    if (!availableCourses.some(c => c.id === selectedCourseId)) {
      setSelectedCourseId(availableCourses[0]?.id || '');
    }
  }, [availableCourses, selectedCourseId]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || availableCourses[0];

  // 2. Study Centres running selected course (filtered by active vs completed)
  const courseCentres = centres.filter(c => {
    if (!selectedCourseId) return false;
    const isDirect = c.active_course_id === selectedCourseId;
    const inList = Array.isArray(c.course_ids) && c.course_ids.includes(selectedCourseId);
    const hasEnrollment = enrollments.some(e => e.course_id === selectedCourseId && e.centre_id === c.id);
    const isAttached = isDirect || inList || hasEnrollment;
    if (!isAttached) return false;

    const isBatchCompleted = selectedCourse?.status === 'COMPLETED' || 
                             (Array.isArray(c.completed_course_ids) && c.completed_course_ids.includes(selectedCourseId));

    return viewMode === 'ACTIVE' ? !isBatchCompleted : isBatchCompleted;
  });

  const [selectedCentreId, setSelectedCentreId] = useState(courseCentres[0]?.id || centres[0]?.id || '');

  useEffect(() => {
    if (courseCentres.length > 0 && !courseCentres.some(c => c.id === selectedCentreId)) {
      setSelectedCentreId(courseCentres[0].id);
    }
  }, [selectedCourseId, centres, enrollments, viewMode]);

  const selectedCentre = centres.find(c => c.id === selectedCentreId) || courseCentres[0];

  // 3. Evaluation Mode: 'MARKS' | 'ATTENDANCE'
  const [activeMode, setActiveMode] = useState('MARKS');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk session attendance state
  const [bulkSessionNumber, setBulkSessionNumber] = useState(1);

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

  // Subjects configuration
  const subjects = selectedCourse?.subjects || [];
  const hasSubjects = subjects.length > 0 && selectedCourse?.evaluation_type !== 'ATTENDANCE_ONLY' && selectedCourse?.evaluation_type !== 'NONE';
  const totalClasses = selectedCourse?.total_planned_classes || 12;
  const sessionList = Array.from({ length: totalClasses }, (_, i) => i + 1);

  const handleBulkMarkAttendance = (markPresent) => {
    const studentIds = filteredStudents.map(s => s.id);
    if (studentIds.length === 0) {
      showToast('No students to mark in this batch', 'warning');
      return;
    }
    batchMarkSessionAttendance(studentIds, Number(bulkSessionNumber), markPresent);
  };

  return (
    <div>
      {/* Header */}
      <div className="cpet-card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h3 className="cpet-card-title">
            <Award size={22} style={{ color: 'var(--cpet-primary)' }} />
            Academic Evaluation & Attendance Register
          </h3>
          <p className="cpet-card-desc">
            Enter exam marks across all subjects and maintain session-by-session class attendance for your student batches.
          </p>
        </div>
      </div>

      {/* Active Batches vs Past/Completed Batches Toggle (Option A) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: viewMode === 'ACTIVE' ? 'var(--cpet-primary)' : 'transparent',
              color: viewMode === 'ACTIVE' ? '#fff' : '#475569',
              border: 'none',
              boxShadow: viewMode === 'ACTIVE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.35rem 0.85rem'
            }}
            onClick={() => setViewMode('ACTIVE')}
          >
            🟢 Active Ongoing Batches
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: viewMode === 'ARCHIVED' ? 'var(--cpet-primary)' : 'transparent',
              color: viewMode === 'ARCHIVED' ? '#fff' : '#475569',
              border: 'none',
              boxShadow: viewMode === 'ARCHIVED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.35rem 0.85rem'
            }}
            onClick={() => setViewMode('ARCHIVED')}
          >
            🎓 Past / Completed Batches
          </button>
        </div>

        {viewMode === 'ARCHIVED' && (
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
            Viewing concluded/archived batch evaluation records.
          </span>
        )}
      </div>

      {/* Selectors Bar: Course & Centre */}
      <div className="cpet-card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          {/* 1. Select Course */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
              1. Select Course / Program:
            </label>
            <select
              className="form-select"
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              style={{ fontWeight: 700 }}
            >
              {availableCourses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.course_code})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Centre */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
              2. Select Study Centre:
            </label>
            <select
              className="form-select"
              value={selectedCentreId}
              onChange={e => setSelectedCentreId(e.target.value)}
              style={{ fontWeight: 700 }}
            >
              {courseCentres.length > 0 && (
                <optgroup label="Centres offering this course">
                  {courseCentres.map(c => (
                    <option key={c.id} value={c.id}>
                      ★ {c.centre_name} ({c.place})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={courseCentres.length > 0 ? "Other Study Centres" : "All Study Centres"}>
                {centres
                  .filter(c => !courseCentres.some(m => m.id === c.id))
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.centre_name} ({c.place})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Search Field */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Search Student:</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.1rem' }}
                placeholder="Name, Phone, Adm No..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Evaluation Sub-Mode Switcher */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #edf2f7', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn ${activeMode === 'MARKS' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveMode('MARKS')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem' }}
            >
              <Award size={16} />
              <span>Subject Mark Entry</span>
              {hasSubjects && (
                <span className="badge badge-accent" style={{ fontSize: '0.7rem', padding: '1px 5px' }}>
                  {subjects.length} Subjects
                </span>
              )}
            </button>

            <button
              className={`btn ${activeMode === 'ATTENDANCE' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveMode('ATTENDANCE')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem' }}
            >
              <CalendarCheck size={16} />
              <span>Attendance Register</span>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '1px 5px' }}>
                {totalClasses} Classes
              </span>
            </button>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Batch: <strong>{batchStudents.length} Students</strong> at <strong>{selectedCentre?.centre_name || 'Selected Centre'}</strong>
          </div>
        </div>
      </div>

      {/* SECTION A: SUBJECT MARK ENTRY */}
      {activeMode === 'MARKS' && (
        <div className="cpet-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--cpet-primary)', margin: 0 }}>
                Subject Exam Mark Sheet
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                Course: <strong>{selectedCourse?.title}</strong> | Evaluation Mode: <strong>{selectedCourse?.evaluation_type?.replace('_', ' ')}</strong>
              </p>
            </div>
          </div>

          {!hasSubjects ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed var(--cpet-border)' }}>
              <BookOpen size={36} style={{ color: '#94a3b8', margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.35rem' }}>
                Attendance-Only Course
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 1rem' }}>
                This program does not require exam marks. Switch to the <strong>Attendance Register</strong> tab above to record class attendance.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setActiveMode('ATTENDANCE')}>
                <CalendarCheck size={15} /> Switch to Attendance Register
              </button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              No students enrolled in this batch yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="cpet-table" style={{ width: '100%', minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Student Details</th>
                    <th>Adm. No</th>
                    {subjects.map(sub => (
                      <th key={sub.id} style={{ textAlign: 'center', minWidth: '120px' }}>
                        <div>{sub.name}</div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                          Pass: {sub.pass_marks} / Max: {sub.max_marks}
                        </span>
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', width: '110px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => {
                    let totalScore = 0;
                    let totalMax = 0;
                    let isPassedAll = true;
                    let hasAttemptedAny = false;

                    subjects.forEach(sub => {
                      const mark = student.marks?.[sub.id];
                      totalMax += Number(sub.max_marks || 100);
                      if (mark !== undefined && mark !== '') {
                        hasAttemptedAny = true;
                        totalScore += Number(mark);
                        if (Number(mark) < Number(sub.pass_marks || 40)) {
                          isPassedAll = false;
                        }
                      } else {
                        isPassedAll = false;
                      }
                    });

                    return (
                      <tr key={student.id}>
                        <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{student.student_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📱 {student.account_phone}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {student.admission_number}
                          </span>
                        </td>
                        {subjects.map(sub => {
                          const currentScore = student.marks?.[sub.id] !== undefined ? student.marks[sub.id] : '';
                          const isFailed = currentScore !== '' && Number(currentScore) < Number(sub.pass_marks || 40);

                          return (
                            <td key={sub.id} style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <input
                                  type="number"
                                  className="form-input"
                                  style={{
                                    width: '72px',
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    padding: '0.35rem 0.4rem',
                                    borderColor: isFailed ? '#f87171' : undefined,
                                    background: isFailed ? '#fef2f2' : 'white'
                                  }}
                                  placeholder="Score"
                                  defaultValue={currentScore}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    if (val !== '') {
                                      updateStudentMarks(student.id, sub.id, val);
                                    }
                                  }}
                                />
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>/{sub.max_marks}</span>
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center' }}>
                          {!hasAttemptedAny ? (
                            <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>Pending</span>
                          ) : isPassedAll ? (
                            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>Passed</span>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Needs Impr.</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION B: SESSION ATTENDANCE REGISTER */}
      {activeMode === 'ATTENDANCE' && (
        <div className="cpet-card" style={{ padding: '1.25rem' }}>
          {/* Attendance Header & Quick Batch Logger */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--cpet-primary)', margin: 0 }}>
                Class-by-Class Attendance Sheet
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                Tap on any class number (Class 1, Class 2...) to toggle attendance for that student.
              </p>
            </div>

            {/* Quick Bulk Session Logger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Batch Action:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.82rem', fontWeight: 700 }}
                value={bulkSessionNumber}
                onChange={e => setBulkSessionNumber(Number(e.target.value))}
              >
                {sessionList.map(s => (
                  <option key={s} value={s}>Class {s}</option>
                ))}
              </select>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleBulkMarkAttendance(true)}
                title="Mark all students present for this class"
              >
                <CheckCheck size={14} /> Mark All Present
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleBulkMarkAttendance(false)}
                title="Reset this class attendance"
              >
                Reset Class {bulkSessionNumber}
              </button>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              No students enrolled in this batch yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="cpet-table" style={{ width: '100%', minWidth: '750px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ minWidth: '180px' }}>Student</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Total Attended</th>
                    <th style={{ minWidth: '400px' }}>Class Sessions (1 to {totalClasses})</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => {
                    const attendedList = Array.isArray(student.attended_sessions)
                      ? student.attended_sessions
                      : Array.from({ length: student.classes_attended || 0 }, (_, i) => i + 1);

                    const attendedCount = attendedList.length;
                    const percentage = Math.round((attendedCount / totalClasses) * 100);

                    return (
                      <tr key={student.id}>
                        <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{student.student_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Adm: {student.admission_number}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`badge ${percentage >= 75 ? 'badge-success' : percentage >= 50 ? 'badge-warning' : 'badge-danger'}`}
                            style={{ fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            {attendedCount} / {totalClasses} ({percentage}%)
                          </span>
                        </td>
                        <td>
                          {/* Class Session Pills Grid */}
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {sessionList.map(sessionNum => {
                              const isAttended = attendedList.includes(sessionNum);

                              return (
                                <button
                                  key={sessionNum}
                                  onClick={() => toggleStudentSessionAttendance(student.id, sessionNum)}
                                  title={`Toggle Class ${sessionNum} for ${student.student_name}`}
                                  style={{
                                    border: isAttended ? '1px solid #16a34a' : '1px solid #cbd5e1',
                                    background: isAttended ? '#16a34a' : '#f8fafc',
                                    color: isAttended ? 'white' : '#64748b',
                                    borderRadius: '4px',
                                    padding: '3px 7px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.1s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px'
                                  }}
                                >
                                  {isAttended && <Check size={11} strokeWidth={3} />}
                                  C{sessionNum}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
