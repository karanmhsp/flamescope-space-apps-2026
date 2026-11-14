import flexContext from '../../../data/curated/flex_007_run_context.json'
import flexQuality from '../../../data/curated/flex_007_quality_report.json'
import saffireQuality from '../../../data/curated/saffire_quality_report.json'

export type CsvRow = Record<string, string>

export type Sample = {
  x: number
  y: number
  sourceRow: number
}

export type SignalOption = {
  column: string
  label: string
  unit: string
}

export type StreamQuality = {
  cleaned_row_count: number
  dropped_rows_with_missing_or_invalid_time?: number
  rows_dropped_for_missing_or_invalid_timestamp_or_time?: number
  error_cells_blank_in_curated_file?: number
  error_cells_by_column?: Record<string, number>
  missing_values_by_column?: Record<string, number>
  time_summary?: {
    min_s?: number
    max_s?: number
    median_interval_s?: number | null
    duplicate_or_backwards_steps?: number
  }
  units?: string
}

export type TelemetryStream = {
  id: string
  label: string
  description: string
  timeColumn: string
  timeUnit: string
  defaultSignal: string
  signals: SignalOption[]
  loadRows: () => Promise<CsvRow[]>
  quality: StreamQuality
}

export type Experiment = {
  id: 'saffire' | 'flex'
  name: string
  fullName: string
  record: string
  recordVersion: number
  doi: string
  href: string
  accent: 'coral' | 'teal'
  focus: string
  conditions: { label: string; value: string }[]
  outcome?: string
  note: string
  streams: TelemetryStream[]
}

function parseCsv(text: string): CsvRow[] {
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let quoted = false
  const source = text.replace(/^\uFEFF/, '')

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true
    } else if (char === ',') {
      record.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1
      record.push(field)
      if (record.some((cell) => cell !== '')) records.push(record)
      record = []
      field = ''
    } else {
      field += char
    }
  }
  record.push(field)
  if (record.some((cell) => cell !== '')) records.push(record)
  if (records.length < 2) return []

  const headers = records[0]
  return records.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])))
}

async function loadCsv(loader: () => Promise<{ default: string }>): Promise<CsvRow[]> {
  const module = await loader()
  return parseCsv(module.default)
}

type SaffireQualitySheet = {
  name: string
  cleaned_rows: number
  rows_dropped_for_missing_or_invalid_timestamp_or_time: number
  error_cells_blank_in_curated_file: number
  error_cells_by_column: Record<string, number>
  missing_values_by_column: Record<string, number>
  time_summary: {
    min_source_value: number
    max_source_value: number
    median_step_source_units: number
    duplicate_or_backwards_steps: number
    units: string
  }
}

type SaffireQualityReport = { sheets: SaffireQualitySheet[] }
type FlexQualityStream = StreamQuality & {
  source_file: string
  output_file: string
  time_summary: { min_s: number; max_s: number; median_interval_s: number; non_increasing_steps: number }
}

const saffireSheets = (saffireQuality as unknown as SaffireQualityReport).sheets
const flexStreams = (flexQuality as unknown as { streams: FlexQualityStream[] }).streams
const flexRun = flexContext as {
  test_identifier: string
  test_date: string
  ambient_environment_as_reported: { pressure_atm: string; oxygen_mole_fraction: string; temperature_K: string }
  test_conditions_as_reported: { fuel: string; initial_droplet_diameter_mm: string; reported_end_state: string }
}

function saffireQualityFor(sheetName: string): StreamQuality {
  const sheet = saffireSheets.find((item) => item.name === sheetName)
  if (!sheet) return { cleaned_row_count: 0 }
  return {
    cleaned_row_count: sheet.cleaned_rows,
    rows_dropped_for_missing_or_invalid_timestamp_or_time: sheet.rows_dropped_for_missing_or_invalid_timestamp_or_time,
    error_cells_blank_in_curated_file: sheet.error_cells_blank_in_curated_file,
    error_cells_by_column: sheet.error_cells_by_column,
    missing_values_by_column: sheet.missing_values_by_column,
    time_summary: {
      median_interval_s: sheet.time_summary.units.startsWith('seconds') ? sheet.time_summary.median_step_source_units : null,
      duplicate_or_backwards_steps: sheet.time_summary.duplicate_or_backwards_steps,
    },
    units: sheet.time_summary.units,
  }
}

