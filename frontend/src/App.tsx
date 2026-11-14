import { ArrowUpRight, Database, Flame, Search, ShieldAlert } from 'lucide-react'

const sources = [
  {
    code: 'PSI-98',
    name: 'SAFFIRE-I',
    fullName: 'Spacecraft Fire Safety Experiment-I',
    focus: 'Large-scale solid-fabric fire behavior',
    context: 'Duct airflow · video · temperature · gas · pressure',
    doi: '10.60555/0t15-1z43',
    href: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',
  },
  {
    code: 'PSI-69',
    name: 'FLEX',
    fullName: 'Flame Extinguishment Experiment',
    focus: 'Liquid-fuel droplet combustion and extinction',
    context: 'Oxygen · pressure · suppressant · burning rate',
    doi: '10.60555/mbq8-0451',
    href: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69',
  },
]

export default function App() {
  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="FlameScope home">
          <span className="brand-mark"><Flame size={19} strokeWidth={2.2} /></span>
          <span>FLAMESCOPE</span>
        </a>
        <div className="topbar-right">
          <span className="live-dot" /> NASA PSI SOURCE CATALOG
          <a className="source-link" href="https://psi.nasa.gov/physci/repo" target="_blank" rel="noreferrer">
            Open PSI <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>FIRE SAFETY · HUMAN EXPLORATION</span><span className="eyebrow-line" /></div>
          <h1>Fire behaves<br /><em>differently</em> in orbit.</h1>
          <p className="hero-intro">Explore the NASA combustion studies behind safer spacecraft decisions. Every source stays visible. Every comparison starts with the experiment conditions.</p>
          <a className="primary-link" href="#investigations"><Search size={16} /> Explore investigations <span>↓</span></a>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="core-glow" /><div className="flame-shape"><Flame size={104} strokeWidth={1.1} /></div>
          <div className="visual-tag tag-top">MICROGRAVITY <span>·</span> COMBUSTION</div>
          <div className="visual-tag tag-bottom">EVIDENCE FIRST <span>·</span> SOURCE LINKED</div>
        </div>
      </section>

      <section className="signal-strip" aria-label="Current catalog status">
        <div><span className="signal-number">02</span><span className="signal-label">NASA PSI RECORDS<br />SELECTED</span></div>
        <div><span className="signal-number muted">—</span><span className="signal-label">EXPERIMENT FILES<br />NOT YET INGESTED</span></div>
        <div><span className="signal-number muted">—</span><span className="signal-label">MODEL OUTPUTS<br />NOT YET AVAILABLE</span></div>
        <div className="status-note"><ShieldAlert size={18} /><span>Catalog stage. No safety score or prediction is being presented.</span></div>
      </section>

      <section className="investigations" id="investigations">
        <div className="section-heading">
          <div><div className="eyebrow"><span>01 / SOURCE INDEX</span><span className="eyebrow-line" /></div><h2>Start with the evidence.</h2></div>
          <p>Two distinct experimental tracks. Their results stay separate until conditions and measurements support a fair comparison.</p>
        </div>

        <div className="source-grid">
          {sources.map((source, index) => (
            <article className="source-card" key={source.code}>
              <div className="card-head"><span className="source-index">0{index + 1} <i>/ NASA PSI</i></span><span className="record-code"><Database size={13} /> {source.code}</span></div>
              <h3>{source.name}</h3>
              <p className="full-name">{source.fullName}</p>
              <div className="rule" />
              <div className="field-label">EXPERIMENT FOCUS</div>
              <p className="focus">{source.focus}</p>
              <div className="field-label">RECORDED CONTEXT IN NASA PSI DESCRIPTION</div>
              <p className="context">{source.context}</p>
              <div className="card-foot"><span>DOI {source.doi}</span><a href={source.href} target="_blank" rel="noreferrer" aria-label={`Open NASA PSI record for ${source.name}`}><ArrowUpRight size={17} /></a></div>
            </article>
          ))}
        </div>
      </section>

      <section className="next-step">
        <div className="next-icon"><Database size={21} /></div>
        <div><span className="field-label">NEXT INGESTION STEP</span><h3>Inventory the files before modeling.</h3><p>Check each PSI record’s data organization and file folders. Retrieve documentation and available analyzed data first; add raw telemetry or video only when the format and research question are clear.</p></div>
        <a href="https://psi.nasa.gov/physci/repo" target="_blank" rel="noreferrer">NASA PSI <ArrowUpRight size={15} /></a>
      </section>

      <footer><span>FLAMESCOPE · RESEARCH NAVIGATION PROTOTYPE</span><span>NOT A CERTIFIED SPACECRAFT SAFETY SYSTEM</span></footer>
    </main>
  )
}
