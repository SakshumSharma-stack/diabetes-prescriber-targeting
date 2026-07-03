import { AnimatePresence, motion } from 'framer-motion'
import { RECOMMENDATION_COPY } from '../data/sampleData'

const fmtNum = (n) => Math.round(n).toLocaleString('en-US')

export default function DetailPanel({ doctor, onClose }) {
  return (
    <AnimatePresence>
      {doctor && (
        <>
          <motion.div
            className="detail-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="detail-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <button type="button" className="detail-close" onClick={onClose} aria-label="Close">
              &times;
            </button>

            <div className={`tier-badge tier-${doctor.tier.toLowerCase()} detail-tier`}>
              {doctor.tier} Tier
            </div>
            <h2 className="detail-specialty">{doctor.specialty}</h2>
            <p className="detail-meta">
              {doctor.state} &middot; NPI {doctor.npi}
            </p>

            <div className="detail-bar-block">
              <div className="detail-bar-row">
                <span className="detail-bar-label">Actual claims</span>
                <div className="detail-bar-track">
                  <div
                    className="detail-bar-fill detail-bar-actual"
                    style={{ width: `${(doctor.actualClaims / doctor.predictedClaims) * 100}%` }}
                  />
                </div>
                <span className="detail-bar-num">{Math.round(doctor.actualClaims)}</span>
              </div>
              <div className="detail-bar-row">
                <span className="detail-bar-label">Predicted claims</span>
                <div className="detail-bar-track">
                  <div className="detail-bar-fill detail-bar-predicted" style={{ width: '100%' }} />
                </div>
                <span className="detail-bar-num">{Math.round(doctor.predictedClaims)}</span>
              </div>
            </div>

            <div className="detail-stats-grid">
              <div className="detail-stat">
                <span className="detail-stat-label">Total Patients</span>
                <span className="detail-stat-value">{doctor.totalPatients}</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-label">Avg. Patient Risk</span>
                <span className="detail-stat-value">{doctor.avgPatientRisk.toFixed(2)}</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-label">Predicted Claims</span>
                <span className="detail-stat-value">{Math.round(doctor.predictedClaims).toLocaleString()}</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-label">Opportunity</span>
                <span className="detail-stat-value">{fmtNum(doctor.opportunity)}</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-label">Persuadability</span>
                <span className="detail-stat-value">{(doctor.persuadability * 100).toFixed(0)}%</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-label">Target Score</span>
                <span className="detail-stat-value">{Math.round(doctor.targetScore).toLocaleString()}</span>
              </div>
            </div>

            <div className="detail-recommendation">
              <h4>Recommendation</h4>
              <p>{RECOMMENDATION_COPY[doctor.tier](doctor)}</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
