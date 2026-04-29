import { useState } from "react";

// ── Name pools ────────────────────────────────────────────────────────────────
const LAST_NAMES = [
  "Anderson", "Martinez", "Thompson", "Garcia", "Robinson", "Williams",
  "Johnson", "Davis", "Wilson", "Taylor", "Clark", "Lewis", "Lee",
  "Walker", "Hall", "Allen", "Young", "Harris", "King", "Scott",
];
const MALE_FIRST = [
  "James", "Michael", "David", "Robert", "John", "William", "Richard",
  "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Paul",
];
const FEMALE_FIRST = [
  "Sarah", "Jennifer", "Jessica", "Ashley", "Emily", "Amanda", "Melissa",
  "Laura", "Rachel", "Stephanie", "Rebecca", "Elizabeth", "Megan", "Hannah",
];
const CHILD_FIRST_M = ["Ethan", "Noah", "Liam", "Lucas", "Mason", "Oliver", "Elijah", "Logan"];
const CHILD_FIRST_F = ["Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia"];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const STREETS = ["Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Elm Blvd", "Park Rd", "Washington Ave", "Lake Dr", "River Rd", "Highland Ave"];
const CITIES  = [
  { city: "Newark",      state: "NJ", zip: "07102", county: "34013" },
  { city: "Trenton",     state: "NJ", zip: "08608", county: "34021" },
  { city: "Jersey City", state: "NJ", zip: "07302", county: "34017" },
  { city: "Edison",      state: "NJ", zip: "08817", county: "34023" },
  { city: "Clifton",     state: "NJ", zip: "07011", county: "34031" },
  { city: "Paterson",    state: "NJ", zip: "07501", county: "34031" },
];

function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndPad(n, len) { return String(n).padStart(len, "0"); }

