import { useState } from 'react'
import { TelstraHealthWordmark } from './components/Logo'
import SubmitPage from './pages/SubmitPage'
import StatusPage from './pages/StatusPage'
import AdminDashboard from './pages/AdminDashboard'
import CaseModal from './pages/CaseModal'

function PatientShell({ onGoAdmin }) {
  const [page, setPage] = useState('submit')

  return (
    <div className="patient-shell">
      <nav className="patient-nav">
        <div className="logo">
          <TelstraHealthWordmark white />
        </div>
        <div className="nav-links">
          <button onClick={() => setPage('submit')} style={{ color: page === 'submit' ? '#fff' : undefined }}>
            Submit Request
          </button>
          <button onClick={() => setPage('status')} style={{ color: page === 'status' ? '#fff' : undefined }}>
            Check Status
          </button>
          <button className="admin-link" onClick={onGoAdmin}>
            ⚙ Clinician Portal
          </button>
        </div>
      </nav>

      {page === 'submit' && (
        <>
          <div className="patient-hero">
            <div className="patient-hero-inner">
              <div className="badge">AI-Powered Assessment</div>
              <h1>Prior Authorisation<br />Made Simple</h1>
              <p>Submit clinical prior authorisation requests and receive fast, evidence-based decisions powered by our AI assessment system — typically within minutes.</p>
            </div>
          </div>
          <div className="patient-content">
            <SubmitPage />
          </div>
        </>
      )}

      {page === 'status' && (
        <>
          <div className="patient-hero">
            <div className="patient-hero-inner">
              <div className="badge">Request Tracking</div>
              <h1>Check Your<br />Request Status</h1>
              <p>Enter your reference number to view the current status of your prior authorisation request.</p>
            </div>
          </div>
          <div className="patient-content">
            <StatusPage />
          </div>
        </>
      )}

      <footer style={{
        background: 'var(--th-navy)', color: 'rgba(255,255,255,0.5)',
        padding: '24px 40px', fontSize: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>© 2024 Telstra Health. All rights reserved.</span>
        <span>Prior Authorisation Platform — Powered by Camunda AI</span>
      </footer>
    </div>
  )
}

function AdminShell({ onGoPatient }) {
  const [page, setPage] = useState('dashboard')
  const [selectedCase, setSelectedCase] = useState(null)

  const navItems = [
    { id: 'dashboard', icon: '◉', label: 'Dashboard' },
    { id: 'active',    icon: '⚡', label: 'Active Cases' },
  ]

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
              <path d="M8 10h20v4h-8v12h-4V14H8v-4z" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-logo-text">Telstra Health</div>
            <div className="sidebar-logo-sub">Clinician Portal</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map(item => (
            <button key={item.id}
              className={`sidebar-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}>
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-footer-item" onClick={onGoPatient}>
            <span>←</span> Patient Portal
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1>
            {page === 'dashboard' && 'Prior Auth Dashboard'}
            {page === 'active'    && 'Active Cases'}
          </h1>
          <div className="admin-topbar-actions">
            <span style={{ fontSize: 12, color: 'var(--ad-muted)' }}>camundashowcase_Utility</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ad-green)' }} />
          </div>
        </div>

        <div className="admin-page">
          {(page === 'dashboard' || page === 'active') && (
            <AdminDashboard onOpenCase={setSelectedCase} />
          )}
        </div>
      </main>

      {selectedCase && (
        <CaseModal instance={selectedCase} onClose={() => setSelectedCase(null)} />
      )}
    </div>
  )
}

export default function App() {
  const [shell, setShell] = useState('patient')

  return shell === 'patient'
    ? <PatientShell onGoAdmin={() => setShell('admin')} />
    : <AdminShell onGoPatient={() => setShell('patient')} />
}
