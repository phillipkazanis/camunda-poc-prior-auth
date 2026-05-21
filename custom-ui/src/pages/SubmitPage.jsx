import { useState } from 'react'
import { startProcess } from '../api/camunda'

const PROCEDURES = [
  { value: 'MRI-LUMBAR',       label: 'MRI — Lumbar Spine (MBS 63151)' },
  { value: 'MRI-BRAIN',        label: 'MRI — Brain (MBS 63001)' },
  { value: 'KNEE-ARTHROSCOPY', label: 'Knee Arthroscopy (MBS 49557)' },
]

const URGENCY  = ['Routine', 'Urgent', 'Emergency']
const COVERAGE = ['Hospital', 'Extras', 'Combined']

export default function SubmitPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    patientName: '', dateOfBirth: '', medicareNumber: '',
    coverageType: 'Combined', gpName: '', gpEmail: '', practiceName: '',
    procedureRequested: '', procedureCode: '', diagnosis: '',
    urgencyLevel: 'Routine', clinicalNotes: '', patientId: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inp = (k) => ({ value: form[k], onChange: e => set(k, e.target.value) })

  function pickProcedure(val) {
    const p = PROCEDURES.find(x => x.value === val)
    set('procedureCode', val)
    set('procedureRequested', p ? p.label.split('(')[0].trim() : '')
  }

  function generateRef() {
    return 'PA-' + Date.now().toString(36).toUpperCase()
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const patientId = form.patientId || generateRef()
      const variables = {
        ...form,
        patientId,
        clinicalDocuments: [{ documentId: patientId, documentType: 'referral', url: '' }]
      }
      const instance = await startProcess('prior-auth-process', variables)
      setSubmitted({ ref: patientId, instanceKey: instance.processInstanceKey })
      setStep(4)
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = ['Patient Details', 'GP & Referral', 'Clinical Info', 'Submitted']

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="steps">
        {steps.map((label, i) => (
          <div key={i} style={{ display: 'contents' }}>
            {i > 0 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
            <div className={`step ${step === i+1 ? 'active' : ''} ${step > i+1 ? 'done' : ''}`}>
              <div className="step-num">{step > i+1 ? '✓' : i+1}</div>
              <span className="step-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="pt-card fade-in">
          <div className="pt-card-header">
            <div className="pt-card-icon">👤</div>
            <div><h2>Patient Information</h2><p>Member details and cover type</p></div>
          </div>
          <div className="callout callout-blue">
            <span className="callout-icon">ℹ️</span>
            <span>Please have your Telstra Health member number ready. All fields marked with * are required.</span>
          </div>
          <div className="pt-form-grid">
            <div className="pt-field full">
              <label className="pt-label">Full Name <span className="required">*</span></label>
              <input className="pt-input" placeholder="e.g. Sarah Johnson" {...inp('patientName')} />
            </div>
            <div className="pt-field">
              <label className="pt-label">Date of Birth <span className="required">*</span></label>
              <input className="pt-input" type="date" {...inp('dateOfBirth')} />
            </div>
            <div className="pt-field">
              <label className="pt-label">Medicare Number <span className="required">*</span></label>
              <input className="pt-input" placeholder="XXXX XXXXX X" {...inp('medicareNumber')} />
            </div>
            <div className="pt-field">
              <label className="pt-label">Member ID (optional)</label>
              <input className="pt-input" placeholder="TH-XXXXXXXX" {...inp('patientId')} />
            </div>
            <div className="pt-field">
              <label className="pt-label">Cover Type <span className="required">*</span></label>
              <select className="pt-select" {...inp('coverageType')}>
                {COVERAGE.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button className="btn btn-primary btn-lg"
              disabled={!form.patientName || !form.dateOfBirth || !form.medicareNumber}
              onClick={() => setStep(2)}>Continue →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="pt-card fade-in">
          <div className="pt-card-header">
            <div className="pt-card-icon">🏥</div>
            <div><h2>GP & Procedure Details</h2><p>Referring doctor and requested procedure</p></div>
          </div>
          <div className="pt-form-grid">
            <div className="pt-field">
              <label className="pt-label">GP Full Name <span className="required">*</span></label>
              <input className="pt-input" placeholder="Dr. Jane Smith" {...inp('gpName')} />
            </div>
            <div className="pt-field">
              <label className="pt-label">GP Email <span className="required">*</span></label>
              <input className="pt-input" type="email" placeholder="dr.smith@practice.com.au" {...inp('gpEmail')} />
            </div>
            <div className="pt-field full">
              <label className="pt-label">Practice Name <span className="required">*</span></label>
              <input className="pt-input" placeholder="e.g. Northside Medical Centre" {...inp('practiceName')} />
            </div>
            <div className="pt-field full">
              <label className="pt-label">Procedure Requested <span className="required">*</span></label>
              <select className="pt-select" value={form.procedureCode} onChange={e => pickProcedure(e.target.value)}>
                <option value="">Select a procedure…</option>
                {PROCEDURES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="pt-field">
              <label className="pt-label">Urgency Level <span className="required">*</span></label>
              <select className="pt-select" {...inp('urgencyLevel')}>
                {URGENCY.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="pt-field">
              <label className="pt-label">Working Diagnosis <span className="required">*</span></label>
              <input className="pt-input" placeholder="e.g. Lumbar disc herniation" {...inp('diagnosis')} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary btn-lg"
              disabled={!form.gpName || !form.gpEmail || !form.practiceName || !form.procedureCode || !form.diagnosis}
              onClick={() => setStep(3)}>Continue →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="pt-card fade-in">
          <div className="pt-card-header">
            <div className="pt-card-icon">📋</div>
            <div><h2>Clinical Notes</h2><p>GP's supporting clinical information</p></div>
          </div>
          <div className="callout callout-teal">
            <span className="callout-icon">💡</span>
            <span>Include relevant history, duration of symptoms, conservative treatments tried, and any red flag findings. This helps expedite assessment.</span>
          </div>
          <div className="pt-form-grid cols-1">
            <div className="pt-field">
              <label className="pt-label">Clinical Notes & History <span className="required">*</span></label>
              <textarea className="pt-textarea" rows={6}
                placeholder="e.g. Patient presents with 8 weeks of lower back pain radiating to left leg. Has completed 6 weeks of physiotherapy without improvement..."
                {...inp('clinicalNotes')} />
            </div>
          </div>
          <div style={{ background: 'var(--pt-bg)', borderRadius: 'var(--radius-md)', padding: '16px 20px', margin: '20px 0', border: '1px solid var(--pt-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pt-muted)', marginBottom: 12 }}>Submission Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
              <div><span style={{ color: 'var(--pt-muted)' }}>Patient: </span><strong>{form.patientName}</strong></div>
              <div><span style={{ color: 'var(--pt-muted)' }}>GP: </span><strong>{form.gpName}</strong></div>
              <div><span style={{ color: 'var(--pt-muted)' }}>Procedure: </span><strong>{form.procedureRequested || form.procedureCode}</strong></div>
              <div><span style={{ color: 'var(--pt-muted)' }}>Urgency: </span><strong>{form.urgencyLevel}</strong></div>
            </div>
          </div>
          {error && (
            <div className="callout callout-amber" style={{ marginBottom: 16 }}>
              <span className="callout-icon">⚠️</span><span>{error}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary btn-lg"
              disabled={!form.clinicalNotes || loading}
              onClick={handleSubmit}>
              {loading ? <><span className="spinner" /> Submitting…</> : '✓ Submit Request'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && submitted && (
        <div className="pt-card fade-in">
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>Request Submitted</h2>
            <p>Your prior authorisation request has been received and is being assessed by our clinical AI system. You'll receive a confirmation at <strong>{form.gpEmail}</strong>.</p>
            <div className="ref-pill">REF: {submitted.ref}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => { setStep(1); setForm({ patientName: '', dateOfBirth: '', medicareNumber: '', coverageType: 'Combined', gpName: '', gpEmail: '', practiceName: '', procedureRequested: '', procedureCode: '', diagnosis: '', urgencyLevel: 'Routine', clinicalNotes: '', patientId: '' }); setSubmitted(null) }}>
                Submit Another
              </button>
            </div>
            <div className="callout callout-blue" style={{ marginTop: 28, textAlign: 'left' }}>
              <span className="callout-icon">📧</span>
              <div>
                <strong>What happens next?</strong>
                <ul style={{ marginTop: 6, paddingLeft: 16, lineHeight: 1.8 }}>
                  <li>AI agent reviews clinical documentation against guidelines</li>
                  <li>Decision within 2 business days for routine requests</li>
                  <li>GP notified by email with outcome and reasoning</li>
                  <li>If additional info is needed, GP will be contacted directly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
