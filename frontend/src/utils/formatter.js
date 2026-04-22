export function getRelationshipLabel(code, isSubscriber = false) {
    if (isSubscriber) return "Subscriber";

    const normalizedCode = (code || "").trim();

    // Section 14 – Covered California Individual Relationship Codes
    const map = {
        "01": "Spouse",
        "03": "Father or Mother",
        "04": "Grandfather or Grandmother",
        "05": "Grandson or Granddaughter",
        "06": "Uncle or Aunt",
        "07": "Nephew or Niece",
        "08": "Cousin",
        "10": "Foster Child",
        "11": "Son-in-law or Daughter-in-law",
        "12": "Brother-in-law or Sister-in-law",
        "13": "Mother-in-law or Father-in-law",
        "14": "Brother or Sister",
        "15": "Ward",
        "16": "Stepparent",
        "17": "Stepson or Stepdaughter",
        "18": "Self",
        "19": "Child",
        "23": "Sponsored Dependent",
        "24": "Parent's Domestic Partner",
        "25": "Ex-Spouse",
        "26": "Guardian",
        "31": "Court Appointed Guardian",
        "53": "Domestic Partner",
        "D2": "Trustee",
        "G8": "Other Relationship",
        "G9": "Other Relative",
    };

    return map[normalizedCode] || normalizedCode || "Unknown";
}

export function getRaceEthnicityLabels(codes = []) {
    if (!Array.isArray(codes) || codes.length === 0) return [];

    // CDC/HL7 Race or Ethnicity Codes — combined CA Companion Guide + CMS FFE guide
    const map = {
        // American Indian / Native
        "1002-5": "American Indian or Alaskan Native",
        // Asian
        "2028-9": "Other Asian",
        "2029-7": "Asian Indian",
        "2033-9": "Cambodian",
        "2034-7": "Chinese",
        "2036-2": "Filipino",
        "2037-0": "Hmong",
        "2039-6": "Japanese",
        "2040-4": "Korean",
        "2041-2": "Laotian",
        "2047-9": "Vietnamese",
        // Black
        "2054-5": "Black or African American",
        // Pacific Islander
        "2079-2": "Native Hawaiian",
        "2080-0": "Samoan",
        "2086-7": "Guamanian or Chamorro",
        "2500-7": "Other Pacific Islander",
        // White
        "2106-3": "White",
        // Other
        "2131-1": "Other Race",
        // Hispanic / Latino
        "2135-2": "Hispanic, Latino, or Spanish Origin",
        "2148-5": "Mexican, Mexican American, or Chicano/a",
        "2157-6": "Guatemalan",
        "2161-8": "Salvadoran",
        "2178-2": "Other Hispanic/Latino/Spanish",
        "2180-8": "Puerto Rican",
        "2182-4": "Cuban",
        "2186-5": "Not Hispanic",
    };

    return codes.map((code) => {
        const normalizedCode = String(code || "").trim();
        return map[normalizedCode] || normalizedCode;
    });
}

export function getLanguageLabel(code) {
    const normalizedCode = String(code || "").trim().toLowerCase();

    // Sections 17.1 & 17.2 – Covered California Spoken and Written Language Codes
    const map = {
        ara: "Arabic",
        cmn: "Mandarin",
        eng: "English",
        fas: "Farsi",
        hin: "Hindi",
        hmn: "Hmong",
        hye: "Armenian",
        khm: "Cambodian",
        kor: "Korean",
        pan: "Punjabi",
        rus: "Russian",
        spa: "Spanish",
        tgl: "Tagalog",
        vie: "Vietnamese",
        yue: "Cantonese",
        zho: "Traditional Chinese",
        // ISO 639-2 generic Chinese
        chi: "Chinese",
        // Portuguese
        por: "Portuguese",
        // common 2-letter aliases
        en: "English",
        es: "Spanish",
    };

    return map[normalizedCode] || code || "N/A";
}

// Section 15.1 – Covered California Maintenance Type Codes
export function getMaintenanceTypeLabel(code) {
    const map = {
        "001": "Change",
        "021": "Addition",
        "024": "Cancellation or Termination",
        "025": "Reinstatement",
        "030": "Compare",
    };
    return map[(code || "").trim()] || code || "Unknown";
}

