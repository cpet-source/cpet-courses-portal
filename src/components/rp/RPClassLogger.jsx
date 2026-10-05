import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, CheckCircle, Clock, Calendar, BookOpen, MapPin, DollarSign } from 'lucide-react';

export const RPClassLogger = () => {
  const { currentRp, centres, courses, classLogs, addClassLog, showToast } = useApp();
  const [showLogModal, setShowLogModal] = useState(false);

  // RP's assigned centres
  const assignedCentres = centres.filter(c => c.assigned_rp_id === currentRp.id);
  const rpLogs = classLogs.filter(l => l.rp_id === currentRp.id);

  const initialCourseId = courses[0]?.id || '';
  const initialCentresForCourse = centres.filter(c => {
    if (!initialCourseId) return true;
    const isDirect = c.active_course_id === initialCourseId;
    const inList = Array.isArray(c.course_ids) && c.course_ids.includes(initialCourseId);
    return isDirect || inList;
  });

  // Form State
  const [formData, setFormData] = useState({
    course_id: initialCourseId,
    centre_id: initialCentresForCourse[0]?.id || assignedCentres[0]?.id || centres[0]?.id || '',
    class_date: new Date().toISOString().split('T')[0],
    session_type: 'REGULAR_CLASS',
    hours_spent: 2.0,
    syllabus_covered: '',
    travel_allowance: 0
  });

  // Calculate centres running the currently selected course in form
  const availableCentresForCourse = centres.filter(c => {
    if (!formData.course_id) return true;
    const isDirect = c.active_course_id === formData.course_id;
    const inList = Array.isArray(c.course_ids) && c.course_ids.includes(formData.course_id);
    return isDirect || inList;
  });

  const displayedCentres = availableCentresForCourse.length > 0 ? availableCentresForCourse : centres;

  const handleCourseChange = (newCourseId) => {
    const matchingCentres = centres.filter(c => {
      const isDirect = c.active_course_id === newCourseId;
      const inList = Array.isArray(c.course_ids) && c.course_ids.includes(newCourseId);
      return isDirect || inList;
    });

    setFormData(prev => ({
      ...prev,
      course_id: newCourseId,
      centre_id: matchingCentres[0]?.id || (prev.centre_id && centres.some(c => c.id === prev.centre_id) ? prev.centre_id : centres[0]?.id || '')
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.course_id || !formData.centre_id || !formData.syllabus_covered) {
      showToast('Please select course, centre, and topic covered', 'danger');
      return;
    }

    addClassLog(formData);
    setShowLogModal(false);
    setFormData({
      course_id: courses[0]?.id || '',
      centre_id: initialCentresForCourse[0]?.id || assignedCentres[0]?.id || centres[0]?.id || '',
      class_date: new Date().toISOString().split('T')[0],
      session_type: 'REGULAR_CLASS',
      hours_spent: 2.0,
      syllabus_covered: '',
      travel_allowance: 0
    });
  };

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h3 className="cpet-card-title">
            <BookOpen size={20} />
            Class Log & Remuneration Claims
          </h3>
          <p className="cpet-card-desc">
            Replaces WhatsApp group reporting. Log your classes in 1 minute to calculate and verify monthly remuneration.
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowLogModal(true)}>
          <Plus size={16} />
          Log Class Taken
        </button>
      </div>

      {/* Recent Logs List (Mobile Optimized) */}
      <div className="mobile-card-list">
        {rpLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', color: '#64748b' }}>
            No class logs recorded yet. Tap "Log Class Taken" after conducting a session.
          </div>
        ) : (
          rpLogs.map(log => (
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
                  {log.travel_allowance > 0 && (
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}> (incl. ₹{log.travel_allowance} TA)</span>
                  )}
                </div>
              </div>

              {log.admin_notes && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#16a34a', background: '#f0fdf4', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                  Office Note: {log.admin_notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 1-Minute Class Log Modal / Bottom Sheet */}
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
                        {c.title} ({c.course_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--cpet-primary)' }}>
                    2. Study Centre (Under this Course) <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    required
                    value={formData.centre_id}
                    onChange={e => setFormData({ ...formData, centre_id: e.target.value })}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="">-- Select Study Centre --</option>
                    {displayedCentres.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.centre_name} ({c.place}, {c.district})
                      </option>
                    ))}
                  </select>
                  {formData.course_id && availableCentresForCourse.length === 0 && (
                    <span className="form-helper" style={{ color: '#d97706' }}>
                      Notice: Showing all centres as this course is not yet tagged to a specific centre.
                    </span>
                  )}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                    <label className="form-label">Travel Claim (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 200"
                      value={formData.travel_allowance}
                      onChange={e => setFormData({ ...formData, travel_allowance: Number(e.target.value) })}
                    />
                  </div>
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
    </div>
  );
};
