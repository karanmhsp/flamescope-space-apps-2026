import type { Deviation, Sample, SignalOption } from '../data/telemetry'

type Props = {
  points: Sample[]
  deviations: Deviation[]
  signal: SignalOption
  timeUnit: string
  accent: 'coral' | 'teal'
}

const width = 920
const height = 330
const margin = { top: 18, right: 22, bottom: 48, left: 70 }
const plotWidth = width - margin.left - margin.right
const plotHeight = height - margin.top - margin.bottom

function tick(value: number): string {
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (Math.abs(value) >= 100) return value.toFixed(0)
  if (Math.abs(value) >= 10) return value.toFixed(1)
  if (Math.abs(value) >= 1) return value.toFixed(2)
  if (Math.abs(value) >= 0.1) return value.toFixed(3)
  return value.toFixed(4)
}

export default function TelemetryChart({ points, deviations, signal, timeUnit, accent }: Props) {
  if (points.length === 0) {
    return <div className="chart-empty">No numeric samples are available for this channel.</div>
  }

  const values = points.map((point) => point.y)
  const xValues = points.map((point) => point.x)
  const rawMinY = Math.min(...values)
  const rawMaxY = Math.max(...values)
  const yPadding = rawMaxY === rawMinY ? Math.max(Math.abs(rawMaxY) * 0.08, 1) : (rawMaxY - rawMinY) * 0.1
  const minY = rawMinY - yPadding
  const maxY = rawMaxY + yPadding
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const xPadding = minX === maxX ? 1 : (maxX - minX) * 0.015
  const chartMinX = minX - xPadding
  const chartMaxX = maxX + xPadding
  const x = (value: number) => margin.left + ((value - chartMinX) / (chartMaxX - chartMinX)) * plotWidth
  const y = (value: number) => margin.top + ((maxY - value) / (maxY - minY)) * plotHeight
  const color = accent === 'coral' ? '#ff865d' : '#55d7c0'
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.x).toFixed(2)},${y(point.y).toFixed(2)}`).join(' ')
  const denseSignal = points.length / plotWidth > 1.5
  const yTicks = Array.from({ length: 5 }, (_, index) => minY + ((maxY - minY) * index) / 4).reverse()
  const xTicks = Array.from({ length: 5 }, (_, index) => chartMinX + ((chartMaxX - chartMinX) * index) / 4)

  return (
    <div className="chart-frame">
      <div className="chart-axis-title">{signal.label} <span>({signal.unit})</span></div>
      <svg className="telemetry-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${signal.label} over time, ${points.length} valid samples`}>
        <defs>
          <linearGradient id="signal-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {yTicks.map((value) => (
          <g key={`y-${value}`}>
            <line className="chart-grid" x1={margin.left} x2={width - margin.right} y1={y(value)} y2={y(value)} />
            <text className="chart-tick" x={margin.left - 12} y={y(value) + 4} textAnchor="end">{tick(value)}</text>
          </g>
        ))}
        {xTicks.map((value) => (
          <g key={`x-${value}`}>
            <line className="chart-grid chart-grid-vertical" x1={x(value)} x2={x(value)} y1={margin.top} y2={margin.top + plotHeight} />
            <text className="chart-tick" x={x(value)} y={height - 23} textAnchor="middle">{tick(value)}</text>
          </g>
        ))}
        {denseSignal ? (
          <g aria-hidden="true">
            {points.map((point) => <circle key={`sample-${point.sourceRow}`} cx={x(point.x)} cy={y(point.y)} r="1" fill={color} fillOpacity=".78" />)}
          </g>
        ) : (
          <path d={line} fill="none" stroke="url(#signal-line)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {deviations.map((point) => (
          <circle key={`${point.sourceRow}-${point.x}`} cx={x(point.x)} cy={y(point.y)} r="4.3" className="deviation-dot" stroke={color}>
            <title>{`Candidate deviation · t ${tick(point.x)} ${timeUnit} · ${tick(point.y)} ${signal.unit} · source row ${point.sourceRow} · robust z-score ${point.robustScore.toFixed(1)}`}</title>
          </circle>
        ))}
        <text className="chart-x-title" x={margin.left + plotWidth / 2} y={height - 4} textAnchor="middle">Source time ({timeUnit})</text>
      </svg>
      <div className="chart-legend">
        <span><i className={`legend-line ${accent}`} /> Measured signal</span>
        <span><i className="legend-dot" /> Candidate deviation · rolling MAD screen</span>
      </div>
    </div>
  )
}
