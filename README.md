# FlameScope

An evidence-first dashboard for exploring NASA microgravity combustion studies and fire-safety questions in human spaceflight.

## Project status

FlameScope is a working, evidence-first dashboard prototype for NASA's **Flame in Freefall** challenge. It makes two PSI investigations explorable while keeping their measurement streams separate:

- SAFFIRE-I (PSI-98, record version 4): Cygnus cabin/detector telemetry and a separate SAFFIRE sensor stream, with source timestamps, quality notes, and channel selectors.
- FLEX (PSI-69, record version 5): FLEX-007 droplet, LLUV, and color-camera measurements, with run conditions and source-reported end state.
- Each view plots preserved time series, source-linked sample counts, observed ranges, and candidate departures from a rolling median/MAD screen. The screen is exploratory; it is not a trained classifier or operational fire alarm.
- Independent clocks, units, missingness, source rows, and run context remain visible. Cross-stream timing is not reconciled and the investigations are never merged.

The current screen is a rolling median/MAD research heuristic, not a trained AI model, predictive fire warning, or certified safety system. See [`docs/submission.md`](docs/submission.md) for the project summary, data attributions, and evidence limits. The seven-slide public demo and paste-ready NASA project fields are in [`submission/`](submission/). Detailed source and model notes are in [`docs/data-retrieval.md`](docs/data-retrieval.md), [`docs/data-schema.md`](docs/data-schema.md), and [`docs/phase-two-model-architecture.md`](docs/phase-two-model-architecture.md).

## Project layout

```text
flamescope/
  docs/                 data handling and model architecture
  data/
    source_manifest.json PSI record, version, and file provenance
    raw/                 local, immutable NASA downloads (not committed)
    curated/             source-linked time-series exports and quality reports
  frontend/              React + TypeScript telemetry dashboard
  processing/            Node.js data extraction and inventory scripts
```

## Rebuild processed data

Run from the repository root with Node.js:

```powershell
node processing/build_source_inventory.mjs
node processing/prepare_saffire_telemetry.mjs
node processing/prepare_flex007.mjs
```

The raw PSI files must exist in their documented `data/raw/` locations. Processing scripts use Node.js built-ins and do not modify the raw originals. The dashboard itself uses the committed curated exports, so raw source files are not needed just to run the UI.

## Start the dashboard

```powershell
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. To create a production build, run `pnpm build` from `frontend/`.

## Data handling rules

1. Keep original NASA downloads unchanged in `data/raw/`; that folder is excluded from Git.
2. Track the PSI record, DOI, selected record and file versions, source path, retrieval date, and SHA-256 for every downloaded file.
3. Preserve source units and missing values. Do not merge studies whose test conditions or measurements are incompatible.
4. Keep dashboard language clear about whether a value is NASA-reported, calculated from NASA data, or an exploratory model output.
5. Treat candidate departures as research indicators, not operational safety commands or a certified spacecraft safety system.

## Technology

- Dashboard: Vite, React, TypeScript, and SVG telemetry plots
- Data preparation: Node.js built-ins
- Future model service: Python API and scientific stack, after more runs and source labels are collected
- GitHub repository: `https://github.com/karanmhsp/flamescope-space-apps-2026`

## Attribution and license

Original FlameScope source code is licensed under the MIT License in [`LICENSE`](LICENSE). NASA PSI source data and derived files are attributed in [`docs/submission.md`](docs/submission.md) and the source manifest. The source records identify the selected PSI datasets as CC0-1.0; third-party packages and fonts retain their own license terms. FlameScope is an independent participant project; NASA does not endorse it.
