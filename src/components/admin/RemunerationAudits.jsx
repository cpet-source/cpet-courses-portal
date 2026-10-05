import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, Clock, DollarSign, UserCheck, AlertCircle, FileText, Send } from 'lucide-react';

export const RemunerationAudits = () => {
  const { classLogs, resourcePersons, verifyClassLog, disbursePayout, payouts, showToast } = useApp();
  const [filterRp, setFilterRp] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedRpForPayout, setSelectedRpForPayout] = useState(null);

  // Verification Edit State
  const [verifyingLogId, setVerifyingLogId] = useState(null);
  const [adjustedClaim, setAdjustedClaim] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');

  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    payment_mode: 'BANK_TRANSFER',
    transaction_ref: '',
    billing_month: '2026-10'
  });

  const filteredLogs = classLogs.filter(log => {
    if (filterRp !== 'ALL' && log.rp_id !== filterRp) return false;
    if (filterStatus !== 'ALL' && log.status !== filterStatus) return false;
    return true;
  });

  const handleStartVerify = (log) => {
    setVerifyingLogId(log.id);
    setAdjustedClaim(log.total_claim);
    setAdminNotes(log.admin_notes || 'Approved standard class rate & travel allowance');
  };

  const handleConfirmVerify = (logId) => {
    verifyClassLog(logId, Number(adjustedClaim), adminNotes);
    setVerifyingLogId(null);
  };

  const handleOpenPayout = (rpId) => {
    const rp = resourcePersons.find(r => r.id === rpId);
    setSelectedRpForPayout(rp);
    setShowPayoutModal(true);
  };

  const handleExecutePayout = (e) => {
    e.preventDefault();
    if (!payoutForm.transaction_ref) {
      showToast('Please provide bank transfer reference / UTR', 'danger');
      return;
    }

    const verifiedLogs = classLogs.filter(l => l.rp_id === selectedRpForPayout.id && l.status === 'VERIFIED_BY_ADMIN');
    const totalWages = verifiedLogs.reduce((acc, l) => acc + (l.standard_rate || 0), 0);
    const totalTA = verifiedLogs.reduce((acc, l) => acc + (l.travel_allowance || 0), 0);
    const finalAmount = verifiedLogs.reduce((acc, l) => acc + (l.total_claim || 0), 0);

    disbursePayout({
      rp_id: selectedRpForPayout.id,
      rp_name: selectedRpForPayout.full_name,
      billing_month: payoutForm.billing_month,
      classes_count: verifiedLogs.length,
      total_wages: totalWages,
      total_travel_allowance: totalTA,
      final_payout_amount: finalAmount,
      payment_mode: payoutForm.payment_mode,
      transaction_ref: payoutForm.transaction_ref
    });

    setShowPayoutModal(false);
    setPayoutForm({ payment_mode: 'BANK_TRANSFER', transaction_ref: '', billing_month: '2026-10' });
  };

  // Group verified logs by RP for payout summary
  const rpSummaries = resourcePersons.map(rp => {
    const rpLogs = classLogs.filter(l => l.rp_id === rp.id);
    const verifiedLogs = rpLogs.filter(l => l.status === 'VERIFIED_BY_ADMIN');
    const pendingLogs = rpLogs.filter(l => l.status === 'SUBMITTED');
    const verifiedAmount = verifiedLogs.reduce((acc, l) => acc + l.total_claim, 0);

    return {
      rp,
      totalClasses: rpLogs.length,
      verifiedCount: verifiedLogs.length,
      pendingCount: pendingLogs.length,
      verifiedAmount
    };
  });

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h2 className="cpet-card-title">
            <DollarSign size={22} />
            Resource Person Remuneration & Class Audits
          </h2>
          <p className="cpet-card-desc">
            Review teacher class logs (replacing WhatsApp group messages), audit travel allowances, and disburse verified remuneration.
          </p>
        </div>
      </div>

      {/* RP Payout Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {rpSummaries.map(({ rp, totalClasses, verifiedCount, pendingCount, verifiedAmount }) => (
          <div key={rp.id} className="cpet-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--cpet-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ color: 'var(--cpet-primary)', fontWeight: 800 }}>{rp.full_name}</h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>📱 {rp.phone}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{rp.bank_account_details}</p>
              </div>
              <span className="badge badge-primary">{totalClasses} Total Classes</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--cpet-border)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Ready for Payout:</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--cpet-primary)' }}>₹{verifiedAmount.toLocaleString('en-IN')}</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px' }}>({verifiedCount} verified)</span>
              </div>

              {verifiedCount > 0 ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenPayout(rp.id)}
                >
                  <Send size={14} /> Disburse Payout
                </button>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No verified dues</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select
          className="form-select"
          style={{ width: 'auto', fontSize: '0.85rem' }}
          value={filterRp}
          onChange={e => setFilterRp(e.target.value)}
        >
          <option value="ALL">All Resource Persons</option>
          {resourcePersons.map(r => (
            <option key={r.id} value={r.id}>{r.full_name}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', fontSize: '0.85rem' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="ALL">All Log Statuses</option>
          <option value="SUBMITTED">Submitted (Pending Review)</option>
          <option value="VERIFIED_BY_ADMIN">Verified by Admin</option>
          <option value="PAYMENT_PROCESSED">Payment Disbursed</option>
        </select>
      </div>

      {/* Class Logs Table */}
      <div className="table-responsive">
        <table className="cpet-table">
          <thead>
            <tr>
              <th>Date & RP</th>
              <th>Centre & Course</th>
              <th>Session Type & Topic</th>
              <th>Rate Breakdown</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Audit Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No class logs matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>
                    <strong style={{ display: 'block', color: 'var(--cpet-primary)' }}>
                      {log.class_date}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{log.rp_name}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.85rem' }}>{log.centre_name}</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                      {log.course_title}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ marginBottom: '4px' }}>
                      {log.session_type.replace('_', ' ')} ({log.hours_spent} hrs)
                    </span>
                    <p style={{ fontSize: '0.82rem', color: 'var(--cpet-text)', margin: 0 }}>
                      {log.syllabus_covered}
                    </p>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>
                      <span>Class Fee: ₹{log.standard_rate}</span>
                      {log.travel_allowance > 0 && (
                        <span style={{ display: 'block', color: 'var(--cpet-accent)' }}>
                          + TA: ₹{log.travel_allowance}
                        </span>
                      )}
                      <strong style={{ display: 'block', color: 'var(--cpet-primary)', marginTop: '2px' }}>
                        Total: ₹{log.total_claim}
                      </strong>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      log.status === 'PAYMENT_PROCESSED' ? 'badge-neutral' :
                      log.status === 'VERIFIED_BY_ADMIN' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {log.status.replace(/_/g, ' ')}
                    </span>
                    {log.admin_notes && (
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {log.admin_notes}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {log.status === 'SUBMITTED' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStartVerify(log)}
                      >
                        <CheckCircle size={14} /> Audit & Verify
                      </button>
                    )}
                    {log.status === 'VERIFIED_BY_ADMIN' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStartVerify(log)}
                      >
                        Adjust / Edit
                      </button>
                    )}
                    {log.status === 'PAYMENT_PROCESSED' && (
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                        ✓ Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Verify / Adjust Modal */}
      {verifyingLogId && (
        <div className="modal-overlay" onClick={() => setVerifyingLogId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Audit Class Remuneration Claim</h3>
              <button className="modal-close-btn" onClick={() => setVerifyingLogId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Approved Remuneration Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={adjustedClaim}
                  onChange={e => setAdjustedClaim(e.target.value)}
                />
                <span className="form-helper">
                  You can include extra travel allowance or adjust based on distance/session length.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Super Admin Audit Remarks</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="e.g. Approved with extra travel allowance for hill tract journey"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setVerifyingLogId(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => handleConfirmVerify(verifyingLogId)}>
                <CheckCircle size={14} /> Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Payout Modal */}
      {showPayoutModal && selectedRpForPayout && (
        <div className="modal-overlay" onClick={() => setShowPayoutModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Disburse Remuneration Payout</h3>
              <button className="modal-close-btn" onClick={() => setShowPayoutModal(false)}>✕</button>
            </div>
            <form onSubmit={handleExecutePayout}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--cpet-border)' }}>
                  <h4 style={{ color: 'var(--cpet-primary)', margin: 0 }}>{selectedRpForPayout.full_name}</h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0' }}>
                    {selectedRpForPayout.bank_account_details}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Billing Month</label>
                  <input
                    type="month"
                    className="form-input"
                    value={payoutForm.billing_month}
                    onChange={e => setPayoutForm({ ...payoutForm, billing_month: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={payoutForm.payment_mode}
                    onChange={e => setPayoutForm({ ...payoutForm, payment_mode: e.target.value })}
                  >
                    <option value="BANK_TRANSFER">Direct Bank NEFT / RTGS</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="CASH">Cash Voucher</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Bank UTR / Transaction Reference No <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. UTR9384729104"
                    value={payoutForm.transaction_ref}
                    onChange={e => setPayoutForm({ ...payoutForm, transaction_ref: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayoutModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  <CheckCircle size={14} /> Record Disbursal & Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
