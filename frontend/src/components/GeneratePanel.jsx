import { useState } from "react";
import { generate834, TRANSACTION_TYPES, COVERAGE_TYPES, MAINTENANCE_REASONS } from "../utils/generate834";

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
    zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px",
  },
  modal: {
    background: "white", borderRadius: "20px", width: "100%", maxWidth: "760px",
    maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 24px 64px rgba(15,23,42,0.25)",
    padding: "32px",
    fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title: { margin: 0, fontSize: "22px", fontWeight: 800, color: "#1e3a5f" },
  closeBtn: {
    background: "none", border: "none", fontSize: "22px", cursor: "pointer",
    color: "#64748b", lineHeight: 1, padding: "4px",
  },
  section: { marginBottom: "24px" },
  sectionTitle: {
    fontSize: "13px", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase",
    letterSpacing: "0.06em", marginBottom: "12px", paddingBottom: "6px",
    borderBottom: "1px solid #e2e8f0",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" },
  field: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "12px", fontWeight: 600, color: "#475569" },
  input: {
    padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1",
    fontSize: "14px", outline: "none",
  },
  select: {
    padding: "9px 12px", borderRadius: "10px", border: "1px solid #cbd5e1",
    fontSize: "14px", background: "white", cursor: "pointer",
  },
  covRow: {
    display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr auto",
    gap: "8px", alignItems: "end", marginBottom: "8px",
  },
  depCard: {
    border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px",
    marginBottom: "12px", background: "#f8fafc",
  },
  depHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  depTitle: { fontSize: "14px", fontWeight: 700, color: "#334155" },
  addBtn: {
    background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
    borderRadius: "8px", padding: "7px 14px", fontSize: "13px",
    cursor: "pointer", fontWeight: 600,
  },
  removeBtn: {
    background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca",
    borderRadius: "8px", padding: "5px 10px", fontSize: "12px", cursor: "pointer",
  },
  footer: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" },
  generateBtn: {
    background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", color: "white",
    border: "none", borderRadius: "12px", padding: "12px 28px",
    fontSize: "15px", fontWeight: 700, cursor: "pointer",
  },
  cancelBtn: {
    background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0",
    borderRadius: "12px", padding: "12px 20px", fontSize: "14px",
    fontWeight: 600, cursor: "pointer",
  },
};

const defaultCoverage = () => ({
  type: "HLT", planId: "", effectiveDate: "", termDate: "", premium: "", coverageLevel: "IND",
});

const defaultDependent = () => ({
  firstName: "", lastName: "", dob: "", gender: "M", ssn: "",
  memberId: "", relationshipCode: "19",
  address1: "", city: "", state: "", zip: "",
  phone: "", email: "",
  coverages: [defaultCoverage()],
});

