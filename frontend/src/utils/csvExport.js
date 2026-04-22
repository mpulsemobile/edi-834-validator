import {
    getRelationshipLabel,
    getRaceEthnicityLabels,
    getLanguageLabel,
    getMaintenanceTypeLabel,
    getMaintenanceReasonLabel,
    getMaritalStatusLabel,
    getBenefitStatusLabel,
    getEmploymentStatusLabel,
    getCoverageLevelLabel,
    getSepReasonLabel,
} from "./formatter";
import { formatDate } from "./parse834";

function esc(value) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // Wrap in quotes if value contains comma, newline, or quote
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function row(cells) {
    return cells.map(esc).join(",");
}

const MEMBER_HEADERS = [
    // Identity
    "#",
    "Role",
    "Last Name",
    "First Name",
    "Middle Name",
    "Suffix",
    "Member ID",
    "Subscriber ID",
    "Enrollment ID",
    "Exchange Member ID",
    "SSN",
    // Transaction
    "Maintenance Type Code",
    "Maintenance Type",
    "Maintenance Reason Code",
    "Maintenance Reason",
    "Relationship Code",
    "Relationship",
    "Benefit Status Code",
    "Benefit Status",
    "Employment Status Code",
    "Employment Status",
    // Demographics
    "Date of Birth",
    "Gender",
    "Marital Status Code",
    "Marital Status",
    "Race/Ethnicity Codes",
    "Race/Ethnicity Labels",
    "Spoken Language",
    "Written Language",
    // Contact
    "Phone",
    "Email",
    // Address
    "Address 1",
    "Address 2",
    "City",
    "State",
    "Zip",
    "County Code",
    // Dates (member-level)
    "Eligibility Begin (DTP*356)",
    "Eligibility End (DTP*357)",
    "SEP Effective Date (DTP*336)",
    "Death Date",
    // Coverage
    "Coverage Line",
    "Coverage Level",
    "CMS Plan ID",
    "Benefit Begin Date (DTP*348)",
    "Benefit End Date (DTP*349)",
    "Coverage Termination Date (DTP*349)",
    "Gross Premium (AMT*P3)",
    // Financials summary
    "Premium Amount (PRE AMT 1)",
    "Premium Total (PRE AMT TOT)",
    "APTC Amount",
    "Total Responsible Amount",
    "Rating Area",
    "SEP Reason Code",
    "SEP Reason",
    "Source Exchange ID",
    "Is FFM",
    "ICHRA/QSEHRA",
    "QSEHRA Spouse",
    "QSEHRA Both",
    "AMRC",
];

export function exportMembersToCSV(parsed, fileName) {
    if (!parsed?.members?.length) return;

    const lines = [row(MEMBER_HEADERS)];

    parsed.members.forEach((m, index) => {
        const fin = m.financials?.summary || {};
        // Flatten coverages — one row per coverage, or one row if none
        const coverages = m.coverages?.length ? m.coverages : [null];

        coverages.forEach((c) => {
            lines.push(row([
                // Identity
                index + 1,
                m.isSubscriber ? "Subscriber" : "Dependent",
                m.lastName,
                m.firstName,
                m.middleName,
                m.suffix,
                m.memberId,
                m.subscriberId,
                m.enrollmentId,
                m.exchangeMemberId,
                m.ssn,
                // Transaction
                m.maintenanceTypeCode,
                getMaintenanceTypeLabel(m.maintenanceTypeCode),
                m.maintenanceReasonCode,
                getMaintenanceReasonLabel(m.maintenanceReasonCode),
                m.relationshipCode,
                getRelationshipLabel(m.relationshipCode, m.isSubscriber),
                m.benefitStatusCode,
                getBenefitStatusLabel(m.benefitStatusCode),
                m.employmentStatusCode,
                getEmploymentStatusLabel(m.employmentStatusCode),
                // Demographics
                formatDate(m.dob),
                m.gender,
                m.maritalStatusCode,
                getMaritalStatusLabel(m.maritalStatusCode),
                (m.raceEthnicityCodes || []).join(" | "),
                getRaceEthnicityLabels(m.raceEthnicityCodes || []).join(" | "),
                getLanguageLabel(m.spokenLanguage),
                getLanguageLabel(m.writtenLanguage),
                // Contact
                m.phone,
                m.email,
                // Address
                m.address1,
                m.address2,
                m.city,
                m.state,
                m.zip,
                m.countyCode,
                // Dates
                formatDate(m.dates?.["356"]),
                formatDate(m.dates?.["357"]),
                formatDate(m.dates?.["336"]),
                formatDate(m.deathDate),
                // Coverage
                c ? c.insuranceLineCode : "",
                c ? getCoverageLevelLabel(c.coverageLevelCode) : "",
                c ? (c.cmsPlanId || "") : "",
                c ? formatDate(c.dates?.["348"]) : "",
                c ? formatDate(c.dates?.["349"]) : "",
                c ? formatDate(c.dates?.["349"]) : "",  // termination = same DTP*349
                c ? (c.grossPremiumAmount ?? "") : "",
                // Financials
                fin.currentPremiumAmount ?? "",
                fin.currentPremiumTotalAmount ?? "",
                fin.currentAptcAmount ?? "",
                fin.currentTotalResponsibleAmount ?? "",
                fin.ratingArea || "",
                fin.sepReason || "",
                getSepReasonLabel(fin.sepReason),
                fin.sourceExchangeId || "",
                fin.isFFM !== undefined ? (fin.isFFM === "true" ? "Yes" : fin.isFFM === "false" ? "No" : fin.isFFM) : "",
                fin.ichraQsehra !== undefined ? (fin.ichraQsehra === "Y" ? "Yes" : fin.ichraQsehra === "N" ? "No" : fin.ichraQsehra) : "",
                fin.qsehraSpouse !== undefined ? (fin.qsehraSpouse === "Y" ? "Yes" : fin.qsehraSpouse === "N" ? "No" : fin.qsehraSpouse) : "",
                fin.qsehraBoth || "",
                fin.addlMaintReason || "",
            ]));
        });
    });

    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const baseName = (fileName || "edi-834-export").replace(/\.edi$/i, "");
    link.href = url;
    link.download = `${baseName}-members.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
