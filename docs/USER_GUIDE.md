# EDI 834 Validator — User Guide

> **Live tool:** https://mpulsemobile.github.io/edi-834-validator/
>
> Browser-only • No login required • No data ever leaves your machine

---

## What Is This Tool?

The EDI 834 Validator is a web-based QA tool for anyone who works with X12 834 Benefit Enrollment and Maintenance files. It lets you:

- **Upload or load** an 834 EDI file
- **Parse** every segment into a clean, human-readable layout
- **Understand** what the file is doing in plain English (Summary section)
- **Inspect** member demographics, coverage, financial data, and enrollment dates
- **Validate** the file against 30+ checks across code-set rules, date logic, structural integrity, and CMS FFE companion guide requirements — warnings are shown with the exact field and reason
- **Generate** new 834 files from a simple form — no EDI knowledge required
- **Export** all parsed data to CSV for downstream analysis

Your data never leaves your browser. Everything runs locally.

---

## Getting Started

### Option 1 — Load a Sample Scenario
Click the **"Load Sample Scenario..."** dropdown in the top-right of the page.  
Choose from 17 pre-built scenarios covering new enrollments, terminations, cancellations, and multi-member policies across Medical, Dental, and Vision.

### Option 2 — Upload Your Own File
Click **"Upload your 834 File"** and select any `.edi`, `.txt`, or `.x12` file from your computer.

