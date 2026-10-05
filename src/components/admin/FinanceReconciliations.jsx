import React from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, CheckCircle, Clock, ArrowUpRight, TrendingUp, AlertCircle, Building } from 'lucide-react';

export const FinanceReconciliations = () => {
  const { remittances, confirmRemittance, enrollments, courses, centres, showToast } = useApp();

  // Metrics
  const totalEnrolled = enrollments.length;
  const totalCollectibleFees = enrollments.reduce((sum, enr) => {
    const course = courses.find(c => c.id === enr.course_id);
    return sum + (course ? course.standard_fee : 0);
  }, 0);

  const totalCollectedFromStudents = enrollments.reduce((sum, enr) => sum + (enr.amount_paid || 0), 0);

  const confirmedRemittances = remittances.filter(r => r.status === 'CONFIRMED_BY_OFFICE');
  const pendingRemittances = remittances.filter(r => r.status === 'PENDING_VERIFICATION');

  const totalOfficeRemitted = confirmedRemittances.reduce((sum, r) => sum + r.amount, 0);
  const totalPendingVerification = pendingRemittances.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h2 className="cpet-card-title">
            <CreditCard size={22} />
            Fee Remittances & Financial Ledger
          </h2>
          <p className="cpet-card-desc">
            Reconcile student course fees collected by Resource Persons and remitted directly to the CPET Central Office account.
          </p>
        </div>
      </div>

      {/* Financial Health KPIs */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <p>Total Student Fees Collected</p>
            <h3>₹{totalCollectedFromStudents.toLocaleString('en-IN')}</h3>
            <span>Across all {totalEnrolled} enrollments</span>
          </div>
          <div className="stat-icon" style={{ background: 'var(--cpet-success-soft)', color: 'var(--cpet-success)' }}>
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Confirmed Office Receipts</p>
            <h3>₹{totalOfficeRemitted.toLocaleString('en-IN')}</h3>
            <span>Verified in CPET bank account</span>
          </div>
          <div className="stat-icon" style={{ background: 'var(--cpet-accent-soft)', color: 'var(--cpet-accent)' }}>
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Pending RP Remittances</p>
            <h3 style={{ color: 'var(--cpet-warning)' }}>₹{totalPendingVerification.toLocaleString('en-IN')}</h3>
            <span>{pendingRemittances.length} submissions awaiting audit</span>
          </div>
          <div className="stat-icon" style={{ background: 'var(--cpet-warning-soft)', color: 'var(--cpet-warning)' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Uncollected / Dues</p>
            <h3>₹{(totalCollectibleFees - totalCollectedFromStudents).toLocaleString('en-IN')}</h3>
            <span>Remaining course balances</span>
          </div>
          <div className="stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* Remittances Table */}
      <div className="table-responsive">
        <table className="cpet-table">
          <thead>
            <tr>
              <th>Date & RP</th>
              <th>Centre / Batch</th>
              <th>Amount Remitted</th>
              <th>Payment Channel</th>
              <th>Transaction UTR / Ref</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Reconcile</th>
            </tr>
          </thead>
          <tbody>
            {remittances.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No fee remittances logged yet.
                </td>
              </tr>
            ) : (
              remittances.map(rem => (
                <tr key={rem.id}>
                  <td>
                    <strong style={{ display: 'block', color: 'var(--cpet-primary)' }}>
                      {rem.remittance_date}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{rem.rp_name}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.85rem' }}>{rem.centre_name}</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                      Covers {rem.student_count} students
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--cpet-primary)' }}>
                      ₹{rem.amount.toLocaleString('en-IN')}
                    </strong>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {rem.payment_mode.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem' }}>
                      {rem.transaction_ref}
                    </span>
                    {rem.notes && (
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {rem.notes}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${rem.status === 'CONFIRMED_BY_OFFICE' ? 'badge-success' : 'badge-warning'}`}>
                      {rem.status === 'CONFIRMED_BY_OFFICE' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {rem.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {rem.status === 'PENDING_VERIFICATION' ? (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => confirmRemittance(rem.id)}
                      >
                        <CheckCircle size={14} /> Confirm Receipt
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                        ✓ Reconciled
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
