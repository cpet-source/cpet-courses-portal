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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Portal Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div style={{ maxWidth: '520px', width: '100%', background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '26px' }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Something went wrong loading this screen
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{ background: '#32357e', color: 'white', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = window.location.origin + window.location.pathname;
                }}
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Go to Portal Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
