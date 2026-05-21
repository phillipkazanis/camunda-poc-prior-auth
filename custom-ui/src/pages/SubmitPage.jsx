import { useState, useRef } from 'react'
import { startProcess, uploadDocument } from '../api/camunda'

const PROCEDURES = [
  { value: 'MRI-LUMBAR',       label: 'MRI — Lumbar Spine (MBS 63151)' },
  { value: 'MRI-BRAIN',        label: 'MRI — Brain (MBS 63001)' },
  { value: 'KNEE-ARTHROSCOPY', label: 'Knee Arthroscopy (MBS 49557)' },
]

const URGENCY  = ['Routine', 'Urgent', 'Emergency']
const COVERAGE = ['Hospital', 'Extras', 'Combined']

const DEFAULTS = {
  patientName:        'Margaret Chen',
  dateOfBirth:        '1968-06-14',
  medicareNumber:     '2950 41882 1',
  coverageType:       'Combined',
  gpName:             'Dr Anita Patel',
  gpEmail:            'camundashowcase+resend@gmail.com',
  practiceName:       'Brunswick Family Medical Centre',
  procedureCode:      'MRI-LUMBAR',
  procedureRequested: 'MRI — Lumbar Spine',
  urgencyLevel:       'Urgent',
  diagnosis:          'Right L5/S1 radiculopathy on a background of chronic mechanical low back pain',
  clinicalNotes:      'Patient presents with an 8-week history of low back pain radiating into the right buttock and posterior thigh, worsening over the last fortnight to include calf paraesthesia. Has completed 8 weeks of supervised physiotherapy at Glenroy Sports & Spine with partial improvement only. Neurological examination: SLR positive right at 45°, reduced sensation L4/L5/S1. No red flags identified. MRI requested to characterise suspected lumbar disc pathology.',
  patientId:          'PAT-2026-00847',
}

