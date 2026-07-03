import { motion } from 'framer-motion'
import CountUp from './CountUp'

const fmtNum = (n) => Math.round(n).toLocaleString('en-US')
const fmtPct = (n) => `${n.toFixed(1)}%`

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

export default function KpiStrip({ doctorsTargeted, opportunityCaptured, pctOfAvailable, avgPersuadability }) {
  const kpis = [
    {
      label: 'Doctors Targeted',
      value: doctorsTargeted,
      render: (v) => <CountUp value={v} />,
    },
    {
      label: 'Opportunity Captured',
      value: opportunityCaptured,
      unit: 'claims',
      render: (v) => <CountUp value={v} format={fmtNum} />,
    },
    {
      label: '% of Available Opportunity',
      value: pctOfAvailable,
      render: (v) => <CountUp value={v} format={fmtPct} />,
    },
    {
      label: 'Avg. Persuadability',
      value: avgPersuadability * 100,
      render: (v) => <CountUp value={v} format={(n) => `${n.toFixed(0)}%`} />,
    },
  ]

  return (
    <div className="kpi-strip">
      {kpis.map((k, i) => (
        <motion.div
          className="kpi-card"
          key={k.label}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="show"
        >
          <div className="kpi-value">
            {k.render(k.value)}
            {k.unit && <span className="kpi-unit"> {k.unit}</span>}
          </div>
          <div className="kpi-label">{k.label}</div>
        </motion.div>
      ))}
    </div>
  )
}
