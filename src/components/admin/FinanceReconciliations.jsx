import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, CheckCircle, Clock, ArrowUpRight, TrendingUp, AlertCircle, Building, Download, Trash2, Filter } from 'lucide-react';

export const FinanceReconciliations = () => {
  const { remittances, confirmRemittance, deleteRemittance, enrollments, courses, centres, showToast } = useApp();

  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterCentre, setFilterCentre] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Overall Financial Metrics
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

  // Filter remittances by Course, Centre, and Status
  const filteredRemittances = remittances.filter(rem => {
    if (filterStatus !== 'ALL' && rem.status !== filterStatus) return false;
    if (filterCentre !== 'ALL' && rem.centre_id !== filterCentre) return false;
    if (filterCourse !== 'ALL') {
      if (rem.course_id) {
        if (rem.course_id !== filterCourse) return false;
      } else {
        const centre = centres.find(c => c.id === rem.centre_id);
        const matchesCentre = centre && (centre.active_course_id === filterCourse || centre.course_ids?.includes(filterCourse));
        const matchesEnrollment = enrollments.some(e => e.centre_id === rem.centre_id && e.course_id === filterCourse);
        if (!matchesCentre && !matchesEnrollment) return false;
      }
    }
    return true;
  });

  // Export to Excel (CSV)
  const handleExportCSV = () => {
    if (filteredRemittances.length === 0) {
      showToast('No fee remittances to export', 'warning');
      return;
    }

    const headers = [
      'Remittance ID',
      'Remittance Date',
      'Resource Person',
      'Study Centre',
      'Course',
      'Amount Remitted (INR)',
      'Payment Mode',
      'Transaction Ref / UTR',
      'Students Covered',
      'Status',
      'Notes'
    ];

    const rows = filteredRemittances.map(rem => {
      const centre = centres.find(c => c.id === rem.centre_id);
      const course = courses.find(c => c.id === rem.course_id) || 
                     (centre ? courses.find(c => c.id === centre.active_course_id || centre.course_ids?.includes(c.id)) : null);
      const courseName = rem.course_title || course?.title || 'Mahallu Program';

      return [
        `"${rem.id || ''}"`,
        `"${rem.remittance_date || ''}"`,
        `"${(rem.rp_name || '').replace(/"/g, '""')}"`,
        `"${(rem.centre_name || '').replace(/"/g, '""')}"`,
        `"${courseName.replace(/"/g, '""')}"`,
        rem.amount || 0,
        `"${rem.payment_mode || ''}"`,
        `"${(rem.transaction_ref || '').replace(/"/g, '""')}"`,
        rem.student_count || 0,
        `"${rem.status || ''}"`,
        `"${(rem.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CPET_Fee_Remittances_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Exported fee remittances to Excel (CSV)!');
  };

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
        <button className="btn btn-secondary" onClick={handleExportCSV}>
          <Download size={16} />
          Export to Excel (CSV)
        </button>
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

      {/* Course, Centre & Status Filter Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--cpet-text-muted)', fontWeight: 600 }}>Course:</span>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px', fontSize: '0.85rem' }}
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
          >
            <option value="ALL">All Courses & Programs</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.course_code})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--cpet-text-muted)', fontWeight: 600 }}>Centre:</span>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px', fontSize: '0.85rem' }}
            value={filterCentre}
            onChange={e => setFilterCentre(e.target.value)}
          >
            <option value="ALL">All Study Centres</option>
            {centres.map(c => (
              <option key={c.id} value={c.id}>{c.centre_name} ({c.place})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--cpet-text-muted)', fontWeight: 600 }}>Status:</span>
          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.85rem' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Remittance Statuses</option>
            <option value="PENDING_VERIFICATION">Pending Office Audit</option>
            <option value="CONFIRMED_BY_OFFICE">Confirmed by Office</option>
          </select>
        </div>

        {(filterCourse !== 'ALL' || filterCentre !== 'ALL' || filterStatus !== 'ALL') && (
          <button
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
            onClick={() => {
              setFilterCourse('ALL');
              setFilterCentre('ALL');
              setFilterStatus('ALL');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Remittances Table */}
      <div className="table-responsive">
        <table className="cpet-table">
          <thead>
            <tr>
              <th>Date & RP</th>
              <th>Centre & Course</th>
              <th>Amount Remitted</th>
              <th>Payment Channel</th>
              <th>Transaction UTR / Ref</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRemittances.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No fee remittances matching the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredRemittances.map(rem => {
                const centre = centres.find(c => c.id === rem.centre_id);
                const course = courses.find(c => c.id === rem.course_id) || 
                               (centre ? courses.find(c => c.id === centre.active_course_id || centre.course_ids?.includes(c.id)) : null);
                const courseTitle = rem.course_title || course?.title;

                return (
                  <tr key={rem.id}>
                    <td>
                      <strong style={{ display: 'block', color: 'var(--cpet-primary)' }}>
                        {rem.remittance_date}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{rem.rp_name}</span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.85rem' }}>{rem.centre_name}</strong>
                      {courseTitle && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--cpet-accent)', fontWeight: 600 }}>
                          {courseTitle}
                        </span>
                      )}
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
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
                        {rem.payment_mode ? rem.payment_mode.replace(/_/g, ' ') : 'BANK TRANSFER'}
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
                        {rem.status ? rem.status.replace(/_/g, ' ') : 'PENDING'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        {rem.status === 'PENDING_VERIFICATION' ? (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => confirmRemittance(rem.id)}
                            title="Confirm fee receipt into bank account"
                          >
                            <CheckCircle size={14} /> Confirm Receipt
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                            ✓ Reconciled
                          </span>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.5rem', color: '#ef4444' }}
                          title="Delete remittance record"
                          onClick={() => {
                            if (window.confirm(`Delete remittance of ₹${rem.amount} from ${rem.centre_name}?`)) {
                              deleteRemittance(rem.id);
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
