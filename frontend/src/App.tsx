import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Database,
  Flame,
  Gauge,
  Info,
  Layers3,
  ShieldAlert,
  Thermometer,
  Wind,
} from 'lucide-react'
import TelemetryChart from './components/TelemetryChart'
import { experiments, findCandidateDeviations, getSeries, type CsvRow } from './data/telemetry'

function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function formatCadence(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return 'Not resolved'
  if (seconds < 0.1) return `${Math.round(seconds * 1000)} ms`
  if (seconds < 10) return `${formatNumber(seconds, 2)} s`
  return `${formatNumber(seconds, 0)} s`
}

function App() {
  const [experimentId, setExperimentId] = useState<'saffire' | 'flex'>('saffire')
  const experiment = experiments.find((item) => item.id === experimentId) ?? experiments[0]
  const [streamId, setStreamId] = useState(experiment.streams[0].id)
  const stream = experiment.streams.find((item) => item.id === streamId) ?? experiment.streams[0]
  const [signalColumn, setSignalColumn] = useState(stream.defaultSignal)
  const signal = stream.signals.find((item) => item.column === signalColumn) ?? stream.signals[0]
  const [rows, setRows] = useState<CsvRow[]>([])
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true
    setRows([])
    setLoadStatus('loading')
    stream.loadRows().then((loadedRows) => {
      if (!active) return
      setRows(loadedRows)
      setLoadStatus('ready')
    }).catch(() => {
      if (!active) return
      setLoadStatus('error')
    })
    return () => { active = false }
  }, [stream.loadRows])

  const points = useMemo(() => getSeries(stream, rows, signal.column), [stream, rows, signal.column])
  const deviations = useMemo(() => findCandidateDeviations(points), [points])
  const largestDeviations = useMemo(
    () => [...deviations].sort((a, b) => Math.abs(b.robustScore) - Math.abs(a.robustScore)).slice(0, 3),
    [deviations],
  )
  const cadence = stream.quality.time_summary?.median_interval_s
  const skippedRows = stream.quality.dropped_rows_with_missing_or_invalid_time
    ?? stream.quality.rows_dropped_for_missing_or_invalid_timestamp_or_time
    ?? 0
  const missingSignalCount = stream.quality.missing_values_by_column?.[signal.column] ?? 0
  const minimum = points.length ? Math.min(...points.map((point) => point.y)) : null
  const maximum = points.length ? Math.max(...points.map((point) => point.y)) : null

  function chooseExperiment(id: 'saffire' | 'flex') {
    const next = experiments.find((item) => item.id === id) ?? experiments[0]
    setExperimentId(id)
    setStreamId(next.streams[0].id)
    setSignalColumn(next.streams[0].defaultSignal)
  }

  function chooseStream(id: string) {
    const next = experiment.streams.find((item) => item.id === id)
    if (!next) return
    setStreamId(next.id)
    setSignalColumn(next.defaultSignal)
  }

  return (
    <div className={`app-shell ${experiment.accent}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="FlameScope dashboard home">
          <span className="brand-symbol"><Flame size={18} strokeWidth={2.3} /></span>
          <span className="brand-wordmark">FLAMESCOPE</span>
          <span className="brand-divider" />
          <span className="brand-caption">COMBUSTION RESEARCH</span>
        </a>
        <nav className="top-nav" aria-label="Dashboard sections">
          <a className="active" href="#telemetry">Telemetry</a>
          <a href="#indicators">Indicators</a>
          <a href="#method">Method</a>
        </nav>
        <div className="header-actions">
          <span className="research-badge"><span className="status-light" /> RESEARCH MODE</span>
          <a className="icon-link" href={experiment.href} target="_blank" rel="noreferrer" aria-label={`Open NASA PSI record ${experiment.record}`} title="Open NASA PSI record">
            <ArrowUpRight size={17} />
          </a>
        </div>
      </header>

      <main id="top" className="content">
        <section className="page-heading">
          <div>
            <div className="breadcrumb"><span>NASA SPACE APPS</span><i>/</i><span>FLAME IN FREEFALL</span><i>/</i><span>TELEMETRY LAB</span></div>
            <h1>Combustion <em>telemetry</em></h1>
            <p className="page-intro">Explore fire-sensitive measurements with the experiment conditions, time basis, and source record in view.</p>
          </div>
          <div className="model-status">
            <div className="status-icon"><ShieldAlert size={19} /></div>
            <div><span>MODEL STATUS</span><strong>Exploratory signal screen</strong><small>No validated operational alarm</small></div>
          </div>
        </section>

        <section className="experiment-bar" aria-label="Choose NASA investigation">
          <div className="experiment-tabs" role="tablist" aria-label="Investigation">
            {experiments.map((item) => (
              <button
                className={`experiment-tab ${experiment.id === item.id ? 'selected' : ''}`}
                key={item.id}
                onClick={() => chooseExperiment(item.id)}
                role="tab"
                aria-selected={experiment.id === item.id}
              >
                <span className="tab-code">{item.record}</span>
                <span className="tab-title">{item.name}</span>
                <span className="tab-subtitle">{item.id === 'saffire' ? 'Solid-fabric fire' : 'Droplet combustion'}</span>
              </button>
            ))}
          </div>
          <div className="track-note"><Layers3 size={15} /><span>Independent evidence tracks</span></div>
        </section>

        <section className="study-strip" aria-label={`${experiment.name} study information`}>
          <div className="study-identity">
            <div className="study-monogram"><Flame size={18} /></div>
            <div><span>{experiment.record} · VERSION {experiment.recordVersion}</span><strong>{experiment.fullName}</strong></div>
          </div>
          <p>{experiment.focus}</p>
          <a href={experiment.href} target="_blank" rel="noreferrer">NASA PSI record <ArrowUpRight size={14} /></a>
        </section>

        <section className="process-rail" aria-label="Telemetry processing path">
          <div className="process-heading"><span className="section-kicker">DATA PATH</span><strong>From PSI record to signal review</strong></div>
          <div className="process-steps">
            {[
              { number: '01', title: 'Source', detail: `${experiment.record} · v${experiment.recordVersion}` },
              { number: '02', title: 'Curate', detail: 'Preserve source rows, units & time' },
              { number: '03', title: 'Quality', detail: 'Audit timestamps & missing values' },
              { number: '04', title: 'Screen', detail: 'Rolling median/MAD · exploratory' },
            ].map((step) => (
              <div className="process-step" key={step.number}>
                <span className="process-number">{step.number}</span>
                <div><strong>{step.title}</strong><small>{step.detail}</small></div>
              </div>
            ))}
          </div>
        </section>

        <section className="metric-grid" aria-label="Selected stream summary">
          <Metric icon={<Activity size={17} />} label="VALID SAMPLES" value={stream.quality.cleaned_row_count.toLocaleString()} detail={`${points.length.toLocaleString()} numeric in selected channel`} />
          <Metric icon={<Gauge size={17} />} label="MEDIAN CADENCE" value={formatCadence(cadence)} detail="From source timestamps" />
          <Metric icon={<AlertTriangle size={17} />} label="CANDIDATE DEVIATIONS" value={deviations.length.toString()} detail="Rolling baseline · robust MAD" accent={deviations.length > 0 ? 'warning' : undefined} />
          <Metric icon={<Database size={17} />} label="SOURCE QUALITY" value={skippedRows === 0 ? 'Traceable' : `${skippedRows.toLocaleString()} removed`} detail={skippedRows > 0 ? 'Missing / invalid timestamps' : missingSignalCount ? `${missingSignalCount} blank values in this channel` : 'Source rows retained'} />
        </section>

        <section className="dashboard-grid" id="telemetry">
          <article className="panel chart-panel">
            <div className="panel-heading chart-heading">
              <div>
                <div className="section-kicker"><span className="kicker-dot" /> TIME SERIES / SOURCE-LINKED</div>
                <h2>Signal timeline</h2>
                <p>{stream.description} <span className="dot-separator">·</span> {stream.quality.cleaned_row_count.toLocaleString()} source-timestamped rows</p>
              </div>
              <div className="chart-actions">
                <a className="quiet-link" href={experiment.href} target="_blank" rel="noreferrer">View source <ArrowUpRight size={13} /></a>
              </div>
            </div>

            <div className="control-row">
              <label className="select-field">
                <span>STREAM</span>
                <span className="select-wrap"><select value={stream.id} onChange={(event) => chooseStream(event.target.value)} aria-label="Select telemetry stream">
                  {experiment.streams.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select><ChevronDown size={15} /></span>
              </label>
              <label className="select-field signal-select">
                <span>MEASUREMENT</span>
                <span className="select-wrap"><select value={signal.column} onChange={(event) => setSignalColumn(event.target.value)} aria-label="Select measurement channel">
                  {stream.signals.map((item) => <option key={item.column} value={item.column}>{item.label}</option>)}
                </select><ChevronDown size={15} /></span>
              </label>
              <span className="chart-unit">{signal.unit}</span>
            </div>

            <div className="chart-summary-row">
              <div><span>OBSERVED RANGE</span><strong>{minimum == null || maximum == null ? '—' : `${formatNumber(minimum, 3)} — ${formatNumber(maximum, 3)}`}</strong></div>
              <div><span>TIME BASIS</span><strong>{stream.timeColumn}</strong></div>
              <div><span>RECORD</span><strong>{experiment.record} · v{experiment.recordVersion}</strong></div>
            </div>

            {loadStatus === 'loading' ? <div className="chart-empty">Loading source-linked measurements…</div> : null}
            {loadStatus === 'error' ? <div className="chart-empty chart-error">This stream could not be loaded. Reload the dashboard to retry.</div> : null}
            {loadStatus === 'ready' ? <TelemetryChart points={points} deviations={deviations} signal={signal} timeUnit={stream.timeUnit.split(' ')[0]} accent={experiment.accent} /> : null}
            <div className="chart-footnote"><Info size={14} /><span>Peaks are preserved. A statistical deviation can be a physical transient, an instrument response, or a data issue.</span></div>
          </article>

          <aside className="side-stack">
            <article className="panel indicator-panel" id="indicators">
              <div className="panel-heading compact-heading">
                <div><div className="section-kicker">SIGNAL REVIEW</div><h2>Potential departures</h2></div>
                <span className={`count-pill ${deviations.length ? 'has-count' : ''}`}>{deviations.length.toString().padStart(2, '0')}</span>
              </div>
                <p className="indicator-method">Previous 15 valid samples · threshold |robust z-score| ≥ 3.5. Flat windows with MAD = 0 are not scored.</p>
              {largestDeviations.length ? (
                <div className="departure-list">
                  {largestDeviations.map((item, index) => (
                    <div className="departure-row" key={`${item.sourceRow}-${item.x}`}>
                      <span className="departure-rank">0{index + 1}</span>
                      <div className="departure-copy"><strong>{formatNumber(item.y, 4)} <small>{signal.unit}</small></strong><span>t = {formatNumber(item.x, 3)} s · source row {item.sourceRow}</span></div>
                      <span className="robust-score">Z {item.robustScore > 0 ? '+' : ''}{item.robustScore.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-departures"><span className="quiet-check">✓</span><div><strong>No candidate departures crossed the screen.</strong><p>This is not evidence that conditions are safe; it only describes this selected signal and run.</p></div></div>
              )}
              <div className="screen-disclaimer"><ShieldAlert size={15} /><span>Exploratory screen only. No trained classifier or validated alarm is active.</span></div>
            </article>

            <article className="panel quality-panel">
              <div className="panel-heading compact-heading">
                <div><div className="section-kicker">DATA INTEGRITY</div><h2>Quality notes</h2></div>
                <span className="quality-mark"><Database size={15} /></span>
              </div>
              <div className="quality-stat"><strong>{stream.quality.cleaned_row_count.toLocaleString()}</strong><span>rows with usable source time</span></div>
              {skippedRows > 0 && <p className="quality-warning"><AlertTriangle size={14} /> {skippedRows.toLocaleString()} workbook rows were excluded for missing or invalid timestamps.</p>}
              {(stream.quality.error_cells_blank_in_curated_file ?? 0) > 0 && <p className="quality-warning"><AlertTriangle size={14} /> {stream.quality.error_cells_blank_in_curated_file} Excel error cells were blanked and logged.</p>}
              {missingSignalCount > 0 && <p className="quality-warning"><AlertTriangle size={14} /> {missingSignalCount} samples are blank for this measurement.</p>}
              {!skippedRows && !missingSignalCount && (stream.quality.error_cells_blank_in_curated_file ?? 0) === 0 && <p className="quality-clear">All selected-channel samples retain source-row provenance.</p>}
              <div className="quality-note"><Info size={14} /><span>{experiment.note}</span></div>
            </article>
          </aside>
        </section>

        <section className="context-grid">
          <article className="panel context-panel">
            <div className="context-title"><div className="context-icon"><Thermometer size={17} /></div><div><div className="section-kicker">EXPERIMENT CONTEXT</div><h2>Conditions travel with the data.</h2></div></div>
            <div className="condition-list">
              {experiment.conditions.map((condition) => (
                <div className="condition-row" key={condition.label}><span>{condition.label}</span><strong>{condition.value}</strong></div>
              ))}
            </div>
            {experiment.outcome && <div className="reported-outcome"><span className="outcome-label">SOURCE-REPORTED END STATE</span><strong>{experiment.outcome}</strong><small>Test sheet · FLEX-007 / {experiment.name === 'FLEX' ? '20CAL13' : ''}</small></div>}
          </article>

          <article className="panel coverage-panel">
            <div className="section-kicker">SAFETY-SIGNAL COVERAGE</div>
            <h2>{experiment.id === 'saffire' ? 'Multiple instruments. Separate clocks.' : 'Three views of one droplet run.'}</h2>
            <p>{experiment.id === 'saffire'
              ? 'Explore detector voltage, temperature, pressure, airflow, and radiometer channels in their source streams. Cross-sensor timing has not been reconciled.'
              : 'Compare droplet diameter and flame geometry by selecting a stream above. Camera clocks and coverage windows remain distinct.'}</p>
            <div className="coverage-tags">
              {(experiment.id === 'saffire'
                ? [{ icon: <Activity size={14} />, label: 'Smoke response' }, { icon: <Thermometer size={14} />, label: 'Temperature' }, { icon: <Wind size={14} />, label: 'Flow & pressure' }]
                : [{ icon: <Flame size={14} />, label: 'Flame diameter' }, { icon: <Gauge size={14} />, label: 'Droplet size' }, { icon: <Layers3 size={14} />, label: 'Camera streams' }]
              ).map((item) => <span key={item.label}>{item.icon}{item.label}</span>)}
            </div>
          </article>
        </section>

        <section className="method-banner" id="method">
          <div className="method-icon"><Info size={17} /></div>
          <div><span className="section-kicker">HOW TO READ THIS VIEW</span><p>Signals stay in source units and order. Candidate departures use a rolling median/MAD screen; flat windows with MAD = 0 are not scored. This view does not infer a fire event, issue a safety verdict, or combine incompatible investigations.</p></div>
          <a href="https://psi.nasa.gov/physci/repo" target="_blank" rel="noreferrer">NASA PSI <ArrowUpRight size={14} /></a>
        </section>
      </main>

      <footer className="app-footer"><span><Flame size={14} /> FLAMESCOPE <i>·</i> NASA SPACE APPS 2026</span><span>RESEARCH PROTOTYPE · NOT A CERTIFIED SAFETY SYSTEM</span></footer>
    </div>
  )
}

type MetricProps = { icon: ReactNode; label: string; value: string; detail: string; accent?: 'warning' }

function Metric({ icon, label, value, detail, accent }: MetricProps) {
  return (
    <article className={`metric-card ${accent === 'warning' ? 'metric-warning' : ''}`}>
      <div className="metric-icon">{icon}</div>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </article>
  )
}

export default App