### Option 3 — Generate a New 834
Click **"✦ Generate 834"** to open the generation form (see [Generating EDI Files](#generating-edi-files) below).

---

## Reading the Dashboard

Once a file is loaded, the page shows the following sections in order:

### Summary
A plain-English sentence describing what the 834 is intended to do. Examples:
- *This 834 is adding Subscriber, Spouse, with Benefit Begin Date of 05/01/2026 for coverage HLT, DEN.*
- *This 834 is terminating Johnson who is a Spouse to this policy, with Benefit End Date of 12/31/2026 for coverage HLT.*

### Stats Cards
Quick counts: Members, Subscribers, Dependents, Coverages, Warnings, Unrecognised Segments.

### Validation Warnings
Appears immediately after the Stats Cards when one or more checks fail. Each warning identifies the member, the field, and the reason. Warnings are grouped into four tiers:

**Tier 1 — Code-Set Checks**  
Verifies that coded fields contain values from the recognised X12 / CMS FFE value sets:

| Field | Segment | What is checked |
|---|---|---|
| Individual Relationship Code | `INS-02` | Against the standard X12 list (18=self, 01=spouse, 19=child, etc.) |
| Maintenance Type Code | `INS-03` | Against 021, 024, 001, 025, 026, 030, 032 |
| Maintenance Reason Code | `INS-04` | Against the 35-value CMS FFE list |
| Benefit Status Code | `INS-05` | Must be A, C, S, or T |
| Employment Status Code | `INS-08` | Against FT, PT, RT, TE, AC, XO, etc. |
| Marital Status Code | `INS-11` | Against M, D, I, U, W, B, R, S, X |
| Gender Code | `DMG-03` | Must be M, F, or U |
| Transaction Purpose Code | `BGN-01` | Must be 00, 15, or 22 |
| Insurance Line Code | `HD-03` | Against 40+ recognised line codes (HLT, DEN, VIS, RX, etc.) |
| Coverage Level Code | `HD-05` | Against FAM, IND, ESP, EMP, CHD, DEP, etc. |

**Tier 2 — Date Logic**  
Validates all `DTP` date values across member and coverage loops:

| Check | What it catches |
|---|---|
| Date format (`CCYYMMDD`) | Non-numeric, wrong length, or invalid calendar date (e.g. month 13, Feb 30) |
| DOB in future | Date of birth is after today |
| DOB age > 120 | Implausible age |
| Benefit begin after end | `DTP*348` is later than `DTP*349`/`357` on the same coverage |
| Dates before 2000 | Likely data-entry error |
| Dates more than 5 years in future | Likely data-entry error |

**Structural Checks**  
Verifies file-level and transaction-level integrity:

| Check | What it catches |
|---|---|
| SE-01 segment count | Declared count does not match actual segment count in file |
| Single subscriber rule | Zero or more than one `INS-01=Y` member in the transaction |
| Self must be subscriber | `INS-02=18` (Self) but `INS-01≠Y` |
| Subscriber relationship integrity | Subscriber has a dependent relationship code instead of 18 |
| Subscriber missing `REF*0F` | Subscriber loop has no Exchange Assigned Subscriber ID |

**CMS FFE Companion Guide Checks (2750 Loop)**  
Sourced from the CMS FFE X12 834 Companion Guide v7.2, Appendices A, B, and C:

| Field | What it catches |
|---|---|
| SEP REASON code | Value not in the 9 valid CMS FFE SEP reason codes (Appendix A) |
| ADDL MAINT REASON / AMRC | Value not in the 37 valid inbound + outbound AMRC values (Appendix C) |
| RATING AREA format | Does not match `R-XX###` (e.g. `R-VA010`) |
| Race/Ethnicity CDC codes | Code not in the 20 valid CDC codes from Appendix B, Table 28 |
| Race/Ethnicity count | More than 10 codes on a single member |

### Transaction Details
Header-level information: Transaction ID, Reference Number, Transaction Date, Sponsor, Payer, Broker, Interchange Control Number, Version.

### Eligibility
Eligibility Start Date (`DTP*356`), Eligibility End Date (`DTP*357`), and Coverage Termination Date (`DTP*349`) if present.

### Member Table
One row per member. Columns include:

| Column | What it shows |
|--------|---------------|
| Name | First/Middle/Last name + Subscriber or Dependent label |
| Relationship | Decoded label (e.g. Spouse, Child, Domestic Partner) + raw code |
| Transaction | Maintenance type (Addition, Change, Cancellation) + reason |
| Member ID | `NM1-09` |
| Subscriber ID | `REF*0F` |
| Enrollment ID | `REF*1L` |
| DOB | Date of birth |
| Gender | Gender + Marital Status if present |
| State | State from N4 |
| Coverage | Coverage line (HLT/DEN/VIS), coverage level, Benefit Begin/End Date, premium, CMS Plan ID |
| Issues | Any missing required fields (DOB, ID, Name, Coverage) |
| Current Premium | From financial loop `PRE AMT 1` |
| Current APTC | From financial loop `APTC AMT` |
| Race / Ethnicity | Decoded CDC codes |
| Spoken / Written Language | Decoded language codes |

**Tip:** Click the **ⓘ** icon next to any field value to see the exact X12 source segment it came from.

**Search:** Use the search box above the table to filter by name, member ID, or subscriber ID.

**Export:** Click **↓ Export CSV** to download the full table as a spreadsheet (57 columns).

### Enrollment Financial Summary
Totals and financial metadata for the transaction: Total Responsible Amount, APTC, Rating Area, Source Exchange ID, SEP Reason, ICHRA/QSEHRA flags, Monthly Premium Totals table.

### Raw File
The original file text, exactly as uploaded.

### Unrecognised Segments
Any segments in the file that the parser did not handle — shown for inspection.

### Structured JSON
The full parsed result as JSON — useful for debugging or integration work.

---

## Generating EDI Files

Click **✦ Generate 834** in the top-right header.

### Form Fields

| Field | Description |
|-------|-------------|
| **Transaction** | Type of transaction. Currently supports **Add Coverage**. |
| **Members on Policy** | Select who is on the policy: Subscriber, Spouse, and/or Dependent. At least one required. |
| **Coverage** | Select which coverage lines to generate: HLT (Medical), DEN (Dental), VIS (Vision). At least one required. |
| **Benefit Start Date** | The coverage effective date (`DTP*348`). Required. |
| **Eligibility End Date** | The plan year end date (`DTP*357`). Optional — defaults to Dec 31 of the benefit start year. |
| **Preview** | Auto-updates as you fill in the form, showing the plain-English summary of what will be generated. |

### Generation Rules
- **One 834 file is created per selected coverage.** Selecting HLT + DEN + VIS produces three separate files — matching how exchange submissions work in practice.
- Each file has a **unique enrollment group number** (`REF*1L`), incremented per coverage.
- **Member IDs:** Subscriber ID = Member ID for the subscriber. Spouse = Subscriber ID + 1. Dependent = Subscriber ID + 2.
- Member names, dates of birth, address, phone, and email are **randomly generated per session** — consistent across all files in the same generation, unique each time you open the form.

### After Generation
- Each generated file is listed with an individual **↓ Download** link.
- If multiple coverages were selected, a **↓ Download All** button appears.
- **Load into Validator** loads the first generated file directly into the dashboard for immediate review.

---

## Sample Scenarios Reference

| # | Scenario | Coverage | Transaction |
|---|----------|----------|-------------|
| 01 | SEP New Enrollment: Subscriber Only | Medical | Addition |
| 02 | SEP New Enrollment: Subscriber Only | Vision | Addition |
| 03 | SEP New Enrollment: Subscriber Only | Dental | Addition |
| 04 | SEP Termination: Subscriber Only | Medical | Cancellation/Termination |
| 05 | SEP Termination: Subscriber Only | Dental | Cancellation/Termination |
| 06 | SEP Termination: Subscriber Only | Vision | Cancellation/Termination |
| 07 | Add Spouse: Subscriber Cancellation | Medical | Change + Cancellation |
| 08 | Add Spouse: Subscriber Cancellation | Dental | Change + Cancellation |
| 09 | Add Spouse: Subscriber Cancellation | Vision | Change + Cancellation |
| 10 | Add Spouse: New Subscriber + Spouse | Medical | Addition |
| 11 | Add Spouse: New Subscriber + Spouse | Dental | Addition |
| 12 | Add Spouse: New Subscriber + Spouse | Vision | Addition |
| 13 | Add Dependent to Subscriber + Spouse | Mixed | Addition |
| 14 | New Enrollment: Subscriber + Spouse + Dependent | Mixed | Addition |
| 15A | New Enrollment: Subscriber + Spouse + Dependent | Dental | Addition |
| 15B | New Enrollment: Subscriber + Spouse + Dependent | Medical | Addition |
| 15C | New Enrollment: Subscriber + Spouse + Dependent | Vision | Addition |

---

## Code Table Alignment

All validation rules and code lookups are aligned to:
- **CMS FFE X12 834 Companion Guide v7.2** (August 2024)
- **Covered California Companion Guide v24.09.06**

Covered code tables include: Relationship codes, Race/Ethnicity (CDC HL7), Language (spoken & written), Maintenance Type, Maintenance Reason, Marital Status, SEP Reason, Coverage Level, AMRC (Additional Maintenance Reason Code), Origin Codes, and ICHRA/QSEHRA fields.

> **Note for non-A&P implementations:** The current validation rules reflect the CMS FFE companion guide used for A&P. If you are testing EDI files from a different implementation (e.g. Choice), some warnings may be false positives where that implementation uses different but valid code values. Companion-guide-specific validation layers for other implementations can be added as those guides become available.

---

## Privacy & Security

- **No server.** The tool is a static website with zero backend.
- **No transmission.** Files you upload are read by your browser only — nothing is sent anywhere.
- **No storage.** Refreshing the page clears all data.
- A yellow banner at the top of the page reminds you: *Do not upload files containing real member PHI/PII to shared or public environments.*

---

## Browser Support

Works in any modern browser: Chrome, Firefox, Edge, Safari. No installation required.
