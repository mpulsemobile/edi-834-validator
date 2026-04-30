import { useState, useMemo } from "react";
import { parse834, formatDate } from "../utils/parse834";
import { exportMembersToCSV } from "../utils/csvExport";
import Generate834Modal from "../components/Generate834Modal";
import CompareEdiModal from "../components/CompareEdiModal";
import {
  getRelationshipLabel,
  getRaceEthnicityLabels,
  getLanguageLabel,
  getMaintenanceTypeLabel,
  getMaintenanceReasonLabel,
  getMaritalStatusLabel,
  getSepReasonLabel,
  getQsehraBothLabel,
  getAmrcLabel,
  getOriginCodeLabel,
  getCoverageLevelLabel,
} from "../utils/formatter";

const sample834 = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *260421*1200*^*00501*000000001*0*T*:~
GS*BE*SENDER*RECEIVER*20260421*1200*1*X*005010X220A1~
ST*834*0001*005010X220A1~
BGN*00*REF12345*20260421*1200****4~
N1*P5*ACME EMPLOYER*FI*123456789~
N1*IN*HEALTH PLAN*FI*987654321~
INS*Y*18*021***A***FT~
REF*0F*S123456789~
NM1*IL*1*RANU*AMANDEEP****34*S123456789~
N3*3504 YACHT CLUB CT~
N4*KISSIMMEE*FL*34746~
DMG*D8*19810915*M~
HD*021**HLT*MEDICAL PLAN*EMP~
DTP*348*D8*20260101~
DTP*349*D8*20261231~
INS*N*19*021***A***FT~
REF*0F*S123456789~
NM1*IL*1*RANU*DEPENDENT****34*D987654321~
DMG*D8*20120101*F~
HD*021**DEN*DENTAL PLAN*DEP~
DTP*348*D8*20260101~
SE*21*0001~
GE*1*1~
IEA*1*000000001~`;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    color: "#0f172a",
  },
  pageBody: {
    padding: "32px 32px",
  },
  container: {
    maxWidth: "100%",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "28px",
    background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)",
    borderRadius: "20px",
    padding: "28px 32px",
    color: "white",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
    color: "white",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#bfdbfe",
    fontSize: "15px",
  },
  actionRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "8px",
  },
  secondaryButton: {
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: "12px",
    padding: "10px 18px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  uploadLabel: {
    display: "inline-block",
    background: "#2563eb",
    color: "white",
    border: "1px solid #1d4ed8",
    borderRadius: "12px",
    padding: "10px 18px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 2px 8px rgba(37,99,235,0.45)",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px 22px",
    boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)",
  },
  cardLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "8px",
  },
  cardValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#0f172a",
  },
  section: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: 700,
    color: "#1e3a5f",
    letterSpacing: "-0.2px",
  },
  muted: {
    color: "#64748b",
    fontSize: "14px",
  },
  infoRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "8px",
  },
  badge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 600,
  },
  searchInput: {
    width: "320px",
    maxWidth: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    marginBottom: "16px",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    textAlign: "left",
    background: "#f8fafc",
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "top",
  },
  issueBadge: {
    display: "inline-block",
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: 600,
    marginRight: "6px",
    marginBottom: "6px",
  },
  coverageBadge: {
    display: "inline-block",
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: 600,
    marginRight: "6px",
    marginBottom: "6px",
  },
  pre: {
    background: "#0f172a",
    color: "#dbeafe",
    padding: "16px",
    borderRadius: "14px",
    overflowX: "auto",
    maxHeight: "420px",
    fontSize: "12px",
  },
  rawPre: {
    background: "#f8fafc",
    color: "#334155",
    padding: "16px",
    borderRadius: "14px",
    overflowX: "auto",
    maxHeight: "260px",
    fontSize: "12px",
    border: "1px solid #e2e8f0",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "14px 16px",
    borderRadius: "14px",
    marginBottom: "20px",
  },
  select: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.35)",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: 600,
    background: "rgba(255,255,255,0.15)",
    color: "white",
    minWidth: "260px",
  },
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const SCENARIOS = [
  { value: "", label: "Load Sample Scenario..." },
  // SEP Off-Exchange — Subscriber Only (Green)
  { value: `${BASE}/sample-data/01-sep-off-exchange-subscriber-only-medical.edi`, label: "01 — SEP New Enrollment: Subscriber Only — Medical" },
  { value: `${BASE}/sample-data/02-sep-off-exchange-subscriber-only-vision.edi`, label: "02 — SEP New Enrollment: Subscriber Only — Vision" },
  { value: `${BASE}/sample-data/03-sep-off-exchange-subscriber-only-dental.edi`, label: "03 — SEP New Enrollment: Subscriber Only — Dental" },
  // SEP Termination — Subscriber Only (Green)
  { value: `${BASE}/sample-data/04-sep-off-exchange-subscriber-only-medical-terminate.edi`, label: "04 — SEP Termination: Subscriber Only — Medical" },
  { value: `${BASE}/sample-data/05-sep-off-exchange-subscriber-only-dental-terminate.edi`, label: "05 — SEP Termination: Subscriber Only — Dental" },
  { value: `${BASE}/sample-data/06-sep-off-exchange-subscriber-only-vision-terminate.edi`, label: "06 — SEP Termination: Subscriber Only — Vision" },
  // Add Spouse — Subscriber Cancellation (Blue)
  { value: `${BASE}/sample-data/07-add-spouse-subscriber-cancel-medical.edi`, label: "07 — Add Spouse: Subscriber Cancellation — Medical" },
  { value: `${BASE}/sample-data/08-add-spouse-subscriber-cancel-dental.edi`, label: "08 — Add Spouse: Subscriber Cancellation — Dental" },
  { value: `${BASE}/sample-data/09-add-spouse-subscriber-cancel-vision.edi`, label: "09 — Add Spouse: Subscriber Cancellation — Vision" },
  // Add Spouse — New Enrollment: Subscriber + Spouse (Blue)
  { value: `${BASE}/sample-data/10-add-spouse-subscriber-and-spouse-medical.edi`, label: "10 — Add Spouse: New Subscriber + Spouse — Medical" },
  { value: `${BASE}/sample-data/11-add-spouse-subscriber-and-spouse-dental.edi`, label: "11 — Add Spouse: New Subscriber + Spouse — Dental" },
  { value: `${BASE}/sample-data/12-add-spouse-subscriber-and-spouse-vision.edi`, label: "12 — Add Spouse: New Subscriber + Spouse — Vision" },
  // Add Dependent to Subscriber and Spouse
  { value: `${BASE}/sample-data/13-add-dependent-to-subscriber-and-spouse.edi`, label: "13 — Add Dependent to Subscriber + Spouse" },
  // New Enrollment — Subscriber, Spouse, and Dependent
  { value: `${BASE}/sample-data/14-new-enrollment-subscriber-spouse-dependent.edi`, label: "14 — New Enrollment: Subscriber + Spouse + Dependent" },
  // New Enrollment — Subscriber, Spouse, Dependent (Multi-Coverage)
  { value: `${BASE}/sample-data/15B-new-enrollment-subscriber-spouse-dependent-medical.edi`, label: "15B — New Enrollment: Subscriber + Spouse + Dependent — Medical" },
  { value: `${BASE}/sample-data/15A-new-enrollment-subscriber-spouse-dependent-dental.edi`, label: "15A — New Enrollment: Subscriber + Spouse + Dependent — Dental" },
  { value: `${BASE}/sample-data/15C-new-enrollment-subscriber-spouse-dependent-vision.edi`, label: "15C — New Enrollment: Subscriber + Spouse + Dependent — Vision" },
];

function getMemberIssues(member) {
  const issues = [];
  if (!member.dob) issues.push("Missing DOB");
  if (!member.memberId && !member.subscriberId) issues.push("Missing ID");
  if (!member.coverages?.length) issues.push("Missing Coverage");
  if (!member.firstName && !member.lastName) issues.push("Missing Name");
  return issues;
}

function getEnrollmentSummary(parsed) {
  if (!parsed?.members?.length) return null;
  const subscriber =
    parsed.members.find((member) => member.isSubscriber) || parsed.members[0];
  return subscriber?.financials?.summary || null;
}

function generateEdiSummary(parsed) {
  if (!parsed?.members?.length) return null;

  const members = parsed.members;
  const additions = members.filter((m) => m.maintenanceTypeCode === "021");
  const cancelTerms = members.filter((m) => m.maintenanceTypeCode === "024");
  const changes = members.filter((m) => m.maintenanceTypeCode === "001");

  const fmtDate = (raw) => {
    if (!raw || raw.length < 8) return "N/A";
    return `${raw.slice(4, 6)}/${raw.slice(6, 8)}/${raw.slice(0, 4)}`;
  };

  const getName = (m) =>
    [m.firstName, m.lastName].filter(Boolean).join(" ") || "Member";

  const getPrimaryCov = (m) => m.coverages?.[0] || null;

  const getCovType = (cov) => cov?.insuranceLineCode || "Unknown";

  const getCovDate = (cov, dateKey) => fmtDate(cov?.dates?.[dateKey]);

  const isCancelAction = (m) => {
    const cancelReasons = ["14", "59", "29", "AI"];
    return cancelReasons.includes(m.maintenanceReasonCode);
  };

  const buildNameList = (memberList) => {
    const entries = memberList.map((m) => {
      const rel = getRelationshipLabel(m.relationshipCode, m.isSubscriber);
      return `${rel} ${getName(m)}`;
    });
    if (entries.length === 1) return entries[0];
    return entries.slice(0, -1).join(", ") + " and " + entries[entries.length - 1];
  };

  // Rule 2: Mixed — Change + Addition/Cancellation; the non-Change is the main intention
  if (changes.length > 0 && (additions.length > 0 || cancelTerms.length > 0)) {
    if (additions.length > 0) {
      const cov = getPrimaryCov(additions[0]);
      const covType = getCovType(cov);
      const date = getCovDate(cov, "348");
      const nameList = buildNameList(additions);
      return `This 834 is adding ${nameList} to this policy, with Benefit Begin Date of ${date} for coverage ${covType}.`;
    }
    if (cancelTerms.length > 0) {
      const m = cancelTerms[0];
      const cov = getPrimaryCov(m);
      const covType = getCovType(cov);
      const date = getCovDate(cov, "349");
      const action = isCancelAction(m) ? "cancelling" : "terminating";
      const rel = getRelationshipLabel(m.relationshipCode, m.isSubscriber);
      const name = getName(m);
      if (m.isSubscriber) {
        return `This 834 is ${action} the entire policy, with Benefit End Date of ${date} for coverage ${covType}.`;
      }
      return `This 834 is ${action} ${name} who is a ${rel} to this policy, with Benefit End Date of ${date} for coverage ${covType}.`;
    }
  }

  // Rule 3: Only Additions
  if (additions.length > 0 && cancelTerms.length === 0 && changes.length === 0) {
    const cov = getPrimaryCov(additions[0]);
    const covType = getCovType(cov);
    const date = getCovDate(cov, "348");
    const nameList = buildNameList(additions);
    return `This 834 is adding ${nameList}, with Benefit Begin Date of ${date} for coverage ${covType}.`;
  }

  // Only Cancellations/Terminations (no Change, no Addition)
  if (cancelTerms.length > 0 && additions.length === 0 && changes.length === 0) {
    const m = cancelTerms[0];
    const cov = getPrimaryCov(m);
    const covType = getCovType(cov);
    const date = getCovDate(cov, "349");
    const action = isCancelAction(m) ? "cancelling" : "terminating";
    const rel = getRelationshipLabel(m.relationshipCode, m.isSubscriber);
    const name = getName(m);
    if (m.isSubscriber) {
      return `This 834 is ${action} the entire policy, with Benefit End Date of ${date} for coverage ${covType}.`;
    }
    return `This 834 is ${action} ${name} who is a ${rel} to this policy, with Benefit End Date of ${date} for coverage ${covType}.`;
  }

  // Rule 1: Only Changes
  if (changes.length > 0 && additions.length === 0 && cancelTerms.length === 0) {
    const subscriber = changes.find((m) => m.isSubscriber) || changes[0];
    const cov = getPrimaryCov(subscriber);
    const covType = getCovType(cov);
    const date = getCovDate(cov, "348");
    if (cov?.cmsPlanId) {
      return `This 834 is changing the Plan ID of the Subscriber, with Benefit Begin Date of ${date} for coverage ${covType}.`;
    }
    return `This 834 is changing enrollment data for the Subscriber, with Benefit Begin Date of ${date} for coverage ${covType}.`;
  }

  return null;
}

function TraceTooltip({ trace }) {
  const [open, setOpen] = useState(false);
  if (!trace) return null;
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: "4px", verticalAlign: "middle" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Show source mapping"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 2px",
          color: open ? "#2563eb" : "#94a3b8",
          fontSize: "13px",
          lineHeight: 1,
        }}
        aria-label="Show source segment"
      >
        ⓘ
      </button>
      {open && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1e293b",
            color: "#f1f5f9",
            fontSize: "11px",
            padding: "4px 8px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            zIndex: 100,
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          Source: {trace}
        </span>
      )}
    </span>
  );
}

function renderTrace(trace) {
  return <TraceTooltip trace={trace} />;
}

export default function Dashboard() {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [showGenerate834, setShowGenerate834] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const handleGeneratedEdi = (ediText, name) => {
    try {
      setError("");
      setSearch("");
      setFileName(name);
      setRawText(ediText);
      setParsed(parse834(ediText));
    } catch (err) {
      setError(err.message || "Failed to parse generated file.");
      setParsed(null);
    }
  };

  const handleLoadSample = () => {
    try {
      setError("");
      setFileName("sample-834.edi");
      setRawText(sample834);
      setParsed(parse834(sample834));
    } catch (err) {
      setError(err.message || "Failed to parse sample file.");
      setParsed(null);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setSearch("");
      setFileName(file.name);
      const text = await file.text();
      setRawText(text);
      setParsed(parse834(text));
    } catch (err) {
      setError(err.message || "Failed to parse uploaded file.");
      setParsed(null);
      setRawText("");
    }
  };

  const handleLoadScenario = async (event) => {
    const path = event.target.value;
    event.target.value = "";
    if (!path) return;

    const name = path.split("/").pop();
    try {
      setError("");
      setSearch("");
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Could not load ${name}`);
      const text = await res.text();
      setFileName(name);
      setRawText(text);
      setParsed(parse834(text));
    } catch (err) {
      setError(err.message || "Failed to load scenario.");
      setParsed(null);
      setRawText("");
    }
  };

  const filteredMembers = useMemo(() => {
    if (!parsed) return [];
    const value = search.trim().toLowerCase();

    if (!value) return parsed.members;

    return parsed.members.filter((m) => {
      return (
        m.firstName?.toLowerCase().includes(value) ||
        m.lastName?.toLowerCase().includes(value) ||
        m.memberId?.toLowerCase().includes(value) ||
        m.subscriberId?.toLowerCase().includes(value)
      );
    });
  }, [parsed, search]);

  const subscribers = parsed?.members.filter((m) => m.isSubscriber).length || 0;
  const dependents = parsed?.members.filter((m) => !m.isSubscriber).length || 0;
  const enrollmentSummary = getEnrollmentSummary(parsed);
  const ediSummary = generateEdiSummary(parsed);

  return (
    <div style={styles.page}>
      {/* PHI Banner — full-width, outside padded container */}
      <div style={{
        backgroundColor: "#fffbeb",
        borderBottom: "2px solid #f59e0b",
        padding: "10px 32px",
        fontSize: "12.5px",
        color: "#78350f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        textAlign: "center",
      }}>
        <span style={{ fontSize: "15px" }}>⚠️</span>
        <span>
          <strong>Browser-only tool — no data is transmitted or stored.</strong>{" "}
          Do not upload files containing real member PHI/PII to shared or public environments.
          All parsing happens locally in your browser.
        </span>
      </div>

      <div style={styles.pageBody}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>EDI 834 Validator</h1>
            <p style={styles.subtitle}>
              Upload, parse, and review enrollment files with validation-friendly output.
            </p>
            <p style={{ fontSize: "11px", color: "rgba(191,219,254,0.8)", margin: "6px 0 0" }}>
              Code tables aligned to: CMS FFE X12 834 Companion Guide v7.2 (Aug 2024) &amp; Covered California Companion Guide v24.09.06
            </p>
          </div>

          <div style={styles.actionRow}>
            <select style={styles.select} onChange={handleLoadScenario} defaultValue="">
              {SCENARIOS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <button
              style={styles.secondaryButton}
              onClick={() => setShowGenerate834(true)}
            >
              ✦ Generate 834
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => setShowCompare(true)}
            >
              ⇄ Compare EDI
            </button>

            <label style={styles.uploadLabel}>
              Upload your 834 File
              <input
                type="file"
                accept=".txt,.edi,.x12"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>

        {showGenerate834 && (
          <Generate834Modal
            onClose={() => setShowGenerate834(false)}
            onLoad={handleGeneratedEdi}
          />
        )}

        {showCompare && (
          <CompareEdiModal onClose={() => setShowCompare(false)} />
        )}

        {error && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={styles.cardGrid}>
          <div style={styles.card}>
            <div style={styles.cardLabel}>File</div>
            <div style={{ ...styles.cardValue, fontSize: "18px" }}>
              {fileName || "No file loaded"}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Members</div>
            <div style={styles.cardValue}>{parsed?.validation.memberCount || 0}</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Subscribers</div>
            <div style={styles.cardValue}>{subscribers}</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Dependents</div>
            <div style={styles.cardValue}>{dependents}</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Coverages</div>
            <div style={styles.cardValue}>{parsed?.validation.coverageCount || 0}</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Warnings</div>
            <div style={styles.cardValue}>{parsed?.validation.warnings.length || 0}</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Unrecognized Segments</div>
            <div style={{ ...styles.cardValue, color: parsed?.validation.unrecognizedSegments?.length ? "#b45309" : "#0f172a" }}>
              {parsed?.validation.unrecognizedSegments?.length || 0}
            </div>
          </div>
        </div>

        {parsed && (
          <>
            {ediSummary && (
              <div style={{
                ...styles.section,
                background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
                borderLeft: "4px solid #2563eb",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "6px",
              }}>
                <h2 style={{ ...styles.sectionTitle, marginBottom: "2px", color: "#1e3a5f" }}>Summary</h2>
                <p style={{ margin: 0, fontSize: "15px", color: "#1e293b", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                  {ediSummary}
                </p>
              </div>
            )}

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Transaction Details</h2>
              <div style={styles.infoRow}>
                <span style={styles.badge}>
                  Transaction: {parsed.transaction.transactionSetIdentifier || "834"}
                </span>
                <span style={styles.badge}>
                  Reference Number (BGN-02): {parsed.transaction.referenceNumber || "N/A"}
                </span>
                <span style={styles.badge}>
                  Transaction Date (BGN-03): {formatDate(parsed.transaction.transactionSetDate) || "N/A"}
                </span>
                <span style={styles.badge}>
                  Sponsor: {parsed.sponsor.name || "N/A"}
                  {parsed.sponsor.idCode && ` (${parsed.sponsor.idCodeQualifier}: ${parsed.sponsor.idCode})`}
                </span>
                <span style={styles.badge}>
                  Payer: {parsed.payer.name || "N/A"}
                  {parsed.payer.idCode && ` (${parsed.payer.idCodeQualifier}: ${parsed.payer.idCode})`}
                </span>
                {parsed.broker?.name && (
                  <span style={styles.badge}>
                    Broker: {parsed.broker.name}
                    {parsed.broker.idCode && ` (${parsed.broker.idCodeQualifier}: ${parsed.broker.idCode})`}
                  </span>
                )}
                <span style={styles.badge}>
                  Interchange Control #: {parsed.interchange?.controlNumber || "N/A"}
                </span>
                <span style={styles.badge}>
                  Version: {parsed.group.version || "N/A"}
                </span>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Eligibility</h2>

              <div style={styles.cardGrid}>
                <div style={styles.card}>
                  <div style={styles.cardLabel}>Eligibility Start Date (DTP*356)</div>
                  <div style={{ ...styles.cardValue, fontSize: "18px" }}>
                    {formatDate(parsed.enrollment?.eligibilityStartDate) || "N/A"}
                  </div>
                  {renderTrace(parsed.enrollment?.trace?.eligibilityStartDate)}
                </div>

                <div style={styles.card}>
                  <div style={styles.cardLabel}>Eligibility End Date (DTP*357)</div>
                  <div style={{ ...styles.cardValue, fontSize: "18px" }}>
                    {formatDate(parsed.enrollment?.eligibilityEndDate) || "N/A"}
                  </div>
                  {renderTrace(parsed.enrollment?.trace?.eligibilityEndDate)}
                </div>

                {parsed.enrollment?.coverageTerminationDate && (
                  <div style={{ ...styles.card, borderLeft: "4px solid #ef4444" }}>
                    <div style={{ ...styles.cardLabel, color: "#ef4444" }}>Coverage Termination Date (DTP*349)</div>
                    <div style={{ ...styles.cardValue, fontSize: "18px", color: "#ef4444" }}>
                      {formatDate(parsed.enrollment.coverageTerminationDate)}
                    </div>
                    {renderTrace(parsed.enrollment?.trace?.coverageTerminationDate)}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.section}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Member Table</h2>
                <button
                  onClick={() => exportMembersToCSV(parsed, fileName)}
                  style={{
                    padding: "6px 16px",
                    backgroundColor: "#15803d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  ↓ Export CSV
                </button>
              </div>

              <input
                type="text"
                placeholder="Search by name, member ID, or subscriber ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Relationship</th>
                      <th style={styles.th}>Transaction</th>
                      <th style={styles.th}>Member ID</th>
                      <th style={styles.th}>Subscriber ID</th>
                      <th style={styles.th}>Enrollment ID</th>
                      <th style={styles.th}>DOB</th>
                      <th style={styles.th}>Gender</th>
                      <th style={styles.th}>State</th>
                      <th style={styles.th}>Coverage</th>
                      <th style={styles.th}>Issues</th>
                      <th style={styles.th}>Current Premium</th>
                      <th style={styles.th}>Current APTC</th>
                      <th style={styles.th}>Race / Ethnicity</th>
                      <th style={styles.th}>Spoken Language</th>
                      <th style={styles.th}>Written Language</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length ? (
                      filteredMembers.map((member, index) => {
                        const issues = getMemberIssues(member);

                        return (
                          <tr
                            key={`${member.memberId || member.subscriberId || "member"}-${index}`}
                            style={{
                              backgroundColor: issues.length ? "#fff7ed" : "white",
                            }}
                          >
                            <td style={styles.td}>{index + 1}</td>

                            <td style={styles.td}>
                              <div style={{ fontWeight: 700 }}>
                                {[member.firstName, member.middleName, member.lastName]
                                  .filter(Boolean)
                                  .join(" ") || "N/A"}
                              </div>
                              <div style={styles.muted}>
                                {member.isSubscriber ? "Subscriber" : "Dependent"}
                              </div>
                            </td>

                            <td style={styles.td}>
                              <div style={{ fontWeight: 600 }}>
                                {getRelationshipLabel(member.relationshipCode, member.isSubscriber)}
                                <TraceTooltip trace="INS-02" />
                              </div>
                              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                {member.relationshipCode || "N/A"}
                              </div>
                            </td>

                            <td style={styles.td}>
                              <div style={{ fontWeight: 600 }}>
                                {getMaintenanceTypeLabel(member.maintenanceTypeCode)}
                                <TraceTooltip trace="INS-03" />
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                {getMaintenanceReasonLabel(member.maintenanceReasonCode)}
                                <TraceTooltip trace="INS-04" />
                              </div>
                              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                                {member.maintenanceTypeCode || "N/A"} / {member.maintenanceReasonCode || "N/A"}
                              </div>
                            </td>

                            <td style={styles.td}>
                              <div>{member.memberId || "N/A"}</div>
                              {renderTrace(member.trace?.memberId)}
                            </td>

                            <td style={styles.td}>
                              <div>{member.subscriberId || "N/A"}</div>
                              {renderTrace(member.trace?.subscriberId)}
                            </td>

                            <td style={styles.td}>
                              <div>{member.enrollmentId || "N/A"}</div>
                              {renderTrace(member.trace?.enrollmentId)}
                            </td>

                            <td style={styles.td}>
                              <div>{formatDate(member.dob) || "N/A"}</div>
                              {renderTrace(member.trace?.dob)}
                            </td>

                            <td style={styles.td}>
                              <div>{member.gender || "N/A"}</div>
                              {renderTrace(member.trace?.gender)}
                              {member.maritalStatusCode && (
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                  {getMaritalStatusLabel(member.maritalStatusCode)}
                                  {renderTrace(member.trace?.maritalStatusCode)}
                                </div>
                              )}
                            </td>

                            <td style={styles.td}>{member.state || "N/A"}</td>

                            <td style={styles.td}>
                              {member.coverages?.length ? (
                                member.coverages.map((c, i) => (
                                  <div key={i} style={{ marginBottom: "8px" }}>
                                    <span style={styles.coverageBadge}>
                                      {c.insuranceLineCode || "UNK"}
                                      {c.planCoverageDescription
                                        ? ` - ${c.planCoverageDescription}`
                                        : ""}
                                    </span>
                                    {c.coverageLevelCode && (
                                      <span style={{ ...styles.coverageBadge, marginLeft: "4px", backgroundColor: "#e0f2fe", color: "#0369a1" }}>
                                        {getCoverageLevelLabel(c.coverageLevelCode)}
                                      </span>
                                    )}
                                    <TraceTooltip trace={c.trace?.insuranceLineCode || "HD-03"} />
                                    {c.dates?.["348"] && (
                                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                        Benefit Begin Date: {formatDate(c.dates["348"])} <TraceTooltip trace={c.trace?.date_348 || "DTP*348"} />
                                      </div>
                                    )}
                                    {c.dates?.["349"] && (
                                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                        Benefit End Date: {formatDate(c.dates["349"])} <TraceTooltip trace={c.trace?.date_349 || "DTP*349"} />
                                      </div>
                                    )}
                                    {c.grossPremiumAmount != null && (
                                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                        Gross Premium: ${c.grossPremiumAmount} <TraceTooltip trace={c.trace?.grossPremiumAmount || "AMT*P3"} />
                                      </div>
                                    )}
                                    {c.cmsPlanId && (
                                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                        CMS Plan ID: {c.cmsPlanId} <TraceTooltip trace={c.trace?.cmsPlanId || "REF*CE"} />
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span style={styles.muted}>None</span>
                              )}
                            </td>

                            <td style={styles.td}>
                              {issues.length ? (
                                issues.map((issue, i) => (
                                  <span key={i} style={styles.issueBadge}>
                                    {issue}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: "#15803d", fontWeight: 600 }}>OK</span>
                              )}
                            </td>

                            <td style={styles.td}>
                              {member.financials?.summary?.currentPremiumAmount ?? "N/A"}
                            </td>

                            <td style={styles.td}>
                              {member.financials?.summary?.currentAptcAmount ?? "N/A"}
                            </td>

                            <td style={styles.td}>
                              {member.raceEthnicityCodes?.length ? (
                                <>
                                  <div>{getRaceEthnicityLabels(member.raceEthnicityCodes).join(", ")}</div>
                                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                    Codes: {member.raceEthnicityCodes.join("^")}
                                  </div>
                                  {renderTrace(member.trace?.raceEthnicityCodes)}
                                </>
                              ) : (
                                <>
                                  <div>N/A</div>
                                  {renderTrace(member.trace?.raceEthnicityCodes)}
                                </>
                              )}
                            </td>

                            <td style={styles.td}>
                              <div>{getLanguageLabel(member.spokenLanguage)}</div>
                              {renderTrace(member.trace?.spokenLanguage)}
                            </td>

                            <td style={styles.td}>
                              <div>{getLanguageLabel(member.writtenLanguage)}</div>
                              {renderTrace(member.trace?.writtenLanguage)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td style={styles.td} colSpan={17}>
                          <span style={styles.muted}>No members match your search.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {enrollmentSummary && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Enrollment Financial Summary</h2>

                <div style={styles.cardGrid}>
                  <div style={styles.card}>
                    <div style={styles.cardLabel}>Current Total Responsible Amount</div>
                    <div style={styles.cardValue}>
                      {enrollmentSummary.currentTotalResponsibleAmount ?? "N/A"}
                    </div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.cardLabel}>Current APTC Amount</div>
                    <div style={styles.cardValue}>
                      {enrollmentSummary.currentAptcAmount ?? "N/A"}
                    </div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.cardLabel}>Rating Area</div>
                    <div style={{ ...styles.cardValue, fontSize: "18px" }}>
                      {enrollmentSummary.ratingArea || "N/A"}
                    </div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.cardLabel}>Source Exchange ID</div>
                    <div style={{ ...styles.cardValue, fontSize: "18px" }}>
                      {enrollmentSummary.sourceExchangeId || "N/A"}
                    </div>
                  </div>

                  {enrollmentSummary.sepReason !== undefined && (
                    <div style={styles.card}>
                      <div style={styles.cardLabel}>SEP Reason</div>
                      <div style={{ ...styles.cardValue, fontSize: "16px" }}>
                        {getSepReasonLabel(enrollmentSummary.sepReason)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        Code: {enrollmentSummary.sepReason}
                      </div>
                    </div>
                  )}

                  {enrollmentSummary.isFFM !== undefined && (
                    <div style={styles.card}>
                      <div style={styles.cardLabel}>Is FFM</div>
                      <div style={{ ...styles.cardValue, fontSize: "18px" }}>
                        {enrollmentSummary.isFFM === "true" ? "Yes" : enrollmentSummary.isFFM === "false" ? "No" : enrollmentSummary.isFFM || "N/A"}
                      </div>
                    </div>
                  )}

                  {enrollmentSummary.ichraQsehra !== undefined && (
                    <div style={styles.card}>
                      <div style={styles.cardLabel}>ICHRA/QSEHRA</div>
                      <div style={{ ...styles.cardValue, fontSize: "18px" }}>
                        {enrollmentSummary.ichraQsehra === "Y" ? "Yes" : enrollmentSummary.ichraQsehra === "N" ? "No" : enrollmentSummary.ichraQsehra || "N/A"}
                      </div>
                    </div>
                  )}

                  {enrollmentSummary.qsehraSpouse !== undefined && (
                    <div style={styles.card}>
                      <div style={styles.cardLabel}>Spouse QSEHRA</div>
                      <div style={{ ...styles.cardValue, fontSize: "18px" }}>
                        {enrollmentSummary.qsehraSpouse === "Y" ? "Yes" : enrollmentSummary.qsehraSpouse === "N" ? "No" : enrollmentSummary.qsehraSpouse || "N/A"}
                      </div>
                    </div>
                  )}

                  {enrollmentSummary.qsehraBoth !== undefined && (
                    <div style={styles.card}>
                      <div style={styles.cardLabel}>QSEHRA Usage</div>
                      <div style={{ ...styles.cardValue, fontSize: "13px" }}>
                        {getQsehraBothLabel(enrollmentSummary.qsehraBoth)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        Value: {enrollmentSummary.qsehraBoth}
                      </div>
                    </div>
                  )}

                  {enrollmentSummary.addlMaintReason && (
                    <div style={styles.card}>
                      <div style={styles.cardLabel}>Additional Maintenance Reason (AMRC)</div>
                      <div style={{ ...styles.cardValue, fontSize: "13px" }}>
                        {getAmrcLabel(enrollmentSummary.addlMaintReason)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        Code: {enrollmentSummary.addlMaintReason}
                      </div>
                    </div>
                  )}

                  {enrollmentSummary.applicationIdAndOrigin && (
                    <div style={styles.card}>
                      <div style={styles.cardLabel}>Application ID &amp; Origin</div>
                      <div style={{ ...styles.cardValue, fontSize: "13px" }}>
                        {getOriginCodeLabel(enrollmentSummary.applicationIdAndOrigin)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        Value: {enrollmentSummary.applicationIdAndOrigin}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "20px" }}>
                  <h3 style={{ marginBottom: "12px" }}>Monthly Premium Totals</h3>

                  {Object.keys(enrollmentSummary.monthlyPremiumTotals || {}).length ? (
                    <div style={styles.tableWrap}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Month</th>
                            <th style={styles.th}>Premium Total</th>
                            <th style={styles.th}>APTC Amount</th>
                            <th style={styles.th}>State Subsidy Amount</th>
                            <th style={styles.th}>Total Responsible Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(enrollmentSummary.monthlyPremiumTotals)
                            .sort()
                            .map((date) => (
                              <tr key={date}>
                                <td style={styles.td}>{formatDate(date)}</td>
                                <td style={styles.td}>
                                  {enrollmentSummary.monthlyPremiumTotals?.[date] ?? "N/A"}
                                </td>
                                <td style={styles.td}>
                                  {enrollmentSummary.monthlyAptcAmounts?.[date] ?? "N/A"}
                                </td>
                                <td style={styles.td}>
                                  {enrollmentSummary.monthlyStateSubsidyAmounts?.[date] ?? "N/A"}
                                </td>
                                <td style={styles.td}>
                                  {enrollmentSummary.monthlyResponsibleAmounts?.[date] ?? "N/A"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span style={styles.muted}>No monthly enrollment totals found.</span>
                  )}
                </div>
              </div>
            )}

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Raw File</h2>
              <pre style={styles.rawPre}>{rawText}</pre>
            </div>

            {parsed.validation.unrecognizedSegments?.length > 0 && (
              <div style={{ ...styles.section, borderLeft: "4px solid #f59e0b" }}>
                <h2 style={{ ...styles.sectionTitle, color: "#92400e" }}>Unrecognized Segments</h2>
                <p style={{ ...styles.muted, marginBottom: "12px" }}>
                  These segments were present in the file but not handled by the parser. They are shown here for inspection.
                </p>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>Segment ID</th>
                        <th style={styles.th}>Raw Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.validation.unrecognizedSegments.map((seg, i) => (
                        <tr key={i}>
                          <td style={styles.td}>{i + 1}</td>
                          <td style={styles.td}>{seg.split("*")[0]}</td>
                          <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "12px", color: "#475569" }}>{seg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Structured JSON</h2>
              <pre style={styles.pre}>{JSON.stringify(parsed, null, 2)}</pre>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}