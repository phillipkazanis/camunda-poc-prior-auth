import { useState, useEffect } from 'react'
import { searchUserTasks, completeUserTask } from '../api/camunda'

export default function CaseModal({ instance, onClose }) {
  const [tasks, setTasks] = useState([])
  const [overrideDecision, setOverrideDecision] = useState('approve')
  const [reviewerNotes, setReviewerNotes] = useState('')
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const vars = instance.vars || {}

  useEffect(() => {
    loadTasks()
  }, [instance.processInstanceKey])

  async function loadTasks() {
    try {
      const t = await searchUserTasks({ processInstanceKey: String(instance.processInstanceKey) })
      setTasks(t)
    } catch (e) {
      console.error('Failed to load tasks:', e)
    }
  }

  async function submitOverride() {
    if (!tasks.length) return
    setCompleting(true)
    try {
      await completeUserTask(tasks[0].userTaskKey, { overrideDecision, reviewerNotes })
      setCompleted(true)
    } catch (e) {
      alert('Failed to submit override: ' + (e?.response?.data?.message || e.message))
    } finally {
      setCompleting(false)
    }
  }

  const recColors = { approve: 'var(--ad-green)', reject: 'var(--ad-red)', escalate: '#9B72FF', awaiting_info: 'var(--ad-amber)' }
  const recColor = recColors[vars.recommendation] || 'var(--ad-muted)'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Case Review — {vars.patientId || 'Unknown'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div className="ad-card" style={{ margin: 0 }}>
              <h3 style={{ marginBottom: 12 }}>👤 Patient</h3>
              <div className="detail-grid" style={{ marginBottom: 0 }}>
                <div className="detail-item"><div className="detail-key">Name</div><div className="detail-val">{vars.patientName || '—'}</div></div>
                <div className="detail-item"><div className="detail-key">DOB</div><div className="detail-val">{vars.dateOfBirth || '—'}</div></div>
                <div className="detail-item"><div className="detail-key">Medicare</div><div className="detail-val">{vars.medicareNumber || '—'}</div></div>
                <div className="detail-item"><div className="detail-key">Cover</div><div className="detail-val">{vars.coverageType || '—'}</div></div>
              </div>
            </div>
            <div className="ad-card" style={{ margin: 0 }}>
              <h3 style={{ marginBottom: 12 }}>🏥 Referral</h3>
              <div className="detail-grid" style={{ marginBottom: 0 }}>
                <div className="detail-item"><div className="detail-key">GP</div><div className="detail-val">{vars.gpName || '—'}</div></div>
                <div className="detail-item"><div className="detail-key">Urgency</div><div className="detail-val">{vars.urgencyLevel || '—'}</div></div>
                <div className="detail-item full"><div className="detail-key">Practice</div><div className="detail-val">{vars.practiceName || '—'}</div></div>
                <div className="detail-item full"><div className="detail-key">Procedure</div><div className="detail-val">{vars.procedureRequested || vars.procedureCode || '—'}</div></div>
              </div>
            </div>
          </div>

          {vars.recommendation && (
            <div className="ad-card" style={{ borderLeft: `3px solid ${recColor}` }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span>🤖</span> AI Recommendation
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: recColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {vars.recommendation?.replace('_', ' ')}
                </span>
              </h3>
              {vars.caseSummary && (
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ad-text)', marginBottom: 10 }}>
                  {vars.caseSummary}
                </div>
              )}
              {vars.reasoning && (
                <div style={{ background: 'var(--ad-bg)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, color: 'var(--ad-muted)', lineHeight: 1.6, fontFamily: 'var(--mono)' }}>
                  {vars.reasoning}
                </div>
              )}
            </div>
          )}

          {vars.clinicalNotes && (
            <div className="ad-card">
              <h3 style={{ marginBottom: 8 }}>📋 GP Clinical Notes</h3>
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>{vars.clinicalNotes}</p>
            </div>
          )}

          {tasks.length > 0 && !completed && (
            <div className="ad-card" style={{ borderLeft: '3px solid var(--ad-accent)' }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚖️</span> Clinical Override
                <span className="ad-badge ad-badge-blue" style={{ marginLeft: 'auto' }}>Action Required</span>
              </h3>
              <div className="ad-field">
                <label className="ad-label">Override Decision</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className={`ad-btn ${overrideDecision === 'approve' ? 'ad-btn-success' : 'ad-btn-ghost'}`}
                    onClick={() => setOverrideDecision('approve')}>✓ Approve</button>
                  <button className={`ad-btn ${overrideDecision === 'reject' ? 'ad-btn-danger' : 'ad-btn-ghost'}`}
                    onClick={() => setOverrideDecision('reject')}>✗ Reject</button>
                </div>
              </div>
              <div className="ad-field">
                <label className="ad-label">Reviewer Notes <span style={{ color: 'var(--ad-muted)', fontWeight: 400, textTransform: 'none' }}>(required)</span></label>
                <textarea className="ad-textarea" rows={3}
                  placeholder="Document your clinical reasoning for this decision…"
                  value={reviewerNotes}
                  onChange={e => setReviewerNotes(e.target.value)} />
              </div>
            </div>
          )}

          {completed && (
            <div className="callout callout-teal">
              <span className="callout-icon">✓</span>
              <span>Override submitted. The GP will be notified with the outcome.</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="ad-btn ad-btn-ghost" onClick={onClose}>Close</button>
          {tasks.length > 0 && !completed && (
            <button
              className={`ad-btn ${overrideDecision === 'approve' ? 'ad-btn-success' : 'ad-btn-danger'}`}
              disabled={!reviewerNotes.trim() || completing}
              onClick={submitOverride}>
              {completing ? '…' : `Submit ${overrideDecision === 'approve' ? 'Approval' : 'Rejection'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