function randomFamily() {
  const lastName = pick(LAST_NAMES);
  const subGender = Math.random() > 0.3 ? "M" : "F";
  const spouseGender = subGender === "M" ? "F" : "M";
  const depGender = Math.random() > 0.5 ? "M" : "F";
  const subYear = 1970 + rndInt(0, 24);
  const spouseYear = subYear - 3 + rndInt(0, 5);
  const depYear = 2010 + rndInt(0, 11);
  const rndMo = () => rndPad(rndInt(1, 12), 2);
  const rndDy = () => rndPad(rndInt(1, 27), 2);

  // Unique subscriber ID: 9-digit numeric, random per session
  const subscriberId = rndPad(rndInt(100000000, 999999999), 9);

  // Unique enrollment base ID: prefix + 9 random digits
  const enrollmentBase = "ENR" + rndPad(rndInt(100000000, 999999999), 9);

  // Unique enrollment group number (REF*1L base): 5-digit, per session
  const enrollmentGroupBase = rndInt(20000, 39999);

  // Address
  const houseNum = rndInt(10, 9999);
  const streetName = pick(STREETS);
  const loc = pick(CITIES);
  const address = `${houseNum} ${streetName}`;

  // Phone & email
  const phone = `${rndPad(rndInt(200, 999), 3)}${rndPad(rndInt(1000000, 9999999), 7)}`;
  const email = `${lastName.toLowerCase()}${rndInt(10, 99)}@email.com`;

  return {
    lastName,
    subscriberId,
    enrollmentBase,
    enrollmentGroupBase,
    address, loc, phone, email,
    subscriber: { firstName: pick(subGender === "M" ? MALE_FIRST : FEMALE_FIRST), gender: subGender, dob: `${subYear}${rndMo()}${rndDy()}` },
    spouse:     { firstName: pick(spouseGender === "M" ? MALE_FIRST : FEMALE_FIRST), gender: spouseGender, dob: `${spouseYear}${rndMo()}${rndDy()}` },
    dependent:  { firstName: pick(depGender === "M" ? CHILD_FIRST_M : CHILD_FIRST_F), gender: depGender, dob: `${depYear}${rndMo()}${rndDy()}` },
  };
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)",
    zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px",
  },
  modal: {
    background: "white", borderRadius: "20px", width: "100%", maxWidth: "620px",
    maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 24px 64px rgba(15,23,42,0.3)",
    padding: "32px",
    fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "4px",
  },
  title: { margin: 0, fontSize: "22px", fontWeight: 800, color: "#1e3a5f" },
  subtitle: { margin: "0 0 24px", fontSize: "13px", color: "#64748b" },
  closeBtn: {
    background: "none", border: "none", fontSize: "20px", cursor: "pointer",
    color: "#64748b", padding: "4px", lineHeight: 1,
  },
  field: { display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" },
  label: { fontSize: "11px", fontWeight: 600, color: "#475569", letterSpacing: "0.03em", textTransform: "uppercase" },
  required: { color: "#ef4444", marginLeft: "2px" },
  select: {
    padding: "9px 11px", borderRadius: "8px", border: "1px solid #cbd5e1",
    fontSize: "13px", background: "white", color: "#0f172a", width: "100%",
  },
  input: {
    padding: "9px 11px", borderRadius: "8px", border: "1px solid #cbd5e1",
    fontSize: "13px", color: "#0f172a", width: "100%", boxSizing: "border-box",
    fontFamily: "inherit",
  },
  checkGroup: { display: "flex", gap: "24px", marginTop: "6px", flexWrap: "wrap" },
  checkLabel: {
    display: "flex", alignItems: "center", gap: "7px",
    fontSize: "13px", color: "#0f172a", cursor: "pointer", fontWeight: 500,
  },
  previewBox: {
    background: "linear-gradient(135deg,#eff6ff,#f0fdf4)",
    border: "1px solid #bfdbfe",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "13px",
    color: "#1e293b",
    lineHeight: 1.6,
    fontStyle: "italic",
    minHeight: "42px",
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px",
    padding: "10px 14px", marginTop: "12px", color: "#b91c1c", fontSize: "13px",
  },
  successBox: {
    background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px",
    padding: "10px 14px", marginTop: "12px", color: "#15803d", fontSize: "13px",
    fontWeight: 600,
  },
  footer: {
    display: "flex", gap: "10px", justifyContent: "flex-end",
    marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },
  primaryBtn: {
    background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", color: "white",
    border: "none", borderRadius: "10px", padding: "10px 24px",
    fontSize: "14px", fontWeight: 700, cursor: "pointer",
  },
  downloadBtn: {
    background: "#15803d", color: "white",
    border: "none", borderRadius: "10px", padding: "10px 20px",
    fontSize: "14px", fontWeight: 700, cursor: "pointer",
  },
  loadBtn: {
    background: "#1d4ed8", color: "white",
    border: "none", borderRadius: "10px", padding: "10px 20px",
    fontSize: "14px", fontWeight: 700, cursor: "pointer",
  },
  cancelBtn: {
    background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0",
    borderRadius: "10px", padding: "10px 18px", fontSize: "13px",
    fontWeight: 600, cursor: "pointer",
  },
  divider: {
    fontSize: "11px", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase",
    letterSpacing: "0.07em", margin: "20px 0 14px", paddingBottom: "6px",
    borderBottom: "2px solid #eff6ff",
  },
};

// ── EDI Builder ───────────────────────────────────────────────────────────────
function pad15(str) {
  return String(str || "").padEnd(15, " ").slice(0, 15);
}

function d8(iso) {
  return (iso || "").replace(/-/g, "");
}

