import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CourseCatalog } from './CourseCatalog';
import { CourseRegistrationForm } from './CourseRegistrationForm';
import { Search, UserCheck, GraduationCap, Award, BookOpen, CheckCircle, Clock, Calendar, ArrowRight, ShieldCheck, Plus, AlertCircle, ArrowLeft, Copy, Check } from 'lucide-react';

export const StudentHub = () => {
  const { lookupStudentByPhone, enrollments, courses, centres, showToast } = useApp();
  const [phoneSearch, setPhoneSearch] = useState('');
  const [accountData, setAccountData] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Registration Success state
  const [completedEnrollment, setCompletedEnrollment] = useState(null);
  const [copiedAdm, setCopiedAdm] = useState(false);

  // Deep link detection state
  const [registeringCourse, setRegisteringCourse] = useState(null);
  const [deepLinkNotFound, setDeepLinkNotFound] = useState(false);
  const hasHandledDeepLink = React.useRef(false);

  // Default viewMode: If a course query parameter is present, start in 'register', otherwise 'catalog'
  const [viewMode, setViewMode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get('course') || params.get('slug') || params.get('id') || params.get('c')) ? 'register' : 'catalog';
    } catch (e) {
      return 'catalog';
    }
  });

  // Parse and match course from URL parameters (?course=... or ?slug=... or ?id=...) once on initial load
  useEffect(() => {
    if (hasHandledDeepLink.current) return;
    if (!courses || courses.length === 0) return;

    // Never override if user is already on lookup mode
    if (viewMode === 'lookup') {
      hasHandledDeepLink.current = true;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const slugOrId = params.get('selected') || params.get('active_course') || params.get('course') || params.get('slug') || params.get('id') || params.get('c');

    if (slugOrId) {
      const cleanTarget = slugOrId.toLowerCase().trim();
      const matched = courses.find(c =>
        (c.slug && c.slug.toLowerCase() === cleanTarget) ||
        (c.id && c.id.toLowerCase() === cleanTarget) ||
        (c.course_code && c.course_code.toLowerCase() === cleanTarget)
      );

      if (matched) {
        setRegisteringCourse(matched);
        setViewMode('register');
        setDeepLinkNotFound(false);
      } else {
        setDeepLinkNotFound(true);
        setViewMode('catalog');
      }
    }
    hasHandledDeepLink.current = true;
  }, [courses]);

  const handleSelectCourse = (course) => {
    setRegisteringCourse(course);
    setCompletedEnrollment(null);
    setViewMode('register');
    setDeepLinkNotFound(false);
    if (window.history.pushState) {
      const newUrl = `${window.location.pathname}?course=${course.slug || course.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setRegisteringCourse(null);
    setCompletedEnrollment(null);
    setViewMode('catalog');
    setDeepLinkNotFound(false);
    if (window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToLookup = () => {
    setViewMode('lookup');
    setRegisteringCourse(null);
    setCompletedEnrollment(null);
    setDeepLinkNotFound(false);
    if (window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleLookup = (e, explicitPhone) => {
    if (e && e.preventDefault) e.preventDefault();
    const phoneToUse = typeof explicitPhone === 'string' ? explicitPhone : phoneSearch;
    const clean = (phoneToUse || '').trim().replace(/\D/g, '').slice(-10);
    if (!clean || clean.length < 10) {
      if (!explicitPhone) showToast('Please enter a valid 10-digit mobile number', 'warning');
      return;
    }
    const found = lookupStudentByPhone(clean);
    setAccountData(found);
    setHasSearched(true);
    if (found && found.members && found.members.length > 0) {
      setSelectedMember(found.members[0]);
    } else {
      setSelectedMember(null);
    }
  };

  const memberEnrollments = selectedMember
    ? enrollments.filter(e => e.student_profile_id === selectedMember.id || (e.account_phone === accountData?.account_phone && e.student_name === selectedMember.full_name))
    : [];

  return (
    <div>
      {/* Sub Navigation */}
      <div className="cpet-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${viewMode === 'catalog' || viewMode === 'register' || viewMode === 'success' ? 'active' : ''}`}
          onClick={handleBackToCatalog}
        >
          <BookOpen size={16} />
          <span>Browse & Apply for Courses ({courses.length})</span>
        </button>
        <button
          className={`tab-btn ${viewMode === 'lookup' ? 'active' : ''}`}
          onClick={handleSwitchToLookup}
        >
          <Search size={16} />
          <span>Track Progress</span>
        </button>
      </div>

      {deepLinkNotFound && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem' }}>
          <AlertCircle size={18} />
          <span>The requested course link is currently not available. Please explore all active courses below:</span>
        </div>
      )}

      {/* Dedicated Registration Success Screen */}
      {viewMode === 'success' && completedEnrollment && (
        <div className="cpet-card" style={{ maxWidth: '640px', margin: '0 auto 2rem', textAlign: 'center', padding: '2.5rem 1.75rem', borderTop: '5px solid #16a34a', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' }}>
          {/* Celebratory Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#16a34a',
            boxShadow: '0 0 0 10px rgba(34, 197, 94, 0.15)'
          }}>
            <CheckCircle size={46} strokeWidth={2.4} />
          </div>

          <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '5px 14px', marginBottom: '0.6rem', fontWeight: 700 }}>
            Alhamdulillah • Seat Confirmed
          </span>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--cpet-primary)', margin: '0.4rem 0 0.5rem' }}>
            Your Registration is Complete!
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#475569', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.55 }}>
            You have successfully registered for <strong>{completedEnrollment.course_title}</strong>. Your institutional record is now active in the CPET portal.
          </p>

          {/* Admission Slip Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            textAlign: 'left',
            marginBottom: '1.5rem',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            {/* Monospace Admission Number Highlight */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              paddingBottom: '0.85rem',
              borderBottom: '1px dashed #cbd5e1',
              marginBottom: '0.85rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700, display: 'block' }}>
                  Official Admission Number
                </span>
                <span style={{ fontSize: '1.45rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--cpet-primary)' }}>
                  {completedEnrollment.admission_number}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(completedEnrollment.admission_number);
                  setCopiedAdm(true);
                  showToast('Admission number copied to clipboard!');
                  setTimeout(() => setCopiedAdm(false), 2500);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 600 }}
              >
                {copiedAdm ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copiedAdm ? 'Copied!' : 'Copy Adm. No'}</span>
              </button>
            </div>

            {/* Student & Course Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Student Name:</span>
                <strong style={{ color: 'var(--cpet-primary)', fontSize: '0.95rem' }}>{completedEnrollment.student_name}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Registered Mobile:</span>
                <strong style={{ color: '#334155' }}>+91 {completedEnrollment.account_phone}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Course / Program:</span>
                <strong style={{ color: '#334155' }}>{completedEnrollment.course_title}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Centre / Venue:</span>
                <strong style={{ color: '#334155' }}>{completedEnrollment.centre_name || 'Central Campus / Online'}</strong>
              </div>
            </div>
          </div>

          {/* Screenshot / Note Helper */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            color: '#92400e',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            marginBottom: '1.75rem',
            textAlign: 'center'
          }}>
            📸 <strong>Please Note:</strong> Take a screenshot or note down your <strong>Admission Number ({completedEnrollment.admission_number})</strong> for future communication and attendance.
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Primary Button: Explore Other Programs */}
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleBackToCatalog}
              style={{
                width: '100%',
                padding: '0.95rem 1.5rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
              }}
            >
              <BookOpen size={20} />
              <span>Explore Other Programs</span>
            </button>

            {/* Secondary Text Link to Track Progress */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setPhoneSearch(completedEnrollment.account_phone);
                setViewMode('lookup');
                handleLookup(null, completedEnrollment.account_phone);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Search size={15} />
              <span>Track Course Status & Results</span>
            </button>
          </div>
        </div>
      )}

      {viewMode === 'catalog' && (
        <CourseCatalog
          onSelectCourse={handleSelectCourse}
        />
      )}

      {viewMode === 'register' && (
        registeringCourse ? (
          <CourseRegistrationForm
            course={registeringCourse}
            onBack={handleBackToCatalog}
            onComplete={(newEnrollment) => {
              setCompletedEnrollment(newEnrollment);
              setViewMode('success');
              if (window.history.replaceState) {
                window.history.replaceState({}, '', window.location.pathname);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
              showToast(`Alhamdulillah! Registration complete for ${newEnrollment.student_name}`);
            }}
          />
        ) : (
          <div className="cpet-card" style={{ maxWidth: '680px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--cpet-primary)', marginBottom: '0.5rem' }}>Loading Course Registration...</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Fetching latest intake details from CPET database.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={handleBackToCatalog}>
              <ArrowLeft size={14} /> Back to All Courses
            </button>
          </div>
        )
      )}

      {viewMode === 'lookup' && (
        <div>
          {/* Phone Lookup Hero Card */}
          <div className="cpet-card" style={{ maxWidth: '620px', margin: '0 auto 1.5rem', textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--cpet-accent-soft)', color: 'var(--cpet-accent)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <GraduationCap size={26} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cpet-primary)', marginBottom: '0.4rem' }}>
              Track Your CPET Courses & Results
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              No login or password needed. Simply enter your mobile number to view your enrolled courses, exam marks, and completion status.
            </p>

            <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.5rem', maxWidth: '420px', margin: '0 auto' }}>
              <input
                type="tel"
                className="form-input"
                placeholder="Enter 10-digit Mobile Number"
                value={phoneSearch}
                onChange={e => {
                  setPhoneSearch(e.target.value);
                  setHasSearched(false);
                }}
                style={{ fontSize: '1.05rem', fontWeight: 600, textAlign: 'center' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem' }}>
                Lookup
              </button>
            </form>
          </div>

          {/* Lookup Results */}
          {hasSearched && (
            <div style={{ maxWidth: '820px', margin: '0 auto' }}>
              {accountData && accountData.members.length > 0 ? (
                <div>
                  {/* Family Members Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cpet-primary)' }}>
                      Profiles Registered Under +91 {accountData.account_phone}:
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                      {accountData.members.map(member => (
                        <button
                          key={member.id}
                          className={`btn ${selectedMember?.id === member.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          onClick={() => setSelectedMember(member)}
                        >
                          {member.full_name} ({member.relationship})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Member Profile Card */}
                  {selectedMember && (
                    <div>
                      <div className="cpet-card" style={{ marginBottom: '1.25rem', borderLeft: '4px solid var(--cpet-accent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--cpet-primary)', margin: 0 }}>
                              {selectedMember.full_name}
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
                              Gender: <strong style={{ color: selectedMember.gender?.toUpperCase() === 'FEMALE' ? '#be185d' : '#1d4ed8' }}>{selectedMember.gender ? (selectedMember.gender.toUpperCase() === 'FEMALE' ? 'Female' : 'Male') : 'Not specified'}</strong>
                              {selectedMember.date_of_birth && ` | DoB: ${selectedMember.date_of_birth}`} | Location: {selectedMember.place ? `${selectedMember.place}, ${selectedMember.district || ''}` : (selectedMember.district || 'Kerala')}
                            </p>
                          </div>
                          <button
                            className="btn btn-accent btn-sm"
                            onClick={() => setViewMode('catalog')}
                          >
                            <Plus size={14} /> Join Another Course
                          </button>
                        </div>
                      </div>

                      {/* Enrolled Courses Lifetime Transcript */}
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--cpet-primary)', marginBottom: '0.75rem' }}>
                        CPET Enrolled Programs & Academic Record ({memberEnrollments.length})
                      </h4>

                      <div className="mobile-card-list">
                        {memberEnrollments.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', color: '#64748b' }}>
                            No courses joined yet by this profile. Tap "Join Another Course" above!
                          </div>
                        ) : (
                          memberEnrollments.map(enr => {
                            const targetCourse = courses.find(c => c.id === enr.course_id);
                            const hasMarks = Object.keys(enr.marks || {}).length > 0;
                            const isPaid = enr.fee_status === 'OFFICE_CONFIRMED' || enr.fee_status === 'PAID_TO_RP' || enr.fee_status === 'PAID_ON_SPOT' || enr.fee_status === 'FREE';

                            return (
                              <div key={enr.id} className="mobile-data-card" style={{ padding: '1.25rem' }}>
                                <div className="card-top">
                                  <div>
                                    <h4 className="card-title" style={{ fontSize: '1.15rem' }}>{enr.course_title}</h4>
                                    <p className="card-subtitle">
                                      Centre / Venue: <strong>{enr.centre_name}</strong>
                                    </p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                                      {enr.admission_number}
                                    </span>
                                  </div>
                                </div>

                                {/* Status Pills */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                                  <span className={`badge ${enr.completion_status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
                                    {enr.completion_status.replace(/_/g, ' ')}
                                  </span>
                                  <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                                    Fee: {enr.fee_status.replace(/_/g, ' ')}
                                  </span>
                                </div>

                                {/* Academic Attendance / Marks Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', margin: '0.75rem 0' }}>
                                  <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Classes Attended:</span>
                                    <strong style={{ fontSize: '1rem', color: 'var(--cpet-primary)' }}>
                                      {enr.classes_attended || 0} Sessions
                                    </strong>
                                    {targetCourse?.total_planned_classes && (
                                      <span style={{ color: '#64748b', fontSize: '0.72rem', marginLeft: '4px' }}>
                                        / {targetCourse.total_planned_classes} planned
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Evaluation Status:</span>
                                    <strong style={{ fontSize: '0.95rem' }}>
                                      {targetCourse?.evaluation_type === 'EXAM_ONLY' && (hasMarks ? 'Graded' : 'Exam Awaited')}
                                      {targetCourse?.evaluation_type === 'ATTENDANCE_ONLY' && (enr.completion_status === 'COMPLETED' ? 'Attendance Fulfilled' : 'In Progress')}
                                      {targetCourse?.evaluation_type === 'HYBRID' && 'Continuous Evaluation'}
                                      {targetCourse?.evaluation_type === 'NONE' && (enr.completion_status === 'COMPLETED' ? 'Course Completed' : 'Participating')}
                                    </strong>
                                  </div>
                                </div>

                                {/* Subject Marks Breakdown */}
                                {hasMarks && targetCourse?.subjects && (
                                  <div style={{ marginTop: '0.5rem', borderTop: '1px solid #edf2f7', paddingTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cpet-primary)', display: 'block', marginBottom: '4px' }}>
                                      Subject Exam Results:
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                      {targetCourse.subjects.map(sub => (
                                        <div key={sub.id} style={{ background: 'white', border: '1px solid var(--cpet-border)', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                                          <span style={{ color: '#64748b' }}>{sub.name}: </span>
                                          <strong style={{ color: (enr.marks[sub.id] >= sub.pass_marks) ? '#16a34a' : '#dc2626' }}>
                                            {enr.marks[sub.id] !== undefined ? `${enr.marks[sub.id]} / ${sub.max_marks}` : 'N/A'}
                                          </strong>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)' }}>
                  <h3 style={{ color: 'var(--cpet-primary)', marginBottom: '0.5rem' }}>No Records Found</h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                    No student profile is currently linked to <strong>+91 {phoneSearch}</strong>. You can register for an upcoming course below!
                  </p>
                  <button className="btn btn-primary" onClick={() => setViewMode('catalog')}>
                    Browse Available Courses & Register
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
