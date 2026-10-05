import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, Phone, UserCheck, Plus, CheckCircle, Clock, Building, User } from 'lucide-react';

export const CentresManager = () => {
  const { centres, courses, resourcePersons, addCentre, updateCentreStatus, assignRpToCentre, enrollments, showToast } = useApp();
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    centre_name: '',
    place: '',
    mahallu_name: '',
    panchayath_municipality: '',
    district: 'Malappuram',
    pincode: '',
    committee_president_name: '',
    committee_president_phone: '',
    committee_secretary_name: '',
    committee_secretary_phone: '',
    assigned_rp_id: resourcePersons[0]?.id || '',
    active_course_id: courses.find(c => c.category === 'MAHALLU')?.id || courses[0]?.id || ''
  });

  const districts = ['All', 'Malappuram', 'Kozhikode', 'Kannur', 'Thrissur', 'Palakkad', 'Wayanad', 'Kasaragod', 'Ernakulam', 'Kollam'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.centre_name || !formData.place || !formData.district) {
      showToast('Please fill all mandatory centre fields', 'danger');
      return;
    }

    addCentre({
      ...formData,
      founded_by_rp_id: formData.assigned_rp_id,
      founded_by_rp_name: resourcePersons.find(r => r.id === formData.assigned_rp_id)?.full_name || 'CPET Office'
    });

    setShowModal(false);
    setFormData({
      centre_name: '',
      place: '',
      mahallu_name: '',
      panchayath_municipality: '',
      district: 'Malappuram',
      pincode: '',
      committee_president_name: '',
      committee_president_phone: '',
      committee_secretary_name: '',
      committee_secretary_phone: '',
      assigned_rp_id: resourcePersons[0]?.id || '',
      active_course_id: courses.find(c => c.category === 'MAHALLU')?.id || courses[0]?.id || ''
    });
  };

  const filteredCentres = centres.filter(c => {
    if (filterDistrict !== 'ALL' && c.district !== filterDistrict) return false;
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div className="cpet-card-header">
        <div>
          <h2 className="cpet-card-title">
            <Building size={22} />
            Mahallu Study Centres Directory
          </h2>
          <p className="cpet-card-desc">
            Manage offline study centres across Kerala, committee office-bearers, and assign/rotate Resource Persons.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Register New Centre
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--cpet-text-muted)', fontWeight: 600 }}>District:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={filterDistrict}
            onChange={e => setFilterDistrict(e.target.value)}
          >
            <option value="ALL">All Districts</option>
            {districts.filter(d => d !== 'All').map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--cpet-text-muted)', fontWeight: 600 }}>Status:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Centres</option>
            <option value="PENDING_APPROVAL">Pending Approval (From RPs)</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Centre Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {filteredCentres.map(centre => {
          const studentCount = enrollments.filter(e => e.centre_id === centre.id).length;
          const assignedRp = resourcePersons.find(r => r.id === centre.assigned_rp_id);
          const activeCourse = courses.find(c => c.id === centre.active_course_id);

          return (
            <div key={centre.id} className="cpet-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary" style={{ fontFamily: 'monospace' }}>
                    {centre.centre_code}
                  </span>
                  <span className={`badge ${centre.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                    {centre.status === 'ACTIVE' ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {centre.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--cpet-primary)', marginBottom: '0.3rem' }}>
                  {centre.centre_name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--cpet-text-muted)', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                  <MapPin size={14} color="var(--cpet-accent)" />
                  <span>{centre.place}, {centre.district} — {centre.pincode}</span>
                </div>

                {/* Info Block */}
                <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '1rem', border: '1px solid var(--cpet-border)' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Active Course Running:</span>
                    <strong style={{ color: 'var(--cpet-primary)' }}>
                      {activeCourse ? activeCourse.title : 'No Course Assigned'}
                    </strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', borderTop: '1px solid #edf2f7', paddingTop: '0.5rem' }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Enrolled Students</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--cpet-accent)' }}>{studentCount} Students</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Mahallu Jama'ath</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{centre.mahallu_name || centre.place}</span>
                    </div>
                  </div>
                </div>

                {/* Committee Contacts */}
                <div style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748b' }}>President:</span>
                    <span style={{ fontWeight: 600 }}>
                      {centre.committee_president_name} ({centre.committee_president_phone})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>Secretary:</span>
                    <span style={{ fontWeight: 600 }}>
                      {centre.committee_secretary_name} ({centre.committee_secretary_phone})
                    </span>
                  </div>
                </div>

                {/* Assigned RP Select */}
                <div style={{ borderTop: '1px solid var(--cpet-border)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--cpet-text-muted)', marginBottom: '0.3rem' }}>
                    Assigned Resource Person (Teacher):
                  </label>
                  <select
                    className="form-select"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                    value={centre.assigned_rp_id || ''}
                    onChange={(e) => assignRpToCentre(centre.id, e.target.value)}
                  >
                    <option value="">-- No Teacher Assigned --</option>
                    {resourcePersons.map(rp => (
                      <option key={rp.id} value={rp.id}>{rp.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              {centre.status === 'PENDING_APPROVAL' && (
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--cpet-border)' }}>
                  <button
                    className="btn btn-success btn-sm btn-block"
                    onClick={() => updateCentreStatus(centre.id, 'ACTIVE')}
                  >
                    <CheckCircle size={14} /> Approve & Activate Centre
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Register New Centre Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Mahallu Study Centre</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Centre Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Bafakhy Thangal Memorial Mahallu Study Centre"
                    value={formData.centre_name}
                    onChange={e => setFormData({ ...formData, centre_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Place / Town <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Tanur"
                      value={formData.place}
                      onChange={e => setFormData({ ...formData, place: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District <span className="required">*</span></label>
                    <select
                      className="form-select"
                      value={formData.district}
                      onChange={e => setFormData({ ...formData, district: e.target.value })}
                    >
                      {districts.filter(d => d !== 'All').map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Local Mahallu Jama'ath</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tanur Valiya Juma Masjid"
                      value={formData.mahallu_name}
                      onChange={e => setFormData({ ...formData, mahallu_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="676302"
                      value={formData.pincode}
                      onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--cpet-border)', margin: '1rem 0' }} />
                <h4 style={{ fontSize: '0.9rem', color: 'var(--cpet-primary)', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Mahallu Committee Office Bearers
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">President Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Usman Haji"
                      value={formData.committee_president_name}
                      onChange={e => setFormData({ ...formData, committee_president_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">President Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="9847110022"
                      value={formData.committee_president_phone}
                      onChange={e => setFormData({ ...formData, committee_president_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Secretary Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Abdul Kareem"
                      value={formData.committee_secretary_name}
                      onChange={e => setFormData({ ...formData, committee_secretary_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Secretary Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="9847220033"
                      value={formData.committee_secretary_phone}
                      onChange={e => setFormData({ ...formData, committee_secretary_phone: e.target.value })}
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--cpet-border)', margin: '1rem 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Assign Resource Person</label>
                    <select
                      className="form-select"
                      value={formData.assigned_rp_id}
                      onChange={e => setFormData({ ...formData, assigned_rp_id: e.target.value })}
                    >
                      {resourcePersons.map(rp => (
                        <option key={rp.id} value={rp.id}>{rp.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Active Course</label>
                    <select
                      className="form-select"
                      value={formData.active_course_id}
                      onChange={e => setFormData({ ...formData, active_course_id: e.target.value })}
                    >
                      {courses.filter(c => c.category === 'MAHALLU').map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Study Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
