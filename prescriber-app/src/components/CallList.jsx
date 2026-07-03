import { motion } from 'framer-motion'

const fmtNum = (n) => Math.round(n).toLocaleString('en-US')

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show: (i) => ({ opacity: 1, x: 0, transition: { delay: Math.min(i, 20) * 0.025, duration: 0.3 } }),
}

export default function CallList({ doctors, maxPredicted, selectedId, onSelect }) {
  if (doctors.length === 0) {
    return (
      <div className="card call-list">
        <h3 className="card-title">Ranked Call List</h3>
        <p className="call-list-empty">No doctors match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="card call-list">
      <h3 className="card-title">Ranked Call List</h3>
      <div className="call-list-header-row">
        <span className="col-rank">#</span>
        <span className="col-doc">Specialty / State</span>
        <span className="col-patients">Patients</span>
        <span className="col-bar">Actual vs. Predicted</span>
        <span className="col-tier">Tier</span>
        <span className="col-opp">Opportunity</span>
      </div>
      <div className="call-list-body">
        {doctors.map((d, i) => (
          <motion.button
            type="button"
            key={d.id}
            className={`call-row ${selectedId === d.id ? 'call-row-selected' : ''}`}
            custom={i}
            variants={rowVariants}
            initial="hidden"
            animate="show"
            onClick={() => onSelect(d)}
          >
            <span className="col-rank">{i + 1}</span>
            <span className="col-doc">
              <span className="doc-specialty">{d.specialty}</span>
              <span className="doc-state">{d.state}</span>
            </span>
            <span className="col-patients">{d.totalPatients}</span>
            <span className="col-bar">
              <span className="mini-bar-track">
                <span
                  className="mini-bar-predicted"
                  style={{ width: `${(d.predictedClaims / maxPredicted) * 100}%` }}
                />
                <span
                  className="mini-bar-actual"
                  style={{ width: `${(d.actualClaims / maxPredicted) * 100}%` }}
                />
              </span>
            </span>
            <span className="col-tier">
              <span className={`tier-badge tier-${d.tier.toLowerCase()}`}>{d.tier}</span>
            </span>
            <span className="col-opp">{fmtNum(d.opportunity)}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