// Section 16 – Covered California Maintenance Reason Codes
export function getMaintenanceReasonLabel(code) {
    const map = {
        "01": "Divorce",
        "02": "Birth",
        "03": "Death",
        "07": "Termination of Benefits",
        "08": "Termination of Employment",
        "14": "Voluntary Withdrawal",
        "22": "Plan Change at Renewal",
        "25": "Change in Identifying Data",
        "28": "Enrollment Confirmation",
        "29": "Change in Effective Date",
        "32": "Marriage",
        "33": "Personnel Data Change",
        "41": "Re-enrollment / Reinstatement",
        "43": "Change of Address",
        "59": "Non-Payment",
        "AI": "No Reason Given",
        "AL": "Auto Plan Selection",
        "EC": "Member Benefit Selection",
        "XN": "Notification Only",
    };
    return map[(code || "").trim()] || code || "Unknown";
}

// Section 19 – Marital Status Codes (CA Companion Guide + CMS FFE)
export function getMaritalStatusLabel(code) {
    const map = {
        B: "Registered Domestic Partner",   // CA
        D: "Divorced",                        // CA
        I: "Single",                          // CA
        M: "Married",                         // CA + CMS
        R: "Registered Domestic Partner",    // CMS FFE
        U: "Unmarried / Never Married",       // CA + CMS
        W: "Widowed",                         // CA
    };
    return map[(code || "").trim().toUpperCase()] || code || "N/A";
}

// INS-05 Benefit Status Code
export function getBenefitStatusLabel(code) {
    const map = {
        A: "Active Coverage",
        C: "COBRA",
        S: "Surviving Insured",
        T: "Tax Equity Credit",
    };
    return map[(code || "").trim().toUpperCase()] || code || "N/A";
}

// 2700 loop SEP REASON values — CA Companion Guide + CMS FFE Appendix A
export function getSepReasonLabel(code) {
    const norm = (code || "").trim();
    const map = {
        // CA Companion Guide codes (short numeric/alpha)
        "01": "Divorce",
        "02": "Birth",
        "03": "Death",
        "05": "Adoption",
        "32": "Marriage",
        "43": "Change of Location",
        "AI": "No Reason Given",
        // CMS FFE Appendix A codes (sent as full string on REF02)
        "02-BIRTH": "Birth — Addition of individual due to birth",
        "05-ADOPTION": "Adoption — Addition of individual due to adoption",
        "07-TERMINATION OF BENEFITS": "Termination of Benefits — Loss of Minimum Essential Coverage",
        "32-MARRIAGE": "Marriage — Addition of individual due to marriage",
        "43-CHANGE OF LOCATION": "Change of Location — New QHPs available due to a permanent move",
        "FC": "Financial Change — Change to APTC or CSR",
        "NE": "Newly Eligible — Released from incarceration, lawful presence, or tribal member",
        "QS": "QSEHRA — Newly eligible for Qualified Small Employer HRA",
        "HR": "ICHRA — Newly eligible for Individual Coverage HRA",
    };
    return map[norm.toUpperCase()] || map[norm] || norm || "N/A";
}

// 2700 loop QSEHRA Both values
export function getQsehraBothLabel(value) {
    const map = {
        Subscriber: "Yes — use employer QSEHRA for medical/pharmacy",
        Spouse: "Yes — use spouse's employer QSEHRA for medical/pharmacy",
        Both: "Yes — use both employer and spouse QSEHRA",
        N: "No",
        Y: "Yes",
    };
    return map[(value || "").trim()] || value || "N/A";
}

// HD-05 Coverage Level Code
export function getCoverageLevelLabel(code) {
    const map = {
        EMP: "Employee Only",
        IND: "Individual",
        SPC: "Subscriber and Spouse",
        TWO: "Two-Person",
        FAM: "Family",
        CHD: "Children Only",
        DEP: "Dependents Only",
        ESP: "Employee and Spouse",
        ECH: "Employee and Children",
        FML: "Family",
    };
    return map[(code || "").trim().toUpperCase()] || code || "N/A";
}

