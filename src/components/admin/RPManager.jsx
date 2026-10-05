import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GraduationCap, UserPlus, Key, Edit2, CheckCircle, Phone, Mail, Building, MapPin } from 'lucide-react';

export const RPManager = () => {
  const { resourcePersons, addResourcePerson, centres, showToast } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRp, setEditingRp] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    password: '',
    email: '',
    qualification: '',
    bank_account_details: ''
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      password: '',
      email: '',
      qualification: '',
      bank_account_details: ''
    });
    setEditingRp(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (rp) => {
    setEditingRp(rp);
    setFormData({
      full_name: rp.full_name || '',
      phone: rp.phone || '',
      password: rp.password || '',
      email: rp.email || '',
      qualification: rp.qualification || '',
      bank_account_details: rp.bank_account_details || ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.password) {
      showToast('Please provide teacher name, mobile number, and login password', 'danger');
      return;
    }

    if (editingRp) {
      // In AppContext, update
      editingRp.full_name = formData.full_name;
      editingRp.phone = formData.phone;
      editingRp.password = formData.password;
      editingRp.email = formData.email;
      editingRp.qualification = formData.qualification;
      editingRp.bank_account_details = formData.bank_account_details;
      showToast(`Credentials updated for ${formData.full_name}!`);
    } else {
      addResourcePerson(formData);
    }

    setShowAddModal(false);
    resetForm();
  };

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h2 className="cpet-card-title">
            <GraduationCap size={22} />
            Resource Persons (Teachers) & Credentials
          </h2>
          <p className="cpet-card-desc">
            Onboard new travelling Resource Persons, set their mobile login passwords, and manage bank remuneration details.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <UserPlus size={16} />
          Onboard New RP
        </button>
      </div>

      {/* RPs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {resourcePersons.map(rp => {
          const assignedCentres = centres.filter(c => c.assigned_rp_id === rp.id);

          return (
            <div key={rp.id} className="cpet-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--cpet-primary)', margin: 0 }}>
                    {rp.full_name}
                  </h3>
                  <span className="badge badge-success">ACTIVE</span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  {rp.qualification || 'DHIU Faculty'}
                </div>

                {/* Login Credentials Box */}
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cpet-border)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <Phone size={13} color="var(--cpet-accent)" />
                    <span>Login Mobile: <strong>{rp.phone}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Key size={13} color="var(--cpet-accent)" />
                    <span>Password: <strong style={{ fontFamily: 'monospace' }}>{rp.password}</strong></span>
                  </div>
                </div>

                {/* Bank / Remuneration Details */}
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600, display: 'block', color: 'var(--cpet-text)' }}>Payout Bank A/C:</span>
                  <span>{rp.bank_account_details || 'Not provided'}</span>
                </div>

                {/* Assigned Centres */}
                <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '0.5rem', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Assigned Centres ({assignedCentres.length}):
                  </span>
                  {assignedCentres.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>None currently assigned</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {assignedCentres.map(c => (
                        <span key={c.id} className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                          <MapPin size={10} /> {c.place}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ borderTop: '1px solid var(--cpet-border)', paddingTop: '0.75rem', marginTop: '0.75rem', textAlign: 'right' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenEdit(rp)}
                >
                  <Edit2 size={13} /> Edit Credentials
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboard / Edit RP Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRp ? 'Edit Faculty Credentials' : 'Onboard New Resource Person'}</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name & Title <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Usthad Mahroof Hudawi"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Login Mobile Number <span className="required">*</span></label>
                    <input
                      type="tel"
                      className="form-input"
                      required
                      placeholder="e.g. 9847012345"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <span className="form-helper">This is their login username.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Login Password <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. cpet@123"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <span className="form-helper">RP uses this to log in on mobile.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="teacher@cpet.dhiu.in"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Qualification / Background</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. M.A. Islamic Studies, DHIU Alumni (2018)"
                    value={formData.qualification}
                    onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Account / UPI Details (for Remuneration)</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="e.g. SBI Chemmad — A/C 38291048291, IFSC: SBIN0070188, UPI: mahroof@okaxis"
                    value={formData.bank_account_details}
                    onChange={e => setFormData({ ...formData, bank_account_details: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRp ? 'Save Changes' : 'Create Teacher Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
