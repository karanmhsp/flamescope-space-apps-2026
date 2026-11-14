# NASA PSI data retrieval: SAFFIRE-I and FLEX

“Sapphire and Flits” is interpreted as **SAFFIRE-I** and **FLEX**, the NASA combustion investigations selected for FlameScope.

## Official PSI records

| Investigation | PSI record | DOI | Why it is included | Retrieval status |
|---|---|---|---|---|
| Spacecraft Fire Safety Experiment-I (SAFFIRE-I) | [PSI-98](https://psi.nasa.gov/physci/repo/data/investigations/PSI-98) | [10.60555/0t15-1z43](https://doi.org/10.60555/0t15-1z43) | Large solid-fabric fire in a duct, with telemetry and thermocouple placement documentation. | First slice retrieved, PSI record version 4 |
| Flame Extinguishment Experiment (FLEX) | [PSI-69](https://psi.nasa.gov/physci/repo/data/investigations/PSI-69) | [10.60555/mbq8-0451](https://doi.org/10.60555/mbq8-0451) | Droplet combustion and extinction data with test conditions and optical measurements. | First slice retrieved, PSI record version 5 |

Both records list the data under the CC0-1.0 license. The selected versions were reviewed on 2026-11-14 UTC. Recheck PSI before any later retrieval; file and record versions can change.

## Retrieved first slice

Original NASA filenames are preserved under `data/raw/`. The raw directory is excluded from Git; the committed manifest and inventory contain source links and checksums.

### SAFFIRE-I / PSI-98

- `data/raw/SAFFIRE-I/PSI-98_Experimental table_SAFFIRE-1.csv`
- `data/raw/SAFFIRE-I/PSI-98_Raw Data_Saffire-I Telemetry Data Good Process Version.xlsx`
- `data/raw/SAFFIRE-I/PSI-98_Science Documents_SAFFIRE-I and SAFFIRE-III Readme.docx`
- `data/raw/SAFFIRE-I/PSI-98_Engineering Documents_SAFFIRE-I Operations.pdf`
- `data/raw/SAFFIRE-I/PSI-98_Raw Data_SFSDP-VIS-0295_Saffire 1 and 3_Thermocouple Placement.pdf`

### FLEX / PSI-69

- `data/raw/FLEX/PSI-69_Experimental table_FLEX.csv`
- `data/raw/FLEX/PSI-69_metadata_PSI-133_FLEX.zip`
- FLEX-007 run package: droplet, color-camera, and LLUV time series; summary PDF; and text/RTF test sheets.

The FLEX-007 test sheet identifies CIR test `20CAL13` and reports heptane, nominal 1.00 atm cabin air, O2/N2 mole fractions, and a disruption end state. The source time series contains 141 droplet observations. Those conditions remain separately traceable to the test sheet; small differences between the test sheet and experiment table have not been silently reconciled.

## Generated processing artifacts

- `data/curated/source_file_inventory.csv` records the 13 retrieved files, PSI record/file versions, PSI object keys, stable download endpoints, local byte counts, UTC retrieval date, and SHA-256 checksums. The same details are stored in `data/source_manifest.json`.
- `data/curated/flex_007_droplet_timeseries.csv`, `flex_007_lluv_timeseries.csv`, and `flex_007_colorcam_timeseries.csv` contain the original FLEX-007 streams plus record/run/source-file/source-row provenance. They preserve blanks, source order, and original units. Their sample clocks are kept separate.
- `data/curated/flex_007_run_context.json` captures test-sheet conditions and comments as reported, with source references and interpretation limits. `flex_007_quality_report.json` records each stream's sample count, time coverage, cadence, and missing values.
- `data/curated/saffire_rawdata_timeseries.csv`, `saffire_cygnus_timeseries.csv`, and `saffire_sensor_timeseries.csv` preserve the three selected workbook sheets with original columns and source-row provenance. The clean exports contain 2,645, 2,540, and 105 timestamped rows respectively. The RawData time column is named `RelativeSeconds`, but its scale differs from the companion sheets' explicit seconds/milliseconds fields; retain it as an unverified source value until the data guide resolves that ambiguity.
- `data/curated/saffire_quality_report.json` documents the cleaning decisions, time coverage, sample cadence, missing fields, and two Excel formula-error cells blanked from the RawData derivative. Rows without a usable source time were omitted from the curated exports; no smoothing, resampling, outlier removal, calibration, or clock alignment was applied.
- `processing/prepare_flex007.mjs` and `processing/prepare_saffire_telemetry.mjs` rebuild these derivatives using Node.js built-ins only.
- `processing/build_source_inventory.mjs` rebuilds the inventory and verifies local file sizes against PSI's file catalog before recording checksums.

These are source-linked descriptive derivatives. One FLEX run and one SAFFIRE-I telemetry workbook are not enough to train or validate a general predictive fire model. The investigations have different geometries, channels, and timing; keep them as separate evidence tracks until variables and conditions are shown to be comparable.

## Retrieval and interpretation rules

1. Use the official PSI record and inspect the selected version, data organization, file size, file version, and visibility before download.
2. Request only the records and files needed for the current analysis. PSI-98 and PSI-69 each contain large media/data collections; do not fetch entire collections for the first dashboard pass.
3. Retrieve through PSI's current download service. Its response provides a temporary signed storage link; do not treat that expiring link as provenance. Store the PSI record link, stable PSI download endpoint, storage key, record/file versions, and checksum instead.
4. Keep original NASA files immutable under `data/raw/`; do not rename or edit them. Raw files stay out of Git. Commit only provenance and appropriately scoped curated derivatives.
5. Inspect encoding, delimiter, headers, units, timestamps, run IDs, gravity regime, and missing values from the source itself. Preserve original labels and blanks; never infer an unreported value.
6. Keep raw FLEX and SAFFIRE evidence separate unless the compared question, variable, units, and experimental conditions are genuinely compatible.
7. Do not present a predictive result without a documented target, training/evaluation split, baseline, uncertainty, and source-linked validation. If data are too sparse, present descriptive evidence and state that limit.

## NASA references

- [NASA PSI Data Repository](https://psi.nasa.gov/physci/repo)
- [SAFFIRE-I PSI-98 record](https://psi.nasa.gov/physci/repo/data/investigations/PSI-98)
- [FLEX PSI-69 record](https://psi.nasa.gov/physci/repo/data/investigations/PSI-69)
- [NASA PSI database guide: data files and downloads](https://science.nasa.gov/wp-content/uploads/2024/11/psi-database-guide.pdf)
- [NASA Researcher's Guide to PSI](https://www.nasa.gov/science-research/for-researchers/researchers-guide-to-physical-sciences-informatics-system/)
