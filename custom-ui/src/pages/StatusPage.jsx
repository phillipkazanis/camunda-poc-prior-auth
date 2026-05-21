import { useState } from 'react'
import { searchProcessInstances, getVariables } from '../api/camunda'

function statusFromVars(vars) {
  if (!vars) return 'processing'
  const r = vars.recommendation
  if (r === 'approve') return 'approved'
  if (r === 'reject')  return 'rejected'
  if (r === 'awaiting_info') return 'awaiting_info'
  if (r === 'escalate') return 'escalate'
  return 'processing'
}

function StatusDisplay({ status, vars }) {
  const configs = {
    approved:      { icon: '✓', label: 'Approved',                cls: 'status-approved', msg: 'Your prior authorisation has been approved. Your GP has been notified and the patient may proceed.' },
    rejected:      { icon: '✗', label: 'Not Approved',            cls: 'status-rejected', msg: 'This request was not approved. Your GP has received detailed reasoning and next steps.' },
    awaiting_info: { icon: '📧', label: 'Additional Info Required', cls: 'status-pending',  msg: "We've contacted your GP requesting additional clinical documentation. Assessment will continue once received." },
    escalate:      { icon: '👨‍⚕️', label: 'Clinical Review',       cls: 'status-active',   msg: 'This request has been referred to a senior clinical reviewer. You will be notified shortly.' },
    processing:    { icon: '⚙️', label: 'Under Assessment',        cls: 'status-waiting',  msg: 'Your request is being assessed by our clinical AI system. This typically takes a few minutes.' },
  }
  const c = configs[status] || configs.processing

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--th-blue-light)', border: '3px solid var(--pt-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30, margin: '0 auto 20px',
      }}>{c.icon}</div>
      <span className={`status-badge ${c.cls}`} style={{ fontSize: 13, padding: '6px 16px', marginBottom: 16, display: 'inline-flex' }}>
        {c.label}
      </span>
      <p style={{ color: 'var(--pt-muted)', fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>{c.msg}</p>
      {vars?.caseSummary && (
        <div className="callout callout-blue" style={{ marginTop: 24, textAlign: 'left', maxWidth: 560, margin: '24px auto 0' }}>
          <span className="callout-icon">📄</span>
          <div>
            <strong style={{ display: 'block', marginBottom: 6 }}>Clinical Summary</strong>
            <span style={{ fontSize: 13, lineHeight: 1.6 }}>{vars.caseSummary}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StatusPage() {
  const [ref, setRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function check() {
    if (!ref.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const instances = await searchProcessInstances({ bpmnProcessId: 'prior-auth-process' })
      let found = null
      for (const inst of instances.slice(0, 20)) {
        const vars = await getVariables(inst.processInstanceKey)
        if (vars.patientId === ref.trim() || vars.patientId === ref.trim().toUpperCase()) {
          found = { instance: inst, vars }
          break
        }
      }
      if (!found) {
        setError('No request found with that reference number. Please check and try again.')
      } else {
        setResult(found)
      }
    } catch (e) {
      setError('Unable to retrieve status. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="pt-card fade-in">
        <div className="pt-card-header">
          <div className="pt-card-icon">🔍</div>
          <div><h2>Check Request Status</h2><p>Enter your reference number to view the current status</p></div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input className="pt-input" placeholder="e.g. PA-M8X3K2" value={ref}
            onChange={e => setRef(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={check} disabled={!ref.trim() || loading}>
            {loading ? <span className="spinner" /> : 'Check'}
          </button>
        </div>
        {error && (
          <div className="callout callout-amber" style={{ marginTop: 16 }}>
            <span className="callout-icon">⚠️</span><span>{error}</span>
          </div>
        )}
        {result && (
          <div style={{ marginTop: 24 }}>
            <StatusDisplay status={statusFromVars(result.vars)} vars={result.vars} />
            <div style={{ borderTop: '1px solid var(--pt-border)', paddingTop: 16, marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 13 }}>
              <div style={{ color: 'var(--pt-muted)' }}>Patient</div>
              <div style={{ fontWeight: 500 }}>{result.vars.patientName || '—'}</div>
              <div style={{ color: 'var(--pt-muted)' }}>Procedure</div>
              <div style={{ fontWeight: 500 }}>{result.vars.procedureRequested || '—'}</div>
              <div style={{ color: 'var(--pt-muted)' }}>State</div>
              <div><span className={`status-badge ${result.instance.state === 'ACTIVE' ? 'status-waiting' : 'status-approved'}`} style={{ fontSize: 11 }}>{result.instance.state}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
