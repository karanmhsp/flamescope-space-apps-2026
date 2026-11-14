# FlameScope

An evidence-first dashboard for exploring NASA microgravity combustion studies and fire-safety questions in human spaceflight.

## Current scope

- The source catalog begins with NASA PSI records for **SAFFIRE-I (PSI-98)** and **FLEX (PSI-69)**.
- No experiment files or observations have been downloaded or analyzed yet.
- The first dashboard screen is a transparent source catalog. It must not imply that NASA records are already ingested.
- Project details and the retrieval checklist are in [`docs/data-retrieval.md`](docs/data-retrieval.md).

## Project layout

```text
flamescope/
  docs/                 research notes and data definitions
  data/
    source_manifest.json PSI record metadata and download status
    raw/                 local, immutable NASA downloads (not committed)
    curated/             small normalized outputs for the dashboard
  frontend/              React + TypeScript dashboard
  processing/            Python data inventory and normalization tools
```

## Start the dashboard

```powershell
cd frontend
npm install
npm run dev
```

## Build the source inventory

```powershell
python processing/build_source_catalog.py
```

The script writes `data/curated/source_catalog.csv` from the tracked source manifest. It does not fetch NASA files or make scientific claims.

## Data handling rules

1. Keep original NASA downloads unchanged in `data/raw/`; that folder is excluded from Git.
2. Track the PSI record, DOI, selected record version, file name, source URL, retrieval date, and SHA-256 for every downloaded file.
3. Preserve source units and missing values. Do not merge studies whose test conditions or measurements are incompatible.
4. Keep dashboard language clear about whether a value is NASA-reported, calculated from NASA data, or an exploratory model output.
5. Do not present the project as a certified spacecraft safety system.

## Technology

- Dashboard: Vite, React, TypeScript
- Processing: Python standard library for the initial source inventory; add scientific packages only when actual data formats require them.
- Deployment and GitHub remote: pending repository creation and push setup.