// INS-08 Employment Status Code
export function getEmploymentStatusLabel(code) {
    const map = {
        AC: "Active",
        FT: "Full-time",
        PT: "Part-time",
        RT: "Retired",
        TE: "Terminated",
        XO: "COBRA",
    };
    return map[(code || "").trim().toUpperCase()] || code || "N/A";
}

// 2750 loop ADDL MAINT REASON values — CMS FFE Companion Guide v7.2
export function getAmrcLabel(code) {
    const map = {
        // Effectuation
        CONFIRM: "Effectuation — Enrollment confirmation from issuer",
        // Inbound cancellations (issuer to FFE)
        CANCEL: "Cancellation — Non-payment of binder",
        "CANCEL-ANTIDUPLICATION": "Cancellation — Duplicate Medicare coverage (initial status)",
        "CANCEL-FLC": "Cancellation — Free look period request",
        "CANCEL-FRD": "Cancellation — Member defrauded, unauthorized enrollment",
        "CANCEL-HICS": "Cancellation — FFE directive via HICS case",
        "CANCEL-OTH": "Cancellation — Other reason (e.g., passive BAR superseded)",
        "CANCEL-OUT-OF-AREA": "Cancellation — Consumer outside plan coverage area",
        "CANCEL-RESCIND": "Cancellation — Member complicit in fraudulent enrollment",
        // Inbound terminations (issuer to FFE)
        TERM: "Termination — Non-payment of premium",
        "TERM-ANTIDUPLICATION": "Termination — Duplicate Medicare coverage (active policy)",
        "TERM-HICS": "Termination — FFE directive via HICS case",
        "TERM-OTH": "Termination — Other reason",
        // Outbound cancellations (FFE to issuer)
        CANCELCIC: "Cancellation — CIC-triggered policy replacement",
        "CANCEL-CARRYFORWARD": "Cancellation — Auto renewal cancelled by later action",
        "CANCEL-NLE": "Cancellation — Unresolved DMI (incarceration/unlawful presence)",
        "CANCEL-OTH-COVERAGE": "Cancellation — Dual enrollment in QHP + Medicare",
        "CANCEL-PDM": "Cancellation — Periodic data match",
        // Outbound terminations (FFE to issuer)
        TERMCIC: "Termination — CIC-triggered policy replacement",
        "TERM-NLE": "Termination — Unresolved DMI",
        "TERM-OTH-COVERAGE": "Termination — Dual enrollment in QHP + Medicare",
        "TERM-PDM": "Termination — Periodic data match",
        // Maintenance
        CIC: "Coverage (Issuer) Change — Life event policy replacement",
        PASSIVE: "Benefit Autoassignment (BAR)",
        "PASSIVE-B2S": "BAR — Bronze to Silver upgrade",
        "PASSIVE-INITIAL": "BAR — Initial passive enrollment",
        "PASSIVE-NEW SUBSCRIBER": "BAR — New subscriber passive enrollment",
        "ISSUER MAINT": "Issuer Maintenance",
        "NO CHANGE": "No Change — No updates to this covered individual",
        "ISSUER-REINSTATEMENT": "Issuer Reinstatement",
        "FINANCIAL CHANGE": "Financial Change — APTC or CSR update",
        "CSR VARIANT CHANGE": "CSR Variant Change",
        "AGENT BROKER INFO": "Agent/Broker Information Update",
        "DEMOGRAPHIC CHANGE": "Demographic Change",
    };
    const norm = (code || "").trim().toUpperCase();
    return map[norm] || map[(code || "").trim()] || code || "N/A";
}

// 2750 loop APPLICATION ID AND ORIGIN values — CMS FFE Appendix A
export function getOriginCodeLabel(code) {
    const map = {
        "1": "FFE Online",
        "2": "DE/EDE Consumer",
        "3": "DE/EDE Agent/Broker",
        "4": "Enrollment Support Desk (ESD) Worker",
        "5": "Call Center Worker",
        "6": "Inbound Account Transfer",
        "11": "Auto Re-Enrollment",
        "12": "Periodic Data Matching",
        "18": "Advanced Resolution (Appeals or Casework)",
    };
    // Value format is "AppID-OriginCode" e.g. "123456789-00"
    const parts = (code || "").split("-");
    const originCode = parts[parts.length - 1] || code;
    return map[originCode] || code || "N/A";
}