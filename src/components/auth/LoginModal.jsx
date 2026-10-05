import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, GraduationCap, Lock, Phone, Mail, AlertCircle, X } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const { loginAdmin, loginRp, showToast } = useApp();
  const [loginTab, setLoginTab] = useState('admin'); // 'admin' | 'rp'

  // Admin form
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // RP form
  const [rpPhone, setRpPhone] = useState('');
  const [rpPassword, setRpPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const success = loginAdmin(adminUsername.trim(), adminPassword.trim());
    if (success) {
      showToast('Welcome back, Super Admin!');
      onClose();
    } else {
      setErrorMsg('Invalid Super Admin credentials. Please check your username and password.');
    }
  };

  const handleRpSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const success = loginRp(rpPhone.trim(), rpPassword.trim());
    if (success) {
      showToast('Logged in successfully to Teacher Portal!');
      onClose();
    } else {
      setErrorMsg('Invalid mobile number or password. Please contact the CPET office if you forgot your credentials.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} color="var(--cpet-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Authorized Portal Access</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--cpet-border)', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => { setLoginTab('admin'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              background: loginTab === 'admin' ? 'white' : 'transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: loginTab === 'admin' ? 'var(--cpet-primary)' : '#64748b',
              borderBottom: loginTab === 'admin' ? '2.5px solid var(--cpet-primary)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <ShieldCheck size={16} />
            <span>Super Admin</span>
          </button>

          <button
            type="button"
            onClick={() => { setLoginTab('rp'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              background: loginTab === 'rp' ? 'white' : 'transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: loginTab === 'rp' ? 'var(--cpet-accent)' : '#64748b',
              borderBottom: loginTab === 'rp' ? '2.5px solid var(--cpet-accent)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <GraduationCap size={16} />
            <span>Resource Person</span>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {loginTab === 'admin' ? (
            <form onSubmit={handleAdminSubmit}>
              <div className="form-group">
                <label className="form-label">Super Admin Email / Username</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    required
                    placeholder="cpet@dhiu.in"
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1.5rem' }}>
                <ShieldCheck size={16} /> Sign In to Super Admin
              </button>
            </form>
          ) : (
            <form onSubmit={handleRpSubmit}>
              <div className="form-group">
                <label className="form-label">Registered Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="tel"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    required
                    placeholder="e.g. 9847012345"
                    value={rpPhone}
                    onChange={e => setRpPhone(e.target.value)}
                  />
                </div>
                <span className="form-helper">Enter the 10-digit mobile number given by CPET office.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    required
                    placeholder="••••••••"
                    value={rpPassword}
                    onChange={e => setRpPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-accent btn-block" style={{ marginTop: '1.5rem' }}>
                <GraduationCap size={16} /> Sign In to Teacher Portal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