export default function SubmitPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState(null)
  const [referralFile, setReferralFile] = useState(null)
  const [uploadedDoc, setUploadedDoc] = useState(null)
  const fileRef = useRef()

  const [form, setForm] = useState({ ...DEFAULTS })

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

  async function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setReferralFile(file)
    setUploadedDoc(null)
    setUploading(true)
    setError(null)
    try {
      const doc = await uploadDocument(file)
      setUploadedDoc(doc)
    } catch (err) {
      setError('Failed to upload referral document. Please try again.')
      setReferralFile(null)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const patientId = form.patientId || generateRef()
      const clinicalDocuments = uploadedDoc
        ? [uploadedDoc]
        : [{ documentId: patientId, documentType: 'referral', url: '' }]

      const variables = { ...form, patientId, clinicalDocuments }
      const instance = await startProcess('prior-auth-process', variables)
      setSubmitted({ ref: patientId, instanceKey: instance.processInstanceKey })
      setStep(4)
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setStep(1)
    setForm({ ...DEFAULTS })
    setSubmitted(null)
    setReferralFile(null)
    setUploadedDoc(null)
    if (fileRef.current) fileRef.current.value = ''
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

      {/* Step 1 — Patient */}
      {step === 1 && (
        <div className="pt-card fade-in">
          <div className="pt-card-header">
            <div className="pt-card-icon">👤</div>
            <div><h2>Patient Information</h2><p>Member details and cover type</p></div>
          </div>
          <div className="callout callout-blue">
            <span className="callout-icon">ℹ️</span>
            <span>All fields marked with * are required. Pre-filled with demo data for Telstra Health.</span>
          </div>
          <div className="pt-form-grid">
            <div className="pt-field full">
              <label className="pt-label">Full Name <span className="required">*</span></label>
              <input className="pt-input" placeholder="e.g. Margaret Chen" {...inp('patientName')} />
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
              <input className="pt-input" placeholder="PAT-2026-XXXXX" {...inp('patientId')} />
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

      {/* Step 2 — GP & Procedure */}
      {step === 2 && (
        <div className="pt-card fade-in">
          <div className="pt-card-header">
            <div className="pt-card-icon">🏥</div>
            <div><h2>GP & Procedure Details</h2><p>Referring doctor and requested procedure</p></div>
          </div>
          <div className="pt-form-grid">
            <div className="pt-field">
              <label className="pt-label">GP Full Name <span className="required">*</span></label>
              <input className="pt-input" placeholder="Dr. Anita Patel" {...inp('gpName')} />
            </div>
            <div className="pt-field">
              <label className="pt-label">GP Email <span className="required">*</span></label>
              <input className="pt-input" type="email" {...inp('gpEmail')} />
            </div>
            <div className="pt-field full">
              <label className="pt-label">Practice Name <span className="required">*</span></label>
              <input className="pt-input" placeholder="e.g. Brunswick Family Medical Centre" {...inp('practiceName')} />
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

      {/* Step 3 — Clinical Notes + Upload */}
      {step === 3 && (
        <div className="pt-card fade-in">
          <div className="pt-card-header">
            <div className="pt-card-icon">📋</div>
            <div><h2>Clinical Notes & Referral</h2><p>Supporting clinical information and referral letter</p></div>
          </div>

          {/* Referral Upload */}
          <div className="pt-field" style={{ marginBottom: 24 }}>
            <label className="pt-label">Referral Letter PDF <span className="required">*</span></label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {!referralFile ? (
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  border: '2px dashed var(--pt-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '32px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--pt-bg)',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--th-blue)'; e.currentTarget.style.background = 'var(--th-blue-light)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--pt-border)'; e.currentTarget.style.background = 'var(--pt-bg)' }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--th-blue)', marginBottom: 4 }}>Click to upload referral letter</div>
                <div style={{ fontSize: 12, color: 'var(--pt-muted)' }}>PDF files only · Max 10MB</div>
              </div>
            ) : (
              <div style={{
                border: '1.5px solid var(--pt-border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: uploading ? 'var(--pt-bg)' : uploadedDoc ? '#E6FBF5' : '#FFF0F0',
              }}>
                <span style={{ fontSize: 24 }}>{uploading ? '⏳' : uploadedDoc ? '✅' : '❌'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pt-text)' }}>{referralFile.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--pt-muted)', marginTop: 2 }}>
                    {uploading ? 'Uploading to document store…' : uploadedDoc ? 'Uploaded successfully' : 'Upload failed — try again'}
                  </div>
                </div>
                {!uploading && (
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => { setReferralFile(null); setUploadedDoc(null); fileRef.current.value = '' }}>
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="callout callout-teal">
            <span className="callout-icon">💡</span>
            <span>Include duration of symptoms, conservative treatments tried, neurological findings, and any red flag screening. This helps expedite assessment.</span>
          </div>

          <div className="pt-form-grid cols-1">
            <div className="pt-field">
              <label className="pt-label">Clinical Notes & History <span className="required">*</span></label>
              <textarea className="pt-textarea" rows={6} {...inp('clinicalNotes')} />
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--pt-bg)', borderRadius: 'var(--radius-md)', padding: '16px 20px', margin: '20px 0', border: '1px solid var(--pt-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pt-muted)', marginBottom: 12 }}>Submission Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
              <div><span style={{ color: 'var(--pt-muted)' }}>Patient: </span><strong>{form.patientName}</strong></div>
              <div><span style={{ color: 'var(--pt-muted)' }}>GP: </span><strong>{form.gpName}</strong></div>
              <div><span style={{ color: 'var(--pt-muted)' }}>Procedure: </span><strong>{form.procedureRequested || form.procedureCode}</strong></div>
              <div><span style={{ color: 'var(--pt-muted)' }}>Referral: </span><strong>{uploadedDoc ? '✓ Uploaded' : referralFile ? 'Uploading…' : 'Not attached'}</strong></div>
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
              disabled={!form.clinicalNotes || !uploadedDoc || loading}
              onClick={handleSubmit}>
              {loading ? <><span className="spinner" /> Submitting…</> : '✓ Submit Request'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Success */}
      {step === 4 && submitted && (
        <div className="pt-card fade-in">
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>Request Submitted</h2>
            <p>Your prior authorisation request has been received and is being assessed by our clinical AI system. A confirmation will be sent to <strong>{form.gpEmail}</strong>.</p>
            <div className="ref-pill">REF: {submitted.ref}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={resetForm}>Submit Another</button>
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
