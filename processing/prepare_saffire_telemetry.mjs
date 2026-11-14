import { inflateRawSync } from "node:zlib";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workbookPath = path.join(root, "data", "raw", "SAFFIRE-I", "PSI-98_Raw Data_Saffire-I Telemetry Data Good Process Version.xlsx");
const curated = path.join(root, "data", "curated");
const sourceRelative = "data/raw/SAFFIRE-I/PSI-98_Raw Data_Saffire-I Telemetry Data Good Process Version.xlsx";
const workbookSheets = [
  { name: "RawData", timeHeader: "RelativeSeconds", timestampHeader: null, output: "saffire_rawdata_timeseries.csv" },
  { name: "CygnusData", timeHeader: "Relative Time (s)", timestampHeader: "CygnusTimestamp", output: "saffire_cygnus_timeseries.csv" },
  { name: "SaffireData", timeHeader: "Relative Time (s)", timestampHeader: "SaffireTimestamp", output: "saffire_sensor_timeseries.csv" },
];
function unzipEntries(buffer) {
  const minEocd = Math.max(0, buffer.length - 22 - 0xffff);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= minEocd; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("The SAFFIRE workbook is not a readable ZIP/XLSX file.");
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("Invalid XLSX central directory entry.");
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const filenameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + filenameLength);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    let contents;
    if (method === 0) contents = Buffer.from(compressed);
    else if (method === 8) contents = inflateRawSync(compressed);
    else throw new Error(`Unsupported XLSX compression method ${method} in ${name}.`);
    entries.set(name, contents.toString("utf8"));
    cursor += 46 + filenameLength + extraLength + commentLength;
  }
  return entries;
}

function xmlDecode(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function attributes(xml) {
  return Object.fromEntries([...xml.matchAll(/([\w:.-]+)="([^"]*)"/g)].map((match) => [match[1], xmlDecode(match[2])]));
}

function columnIndex(cellRef) {
  let index = 0;
  for (const character of cellRef.match(/^[A-Z]+/i)?.[0]?.toUpperCase() ?? "") {
    index = index * 26 + character.charCodeAt(0) - 64;
  }
  return index - 1;
}

function cellText(cellXml, sharedStrings) {
  const cellAttr = attributes(cellXml.match(/^<c\b([^>]*)/)?.[1] ?? "");
  const type = cellAttr.t ?? "";
  const inline = cellXml.match(/<is\b[^>]*>([\s\S]*?)<\/is>/)?.[1];
  const value = cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1];
  if (type === "inlineStr" && inline != null) {
    return [...inline.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => xmlDecode(match[1])).join("");
  }
  if (value == null) return "";
  const raw = xmlDecode(value);
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  return raw;
}

function parseSheet(xml, sharedStrings) {
  const dimension = xml.match(/<dimension\b[^>]*\bref="([^"]+)"/)?.[1] ?? "unknown";
  const sheetData = xml.match(/<sheetData\b[^>]*>([\s\S]*?)<\/sheetData>/)?.[1];
  if (!sheetData) throw new Error("Worksheet is missing sheetData.");
  const parsedRows = [];
  for (const rowMatch of sheetData.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(attributes(rowMatch[1]).r);
    const cells = [];
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const cellXml = `<c ${cellMatch[1]}>${cellMatch[2] ?? ""}</c>`;
      const cellAttr = attributes(cellMatch[1]);
      const value = cellText(cellXml, sharedStrings);
      if (cellAttr.r) cells[columnIndex(cellAttr.r)] = { value, type: cellAttr.t ?? "" };
    }
    parsedRows.push({ rowNumber, cells });
  }
  return { dimension, rows: parsedRows };
}

