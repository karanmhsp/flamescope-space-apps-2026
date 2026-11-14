# FlameScope — NASA Space Apps 2026 submission copy

Use these fields on the Karan.mhsp team’s **Project** tab. The current build is an evidence-first dashboard prototype with an exploratory statistical screen; it is not a trained predictor or operational fire alarm.

## Project title

**FlameScope: Evidence-First Fire Safety Insights from Microgravity Combustion Data**

## High-level project summary

FlameScope turns selected NASA microgravity combustion records into an interactive, source-linked telemetry dashboard. It presents SAFFIRE-I (PSI-98) and FLEX (PSI-69) as separate experiments, keeping their original units, time bases, run conditions, data-quality notes, and source-row references visible. A transparent rolling median/MAD screen ranks candidate single-channel departures for human review. It does not label a point as a fire or claim to predict emergencies. With one SAFFIRE-I telemetry workbook and one FLEX run, the current evidence is too limited for a general predictive model. FlameScope makes the evidence inspectable now and shows what calibration, labeled runs, and held-out-run validation are needed before a future fire-safety model could be trusted.

## Detailed project description

FlameScope is a React and TypeScript dashboard with Node.js data-preparation scripts. It responds to the Flame in Freefall challenge by making NASA combustion telemetry easier to explore while preserving the experiment context that determines what each measurement can support.

The dashboard covers two NASA Physical Sciences Informatics investigations. SAFFIRE-I (PSI-98, record version 4; DOI 10.60555/0t15-1z43) contributes 2,540 timestamped Cygnus rows and a separate 105-row SAFFIRE sensor stream. FLEX (PSI-69, record version 5; DOI 10.60555/mbq8-0451) contributes FLEX-007 / test 20CAL13 droplet, LLUV, and color-camera streams with 141, 177, and 158 timestamped rows. The dashboard does not join these streams by row number or assume that their clocks, sensors, or experimental conditions are interchangeable.

Processing scripts preserve source order, channel names, reported units, source timestamps, source rows, and missing values. They produce per-stream quality reports and a manifest that records PSI record/file versions, retrieval endpoints, original filenames, byte counts, and SHA-256 checksums. Rows without usable timestamps are counted and omitted from curated time-series views. Peaks are retained; the current pipeline does not smooth, resample, calibrate, or remove statistical outliers. Raw NASA downloads stay out of the public repository; committed derivatives and provenance remain available for review.

For a selected channel, FlameScope compares each reading with up to 15 preceding valid samples. It requires at least eight baseline values, calculates a robust median/MAD score, and highlights scores whose absolute value is at least 3.5. Windows with zero MAD are skipped. The dashboard ranks candidate departures and shows the channel, value, time, source row, run context, and quality notes so a person can inspect the underlying evidence. A candidate may reflect combustion physics, instrument response, or a data issue. The screen is not a trained classifier, calibrated probability, validated predictor, or certified spacecraft safety system; a flag is not proof of fire and no flag is not evidence of safety.

The practical value is traceability: a researcher can move from a NASA record to an inspectable signal without losing units, timing, or data limitations. The next research stage is to add more independent runs, resolve calibration and clock questions, establish source-reviewed event labels, and evaluate against simple baselines with whole runs held out. My longer-term interest is to connect AI and physics to quantum computing; only after a reliable classical baseline and adequate run-level data exist would I compare a small quantum-kernel experiment with matched classical methods. No quantum advantage or predictive performance is claimed in this submission.

## Link to final project

https://github.com/karanmhsp/flamescope-space-apps-2026

## Link to project demo

https://github.com/karanmhsp/flamescope-space-apps-2026/blob/main/submission/flamescope-demo.pptx

The deck has seven slides, including a plotted FLEX-007 droplet series and the exploratory flag rule. Chart display values are rounded to six decimal places; the underlying curated files preserve the source values.

## NASA data and references

- Flame in Freefall challenge: https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/
- NASA PSI Combustion Science records: https://psi.nasa.gov/physci/repo/search?q=combustion
- SAFFIRE-I, PSI-98, DOI 10.60555/0t15-1z43: https://psi.nasa.gov/physci/repo/data/investigations/PSI-98
- FLEX, PSI-69, DOI 10.60555/mbq8-0451: https://psi.nasa.gov/physci/repo/data/investigations/PSI-69
- NASA PSI database guide: https://science.nasa.gov/wp-content/uploads/2024/11/psi-database-guide.pdf
- NASA Researcher’s Guide to Physical Sciences Informatics: https://www.nasa.gov/science-research/for-researchers/researchers-guide-to-physical-sciences-informatics-system/
- Source manifest and selected-file provenance: https://github.com/karanmhsp/flamescope-space-apps-2026/blob/main/data/source_manifest.json
- Processing and interpretation notes: https://github.com/karanmhsp/flamescope-space-apps-2026/blob/main/docs/data-retrieval.md

The selected PSI records identify their data as CC0-1.0. Original FlameScope code is MIT licensed in the repository. Third-party packages and fonts remain subject to their own licenses. FlameScope is an independent participant project; NASA does not endorse it.

## AI tools used

ChatGPT and Codex assisted with project planning, source analysis, data-processing code, dashboard implementation, documentation, and the seven-slide demo. The current signal flags are deterministic rolling median/MAD calculations; no generative or trained AI model makes fire-safety decisions.

## Team profile description (if the site asks for it)

I’m a solo participant building FlameScope, an evidence-first dashboard for NASA microgravity combustion data. I’m interested in AI, physics, and space safety. The prototype keeps SAFFIRE-I and FLEX telemetry traceable to their source records and highlights candidate signal departures for human review. My next step is stronger multi-run, physics-informed validation before making predictive claims.
