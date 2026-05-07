function detectDelimiters(raw) {
    const segmentTerminator = raw.includes("~") ? "~" : "\n";
    const firstIsa = raw.split(segmentTerminator).find((s) => s.startsWith("ISA")) || "";
    const elementSeparator = firstIsa[3] || "*";

    let componentSeparator = "^";
    if (firstIsa.length > 0) {
        const lastChar = firstIsa.trim().slice(-1);
        if (lastChar && lastChar !== elementSeparator) {
            componentSeparator = lastChar;
        }
    }

    return { segmentTerminator, elementSeparator, componentSeparator };
}

function splitComposite(value, separator = "^") {
    if (!value) return [];
    return value
        .split(separator)
        .map((v) => v.trim())
        .filter(Boolean);
}

function cleanValue(value) {
    return (value || "").trim();
}

function parseX12(raw) {
    const { segmentTerminator, elementSeparator, componentSeparator } = detectDelimiters(raw);

    const segments = raw
        .split(segmentTerminator)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((segment) => segment.split(elementSeparator).map(cleanValue));

    return { segments, componentSeparator };
}

function createEmptyMember() {
    return {
        subscriberId: "",
        enrollmentId: "",
        exchangeMemberId: "",
        relationshipCode: "",
        maintenanceTypeCode: "",
        maintenanceReasonCode: "",
        benefitStatusCode: "",
        employmentStatusCode: "",
        deathDate: "",
        lastName: "",
        firstName: "",
        middleName: "",
        suffix: "",
        memberId: "",
        ssn: "",
        dob: "",
        gender: "",
        raceEthnicityCodes: [],
        spokenLanguage: "",
        writtenLanguage: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zip: "",
        countyCode: "",
        maritalStatusCode: "",
        phone: "",
        email: "",
        isSubscriber: false,
        coverages: [],
        refs: {},
        dates: {},
        trace: {
            subscriberId: "",
            enrollmentId: "",
            exchangeMemberId: "",
            relationshipCode: "",
            maintenanceTypeCode: "",
            maintenanceReasonCode: "",
            benefitStatusCode: "",
            employmentStatusCode: "",
            deathDate: "",
            lastName: "",
            firstName: "",
            middleName: "",
            suffix: "",
            memberId: "",
            ssn: "",
            dob: "",
            gender: "",
            raceEthnicityCodes: "",
            spokenLanguage: "",
            writtenLanguage: "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            zip: "",
            countyCode: "",
            maritalStatusCode: "",
            phone: "",
            email: "",
        },
        financials: {
            entries: [],
            summary: {
                currentPremiumAmount: null,
                currentAptcAmount: null,
                currentTotalResponsibleAmount: null,
                ratingArea: "",
                sourceExchangeId: "",
                addlMaintReason: "",
                applicationIdAndOrigin: "",
                monthlyPremiumTotals: {},
                monthlyAptcAmounts: {},
                monthlyStateSubsidyAmounts: {},
                monthlyResponsibleAmounts: {},
            },
        },
    };
}

function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

function normalizeFinancialLabel(label) {
    return (label || "").trim().toUpperCase();
}

function applyFinancialSummary(member, entry) {
    if (!member || !entry) return;

    const label = normalizeFinancialLabel(entry.label);
    const date = entry.date || "";
    const rawValue = entry.value || "";
    const numberValue = toNumber(rawValue);
    const summary = member.financials.summary;

    switch (label) {
        case "PRE AMT TOT":
            summary.currentPremiumTotalAmount = numberValue;
            break;
        case "PRE AMT 1":
            summary.currentPremiumAmount = numberValue;
            break;
        case "ISFFM":
            summary.isFFM = rawValue;
            break;
        case "SEP REASON":
            summary.sepReason = rawValue;
            break;
        case "ICHRA/QSEHRA":
            summary.ichraQsehra = rawValue;
            break;
        case "QSEHRA SPOUSE":
            summary.qsehraSpouse = rawValue;
            break;
        case "QSEHRA BOTH":
            summary.qsehraBoth = rawValue;
            break;
        case "APTC AMT":
            summary.currentAptcAmount = numberValue;
            break;
        case "TOT RES AMT":
            summary.currentTotalResponsibleAmount = numberValue;
            break;
        case "RATING AREA":
            summary.ratingArea = rawValue;
            break;
        case "SOURCE EXCHANGE ID":
            summary.sourceExchangeId = rawValue;
            break;
        case "ADDL MAINT REASON":
            summary.addlMaintReason = rawValue;
            break;
        case "APPLICATION ID AND ORIGIN":
            summary.applicationIdAndOrigin = rawValue;
            break;
        case "MONTHLY PRE AMT TOT":
            if (date) summary.monthlyPremiumTotals[date] = numberValue;
            break;
        case "MONTHLY APTC AMT":
            if (date) summary.monthlyAptcAmounts[date] = numberValue;
            break;
        case "MONTHLY STATE SUBSIDY AMT":
            if (date) summary.monthlyStateSubsidyAmounts[date] = numberValue;
            break;
        case "MONTHLY TOT RES AMT":
            if (date) summary.monthlyResponsibleAmounts[date] = numberValue;
            break;
        default:
            break;
    }
}

function finalizeFinancialEntry(currentMember, currentFinancialEntry) {
    if (!currentMember || !currentFinancialEntry) return null;

    const finalized = { ...currentFinancialEntry };
    currentMember.financials.entries.push(finalized);
    applyFinancialSummary(currentMember, finalized);
    return null;
}

