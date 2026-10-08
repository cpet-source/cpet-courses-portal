import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LoginModal } from './auth/LoginModal';
import { ShieldCheck, GraduationCap, Users, Lock, LogOut, Building2, Cloud, AlertCircle, UserCheck } from 'lucide-react';

export const Navbar = () => {
  const {
    activeRole,
    setActiveRole,
    currentUser,
    logout,
    currentRp,
    isCloudConnected,
    cloudError
  } = useApp();

  const [showLoginModal, setShowLoginModal] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return (p.get('tab') === 'marketing' || p.get('admin') || p.get('login')) && !currentUser;
    } catch (e) {
      return false;
    }
  });

  React.useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('tab') === 'marketing' || p.get('admin')) {
        if (currentUser?.role === 'admin') {
          if (activeRole !== 'admin') setActiveRole('admin');
        } else if (!currentUser) {
          setShowLoginModal(true);
        }
      }
    } catch (e) {}
  }, [currentUser, activeRole, setActiveRole]);

  return (
    <header className="cpet-header">
      <div className="cpet-navbar">
        {/* Brand */}
        <div className="cpet-brand" onClick={() => setActiveRole(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'rp') : 'student')}>
          <div className="cpet-logo-badge">
            <Building2 size={24} />
          </div>
          <div className="cpet-brand-text">
            <h1>CPET PORTAL</h1>
            <p>Centre for Public Education & Training — DHIU</p>
          </div>
        </div>

        {/* Navigation & Role Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* If Active as Volunteer Gate Desk */}
          {activeRole === 'volunteer_desk' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                🟢 Gate Desk Mode
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setActiveRole('student');
                  if (window.history.replaceState) {
                    window.history.replaceState({}, '', window.location.pathname);
                  }
                }}
                style={{ fontSize: '0.8rem' }}
              >
                Exit to Public
              </button>
            </div>
          )}

          {/* If Logged In as Super Admin */}
          {currentUser && currentUser.role === 'admin' && activeRole !== 'volunteer_desk' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isCloudConnected ? (
                <span className="badge badge-success hide-on-mobile" style={{ fontSize: '0.72rem' }}>
                  <Cloud size={12} /> Cloud Active
                </span>
              ) : (
                <span className="badge badge-warning hide-on-mobile" style={{ fontSize: '0.72rem' }} title={cloudError || 'Cloud sync pending'}>
                  <AlertCircle size={12} /> Local Mode
                </span>
              )}
              <div className="role-switcher">
                <button
                  className={`role-btn ${activeRole === 'admin' ? 'active admin' : ''}`}
                  onClick={() => setActiveRole('admin')}
                >
                  <ShieldCheck size={15} />
                  <span>Admin Suite</span>
                </button>
                <button
                  className={`role-btn ${activeRole === 'student' ? 'active' : ''}`}
                  onClick={() => setActiveRole('student')}
                >
                  <Users size={15} />
                  <span>Public View</span>
                </button>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Sign out of Super Admin"
                style={{ color: '#b91c1c' }}
              >
                <LogOut size={14} />
                <span className="hide-on-mobile">Logout</span>
              </button>
            </div>
          )}

          {/* If Logged In as Resource Person */}
          {currentUser && currentUser.role === 'rp' && activeRole !== 'volunteer_desk' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="role-switcher">
                <button
                  className={`role-btn ${activeRole === 'rp' ? 'active rp' : ''}`}
                  onClick={() => setActiveRole('rp')}
                >
                  <GraduationCap size={15} />
                  <span>{currentRp?.full_name?.split(' ')[0] || 'Teacher'} Portal</span>
                </button>
                <button
                  className={`role-btn ${activeRole === 'student' ? 'active' : ''}`}
                  onClick={() => setActiveRole('student')}
                >
                  <Users size={15} />
                  <span>Public View</span>
                </button>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Sign out of Teacher Portal"
                style={{ color: '#b91c1c' }}
              >
                <LogOut size={14} />
                <span className="hide-on-mobile">Logout</span>
              </button>
            </div>
          )}

          {/* If NOT Logged In (Public / Students) */}
          {!currentUser && activeRole !== 'volunteer_desk' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {isCloudConnected && (
                <span className="badge badge-success hide-on-mobile" style={{ fontSize: '0.72rem' }}>
                  <Cloud size={12} /> Cloud Connected
                </span>
              )}

              <button
                className="btn btn-outline btn-sm hide-on-mobile"
                onClick={() => setActiveRole('volunteer_desk')}
                style={{ fontSize: '0.8rem', borderColor: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Open Event Entrance Check-In Desk for Volunteers"
              >
                <UserCheck size={13} />
                <span>Gate Desk</span>
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowLoginModal(true)}
                style={{ background: 'var(--cpet-primary)', fontSize: '0.82rem' }}
              >
                <Lock size={13} />
                <span>Office & Faculty Login</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </header>
  );
};
