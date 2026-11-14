# FlameScope — submission brief

## project summary

Fire in microgravity is a spacecraft safety problem, but the evidence is scattered across experiment files and instruments. FlameScope turns NASA’s SAFFIRE-I (PSI-98) and FLEX (PSI-69) records into an interactive, source-linked dashboard. Switch from spacecraft smoke, temperature, pressure, and flow channels to FLEX droplet and camera measurements; every chart keeps its own clock, source units, run context, and quality notes. A transparent rolling median/MAD screen highlights unusual single-channel samples for human review and traces each point to its source row. We preserve measured peaks, document rows excluded for unusable timestamps, and never merge unmatched streams. This prototype does not claim to predict a fire or issue an operational alarm. It shows what these data support today—and what additional runs, calibration, and validation are needed before a fire-safety model can be trusted for Moon or Mars missions.

## One-line description

**FlameScope makes NASA’s microgravity combustion evidence explorable, traceable, and honest about uncertainty.**

## What the prototype does

- **SAFFIRE-I / PSI-98, record version 4:** plots 2,540 timestamped Cygnus observations across detector, temperature, pressure, and fan channels, plus the separate 105-row SAFFIRE sensor stream.
- **FLEX / PSI-69, record version 5:** plots the 141-row droplet stream, 177-row LLUV stream, and 158-row color-camera stream from FLEX-007 / 20CAL13.
- Shows experiment context, channel units as reported, time basis, cadence, valid sample counts, data-quality notes, NASA PSI record links, and source-row provenance.
- Screens one selected channel at a time using the preceding at most 15 valid samples, a minimum baseline size of 8, and a rolling median/MAD robust z-score threshold of 3.5. The three largest candidate scores are highlighted. Windows with zero MAD are not scored.
- Keeps the SAFFIRE streams and FLEX camera clocks independent. No cross-sensor clock alignment, smoothing, calibration, or cross-investigation comparison is asserted.

The point screen is a transparent exploratory heuristic. It is not an AI-trained classifier, validated predictor, calibrated probability, or spacecraft fire alarm. A flagged point is not proof of combustion; a lack of flags is not evidence of safety. The current evidence is one SAFFIRE-I telemetry workbook and one FLEX test. It does not support generalization to other fuels, vehicles, gravity regimes, or missions.

## NASA data and attribution

FlameScope uses the datasets listed in the challenge’s NASA PSI resource:

