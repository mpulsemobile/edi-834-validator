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
                result.validation.unrecognizedSegments.push(segment);
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
    });

    return result;
}