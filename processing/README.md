# Processing

The initial ingestion layer catalogs NASA PSI source metadata and prepares a source inventory. It does not download records automatically and does not transform experiment measurements yet.

Run from the repository root:

```powershell
python processing/build_source_catalog.py
```

The output is `data/curated/source_catalog.csv`. The next processing step, after files are manually retrieved and inspected, is to add format-specific readers with unit/provenance preservation.
