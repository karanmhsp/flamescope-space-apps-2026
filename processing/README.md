# Telemetry processing

The repository includes format-specific readers for the selected SAFFIRE-I and FLEX source files. They do not modify the original files in `data/raw/`. The dashboard consumes committed curated derivatives and can run without the raw downloads.

Run from the repository root when the original PSI files are present:

```powershell
node processing/build_source_inventory.mjs
node processing/prepare_saffire_telemetry.mjs
node processing/prepare_flex007.mjs
```

The inventory script checks local byte counts against the PSI catalog and records checksums. The study processors preserve source labels, rows, units, and time bases; report missing timestamps and values; and retain measured peaks. SAFFIRE streams and FLEX camera clocks remain separate. See [`../docs/data-retrieval.md`](../docs/data-retrieval.md) for source paths and [`../docs/phase-two-model-architecture.md`](../docs/phase-two-model-architecture.md) for the current analysis method and its limits.