function deriveEnrollmentSummary(result) {
    const subscriber = result.members.find((m) => m.isSubscriber) || result.members[0];
    if (!subscriber) return;

    if (!result.enrollment.eligibilityStartDate) {
        if (subscriber.dates?.["356"]) {
            result.enrollment.eligibilityStartDate = subscriber.dates["356"];
            result.enrollment.trace.eligibilityStartDate = "DTP*356-03";
        } else if (subscriber.coverages?.[0]?.dates?.["348"]) {
            result.enrollment.eligibilityStartDate = subscriber.coverages[0].dates["348"];
            result.enrollment.trace.eligibilityStartDate = "DTP*348-03 (fallback)";
        }
    }

    if (!result.enrollment.eligibilityEndDate) {
        if (subscriber.dates?.["357"]) {
            result.enrollment.eligibilityEndDate = subscriber.dates["357"];
            result.enrollment.trace.eligibilityEndDate = "DTP*357-03";
        } else if (subscriber.coverages?.[0]?.dates?.["349"]) {
            result.enrollment.eligibilityEndDate = subscriber.coverages[0].dates["349"];
            result.enrollment.trace.eligibilityEndDate = "DTP*349-03 (fallback)";
        }
    }

    // Collect coverage termination date (DTP*349) from any coverage
    const terminationDates = subscriber.coverages
        .map((c) => c.dates?.["349"])
        .filter(Boolean)
        .sort();
    if (terminationDates.length) {
        result.enrollment.coverageTerminationDate = terminationDates[0];
        result.enrollment.trace.coverageTerminationDate = "DTP*349-03";
    }
}

export function formatDate(raw) {
    if (!raw) return "";
    if (raw.length === 8) {
        return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    }
    return raw;
}

