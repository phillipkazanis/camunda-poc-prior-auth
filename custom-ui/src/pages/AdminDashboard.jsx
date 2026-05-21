import { useState, useEffect } from 'react'
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

const STATUS_CONFIG = {
  approved:      { label: 'Approved',        cls: 'ad-badge-green' },
  rejected:      { label: 'Not Approved',    cls: 'ad-badge-red' },
  awaiting_info: { label: 'Awaiting Info',   cls: 'ad-badge-amber' },
  escalate:      { label: 'Clinical Review', cls: 'ad-badge-purple' },
  processing:    { label: 'Processing',      cls: 'ad-badge-blue' },
}

export default function AdminDashboard({ onOpenCase }) {
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadInstances()
    const interval = setInterval(loadInstances, 15000)
    return () => clearInterval(interval)
  }, [])

  async function loadInstances() {
    try {
      const active    = await searchProcessInstances({ bpmnProcessId: 'prior-auth-process', state: 'ACTIVE' })
      const completed = await searchProcessInstances({ bpmnProcessId: 'prior-auth-process', state: 'COMPLETED' })
      const all = [...active, ...completed].slice(0, 50)

      const enriched = await Promise.all(
        all.map(async inst => {
          try {
            const vars = await getVariables(inst.processInstanceKey)
            return { ...inst, vars, status: statusFromVars(vars) }
          } catch {
            return { ...inst, vars: {}, status: 'processing' }
          }
        })
      )
      setInstances(enriched)
    } catch (e) {
      console.error('Failed to load instances:', e)
    } finally {
      setLoading(false)
    }
  }

  const counts = {
    total:         instances.length,
    approved:      instances.filter(i => i.status === 'approved').length,
    awaiting_info: instances.filter(i => i.status === 'awaiting_info').length,
    escalate:      instances.filter(i => i.status === 'escalate').length,
    active:        instances.filter(i => i.state === 'ACTIVE').length,
  }

  const filtered = instances.filter(i => {
    if (filter !== 'ALL' && i.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (i.vars.patientName   || '').toLowerCase().includes(q) ||
        (i.vars.patientId     || '').toLowerCase().includes(q) ||
        (i.vars.gpName        || '').toLowerCase().includes(q) ||
        (i.vars.procedureCode || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total Requests</div>
          <div className="stat-value blue">{counts.total}</div>
          <div className="stat-sub">{counts.active} active</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Approved</div>
          <div className="stat-value green">{counts.approved}</div>
          <div className="stat-sub">{counts.total > 0 ? Math.round(counts.approved / counts.total * 100) : 0}% approval rate</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Awaiting GP Info</div>
          <div className="stat-value amber">{counts.awaiting_info}</div>
          <div className="stat-sub">Pending response</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Clinical Review</div>
          <div className="stat-value red">{counts.escalate}</div>
          <div className="stat-sub">Needs human review</div>
        </div>
      </div>

      <div className="ad-table-wrap">
        <div className="ad-table-header">
          <h3>Prior Authorisation Requests</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={{ background: 'var(--ad-bg)', border: '1px solid var(--ad-border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: 13, color: 'var(--ad-text)', outline: 'none', width: 200, fontFamily: 'var(--font)' }}
              placeholder="Search patient, GP…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              style={{ background: 'var(--ad-bg)', border: '1px solid var(--ad-border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: 13, color: 'var(--ad-text)', outline: 'none', fontFamily: 'var(--font)' }}
              value={filter}
              onChange={e => setFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="processing">Processing</option>
              <option value="awaiting_info">Awaiting Info</option>
              <option value="escalate">Clinical Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Not Approved</option>
            </select>
            <button className="topbar-btn" onClick={loadInstances}>↻ Refresh</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ad-muted)' }}>
            <span className="spinner" style={{ borderColor: 'rgba(77,142,255,0.2)', borderTopColor: 'var(--ad-accent)' }} />
            <div style={{ marginTop: 12, fontSize: 13 }}>Loading requests…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No requests found</h3>
            <p>{search || filter !== 'ALL' ? 'Try adjusting your filters.' : 'No prior auth requests have been submitted yet.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Patient</th>
                <th>Procedure</th>
                <th>GP</th>
                <th>Submitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inst => {
                const cfg = STATUS_CONFIG[inst.status] || STATUS_CONFIG.processing
                return (
                  <tr key={inst.processInstanceKey}>
                    <td className="td-mono">{inst.vars.patientId || String(inst.processInstanceKey).slice(-8)}</td>
                    <td className="td-primary">{inst.vars.patientName || '—'}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{inst.vars.procedureRequested || inst.vars.procedureCode || '—'}</div>
                      {inst.vars.urgencyLevel && inst.vars.urgencyLevel !== 'Routine' && (
                        <span className={`ad-badge ${inst.vars.urgencyLevel === 'Emergency' ? 'ad-badge-red' : 'ad-badge-amber'}`} style={{ marginTop: 4 }}>
                          {inst.vars.urgencyLevel}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--ad-muted)', fontSize: 13 }}>{inst.vars.gpName || '—'}</td>
                    <td className="td-mono" style={{ fontSize: 11 }}>{formatDate(inst.startDate)}</td>
                    <td><span className={`ad-badge ${cfg.cls}`}>{cfg.label}</span></td>
                    <td>
                      <button className="ad-btn ad-btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}
                        onClick={() => onOpenCase(inst)}>
                        View →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
