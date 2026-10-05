import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, UserPlus, CheckCircle, Award, DollarSign, Search, Phone, FileText, Check } from 'lucide-react';

export const RPCentreStudents = () => {
  const { currentRp, centres, courses, enrollments, lookupStudentByPhone, registerOrEnrollStudent, updateStudentMarks, updateStudentFee, markStudentAttendance, showToast } = useApp();

  const assignedCentres = centres.filter(c => c.assigned_rp_id === currentRp.id);
  const [selectedCentreId, setSelectedCentreId] = useState(assignedCentres[0]?.id || centres[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState(null);

  // Add Student Form State
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

  const activeCentre = centres.find(c => c.id === selectedCentreId);
  const activeCourse = courses.find(c => c.id === activeCentre?.active_course_id) || courses[0];

  // Students in this centre
  const centreStudents = enrollments.filter(e => e.centre_id === selectedCentreId);
  const filteredStudents = centreStudents.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.student_name.toLowerCase().includes(q) || e.account_phone.includes(q) || e.admission_number.toLowerCase().includes(q);
  });

  // Handle Phone Lookup in Add Student
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

  const handleEnrollSubmit = (e) => {
    e.preventDefault();
    if (!activeCourse) {
      showToast('Please select a course for this centre', 'danger');
      return;
    }

    registerOrEnrollStudent({
      phone: phoneInput,
      existingMemberId: selectedMemberId,
      newMemberData: newMemberForm,
      courseId: activeCourse.id,
      centreId: selectedCentreId,
      feeStatus: 'PAID_TO_RP',
      amountPaid: activeCourse.standard_fee
    });

    setShowAddStudentModal(false);
    setPhoneInput('');
    setLookupResult(null);
    setHasSearchedPhone(false);
  };

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h3 className="cpet-card-title">
            <Users size={20} />
            Centre Student Roster & Evaluation
          </h3>
          <p className="cpet-card-desc">
            Manage your enrolled students, collect course fees, mark attendance, and input subject exam scores.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddStudentModal(true)}>
          <UserPlus size={16} />
          Onboard Student
        </button>
      </div>

      {/* Centre Selector */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label className="form-label">Active Mahallu Centre:</label>
          <select
            className="form-select"
            value={selectedCentreId}
            onChange={e => setSelectedCentreId(e.target.value)}
            style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}
          >
            {centres.map(c => (
              <option key={c.id} value={c.id}>
                {c.centre_name} ({c.place})
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <label className="form-label">Search in this Centre:</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.2rem' }}
              placeholder="Name, Phone, or Adm No..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Student List (Mobile Optimized) */}
      <div className="mobile-card-list">
        {filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', color: '#64748b' }}>
            No students enrolled at this study centre yet. Tap "Onboard Student" to register candidates.
          </div>
        ) : (
          filteredStudents.map(student => {
            const isFeePaid = student.fee_status === 'PAID_TO_RP' || student.fee_status === 'OFFICE_CONFIRMED';

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
                    {student.fee_status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Academic & Attendance Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', margin: '0.5rem 0' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Attendance</span>
                    <strong>{student.classes_attended || 0} Sessions</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Exam Status</span>
                    <strong>
                      {Object.keys(student.marks || {}).length > 0
                        ? `${Object.keys(student.marks).length} Subject(s) Graded`
                        : 'No Marks Entered'}
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
                    title="Mark attendance for today"
                  >
                    +1 Class Attended
                  </button>

                  {/* Fee Collection Tap */}
                  {!isFeePaid && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => updateStudentFee(student.id, 'PAID_TO_RP', activeCourse.standard_fee)}
                    >
                      <DollarSign size={13} /> Collect ₹{activeCourse.standard_fee}
                    </button>
                  )}

                  {/* Mark Entry Modal Trigger */}
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

      {/* Enter Marks Modal */}
      {selectedStudentForMarks && (
        <div className="modal-overlay" onClick={() => setSelectedStudentForMarks(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Subject Marks Entry</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Student: {selectedStudentForMarks.student_name} ({selectedStudentForMarks.admission_number})
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedStudentForMarks(null)}>✕</button>
            </div>

            <div className="modal-body">
              {(!activeCourse?.subjects || activeCourse.subjects.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                  This course is evaluated by attendance only. No exam subjects configured.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeCourse.subjects.map(subject => {
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

      {/* Onboard Student Modal (Phone-Based Universal Lookup) */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Onboard Student at Centre</h3>
              <button className="modal-close-btn" onClick={() => setShowAddStudentModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Step 1: Phone Lookup */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', marginBottom: '1.25rem' }}>
                <label className="form-label">Enter Student Mobile Number (10 Digits):</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9895112233"
                    value={phoneInput}
                    onChange={e => {
                      setPhoneInput(e.target.value);
                      setHasSearchedPhone(false);
                    }}
                  />
                  <button className="btn btn-primary" onClick={handlePhoneCheck}>
                    Check Phone
                  </button>
                </div>
                <span className="form-helper">
                  Checks if family members are already registered in the CPET lifetime database.
                </span>
              </div>

              {/* Step 2: Show Results */}
              {hasSearchedPhone && (
                <form onSubmit={handleEnrollSubmit}>
                  {lookupResult && lookupResult.members.length > 0 ? (
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

                  {/* New Profile Fields (if adding new member or new account) */}
                  {(selectedMemberId === null) && (
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
                    <button type="submit" className="btn btn-primary">
                      Enroll & Generate Admission Number
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
