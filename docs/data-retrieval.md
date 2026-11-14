# NASA PSI retrieval checklist: SAFFIRE-I and FLEX

“Sapphire and Flits” is interpreted as **SAFFIRE** and **FLEX**, the NASA combustion investigations selected for FlameScope. Confirm the intended names if that was not what you meant.

## Official PSI records

| Investigation | PSI record | DOI | Why it is in the first slice | Status |
|---|---|---|---|---|
| Spacecraft Fire Safety Experiment-I (SAFFIRE-I) | [PSI-98](https://psi.nasa.gov/physci/repo/data/investigations/PSI-98) | [10.60555/0t15-1z43](https://doi.org/10.60555/0t15-1z43) | Large solid-fabric fire in a duct with controlled airflow; NASA describes video, temperature, radiation, gas, pressure, and flow measurements. | Record reviewed; files not downloaded |
| Flame Extinguishment Experiment (FLEX) | [PSI-69](https://psi.nasa.gov/physci/repo/data/investigations/PSI-69) | [10.60555/mbq8-0451](https://doi.org/10.60555/mbq8-0451) | Droplet combustion/extinction tests with oxygen, pressure, and suppressant conditions. | Record reviewed; files not downloaded |

The records identify SAFFIRE-I as PSI version 4 (record metadata updated June 3, 2025) and FLEX as PSI version 5 (metadata updated June 6, 2025). Recheck the selected version before each retrieval; PSI versions can change.

## Retrieval sequence

1. **Open the official record.** Use the PSI-98 and PSI-69 links above. Save the record URL, DOI, selected version, license, investigation title, research area, and the date reviewed in `data/source_manifest.json`.
2. **Read the investigation description and data organization documents.** Record what each experiment measured and how the files are organized before selecting downloads. SAFFIRE-I's PSI description reports a 20 cm/s duct airflow and measurements including video, thermocouples, radiometers, gas sensors, pressure, and anemometers. FLEX's PSI description describes droplet tests across ambient pressure and oxygen conditions, with gaseous suppressants including CO2, helium, and SF6.
3. **Open the files/data section and inspect its folder tree.** PSI organizes data and supporting documents by file type; raw and analyzed data may be further separated by reduced or Earth gravity. The exact folders depend on the investigation. Do not assume both studies have identical files or fields.
4. **Download the smallest useful first set.** Select the data organization/readme and experiment documentation first. Then select available analyzed/reduced tables and the smallest accompanying metadata needed to interpret them. Add raw time series, images, or video only after identifying their formats and size. Use PSI's download control for selected files or folders.
5. **Handle large downloads through PSI's documented process.** NASA's PSI database guide says downloads larger than 1 GB are prepared as ZIP parts and delivered through links sent by email. Request only files needed for the MVP; do not pull entire video collections during the first pass.
6. **Keep raw files immutable.** Save original filenames beneath `data/raw/SAFFIRE-I/` or `data/raw/FLEX/`. Do not rename, edit, or overwrite the NASA originals. Keep raw downloads out of Git; commit only the source manifest, retrieval notes, and permitted small curated derivatives.
7. **Log provenance for every file.** Add a row to the inventory with investigation, PSI record, DOI, record version, file name/path, file type, source URL, retrieval date (UTC), byte size, SHA-256, units/variables described, and any license or attribution notes. Generate the SHA-256 locally after download.
8. **Inspect before normalizing.** Identify file encoding, delimiters, headers, units, timestamps, gravity regime, run/experiment IDs, and missing-value conventions. Keep the original column names in a mapping table. Never infer unrecorded values.
9. **Create a curated observation table.** One row should represent one clearly defined measurement or experimental result. Preserve source-file and row/page references so each chart point can be traced to the PSI source.
10. **Compare only compatible conditions.** SAFFIRE-I large-fabric flame behavior and FLEX droplet extinction are different experimental setups. Display them as separate evidence tracks unless a question, variable, and measurement are genuinely comparable.

## Initial questions for the file inventory

### SAFFIRE-I / PSI-98

- Which files contain the flame video frames or derived flame-spread measurements?
- Which files contain thermocouple, radiometer, oxygen/carbon-dioxide, pressure, or airflow measurements?
- What do timestamps, sensor locations, and frame references mean in the data organization document?
- Confirm the duct airflow condition and material details in the specific file documentation before using them as filters.

### FLEX / PSI-69

- Which files contain droplet size, burning rate, extinction diameter/time, oxygen concentration, pressure, and suppressant conditions?
- Which measurements are in microgravity flight data versus ground-based tests?
- How are burn-to-completion, finite-size extinction, no-ignition, and radiative extinction represented?
- Which calibration files are required to interpret science measurements?

## First ingestion output

The first extraction should produce a source-file inventory and a small, traceable metadata table—not a combined predictive model. The schema sketch is in [`data-schema.md`](data-schema.md). If the PSI files do not provide enough comparable structured observations in the available time, FlameScope should ship a source-linked catalog and descriptive evidence view, with the limitation stated plainly.

## NASA references

- [NASA PSI repository](https://psi.nasa.gov/physci/repo)
- [SAFFIRE-I PSI-98 record](https://psi.nasa.gov/physci/repo/data/investigations/PSI-98)
- [FLEX PSI-69 record](https://psi.nasa.gov/physci/repo/data/investigations/PSI-69)
- [NASA PSI database guide: data files and downloads](https://science.nasa.gov/wp-content/uploads/2024/11/psi-database-guide.pdf)
- [NASA Researcher's Guide to PSI](https://www.nasa.gov/science-research/for-researchers/researchers-guide-to-physical-sciences-informatics-system/)
- [NASA PSI persistent identifier and citation guidance](https://psi.nasa.gov/physci/repo)
