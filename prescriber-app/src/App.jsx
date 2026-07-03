import { useEffect, useMemo, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { STATE_ABBRS } from './data/states'
import KpiStrip from './components/KpiStrip'
import UsMap from './components/UsMap'
import ControlsPanel from './components/ControlsPanel'
import CallList from './components/CallList'
import DetailPanel from './components/DetailPanel'
import ScoreForm from './components/ScoreForm'

const DEFAULT_FILTERS = { specialty: '', state: '', tier: '' }

function normalizeDoctor(r) {
  return {
    id: r.npi,
    npi: r.npi,
    specialty: r.specialty,
    state: r.state,
    totalPatients: r.total_patients,
    avgPatientRisk: r.avg_patient_risk,
    actualClaims: r.actual_claims,
    predictedClaims: r.predicted_claims,
    opportunity: r.opportunity,
    persuadability: r.persuadability,
    targetScore: r.target_score,
    tier: r.tier,
  }
}

function App() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [capacity, setCapacity] = useState(50)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  useEffect(() => {
    fetch('/prescribers.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setDoctors(data.map(normalizeDoctor).sort((a, b) => b.targetScore - a.targetScore))
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const specialtyOptions = useMemo(
    () => [...new Set(doctors.map((d) => d.specialty))].sort(),
    [doctors]
  )
  const maxPredicted = useMemo(
    () => (doctors.length ? Math.max(...doctors.map((d) => d.predictedClaims)) : 1),
    [doctors]
  )

  const handleFilterChange = (key, value) => {
    if (key === 'clear') {
      setFilters(DEFAULT_FILTERS)
      return
    }
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // Doctors matching specialty/tier only — used to drive the map, so choosing
  // a specialty reshapes the choropleth even before a state is picked.
  const mapScopedDoctors = useMemo(
    () =>
      doctors.filter(
        (d) =>
          (!filters.specialty || d.specialty === filters.specialty) &&
          (!filters.tier || d.tier === filters.tier)
      ),
    [doctors, filters.specialty, filters.tier]
  )

  const { opportunityByState, countByState } = useMemo(() => {
    const opp = {}
    const count = {}
    for (const abbr of STATE_ABBRS) {
      opp[abbr] = 0
      count[abbr] = 0
    }
    for (const d of mapScopedDoctors) {
      opp[d.state] = (opp[d.state] || 0) + d.opportunity
      count[d.state] = (count[d.state] || 0) + 1
    }
    return { opportunityByState: opp, countByState: count }
  }, [mapScopedDoctors])

  const filteredDoctors = useMemo(
    () => mapScopedDoctors.filter((d) => !filters.state || d.state === filters.state),
    [mapScopedDoctors, filters.state]
  )

  const topDoctors = useMemo(
    () => filteredDoctors.slice(0, capacity),
    [filteredDoctors, capacity]
  )

  const kpis = useMemo(() => {
    const totalAvailableOpportunity = filteredDoctors.reduce((sum, d) => sum + d.opportunity, 0)
    const opportunityCaptured = topDoctors.reduce((sum, d) => sum + d.opportunity, 0)
    const avgPersuadability = topDoctors.length
      ? topDoctors.reduce((sum, d) => sum + d.persuadability, 0) / topDoctors.length
      : 0
    return {
      doctorsTargeted: topDoctors.length,
      opportunityCaptured,
      pctOfAvailable: totalAvailableOpportunity > 0
        ? (opportunityCaptured / totalAvailableOpportunity) * 100
        : 0,
      avgPersuadability,
    }
  }, [filteredDoctors, topDoctors])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <span className="app-header-badge">Diabetes Portfolio</span>
          <h1>Prescriber Targeting Console</h1>
        </div>
        <p className="app-header-sub">
          Model-scored prescriber opportunity, ranked and ready for your next call cycle.
        </p>
      </header>

      {loading && (
        <div className="card loading-state">Loading prescriber data&hellip;</div>
      )}

      {!loading && loadError && (
        <div className="card loading-state form-error">
          Could not load /prescribers.json ({loadError}).
        </div>
      )}

      {!loading && !loadError && (
        <>
          <KpiStrip {...kpis} />

          <section className="card map-hero">
            <div className="map-hero-heading">
              <h3 className="card-title">Opportunity by State</h3>
              <p className="controls-sub">
                Click a state to filter the call list below. Shading reflects total addressable
                opportunity for the current specialty/tier filters.
              </p>
            </div>
            <UsMap
              opportunityByState={opportunityByState}
              countByState={countByState}
              selectedState={filters.state}
              onSelectState={(abbr) => handleFilterChange('state', abbr || '')}
            />
          </section>

          <div className="main-grid">
            <ControlsPanel
              capacity={capacity}
              onCapacityChange={setCapacity}
              maxCapacity={200}
              filters={filters}
              onFilterChange={handleFilterChange}
              specialtyOptions={specialtyOptions}
              stateOptions={STATE_ABBRS}
              matchingCount={filteredDoctors.length}
            />
            <CallList
              doctors={topDoctors}
              maxPredicted={maxPredicted}
              selectedId={selectedDoctor?.id}
              onSelect={setSelectedDoctor}
            />
          </div>
        </>
      )}

      <ScoreForm />

      <footer className="app-footer">
        Opportunity figures represent the gap between model-predicted and actual claims and are
        assumed to be fully addressable. Actual conversion will vary with rep capacity, formulary
        access, and patient mix — use these scores to prioritize, not guarantee, outcomes.
      </footer>

      <DetailPanel doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
    </div>
  )
}

export default App
