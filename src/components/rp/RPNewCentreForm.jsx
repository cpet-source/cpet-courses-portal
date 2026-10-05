import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building, Plus, CheckCircle, Clock } from 'lucide-react';

export const RPNewCentreForm = ({ onCentreCreated }) => {
  const { currentRp, addCentre, showToast } = useApp();
  const [formData, setFormData] = useState({
    centre_name: '',
    place: '',
    mahallu_name: '',
    district: 'Malappuram',
    pincode: '',
    committee_president_name: '',
    committee_president_phone: '',
    committee_secretary_name: '',
    committee_secretary_phone: ''
  });

  const districts = ['Malappuram', 'Kozhikode', 'Kannur', 'Thrissur', 'Palakkad', 'Wayanad', 'Kasaragod', 'Ernakulam', 'Kollam'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.centre_name || !formData.place) {
      showToast('Please provide centre name and place', 'danger');
      return;
    }

    addCentre({
      ...formData,
      founded_by_rp_id: currentRp.id,
      founded_by_rp_name: currentRp.full_name,
      assigned_rp_id: currentRp.id,
      status: 'PENDING_APPROVAL'
    });

    setFormData({
      centre_name: '',
      place: '',
      mahallu_name: '',
      district: 'Malappuram',
      pincode: '',
      committee_president_name: '',
      committee_president_phone: '',
      committee_secretary_name: '',
      committee_secretary_phone: ''
    });

    if (onCentreCreated) onCentreCreated();
  };

  return (
    <div className="cpet-card">
      <div className="cpet-card-header">
        <div>
          <h3 className="cpet-card-title">
            <Building size={20} />
            Register New Mahallu Study Centre
          </h3>
          <p className="cpet-card-desc">
            After the Mahallu committee grants permission to conduct CPET courses, register their details here for office approval.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Centre Title <span className="required">*</span></label>
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
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Mahallu Jama'ath Name</label>
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
            <label className="form-label">President Mobile No</label>
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
            <label className="form-label">Secretary Mobile No</label>
            <input
              type="tel"
              className="form-input"
              placeholder="9847220033"
              value={formData.committee_secretary_phone}
              onChange={e => setFormData({ ...formData, committee_secretary_phone: e.target.value })}
            />
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
          Founder Tag: <strong>{currentRp.full_name}</strong> (Mobile: {currentRp.phone})
        </div>

        <button type="submit" className="btn btn-primary btn-block">
          <CheckCircle size={16} /> Submit Study Centre for Approval
        </button>
      </form>
    </div>
  );
};
