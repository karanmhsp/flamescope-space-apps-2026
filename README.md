# FlameScope

An evidence-first dashboard for exploring NASA microgravity combustion studies and fire-safety questions in human spaceflight.

## Current phase

Phase two is underway. FlameScope has a focused first slice from NASA PSI:

- SAFFIRE-I (PSI-98, record version 4): experiment table, telemetry workbook, and supporting documentation.
- FLEX (PSI-69, record version 5): experiment table, metadata, and three FLEX-007 sensor streams with test context.
- Local raw originals are retained in `data/raw/` and excluded from Git. The source manifest and file inventory record version, source, size, and checksum.
- Curated derivatives preserve source labels, units, blanks, rows, and stream timing. See [`docs/data-retrieval.md`](docs/data-retrieval.md), [`docs/data-schema.md`](docs/data-schema.md), and [`docs/phase-two-model-architecture.md`](docs/phase-two-model-architecture.md).

The processed sample is exploratory. It does not train or validate a spacecraft fire alarm. SAFFIRE and FLEX are distinct experiments; their streams remain separate until timing, units, and conditions are verified.

## Project layout

```text
flamescope/
  docs/                 data handling and model architecture
  data/
    source_manifest.json PSI record, version, and file provenance
    raw/                 local, immutable NASA downloads (not committed)
    curated/             source-linked time-series exports and quality reports
  frontend/              React + TypeScript dashboard
  processing/            Node.js data extraction and inventory scripts
```

## Rebuild processed data

Run from the repository root with Node.js:

```powershell
node processing/build_source_inventory.mjs
node processing/prepare_saffire_telemetry.mjs
node processing/prepare_flex007.mjs
```

The raw PSI files must exist in their documented `data/raw/` locations. Processing scripts use Node.js built-ins and do not modify the raw originals.

## Start the dashboard

```powershell
cd frontend
npm install
npm run dev
```

## Data handling rules

1. Keep original NASA downloads unchanged in `data/raw/`; that folder is excluded from Git.
2. Track the PSI record, DOI, selected record and file versions, source path, retrieval date, and SHA-256 for every downloaded file.
3. Preserve source units and missing values. Do not merge studies whose test conditions or measurements are incompatible.
4. Keep dashboard language clear about whether a value is NASA-reported, calculated from NASA data, or an exploratory model output.
5. Treat anomaly scores as research indicators, not operational safety commands or a certified spacecraft safety system.

## Technology

- Dashboard: Vite, React, TypeScript
- Data preparation: Node.js built-ins
- Future model service: Python API and scientific stack, after more runs and source labels are collected
- GitHub repository: `https://github.com/karanmhsp/flamescope-space-apps-2026`