function csv(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function describeTime(values, timeIndex, timeHeader) {
  const times = values.map((row) => row[timeIndex]).filter((value) => value !== "" && Number.isFinite(Number(value))).map(Number);
  const deltas = times.slice(1).map((time, index) => time - times[index]);
  const sortedDeltas = [...deltas].sort((a, b) => a - b);
  return {
    source_time_column: timeHeader,
    units: timeHeader === "Relative Time (s)" ? "seconds, as labeled in the source" : "unverified; original values preserved",
    min_source_value: times.length ? Math.min(...times) : null,
    max_source_value: times.length ? Math.max(...times) : null,
    median_step_source_units: sortedDeltas.length ? sortedDeltas[Math.floor(sortedDeltas.length / 2)] : null,
    duplicate_or_backwards_steps: deltas.filter((delta) => delta <= 0).length,
  };
}

await mkdir(curated, { recursive: true });
const workbookBytes = await readFile(workbookPath);
const zip = unzipEntries(workbookBytes);
const workbookXml = zip.get("xl/workbook.xml");
const relationshipsXml = zip.get("xl/_rels/workbook.xml.rels");
if (!workbookXml || !relationshipsXml) throw new Error("Workbook index or relationships part is missing.");

const relationshipMap = new Map();
for (const match of relationshipsXml.matchAll(/<Relationship\b([^>]*)\/?>(?:<\/Relationship>)?/g)) {
  const attrs = attributes(match[1]);
  relationshipMap.set(attrs.Id, attrs.Target);
}
const sheetTargets = new Map();
for (const match of workbookXml.matchAll(/<sheet\b([^>]*)\/?>(?:<\/sheet>)?/g)) {
  const attrs = attributes(match[1]);
  const relationId = attrs["r:id"];
  const target = relationshipMap.get(relationId);
  if (attrs.name && target) sheetTargets.set(attrs.name, target.startsWith("/") ? target.slice(1) : `xl/${target}`);
}
const sharedStringsXml = zip.get("xl/sharedStrings.xml") ?? "";
const sharedStrings = [...sharedStringsXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
  [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((text) => xmlDecode(text[1])).join(""),
);

const report = {
  investigation_id: "SAFFIRE-I",
  psi_record_id: "PSI-98",
  doi: "10.60555/0t15-1z43",
  record_version: 4,
  source_file: sourceRelative,
  policy: "Original columns and numeric strings are preserved. Excel error cells are blanked in curated CSVs and recorded in row quality flags. No smoothing, resampling, outlier removal, calibration, or clock alignment is applied.",
  sheets: [],
};

for (const { name: sheetName, timeHeader, timestampHeader, output: outputName } of workbookSheets) {
  const target = sheetTargets.get(sheetName);
  if (!target) throw new Error(`Worksheet ${sheetName} is missing from workbook.xml.`);
  const xml = zip.get(target);
  if (!xml) throw new Error(`Worksheet file ${target} is missing from the workbook archive.`);
  const { dimension, rows } = parseSheet(xml, sharedStrings);
  const headerRow = rows.find((row) => row.rowNumber === 1);
  if (!headerRow) throw new Error(`${sheetName} has no header row.`);
  const maxColumns = Math.max(...rows.map((row) => row.cells.length));
  const headers = Array.from({ length: maxColumns }, (_, index) => headerRow.cells[index]?.value ?? `source_column_${index + 1}`);
  const timeIndex = headers.indexOf(timeHeader);
  const timestampIndex = timestampHeader == null ? -1 : headers.indexOf(timestampHeader);
  if (timeIndex < 0) throw new Error(`${sheetName} does not have its configured time field (${timeHeader}).`);
  if (timestampHeader != null && timestampIndex < 0) throw new Error(`${sheetName} does not have its source timestamp field (${timestampHeader}).`);

  const cleanedRows = [];
  const errorCellsByColumn = {};
  let invalidClockRows = 0;
  let errorCellCount = 0;
  for (const row of rows) {
    if (row.rowNumber === 1 || row.cells.every((cell) => cell == null || cell.value === "")) continue;
    const rawValues = Array.from({ length: headers.length }, (_, index) => row.cells[index]?.value ?? "");
    const flags = [];
    for (let index = 0; index < rawValues.length; index += 1) {
      const cell = row.cells[index];
      if (cell?.type === "e" || /^#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)$/.test(rawValues[index])) {
        flags.push(`excel_error:${headers[index] || `column_${index + 1}`}`);
        errorCellsByColumn[headers[index] || `column_${index + 1}`] = (errorCellsByColumn[headers[index] || `column_${index + 1}`] ?? 0) + 1;
        rawValues[index] = "";
        errorCellCount += 1;
      }
    }
    if (
      rawValues[timeIndex] === "" ||
      !Number.isFinite(Number(rawValues[timeIndex])) ||
      (timestampIndex >= 0 && (
        rawValues[timestampIndex] === "" ||
        !Number.isFinite(Number(rawValues[timestampIndex]))
      ))
    ) {
      invalidClockRows += 1;
      continue;
    }
    cleanedRows.push({ rowNumber: row.rowNumber, values: rawValues, flags });
  }

  const outputHeaders = ["psi_record_id", "doi", "record_version", "source_file", "source_sheet", "source_row", ...headers, "quality_flags"];
  const outputRows = cleanedRows.map(({ rowNumber, values, flags }) => [
    "PSI-98", "10.60555/0t15-1z43", "4", sourceRelative, sheetName, rowNumber, ...values, flags.join("|")
  ]);
  await writeFile(path.join(curated, outputName), [outputHeaders, ...outputRows].map((row) => row.map(csv).join(",")).join("\n") + "\n", "utf8");

  if (sheetName === "CygnusData") {
    const dashboardColumns = [
      "psi_record_id", "doi", "record_version", "source_file", "source_sheet", "source_row",
      "CygnusTimestamp", "Relative Time (s)",
      "FIZ1 Smoke Detector Obscuration  (V)", "FIZ 2 Smoke Detector Obscuration (V)",
      "FIZ 1 Smoke Detector Scatterometer (V)", "FIZ 2 Smoke Detector Scatterometer (V)",
      "PCM Air Temp (degC)", "PCM Press (psi)",
      "FIZ 1 Cabin Fan delta P (Pa)", "FIZ 2 Cabin Fan Delta P (Pa)", "quality_flags",
    ];
    const indices = dashboardColumns.map((column) => outputHeaders.indexOf(column));
    if (indices.some((index) => index < 0)) throw new Error("The SAFFIRE dashboard export is missing an expected source channel.");
    const dashboardRows = outputRows.map((row) => indices.map((index) => row[index]));
    await writeFile(
      path.join(curated, "saffire_cygnus_dashboard.csv"),
      [dashboardColumns, ...dashboardRows].map((row) => row.map(csv).join(",")).join("\n") + "\n",
      "utf8",
    );
  }

  const timeSummary = describeTime(cleanedRows.map((row) => row.values), timeIndex, timeHeader);
  report.sheets.push({
    name: sheetName,
    worksheet_part: target,
    source_dimension: dimension,
    source_time_column: timeHeader,
    source_timestamp_column: timestampHeader,
    source_rows_with_data: rows.filter((row) => row.rowNumber !== 1 && !row.cells.every((cell) => cell == null || cell.value === "")).length,
    cleaned_rows: cleanedRows.length,
    rows_dropped_for_missing_or_invalid_timestamp_or_time: invalidClockRows,
    error_cells_blank_in_curated_file: errorCellCount,
    error_cells_by_column: errorCellsByColumn,
    missing_values_by_column: Object.fromEntries(headers.map((header, index) => [header, cleanedRows.filter((row) => row.values[index] === "").length]).filter(([, count]) => count > 0)),
    time_summary: timeSummary,
    output_file: `data/curated/${outputName}`,
  });
}

report.interpretation_limits = [
  "CygnusData and SaffireData retain their separate source clocks and sampling cadences; rows are not joined by index.",
  "The RawData worksheet is exported in its source row order with its original time field; its Cygnus and SAFFIRE timestamps are preserved as separate columns.",
  "RawData labels its time field RelativeSeconds, but its values are on a different scale from the companion sheets' explicitly labeled Relative Time (s)/(ms) columns. Units are therefore unverified and are not converted.",
  "Sensor readings are preserved in source units and channel labels. No voltage-to-obscuration, flow, or heat calibration is assumed.",
  "Potential fire-related peaks are retained as observations; no outlier filtering is used because a peak may be a real event.",
  "This workbook is one investigation's telemetry record, not sufficient on its own to train and validate a general fire-risk predictor.",
];
await writeFile(path.join(curated, "saffire_quality_report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
for (const sheet of report.sheets) {
  console.log(`${sheet.name}: ${sheet.cleaned_rows} rows; ${sheet.error_cells_blank_in_curated_file} Excel error cells blanked; ${sheet.time_summary.duplicate_or_backwards_steps} non-increasing time steps.`);
}
console.log("Wrote the SAFFIRE-I telemetry derivatives and quality report.");