function buildAddCoverageEdi(members, coverageType, startDate, eligibilityEnd, covIndex = 0, family) {
  const now = new Date();
  const Y = now.getFullYear();
  const Mo = String(now.getMonth() + 1).padStart(2, "0");
  const D = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const yyyymmdd = `${Y}${Mo}${D}`;
  const hhmm = `${hh}${mm}`;
  const timestamp = `${yyyymmdd}${hh}${mm}${ss}`;
  const ctlNum = String(now.getTime()).slice(-9).padStart(9, "0");
  const stCtl = "26" + String((now.getTime() % 9000) + 1000);

  const SPONSOR = "Sponsor Employer LLC";
  const SPONSOR_EIN = "451223344";
  const PAYER = "BlueCross BlueShield NJ";
  const PAYER_EIN = "221098765";
  const PLAN_IDS = { HLT: "72341NJ005001200", DEN: "72341NJ005001201", VIS: "72341NJ005001202" };
  const PLAN_ID = PLAN_IDS[coverageType] || "72341NJ005001200";
  const RATING_AREA = "R-NJ001";

  const PREMIUMS = {
    HLT: { subscriber: 412.50, spouse: 389.25, dependent: 249.00 },
    DEN: { subscriber: 23.61, spouse: 10.35, dependent: 9.72 },
    VIS: { subscriber: 13.21, spouse: 13.21, dependent: 13.21 },
  };
  const prem = PREMIUMS[coverageType] || PREMIUMS.HLT;

  const startD8 = d8(startDate);
  const planYearStart = startD8.slice(0, 4) + "0101";
  // Use provided eligibility end date if given, otherwise default to plan year end
  const planYearEnd = eligibilityEnd ? d8(eligibilityEnd) : startD8.slice(0, 4) + "1231";

  // IDs from family (unique per session)
  const subscriberId   = family.subscriberId;
  const subBaseId      = family.enrollmentBase;
  // Each coverage gets a distinct enrollment group number (REF*1L)
  const enrollment1L   = String(family.enrollmentGroupBase + covIndex);

  let total = 0;
  if (members.subscriber) total += prem.subscriber;
  if (members.spouse) total += prem.spouse;
  if (members.dependent) total += prem.dependent;

  const memberDefs = [];
  if (members.subscriber) memberDefs.push({
    isSubscriber: true, relCode: "18",
    firstName: family.subscriber.firstName, lastName: family.lastName,
    dob: family.subscriber.dob, gender: family.subscriber.gender,
    subscriberId,
    memberId: subscriberId,           // Member ID == Subscriber ID for subscriber
    exchId: subBaseId,
    premium: prem.subscriber,
  });
  if (members.spouse) memberDefs.push({
    isSubscriber: false, relCode: "01",
    firstName: family.spouse.firstName, lastName: family.lastName,
    dob: family.spouse.dob, gender: family.spouse.gender,
    subscriberId,
    memberId: String(Number(subscriberId) + 1),  // Subscriber ID + 1
    exchId: subBaseId.slice(0, -1) + "2",
    premium: prem.spouse,
  });
  if (members.dependent) memberDefs.push({
    isSubscriber: false, relCode: "19",
    firstName: family.dependent.firstName, lastName: family.lastName,
    dob: family.dependent.dob, gender: family.dependent.gender,
    subscriberId,
    memberId: String(Number(subscriberId) + 2),  // Subscriber ID + 2
    exchId: subBaseId.slice(0, -1) + "3",
    premium: prem.dependent,
  });

  const txLines = [];
  function tseg(...parts) {
    txLines.push(parts.join("*") + "~");
  }

  tseg("ST", "834", stCtl, "005010X220A1");
  tseg("BGN", "00", stCtl, yyyymmdd, hhmm, "ET", "", "", "2");
  tseg("N1", "P5", SPONSOR, "FI", SPONSOR_EIN);
  tseg("N1", "IN", PAYER, "FI", PAYER_EIN);
  tseg("N1", "BO", "Carol Carey", "94", "6523145654");

  memberDefs.forEach((m) => {
    tseg("INS", m.isSubscriber ? "Y" : "N", m.relCode, "021", "AI", "A", "", "", "FT", "", "N", "", "", "U");
    tseg("REF", "0F", m.subscriberId);
    tseg("REF", "1L", enrollment1L);
    tseg("REF", "17", m.exchId);
    tseg("REF", "6O", m.subscriberId);
    tseg("DTP", "336", "D8", startD8);
    tseg("DTP", "356", "D8", planYearStart);
    tseg("DTP", "357", "D8", planYearEnd);

    if (m.isSubscriber) {
      tseg("NM1", "IL", "1", m.lastName, m.firstName, "", "", "", "34", m.memberId);
      tseg("PER", "IP", "", "HP", family.phone, "EM", family.email);
    } else {
      tseg("NM1", "IL", "1", m.lastName, m.firstName, "", "", "", "34", m.memberId);
    }

    tseg("N3", family.address);
    tseg("N4", family.loc.city, family.loc.state, family.loc.zip, "", "CY", family.loc.county);
    tseg("DMG", "D8", m.dob, m.gender);
    tseg("HLH", "N");
    tseg("HD", "021", "", coverageType, "", "FAM");
    tseg("DTP", "303", "D8", startD8);
    tseg("DTP", "348", "D8", startD8);
    tseg("AMT", "P3", m.premium.toFixed(2));
    tseg("REF", "CE", PLAN_ID);
    if (m.isSubscriber) tseg("REF", "9V", "BILLME");

    tseg("LS", "2700");
    tseg("LX", "1");
    tseg("N1", "75", "REQUEST SUBMIT TIMESTAMP");
    tseg("REF", "17", timestamp);
    tseg("LX", "2");
    tseg("N1", "75", "SOURCE EXCHANGE ID");
    tseg("REF", "17", "OIEHP");
    tseg("LX", "3");
    tseg("N1", "75", "ISFFM");
    tseg("REF", "17", "false");

    if (m.isSubscriber) {
      tseg("LX", "4");
      tseg("N1", "75", "PRE AMT TOT");
      tseg("REF", "9X", total.toFixed(2));
      tseg("DTP", "007", "D8", startD8);
      tseg("LX", "5");
      tseg("N1", "75", "PRE AMT 1");
      tseg("REF", "9X", m.premium.toFixed(2));
      tseg("DTP", "007", "D8", startD8);
      tseg("LX", "6");
      tseg("N1", "75", "TOT RES AMT");
      tseg("REF", "9V", total.toFixed(2));
      tseg("DTP", "007", "D8", startD8);
      tseg("LX", "7");
      tseg("N1", "75", "RATING AREA");
      tseg("REF", "9X", RATING_AREA);
      tseg("DTP", "007", "D8", startD8);
      tseg("LX", "8");
      tseg("N1", "75", "ICHRA/QSEHRA");
      tseg("REF", "17", "N");
      if (members.spouse) {
        tseg("LX", "9");
        tseg("N1", "75", "QSEHRA Spouse");
        tseg("REF", "17", "N");
        tseg("LX", "10");
        tseg("N1", "75", "QSEHRA Both");
        tseg("REF", "17", "N");
      }
    } else {
      tseg("LX", "4");
      tseg("N1", "75", "PRE AMT 1");
      tseg("REF", "9X", m.premium.toFixed(2));
      tseg("DTP", "007", "D8", startD8);
    }

    tseg("LE", "2700");
  });

  // SE counts ST through SE inclusive
  const seCount = txLines.length + 1;
  txLines.push(`SE*${seCount}*${stCtl}~`);

  const yymmdd = yyyymmdd.slice(2);
  const isaLine = `ISA*00*          *00*          *ZZ*${pad15(SPONSOR_EIN)}*ZZ*${pad15(PAYER_EIN)}*${yymmdd}*${hhmm}*^*00501*${ctlNum}*1*T*:~`;
  const gsLine = `GS*BE*${SPONSOR_EIN}*${PAYER_EIN}*${yyyymmdd}*${hhmm}*1*X*005010X220A1~`;
  return [isaLine, gsLine, ...txLines, "GE*1*1~", `IEA*1*${ctlNum}~`].join("\n");
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Generate834Modal({ onClose, onLoad }) {
  const [transaction, setTransaction] = useState("add_coverage");
  const [members, setMembers] = useState({ subscriber: false, spouse: false, dependent: false });
  const [coverages, setCoverages] = useState({ HLT: false, DEN: false, VIS: false });
  const [benefitStart, setBenefitStart] = useState("");
  const [eligibilityEnd, setEligibilityEnd] = useState("");
  const [generated, setGenerated] = useState(null);
  const [errors, setErrors] = useState([]);
  // Random family generated once per modal session
  const [family] = useState(() => randomFamily());

  function fmtDisplay(iso) {
    if (!iso) return "mm/dd/yyyy";
    const [y, m, d] = iso.split("-");
    return `${m}/${d}/${y}`;
  }

  const selectedLabels = [
    members.subscriber && "Subscriber",
    members.spouse && "Spouse",
    members.dependent && "Dependent",
  ].filter(Boolean);

  const selectedCoverages = Object.entries(coverages)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const previewText = selectedLabels.length > 0 && selectedCoverages.length > 0 && benefitStart
    ? `This 834 is adding ${selectedLabels.join(", ")}, with Benefit Begin Date of ${fmtDisplay(benefitStart)} for coverage ${selectedCoverages.join(", ")}.`
    : "Select a transaction, members, coverage, and dates to see a preview.";

  const toggleMember = (key) => {
    setMembers((prev) => ({ ...prev, [key]: !prev[key] }));
    setGenerated(null);
  };

  const toggleCoverage = (key) => {
    setCoverages((prev) => ({ ...prev, [key]: !prev[key] }));
    setGenerated(null);
  };

  const handleGenerate = () => {
    const errs = [];
    if (!Object.values(members).some(Boolean)) errs.push("Please select at least one member.");
    if (!selectedCoverages.length) errs.push("Please select at least one coverage.");
    if (!benefitStart) errs.push("Benefit Start Date is required.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    try {
      const memberKey = selectedLabels.map((l) => l.toLowerCase()).join("-");
      const dateKey = benefitStart.replace(/-/g, "");
      const files = selectedCoverages.map((cov, idx) => {
        const ediText = buildAddCoverageEdi(members, cov, benefitStart, eligibilityEnd, idx, family);
        const fileName = `generated-834-add-coverage-${memberKey}-${cov.toLowerCase()}-${dateKey}.edi`;
        return { text: ediText, fileName, coverage: cov };
      });
      setGenerated(files);
    } catch (e) {
      setErrors([e.message || "Failed to generate EDI."]);
    }
  };

  const handleDownload = (file) => {
    const blob = new Blob([file.text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (!generated) return;
    generated.forEach((file, i) => {
      setTimeout(() => handleDownload(file), i * 150);
    });
  };

  const handleLoadIntoValidator = () => {
    if (generated?.length && onLoad) {
      onLoad(generated[0].text, generated[0].fileName);
      onClose();
    }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>Generate 834</h2>
          <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p style={s.subtitle}>Complete the fields below to generate a valid X12 834 EDI file.</p>

        {/* Transaction */}
        <div style={s.field}>
          <label style={s.label}>Transaction <span style={s.required}>*</span></label>
          <select
            style={s.select}
            value={transaction}
            onChange={(e) => { setTransaction(e.target.value); setGenerated(null); }}
          >
            <option value="add_coverage">Add Coverage</option>
          </select>
        </div>

        {/* Members */}
        <div style={s.field}>
          <label style={s.label}>Members on Policy <span style={s.required}>*</span></label>
          <div style={s.checkGroup}>
            {[["subscriber", "Subscriber"], ["spouse", "Spouse"], ["dependent", "Dependent"]].map(([key, label]) => (
              <label key={key} style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={members[key]}
                  onChange={() => toggleMember(key)}
                  style={{ width: "15px", height: "15px", cursor: "pointer" }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Coverage */}
        <div style={s.field}>
          <label style={s.label}>Coverage <span style={s.required}>*</span></label>
          <div style={s.checkGroup}>
            {[["HLT", "HLT — Medical"], ["DEN", "DEN — Dental"], ["VIS", "VIS — Vision"]].map(([key, label]) => (
              <label key={key} style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={coverages[key]}
                  onChange={() => toggleCoverage(key)}
                  style={{ width: "15px", height: "15px", cursor: "pointer" }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div style={s.field}>
            <label style={s.label}>Benefit Start Date <span style={s.required}>*</span></label>
            <input
              type="date"
              style={s.input}
              value={benefitStart}
              onChange={(e) => { setBenefitStart(e.target.value); setGenerated(null); }}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Eligibility End Date</label>
            <input
              type="date"
              style={s.input}
              value={eligibilityEnd}
              onChange={(e) => { setEligibilityEnd(e.target.value); setGenerated(null); }}
            />
          </div>
        </div>

        {/* Preview */}
        <div style={s.field}>
          <label style={s.label}>Preview</label>
          <div style={s.previewBox}>{previewText}</div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={s.errorBox}>
            {errors.map((e, i) => <div key={i}>• {e}</div>)}
          </div>
        )}

        {/* Success */}
        {generated && (
          <div style={s.successBox}>
            ✓ {generated.length} 834 file{generated.length > 1 ? "s" : ""} generated:
            <ul style={{ margin: "6px 0 0", paddingLeft: "18px", fontWeight: 400 }}>
              {generated.map((f) => (
                <li key={f.coverage} style={{ marginBottom: "2px" }}>
                  {f.fileName}
                  <button
                    onClick={() => handleDownload(f)}
                    style={{ marginLeft: "10px", background: "none", border: "none", color: "#15803d", cursor: "pointer", fontSize: "12px", fontWeight: 700, textDecoration: "underline" }}
                  >
                    ↓ Download
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          {!generated ? (
            <button style={s.primaryBtn} onClick={handleGenerate}>Generate</button>
          ) : (
            <>
              <button style={s.loadBtn} onClick={handleLoadIntoValidator}>Load into Validator</button>
              {generated.length > 1 && (
                <button style={s.downloadBtn} onClick={handleDownloadAll}>↓ Download All ({generated.length})</button>
              )}
              {generated.length === 1 && (
                <button style={s.downloadBtn} onClick={() => handleDownload(generated[0])}>↓ Download 834</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
