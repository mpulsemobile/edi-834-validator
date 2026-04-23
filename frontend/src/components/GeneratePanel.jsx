import { useState } from "react";
import { generateSepOffExchange, SEP_REASONS, COVERAGE_TYPES } from "../utils/generate834";

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
    zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px",
  },
  modal: {
    background: "white", borderRadius: "20px", width: "100%", maxWidth: "780px",
    maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 24px 64px rgba(15,23,42,0.3)",
    padding: "32px",
    fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  title: { margin: 0, fontSize: "22px", fontWeight: 800, color: "#1e3a5f" },
  subtitle: { margin: "0 0 24px", fontSize: "13px", color: "#64748b" },
  closeBtn: { background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#64748b", padding: "4px" },
  sectionTitle: {
    fontSize: "11px", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase",
    letterSpacing: "0.07em", margin: "20px 0 10px", paddingBottom: "6px",
    borderBottom: "2px solid #eff6ff",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" },
  grid4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" },
  field: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "11px", fontWeight: 600, color: "#475569", letterSpacing: "0.03em" },
  input: {
    padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1",
    fontSize: "13px", outline: "none", color: "#0f172a",
  },
  select: {
    padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1",
    fontSize: "13px", background: "white", color: "#0f172a",
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px",
    padding: "12px 16px", marginBottom: "16px", color: "#b91c1c", fontSize: "13px",
  },
  footer: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" },
  generateBtn: {
    background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", color: "white",
    border: "none", borderRadius: "10px", padding: "11px 26px",
    fontSize: "14px", fontWeight: 700, cursor: "pointer",
  },
  cancelBtn: {
    background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0",
    borderRadius: "10px", padding: "11px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
  },
};

function Field({ label, children }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

const defaultForm = {
  // Sponsor (N1*P5)
  sponsorName: "", sponsorEin: "",
  // Payer (N1*IN)
  payerName: "", payerEin: "",
  // Broker (N1*BO) — optional
  brokerName: "", brokerId: "",
  // Subscriber ID refs
  subscriberId: "", groupNumber: "", exchangeMemberId: "", refCode6O: "",
  // Dates
  enrollmentDate: "", planYearStart: "", planYearEnd: "",
  // Member info
  firstName: "", lastName: "", phone: "", email: "",
  // Address
  address: "", city: "", state: "", zip: "", countyCode: "",
  // Demographics
  dob: "", gender: "M", raceEthnicity: "", tobaccoUse: "N", spokenLanguage: "",
  // Coverage (HD)
  coverageType: "HLT", coverageEffectiveDate: "", premium: "", planId: "", billingArrangement: "BILLME",
  // 2700 loop
  sourceExchangeId: "", isFFM: "false", preAmtTot: "", preAmt1: "", totResAmt: "",
  ratingArea: "", sepReason: "AI", ichraQsehra: "N", qsehraSpouse: "N", qsehraBoth: "N",
};

export default function GeneratePanel({ onClose, onLoad }) {
  const [f, setF] = useState(defaultForm);
  const [errors, setErrors] = useState([]);

  const set = (key, val) => setF(prev => ({ ...prev, [key]: val }));
  const inp = (key, extra = {}) => (
    <input
      style={s.input}
      value={f[key]}
      onChange={e => set(key, e.target.value)}
      {...extra}
    />
  );
  const sel = (key, options) => (
    <select style={s.select} value={f[key]} onChange={e => set(key, e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  const validate = () => {
    const errs = [];
    if (!f.sponsorName) errs.push("Sponsor name required");
    if (!f.sponsorEin) errs.push("Sponsor EIN required");
    if (!f.payerName) errs.push("Payer name required");
    if (!f.payerEin) errs.push("Payer EIN required");
    if (!f.subscriberId) errs.push("Subscriber ID required");
    if (!f.firstName) errs.push("First name required");
    if (!f.lastName) errs.push("Last name required");
    if (!f.dob) errs.push("Date of birth required");
    if (!f.enrollmentDate) errs.push("Enrollment date (DTP 336) required");
    if (!f.coverageEffectiveDate) errs.push("Coverage effective date required");
    return errs;
  };

  const handleGenerate = () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    const edi = generateSepOffExchange(f);
    const lastName = (f.lastName || "member").toLowerCase().replace(/\s+/g, "-");
    const filename = `sep-off-exchange-${lastName}-${f.coverageType.toLowerCase()}.edi`;

    // Download
    const blob = new Blob([edi], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);

    // Auto-load into validator
    onLoad(edi, filename);
    onClose();
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>Generate SEP Off-Exchange EDI 834</h2>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={s.subtitle}>Subscriber only — mirrors the 01-sep-off-exchange structure</p>

        {errors.length > 0 && (
          <div style={s.errorBox}>
            <strong>Fix before generating:</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* ── Sponsor & Payer (N1*P5, N1*IN) ── */}
        <div style={s.sectionTitle}>Sponsor (N1*P5) &amp; Payer (N1*IN)</div>
        <div style={s.grid2}>
          <Field label="Sponsor Name">{inp("sponsorName", { placeholder: "e.g. SubscriberGreen Green" })}</Field>
          <Field label="Sponsor EIN (FI)">{inp("sponsorEin", { placeholder: "049898999", maxLength: 9 })}</Field>
          <Field label="Payer Name">{inp("payerName", { placeholder: "e.g. AmeriHealth" })}</Field>
          <Field label="Payer EIN (FI)">{inp("payerEin", { placeholder: "223338404", maxLength: 9 })}</Field>
        </div>

        {/* ── Broker (N1*BO) optional ── */}
        <div style={s.sectionTitle}>Broker (N1*BO) — Optional</div>
        <div style={s.grid2}>
          <Field label="Broker Name">{inp("brokerName", { placeholder: "e.g. Carol Carey" })}</Field>
          <Field label="Broker ID (94)">{inp("brokerId", { placeholder: "e.g. 6523145654" })}</Field>
        </div>

        {/* ── Subscriber REFs (INS/REF) ── */}
        <div style={s.sectionTitle}>Subscriber IDs &amp; REF Segments</div>
        <div style={s.grid2}>
          <Field label="Subscriber ID — REF*0F *">{inp("subscriberId", { placeholder: "INJ000007882" })}</Field>
          <Field label="Group / Policy Number — REF*1L">{inp("groupNumber", { placeholder: "21471" })}</Field>
          <Field label="Exchange Member ID — REF*17">{inp("exchangeMemberId", { placeholder: "same as Subscriber ID" })}</Field>
          <Field label="REF*6O (optional)">{inp("refCode6O")}</Field>
        </div>

        {/* ── Enrollment Dates (DTP*336/356/357) ── */}
        <div style={s.sectionTitle}>Enrollment Dates</div>
        <div style={s.grid3}>
          <Field label="Enrollment Date — DTP*336 *"><input style={s.input} type="date" value={f.enrollmentDate} onChange={e => set("enrollmentDate", e.target.value)} /></Field>
          <Field label="Plan Year Start — DTP*356"><input style={s.input} type="date" value={f.planYearStart} onChange={e => set("planYearStart", e.target.value)} /></Field>
          <Field label="Plan Year End — DTP*357"><input style={s.input} type="date" value={f.planYearEnd} onChange={e => set("planYearEnd", e.target.value)} /></Field>
        </div>

        {/* ── Member Info (NM1/PER) ── */}
        <div style={s.sectionTitle}>Member Name &amp; Contact (NM1 / PER)</div>
        <div style={s.grid2}>
          <Field label="Last Name *">{inp("lastName")}</Field>
          <Field label="First Name *">{inp("firstName")}</Field>
          <Field label="Phone (HP)">{inp("phone", { placeholder: "2013939399" })}</Field>
          <Field label="Email (EM)">{inp("email", { type: "email", placeholder: "member@example.com" })}</Field>
        </div>

        {/* ── Address (N3/N4) ── */}
        <div style={s.sectionTitle}>Address (N3 / N4)</div>
        <div style={{ ...s.grid2, marginBottom: "10px" }}>
          <Field label="Street Address">{inp("address", { placeholder: "185 washington ave" })}</Field>
          <Field label="City">{inp("city", { placeholder: "clifton" })}</Field>
        </div>
        <div style={s.grid3}>
          <Field label="State">{inp("state", { placeholder: "NJ", maxLength: 2 })}</Field>
          <Field label="ZIP">{inp("zip", { placeholder: "07011", maxLength: 10 })}</Field>
          <Field label="County Code (CY)">{inp("countyCode", { placeholder: "34031" })}</Field>
        </div>

        {/* ── Demographics (DMG / HLH / LUI) ── */}
        <div style={s.sectionTitle}>Demographics (DMG / HLH / LUI)</div>
        <div style={s.grid4}>
          <Field label="Date of Birth *"><input style={s.input} type="date" value={f.dob} onChange={e => set("dob", e.target.value)} /></Field>
          <Field label="Gender">
            {sel("gender", [{ value: "M", label: "M — Male" }, { value: "F", label: "F — Female" }, { value: "U", label: "U — Unknown" }])}
          </Field>
          <Field label="Tobacco Use (HLH)">
            {sel("tobaccoUse", [{ value: "N", label: "N — No" }, { value: "Y", label: "Y — Yes" }, { value: "U", label: "U — Unknown" }])}
          </Field>
          <Field label="Spoken Language (LUI)">{inp("spokenLanguage", { placeholder: "chi, spa, eng…" })}</Field>
        </div>
        <div style={{ ...s.grid2, marginTop: "10px" }}>
          <Field label="Race / Ethnicity Codes (DMG-05)">{inp("raceEthnicity", { placeholder: "2029-7,2182-4" })}</Field>
        </div>

        {/* ── Coverage (HD / DTP / AMT / REF) ── */}
        <div style={s.sectionTitle}>Coverage (HD / DTP / AMT / REF)</div>
        <div style={s.grid3}>
          <Field label="Coverage Type">
            {sel("coverageType", COVERAGE_TYPES)}
          </Field>
          <Field label="Effective Date *"><input style={s.input} type="date" value={f.coverageEffectiveDate} onChange={e => set("coverageEffectiveDate", e.target.value)} /></Field>
          <Field label="Premium — AMT*P3">{inp("premium", { placeholder: "568.8" })}</Field>
        </div>
        <div style={{ ...s.grid2, marginTop: "10px" }}>
          <Field label="Plan ID — REF*CE">{inp("planId", { placeholder: "91762NJ007000400" })}</Field>
          <Field label="Billing Arrangement — REF*9V">{inp("billingArrangement", { placeholder: "BILLME" })}</Field>
        </div>

        {/* ── 2700 Loop ── */}
        <div style={s.sectionTitle}>2700 Loop — Exchange / SEP Info</div>
        <div style={s.grid3}>
          <Field label="Source Exchange ID (LX*2)">{inp("sourceExchangeId", { placeholder: "OIEHP" })}</Field>
          <Field label="Is FFM? (LX*3)">
            {sel("isFFM", [{ value: "false", label: "false" }, { value: "true", label: "true" }])}
          </Field>
          <Field label="Rating Area (LX*7)">{inp("ratingArea", { placeholder: "R-NJ001" })}</Field>
        </div>
        <div style={{ ...s.grid3, marginTop: "10px" }}>
          <Field label="PRE AMT TOT (LX*4)">{inp("preAmtTot", { placeholder: "same as premium if blank" })}</Field>
          <Field label="PRE AMT 1 (LX*5)">{inp("preAmt1", { placeholder: "same as premium if blank" })}</Field>
          <Field label="TOT RES AMT (LX*6)">{inp("totResAmt", { placeholder: "same as premium if blank" })}</Field>
        </div>
        <div style={{ ...s.grid4, marginTop: "10px" }}>
          <Field label="SEP Reason (LX*8)">
            {sel("sepReason", SEP_REASONS)}
          </Field>
          <Field label="ICHRA/QSEHRA (LX*9)">
            {sel("ichraQsehra", [{ value: "N", label: "N — No" }, { value: "Y", label: "Y — Yes" }])}
          </Field>
          <Field label="QSEHRA Spouse (LX*10)">
            {sel("qsehraSpouse", [{ value: "N", label: "N — No" }, { value: "Y", label: "Y — Yes" }])}
          </Field>
          <Field label="QSEHRA Both (LX*11)">
            {sel("qsehraBoth", [{ value: "N", label: "N — No" }, { value: "Subscriber", label: "Subscriber" }, { value: "Y", label: "Y — Yes" }])}
          </Field>
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.generateBtn} onClick={handleGenerate}>⬇ Generate &amp; Load EDI</button>
        </div>
      </div>
    </div>
  );
}
