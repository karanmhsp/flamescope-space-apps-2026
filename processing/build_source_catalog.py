"""Build a compact CSV catalog from the tracked NASA PSI source manifest."""

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "source_manifest.json"
OUTPUT_PATH = ROOT / "data" / "curated" / "source_catalog.csv"


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    fields = [
        "investigation_id",
        "title",
        "psi_record_id",
        "record_version_reviewed",
        "record_updated",
        "doi",
        "record_url",
        "license",
        "research_area",
        "subresearch_area",
        "focus",
        "download_status",
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        for source in manifest["sources"]:
            writer.writerow({field: source.get(field, "") for field in fields})

    print(f"Wrote {len(manifest['sources'])} source records to {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
