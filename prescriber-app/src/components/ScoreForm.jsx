import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CountUp from './CountUp'

const API_BASE = 'http://localhost:8000'

const fmtNum = (n) => Math.round(n).toLocaleString('en-US')

const NUMERIC_FIELDS = [
  { key: 'total_patients', label: 'Total Patients' },
  { key: 'avg_patient_age', label: 'Avg. Patient Age' },
  { key: 'avg_patient_risk', label: 'Avg. Patient Risk' },
  { key: 'total_claims_all_drugs', label: 'Total Claims (All Drugs)' },
  { key: 'actual_claims', label: 'Actual Claims' },
]

export default function ScoreForm() {
  const [categories, setCategories] = useState(null)
  const [categoriesError, setCategoriesError] = useState(null)
  const [form, setForm] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setCategories(data)
        const defaults = data.numeric_defaults || {}
        const totalPatients = defaults.total_patients ?? 300
        setForm({
          specialty: data.categories.specialty.includes('Endocrinology')
            ? 'Endocrinology'
            : data.categories.specialty[0] || '',
          state: data.categories.state.includes('CA') ? 'CA' : data.categories.state[0] || '',
          rural_urban: data.categories.rural_urban[0] || '',
          total_patients: totalPatients,
          avg_patient_age: Number((defaults.avg_patient_age ?? 70).toFixed(1)),
          avg_patient_risk: Number((defaults.avg_patient_risk ?? 1.2).toFixed(2)),
          total_claims_all_drugs: defaults.total_claims_all_drugs ?? 3000,
          actual_claims: Math.round(totalPatients * 0.6),
        })
      })
      .catch((err) => setCategoriesError(err.message))
  }, [])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    setResult(null)
    try {
      const payload = {
        specialty: form.specialty,
        state: form.state,
        rural_urban: form.rural_urban,
        total_patients: Number(form.total_patients),
        avg_patient_age: Number(form.avg_patient_age),
        avg_patient_risk: Number(form.avg_patient_risk),
        total_claims_all_drugs: Number(form.total_claims_all_drugs),
        actual_claims: Number(form.actual_claims),
      }
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card score-form-card">
      <h3 className="card-title">Score a New Doctor</h3>
      <p className="controls-sub">
        Run a single prescriber through the live model at {API_BASE} to see predicted claims,
        opportunity, and tier before it lands in your call list.
      </p>

      {categoriesError && (
        <div className="form-error">
          Could not reach the API at {API_BASE} ({categoriesError}). Is the backend running?
        </div>
      )}

      {!categories && !categoriesError && <div className="form-loading">Loading categories&hellip;</div>}

      {form && (
        <form onSubmit={handleSubmit} className="score-form">
          <div className="score-form-grid">
            <div className="filter-group">
              <label htmlFor="score-specialty">Specialty</label>
              <select
                id="score-specialty"
                value={form.specialty}
                onChange={(e) => handleChange('specialty', e.target.value)}
              >
                {categories.categories.specialty.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="score-state">State</label>
              <select
                id="score-state"
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
              >
                {categories.categories.state.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="filter-group filter-group-wide">
              <label htmlFor="score-rural">Rural / Urban Classification</label>
              <select
                id="score-rural"
                value={form.rural_urban}
                onChange={(e) => handleChange('rural_urban', e.target.value)}
              >
                {categories.categories.rural_urban.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {NUMERIC_FIELDS.map(({ key, label }) => (
              <div className="filter-group" key={key}>
                <label htmlFor={`score-${key}`}>{label}</label>
                <input
                  id={`score-${key}`}
                  type="number"
                  step="any"
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Scoring…' : 'Score Doctor'}
          </button>

          {submitError && <div className="form-error">Prediction failed: {submitError}</div>}
        </form>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            className="score-result-card"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
          >
            <div className={`tier-badge tier-${result.tier.toLowerCase()}`}>{result.tier} Tier</div>
            <div className="score-result-grid">
              <div className="score-result-stat">
                <span className="detail-stat-label">Predicted Claims</span>
                <span className="detail-stat-value"><CountUp value={result.predicted_claims} /></span>
              </div>
              <div className="score-result-stat">
                <span className="detail-stat-label">Opportunity</span>
                <span className="detail-stat-value"><CountUp value={result.opportunity} format={fmtNum} /></span>
              </div>
              <div className="score-result-stat">
                <span className="detail-stat-label">Persuadability</span>
                <span className="detail-stat-value">
                  <CountUp value={result.persuadability * 100} format={(n) => `${n.toFixed(0)}%`} />
                </span>
              </div>
              <div className="score-result-stat">
                <span className="detail-stat-label">Target Score</span>
                <span className="detail-stat-value"><CountUp value={result.target_score} /></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