function flexQualityFor(fileName: string): StreamQuality {
  const stream = flexStreams.find((item) => item.output_file.endsWith(fileName))
  if (!stream) return { cleaned_row_count: 0 }
  return {
    cleaned_row_count: stream.cleaned_row_count,
    dropped_rows_with_missing_or_invalid_time: stream.dropped_rows_with_missing_or_invalid_time,
    error_cells_blank_in_curated_file: stream.error_cells_blank_in_curated_file,
    error_cells_by_column: stream.error_cells_by_column,
    missing_values_by_column: stream.missing_values_by_column,
    time_summary: {
      median_interval_s: stream.time_summary.median_interval_s,
      duplicate_or_backwards_steps: stream.time_summary.non_increasing_steps,
      min_s: stream.time_summary.min_s,
      max_s: stream.time_summary.max_s,
    },
    units: stream.units,
  }
}

const saffireStreams: TelemetryStream[] = [
  {
    id: 'cygnus',
    label: 'Cygnus environment',
    description: 'Cabin, detector, and vehicle telemetry',
    timeColumn: 'Relative Time (s)',
    timeUnit: 's',
    defaultSignal: 'FIZ1 Smoke Detector Obscuration  (V)',
    signals: [
      { column: 'FIZ1 Smoke Detector Obscuration  (V)', label: 'Smoke detector · obscuration 1', unit: 'V' },
      { column: 'FIZ 2 Smoke Detector Obscuration (V)', label: 'Smoke detector · obscuration 2', unit: 'V' },
      { column: 'FIZ 1 Smoke Detector Scatterometer (V)', label: 'Smoke detector · scatter 1', unit: 'V' },
      { column: 'FIZ 2 Smoke Detector Scatterometer (V)', label: 'Smoke detector · scatter 2', unit: 'V' },
      { column: 'PCM Air Temp (degC)', label: 'Cabin air temperature', unit: '°C' },
      { column: 'PCM Press (psi)', label: 'Cabin pressure', unit: 'psi' },
      { column: 'FIZ 1 Cabin Fan delta P (Pa)', label: 'Fan pressure differential 1', unit: 'Pa' },
      { column: 'FIZ 2 Cabin Fan Delta P (Pa)', label: 'Fan pressure differential 2', unit: 'Pa' },
    ],
    loadRows: () => loadCsv(() => import('../../../data/curated/saffire_cygnus_dashboard.csv?raw')),
    quality: saffireQualityFor('CygnusData'),
  },
  {
    id: 'saffire',
    label: 'SAFFIRE sensors',
    description: 'Radiometer, airflow, and fire-sensor channels',
    timeColumn: 'Relative Time (s)',
    timeUnit: 's',
    defaultSignal: 'Radiometer1Value',
    signals: [
      { column: 'Radiometer1Value', label: 'Radiometer channel 1', unit: 'source units' },
      { column: 'Radiometer2Value', label: 'Radiometer channel 2', unit: 'source units' },
      { column: 'Radiometer3Value', label: 'Radiometer channel 3', unit: 'source units' },
      { column: 'Radiometer4Value', label: 'Radiometer channel 4', unit: 'source units' },
      { column: 'Anemometer1', label: 'Anemometer channel 1', unit: 'source units' },
      { column: 'Anemometer2', label: 'Anemometer channel 2', unit: 'source units' },
      { column: 'FanTachometer', label: 'Fan tachometer', unit: 'source units' },
      { column: 'SmokeWireV', label: 'Smoke wire voltage', unit: 'source units' },
      { column: 'SmokeWireI', label: 'Smoke wire current', unit: 'source units' },
    ],
    loadRows: () => loadCsv(() => import('../../../data/curated/saffire_sensor_timeseries.csv?raw')),
    quality: saffireQualityFor('SaffireData'),
  },
]

