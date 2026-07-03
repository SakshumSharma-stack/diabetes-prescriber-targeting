import { useEffect, useState, useMemo } from 'react'
import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet'
import { NAME_TO_ABBR } from '../data/states'

const GEOJSON_URL =
  'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'

const PALE = [232, 240, 251] // #E8F0FB
const TEAL = [14, 143, 143] // #0E8F8F
const NAVY = [10, 30, 63] // #0A1E3F

function lerp(a, b, t) {
  return a + (b - a) * t
}

function colorForValue(t) {
  // 0 -> pale, 0.5 -> teal, 1 -> navy — gives low-opportunity states a soft
  // wash and lets the darkest, highest-opportunity states read as "urgent".
  const [c1, c2] = t < 0.5 ? [PALE, TEAL] : [TEAL, NAVY]
  const localT = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5
  const r = Math.round(lerp(c1[0], c2[0], localT))
  const g = Math.round(lerp(c1[1], c2[1], localT))
  const b = Math.round(lerp(c1[2], c2[2], localT))
  return `rgb(${r}, ${g}, ${b})`
}

const fmtNum = (n) => Math.round(n).toLocaleString('en-US')

export default function UsMap({ opportunityByState, countByState, selectedState, onSelectState }) {
  const [geoData, setGeoData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setGeoData(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const maxOpportunity = useMemo(
    () => Math.max(1, ...Object.values(opportunityByState)),
    [opportunityByState]
  )

  const styleFeature = (feature) => {
    const abbr = NAME_TO_ABBR[feature.properties.name]
    const value = opportunityByState[abbr] || 0
    const isSelected = selectedState === abbr
    return {
      fillColor: colorForValue(value / maxOpportunity),
      fillOpacity: value > 0 ? 0.88 : 0.35,
      color: isSelected ? '#0E8F8F' : '#ffffff',
      weight: isSelected ? 3 : 1,
    }
  }

  const onEachFeature = (feature, layer) => {
    const abbr = NAME_TO_ABBR[feature.properties.name]
    const value = opportunityByState[abbr] || 0
    const count = countByState[abbr] || 0
    layer.bindTooltip(
      `<strong>${feature.properties.name}</strong><br/>${count} doctors targeted<br/>${fmtNum(value)} claims opportunity`,
      { sticky: true, className: 'map-tooltip' }
    )
    layer.on({
      mouseover: (e) => e.target.setStyle({ weight: 3, color: '#1B5FBF' }),
      mouseout: (e) => {
        if (selectedState !== abbr) {
          e.target.setStyle({ weight: 1, color: '#ffffff' })
        }
      },
      click: () => onSelectState(selectedState === abbr ? null : abbr),
    })
  }

  if (error) {
    return <div className="map-fallback">Map data unavailable ({error})</div>
  }

  return (
    <div className="us-map-wrap">
      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        minZoom={3}
        maxZoom={6}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          opacity={0.6}
        />
        {geoData && (
          <GeoJSON
            key={`${selectedState}-${maxOpportunity}`}
            data={geoData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      <div className="map-legend">
        <span>Lower opportunity</span>
        <div className="map-legend-swatch" />
        <span>Higher opportunity</span>
      </div>
    </div>
  )
}
