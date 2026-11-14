# Data schema and provenance

The dashboard keeps measured values and experiment context separate. Source labels, units, clocks, and missingness are preserved; fields stay unknown until the source file establishes them.

## Curated files currently used by the dashboard

| Investigation / stream | Curated file | Rows with usable source time | Time column | Example measurement fields |
|---|---|---:|---|---|
| SAFFIRE-I / Cygnus | `saffire_cygnus_dashboard.csv` | 2,540 | `Relative Time (s)` | Smoke-detector and scatterometer V, air temperature °C, pressure psi, fan differential pressure Pa |
| SAFFIRE-I / SaffireData | `saffire_sensor_timeseries.csv` | 105 | `Relative Time (s)` | `Radiometer1Value`–`Radiometer4Value`, `Anemometer1`, `FanTachometer`, smoke-wire channels |
| FLEX-007 / droplet | `flex_007_droplet_timeseries.csv` | 141 | `DropletTime_sec` | `DropletDiameter_mm` and zeroed positions |
| FLEX-007 / LLUV | `flex_007_lluv_timeseries.csv` | 177 | `LLUVTime_sec` | `LLUVFlameDiameter_mm`, `LLUVFlameStandoff` |
| FLEX-007 / color camera | `flex_007_colorcam_timeseries.csv` | 158 | `ColorCamTime_sec` | `ColorCamFlameDiameter_mm`, `ColorCamFlameStandoff` |

Every dashboard stream carries source record identity, DOI, record/file version where available, source file, source row, and quality flags. The broader `saffire_cygnus_timeseries.csv` and `saffire_rawdata_timeseries.csv` remain available for research but are not the dashboard's Cygnus view. The RawData time-unit ambiguity is documented in [`data-retrieval.md`](data-retrieval.md).

## Source file inventory

| Field | Meaning |
|---|---|
| `investigation_id` | `SAFFIRE-I` or `FLEX` |
| `psi_record_id` | NASA PSI identifier, such as `PSI-98` |
| `doi` | Persistent identifier on the PSI record |
| `record_version` | PSI record version selected at retrieval time |
| `psi_file_version` | PSI file version selected within that record |
| `file_name` | Original PSI filename |
| `relative_path` | Local path beneath `data/raw/` |
| `source_url` | Official PSI record URL and stable download endpoint |
| `psi_storage_key` | Object key listed by the PSI file catalog |
| `retrieved_date_utc` | UTC retrieval date |
| `psi_catalog_bytes` | File size listed by PSI at retrieval |
| `local_bytes` | Downloaded file size |
| `sha256` | Checksum of the unmodified file |
| `file_type` | CSV, XLSX, PDF, image, video, archive, or other |

## Observation table (when supported by source files)

| Field | Meaning |
|---|---|
| `observation_id` | Stable local ID |
| `investigation_id` | SAFFIRE-I or FLEX |
| `run_id` | Source experiment/test identifier |
| `source_file_id` | Link to source-file inventory |
| `source_row_or_page` | Original row, time range, frame, or page reference |
| `source_stream` | Original workbook sheet or sensor stream |
| `gravity_regime` | Source-reported environment; do not infer |
| `fuel_or_material` | Source-reported fuel/material |
| `geometry` | Source-reported setup or sample geometry |
| `oxygen_fraction_original` | Original value and unit/context |
| `pressure_original` | Original value and unit |
| `flow_speed_original` | Original value and unit |
| `suppressant` | Source-reported suppressant or `unknown` |
| `measurement_name` | Source measurement and original column label |
| `measurement_value_original` | Original numeric or text value |
| `measurement_unit_original` | Original unit; never silently convert |
| `outcome_label` | Source-defined result, if present |
| `uncertainty_original` | Reported uncertainty or `unknown` |
| `notes` | Calibration, quality, interpretation, or comparability notes |
| `quality_flags` | Parsing or source-quality issues; keep source peaks unless identified as errors |

## Time-series handling

The SAFFIRE and FLEX derivatives retain original channel labels and are kept as separate streams. `source_row` points to the original workbook or text-file row. Blank values stay blank. Excel error cells are blanked in the derivative and called out in `quality_flags` and the quality report. The RawData worksheet's `RelativeSeconds` field has unresolved unit ambiguity; do not convert it or use it as a seconds-valued model feature until clarified. Do not join streams by row number or resample without recording the clock mapping, tolerance, and gap policy.

Normalized/display fields can be added later, but must not replace the original field/value/unit trio.