export function parse834(raw) {
    const { segments, componentSeparator } = parseX12(raw);

    const result = {
        interchange: {},
        group: {},
        transaction: {},
        sponsor: {},
        payer: {},
        broker: {},
        enrollment: {
            eligibilityBeginDate: "",
            eligibilityStartDate: "",
            eligibilityEndDate: "",
            coverageTerminationDate: "",
            trace: {
                eligibilityBeginDate: "",
                eligibilityStartDate: "",
                eligibilityEndDate: "",
                coverageTerminationDate: "",
            },
        },
        members: [],
        validation: {
            totalSegments: segments.length,
            memberCount: 0,
            coverageCount: 0,
            warnings: [],
            errors: [],
            unrecognizedSegments: [],
            summary: {
                missingNames: 0,
                missingIds: 0,
                missingDob: 0,
                missingCoverage: 0,
            },
        },
    };

    let currentMember = null;
    let currentCoverage = null;

    let in2700Loop = false;
    let currentFinancialLabel = "";
    let currentFinancialEntry = null;

    const finalizeCoverage = () => {
        if (currentMember && currentCoverage) {
            currentMember.coverages.push({ ...currentCoverage });
            result.validation.coverageCount += 1;
            currentCoverage = null;
        }
    };

    const finalizeMember = () => {
        finalizeCoverage();
        currentFinancialEntry = finalizeFinancialEntry(currentMember, currentFinancialEntry);

        if (currentMember) {
            result.members.push({ ...currentMember });
            currentMember = null;
        }

        in2700Loop = false;
        currentFinancialLabel = "";
    };

    for (const elements of segments) {
        const seg = elements[0];

        switch (seg) {
            case "ISA":
                result.interchange = {
                    authorizationInfoQualifier: elements[1],
                    securityInfoQualifier: elements[3],
                    senderIdQualifier: elements[5],
                    senderId: elements[6],
                    receiverIdQualifier: elements[7],
                    receiverId: elements[8],
                    interchangeDate: elements[9],
                    interchangeTime: elements[10],
                    controlNumber: elements[13],
                    usageIndicator: elements[15],
                    componentElementSeparator: elements[16],
                };
                break;

            case "GS":
                result.group = {
                    functionalIdentifierCode: elements[1],
                    senderCode: elements[2],
                    receiverCode: elements[3],
                    groupDate: elements[4],
                    groupTime: elements[5],
                    groupControlNumber: elements[6],
                    version: elements[8],
                };
                break;

            case "ST":
                result.transaction = {
                    transactionSetIdentifier: elements[1],
                    transactionSetControlNumber: elements[2],
                    implementationConventionReference: elements[3],
                };
                break;

            case "BGN":
                result.transaction = {
                    ...result.transaction,
                    purposeCode: elements[1],
                    referenceNumber: elements[2],
                    transactionSetDate: elements[3],
                    transactionSetTime: elements[4],
                    actionCode: elements[8],
                };
                break;

            case "N1": {
                if (in2700Loop && currentMember && elements[1] === "75") {
                    currentFinancialLabel = elements[2] || "";
                    if (currentFinancialEntry) {
                        currentFinancialEntry = finalizeFinancialEntry(currentMember, currentFinancialEntry);
                    }
                    break;
                }

                const entityIdentifierCode = elements[1];
                const payload = {
                    name: elements[2],
                    idCodeQualifier: elements[3],
                    idCode: elements[4],
                };

                if (entityIdentifierCode === "P5") {
                    result.sponsor = payload;
                } else if (entityIdentifierCode === "IN") {
                    result.payer = payload;
                } else if (entityIdentifierCode === "BO") {
                    result.broker = payload;
                }
                break;
            }

            case "INS":
                finalizeMember();
                currentMember = createEmptyMember();
                currentMember.isSubscriber = (elements[1] || "") === "Y";
                currentMember.relationshipCode = elements[2] || "";
                currentMember.maintenanceTypeCode = elements[3] || "";
                currentMember.maintenanceReasonCode = elements[4] || "";
                currentMember.benefitStatusCode = elements[5] || "";
                currentMember.employmentStatusCode = elements[8] || "";
                currentMember.maritalStatusCode = elements[11] || "";
                currentMember.deathDate = elements[12] || "";

                currentMember.trace.relationshipCode = "INS-02";
                currentMember.trace.maintenanceTypeCode = "INS-03";
                currentMember.trace.maintenanceReasonCode = "INS-04";
                currentMember.trace.benefitStatusCode = "INS-05";
                currentMember.trace.employmentStatusCode = "INS-08";
                if (currentMember.maritalStatusCode) {
                    currentMember.trace.maritalStatusCode = "INS-11";
                }
                if (currentMember.deathDate) {
                    currentMember.trace.deathDate = "INS-12";
                }
                break;

            case "REF":
                if (in2700Loop && currentMember) {
                    if (!currentFinancialEntry) {
                        currentFinancialEntry = {
                            label: currentFinancialLabel || "",
                            qualifier: elements[1] || "",
                            value: elements[2] || "",
                            date: "",
                        };
                    } else {
                        currentFinancialEntry.qualifier = elements[1] || currentFinancialEntry.qualifier;
                        currentFinancialEntry.value = elements[2] || currentFinancialEntry.value;
                    }
                    break;
                }

                if (currentMember) {
                    const refQualifier = elements[1];
                    const refValue = elements[2] || "";
                    currentMember.refs[refQualifier] = refValue;

                    if (refQualifier === "SY") {
                        currentMember.ssn = refValue;
                        currentMember.trace.ssn = "REF*SY";
                    }

                    if (refQualifier === "0F" && !currentMember.subscriberId) {
                        currentMember.subscriberId = refValue;
                        currentMember.trace.subscriberId = "REF*0F";
                    }

                    if (refQualifier === "1L") {
                        currentMember.enrollmentId = refValue;
                        currentMember.trace.enrollmentId = "REF*1L";
                    }

                    if (refQualifier === "17" && !currentMember.exchangeMemberId) {
                        currentMember.exchangeMemberId = refValue;
                        currentMember.trace.exchangeMemberId = "REF*17";
                    }
                }

                if (currentCoverage) {
                    const refQualifier = elements[1];
                    const refValue = elements[2] || "";
                    if (refQualifier === "CE") {
                        currentCoverage.cmsPlanId = refValue;
                        currentCoverage.trace = currentCoverage.trace || {};
                        currentCoverage.trace.cmsPlanId = "REF*CE";
                    } else if (refQualifier === "9V") {
                        currentCoverage.paymentCategoryRef = refValue;
                        currentCoverage.trace = currentCoverage.trace || {};
                        currentCoverage.trace.paymentCategoryRef = "REF*9V";
                    }
                }
                break;

            case "NM1":
                if (currentMember && elements[1] === "IL") {
                    currentMember.lastName = elements[3] || "";
                    currentMember.firstName = elements[4] || "";
                    currentMember.middleName = elements[5] || "";
                    currentMember.suffix = elements[7] || "";
                    currentMember.memberId = elements[9] || currentMember.memberId;

                    currentMember.trace.lastName = "NM1-03";
                    currentMember.trace.firstName = "NM1-04";
                    currentMember.trace.middleName = "NM1-05";
                    currentMember.trace.suffix = "NM1-07";
                    currentMember.trace.memberId = "NM1-09";
                }
                break;

            case "N3":
                if (currentMember) {
                    currentMember.address1 = elements[1] || "";
                    currentMember.address2 = elements[2] || "";

                    currentMember.trace.address1 = "N3-01";
                    currentMember.trace.address2 = "N3-02";
                }
                break;

            case "N4":
                if (currentMember) {
                    currentMember.city = elements[1] || "";
                    currentMember.state = elements[2] || "";
                    currentMember.zip = elements[3] || "";
                    // elements[4] = country code, elements[5] = location qualifier (CY=county), elements[6] = location identifier
                    if (elements[5] === "CY" && elements[6]) {
                        currentMember.countyCode = elements[6];
                        currentMember.trace.countyCode = "N4-06";
                    }

                    currentMember.trace.city = "N4-01";
                    currentMember.trace.state = "N4-02";
                    currentMember.trace.zip = "N4-03";
                }
                break;

            case "DMG": {
                if (currentMember) {
                    currentMember.dob = elements[2] || "";
                    currentMember.gender = elements[3] || "";

                    const raceEthnicityRaw = elements[5] || "";
                    // Some files use comma as race code separator when no ISA is present
                    let raceCodes = splitComposite(raceEthnicityRaw, componentSeparator);
                    if (raceCodes.length === 1 && raceEthnicityRaw.includes(",")) {
                        raceCodes = splitComposite(raceEthnicityRaw, ",");
                    }
                    currentMember.raceEthnicityCodes = raceCodes;

                    currentMember.trace.dob = "DMG-02";
                    currentMember.trace.gender = "DMG-03";
                    currentMember.trace.raceEthnicityCodes = "DMG-05";
                }
                break;
            }

            case "LUI": {
                if (currentMember) {
                    const languageCode = elements[2] || "";
                    const useIndicator = elements[4] || "";

                    if (useIndicator === "6") {
                        currentMember.writtenLanguage = languageCode;
                        currentMember.trace.writtenLanguage = "LUI-02 / LUI-04=6";
                    } else if (useIndicator === "7") {
                        currentMember.spokenLanguage = languageCode;
                        currentMember.trace.spokenLanguage = "LUI-02 / LUI-04=7";
                    } else if (!currentMember.spokenLanguage) {
                        currentMember.spokenLanguage = languageCode;
                        currentMember.trace.spokenLanguage = "LUI-02";
                    }
                }
                break;
            }

            case "DTP": {
                const qualifier = elements[1];
                const value = elements[3] || "";

                if (in2700Loop && currentFinancialEntry) {
                    currentFinancialEntry.date = value;
                } else if (!currentMember && qualifier === "382") {
                    result.enrollment.eligibilityBeginDate = value;
                    result.enrollment.trace.eligibilityBeginDate = "DTP*382-03";
                } else if (currentCoverage) {
                    currentCoverage.dates = currentCoverage.dates || {};
                    currentCoverage.trace = currentCoverage.trace || {};
                    currentCoverage.dates[qualifier] = value;
                    currentCoverage.trace[`date_${qualifier}`] = `DTP*${qualifier}-03`;
                } else if (currentMember) {
                    currentMember.dates[qualifier] = value;
                    currentMember.trace = currentMember.trace || {};
                    currentMember.trace[`date_${qualifier}`] = `DTP*${qualifier}-03`;

                    if (qualifier === "356" && currentMember.isSubscriber && !result.enrollment.eligibilityStartDate) {
                        result.enrollment.eligibilityStartDate = value;
                        result.enrollment.trace.eligibilityStartDate = "DTP*356-03";
                    }

                    if (qualifier === "357" && currentMember.isSubscriber && !result.enrollment.eligibilityEndDate) {
                        result.enrollment.eligibilityEndDate = value;
                        result.enrollment.trace.eligibilityEndDate = "DTP*357-03";
                    }
                }
                break;
            }

            case "PER":
                if (currentMember && elements[1] === "IP") {
                    // PER*IP**HP*phone*EM*email
                    for (let i = 2; i < elements.length - 1; i += 2) {
                        const qualifier = elements[i];
                        const value = elements[i + 1] || "";
                        if (qualifier === "HP" || qualifier === "TE") {
                            currentMember.phone = value;
                            currentMember.trace.phone = `PER*IP-${i + 1}`;
                        } else if (qualifier === "EM") {
                            currentMember.email = value;
                            currentMember.trace.email = `PER*IP-${i + 1}`;
                        }
                    }
                }
                break;

            case "AMT":
                if (currentCoverage && elements[1] === "P3") {
                    currentCoverage.grossPremiumAmount = toNumber(elements[2]);
                    currentCoverage.trace = currentCoverage.trace || {};
                    currentCoverage.trace.grossPremiumAmount = "AMT*P3";
                }
                break;

            case "HD":
                if (currentMember) {
                    finalizeCoverage();
                    currentCoverage = {
                        maintenanceTypeCode: elements[1] || "",
                        insuranceLineCode: elements[3] || "",
                        planCoverageDescription: elements[4] || "",
                        coverageLevelCode: elements[5] || "",
                        dates: {},
                        trace: {
                            maintenanceTypeCode: "HD-01",
                            insuranceLineCode: "HD-03",
                            planCoverageDescription: "HD-04",
                            coverageLevelCode: "HD-05",
                        },
                    };
                }
                break;

            case "LS":
                if (elements[1] === "2700" && currentMember) {
                    in2700Loop = true;
                    currentFinancialLabel = "";
                    currentFinancialEntry = finalizeFinancialEntry(currentMember, currentFinancialEntry);
                }
                break;

            case "LX":
                if (in2700Loop && currentMember) {
                    currentFinancialEntry = finalizeFinancialEntry(currentMember, currentFinancialEntry);
                }
                break;

            case "LE":
                if (elements[1] === "2700" && currentMember) {
                    currentFinancialEntry = finalizeFinancialEntry(currentMember, currentFinancialEntry);
                    in2700Loop = false;
                    currentFinancialLabel = "";
                }
                break;

            case "SE":
                finalizeMember();
                result.transaction = {
                    ...result.transaction,
                    includedSegmentCount: elements[1],
                    endingControlNumber: elements[2],
                };
                break;

            default:
                result.validation.unrecognizedSegments.push(elements.join("*"));
                break;
        }
    }

    finalizeMember();
    deriveEnrollmentSummary(result);

    result.validation.memberCount = result.members.length;

    if (!result.transaction.transactionSetIdentifier) {
        result.validation.errors.push("ST segment was not found.");
    }

    if (
        result.transaction.transactionSetIdentifier &&
        result.transaction.transactionSetIdentifier !== "834"
    ) {
        result.validation.errors.push(
            `Unexpected transaction set identifier: ${result.transaction.transactionSetIdentifier}`
        );
    }

    if (!result.members.length) {
        result.validation.errors.push("No INS member loops were found.");
    }

    // ── Tier 1 code-set lookup tables ────────────────────────────────────────
    const VALID_RELATIONSHIP_CODES = new Set([
        "18", // Self (subscriber)
        "01", // Spouse
        "19", // Child
        "15", // Ward
        "17", // Step child
        "03", // Father or Mother
        "04", // Grandfather or Grandmother
        "05", // Grandson or Granddaughter
        "07", // Nephew or Niece
        "10", // Foster child
        "21", // Unknown
        "39", // Organ Donor
        "40", // Cadaver Donor
        "41", // Injured Plaintiff
        "43", // Life Partner
        "53", // Life Insurance Beneficiary
        "G8", // Other Relationship
    ]);

    const VALID_MAINTENANCE_TYPE_CODES = new Set([
        "001", // Change
        "002", // Delete
        "021", // Addition
        "024", // Cancellation or Termination
        "025", // Reinstatement
        "026", // Correction
        "030", // Audit or Compare
        "032", // Employee Information Not Available
    ]);

    const VALID_MAINTENANCE_REASON_CODES = new Set([
        "01", // Divorce
        "02", // Birth
        "03", // Death
        "04", // Retirement
        "05", // Adoption
        "06", // Strike
        "07", // Termination of Benefits
        "08", // Termination of Employment
        "09", // Consolidation (COBRA)
        "10", // Disability
        "11", // Educational or Student
        "14", // Leave of Absence (FMLA)
        "15", // Leave of Absence (Non-FMLA)
        "16", // Layoff
        "17", // Marital Status Change
        "18", // Marriage
        "20", // No Longer Active
        "21", // Moved to Part-Time
        "22", // Open Enrollment Period
        "25", // Change of Address
        "26", // Change in Coverage
        "27", // Employee Status Change
        "28", // Benefits Cancel on this Date
        "30", // Enrollment Change (HIPAA)
        "31", // Medicare
        "32", // Medicare Part A
        "33", // Medicare Part B
        "37", // Qualifying Life Event
        "38", // Change in Benefits
        "40", // Employment Status Change (COBRA)
        "AI", // Involuntary Disenrollment
        "AV", // Voluntary Disenrollment
        "BJ", // Not in Service Area
        "CC", // Carrier Change
        "XN", // Non-Payment of Premium
        "XT", // Termination
        "ZZ", // Mutually Defined
    ]);

    const VALID_BENEFIT_STATUS_CODES = new Set([
        "A", // Active
        "C", // COBRA
        "S", // Surviving Insured
        "T", // Tax Equity Fiscal Responsibility Act (TEFRA)
    ]);

    const VALID_INSURANCE_LINE_CODES = new Set([
        "AK",  // Accidental Death & Dismemberment
        "BL",  // Blue Cross/Blue Shield
        "CH",  // Champus
        "CI",  // Commercial Insurance Code
        "CO",  // COBRA
        "DB",  // Disability Benefits
        "DE",  // Dental
        "DEN", // Dental (common alt)
        "DS",  // Disability
        "DT",  // Dental Capitation
        "EP",  // Employee Assistance Program
        "FA",  // Flexible Spending Account
        "GS",  // Group Supplemental
        "HC",  // Health Care Flexible Spending Account
        "HIP", // Health Insurance Premium Payment
        "HLT", // Health (common alt)
        "HP",  // Health
        "HV",  // Health Maintenance Organization (HMO)
        "LD",  // Long-Term Disability
        "LI",  // Life
        "LT",  // Long-Term Care
        "LTC", // Long-Term Care (common alt)
        "MA",  // Medicare Part A
        "MB",  // Medicare Part B
        "MH",  // Mental Health
        "MM",  // Major Medical
        "OT",  // Other
        "PE",  // Pediatric
        "PP",  // Prescription Drug (PPO)
        "PRA", // Prescription Drug Plan A
        "PRE", // Prescription Drug (common)
        "RX",  // Prescription Drug
        "SK",  // Skip
        "ST",  // Supplemental
        "TRS", // TRICARE Supplemental
        "VA",  // Veterans Affairs
        "VIS", // Vision (common alt)
        "VS",  // Vision
        "WC",  // Workers Compensation
        "WCC", // Workers Compensation (fee schedule)
    ]);

    const VALID_GENDER_CODES = new Set(["M", "F", "U"]);

    const VALID_BGN_PURPOSE_CODES = new Set([
        "00", // Original
        "15", // Re-submission
        "22", // Information Copy
    ]);

    const VALID_COVERAGE_LEVEL_CODES = new Set([
        "CHD", // Children Only
        "DEP", // Dependents Only
        "E1C", // Employee and One Dependent
        "ECH", // Employee and Children
        "EMP", // Employee Only
        "ESP", // Employee and Spouse
        "FAM", // Family
        "IND", // Individual
        "SPC", // Spouse and Children
        "SPO", // Spouse Only
        "TWO", // Two-Party
    ]);

    const VALID_MARITAL_STATUS_CODES = new Set([
        "B", // Registered Domestic Partner (CA)
        "D", // Divorced
        "I", // Single
        "M", // Married
        "R", // Registered Domestic Partner (CMS FFE)
        "S", // Separated
        "U", // Unmarried / Never Married
        "W", // Widowed
        "X", // Legally Separated
    ]);

    const VALID_EMPLOYMENT_STATUS_CODES = new Set([
        "AC", // Active
        "AE", // Active Military — Overseas
        "AO", // Active Military — USA
        "AU", // Automobile
        "FT", // Full-time
        "PT", // Part-time
        "RE", // Retired
        "RT", // Retired
        "TE", // Terminated
        "TT", // Total and Permanent Disability
        "XO", // COBRA
    ]);
    // ─────────────────────────────────────────────────────────────────────────

    // BGN purpose code check (transaction-level)
    if (
        result.transaction.purposeCode &&
        !VALID_BGN_PURPOSE_CODES.has(result.transaction.purposeCode)
    ) {
        result.validation.warnings.push(
            `BGN-01 purpose code "${result.transaction.purposeCode}" is not a recognised X12 834 value.`
        );
    }

    result.members.forEach((member, index) => {
        const label = `Member ${index + 1}`;

        if (!member.firstName && !member.lastName) {
            result.validation.warnings.push(`${label} is missing a name.`);
            result.validation.summary.missingNames += 1;
        }

        if (!member.memberId && !member.subscriberId) {
            result.validation.warnings.push(`${label} is missing both memberId and subscriberId.`);
            result.validation.summary.missingIds += 1;
        }

        if (!member.dob) {
            result.validation.warnings.push(`${label} is missing date of birth.`);
            result.validation.summary.missingDob += 1;
        }

        if (!member.coverages.length) {
            result.validation.warnings.push(`${label} has no HD coverage segment.`);
            result.validation.summary.missingCoverage += 1;
        }

        // INS-02 relationship code
        if (member.relationshipCode && !VALID_RELATIONSHIP_CODES.has(member.relationshipCode)) {
            result.validation.warnings.push(
                `${label} has unrecognised INS-02 relationship code "${member.relationshipCode}".`
            );
        }

        // INS-03 maintenance type code
        if (member.maintenanceTypeCode && !VALID_MAINTENANCE_TYPE_CODES.has(member.maintenanceTypeCode)) {
            result.validation.warnings.push(
                `${label} has unrecognised INS-03 maintenance type code "${member.maintenanceTypeCode}".`
            );
        }

        // INS-04 maintenance reason code
        if (member.maintenanceReasonCode && !VALID_MAINTENANCE_REASON_CODES.has(member.maintenanceReasonCode)) {
            result.validation.warnings.push(
                `${label} has unrecognised INS-04 maintenance reason code "${member.maintenanceReasonCode}".`
            );
        }

        // INS-05 benefit status code
        if (member.benefitStatusCode && !VALID_BENEFIT_STATUS_CODES.has(member.benefitStatusCode)) {
            result.validation.warnings.push(
                `${label} has unrecognised INS-05 benefit status code "${member.benefitStatusCode}".`
            );
        }

        // DMG-03 gender code
        if (member.gender && !VALID_GENDER_CODES.has(member.gender)) {
            result.validation.warnings.push(
                `${label} has unrecognised DMG-03 gender code "${member.gender}".`
            );
        }

        // INS-11 marital status code
        if (member.maritalStatusCode && !VALID_MARITAL_STATUS_CODES.has(member.maritalStatusCode.toUpperCase())) {
            result.validation.warnings.push(
                `${label} has unrecognised INS-11 marital status code "${member.maritalStatusCode}".`
            );
        }

        // INS-08 employment status code
        if (member.employmentStatusCode && !VALID_EMPLOYMENT_STATUS_CODES.has(member.employmentStatusCode.toUpperCase())) {
            result.validation.warnings.push(
                `${label} has unrecognised INS-08 employment status code "${member.employmentStatusCode}".`
            );
        }

        // HD-03 insurance line code and HD-05 coverage level code
        member.coverages.forEach((coverage, ci) => {
            const covLabel = `${label} Coverage ${ci + 1}`;

            if (coverage.insuranceLineCode && !VALID_INSURANCE_LINE_CODES.has(coverage.insuranceLineCode)) {
                result.validation.warnings.push(
                    `${covLabel} has unrecognised HD-03 insurance line code "${coverage.insuranceLineCode}".`
                );
            }

            if (coverage.coverageLevelCode && !VALID_COVERAGE_LEVEL_CODES.has(coverage.coverageLevelCode)) {
                result.validation.warnings.push(
                    `${covLabel} has unrecognised HD-05 coverage level code "${coverage.coverageLevelCode}".`
                );
            }
        });
    });

    // ── Tier 2 date logic ─────────────────────────────────────────────────────
    const TODAY = new Date();
    const YEAR_2000 = new Date("2000-01-01");
    const MAX_FUTURE = new Date(TODAY.getFullYear() + 5, TODAY.getMonth(), TODAY.getDate());

    /**
     * Parse a CCYYMMDD string into a Date. Returns null if the string is absent,
     * wrong length, or produces an invalid calendar date.
     */
    function parseDtpDate(raw) {
        if (!raw || raw.length !== 8) return null;
        const y = parseInt(raw.slice(0, 4), 10);
        const m = parseInt(raw.slice(4, 6), 10);
        const d = parseInt(raw.slice(6, 8), 10);
        if (m < 1 || m > 12 || d < 1 || d > 31) return null;
        const dt = new Date(y, m - 1, d);
        // Verify no rollover (e.g. Feb 30 → Mar)
        if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
        return dt;
    }

    /**
     * Validate a single CCYYMMDD value and push a warning if it is malformed.
     * Returns the parsed Date (or null) for further comparison checks.
     */
    function validateDtpField(raw, fieldLabel) {
        if (!raw) return null;
        if (!/^\d{8}$/.test(raw)) {
            result.validation.warnings.push(
                `${fieldLabel} date "${raw}" is not in CCYYMMDD format.`
            );
            return null;
        }
        const dt = parseDtpDate(raw);
        if (!dt) {
            result.validation.warnings.push(
                `${fieldLabel} date "${raw}" is not a valid calendar date (e.g. month > 12 or day out of range).`
            );
        }
        return dt;
    }

    result.members.forEach((member, index) => {
        const label = `Member ${index + 1}`;

        // ── DOB checks ──────────────────────────────────────────────────────
        if (member.dob) {
            const dob = validateDtpField(member.dob, `${label} DMG-02 (DOB)`);
            if (dob) {
                if (dob > TODAY) {
                    result.validation.warnings.push(
                        `${label} DMG-02 (DOB) "${member.dob}" is in the future.`
                    );
                } else {
                    const ageYears = (TODAY - dob) / (1000 * 60 * 60 * 24 * 365.25);
                    if (ageYears > 120) {
                        result.validation.warnings.push(
                            `${label} DMG-02 (DOB) "${member.dob}" implies an age over 120 years.`
                        );
                    }
                }
            }
        }

        // ── Member-level DTP dates ───────────────────────────────────────────
        Object.entries(member.dates || {}).forEach(([qualifier, raw]) => {
            const fieldLabel = `${label} DTP*${qualifier}`;
            const dt = validateDtpField(raw, fieldLabel);
            if (dt) {
                if (dt < YEAR_2000) {
                    result.validation.warnings.push(
                        `${fieldLabel} date "${raw}" is before 2000-01-01, which is likely a data error.`
                    );
                }
                if (dt > MAX_FUTURE) {
                    result.validation.warnings.push(
                        `${fieldLabel} date "${raw}" is more than 5 years in the future.`
                    );
                }
            }
        });

        // ── Coverage-level DTP dates + begin/end coherence ───────────────────
        member.coverages.forEach((coverage, ci) => {
            const covLabel = `${label} Coverage ${ci + 1}`;

            const beginRaw = coverage.dates?.["348"];
            const endRaw   = coverage.dates?.["349"] || coverage.dates?.["357"];

            const begin = beginRaw ? validateDtpField(beginRaw, `${covLabel} DTP*348 (begin)`) : null;
            const end   = endRaw
                ? validateDtpField(endRaw, `${covLabel} DTP*${coverage.dates?.["349"] ? "349" : "357"} (end/term)`)
                : null;

            // Validate all other coverage dates for format + plausibility
            Object.entries(coverage.dates || {}).forEach(([qualifier, raw]) => {
                if (qualifier === "348" || qualifier === "349" || qualifier === "357") return; // already handled above
                const fieldLabel = `${covLabel} DTP*${qualifier}`;
                const dt = validateDtpField(raw, fieldLabel);
                if (dt) {
                    if (dt < YEAR_2000) {
                        result.validation.warnings.push(
                            `${fieldLabel} date "${raw}" is before 2000-01-01, which is likely a data error.`
                        );
                    }
                    if (dt > MAX_FUTURE) {
                        result.validation.warnings.push(
                            `${fieldLabel} date "${raw}" is more than 5 years in the future.`
                        );
                    }
                }
            });

            // Benefit begin must not be after benefit end/term
            if (begin && end && begin > end) {
                result.validation.warnings.push(
                    `${covLabel} benefit begin date "${beginRaw}" is after the end/termination date "${endRaw}".`
                );
            }

            // Termination before begin
            if (begin && end && end < begin) {
                // already caught above — no duplicate needed
            }

            // Plausibility on begin/end individually
            [{ dt: begin, raw: beginRaw, q: "348 (begin)" }, { dt: end, raw: endRaw, q: "349/357 (end)" }].forEach(({ dt, raw, q }) => {
                if (!dt || !raw) return;
                if (dt < YEAR_2000) {
                    result.validation.warnings.push(
                        `${covLabel} DTP*${q} date "${raw}" is before 2000-01-01, which is likely a data error.`
                    );
                }
                if (dt > MAX_FUTURE) {
                    result.validation.warnings.push(
                        `${covLabel} DTP*${q} date "${raw}" is more than 5 years in the future.`
                    );
                }
            });
        });
    });
    // ─────────────────────────────────────────────────────────────────────────

    // ── Structural checks ────────────────────────────────────────────────────

    // SE segment count must match actual segment count
    const declaredCount = parseInt(result.transaction.includedSegmentCount, 10);
    if (!isNaN(declaredCount) && declaredCount !== result.validation.totalSegments) {
        result.validation.warnings.push(
            `SE-01 declares ${declaredCount} segments but ${result.validation.totalSegments} were counted. The file may be truncated or malformed.`
        );
    }

    // Exactly one subscriber (INS-01 = Y)
    const subscribers = result.members.filter((m) => m.isSubscriber);
    if (subscribers.length === 0 && result.members.length > 0) {
        result.validation.warnings.push(
            "No subscriber found (no INS loop with INS-01=Y). Every transaction must have exactly one subscriber."
        );
    } else if (subscribers.length > 1) {
        result.validation.warnings.push(
            `${subscribers.length} members are marked as subscriber (INS-01=Y). A transaction must have exactly one subscriber.`
        );
    }

    // Self (relationship 18) must be the subscriber
    result.members.forEach((member, index) => {
        const label = `Member ${index + 1}`;
        if (member.relationshipCode === "18" && !member.isSubscriber) {
            result.validation.warnings.push(
                `${label} has relationship code 18 (Self) but is not flagged as the subscriber (INS-01 must be Y for self).`
            );
        }
        // Subscriber must not have a dependent relationship code
        if (member.isSubscriber && member.relationshipCode && member.relationshipCode !== "18") {
            result.validation.warnings.push(
                `${label} is the subscriber (INS-01=Y) but has relationship code "${member.relationshipCode}" instead of 18 (Self).`
            );
        }
    });

    // Subscriber must have a REF*0F subscriber ID
    subscribers.forEach((member) => {
        if (!member.subscriberId) {
            result.validation.warnings.push(
                "Subscriber is missing a REF*0F (Subscriber ID). This is required by the 834 spec."
            );
        }
    });
    // ─────────────────────────────────────────────────────────────────────────

    // ── Group D — 2750 Loop Code Sets (CMS FFE Companion Guide v7.2) ─────────

    // Valid SEP REASON codes (Appendix A, Table 26)
    const VALID_SEP_REASON_CODES = new Set([
        "02-BIRTH",
        "05-ADOPTION",
        "07-TERMINATION OF BENEFITS",
        "32-MARRIAGE",
        "43-CHANGE OF LOCATION",
        "FC",  // Financial Change
        "NE",  // Newly Eligible
        "QS",  // QSEHRA
        "HR",  // ICHRA
    ]);

    // Valid ADDL MAINT REASON codes (Appendix C, Tables 29 & 30 — inbound + outbound)
    const VALID_AMRC_CODES = new Set([
        // Effectuation
        "CONFIRM",
        // Cancellations — inbound
        "CANCEL",
        "CANCEL-FLC",
        "CANCEL-FRD",
        "CANCEL-HICS",
        "CANCEL-OTH",
        "CANCEL-RESCIND",
        "CANCEL-ANTIDUPLICATION",
        "CANCEL-OUT-OF-AREA",
        // Cancellations — outbound
        "CANCELCIC",
        "CANCEL-NLE",
        "CANCEL-OTH-COVERAGE",
        "CANCEL-PDM",
        "CANCEL-CARRYFORWARD",
        // Terminations — inbound
        "TERM",
        "TERM-OTH",
        "TERM-HICS",
        "TERM-ANTIDUPLICATION",
        // Terminations — outbound
        "TERMCIC",
        "TERM-NLE",
        "TERM-OTH-COVERAGE",
        "TERM-PDM",
        // Maintenance
        "ISSUER MAINT",
        "NO CHANGE",
        "AGENT BROKER INFO",
        "CSR VARIANT CHANGE",
        "FINANCIAL CHANGE",
        "DEMOGRAPHIC CHANGE",
        // Reinstatement
        "ISSUER – REINSTATEMENT",
        // Initial enrollment / BAR
        "CIC",
        "PASSIVE BAR",
        "PASSIVE – B2S",
        "PASSIVE – INITIAL",
        "PASSIVE – NEW SUBSCRIBER",
        "PASSIVE – NEW SUBSCRIBER (B2S)",
        "PASSIVE REENROLL – NEW TO ISSUER",
        "PASSIVE REENROLL – NEW TO ISSUER (B2S)",
    ]);

    // Valid CMS FFE Appendix B race/ethnicity CDC codes (exact 20 from Table 28)
    const VALID_RACE_ETHNICITY_CODES = new Set([
        "1002-5", // American Indian or Alaskan Native
        "2028-9", // Other Asian
        "2029-7", // Asian Indian
        "2034-7", // Chinese
        "2036-2", // Filipino
        "2039-6", // Japanese
        "2040-4", // Korean
        "2047-9", // Vietnamese
        "2054-5", // Black or African American
        "2079-2", // Native Hawaiian
        "2080-0", // Samoan
        "2086-7", // Guamanian or Chamorro
        "2106-3", // White
        "2131-1", // Other Race
        "2135-2", // Hispanic, Latino, or Spanish Origin
        "2148-5", // Mexican, Mexican American, or Chicano/a
        "2180-8", // Puerto Rican
        "2182-4", // Cuban
        "2186-5", // Not Hispanic
        "2500-7", // Other Pacific Islander
    ]);

    // RATING AREA format: R-XX### where XX = 2-letter state, ### = 3-digit number (e.g. R-VA010)
    const RATING_AREA_PATTERN = /^R-[A-Z]{2}\d{3}$/;

    result.members.forEach((member, index) => {
        const label = `Member ${index + 1}`;
        const summary = member.financials?.summary || {};

        // SEP REASON code
        if (summary.sepReason) {
            const norm = summary.sepReason.trim().toUpperCase();
            if (!VALID_SEP_REASON_CODES.has(norm)) {
                result.validation.warnings.push(
                    `${label} 2750 SEP REASON "${summary.sepReason}" is not a recognised CMS FFE SEP reason code (Appendix A).`
                );
            }
        }

        // ADDL MAINT REASON (AMRC)
        if (summary.addlMaintReason) {
            const norm = summary.addlMaintReason.trim().toUpperCase();
            // Normalise the dash variant used in "ISSUER – REINSTATEMENT" for comparison
            const normDash = norm.replace(/\u2013/g, "-");
            const matchFound = [...VALID_AMRC_CODES].some(
                (v) => v.toUpperCase() === norm || v.toUpperCase() === normDash
            );
            if (!matchFound) {
                result.validation.warnings.push(
                    `${label} 2750 ADDL MAINT REASON "${summary.addlMaintReason}" is not a recognised CMS FFE AMRC value (Appendix C).`
                );
            }
        }

        // RATING AREA format
        if (summary.ratingArea) {
            if (!RATING_AREA_PATTERN.test(summary.ratingArea.trim())) {
                result.validation.warnings.push(
                    `${label} 2750 RATING AREA "${summary.ratingArea}" does not match the expected format R-XX### (e.g. R-VA010).`
                );
            }
        }

        // Race/Ethnicity codes (DMG-05)
        if (Array.isArray(member.raceEthnicityCodes) && member.raceEthnicityCodes.length > 0) {
            if (member.raceEthnicityCodes.length > 10) {
                result.validation.warnings.push(
                    `${label} has ${member.raceEthnicityCodes.length} race/ethnicity codes; the CMS FFE guide allows a maximum of 10.`
                );
            }
            member.raceEthnicityCodes.forEach((code) => {
                if (code && !VALID_RACE_ETHNICITY_CODES.has(code.trim())) {
                    result.validation.warnings.push(
                        `${label} race/ethnicity code "${code}" is not in the CMS FFE Appendix B CDC code list.`
                    );
                }
            });
        }
    });
    // ─────────────────────────────────────────────────────────────────────────

    // ── Field Format / Content Checks ────────────────────────────────────────

    // BGN-02 reference number must be 4–9 digits
    const bgnRef = result.transaction.referenceNumber || "";
    if (bgnRef && !/^\d{4,9}$/.test(bgnRef)) {
        result.validation.warnings.push(
            `BGN-02 reference number "${bgnRef}" must be a 4–9 digit numeric value.`
        );
    }

    // Duplicate REF*0F subscriber IDs across members
    const subscriberIdsSeen = new Map();
    result.members.forEach((member, index) => {
        if (!member.subscriberId) return;
        if (subscriberIdsSeen.has(member.subscriberId)) {
            const firstIndex = subscriberIdsSeen.get(member.subscriberId);
            result.validation.warnings.push(
                `Member ${index + 1} has the same REF*0F subscriber ID "${member.subscriberId}" as Member ${firstIndex + 1}. Subscriber IDs must be unique within a transaction.`
            );
        } else {
            subscriberIdsSeen.set(member.subscriberId, index);
        }
    });

    result.members.forEach((member, index) => {
        const label = `Member ${index + 1}`;

        // REF*SY (SSN) — 9 digits, no all-repeating digits
        if (member.ssn) {
            if (!/^\d{9}$/.test(member.ssn)) {
                result.validation.warnings.push(
                    `${label} REF*SY (SSN) "${member.ssn}" must be exactly 9 digits.`
                );
            } else if (/^(\d)\1{8}$/.test(member.ssn)) {
                result.validation.warnings.push(
                    `${label} REF*SY (SSN) "${member.ssn}" consists of repeating digits and will be rejected by CMS.`
                );
            }
        }

        // ZIP code — 5 or 9 digits, no all-repeating digits
        if (member.zip) {
            const zipClean = member.zip.replace("-", "");
            if (!/^\d{5}$/.test(zipClean) && !/^\d{9}$/.test(zipClean)) {
                result.validation.warnings.push(
                    `${label} N4-03 ZIP code "${member.zip}" must be 5 or 9 digits.`
                );
            } else if (/^(\d)\1+$/.test(zipClean)) {
                result.validation.warnings.push(
                    `${label} N4-03 ZIP code "${member.zip}" consists of repeating digits and will be rejected by CMS.`
                );
            }
        }

        // Phone — no all-repeating digits (checks both phone values parsed from PER)
        if (member.phone) {
            const phoneDigits = member.phone.replace(/\D/g, "");
            if (/^(\d)\1+$/.test(phoneDigits)) {
                result.validation.warnings.push(
                    `${label} phone number "${member.phone}" consists of repeating digits and will be rejected by CMS.`
                );
            }
        }

        // Email — must contain @
        if (member.email && !member.email.includes("@")) {
            result.validation.warnings.push(
                `${label} email "${member.email}" does not appear to be a valid email address (missing @).`
            );
        }

        // DMG-04 marital status — CMS guide: only valid on subscriber loop
        if (member.maritalStatusCode && !member.isSubscriber) {
            result.validation.warnings.push(
                `${label} has a marital status code (INS-11/DMG-04) "${member.maritalStatusCode}" but is not the subscriber. Per CMS FFE guide, marital status is only sent on the subscriber loop.`
            );
        }

        // INS-08 employment status — CMS guide: only valid on subscriber loop
        if (member.employmentStatusCode && !member.isSubscriber) {
            result.validation.warnings.push(
                `${label} has an employment status code (INS-08) "${member.employmentStatusCode}" but is not the subscriber. Per CMS FFE guide, employment status is only sent on the subscriber loop.`
            );
        }
    });
    // ─────────────────────────────────────────────────────────────────────────

    return result;
}