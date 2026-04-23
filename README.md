# EDI 834 Validator

A browser-only QA tool for parsing, validating, and inspecting ASC X12 834 Benefit Enrollment and Maintenance files.

**Live tool:** https://mpulsemobile.github.io/edi-834-validator/

---

## What it does

- Upload any EDI 834 file or load one of 12 built-in sample scenarios
- Parses X12 segments into structured, human-readable output
- Displays member demographics, coverage details, financial data, and enrollment dates
- Surfaces SEP reason, ICHRA/QSEHRA, AMRC, and other FFE-specific fields
- Click the ⓘ icon on any field to see the exact source X12 segment
- Export the full member table to CSV (57 columns, one row per coverage)

**All parsing happens locally in your browser — no data is ever transmitted or stored.**

---

## Sample Scenarios

| # | Scenario |
|---|----------|
| 01 | SEP New Enrollment: Subscriber Only — Medical |
| 02 | SEP New Enrollment: Subscriber Only — Vision |
| 03 | SEP New Enrollment: Subscriber Only — Dental |
| 04 | SEP Termination: Subscriber Only — Medical |
| 05 | SEP Termination: Subscriber Only — Dental |
| 06 | SEP Termination: Subscriber Only — Vision |
| 07 | Add Spouse: Subscriber Cancellation — Medical |
| 08 | Add Spouse: Subscriber Cancellation — Dental |
| 09 | Add Spouse: Subscriber Cancellation — Vision |
| 10 | Add Spouse: New Subscriber + Spouse — Medical |
| 11 | Add Spouse: New Subscriber + Spouse — Dental |
| 12 | Add Spouse: New Subscriber + Spouse — Vision |

---

## Code Table Alignment

Code tables are aligned to:
- **CMS FFE X12 834 Companion Guide v7.2** (Aug 2024)
- **Covered California Companion Guide v24.09.06**

Includes: relationship codes, race/ethnicity (CDC), language, maintenance type/reason, marital status, SEP reason, coverage level, AMRC, origin codes, and ICHRA/QSEHRA fields.

---

## Tech Stack

- React 19 + Vite (frontend-only SPA)
- No backend, no database, no authentication
- Deployed via GitHub Actions → GitHub Pages

## Run Locally

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

## Deploy

Pushes to `main` automatically trigger a GitHub Actions build and deploy to GitHub Pages.

---

## PHI Notice

Do not upload files containing real member PHI/PII to the public-facing hosted version of this tool. Use locally if working with identifiable data.
