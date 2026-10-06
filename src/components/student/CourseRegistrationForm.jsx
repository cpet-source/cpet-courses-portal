import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, ArrowLeft, Building, Calendar, DollarSign, HelpCircle, Phone, User, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

export const CourseRegistrationForm = ({ course, onBack, onComplete }) => {
  const { centres, lookupStudentByPhone, registerOrEnrollStudent, showToast } = useApp();

  // Step 1: Phone check
  const [phone, setPhone] = useState('');
  const [hasCheckedPhone, setHasCheckedPhone] = useState(false);
  const [existingAccount, setExistingAccount] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // New Profile Form (if creating new member)
  const [newMemberData, setNewMemberData] = useState({
    full_name: '',
    gender: 'MALE',
    date_of_birth: '',
    place: '',
    district: 'Malappuram',
    relationship: 'Self'
  });

  // Centre Selection (ONLY for Mahallu Courses)
  const isMahallu = course?.category === 'MAHALLU';
  const availableCentres = centres.filter(c => {
    if (!isMahallu || !course) return false;
    if (c.status === 'INACTIVE') return false;
    if (Array.isArray(c.completed_course_ids) && c.completed_course_ids.includes(course.id)) return false;
    const isDirect = c.active_course_id === course.id;
    const inList = Array.isArray(c.course_ids) && c.course_ids.includes(course.id);
    return isDirect || inList;
  });
  const [selectedCentreId, setSelectedCentreId] = useState(availableCentres[0]?.id || '');

  useEffect(() => {
    if (isMahallu && availableCentres.length > 0 && !availableCentres.some(c => c.id === selectedCentreId)) {
      setSelectedCentreId(availableCentres[0].id);
    }
  }, [course, availableCentres, selectedCentreId, isMahallu]);

  // Dynamic Custom Intake Responses
  const [customAnswers, setCustomAnswers] = useState({});

  // Payment details (if Pay at Registration)
  const [paymentUtr, setPaymentUtr] = useState('');

  if (!course) {
    return (
      <div className="cpet-card" style={{ maxWidth: '680px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem' }}>
        <h3 style={{ color: 'var(--cpet-primary)', marginBottom: '0.5rem' }}>Course Details Loading...</h3>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Please return to the catalog if this does not load shortly.
        </p>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Courses
        </button>
      </div>
    );
  }

  // Deadline & Registration Status computation
  const isClosed = course.registration_status === 'CLOSED';
  const isUpcoming = course.registration_status === 'UPCOMING';

  let daysRemaining = null;
  let isDeadlinePassed = false;
  if (course.registration_deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(course.registration_deadline);
    deadline.setHours(23, 59, 59, 999);
    const diffTime = deadline.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      isDeadlinePassed = true;
    }
  }

  const isRegistrationBlocked = isClosed || isUpcoming || isDeadlinePassed;



  const handlePhoneLookup = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'danger');
      return;
    }
    const found = lookupStudentByPhone(phone);
    setExistingAccount(found);
    setHasCheckedPhone(true);
    if (found && found.members.length > 0) {
      setSelectedMemberId(found.members[0].id);
    } else {
      setSelectedMemberId(null);
    }
  };

  const handleCustomAnswerChange = (questionId, value) => {
    setCustomAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId, option, isChecked) => {
    setCustomAnswers(prev => {
      const currentList = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      if (isChecked) {
        return { ...prev, [questionId]: [...currentList, option] };
      } else {
        return { ...prev, [questionId]: currentList.filter(o => o !== option) };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate custom required questions
    for (const q of (course.custom_questions || [])) {
      if (q.required && (!customAnswers[q.id] || customAnswers[q.id].length === 0)) {
        showToast(`Please answer the required question: "${q.label}"`, 'danger');
        return;
      }
    }

    if (isMahallu && !selectedCentreId) {
      showToast('Please select your study centre for this Mahallu course', 'danger');
      return;
    }

    let initialFeeStatus = 'PENDING';
    if (course.payment_policy === 'FREE_COURSE') initialFeeStatus = 'FREE';
    else if (course.payment_policy === 'COLLECTED_BY_RP') initialFeeStatus = 'PENDING';
    else if (course.payment_policy === 'PAY_AT_REGISTRATION' && paymentUtr) initialFeeStatus = 'PENDING';
    else if (course.payment_policy === 'PAY_ON_SPOT') initialFeeStatus = 'PENDING';
    else if (course.payment_policy === 'PAY_AFTER_CONFIRMATION') initialFeeStatus = 'PENDING';

    const enrollment = registerOrEnrollStudent({
      phone,
      existingMemberId: selectedMemberId,
      newMemberData,
      courseId: course.id,
      centreId: course.category === 'MAHALLU' ? selectedCentreId : null,
      customResponses: {
        ...customAnswers,
        ...(paymentUtr ? { 'Payment UTR / Ref': paymentUtr } : {})
      },
      feeStatus: initialFeeStatus,
      amountPaid: (course.payment_policy === 'FREE_COURSE' ? 0 : course.standard_fee)
    });

    if (onComplete) {
      onComplete(enrollment);
    }
  };

  return (
    <div className="cpet-card" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={14} /> Back to Courses
      </button>

      {/* Course Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--cpet-primary) 0%, var(--cpet-accent) 100%)', color: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
        <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', marginBottom: '0.4rem' }}>
          {course.category.replace('_', ' ')}
        </span>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.2rem 0' }}>{course.title}</h2>
        <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: 0 }}>{course.description}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.82rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.5rem' }}>
          {!isMahallu && (
            <span>Fee: <strong>{course.standard_fee > 0 ? `₹${course.standard_fee}` : 'FREE'}</strong></span>
          )}
          <span>Classes: <strong>{course.total_planned_classes} Sessions</strong></span>
          <span>Mode: <strong>{course.evaluation_type.replace('_', ' ')}</strong></span>
        </div>
      </div>

      {/* Registration Timeline / Closed Banner */}
      {isClosed && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertCircle size={22} color="#dc2626" />
          <div>
            <strong style={{ color: '#991b1b', display: 'block', fontSize: '0.92rem' }}>Registration Closed</strong>
            <span style={{ fontSize: '0.82rem', color: '#b91c1c' }}>
              Admissions for this program are currently closed. Please check back for upcoming batches.
            </span>
          </div>
        </div>
      )}

      {isUpcoming && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Clock size={22} color="#2563eb" />
          <div>
            <strong style={{ color: '#1e40af', display: 'block', fontSize: '0.92rem' }}>Registration Opening Soon</strong>
            <span style={{ fontSize: '0.82rem', color: '#1d4ed8' }}>
              Applications for this program will open soon. Please stay tuned!
            </span>
          </div>
        </div>
      )}

      {!isClosed && !isUpcoming && isDeadlinePassed && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertCircle size={22} color="#dc2626" />
          <div>
            <strong style={{ color: '#991b1b', display: 'block', fontSize: '0.92rem' }}>Application Deadline Passed</strong>
            <span style={{ fontSize: '0.82rem', color: '#b91c1c' }}>
              The registration deadline ({course.registration_deadline}) has ended.
            </span>
          </div>
        </div>
      )}

      {!isClosed && !isUpcoming && !isDeadlinePassed && daysRemaining !== null && (
        <div style={{ background: daysRemaining <= 3 ? '#fffbeb' : '#f0fdf4', border: daysRemaining <= 3 ? '1px solid #fde68a' : '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Clock size={18} color={daysRemaining <= 3 ? '#d97706' : '#16a34a'} />
          <div style={{ fontSize: '0.85rem', color: daysRemaining <= 3 ? '#92400e' : '#166534', fontWeight: 600 }}>
            {daysRemaining === 0 ? '🔥 Last day to apply! Registration closes tonight.' : `⏳ Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left to register! (Deadline: ${course.registration_deadline})`}
          </div>
        </div>
      )}

      {/* Step 1: Mobile Phone Verification */}
      {!hasCheckedPhone ? (
        <form onSubmit={handlePhoneLookup}>
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cpet-primary)', marginBottom: '0.4rem' }}>
              Step 1: Enter Your Mobile Number
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              No password needed! Entering your phone number links all your courses together into one lifetime CPET record.
            </p>

            <div className="form-group">
              <label className="form-label">WhatsApp / Contact Mobile Number <span className="required">*</span></label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="tel"
                  className="form-input"
                  required
                  disabled={isRegistrationBlocked}
                  placeholder="e.g. 9895112233"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ fontSize: '1.05rem', fontWeight: 600 }}
                />
                <button type="submit" className="btn btn-primary" disabled={isRegistrationBlocked}>
                  Continue
                </button>
              </div>
              {isRegistrationBlocked && (
                <span className="form-helper" style={{ color: '#dc2626' }}>
                  Admissions for this program are currently closed.
                </span>
              )}
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Registering with Mobile:</span>
              <strong style={{ display: 'block', color: 'var(--cpet-primary)' }}>+91 {phone}</strong>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => { setHasCheckedPhone(false); setExistingAccount(null); }}
            >
              Change Phone
            </button>
          </div>

          {/* Family Member Selection (if existing phone) */}
          {existingAccount && existingAccount.members.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Select Student Profile:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {existingAccount.members.map(member => (
                  <label
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem',
                      border: selectedMemberId === member.id ? '2px solid var(--cpet-primary)' : '1px solid var(--cpet-border)',
                      borderRadius: 'var(--radius-md)',
                      background: selectedMemberId === member.id ? '#f1f5f9' : 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="student_member"
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
                    gap: '0.6rem',
                    padding: '0.75rem',
                    border: selectedMemberId === null ? '2px solid var(--cpet-accent)' : '1px solid var(--cpet-border)',
                    borderRadius: 'var(--radius-md)',
                    background: selectedMemberId === null ? 'var(--cpet-accent-soft)' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="student_member"
                    checked={selectedMemberId === null}
                    onChange={() => setSelectedMemberId(null)}
                  />
                  <strong style={{ color: 'var(--cpet-accent)' }}>+ Register a New Family Member</strong>
                </label>
              </div>
            </div>
          )}

          {/* New Profile Fields */}
          {(!existingAccount || selectedMemberId === null) && (
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', marginBottom: '1.25rem' }}>
              <h4 style={{ color: 'var(--cpet-primary)', marginBottom: '0.75rem', fontWeight: 800 }}>
                Student Biodata
              </h4>
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Enter full name"
                  value={newMemberData.full_name}
                  onChange={e => setNewMemberData({ ...newMemberData, full_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Gender <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={newMemberData.gender}
                    onChange={e => setNewMemberData({ ...newMemberData, gender: e.target.value })}
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
                    value={newMemberData.date_of_birth}
                    onChange={e => setNewMemberData({ ...newMemberData, date_of_birth: e.target.value })}
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
                    value={newMemberData.place}
                    onChange={e => setNewMemberData({ ...newMemberData, place: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship to Phone Owner</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Self, Son, Daughter, Mother"
                    value={newMemberData.relationship}
                    onChange={e => setNewMemberData({ ...newMemberData, relationship: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mahallu Centre Selector (ONLY if Mahallu Course) */}
          {isMahallu && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
                Select Your Mahallu Study Centre <span className="required">*</span>
              </label>
              {availableCentres.length === 0 ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '0.85rem', color: '#991b1b', fontSize: '0.85rem' }}>
                  No study centres are currently open for enrollment under this Mahallu course. Please contact your local Mahallu committee or CPET office.
                </div>
              ) : (
                <select
                  className="form-select"
                  required
                  value={selectedCentreId}
                  onChange={e => setSelectedCentreId(e.target.value)}
                  style={{ fontWeight: 700 }}
                >
                  <option value="">-- Choose Study Centre --</option>
                  {availableCentres.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.centre_name} ({c.place}, {c.district})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Dynamic Custom Intake Questions ("Google Form Killer") */}
          {course.custom_questions && course.custom_questions.length > 0 && (
            <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)' }}>
              <h4 style={{ color: 'var(--cpet-primary)', marginBottom: '0.75rem', fontWeight: 800 }}>
                Course Intake Questions
              </h4>

              {course.custom_questions.map(q => (
                <div key={q.id} className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    {q.label} {q.required && <span className="required">*</span>}
                  </label>

                  {q.type === 'SHORT_TEXT' && (
                    <input
                      type="text"
                      className="form-input"
                      required={q.required}
                      placeholder={q.placeholder || 'Your answer'}
                      value={customAnswers[q.id] || ''}
                      onChange={e => handleCustomAnswerChange(q.id, e.target.value)}
                    />
                  )}

                  {q.type === 'PARAGRAPH' && (
                    <textarea
                      className="form-textarea"
                      rows="2"
                      required={q.required}
                      placeholder={q.placeholder || 'Your answer...'}
                      value={customAnswers[q.id] || ''}
                      onChange={e => handleCustomAnswerChange(q.id, e.target.value)}
                    />
                  )}

                  {q.type === 'DROPDOWN' && (
                    <select
                      className="form-select"
                      required={q.required}
                      value={customAnswers[q.id] || ''}
                      onChange={e => handleCustomAnswerChange(q.id, e.target.value)}
                    >
                      <option value="">-- Select Choice --</option>
                      {q.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {q.type === 'RADIO' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {q.options.map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`radio_${q.id}`}
                            required={q.required}
                            checked={customAnswers[q.id] === opt}
                            onChange={() => handleCustomAnswerChange(q.id, opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'CHECKBOX' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {q.options.map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Array.isArray(customAnswers[q.id]) && customAnswers[q.id].includes(opt)}
                            onChange={(e) => handleCheckboxChange(q.id, opt, e.target.checked)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'NUMBER' && (
                    <input
                      type="number"
                      className="form-input"
                      required={q.required}
                      placeholder={q.placeholder || '0'}
                      value={customAnswers[q.id] || ''}
                      onChange={e => handleCustomAnswerChange(q.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Payment Section based on Course Policy */}
          {isMahallu ? (
            <div style={{ background: '#ecfdf5', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid #a7f3d0', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#065f46', margin: 0, fontWeight: 600 }}>
                🤝 <strong>Fee Collected at Study Centre:</strong> The course fee will be collected directly at your Mahallu study centre by the course coordinator / Resource Person.
              </p>
            </div>
          ) : (
            course.standard_fee > 0 && (
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--cpet-primary)', marginBottom: '0.4rem', fontWeight: 800 }}>
                  Course Fee: ₹{course.standard_fee.toLocaleString('en-IN')}
                </h4>

                {course.payment_policy === 'PAY_AT_REGISTRATION' && (
                  <div>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      Please transfer the course fee to the CPET Bank Account or scan our UPI QR code and enter the UTR/Reference number below:
                    </p>
                    <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                      <div>Account: <strong>CPET Darul Huda Islamic University</strong></div>
                      <div>Bank: <strong>SBI Chemmad Branch</strong> | IFSC: <strong>SBIN0070188</strong></div>
                      <div>UPI ID: <strong>cpet@sbi</strong></div>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Payment UTR / Transaction Ref No <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="e.g. 492810482910"
                        value={paymentUtr}
                        onChange={e => setPaymentUtr(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {course.payment_policy === 'COLLECTED_BY_RP' && (
                  <div style={{ background: '#ecfdf5', padding: '0.85rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    <p style={{ fontSize: '0.85rem', color: '#065f46', margin: 0, fontWeight: 600 }}>
                      🤝 <strong>Fee Collected by Resource Person:</strong> You do not need to pay online now. The course fee will be collected in person by your assigned Resource Person / Mahallu Study Centre coordinator.
                    </p>
                  </div>
                )}

                {course.payment_policy === 'PAY_AFTER_CONFIRMATION' && (
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                    ℹ️ <strong>Pay on Confirmation:</strong> Your application will be reviewed by the CPET admissions team. We will contact you via WhatsApp / Phone to confirm your seat before collecting fees.
                  </p>
                )}

                {course.payment_policy === 'PAY_ON_SPOT' && (
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                    ℹ️ <strong>Pay on Spot:</strong> You can pay the registration fee of ₹{course.standard_fee} in cash or UPI at the entrance reception desk on the day of the event.
                  </p>
                )}
              </div>
            )
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isRegistrationBlocked || (isMahallu && availableCentres.length === 0)}
            style={{ fontSize: '1rem', padding: '0.85rem' }}
          >
            <CheckCircle size={18} /> Confirm Registration & Generate Admission No.
          </button>
        </form>
      )}
    </div>
  );
};
