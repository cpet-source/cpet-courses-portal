import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, CheckCircle, Clock, Calendar, BookOpen, MapPin, Edit2, Trash2 } from 'lucide-react';

export const RPClassLogger = () => {
  const { currentRp, centres, courses, classLogs, addClassLog, updateClassLog, deleteClassLog, showToast } = useApp();
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  const initialCourseId = courses[0]?.id || '';
  const initialCentresForCourse = centres.filter(c => {
    if (!initialCourseId) return false;
    return c.active_course_id === initialCourseId || (Array.isArray(c.course_ids) && c.course_ids.includes(initialCourseId));
  });

  // Form State for Adding
  const [formData, setFormData] = useState({
    course_id: initialCourseId,
    centre_id: initialCentresForCourse[0]?.id || '',
    class_date: new Date().toISOString().split('T')[0],
    session_type: 'REGULAR_CLASS',
    hours_spent: 2.0,
    syllabus_covered: ''
  });

  // Form State for Editing
  const [editFormData, setEditFormData] = useState({
    course_id: '',
    centre_id: '',
    class_date: '',
    session_type: 'REGULAR_CLASS',
    hours_spent: 2.0,
    syllabus_covered: ''
  });

  // Calculate centres running the currently selected course in Add form
  const availableCentresForAdd = formData.course_id
    ? centres.filter(c => c.active_course_id === formData.course_id || (Array.isArray(c.course_ids) && c.course_ids.includes(formData.course_id)))
    : [];

  // Calculate centres running the currently selected course in Edit form
  const availableCentresForEdit = editFormData.course_id
    ? centres.filter(c => c.active_course_id === editFormData.course_id || (Array.isArray(c.course_ids) && c.course_ids.includes(editFormData.course_id)))
    : [];

  const handleCourseChange = (newCourseId) => {
    const matchingCentres = centres.filter(c => {
      return c.active_course_id === newCourseId || (Array.isArray(c.course_ids) && c.course_ids.includes(newCourseId));
    });

    setFormData(prev => ({
      ...prev,
      course_id: newCourseId,
      centre_id: matchingCentres[0]?.id || ''
    }));
  };

  const handleEditCourseChange = (newCourseId) => {
    const matchingCentres = centres.filter(c => {
      return c.active_course_id === newCourseId || (Array.isArray(c.course_ids) && c.course_ids.includes(newCourseId));
    });

    setEditFormData(prev => ({
      ...prev,
      course_id: newCourseId,
      centre_id: matchingCentres[0]?.id || ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.course_id || !formData.centre_id || !formData.syllabus_covered) {
      showToast('Please select course, study centre, and syllabus covered', 'danger');
      return;
    }

    addClassLog({
      ...formData,
      travel_allowance: 0
    });
    setShowLogModal(false);

    const defaultCrsId = courses[0]?.id || '';
    const defCentres = centres.filter(c => c.active_course_id === defaultCrsId || (Array.isArray(c.course_ids) && c.course_ids.includes(defaultCrsId)));
    setFormData({
      course_id: defaultCrsId,
      centre_id: defCentres[0]?.id || '',
      class_date: new Date().toISOString().split('T')[0],
      session_type: 'REGULAR_CLASS',
      hours_spent: 2.0,
      syllabus_covered: ''
    });
  };

  const handleStartEdit = (log) => {
    setEditingLog(log);
    setEditFormData({
      course_id: log.course_id || '',
      centre_id: log.centre_id || '',
      class_date: log.class_date || new Date().toISOString().split('T')[0],
      session_type: log.session_type || 'REGULAR_CLASS',
      hours_spent: log.hours_spent || 2.0,
      syllabus_covered: log.syllabus_covered || ''
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editFormData.course_id || !editFormData.centre_id || !editFormData.syllabus_covered) {
      showToast('Please select course, study centre, and syllabus covered', 'danger');
      return;
    }

    updateClassLog(editingLog.id, {
      ...editFormData,
      travel_allowance: 0
    });
    setEditingLog(null);
  };

  // Filter logs for this RP and sort newest on top
  const rpLogs = classLogs.filter(l => l.rp_id === currentRp.id);
  const sortedLogs = [...rpLogs].sort((a, b) => {
    if (b.class_date !== a.class_date) {
      return (b.class_date || '').localeCompare(a.class_date || '');
    }
    return (b.id || '').localeCompare(a.id || '');
  });

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h3 className="cpet-card-title">
            <BookOpen size={20} />
            Class Log & Remuneration Claims
          </h3>
          <p className="cpet-card-desc">
            Log your classes in 1 minute to record sessions and calculate monthly remuneration claims.
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowLogModal(true)}>
          <Plus size={16} />
          Log Class Taken
        </button>
      </div>

      {/* Recent Logs List (Newest on Top) */}
      <div className="mobile-card-list">
        {sortedLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', color: '#64748b' }}>
            No class logs recorded yet. Tap "Log Class Taken" after conducting a session.
          </div>
        ) : (
          sortedLogs.map(log => (
            <div key={log.id} className="mobile-data-card">
              <div className="card-top">
                <div>
                  <h4 className="card-title">{log.centre_name}</h4>
                  <p className="card-subtitle">{log.course_title}</p>
                </div>
                <span className={`badge ${log.status === 'VERIFIED_BY_ADMIN' ? 'badge-success' : log.status === 'PAYMENT_PROCESSED' ? 'badge-neutral' : 'badge-warning'}`}>
                  {log.status === 'VERIFIED_BY_ADMIN' ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {log.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: 'var(--cpet-text)' }}>
                <strong>Topic:</strong> {log.syllabus_covered}
              </div>

              <div className="card-meta-row">
                <div className="card-meta-item">
                  <Calendar size={13} color="var(--cpet-accent)" />
                  <span>{log.class_date}</span>
                </div>
                <div className="card-meta-item">
                  <Clock size={13} />
                  <span>{log.session_type.replace('_', ' ')} ({log.hours_spent}h)</span>
                </div>
                <div className="card-meta-item" style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--cpet-primary)' }}>
                  <span>Claim: ₹{log.total_claim}</span>
                </div>
              </div>

              {log.admin_notes && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#16a34a', background: '#f0fdf4', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                  Office Note: {log.admin_notes}
                </div>
              )}

              {/* Action Buttons: Edit and Delete */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                  onClick={() => handleStartEdit(log)}
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#dc2626' }}
                  onClick={() => {
                    if (window.confirm(`Delete class log for "${log.centre_name}" on ${log.class_date}?`)) {
                      deleteClassLog(log.id);
                    }
                  }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 1-Minute Class Log Modal / Add */}
      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Class Taken (1-Minute Entry)</h3>
              <button className="modal-close-btn" onClick={() => setShowLogModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
                    1. Course / Program <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    required
                    value={formData.course_id}
                    onChange={e => handleCourseChange(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="">-- Select Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.course_code}) [{c.category?.replace('_', ' ')}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
                    2. Study Centre <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    required
                    disabled={!formData.course_id}
                    value={formData.centre_id}
                    onChange={e => setFormData({ ...formData, centre_id: e.target.value })}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="">
                      {!formData.course_id
                        ? '-- Please Select Course First --'
                        : availableCentresForAdd.length === 0
                        ? '-- No Centres Registered for this Course --'
                        : '-- Select Study Centre --'}
                    </option>
                    {availableCentresForAdd.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.centre_name} ({c.place}, {c.district})
                      </option>
                    ))}
                  </select>
                  <span className="form-helper">
                    Only centres registered for the selected course are displayed.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Class Date <span className="required">*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={formData.class_date}
                      onChange={e => setFormData({ ...formData, class_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session Type</label>
                    <select
                      className="form-select"
                      value={formData.session_type}
                      onChange={e => setFormData({ ...formData, session_type: e.target.value })}
                    >
                      <option value="REGULAR_CLASS">Regular Class</option>
                      <option value="SPECIAL_CLASS">Special Class</option>
                      <option value="EXAM">Exam / Assessment</option>
                      <option value="ORIENTATION">Orientation Session</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={formData.hours_spent}
                    onChange={e => setFormData({ ...formData, hours_spent: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Syllabus / Chapter Covered <span className="required">*</span></label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    required
                    placeholder="Briefly state topics taught or chapters covered..."
                    value={formData.syllabus_covered}
                    onChange={e => setFormData({ ...formData, syllabus_covered: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent">
                  <CheckCircle size={16} /> Submit Class Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Log Modal */}
      {editingLog && (
        <div className="modal-overlay" onClick={() => setEditingLog(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Class Log</h3>
              <button className="modal-close-btn" onClick={() => setEditingLog(null)}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
                    1. Course / Program <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    required
                    value={editFormData.course_id}
                    onChange={e => handleEditCourseChange(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="">-- Select Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.course_code}) [{c.category?.replace('_', ' ')}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
                    2. Study Centre <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    required
                    disabled={!editFormData.course_id}
                    value={editFormData.centre_id}
                    onChange={e => setEditFormData({ ...editFormData, centre_id: e.target.value })}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="">
                      {!editFormData.course_id
                        ? '-- Please Select Course First --'
                        : availableCentresForEdit.length === 0
                        ? '-- No Centres Registered for this Course --'
                        : '-- Select Study Centre --'}
                    </option>
                    {availableCentresForEdit.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.centre_name} ({c.place}, {c.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Class Date <span className="required">*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={editFormData.class_date}
                      onChange={e => setEditFormData({ ...editFormData, class_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session Type</label>
                    <select
                      className="form-select"
                      value={editFormData.session_type}
                      onChange={e => setEditFormData({ ...editFormData, session_type: e.target.value })}
                    >
                      <option value="REGULAR_CLASS">Regular Class</option>
                      <option value="SPECIAL_CLASS">Special Class</option>
                      <option value="EXAM">Exam / Assessment</option>
                      <option value="ORIENTATION">Orientation Session</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={editFormData.hours_spent}
                    onChange={e => setEditFormData({ ...editFormData, hours_spent: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Syllabus / Chapter Covered <span className="required">*</span></label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    required
                    placeholder="Briefly state topics taught or chapters covered..."
                    value={editFormData.syllabus_covered}
                    onChange={e => setEditFormData({ ...editFormData, syllabus_covered: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingLog(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Class Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
