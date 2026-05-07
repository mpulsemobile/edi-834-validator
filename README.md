# EDI 834 Validator

A browser-only QA tool for parsing, validating, generating, and inspecting ASC X12 834 Benefit Enrollment and Maintenance files.

**Live tool:** https://mpulsemobile.github.io/edi-834-validator/  
**User Guide:** [docs/USER_GUIDE.md](docs/USER_GUIDE.md)  
**Development Notes:** [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## What it does

- **Parse** — Upload any 834 file or load one of 17 built-in sample scenarios
- **Summarise** — One plain-English sentence describes what the file is doing
- **Inspect** — Member demographics, coverage, financial data, enrollment dates, SEP/ICHRA/QSEHRA fields
- **Validate** — Surfaces missing required fields and unrecognised segments
- **Generate** — Build new 834 files from a simple form (no EDI knowledge required)
- **Export** — Full member table to CSV (57 columns, one row per coverage)
- **Source view** — Click ⓘ on any field to see the exact X12 segment it came from

**All processing happens locally in your browser — no data is ever transmitted or stored.**

---

## Quick Start

```bash
git clone https://github.com/mpulsemobile/edi-834-validator.git
cd edi-834-validator/frontend
npm install
npm run dev
# → http://localhost:5173/
```

Alternatively, use the hosted version directly at https://mpulsemobile.github.io/edi-834-validator/ — no setup needed.

---

## Sample Scenarios

17 pre-built `.edi` files cover the most common 834 patterns. Load any of them from the **"Load Sample Scenario..."** dropdown.

| # | Scenario | Coverage |
|---|----------|----------|
| 01 | SEP New Enrollment: Subscriber Only | Medical |
| 02 | SEP New Enrollment: Subscriber Only | Vision |
| 03 | SEP New Enrollment: Subscriber Only | Dental |
| 04 | SEP Termination: Subscriber Only | Medical |
| 05 | SEP Termination: Subscriber Only | Dental |
| 06 | SEP Termination: Subscriber Only | Vision |
| 07 | Add Spouse: Subscriber Cancellation | Medical |
| 08 | Add Spouse: Subscriber Cancellation | Dental |
| 09 | Add Spouse: Subscriber Cancellation | Vision |
| 10 | Add Spouse: New Subscriber + Spouse | Medical |
| 11 | Add Spouse: New Subscriber + Spouse | Dental |
| 12 | Add Spouse: New Subscriber + Spouse | Vision |
| 13 | Add Dependent to Subscriber + Spouse | Mixed |
| 14 | New Enrollment: Subscriber + Spouse + Dependent | Mixed |
| 15A | New Enrollment: Subscriber + Spouse + Dependent | Dental |
| 15B | New Enrollment: Subscriber + Spouse + Dependent | Medical |
| 15C | New Enrollment: Subscriber + Spouse + Dependent | Vision |

### Adding a new sample scenario
1. Add your `.edi` file to `frontend/public/sample-data/`
2. Add an entry to the `SCENARIOS` array in `frontend/src/pages/Dashboard.jsx`:
   ```js
   { label: '16 — Your Scenario Description', value: '16-your-filename.edi' }
   ```

---

## Generate 834

Click **✦ Generate 834** in the app header. The form lets you:
- Choose members (Subscriber / Spouse / Dependent)
- Choose coverage types (HLT / DEN / VIS) — one file generated per coverage
- Set Benefit Start Date and optional Eligibility End Date
- Preview the plain-English summary before generating
- Download individual files or all at once
- Load directly into the validator

See [docs/USER_GUIDE.md](docs/USER_GUIDE.md) for full usage instructions.

---

## Code Table Alignment

Code tables in `formatter.js` are aligned to:
- **CMS FFE X12 834 Companion Guide v7.2** (August 2024)
- **Covered California Companion Guide v24.09.06**

Includes: relationship codes, race/ethnicity (CDC HL7 v2), language, maintenance type/reason, marital status, SEP reason, coverage level, AMRC, origin codes, ICHRA/QSEHRA fields.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 |
| Build | Vite 8 |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |
| Backend | None |

---

## Build & Deploy

```bash
# Development
cd frontend && npm run dev

# Production build
cd frontend && npm run build   # output in frontend/dist/

# Deploy
git push origin main           # GitHub Actions auto-deploys to GitHub Pages
```

---

## Documentation

| Document | Audience | Description |
|----------|----------|-------------|
| [README.md](README.md) | Team | This file — setup, structure, contribution guide |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | All users | How to use every feature of the tool |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Engineers | Architecture, logic details, how to extend |

---

## PHI Notice

Do not upload files containing real member PHI/PII to the public-facing hosted version of this tool. Run locally if working with identifiable data.
