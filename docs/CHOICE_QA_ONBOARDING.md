# EDI 834 Validator — Choice QA Onboarding

## Overview

The EDI 834 Validator is a browser-based tool originally built to support **A&P** EDI QA workflows. We are now expanding its use to the **Choice project** and want Choice QA to begin incorporating it into their testing process.

**Tool URL:** https://mpulsemobile.github.io/edi-834-validator/  
**Full User Guide:** [USER_GUIDE.md](USER_GUIDE.md)  
**Reference Presentation:** EDI_834_Validator_Presentation_.pptx  
**Contact for tool access / onboarding:** Paul → Shelby

> No login, no installation, no data upload — all processing runs locally in your browser.

---

## Purpose

The goal is twofold:

1. **Supplement Choice EDI testing** — Use the tool as a cross-check alongside your manual test results to surface discrepancies, missing fields, or unexpected values faster.
2. **Help us improve the tool** — Since the validator was built for A&P EDIs, there may be Choice-specific segments, fields, or scenarios it does not yet handle correctly. Your feedback will directly drive enhancements to support Choice use cases.

---

## Current Validations — What the Tool Checks Today

All validations currently in the tool are based on the **CMS FFE X12 834 Companion Guide v7.2 (August 2024)**, which is the companion guide used for the **A&P implementation**. These have been implemented across four tiers:

### Tier 1 — Code-Set Checks
Validates that coded fields contain recognised X12 / CMS FFE values:

| Field | Segment | Example of what it catches |
|---|---|---|
| Individual Relationship Code | `INS-02` | Code not in the standard list (18=self, 01=spouse, 19=child, etc.) |
| Maintenance Type Code | `INS-03` | Code outside 021/024/001/025/026/030/032 |
| Maintenance Reason Code | `INS-04` | Code not in the 35-value CMS FFE list |
| Benefit Status Code | `INS-05` | Anything outside A, C, S, T |
| Employment Status Code | `INS-08` | Code outside FT, PT, RT, TE, AC, XO, etc. |
| Marital Status Code | `INS-11` | Code outside M, D, I, U, W, B, R, S, X |
| Gender Code | `DMG-03` | Anything outside M, F, U |
| Transaction Purpose Code | `BGN-01` | Anything outside 00, 15, 22 |
| Insurance Line Code | `HD-03` | Code not in the 40+ recognised line codes (HLT, DEN, VIS, RX, etc.) |
| Coverage Level Code | `HD-05` | Code outside FAM, IND, ESP, EMP, CHD, DEP, etc. |

### Tier 2 — Date Logic
| Check | What it catches |
|---|---|
| Date format (`CCYYMMDD`) | Non-numeric, wrong length, or invalid calendar date (e.g. month 13) |
| DOB in future | Date of birth after today |
| DOB age > 120 | Implausible age |
| Benefit begin after end | `DTP*348` is after `DTP*349`/`357` on the same coverage |
| Dates before 2000 | Likely data entry error |
| Dates > 5 years in future | Likely data entry error |

### Structural Checks
| Check | What it catches |
|---|---|
| SE-01 segment count | Declared count does not match actual segments in file |
| Single subscriber rule | Zero or more than one `INS-01=Y` member in the transaction |
| Self must be subscriber | `INS-02=18` (Self) but `INS-01≠Y` |
| Subscriber relationship integrity | Subscriber has a dependent relationship code instead of 18 |
| Subscriber missing `REF*0F` | Subscriber loop has no Exchange Assigned Subscriber ID |

### Group D — 2750 Loop / CMS FFE Companion Guide Specific
Sourced directly from the CMS FFE Companion Guide v7.2 Appendices A, B, and C:

| Field | What it catches |
|---|---|
| SEP REASON code (Appendix A) | Value not in the 9 valid CMS FFE SEP reason codes |
| ADDL MAINT REASON / AMRC (Appendix C) | Value not in the 37 valid inbound + outbound AMRC values |
| RATING AREA format | Does not match `R-XX###` format (e.g. `R-VA010`) |
| Race/Ethnicity CDC codes (Appendix B) | Code not in the 20 valid CDC codes from Table 28 |
| Race/Ethnicity count | More than 10 codes on a single member |

---

## Important Note for Choice QA — Validations Are A&P-Based

> **The current validations reflect the CMS FFE X12 834 Companion Guide v7.2, which governs the A&P implementation. They do not yet reflect the Choice companion guide or Choice-specific EDI requirements.**

This means:

- Some warnings the tool produces may be **false positives** for Choice — a value that is invalid for A&P may be perfectly valid for Choice.
- Some things the tool does **not** warn about may actually be errors for Choice, if the Choice spec has stricter or different requirements.
- Once the **Choice companion guide** is available, we will add a new set of Choice-specific validations on top of the existing ones (or replace A&P rules where they conflict).

**Do not treat tool warnings as definitive failures for Choice EDIs.** Always cross-reference with your own knowledge of the Choice implementation spec.

---

## How to Use It (Choice QA Workflow)

> **Important:** This tool is a supplement, not a replacement for manual testing. EDI testing cannot be done blindly with the tool.

Follow this order:

1. **Understand the spec first** — Make sure you are familiar with the Choice EDI implementation before running any files through the tool. Know what a correct file should look like for each scenario.

2. **Test manually** — Execute your test case and validate the EDI output the same way you normally would. Form your own conclusions about whether the file is correct.

3. **Run the file through the tool** — Upload the EDI file to https://mpulsemobile.github.io/edi-834-validator/ and review:
   - The **Summary** line (plain-English description of what the file does)
   - The **Validation Warnings** section (code-set, date, and structural issues)
   - The **Member Table** (demographics, coverage, dates, financials)
   - The **Unrecognized Segments** section (segments the parser does not yet handle)
   - The **Source view** (click ⓘ on any field to see the exact X12 segment)

4. **Cross-check** — Compare the tool's output against your manual test results. Note any differences.

5. **Report gaps** — If the tool misreads, ignores, or cannot handle a Choice-specific segment or scenario, document it (see below).

---

## Reporting Issues

If the tool fails to handle a Choice EDI correctly, please notify **Vipul** and include:

- The EDI file that failed or produced unexpected results
- A brief description of what the tool showed vs. what the correct result should be
- The specific scenario or transaction type involved
- Whether the warning appears to be a **false positive** (A&P rule that does not apply to Choice) or a **missed validation** (something Choice requires that the tool does not check)

---

## What We're Looking For

As you test, pay attention to anything the tool does not handle correctly for Choice, such as:

- Warnings that fire on valid Choice EDIs (false positives from A&P rules)
- Choice-specific segment values or proprietary qualifiers that land in the **Unrecognized Segments** list
- Fields that appear blank in the tool but are present in the file
- Incorrect parsing of member relationships, coverage types, or dates
- Scenarios that produce no summary or an incorrect summary

Every gap you identify helps us build the Choice-specific validation layer and make the tool accurate for both implementations.
