import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, Plus, CheckCircle, Clock, ArrowUpRight, DollarSign } from 'lucide-react';

export const RPFeeRemittance = () => {
  const { currentRp, centres, remittances, addRemittance, enrollments, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);

  const assignedCentres = centres.filter(c => c.assigned_rp_id === currentRp.id);
  const rpRemittances = remittances.filter(r => r.rp_id === currentRp.id);

  // Form State
  const [formData, setFormData] = useState({
    centre_id: assignedCentres[0]?.id || centres[0]?.id || '',
    amount: '',
    payment_mode: 'BANK_TRANSFER',
    transaction_ref: '',
    student_count: 5,
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.transaction_ref) {
      showToast('Please provide amount and transaction reference UTR', 'danger');
      return;
    }

    addRemittance(formData);
    setShowModal(false);
    setFormData({
      centre_id: assignedCentres[0]?.id || centres[0]?.id || '',
      amount: '',
      payment_mode: 'BANK_TRANSFER',
      transaction_ref: '',
      student_count: 5,
      notes: ''
    });
  };

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h3 className="cpet-card-title">
            <CreditCard size={20} />
            Fee Remittance to CPET Office
          </h3>
          <p className="cpet-card-desc">
            Submit course fees collected from students to the central office account with your bank UTR or receipt.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Submit Fee Remittance
        </button>
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
                  <label className="form-label">Mahallu Study Centre <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={formData.centre_id}
                    onChange={e => setFormData({ ...formData, centre_id: e.target.value })}
                  >
                    {centres.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.centre_name} ({c.place})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Total Amount (₹) <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      placeholder="e.g. 15000"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
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
