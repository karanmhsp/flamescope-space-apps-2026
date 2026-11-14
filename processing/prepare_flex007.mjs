import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = path.join(root, "data", "raw", "FLEX");
const curated = path.join(root, "data", "curated");
const dropletName = "PSI-69_Raw Data_FLEX-007_DropletData.txt";
const testSheetName = "PSI-69_Raw Data_FLEX-007_TestSheet.txt";

function csv(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function field(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^\\s*${escaped}\\s*[:=]\\s*(.*?)\\s*$`, "m"));
  return match?.[1] ?? "";
}

await mkdir(curated, { recursive: true });
const [dropletText, testSheet] = await Promise.all([
  readFile(path.join(raw, dropletName), "utf8"),
  readFile(path.join(raw, testSheetName), "utf8"),
]);

const lines = dropletText.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/).filter(Boolean);
const sourceHeaders = lines[0].split("\t");
const inputRows = lines.slice(1).map((line, index) => ({
  sourceRow: index + 2,
  values: line.split("\t"),
}));
if (sourceHeaders.length !== 4 || inputRows.some(({ values }) => values.length !== sourceHeaders.length)) {
  throw new Error("FLEX-007 droplet table does not match its four-column tab-delimited schema.");
}

const header = [
  "psi_record_id",
  "doi",
  "record_version",
  "file_version",
  "run_id",
  "test_identifier",
  "source_file",
  "source_row",
  ...sourceHeaders,
];
const rows = inputRows.map(({ sourceRow, values }) => [
  "PSI-69",
  "10.60555/mbq8-0451",
  "5",
  "1",
  "FLEX-007",
  field(testSheet, "CIR Test Number"),
  `data/raw/FLEX/${dropletName}`,
  sourceRow,
  ...values,
]);
const outputPath = path.join(curated, "flex_007_droplet_timeseries.csv");
await writeFile(outputPath, [header, ...rows].map((row) => row.map(csv).join(",")).join("\n") + "\n", "utf8");

const context = {
  investigation_id: "FLEX",
  psi_record_id: "PSI-69",
  doi: "10.60555/mbq8-0451",
  record_version: 5,
  run_id: "FLEX-007",
  test_identifier: field(testSheet, "CIR Test Number"),
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
  sources: [
    { file: `data/raw/FLEX/${testSheetName}`, reference: "TEST PARAMETERS, AMBIENT ENVIRONMENT, TEST CONDITIONS, COMMENTS" },
    { file: `data/raw/FLEX/${dropletName}`, reference: "header row 1; source data rows 2 onward" },
    { file: "data/raw/FLEX/PSI-69_Experimental table_FLEX.csv", reference: "FLEX test 20CAL13; see original table row" },
  ],
  interpretation_limits: [
    "This derivative copies the source time series and adds provenance only; it does not predict fire outcomes.",
    "Blank source values remain blank. No values or gravity regime are inferred.",
    "The TestSheet values are kept separately as reported because the experimental table may use different rounding or processing.",
  ],
};
await writeFile(path.join(curated, "flex_007_run_context.json"), `${JSON.stringify(context, null, 2)}\n`, "utf8");

const times = inputRows.map(({ values }) => Number(values[0])).filter(Number.isFinite);
const diameters = inputRows.map(({ values }) => Number(values[1])).filter(Number.isFinite);
console.log(`Prepared ${rows.length} source-linked FLEX-007 droplet observations.`);
console.log(`Source time span: ${Math.min(...times)} to ${Math.max(...times)} s; recorded diameter span: ${Math.min(...diameters)} to ${Math.max(...diameters)} mm.`);
console.log(`Wrote ${path.relative(root, outputPath)} and data/curated/flex_007_run_context.json.`);
