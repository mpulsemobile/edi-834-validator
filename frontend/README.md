# EDI 834 Validator — Frontend

> See the [full project README](../README.md) for the complete overview.  
> See [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) for architecture and logic details.  
> See [docs/USER_GUIDE.md](../docs/USER_GUIDE.md) for end-user instructions.

---

## Run Locally

### Prerequisites
- Node.js 18+
- npm 9+

```bash
# From the repo root:
cd frontend
npm install
npm run dev
# → http://localhost:5173/
```

### Build for production

```bash
npm run build
# Output in frontend/dist/
```

---

## Project Structure

```
frontend/
  src/
    pages/
      Dashboard.jsx              # Main page — all UI sections
    components/
      Generate834Modal.jsx       # EDI generation form (active)
      MemberTable.jsx            # Member data table
      ValidationSummary.jsx      # Warnings display
      JsonViewer.jsx             # Structured JSON viewer
      UploadPanel.jsx            # File upload input
      GeneratePanel.jsx          # Legacy — unused
      GenerateAddSpousePanel.jsx # Legacy — unused
    utils/
      parse834.js                # X12 834 parser
      formatter.js               # Code-to-label lookups (aligned to CMS FFE v7.2 + CovCA)
      csvExport.js               # CSV export builder
      generate834.js             # Legacy generator — unused
  public/
    sample-data/                 # 17 built-in .edi scenario files (01–15C)
```

---

## Built-in Scenarios

| # | Description | Coverage |
|---|-------------|----------|
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

To add a new scenario: drop the `.edi` file into `public/sample-data/` and add an entry to the `SCENARIOS` array in `src/pages/Dashboard.jsx`.

---

## PHI / Data Privacy

> **This tool is entirely browser-based. No data is transmitted, stored, or logged.**

Do **not** commit real member EDI files to source control. `public/sample-data/` must contain only synthetic or de-identified test data.
