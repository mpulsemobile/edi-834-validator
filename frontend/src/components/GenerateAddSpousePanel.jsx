import { useState } from "react";
import { generateAddSpouse, COVERAGE_TYPES } from "../utils/generate834";

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  modal: { background: "white", borderRadius: "20px", width: "100%", maxWidth: "820px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(15,23,42,0.3)", padding: "32px", fontFamily: "'Inter','Segoe UI',Arial,sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  title: { margin: 0, fontSize: "22px", fontWeight: 800, color: "#1e3a5f" },
  subtitle: { margin: "0 0 24px", fontSize: "13px", color: "#64748b" },
  closeBtn: { background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#64748b", padding: "4px" },
  sectionTitle: { fontSize: "11px", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "20px 0 10px", paddingBottom: "6px", borderBottom: "2px solid #eff6ff" },
  spouseSectionTitle: { fontSize: "11px", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.07em", margin: "20px 0 10px", paddingBottom: "6px", borderBottom: "2px solid #f3e8ff" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" },
  grid4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" },
  field: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "11px", fontWeight: 600, color: "#475569", letterSpacing: "0.03em" },
  input: { padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", color: "#0f172a" },
  spouseInput: { padding: "8px 11px", borderRadius: "8px", border: "1px solid #ddd6fe", fontSize: "13px", outline: "none", color: "#0f172a" },
  select: { padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white", color: "#0f172a" },
  spouseSelect: { padding: "8px 11px", borderRadius: "8px", border: "1px solid #ddd6fe", fontSize: "13px", background: "white", color: "#0f172a" },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", color: "#b91c1c", fontSize: "13px" },
  footer: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" },
  generateBtn: { background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", color: "white", border: "none", borderRadius: "10px", padding: "11px 26px", fontSize: "14px", fontWeight: 700, cursor: "pointer" },
  cancelBtn: { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "11px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
};

function Field({ label, children }) {
  return <div style={s.field}><label style={s.label}>{label}</label>{children}</div>;
}

const defaultSubscriber = {
  subscriberId: "", groupNumber: "", exchangeMemberId: "", refCode6O: "",
  enrollmentDate: "", planYearStart: "", planYearEnd: "",
  firstName: "", lastName: "", phone: "", email: "",
  address: "", city: "", state: "", zip: "", countyCode: "",
  dob: "", gender: "M", raceEthnicity: "", tobaccoUse: "N", spokenLanguage: "",
  coverageType: "HLT", coverageEffectiveDate: "", coverageAppDate: "", premium: "", planId: "", billingArrangement: "BILLME",
};

const defaultSpouse = {
  firstName: "", lastName: "", dob: "", gender: "F",
  memberId: "", exchangeMemberId: "",
  address: "", city: "", state: "", zip: "", countyCode: "",
  tobaccoUse: "N",
  coverageType: "HLT", coverageEffectiveDate: "", coverageAppDate: "", premium: "", planId: "",
};

const defaultForm = {
  interchangeControlNum: "",
  sponsorName: "", sponsorEin: "",
  payerName: "", payerEin: "",
  brokerName: "", brokerId: "",
  sourceExchangeId: "", isFFM: "false",
  preAmtTot: "", totResAmt: "", ratingArea: "",
  ichraQsehra: "N", qsehraSpouse: "N", qsehraBoth: "N",
};

export default function GenerateAddSpousePanel({ onClose, onLoad }) {
  const [f, setF] = useState(defaultForm);
  const [sub, setSub] = useState(defaultSubscriber);
  const [sp, setSp] = useState(defaultSpouse);
  const [errors, setErrors] = useState([]);

  const setF2 = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setSub2 = (k, v) => setSub(p => ({ ...p, [k]: v }));
  const setSp2 = (k, v) => setSp(p => ({ ...p, [k]: v }));

  const inp = (isSpouse, obj, setter, key, extra = {}) => (
    <input style={isSpouse ? s.spouseInput : s.input} value={obj[key]} onChange={e => setter(key, e.target.value)} {...extra} />
  );
  const sel = (isSpouse, obj, setter, key, opts) => (
    <select style={isSpouse ? s.spouseSelect : s.select} value={obj[key]} onChange={e => setter(key, e.target.value)}>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  const validate = () => {
    const errs = [];
    if (!f.sponsorName) errs.push("Sponsor name required");
    if (!f.sponsorEin) errs.push("Sponsor EIN required");
    if (!f.payerName) errs.push("Payer name required");
    if (!f.payerEin) errs.push("Payer EIN required");
    if (!sub.subscriberId) errs.push("Subscriber ID required");
    if (!sub.firstName || !sub.lastName) errs.push("Subscriber name required");
    if (!sub.dob) errs.push("Subscriber date of birth required");
    if (!sub.coverageEffectiveDate) errs.push("Subscriber coverage effective date required");
    if (!sp.firstName || !sp.lastName) errs.push("Spouse name required");
    if (!sp.dob) errs.push("Spouse date of birth required");
    if (!sp.coverageEffectiveDate) errs.push("Spouse coverage effective date required");
    return errs;
  };

  const handleGenerate = () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    const edi = generateAddSpouse({ ...f, subscriber: sub, spouse: sp });
    const lastName = (sub.lastName || "member").toLowerCase().replace(/\s+/g, "-");
    const filename = `add-spouse-${lastName}-${sub.coverageType.toLowerCase()}.edi`;

    const blob = new Blob([edi], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);

    onLoad(edi, filename);
    onClose();
  };

  const genderOpts = [{ value: "M", label: "M — Male" }, { value: "F", label: "F — Female" }, { value: "U", label: "U — Unknown" }];
  const tobaccoOpts = [{ value: "N", label: "N — No" }, { value: "Y", label: "Y — Yes" }, { value: "U", label: "U — Unknown" }];
  const yesNoOpts = [{ value: "N", label: "N" }, { value: "Y", label: "Y" }];

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>Generate Add Spouse EDI 834</h2>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={s.subtitle}>Subscriber + Spouse — mirrors the 10-add-spouse structure</p>

        {errors.length > 0 && (
          <div style={s.errorBox}>
            <strong>Fix before generating:</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Interchange */}
        <div style={s.sectionTitle}>Interchange (ISA)</div>
        <div style={s.grid2}>
          <Field label="Interchange Control Number (ISA-13)">{inp(false, f, setF2, "interchangeControlNum", { placeholder: "e.g. 977114579", maxLength: 9 })}</Field>
        </div>

        {/* Sponsor & Payer */}
        <div style={s.sectionTitle}>Sponsor (N1*P5) &amp; Payer (N1*IN)</div>
        <div style={s.grid2}>
          <Field label="Sponsor Name">{inp(false, f, setF2, "sponsorName", { placeholder: "SubscriberBlue Blue" })}</Field>
          <Field label="Sponsor EIN">{inp(false, f, setF2, "sponsorEin", { placeholder: "078989899", maxLength: 9 })}</Field>
          <Field label="Payer Name">{inp(false, f, setF2, "payerName", { placeholder: "AmeriHealth" })}</Field>
          <Field label="Payer EIN">{inp(false, f, setF2, "payerEin", { placeholder: "223338404", maxLength: 9 })}</Field>
        </div>

        {/* Broker */}
        <div style={s.sectionTitle}>Broker (N1*BO) — Optional</div>
        <div style={s.grid2}>
          <Field label="Broker Name">{inp(false, f, setF2, "brokerName", { placeholder: "Carol Carey" })}</Field>
          <Field label="Broker ID">{inp(false, f, setF2, "brokerId", { placeholder: "6523145654" })}</Field>
        </div>

        {/* Subscriber REFs & Dates */}
        <div style={s.sectionTitle}>Subscriber IDs &amp; Dates</div>
        <div style={s.grid2}>
          <Field label="Subscriber ID — REF*0F *">{inp(false, sub, setSub2, "subscriberId", { placeholder: "INJ000007883" })}</Field>
          <Field label="Group Number — REF*1L">{inp(false, sub, setSub2, "groupNumber", { placeholder: "21480" })}</Field>
          <Field label="Exchange Member ID — REF*17">{inp(false, sub, setSub2, "exchangeMemberId", { placeholder: "same as Subscriber ID" })}</Field>
          <Field label="REF*6O (optional)">{inp(false, sub, setSub2, "refCode6O")}</Field>
        </div>
        <div style={{ ...s.grid3, marginTop: "10px" }}>
          <Field label="Enrollment Date — DTP*336 *"><input style={s.input} type="date" value={sub.enrollmentDate} onChange={e => setSub2("enrollmentDate", e.target.value)} /></Field>
          <Field label="Plan Year Start — DTP*356"><input style={s.input} type="date" value={sub.planYearStart} onChange={e => setSub2("planYearStart", e.target.value)} /></Field>
          <Field label="Plan Year End — DTP*357"><input style={s.input} type="date" value={sub.planYearEnd} onChange={e => setSub2("planYearEnd", e.target.value)} /></Field>
        </div>

        {/* Subscriber Info */}
        <div style={s.sectionTitle}>Subscriber Info (NM1 / PER / N3 / DMG)</div>
        <div style={s.grid3}>
          <Field label="Last Name *">{inp(false, sub, setSub2, "lastName")}</Field>
          <Field label="First Name *">{inp(false, sub, setSub2, "firstName")}</Field>
          <Field label="DOB *"><input style={s.input} type="date" value={sub.dob} onChange={e => setSub2("dob", e.target.value)} /></Field>
        </div>
        <div style={{ ...s.grid4, marginTop: "10px" }}>
          <Field label="Gender">{sel(false, sub, setSub2, "gender", genderOpts)}</Field>
          <Field label="Tobacco Use">{sel(false, sub, setSub2, "tobaccoUse", tobaccoOpts)}</Field>
          <Field label="Spoken Language">{inp(false, sub, setSub2, "spokenLanguage", { placeholder: "por, chi, spa…" })}</Field>
          <Field label="Race / Ethnicity">{inp(false, sub, setSub2, "raceEthnicity", { placeholder: "2054-5,2180-8" })}</Field>
        </div>
        <div style={{ ...s.grid2, marginTop: "10px" }}>
          <Field label="Phone">{inp(false, sub, setSub2, "phone", { placeholder: "2019398383" })}</Field>
          <Field label="Email">{inp(false, sub, setSub2, "email", { type: "email" })}</Field>
        </div>
        <div style={{ ...s.grid2, marginTop: "10px" }}>
          <Field label="Address">{inp(false, sub, setSub2, "address", { placeholder: "185 washington ave" })}</Field>
          <Field label="City">{inp(false, sub, setSub2, "city", { placeholder: "clifton" })}</Field>
        </div>
        <div style={{ ...s.grid3, marginTop: "10px" }}>
          <Field label="State">{inp(false, sub, setSub2, "state", { placeholder: "NJ", maxLength: 2 })}</Field>
          <Field label="ZIP">{inp(false, sub, setSub2, "zip", { placeholder: "07011" })}</Field>
          <Field label="County Code">{inp(false, sub, setSub2, "countyCode", { placeholder: "34031" })}</Field>
        </div>

        {/* Subscriber Coverage */}
        <div style={s.sectionTitle}>Subscriber Coverage (HD — coverage level: TWO)</div>
        <div style={s.grid3}>
          <Field label="Coverage Type">{sel(false, sub, setSub2, "coverageType", COVERAGE_TYPES)}</Field>
          <Field label="Coverage Effective Date *"><input style={s.input} type="date" value={sub.coverageEffectiveDate} onChange={e => setSub2("coverageEffectiveDate", e.target.value)} /></Field>
          <Field label="Application Date — DTP*303"><input style={s.input} type="date" value={sub.coverageAppDate} onChange={e => setSub2("coverageAppDate", e.target.value)} /></Field>
        </div>
        <div style={{ ...s.grid3, marginTop: "10px" }}>
          <Field label="Premium — AMT*P3">{inp(false, sub, setSub2, "premium", { placeholder: "568.8" })}</Field>
          <Field label="Plan ID — REF*CE">{inp(false, sub, setSub2, "planId", { placeholder: "91762NJ007000400" })}</Field>
          <Field label="Billing Arr. — REF*9V">{inp(false, sub, setSub2, "billingArrangement", { placeholder: "BILLME" })}</Field>
        </div>

        {/* 2700 Loop */}
        <div style={s.sectionTitle}>Exchange / QSEHRA Info (Subscriber 2700 Loop)</div>
        <div style={s.grid3}>
          <Field label="Source Exchange ID (LX*2)">{inp(false, f, setF2, "sourceExchangeId", { placeholder: "OIEHP" })}</Field>
          <Field label="Is FFM? (LX*3)">{sel(false, f, setF2, "isFFM", [{ value: "false", label: "false" }, { value: "true", label: "true" }])}</Field>
          <Field label="Rating Area (LX*7)">{inp(false, f, setF2, "ratingArea", { placeholder: "R-NJ001" })}</Field>
        </div>
        <div style={{ ...s.grid3, marginTop: "10px" }}>
          <Field label="PRE AMT TOT (LX*4)">{inp(false, f, setF2, "preAmtTot", { placeholder: "combined total e.g. 1453.47" })}</Field>
          <Field label="TOT RES AMT (LX*6)">{inp(false, f, setF2, "totResAmt", { placeholder: "same as PRE AMT TOT" })}</Field>
        </div>
        <div style={{ ...s.grid3, marginTop: "10px" }}>
          <Field label="ICHRA/QSEHRA (LX*8)">{sel(false, f, setF2, "ichraQsehra", yesNoOpts)}</Field>
          <Field label="QSEHRA Spouse (LX*9)">{sel(false, f, setF2, "qsehraSpouse", yesNoOpts)}</Field>
          <Field label="QSEHRA Both (LX*10)">{sel(false, f, setF2, "qsehraBoth", yesNoOpts)}</Field>
        </div>

        {/* ── SPOUSE ── */}
        <div style={{ ...s.spouseSectionTitle, marginTop: "28px", fontSize: "13px", borderBottom: "2px solid #7c3aed", paddingBottom: "8px" }}>
          👤 Spouse
        </div>

        <div style={s.spouseSectionTitle}>Spouse IDs &amp; Demographics</div>
        <div style={s.grid3}>
          <Field label="Last Name *">{inp(true, sp, setSp2, "lastName")}</Field>
          <Field label="First Name *">{inp(true, sp, setSp2, "firstName")}</Field>
          <Field label="DOB *"><input style={s.spouseInput} type="date" value={sp.dob} onChange={e => setSp2("dob", e.target.value)} /></Field>
        </div>
        <div style={{ ...s.grid4, marginTop: "10px" }}>
          <Field label="Gender">{sel(true, sp, setSp2, "gender", genderOpts)}</Field>
          <Field label="Tobacco Use">{sel(true, sp, setSp2, "tobaccoUse", tobaccoOpts)}</Field>
          <Field label="Member ID — NM1*34">{inp(true, sp, setSp2, "memberId", { placeholder: "097847474" })}</Field>
          <Field label="Exchange Member ID — REF*17">{inp(true, sp, setSp2, "exchangeMemberId", { placeholder: "INJ000017553" })}</Field>
        </div>
        <div style={{ ...s.grid2, marginTop: "10px" }}>
          <Field label="Address">{inp(true, sp, setSp2, "address", { placeholder: "185 washington ave" })}</Field>
          <Field label="City">{inp(true, sp, setSp2, "city", { placeholder: "clifton" })}</Field>
        </div>
        <div style={{ ...s.grid3, marginTop: "10px" }}>
          <Field label="State">{inp(true, sp, setSp2, "state", { placeholder: "NJ", maxLength: 2 })}</Field>
          <Field label="ZIP">{inp(true, sp, setSp2, "zip", { placeholder: "07011" })}</Field>
          <Field label="County Code">{inp(true, sp, setSp2, "countyCode", { placeholder: "34031" })}</Field>
        </div>

        <div style={s.spouseSectionTitle}>Spouse Coverage (HD — coverage level: TWO)</div>
        <div style={s.grid3}>
          <Field label="Coverage Type">{sel(true, sp, setSp2, "coverageType", COVERAGE_TYPES)}</Field>
          <Field label="Coverage Effective Date *"><input style={s.spouseInput} type="date" value={sp.coverageEffectiveDate} onChange={e => setSp2("coverageEffectiveDate", e.target.value)} /></Field>
          <Field label="Application Date — DTP*303"><input style={s.spouseInput} type="date" value={sp.coverageAppDate} onChange={e => setSp2("coverageAppDate", e.target.value)} /></Field>
        </div>
        <div style={{ ...s.grid2, marginTop: "10px" }}>
          <Field label="Premium — AMT*P3">{inp(true, sp, setSp2, "premium", { placeholder: "884.67" })}</Field>
          <Field label="Plan ID — REF*CE">{inp(true, sp, setSp2, "planId", { placeholder: "91762NJ007000400" })}</Field>
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.generateBtn} onClick={handleGenerate}>⬇ Generate &amp; Load EDI</button>
        </div>
      </div>
    </div>
  );
}
