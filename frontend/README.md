# EDI 834 Validator

A browser-only QA tool for parsing, validating, and inspecting ASC X12 834 Benefit Enrollment and Maintenance files.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Run locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for deployment

```bash
npm run build
```

The `dist/` folder is a self-contained static site — deploy to any static host (Netlify, Vercel, S3, internal web server).

---

## How to Load a File

**Option 1 — Upload a file**  
Click "Upload EDI File" and select any `.edi` file from your machine. The file is parsed entirely in the browser and never sent to a server.

**Option 2 — Load a scenario**  
Use the "Load Scenario..." dropdown to load one of the built-in sample EDI files for testing.

**Option 3 — Paste raw EDI**  
The parser also accepts raw X12 text pasted into the upload area (coming soon).

---

## Built-in Scenarios

All scenarios are real EDI files in `public/sample-data/`. Two member personas are used:

- **SubscriberGreen** (`INJ000007882`) — SEP Off-Exchange enrollments and terminations (subscriber only)
- **SubscriberBlue** (`INJ000007883`) — Add Spouse life event (cancellations + new two-person enrollments)

| # | File | Description |
|---|---|---|
| 01 | `01-sep-off-exchange-subscriber-only-medical.edi` | SEP new enrollment — Medical (HLT, IND) |
| 02 | `02-sep-off-exchange-subscriber-only-vision.edi` | SEP new enrollment — Vision (VIS, IND) |
| 03 | `03-sep-off-exchange-subscriber-only-dental.edi` | SEP new enrollment — Dental (DEN, IND) |
| 04 | `04-sep-off-exchange-subscriber-only-medical-terminate.edi` | SEP termination — Medical (024*08) |
| 05 | `05-sep-off-exchange-subscriber-only-dental-terminate.edi` | SEP termination — Dental (024*08) |
| 06 | `06-sep-off-exchange-subscriber-only-vision-terminate.edi` | SEP termination — Vision (024*08) |
| 07 | `07-add-spouse-subscriber-cancel-medical.edi` | Add Spouse — subscriber cancellation, Medical (024*32) |
| 08 | `08-add-spouse-subscriber-cancel-dental.edi` | Add Spouse — subscriber cancellation, Dental (024*32) |
| 09 | `09-add-spouse-subscriber-cancel-vision.edi` | Add Spouse — subscriber cancellation, Vision (024*32) |
| 10 | `10-add-spouse-subscriber-and-spouse-medical.edi` | Add Spouse — new enrollment, Subscriber + Spouse, Medical (021*32, TWO) |
| 11 | `11-add-spouse-subscriber-and-spouse-dental.edi` | Add Spouse — new enrollment, Subscriber + Spouse, Dental (021*32, TWO) |
| 12 | `12-add-spouse-subscriber-and-spouse-vision.edi` | Add Spouse — new enrollment, Subscriber + Spouse, Vision (021*32, TWO) |

---

## Companion Guide Alignment

All code tables (maintenance type/reason, relationship, race/ethnicity, language, marital status, SEP reason, AMRC, origin codes) are aligned to:

- **CMS FFE X12 834 Companion Guide v7.2** — August 2024
- **Covered California EDI 834 Companion Guide v24.09.06**

Where the two guides conflict, CMS FFE v7.2 takes precedence (e.g. marital status code `R`, race code `2500-7`).

---

## PHI / Data Privacy

> **This tool is entirely browser-based. No data is transmitted, stored, or logged.**  
> Files are parsed in memory using JavaScript and never leave your device.

Do **not** commit real member EDI files to source control. The `public/sample-data/` directory must only contain synthetic or de-identified test data.

---

## Project Structure

```
frontend/
  src/
    pages/
      Dashboard.jsx        # Main UI component
    utils/
      parse834.js          # X12 834 parser (state machine)
      formatter.js         # Code-to-label lookup functions
      csvExport.js         # CSV export logic
    components/            # Stub components (future use)
  public/
    sample-data/           # Built-in .edi scenario files
```
