import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = path.join(root, "data", "raw", "FLEX");
const curated = path.join(root, "data", "curated");
const testSheetName = "PSI-69_Raw Data_FLEX-007_TestSheet.txt";
const streamFiles = [
  { name: "PSI-69_Raw Data_FLEX-007_DropletData.txt", output: "flex_007_droplet_timeseries.csv", timeColumn: "DropletTime_sec" },
  { name: "PSI-69_Raw Data_FLEX-007_LLUVData.txt", output: "flex_007_lluv_timeseries.csv", timeColumn: "LLUVTime_sec" },
  { name: "PSI-69_Raw Data_FLEX-007_ColorCamData.txt", output: "flex_007_colorcam_timeseries.csv", timeColumn: "ColorCamTime_sec" },
];

function csv(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function field(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^\\s*${escaped}\\s*[:=]\\s*(.*?)\\s*$`, "m"));
  return match?.[1] ?? "";
}

function readTsv(text) {
  const physicalLines = text.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  const nonEmpty = physicalLines.map((line, index) => ({ line, sourceRow: index + 1 })).filter(({ line }) => line.trim() !== "");
  if (nonEmpty.length < 2) throw new Error("FLEX source stream has no header or data rows.");
  const headers = nonEmpty[0].line.split("\t");
  const records = nonEmpty.slice(1).map(({ line, sourceRow }) => ({ sourceRow, values: line.split("\t") }));
  if (records.some(({ values }) => values.length !== headers.length)) throw new Error("FLEX source stream row width differs from its header.");
  return { headers, records };
}

function timeSummary(times) {
  const deltas = times.slice(1).map((time, index) => time - times[index]);
  const sorted = [...deltas].sort((a, b) => a - b);
  return {
    min_s: times.length ? Math.min(...times) : null,
    max_s: times.length ? Math.max(...times) : null,
    median_interval_s: sorted.length ? sorted[Math.floor(sorted.length / 2)] : null,
    non_increasing_steps: deltas.filter((delta) => delta <= 0).length,
  };
}

await mkdir(curated, { recursive: true });
const [testSheet, ...streamTexts] = await Promise.all([
  readFile(path.join(raw, testSheetName), "utf8"),
  ...streamFiles.map(({ name }) => readFile(path.join(raw, name), "utf8")),
]);
const testIdentifier = field(testSheet, "CIR Test Number");
const streamReports = [];

for (let streamIndex = 0; streamIndex < streamFiles.length; streamIndex += 1) {
  const stream = streamFiles[streamIndex];
  const { headers, records } = readTsv(streamTexts[streamIndex]);
  const timeIndex = headers.indexOf(stream.timeColumn);
  if (timeIndex < 0) throw new Error(`${stream.name} has no ${stream.timeColumn} field.`);

  let invalidTimeRows = 0;
  const cleaned = [];
  const errorsByColumn = {};
  for (const record of records) {
    const time = record.values[timeIndex];
    if (time === "" || !Number.isFinite(Number(time))) {
      invalidTimeRows += 1;
      continue;
    }
    const flags = [];
    for (let index = 0; index < record.values.length; index += 1) {
      if (/^#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)$/.test(record.values[index])) {
        errorsByColumn[headers[index]] = (errorsByColumn[headers[index]] ?? 0) + 1;
        flags.push(`source_error:${headers[index]}`);
        record.values[index] = "";
      }
    }
    cleaned.push({ ...record, flags });
  }

  const outputHeaders = [
    "psi_record_id", "doi", "record_version", "file_version", "run_id", "test_identifier",
    "source_file", "source_row", ...headers, "quality_flags",
  ];
  const outputRows = cleaned.map(({ sourceRow, values, flags }) => [
    "PSI-69", "10.60555/mbq8-0451", "5", "1", "FLEX-007", testIdentifier,
    `data/raw/FLEX/${stream.name}`, sourceRow, ...values, flags.join("|"),
  ]);
  await writeFile(
    path.join(curated, stream.output),
    [outputHeaders, ...outputRows].map((row) => row.map(csv).join(",")).join("\n") + "\n",
    "utf8",
  );

  const times = cleaned.map(({ values }) => Number(values[timeIndex]));
  streamReports.push({
    source_file: `data/raw/FLEX/${stream.name}`,
    output_file: `data/curated/${stream.output}`,
    source_row_count: records.length,
    cleaned_row_count: cleaned.length,
    dropped_rows_with_missing_or_invalid_time: invalidTimeRows,
    source_time_column: stream.timeColumn,
    units: "seconds, as labeled in the source",
    time_summary: timeSummary(times),
    error_cells_blank_in_curated_file: Object.values(errorsByColumn).reduce((sum, count) => sum + count, 0),
    error_cells_by_column: errorsByColumn,
    missing_values_by_column: Object.fromEntries(headers.map((header, index) => [header, cleaned.filter(({ values }) => values[index] === "").length]).filter(([, count]) => count > 0)),
  });
}

const context = {
  investigation_id: "FLEX",
  psi_record_id: "PSI-69",
  doi: "10.60555/mbq8-0451",
  record_version: 5,
  run_id: "FLEX-007",
  test_identifier: testIdentifier,
  test_date: field(testSheet, "Test Date"),
  test_time_gmt: field(testSheet, "Test Time"),
  ambient_environment_as_reported: {
    pressure_atm: field(testSheet, "Pressure (atm)"),
    oxygen_mole_fraction: field(testSheet, "O2 Mole Fraction"),
    nitrogen_mole_fraction: field(testSheet, "N2 Mole Fraction"),
    carbon_dioxide_mole_fraction: field(testSheet, "CO2 Mole Fraction"),
    helium_mole_fraction: field(testSheet, "He Mole Fraction"),
    temperature_K: field(testSheet, "Temperature (K)"),
  },
  test_conditions_as_reported: {
    fuel: field(testSheet, "Fuel"),
    initial_droplet_diameter_mm: field(testSheet, "D0  (mm)"),
    average_burning_rate_mm2_per_s: field(testSheet, "kavg  (mm2/s)"),
    fiber: field(testSheet, "Fiber"),
    reported_end_state: field(testSheet, "Dext  (mm)"),
  },
  notes_as_reported: testSheet.split(/^COMMENTS:\s*$/m)[1]?.trim() ?? "",
  streams: streamReports,
  sources: [
    { file: `data/raw/FLEX/${testSheetName}`, reference: "TEST PARAMETERS, AMBIENT ENVIRONMENT, TEST CONDITIONS, COMMENTS" },
    ...streamFiles.map(({ name }) => ({ file: `data/raw/FLEX/${name}`, reference: "header row; source time-series rows follow" })),
    { file: "data/raw/FLEX/PSI-69_Experimental table_FLEX.csv", reference: "FLEX test 20CAL13; see original table row" },
  ],
  interpretation_limits: [
    "Original measurements and units are retained; blank cells remain blank. No smoothing, resampling, outlier removal, or prediction is applied.",
    "The three streams have separate sample clocks and coverage windows. They are not joined by row number; synchronized overlays need an explicit alignment tolerance and gap policy.",
    "No gravity regime or new physical values are inferred. Test-sheet values remain separate from experiment-table values to preserve their reported precision and provenance.",
  ],
};
await writeFile(path.join(curated, "flex_007_run_context.json"), `${JSON.stringify(context, null, 2)}\n`, "utf8");
await writeFile(path.join(curated, "flex_007_quality_report.json"), `${JSON.stringify({ investigation_id: "FLEX", psi_record_id: "PSI-69", doi: "10.60555/mbq8-0451", record_version: 5, run_id: "FLEX-007", policy: "Source order is preserved; invalid-time rows would be excluded; missing values remain blank; sensor spikes are retained for review.", streams: streamReports }, null, 2)}\n`, "utf8");

for (const stream of streamReports) {
  const span = stream.time_summary;
  console.log(`${path.basename(stream.output_file)}: ${stream.cleaned_row_count} rows, ${span.min_s}–${span.max_s}s, median step ${span.median_interval_s}s.`);
}
console.log("Wrote FLEX-007 time series, run context, and quality report.");
