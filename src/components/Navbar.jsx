import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, GraduationCap, Users, RotateCcw, Building2 } from 'lucide-react';

export const Navbar = () => {
  const { activeRole, setActiveRole, currentRp, resourcePersons, setCurrentRpId, resetAllData } = useApp();

  return (
    <header className="cpet-header">
      <div className="cpet-navbar">
        {/* Brand */}
        <div className="cpet-brand" onClick={() => setActiveRole('admin')}>
          <div className="cpet-logo-badge">
            <Building2 size={24} />
          </div>
          <div className="cpet-brand-text">
            <h1>CPET PORTAL</h1>
            <p>Centre for Public Education & Training — DHIU</p>
          </div>
        </div>

        {/* Global Role Switcher */}
        <div className="role-switcher">
          <button
            className={`role-btn ${activeRole === 'admin' ? 'active admin' : ''}`}
            onClick={() => setActiveRole('admin')}
            title="Super Admin Master Control"
          >
            <ShieldCheck size={16} />
            <span>Super Admin</span>
          </button>

          <button
            className={`role-btn ${activeRole === 'rp' ? 'active rp' : ''}`}
            onClick={() => setActiveRole('rp')}
            title="Resource Person / Teacher Portal"
          >
            <GraduationCap size={16} />
            <span>RP Portal</span>
          </button>

          <button
            className={`role-btn ${activeRole === 'student' ? 'active' : ''}`}
            onClick={() => setActiveRole('student')}
            title="Student Phone Lookup & Admissions"
          >
            <Users size={16} />
            <span>Student & Public</span>
          </button>
        </div>

        {/* Right Actions / RP Selector if in RP mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {activeRole === 'rp' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '20px' }}>
              <span style={{ color: '#64748b' }}>Teacher:</span>
              <select
                value={currentRp.id}
                onChange={(e) => setCurrentRpId(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 700, color: 'var(--cpet-primary)', cursor: 'pointer', outline: 'none' }}
              >
                {resourcePersons.map(rp => (
                  <option key={rp.id} value={rp.id}>{rp.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              if (window.confirm('Reset all demo courses, centres, and student records to defaults?')) {
                resetAllData();
              }
            }}
            className="btn btn-secondary btn-sm"
            title="Reset demo data"
            style={{ color: '#64748b' }}
          >
            <RotateCcw size={14} />
            <span className="hide-on-mobile">Reset Data</span>
          </button>
        </div>
      </div>
    </header>
  );
};