export const experiments: Experiment[] = [
  {
    id: 'saffire',
    name: 'SAFFIRE-I',
    fullName: 'Spacecraft Fire Safety Experiment-I',
    record: 'PSI-98',
    recordVersion: 4,
    doi: '10.60555/0t15-1z43',
    href: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',
    accent: 'coral',
    focus: 'Large-scale fabric flame behavior and spacecraft detection signals.',
    conditions: [
      { label: 'Material', value: 'SIBAL composite fabric' },
      { label: 'Duct flow', value: '20 cm/s' },
      { label: 'Measurement set', value: 'Smoke · thermal · pressure · airflow' },
    ],
    note: 'Separate clocks and sample cadences are preserved. The workbook RawData time unit is unresolved and is not plotted.',
    streams: saffireStreams,
  },
  {
    id: 'flex',
    name: 'FLEX',
    fullName: 'Flame Extinguishment Experiment',
    record: 'PSI-69',
    recordVersion: 5,
    doi: '10.60555/mbq8-0451',
    href: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69',
    accent: 'teal',
    focus: 'Droplet burning, flame geometry, and extinction behavior.',
    conditions: [
      { label: 'Fuel', value: flexRun.test_conditions_as_reported.fuel },
      { label: 'Pressure', value: `${flexRun.ambient_environment_as_reported.pressure_atm} atm` },
      { label: 'O₂ fraction', value: flexRun.ambient_environment_as_reported.oxygen_mole_fraction },
      { label: 'Initial droplet', value: `${flexRun.test_conditions_as_reported.initial_droplet_diameter_mm} mm` },
    ],
    outcome: flexRun.test_conditions_as_reported.reported_end_state,
    note: `Test ${flexRun.test_identifier} · ${flexRun.test_date}. Camera streams retain separate time ranges and are not joined by row number.`,
    streams: [
      {
        id: 'droplet',
        label: 'Droplet view',
        description: 'Droplet diameter from FLEX-007',
        timeColumn: 'DropletTime_sec',
        timeUnit: 's',
        defaultSignal: 'DropletDiameter_mm',
        signals: [{ column: 'DropletDiameter_mm', label: 'Droplet diameter', unit: 'mm' }],
        loadRows: () => loadCsv(() => import('../../../data/curated/flex_007_droplet_timeseries.csv?raw')),
        quality: flexQualityFor('flex_007_droplet_timeseries.csv'),
      },
      {
        id: 'lluv',
        label: 'LLUV flame view',
        description: 'Flame geometry from LLUV imaging',
        timeColumn: 'LLUVTime_sec',
        timeUnit: 's',
        defaultSignal: 'LLUVFlameDiameter_mm',
        signals: [
          { column: 'LLUVFlameDiameter_mm', label: 'LLUV flame diameter', unit: 'mm' },
          { column: 'LLUVFlameStandoff', label: 'LLUV flame stand-off', unit: 'source units not stated' },
        ],
        loadRows: () => loadCsv(() => import('../../../data/curated/flex_007_lluv_timeseries.csv?raw')),
        quality: flexQualityFor('flex_007_lluv_timeseries.csv'),
      },
      {
        id: 'colorcam',
        label: 'Color camera',
        description: 'Flame geometry from color imaging',
        timeColumn: 'ColorCamTime_sec',
        timeUnit: 's',
        defaultSignal: 'ColorCamFlameDiameter_mm',
        signals: [
          { column: 'ColorCamFlameDiameter_mm', label: 'Color-camera flame diameter', unit: 'mm' },
          { column: 'ColorCamFlameStandoff', label: 'Color-camera flame stand-off', unit: 'source units not stated' },
        ],
        loadRows: () => loadCsv(() => import('../../../data/curated/flex_007_colorcam_timeseries.csv?raw')),
        quality: flexQualityFor('flex_007_colorcam_timeseries.csv'),
      },
    ],
  },
]

export function numberFrom(value: string | undefined): number | null {
  if (value == null || value.trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function getSeries(stream: TelemetryStream, rows: CsvRow[], signalColumn: string): Sample[] {
  return rows.flatMap((row) => {
    const x = numberFrom(row[stream.timeColumn])
    const y = numberFrom(row[signalColumn])
    const sourceRow = numberFrom(row.source_row)
    if (x == null || y == null) return []
    return [{ x, y, sourceRow: sourceRow ?? 0 }]
  })
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

export type Deviation = Sample & { robustScore: number }

export function findCandidateDeviations(points: Sample[], windowSize = 15, threshold = 3.5): Deviation[] {
  const candidates: Deviation[] = []
  for (let index = Math.min(windowSize, 8); index < points.length; index += 1) {
    const baseline = points.slice(Math.max(0, index - windowSize), index).map((point) => point.y)
    if (baseline.length < 8) continue
    const center = median(baseline)
    const mad = median(baseline.map((value) => Math.abs(value - center)))
    if (mad === 0) continue
    const robustScore = (0.6745 * (points[index].y - center)) / mad
    if (Math.abs(robustScore) >= threshold) candidates.push({ ...points[index], robustScore })
  }
  return candidates
}