- [SAFFIRE-I, NASA PSI-98](https://psi.nasa.gov/physci/repo/data/investigations/PSI-98), DOI [10.60555/0t15-1z43](https://doi.org/10.60555/0t15-1z43), record version 4.
- [FLEX, NASA PSI-69](https://psi.nasa.gov/physci/repo/data/investigations/PSI-69), DOI [10.60555/mbq8-0451](https://doi.org/10.60555/mbq8-0451), record version 5; the displayed FLEX run is FLEX-007 / 20CAL13.
- [NASA PSI Data Repository: Combustion Science](https://psi.nasa.gov/physci/repo/search?q=combustion).
- [NASA Flame in Freefall challenge statement](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/).
- [NASA Space Apps 2026 participation and submission overview](https://www.spaceappschallenge.org/2026/) and [2026 Participant Terms and Conditions](https://www.spaceappschallenge.org/legal/).
- [NASA PSI database guide](https://science.nasa.gov/wp-content/uploads/2024/11/psi-database-guide.pdf) and [NASA Researcher’s Guide to Physical Sciences Informatics](https://www.nasa.gov/science-research/for-researchers/researchers-guide-to-physical-sciences-informatics-system/).

Selected PSI records identify their source data as CC0-1.0; the source manifest and data-retrieval notes record selected versions, original filenames, PSI object keys, checksums, and retrieval dates. Raw originals are excluded from Git. The dashboard runs from the committed curated derivatives. See [`data-retrieval.md`](data-retrieval.md) and [`../data/source_manifest.json`](../data/source_manifest.json).

## Judging story

The 2026 challenge asks for an interactive dashboard that summarizes, ranks, and interprets microgravity combustion findings for human spaceflight. FlameScope makes the evidence easier to inspect while keeping the limits visible:

- **Impact:** helps researchers and future mission designers inspect fire-relevant measurements that inform spacecraft and exploration safety questions.
- **Creativity:** places distinct sensor streams, run context, quality, and source provenance together in one interface without pretending the experiments are directly interchangeable.
- **Validity:** preserves units, clocks, source rows, missingness, and peaks; makes the statistical screen reproducible; states where calibration, labels, and additional runs are missing.
- **Relevance:** directly turns the challenge’s NASA PSI combustion records into selectable telemetry views and candidate signal departures.
- **Presentation:** tells users which record and channel they are viewing, what the screen did, and what conclusions are not supported.

These five criteria are listed on 2026 Space Apps local-event pages such as the [Ajmer event page](https://www.spaceappschallenge.org/2026/local-events/ajmer/). Check the official team/project page and the Universal Event instructions for the requirements that apply to this entry.

## Suggested 30-second demo narration

“Spacecraft fire evidence is spread across separate experiments and sensors. In FlameScope, I can open SAFFIRE-I and inspect smoke-detector, thermal, pressure, and flow channels with their original time bases and data-quality notes. FLEX adds droplet and two camera streams from a separate test. The rolling median/MAD screen points to unusual samples and links them to source rows; it does not call them fires or declare a system safe. That traceability shows what NASA’s data support now—and exactly what more calibration, labeled runs, and validation a future safety model would need.”

## Reproduce locally

From the repository root:

```powershell
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

The development server prints the local preview URL. To build production assets, run `pnpm build` from `frontend/`. Rebuilding curated data requires the original PSI downloads in the documented `data/raw/` paths; see [`../processing/README.md`](../processing/README.md).

## Source, software, and AI-use notes

- The root [`LICENSE`](../LICENSE) applies the MIT License to original FlameScope code. NASA PSI data are attributed separately under the licenses stated by their records. Third-party packages and fonts remain under their own licenses.
- The frontend uses React, Vite, TypeScript, Lucide icons, and DM Sans / Space Grotesk / DM Mono from Google Fonts. Their official project pages are [React](https://react.dev/), [Vite](https://vite.dev/), [TypeScript](https://www.typescriptlang.org/), [Lucide](https://lucide.dev/), and [Google Fonts](https://fonts.google.com/).
- **Suggested AI-assistance disclosure:** “OpenAI ChatGPT/Codex assisted with implementation and documentation drafting. The project author reviewed the data handling, calculations, and claims.” Adjust this statement to match the work you personally reviewed and the fields shown in the official submission form.
- FlameScope is an independent participant project. NASA does not endorse it.

## Submission readiness

### Public materials prepared

- The GitHub repository is public: <https://github.com/karanmhsp/flamescope-space-apps-2026>.
- The seven-slide project demo is in [`../submission/flamescope-demo.pptx`](../submission/flamescope-demo.pptx). The same folder contains paste-ready project title, summary, detailed description, NASA references, and AI-use disclosure.
- Source code, lockfile, processing instructions, data provenance, model limits, and the MIT license are included. Raw NASA downloads remain uncommitted.
- The production build passed with the committed curated data. The dashboard is not hosted as a public live site; the project link points to the public code repository and the demo link points to the slide deck.

### Official project page

The team page is `Karan.mhsp`, Universal Event, for **Flame in Freefall**. The official NASA Space Apps project page still needs to be completed from the team’s Project tab. Use [`../submission/entry-copy.md`](../submission/entry-copy.md) for the prepared fields, verify the account’s team membership and solo-team setting, and check the final submission status after saving. The [2026 overview](https://www.spaceappschallenge.org/2026/) lists the project deadline as November 15 at 11:59 p.m. local time; follow the deadline displayed for the registered Universal Event team lead.
