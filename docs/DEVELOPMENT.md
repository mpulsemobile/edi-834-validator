# EDI 834 Validator — Development Notes

> Reference for engineers working on this codebase.  
> Covers what was built, how it works, key logic details, and how to extend it.

---

## What Was Built

This project started as a basic EDI 834 file viewer and grew into a full QA and generation tool through an iterative AI-assisted development session. Below is a chronological list of capabilities added:

### Feature History

1. **Fix dev server** — `npm run dev` was failing because it was being run from the root directory instead of `frontend/`. Correct command: `cd frontend && npm run dev`.

2. **Summary of EDI section** — Added `generateEdiSummary()` to `Dashboard.jsx`. Reads parsed member data and produces a single plain-English sentence describing what the 834 file is doing, using 3 rules (see [Summary Logic](#summary-logic) below).

3. **Dashboard layout reorganisation** — Moved Unrecognised Segments and Structured JSON to the bottom of the page. Summary section placed above Transaction Details.

4. **Sample scenario expansion** — Added scenarios 13, 14, 15A, 15B, 15C to the `SCENARIOS` dropdown array. Corresponding `.edi` files added to `frontend/public/sample-data/`.

5. **Summary text polish** — Removed icon, removed double quotes, removed colons, added "This 834" prefix, single line with ellipsis truncation, centered alignment.

6. **Generate 834 Modal** — Replaced the static `GeneratePanel` and `GenerateAddSpousePanel` dropdowns with a new `Generate834Modal.jsx` component. Form captures: Transaction type, Members on policy, Coverage types, Benefit Start Date, Eligibility End Date. Live preview updates as fields change.

7. **EDI generation bug fixes** — Fixed `covIndex is not defined` (wrong function signature), `prem is not defined` (missing PREMIUMS block), incorrectly emitted `DTP*349` for eligibility end date (removed).

8. **Multi-coverage file generation** — Each selected coverage type (HLT/DEN/VIS) generates a separate 834 file, matching production exchange submission patterns. Unique `REF*1L` enrollment group number per coverage via `covIndex` offset.

9. **Random family names per session** — Added name pools (`LAST_NAMES`, `MALE_FIRST`, `FEMALE_FIRST`, `CHILD_FIRST_M/F`) and a `randomFamily()` function. Called once when the modal opens; consistent across all files in the same generation session.

10. **Unique IDs per session** — Subscriber ID (9-digit random), Member IDs (sub ID +0/+1/+2), Enrollment ID (`ENR` + 9-digit random), Enrollment Group Base (5-digit random 20000–39999), random address, phone, email, and DOBs per session.

---

## Architecture

### Tech Stack
- **React 19** — UI components
- **Vite 8** — Build tool and dev server
- **No backend** — 100% static SPA; all parsing and generation runs in the browser
- **GitHub Pages** — Hosting; deployed via GitHub Actions
- **Base path** — Configured dynamically in `vite.config.js` using the `GITHUB_REPOSITORY` env var

### Repository Structure

```
edi-834-validator/
├── README.md                        # Team getting-started guide
├── docs/
│   ├── USER_GUIDE.md                # External user documentation
│   └── DEVELOPMENT.md               # This file
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── public/
    │   └── sample-data/             # 17 .edi scenario files (01–15C)
    └── src/
        ├── main.jsx                 # React entry point
        ├── App.jsx                  # Router + layout
        ├── pages/
        │   └── Dashboard.jsx        # Main page; all UI sections
        ├── components/
        │   ├── Generate834Modal.jsx  # EDI generation form (active)
        │   ├── GeneratePanel.jsx     # Legacy — no longer used
        │   ├── GenerateAddSpousePanel.jsx  # Legacy — no longer used
        │   ├── MemberTable.jsx       # Member data table
        │   ├── ValidationSummary.jsx # Warnings display
        │   ├── JsonViewer.jsx        # Structured JSON tree
        │   └── UploadPanel.jsx       # File upload input
        └── utils/
            ├── parse834.js           # X12 834 parser
            ├── formatter.js          # Code table lookups
            ├── csvExport.js          # CSV export builder
            └── generate834.js        # Legacy generator — no longer used
```

### Data Flow

```
Raw .edi text
     │
     ▼
parse834.js  →  parsed object  →  React state (Dashboard.jsx)
                                        │
                     ┌──────────────────┼──────────────────┐
                     ▼                  ▼                   ▼
            generateEdiSummary()   MemberTable.jsx   ValidationSummary.jsx
            (Summary section)      (Member rows)     (Warnings)
```

---

## Key Logic

### Summary Logic

`generateEdiSummary(parsed)` in `Dashboard.jsx` applies three rules:

**Rule 1 — Change only (all members have `001`)**
> "This 834 is changing the Plan ID of the [Role], with Benefit Begin Date of mm/dd/yyyy for coverage HLT."

**Rule 2 — Mixed (Change + Addition and/or Cancellation)**
> Focuses on the non-Change action. If the non-change members include additions: "This 834 is adding [Names], with Benefit Begin Date of mm/dd/yyyy..."  
> If cancellations/terminations: "This 834 is terminating [Name] who is a [Relationship] to this policy, with Benefit End Date of..."

**Rule 3 — Addition only (all members have `021`)**
> "This 834 is adding [Names], with Benefit Begin Date of mm/dd/yyyy for coverage HLT, DEN."

The function reads `parsed.members[]` and checks `member.maintenanceTypeCode`. Coverage list is deduplicated from all members.

---

### EDI Generation Logic

`buildAddCoverageEdi(members, coverageType, startDate, eligibilityEnd, covIndex, family)` in `Generate834Modal.jsx`:

**Inputs**
| Param | Type | Description |
|-------|------|-------------|
| `members` | `string[]` | `['subscriber', 'spouse', 'dependent']` — which members to include |
| `coverageType` | `string` | `'HLT'` / `'DEN'` / `'VIS'` |
| `startDate` | `string` | ISO date `YYYY-MM-DD` |
| `eligibilityEnd` | `string` | ISO date (optional) |
| `covIndex` | `number` | 0-based index of this coverage in the selected list |
| `family` | `object` | Output of `randomFamily()` |

**Coverage-specific values**

| Coverage | Plan ID suffix | Sub premium | + Spouse | + Dependent |
|----------|---------------|-------------|----------|-------------|
| HLT | `...200` | $412.50 | $389.25 | $249.00 |
| DEN | `...201` | $23.61 | $10.35 | $9.72 |
| VIS | `...202` | $13.21 | $13.21 | $13.21 |

**Control numbers**
- ST `02` control number = `0000000001` + `covIndex` offset
- BGN `03` (transaction set reference) = base reference + `covIndex`
- `REF*1L` (enrollment group) = `family.enrollmentGroupBase` + `covIndex`

**Member IDs**
- Subscriber: `family.subscriberId`
- Spouse: `parseInt(family.subscriberId) + 1` (as string, same length)
- Dependent: `parseInt(family.subscriberId) + 2`

**DTP segments**
- `DTP*356` — Eligibility Start (= Benefit Start Date)
- `DTP*357` — Plan Period End (= Eligibility End Date or Dec 31 of start year)
- `DTP*348` — Benefit Begin Date (per member)
- `DTP*349` — **NOT emitted** (previously caused incorrect termination dates)

---

### Random Family Generation

`randomFamily()` called once per modal open (`useState(() => randomFamily())`):

```js
{
  lastName,            // from LAST_NAMES[20 entries]
  subscriberFirst,     // from MALE_FIRST[14] or FEMALE_FIRST[14]
  subscriberGender,    // 'M' or 'F'
  spouseFirst,         // opposite gender pool
  spouseGender,
  childFirst,          // from CHILD_FIRST_M/F[8]
  childGender,
  subscriberDOB,       // random 1970–1994
  spouseDOB,           // subscriber year ± random(0–3)
  childDOB,            // random 2010–2021
  subscriberId,        // 9-digit random string
  enrollmentBase,      // 'ENR' + 9-digit random
  enrollmentGroupBase, // 5-digit string 20000–39999
  address,             // one of 10 hardcoded US street addresses
  loc,                 // {city, state, zip} matching address
  phone,               // random 10-digit string formatted NPA-NXX-XXXX
  email,               // firstName.lastName@randomdomain.com
}
```

---

## Code Table Alignment

`formatter.js` maps raw X12 codes to human-readable labels. Aligned to:
- **CMS FFE X12 834 Companion Guide v7.2** (August 2024)
- **Covered California Companion Guide v24.09.06**

Tables covered:
`maintenanceType`, `maintenanceReason`, `relationshipCode`, `genderCode`, `maritalStatus`, `raceEthnicity` (CDC HL7 v2), `language`, `coverageLevel`, `sepReason`, `amrc`, `originCode`, `coverageType`, `insuredIndicator`, `coordinationOfBenefits`.

---

## Development Workflow

### Run Locally
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173/
```

### Build for Production
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

### Deploy
Push to the `main` branch. GitHub Actions builds and deploys to GitHub Pages automatically.

---

## How to Extend

### Add a New Sample Scenario
1. Add the `.edi` file to `frontend/public/sample-data/`
2. Add an entry to the `SCENARIOS` array in `Dashboard.jsx`:
   ```js
   { label: '16 — Your Scenario Description', value: '16-your-file-name.edi' }
   ```

### Add a New Transaction Type to the Generator
1. In `Generate834Modal.jsx`, add the option to the `<select>` for Transaction type.
2. Create a new builder function (e.g., `buildTerminateEdi(...)`) following the same pattern as `buildAddCoverageEdi`.
3. In the `handleGenerate()` function, branch on the selected transaction type to call the correct builder.

### Add a New Coverage Type
In `Generate834Modal.jsx`, extend the `PREMIUMS` and `PLAN_IDS` objects:
```js
const PREMIUMS = {
  HLT: { sub: 412.50, sps: 389.25, dep: 249.00 },
  DEN: { sub: 23.61,  sps: 10.35,  dep: 9.72  },
  VIS: { sub: 13.21,  sps: 13.21,  dep: 13.21 },
  // Add new ones here
};
```

### Add New Code Table Entries
Edit `frontend/src/utils/formatter.js`. Each table is a plain JS object keyed by the raw X12 code value.

---

## Known Limitations / Tech Debt

- `GeneratePanel.jsx` and `GenerateAddSpousePanel.jsx` are dead code — safe to delete.
- `generate834.js` utility is unused by the current modal — safe to delete or repurpose.
- Only "Add Coverage" transaction type is supported in the generator. Terminations, Changes, and Cancellations are not yet supported in the generation form.
- The generator uses hardcoded plan IDs and premiums for a specific exchange configuration (Covered California / CMS FFE). These should be made configurable for other markets.
