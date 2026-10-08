import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RPDashboard } from './components/rp/RPDashboard';
import { StudentHub } from './components/student/StudentHub';
import { VolunteerGateDesk } from './components/volunteer/VolunteerGateDesk';
import { CheckCircle, AlertCircle, Info, Heart } from 'lucide-react';

const MainLayout = () => {
  const { activeRole, toast } = useApp();

  return (
    <div className="cpet-app">
      <Navbar />

      <main className="cpet-main">
        {activeRole === 'admin' && <AdminDashboard />}
        {activeRole === 'rp' && <RPDashboard />}
        {activeRole === 'student' && <StudentHub />}
        {activeRole === 'volunteer_desk' && <VolunteerGateDesk />}
      </main>

      {/* Global Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'danger' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#32357e',
          color: 'white',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          zIndex: 999,
          animation: 'slideUp 0.2s ease-out'
        }}>
          {toast.type === 'danger' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: 'white', borderTop: '1px solid var(--cpet-border)', padding: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
        <p style={{ fontWeight: 700, color: 'var(--cpet-primary)', margin: 0 }}>
          Centre for Public Education & Training (CPET)
        </p>
        <p style={{ margin: '4px 0 0' }}>
          Darul Huda Islamic University, Chemmad, Malappuram District, Kerala — 676306
        </p>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
