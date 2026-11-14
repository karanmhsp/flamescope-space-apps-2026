import { createHash } from "node:crypto";
import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "data", "source_manifest.json");
const inventoryPath = path.join(root, "data", "curated", "source_file_inventory.csv");
const retrievalDateUtc = "2026-11-14";

const selected = {
  "SAFFIRE-I": [
    ["PSI-98_Experimental table_SAFFIRE-1.csv", 1, "psi-data/PSI-98/Experimental table/PSI-98_Experimental table_SAFFIRE-1.csv", 469],
    ["PSI-98_Raw Data_Saffire-I Telemetry Data Good Process Version.xlsx", 1, "psi-data/PSI-98/Raw Data/PSI-98_Raw Data_Saffire-I Telemetry Data Good Process Version.xlsx", 2775737],
    ["PSI-98_Science Documents_SAFFIRE-I and SAFFIRE-III Readme.docx", 1, "psi-data/PSI-98/Science Documents/PSI-98_Science Documents_SAFFIRE-I and SAFFIRE-III Readme.docx", 65426],
    ["PSI-98_Engineering Documents_SAFFIRE-I Operations.pdf", 1, "psi-data/PSI-98/Engineering Documents/PSI-98_Engineering Documents_SAFFIRE-I Operations.pdf", 13957],
    ["PSI-98_Raw Data_SFSDP-VIS-0295_Saffire 1 and 3_Thermocouple Placement.pdf", 1, "psi-data/PSI-98/Raw Data/PSI-98_Raw Data_SFSDP-VIS-0295_Saffire 1 and 3_Thermocouple Placement.pdf", 1065733],
  ],
  FLEX: [
    ["PSI-69_Experimental table_FLEX.csv", 1, "psi-data/PSI-69/Experimental table/PSI-69_Experimental table_FLEX.csv", 24776],
    ["PSI-69_metadata_PSI-133_FLEX.zip", 4, "psi-data/PSI-69/metadata/PSI-69_metadata_PSI-133_FLEX.zip", 24780],
    ["PSI-69_Raw Data_FLEX-007_DropletData.txt", 1, "psi-data/PSI-69/Raw Data/PSI-69_Raw Data_FLEX-007_DropletData.txt", 5366],
    ["PSI-69_Raw Data_FLEX-007_ColorCamData.txt", 1, "psi-data/PSI-69/Raw Data/PSI-69_Raw Data_FLEX-007_ColorCamData.txt", 7588],
    ["PSI-69_Raw Data_FLEX-007_LLUVData.txt", 1, "psi-data/PSI-69/Raw Data/PSI-69_Raw Data_FLEX-007_LLUVData.txt", 14508],
    ["PSI-69_Raw Data_FLEX-007_Summary.pdf", 1, "psi-data/PSI-69/Raw Data/PSI-69_Raw Data_FLEX-007_Summary.pdf", 147809],
    ["PSI-69_Raw Data_FLEX-007_TestSheet.txt", 1, "psi-data/PSI-69/Raw Data/PSI-69_Raw Data_FLEX-007_TestSheet.txt", 906],
    ["PSI-69_Raw Data_FLEX-007_TestSheet.rtf", 1, "psi-data/PSI-69/Raw Data/PSI-69_Raw Data_FLEX-007_TestSheet.rtf", 587664],
  ],
};

function quoteCsv(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const inventory = [];
for (const source of manifest.sources) {
  const localFiles = selected[source.investigation_id] ?? [];
  source.download_status = "downloaded_first_slice";
  source.retrieval_date_utc = retrievalDateUtc;
  source.retrieved_files = [];
  for (const [fileName, fileVersion, storageKey, catalogBytes] of localFiles) {
    const relativePath = `data/raw/${source.investigation_id}/${fileName}`;
    const absolutePath = path.join(root, relativePath);
    const [bytes, fileInfo] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
    if (fileInfo.size !== catalogBytes) {
      throw new Error(`${relativePath}: local ${fileInfo.size} bytes != PSI catalog ${catalogBytes} bytes`);
    }
    const file = {
      file_name: fileName,
      relative_path: relativePath,
      psi_file_version: fileVersion,
      psi_storage_key: storageKey,
      source_record_url: source.record_url,
      source_download_endpoint: `https://psi.nasa.gov/geode-py/ws/studies/${source.psi_record_id}/download?file=${encodeURIComponent(fileName)}&version=${fileVersion}&studyVersion=${source.record_version_reviewed}&redirect=false`,
      retrieved_date_utc: retrievalDateUtc,
      psi_catalog_bytes: catalogBytes,
      local_bytes: fileInfo.size,
      sha256: createHash("sha256").update(bytes).digest("hex").toUpperCase(),
    };
    source.retrieved_files.push(file);
    inventory.push({
      investigation_id: source.investigation_id,
      psi_record_id: source.psi_record_id,
      record_version: source.record_version_reviewed,
      doi: source.doi,
      license: source.license,
      ...file,
    });
  }
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
const fields = [
  "investigation_id", "psi_record_id", "record_version", "doi", "license", "file_name",
  "relative_path", "psi_file_version", "psi_storage_key", "source_record_url",
  "source_download_endpoint", "retrieved_date_utc", "psi_catalog_bytes", "local_bytes", "sha256",
];
await writeFile(
  inventoryPath,
  [fields, ...inventory.map((item) => fields.map((field) => item[field]))]
    .map((row) => row.map(quoteCsv).join(","))
    .join("\n") + "\n",
  "utf8",
);
console.log(`Recorded ${inventory.length} NASA PSI files in the manifest and ${path.relative(root, inventoryPath)}.`);
