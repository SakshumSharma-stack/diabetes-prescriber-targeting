const TIERS = ['Priority', 'High', 'Medium', 'Low']

export default function ControlsPanel({
  capacity,
  onCapacityChange,
  maxCapacity,
  filters,
  onFilterChange,
  specialtyOptions,
  stateOptions,
  matchingCount,
}) {
  return (
    <div className="card controls-panel">
      <h3 className="card-title">Doctors You Can Visit</h3>
      <p className="controls-sub">
        Set your rep capacity for this cycle — the call list ranks by target score and
        shows your top {capacity}.
      </p>

      <div className="capacity-slider-block">
        <div className="capacity-slider-value">{capacity}</div>
        <input
          type="range"
          min={5}
          max={maxCapacity}
          step={5}
          value={capacity}
          onChange={(e) => onCapacityChange(Number(e.target.value))}
          className="capacity-slider"
        />
        <div className="capacity-slider-labels">
          <span>5</span>
          <span>{maxCapacity}</span>
        </div>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-specialty">Specialty</label>
        <select
          id="filter-specialty"
          value={filters.specialty}
          onChange={(e) => onFilterChange('specialty', e.target.value)}
        >
          <option value="">All specialties</option>
          {specialtyOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-state">State</label>
        <select
          id="filter-state"
          value={filters.state}
          onChange={(e) => onFilterChange('state', e.target.value)}
        >
          <option value="">All states</option>
          {stateOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-tier">Tier</label>
        <select
          id="filter-tier"
          value={filters.tier}
          onChange={(e) => onFilterChange('tier', e.target.value)}
        >
          <option value="">All tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {(filters.specialty || filters.state || filters.tier) && (
        <button
          type="button"
          className="btn-clear-filters"
          onClick={() => onFilterChange('clear')}
        >
          Clear filters
        </button>
      )}

      <div className="controls-footnote">{matchingCount} doctors match current filters</div>
    </div>
  )
}