function CoverageRow({ cov, onChange, onRemove, showRemove }) {
  return (
    <div style={s.covRow}>
      <div style={s.field}>
        <label style={s.label}>Type</label>
        <select style={s.select} value={cov.type} onChange={e => onChange("type", e.target.value)}>
          {COVERAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div style={s.field}>
        <label style={s.label}>Plan ID</label>
        <input style={s.input} value={cov.planId} onChange={e => onChange("planId", e.target.value)} placeholder="Plan ID" />
      </div>
      <div style={s.field}>
        <label style={s.label}>Effective Date</label>
        <input style={s.input} type="date" value={cov.effectiveDate} onChange={e => onChange("effectiveDate", e.target.value)} />
      </div>
      <div style={s.field}>
        <label style={s.label}>Term Date</label>
        <input style={s.input} type="date" value={cov.termDate} onChange={e => onChange("termDate", e.target.value)} />
      </div>
      <div style={s.field}>
        <label style={s.label}>Premium ($)</label>
        <input style={s.input} value={cov.premium} onChange={e => onChange("premium", e.target.value)} placeholder="0.00" />
      </div>
      <div>
        {showRemove && (
          <button style={{ ...s.removeBtn, marginTop: "18px" }} onClick={onRemove}>✕</button>
        )}
      </div>
    </div>
  );
}

function MemberFields({ member, onChange, label, showRelationship }) {
  const updateCov = (idx, key, val) => {
    const covs = member.coverages.map((c, i) => i === idx ? { ...c, [key]: val } : c);
    onChange("coverages", covs);
  };
  const addCov = () => onChange("coverages", [...member.coverages, defaultCoverage()]);
  const removeCov = (idx) => onChange("coverages", member.coverages.filter((_, i) => i !== idx));

  return (
    <div>
      <div style={s.grid3}>
        <div style={s.field}>
          <label style={s.label}>First Name *</label>
          <input style={s.input} value={member.firstName} onChange={e => onChange("firstName", e.target.value)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Last Name *</label>
          <input style={s.input} value={member.lastName} onChange={e => onChange("lastName", e.target.value)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Date of Birth *</label>
          <input style={s.input} type="date" value={member.dob} onChange={e => onChange("dob", e.target.value)} />
        </div>
      </div>
      <div style={{ ...s.grid3, marginTop: "10px" }}>
        <div style={s.field}>
          <label style={s.label}>Gender</label>
          <select style={s.select} value={member.gender} onChange={e => onChange("gender", e.target.value)}>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="U">Unknown</option>
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>SSN (9 digits)</label>
          <input style={s.input} value={member.ssn} onChange={e => onChange("ssn", e.target.value)} placeholder="000000000" maxLength={9} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Member ID (optional)</label>
          <input style={s.input} value={member.memberId} onChange={e => onChange("memberId", e.target.value)} />
        </div>
      </div>
      {showRelationship && (
        <div style={{ ...s.grid3, marginTop: "10px" }}>
          <div style={s.field}>
            <label style={s.label}>Relationship Code</label>
            <select style={s.select} value={member.relationshipCode} onChange={e => onChange("relationshipCode", e.target.value)}>
              <option value="19">19 — Child</option>
              <option value="01">01 — Spouse</option>
              <option value="15">15 — Life Partner</option>
              <option value="17">17 — Step Child</option>
              <option value="53">53 — Other</option>
            </select>
          </div>
        </div>
      )}
      <div style={{ ...s.grid2, marginTop: "10px" }}>
        <div style={s.field}>
          <label style={s.label}>Address</label>
          <input style={s.input} value={member.address1} onChange={e => onChange("address1", e.target.value)} placeholder="123 Main St" />
        </div>
        <div style={s.field}>
          <label style={s.label}>City</label>
          <input style={s.input} value={member.city} onChange={e => onChange("city", e.target.value)} />
        </div>
      </div>
      <div style={{ ...s.grid3, marginTop: "10px" }}>
        <div style={s.field}>
          <label style={s.label}>State</label>
          <input style={s.input} value={member.state} onChange={e => onChange("state", e.target.value)} placeholder="NJ" maxLength={2} />
        </div>
        <div style={s.field}>
          <label style={s.label}>ZIP</label>
          <input style={s.input} value={member.zip} onChange={e => onChange("zip", e.target.value)} maxLength={10} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Phone</label>
          <input style={s.input} value={member.phone} onChange={e => onChange("phone", e.target.value)} placeholder="2015551234" />
        </div>
      </div>
      <div style={{ ...s.grid2, marginTop: "10px" }}>
        <div style={s.field}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={member.email} onChange={e => onChange("email", e.target.value)} />
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>COVERAGES</div>
        {member.coverages.map((cov, idx) => (
          <CoverageRow
            key={idx} cov={cov}
            onChange={(k, v) => updateCov(idx, k, v)}
            onRemove={() => removeCov(idx)}
            showRemove={member.coverages.length > 1}
          />
        ))}
        <button style={s.addBtn} onClick={addCov}>+ Add Coverage</button>
      </div>
    </div>
  );
}

export default function GeneratePanel({ onClose, onLoad }) {
  const [txType, setTxType] = useState("021");
  const [maintReason, setMaintReason] = useState("AI");
  const [sponsor, setSponsor] = useState({ name: "", ein: "" });
  const [payer, setPayer] = useState({ name: "", ein: "" });
  const [subscriber, setSubscriber] = useState({
    firstName: "", lastName: "", dob: "", gender: "M", ssn: "",
    memberId: "", effectiveDate: "", planYearStart: "", planYearEnd: "",
    address1: "", city: "", state: "", zip: "", phone: "", email: "",
    coverages: [defaultCoverage()],
  });
  const [dependents, setDependents] = useState([]);
  const [errors, setErrors] = useState([]);

  const updateSubscriber = (key, val) => setSubscriber(s => ({ ...s, [key]: val }));
  const updateDependent = (idx, key, val) => setDependents(deps => deps.map((d, i) => i === idx ? { ...d, [key]: val } : d));
  const addDependent = () => setDependents(d => [...d, defaultDependent()]);
  const removeDependent = (idx) => setDependents(d => d.filter((_, i) => i !== idx));

  const handleTxTypeChange = (val) => {
    setTxType(val);
    setMaintReason(MAINTENANCE_REASONS[val]?.[0]?.value || "AI");
  };

  const validate = () => {
    const errs = [];
    if (!subscriber.firstName) errs.push("Subscriber first name is required");
    if (!subscriber.lastName) errs.push("Subscriber last name is required");
    if (!subscriber.dob) errs.push("Subscriber date of birth is required");
    if (!subscriber.ssn && !subscriber.memberId) errs.push("Subscriber SSN or Member ID is required");
    subscriber.coverages.forEach((c, i) => {
      if (!c.effectiveDate) errs.push(`Coverage ${i + 1}: effective date is required`);
    });
    return errs;
  };

  const handleGenerate = () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    const edi = generate834({
      transactionType: txType,
      maintenanceReason: maintReason,
      sponsor: { name: sponsor.name || "SPONSOR", ein: sponsor.ein || "000000000" },
      payer: { name: payer.name || "PAYER", ein: payer.ein || "000000000" },
      subscriber,
      dependents,
    });

    // Build filename
    const lastName = (subscriber.lastName || "member").toLowerCase().replace(/\s+/g, "-");
    const txLabel = { "021": "enrollment", "024": "termination", "001": "change" }[txType] || "834";
    const filename = `${txLabel}-${lastName}-${Date.now()}.edi`;

    // Download
    const blob = new Blob([edi], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    // Auto-load into validator
    onLoad(edi, filename);
    onClose();
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>Generate EDI 834</h2>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {errors.length > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#b91c1c", fontSize: "13px" }}>
            <strong>Please fix the following:</strong>
            <ul style={{ margin: "6px 0 0 0", paddingLeft: "18px" }}>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Transaction */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Transaction</div>
          <div style={s.grid2}>
            <div style={s.field}>
              <label style={s.label}>Transaction Type</label>
              <select style={s.select} value={txType} onChange={e => handleTxTypeChange(e.target.value)}>
                {TRANSACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Maintenance Reason</label>
              <select style={s.select} value={maintReason} onChange={e => setMaintReason(e.target.value)}>
                {(MAINTENANCE_REASONS[txType] || []).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Sponsor / Payer */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Sponsor &amp; Payer</div>
          <div style={s.grid2}>
            <div style={s.field}>
              <label style={s.label}>Sponsor Name</label>
              <input style={s.input} value={sponsor.name} onChange={e => setSponsor(p => ({ ...p, name: e.target.value }))} placeholder="Employer / Exchange" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Sponsor EIN</label>
              <input style={s.input} value={sponsor.ein} onChange={e => setSponsor(p => ({ ...p, ein: e.target.value }))} placeholder="000000000" maxLength={9} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Payer Name</label>
              <input style={s.input} value={payer.name} onChange={e => setPayer(p => ({ ...p, name: e.target.value }))} placeholder="Health Plan" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Payer EIN</label>
              <input style={s.input} value={payer.ein} onChange={e => setPayer(p => ({ ...p, ein: e.target.value }))} placeholder="000000000" maxLength={9} />
            </div>
          </div>
        </div>

        {/* Subscriber */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Subscriber</div>
          <div style={{ ...s.grid2, marginBottom: "12px" }}>
            <div style={s.field}>
              <label style={s.label}>Plan Year Start</label>
              <input style={s.input} type="date" value={subscriber.planYearStart} onChange={e => updateSubscriber("planYearStart", e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Plan Year End</label>
              <input style={s.input} type="date" value={subscriber.planYearEnd} onChange={e => updateSubscriber("planYearEnd", e.target.value)} />
            </div>
          </div>
          <MemberFields member={subscriber} onChange={updateSubscriber} showRelationship={false} />
        </div>

        {/* Dependents */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Dependents (Optional)</div>
          {dependents.map((dep, idx) => (
            <div key={idx} style={s.depCard}>
              <div style={s.depHeader}>
                <span style={s.depTitle}>Dependent {idx + 1}</span>
                <button style={s.removeBtn} onClick={() => removeDependent(idx)}>Remove</button>
              </div>
              <MemberFields
                member={dep}
                onChange={(k, v) => updateDependent(idx, k, v)}
                showRelationship={true}
              />
            </div>
          ))}
          <button style={s.addBtn} onClick={addDependent}>+ Add Dependent</button>
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.generateBtn} onClick={handleGenerate}>⬇ Generate &amp; Load EDI</button>
        </div>
      </div>
    </div>
  );
}
