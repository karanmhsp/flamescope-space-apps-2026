# Initial data schema

The first version keeps original values and separates experiment context from observations. Fields may remain unknown until the source file establishes them.

## Source file inventory

| Field | Meaning |
|---|---|
| `investigation_id` | `SAFFIRE-I` or `FLEX` |
| `psi_record_id` | NASA PSI identifier, such as `PSI-98` |
| `doi` | Persistent identifier on the PSI record |
| `record_version` | Version selected at retrieval time |
| `file_name` | Original PSI filename |
| `relative_path` | Local path beneath `data/raw/` |
| `source_url` | Official record or file URL |
| `retrieved_utc` | Retrieval date/time in UTC |
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

Normalized/display fields can be added later, but must not replace the original field/value/unit trio.
