import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Plus, Trash2, Edit2, Link, CheckCircle, ExternalLink, HelpCircle, FileText } from 'lucide-react';

export const CoursesManager = () => {
  const { courses, addCourse, updateCourse, showToast, setActiveRole } = useApp();
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    course_code: '',
    category: 'MAHALLU',
    description: '',
    evaluation_type: 'EXAM_ONLY',
    payment_policy: 'PAY_AT_REGISTRATION',
    min_attendance_percentage: 75,
    total_planned_classes: 24,
    standard_fee: 1500,
    default_rp_remuneration_per_class: 800,
    admission_no_pattern: 'CPET-{CODE}-26-{SEQ}',
    subjects: [
      { id: 'sub-1', name: 'Primary Syllabus Subject', code: 'SUB1', max_marks: 100, pass_marks: 40 }
    ],
    custom_questions: []
  });

  const resetForm = () => {
    setFormData({
      title: '',
      course_code: '',
      category: 'MAHALLU',
      description: '',
      evaluation_type: 'EXAM_ONLY',
      payment_policy: 'PAY_AT_REGISTRATION',
      min_attendance_percentage: 75,
      total_planned_classes: 24,
      standard_fee: 1500,
      default_rp_remuneration_per_class: 800,
      admission_no_pattern: 'CPET-{CODE}-26-{SEQ}',
      subjects: [
        { id: 'sub-1', name: 'Primary Syllabus Subject', code: 'SUB1', max_marks: 100, pass_marks: 40 }
      ],
      custom_questions: []
    });
    setEditingCourseId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourseId(course.id);
    setFormData({
      title: course.title || '',
      course_code: course.course_code || '',
      category: course.category || 'MAHALLU',
      description: course.description || '',
      evaluation_type: course.evaluation_type || 'EXAM_ONLY',
      payment_policy: course.payment_policy || 'PAY_AT_REGISTRATION',
      min_attendance_percentage: course.min_attendance_percentage || 75,
      total_planned_classes: course.total_planned_classes || 24,
      standard_fee: course.standard_fee || 0,
      default_rp_remuneration_per_class: course.default_rp_remuneration_per_class || 0,
      admission_no_pattern: course.admission_no_pattern || 'CPET-{CODE}-26-{SEQ}',
      subjects: course.subjects || [],
      custom_questions: course.custom_questions || []
    });
    setShowModal(true);
  };

  // Subject Builder Handlers
  const addSubject = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        { id: `sub-${Date.now()}`, name: '', code: '', max_marks: 100, pass_marks: 40 }
      ]
    }));
  };

  const updateSubjectField = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.subjects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, subjects: updated };
    });
  };

  const removeSubject = (index) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  // Dynamic Custom Intake Question Builder ("Google Form Killer")
  const addCustomQuestion = () => {
    setFormData(prev => ({
      ...prev,
      custom_questions: [
        ...prev.custom_questions,
        {
          id: `q-${Date.now()}`,
          label: '',
          type: 'SHORT_TEXT',
          required: true,
          options: [],
          rawOptionsText: '',
          placeholder: ''
        }
      ]
    }));
  };

  const updateQuestionField = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.custom_questions];
      if (field === 'rawOptionsText') {
        const parsedOptions = value.split(',').map(s => s.trim()).filter(Boolean);
        updated[index] = { ...updated[index], rawOptionsText: value, options: parsedOptions };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, custom_questions: updated };
    });
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      custom_questions: prev.custom_questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.course_code) {
      showToast('Please provide course title and short code', 'danger');
      return;
    }

    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingCourseId) {
      updateCourse(editingCourseId, {
        ...formData,
        slug
      });
    } else {
      addCourse({
        ...formData,
        slug
      });
    }
    setShowModal(false);
  };

  const filteredCourses = courses.filter(c => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'MAHALLU') return c.category === 'MAHALLU';
    if (filterCategory === 'GENERAL_ONLINE') return c.category === 'GENERAL_ONLINE';
    if (filterCategory === 'GENERAL_OFFLINE') return c.category === 'GENERAL_OFFLINE';
    return true;
  });

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h2 className="cpet-card-title">
            <BookOpen size={22} />
            Course Master & Intake Builder
          </h2>
          <p className="cpet-card-desc">
            Define Mahallu study programs, online diplomas, and workshops with custom dynamic intake questionnaires ("Google Form Killer").
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Create New Course
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="cpet-tabs" style={{ marginBottom: '1.25rem' }}>
        <button
          className={`tab-btn ${filterCategory === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterCategory('ALL')}
        >
          All Courses ({courses.length})
        </button>
        <button
          className={`tab-btn ${filterCategory === 'MAHALLU' ? 'active' : ''}`}
          onClick={() => setFilterCategory('MAHALLU')}
        >
          Mahallu-Based ({courses.filter(c => c.category === 'MAHALLU').length})
        </button>
        <button
          className={`tab-btn ${filterCategory === 'GENERAL_ONLINE' ? 'active' : ''}`}
          onClick={() => setFilterCategory('GENERAL_ONLINE')}
        >
          General Online ({courses.filter(c => c.category === 'GENERAL_ONLINE').length})
        </button>
        <button
          className={`tab-btn ${filterCategory === 'GENERAL_OFFLINE' ? 'active' : ''}`}
          onClick={() => setFilterCategory('GENERAL_OFFLINE')}
        >
          General Offline & Camps ({courses.filter(c => c.category === 'GENERAL_OFFLINE').length})
        </button>
      </div>

      {/* Course List Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredCourses.map(course => (
          <div key={course.id} className="cpet-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                <span className={`badge ${
                  course.category === 'MAHALLU' ? 'badge-primary' :
                  course.category === 'GENERAL_ONLINE' ? 'badge-accent' : 'badge-warning'
                }`}>
                  {course.category.replace('_', ' ')}
                </span>
                <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>
                  {course.course_code}
                </span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cpet-primary)', marginBottom: '0.4rem' }}>
                {course.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--cpet-text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
                {course.description}
              </p>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Student Fee</span>
                  <strong style={{ color: 'var(--cpet-text)', fontSize: '0.95rem' }}>
                    {course.standard_fee > 0 ? `₹${course.standard_fee.toLocaleString('en-IN')}` : 'FREE'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Teacher Wage / Class</span>
                  <strong style={{ color: 'var(--cpet-accent)', fontSize: '0.95rem' }}>
                    {course.default_rp_remuneration_per_class > 0 ? `₹${course.default_rp_remuneration_per_class}` : 'N/A'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Evaluation</span>
                  <span style={{ fontWeight: 600 }}>{course.evaluation_type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Planned Sessions</span>
                  <span style={{ fontWeight: 600 }}>{course.total_planned_classes} Classes</span>
                </div>
              </div>

              {/* Badges for dynamic features */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {course.subjects && course.subjects.length > 0 && (
                  <span className="badge badge-primary">
                    {course.subjects.length} Subjects / Exams
                  </span>
                )}
                {course.custom_questions && course.custom_questions.length > 0 && (
                  <span className="badge badge-accent">
                    {course.custom_questions.length} Custom Intake Questions
                  </span>
                )}
                {course.payment_policy && (
                  <span className="badge badge-neutral">
                    {course.payment_policy.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--cpet-border)', marginTop: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/?course=${course.slug}`);
                  showToast('Public registration link copied to clipboard!');
                }}
                title="Copy Registration Link"
              >
                <Link size={14} />
                <span>Share Link</span>
              </button>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenEdit(course)}
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCourseId ? 'Edit Course Specifications' : 'Build New CPET Course'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh' }}>
                {/* 1. Basic Metadata */}
                <h4 style={{ color: 'var(--cpet-primary)', marginBottom: '0.75rem', fontWeight: 800 }}>
                  1. Course Information
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Course Title <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Tharbiyya Family Course"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Short Code <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. TFC"
                      value={formData.course_code}
                      onChange={e => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="MAHALLU">Mahallu-Based Study Centre Course</option>
                      <option value="GENERAL_ONLINE">General Online Diploma / Certificate</option>
                      <option value="GENERAL_OFFLINE">General Offline Workshop / Camp</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Evaluation Engine</label>
                    <select
                      className="form-select"
                      value={formData.evaluation_type}
                      onChange={e => setFormData({ ...formData, evaluation_type: e.target.value })}
                    >
                      <option value="EXAM_ONLY">Exam / Marks Only</option>
                      <option value="ATTENDANCE_ONLY">Attendance Only (Workshops/Short Courses)</option>
                      <option value="HYBRID">Hybrid (Both Attendance & Marks)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Course Description / Objectives</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Provide overview for students and centres..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--cpet-border)', margin: '1.25rem 0' }} />

                {/* 2. Financials & Admission Number Rule */}
                <h4 style={{ color: 'var(--cpet-primary)', marginBottom: '0.75rem', fontWeight: 800 }}>
                  2. Fees, Remuneration & Admission Pattern
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Standard Student Fee (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.standard_fee}
                      onChange={e => setFormData({ ...formData, standard_fee: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teacher Wage / Class (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.default_rp_remuneration_per_class}
                      onChange={e => setFormData({ ...formData, default_rp_remuneration_per_class: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Planned Classes</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.total_planned_classes}
                      onChange={e => setFormData({ ...formData, total_planned_classes: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Fee Collection Workflow Policy</label>
                    <select
                      className="form-select"
                      value={formData.payment_policy}
                      onChange={e => setFormData({ ...formData, payment_policy: e.target.value })}
                    >
                      <option value="PAY_AT_REGISTRATION">Pay at Registration (UPI/UTR Required)</option>
                      <option value="PAY_AFTER_CONFIRMATION">Register First, Pay on Confirmation</option>
                      <option value="PAY_ON_SPOT">Pay on Spot at Venue Entrance</option>
                      <option value="FREE_COURSE">Free Program (No Fee)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admission No. Formula</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.admission_no_pattern}
                      onChange={e => setFormData({ ...formData, admission_no_pattern: e.target.value })}
                      placeholder="CPET-{CODE}-26-{SEQ}"
                    />
                    <span className="form-helper">Tokens: {'{CODE}'} = Short Code, {'{SEQ}'} = Auto Sequence</span>
                  </div>
                </div>

                {/* 3. Subjects (if Exam or Hybrid) */}
                {(formData.evaluation_type === 'EXAM_ONLY' || formData.evaluation_type === 'HYBRID') && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--cpet-border)', margin: '1.25rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ color: 'var(--cpet-primary)', fontWeight: 800 }}>
                        3. Subjects & Exams ({formData.subjects.length})
                      </h4>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={addSubject}>
                        <Plus size={14} /> Add Subject
                      </button>
                    </div>

                    {formData.subjects.map((sub, idx) => (
                      <div key={sub.id || idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Subject Name (e.g. Fiqh of Family)"
                          value={sub.name}
                          onChange={e => updateSubjectField(idx, 'name', e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Code (e.g. FFL)"
                          value={sub.code}
                          onChange={e => updateSubjectField(idx, 'code', e.target.value.toUpperCase())}
                        />
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Max"
                          value={sub.max_marks}
                          title="Max Marks"
                          onChange={e => updateSubjectField(idx, 'max_marks', Number(e.target.value))}
                        />
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Pass"
                          value={sub.pass_marks}
                          title="Pass Marks"
                          onChange={e => updateSubjectField(idx, 'pass_marks', Number(e.target.value))}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--cpet-danger)' }}
                          onClick={() => removeSubject(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* 4. Dynamic Custom Intake Questions ("Google Form Killer") */}
                <hr style={{ border: 'none', borderTop: '1px solid var(--cpet-border)', margin: '1.25rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--cpet-primary)', fontWeight: 800 }}>
                      4. Custom Intake Questions ("Google Form Killer")
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--cpet-text-muted)' }}>
                      Add any custom question you would normally ask in a Google Form (Food preference, T-Shirt, Madrasa name).
                    </p>
                  </div>
                  <button type="button" className="btn btn-accent btn-sm" onClick={addCustomQuestion}>
                    <Plus size={14} /> Add Question
                  </button>
                </div>

                {formData.custom_questions.length === 0 && (
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    No custom questions attached yet. Standard student fields (Name, Phone, DOB, Gender, District) are automatically collected.
                  </div>
                )}

                {formData.custom_questions.map((q, idx) => (
                  <div key={q.id || idx} style={{ background: '#f8fafc', border: '1px solid var(--cpet-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Question Prompt (e.g. Dietary Preference)"
                        value={q.label}
                        onChange={e => updateQuestionField(idx, 'label', e.target.value)}
                      />
                      <select
                        className="form-select"
                        value={q.type}
                        onChange={e => updateQuestionField(idx, 'type', e.target.value)}
                      >
                        <option value="SHORT_TEXT">Short Answer Text</option>
                        <option value="PARAGRAPH">Paragraph / Long Text</option>
                        <option value="DROPDOWN">Dropdown Menu</option>
                        <option value="RADIO">Multiple Choice (Radio)</option>
                        <option value="CHECKBOX">Checkboxes (Multi-Select)</option>
                        <option value="NUMBER">Number</option>
                      </select>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--cpet-danger)' }}
                        onClick={() => removeQuestion(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {(q.type === 'DROPDOWN' || q.type === 'RADIO' || q.type === 'CHECKBOX') && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Options separated by comma (e.g. Non-Veg, Vegetarian, Vegan)"
                          value={q.rawOptionsText !== undefined ? q.rawOptionsText : (q.options || []).join(', ')}
                          onChange={e => updateQuestionField(idx, 'rawOptionsText', e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        />
                        <span className="form-helper">Separate multiple selectable choices with commas.</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={e => updateQuestionField(idx, 'required', e.target.checked)}
                        />
                        Required question
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCourseId ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
