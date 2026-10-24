import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, Plus, CheckCircle, Clock, ArrowUpRight, DollarSign, TrendingUp, AlertCircle, Wallet } from 'lucide-react';

export const RPFeeRemittance = () => {
  const { currentRp, centres, courses, remittances, addRemittance, enrollments, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);

  const assignedCentres = centres.filter(c => c.assigned_rp_id === currentRp.id);
  const assignedCentreIds = new Set(assignedCentres.map(c => c.id));
  const rpRemittances = remittances.filter(r => r.rp_id === currentRp.id);

  // Enrollments belonging to this RP's centres (or Mahallu centres assigned)
  const rpEnrollments = enrollments.filter(e => e.centre_id && assignedCentreIds.has(e.centre_id));

  // 1. Total actual money collected by RP from students (Credited)
  const totalStudentFeesCredited = rpEnrollments.reduce((sum, e) => sum + (Number(e.amount_paid) || 0), 0);

  // 2. Total remittances submitted by RP to CPET office
  const totalRemittedToOffice = rpRemittances.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const confirmedRemittedToOffice = rpRemittances.filter(r => r.status === 'CONFIRMED_BY_OFFICE').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // 3. Unremitted cash in RP's hand
  const unremittedInHand = Math.max(0, totalStudentFeesCredited - totalRemittedToOffice);

  // 4. Expected revenue and student dues
  const totalExpectedRevenue = rpEnrollments.reduce((sum, e) => {
    const c = courses.find(crs => crs.id === e.course_id);
    return sum + (Number(c?.standard_fee) || 0);
  }, 0);
  const totalStudentDues = Math.max(0, totalExpectedRevenue - totalStudentFeesCredited);

  // Form State
  const initialCourseId = courses[0]?.id || '';
  const initialCentresForCourse = centres.filter(c => 
    !initialCourseId || c.active_course_id === initialCourseId || (c.course_ids && c.course_ids.includes(initialCourseId))
  );

  const [formData, setFormData] = useState({
    course_id: initialCourseId,
    centre_id: initialCentresForCourse[0]?.id || centres[0]?.id || '',
    amount: '',
    payment_mode: 'BANK_TRANSFER',
    transaction_ref: '',
    student_count: 5,
    notes: ''
  });

  const availableCentres = centres.filter(c => {
    if (!formData.course_id) return true;
    return c.active_course_id === formData.course_id || (c.course_ids && c.course_ids.includes(formData.course_id));
  });

  const handleCourseChange = (selectedCourseId) => {
    const validCentres = centres.filter(c => 
      !selectedCourseId || c.active_course_id === selectedCourseId || (c.course_ids && c.course_ids.includes(selectedCourseId))
    );
    setFormData(prev => ({
      ...prev,
      course_id: selectedCourseId,
      centre_id: validCentres[0]?.id || (centres[0]?.id || '')
    }));
  };

  const handleOpenRemitModal = (prefillAmount) => {
    if (prefillAmount && prefillAmount > 0) {
      setFormData(prev => ({ ...prev, amount: String(prefillAmount) }));
    }
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.transaction_ref) {
      showToast('Please provide amount and transaction reference UTR', 'danger');
      return;
    }

    addRemittance(formData);
    setShowModal(false);
    setFormData({
      course_id: courses[0]?.id || '',
      centre_id: initialCentresForCourse[0]?.id || centres[0]?.id || '',
      amount: '',
      payment_mode: 'BANK_TRANSFER',
      transaction_ref: '',
      student_count: 5,
      notes: ''
    });
  };

  // Specific centre calculation inside modal
  const selectedCentreEnrollments = rpEnrollments.filter(e => 
    (!formData.centre_id || e.centre_id === formData.centre_id) && 
    (!formData.course_id || e.course_id === formData.course_id)
  );
  const selectedCentreCollected = selectedCentreEnrollments.reduce((sum, e) => sum + (Number(e.amount_paid) || 0), 0);
  const selectedCentreRemitted = rpRemittances
    .filter(r => (!formData.centre_id || r.centre_id === formData.centre_id) && (!formData.course_id || r.course_id === formData.course_id))
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const selectedCentreBalance = Math.max(0, selectedCentreCollected - selectedCentreRemitted);

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h3 className="cpet-card-title">
            <CreditCard size={20} />
            Fee Remittance & Financial Ledger
          </h3>
          <p className="cpet-card-desc">
            Submit course fees collected from students to the central office account with your bank UTR or receipt.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenRemitModal(unremittedInHand > 0 ? unremittedInHand : null)}>
          <Plus size={16} />
          Submit Fee Remittance
        </button>
      </div>

      {/* Live Financial Reconciliation KPIs */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <p>Fees Collected from Students</p>
            <h3 style={{ color: '#16a34a' }}>₹{totalStudentFeesCredited.toLocaleString('en-IN')}</h3>
            <span>Marked as paid across {rpEnrollments.filter(e => (Number(e.amount_paid) || 0) > 0).length} students</span>
          </div>
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Remitted to CPET Office</p>
            <h3 style={{ color: 'var(--cpet-primary)' }}>₹{totalRemittedToOffice.toLocaleString('en-IN')}</h3>
            <span>Confirmed: ₹{confirmedRemittedToOffice.toLocaleString('en-IN')}</span>
          </div>
          <div className="stat-icon" style={{ background: 'var(--cpet-accent-soft)', color: 'var(--cpet-accent)' }}>
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Unremitted Cash in Hand</p>
            <h3 style={{ color: unremittedInHand > 0 ? '#b45309' : '#16a34a' }}>
              ₹{unremittedInHand.toLocaleString('en-IN')}
            </h3>
            <span>
              {unremittedInHand > 0 ? (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 700, padding: 0, cursor: 'pointer', textDecoration: 'underline', fontSize: '0.72rem' }}
                  onClick={() => handleOpenRemitModal(unremittedInHand)}
                >
                  Click to Remit to Office →
                </button>
              ) : 'All collections remitted ✓'}
            </span>
          </div>
          <div className="stat-icon" style={{ background: unremittedInHand > 0 ? '#fef3c7' : '#f8fafc', color: unremittedInHand > 0 ? '#b45309' : '#64748b' }}>
            <Wallet size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Student Dues Outstanding</p>
            <h3 style={{ color: totalStudentDues > 0 ? '#dc2626' : '#16a34a' }}>
              ₹{totalStudentDues.toLocaleString('en-IN')}
            </h3>
            <span>Uncollected student fees</span>
          </div>
          <div className="stat-icon" style={{ background: totalStudentDues > 0 ? '#fee2e2' : '#f8fafc', color: totalStudentDues > 0 ? '#dc2626' : '#16a34a' }}>
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* Remittances History (Mobile Optimized) */}
      <div className="mobile-card-list">
        {rpRemittances.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)', color: '#64748b' }}>
            No fee remittances submitted yet.
          </div>
        ) : (
          rpRemittances.map(rem => (
            <div key={rem.id} className="mobile-data-card">
              <div className="card-top">
                <div>
                  <h4 className="card-title">₹{rem.amount.toLocaleString('en-IN')}</h4>
                  <p className="card-subtitle">{rem.centre_name}</p>
                  {rem.course_title && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                      {rem.course_title}
                    </span>
                  )}
                </div>
                <span className={`badge ${rem.status === 'CONFIRMED_BY_OFFICE' ? 'badge-success' : 'badge-warning'}`}>
                  {rem.status === 'CONFIRMED_BY_OFFICE' ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {rem.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div style={{ margin: '0.4rem 0', fontSize: '0.82rem', color: '#475569' }}>
                <span>Channel: <strong>{rem.payment_mode.replace(/_/g, ' ')}</strong></span> | 
                <span style={{ marginLeft: '4px' }}>Ref: <strong style={{ fontFamily: 'monospace' }}>{rem.transaction_ref}</strong></span>
              </div>

              {rem.notes && (
                <div style={{ fontSize: '0.78rem', color: '#64748b', background: '#f8fafc', padding: '0.35rem 0.6rem', borderRadius: '4px', marginTop: '0.4rem' }}>
                  {rem.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal / Drawer for Submitting Remittance */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Remit Collected Fees to Office</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Course / Program <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={formData.course_id}
                    onChange={e => handleCourseChange(e.target.value)}
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.course_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mahallu Study Centre <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={formData.centre_id}
                    onChange={e => setFormData({ ...formData, centre_id: e.target.value })}
                  >
                    {availableCentres.length === 0 ? (
                      centres.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.centre_name} ({c.place})
                        </option>
                      ))
                    ) : (
                      availableCentres.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.centre_name} ({c.place})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Total Amount (₹) <span className="required">*</span></label>
                      {selectedCentreBalance > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.68rem', padding: '1px 6px', fontWeight: 700 }}
                          onClick={() => setFormData(prev => ({ ...prev, amount: String(selectedCentreBalance) }))}
                        >
                          Fill In-Hand: ₹{selectedCentreBalance}
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      className="form-input"
                      required
                      placeholder="e.g. 15000"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                      Collected here: <strong>₹{selectedCentreCollected}</strong> | Remitted: <strong>₹{selectedCentreRemitted}</strong>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Students Covered</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.student_count}
                      onChange={e => setFormData({ ...formData, student_count: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={formData.payment_mode}
                    onChange={e => setFormData({ ...formData, payment_mode: e.target.value })}
                  >
                    <option value="BANK_TRANSFER">Bank NEFT / IMPS Transfer to CPET A/C</option>
                    <option value="UPI">UPI Transfer / QR Code</option>
                    <option value="CASH_AT_OFFICE">Handed Cash at CPET Office</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Transaction UTR / Ref No <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. SBIN0049281928"
                    value={formData.transaction_ref}
                    onChange={e => setFormData({ ...formData, transaction_ref: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes for Office Accounts</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="e.g. October first installment collection from 10 students..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle size={15} /> Submit Remittance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
