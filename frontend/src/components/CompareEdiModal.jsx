import { useState, useCallback } from "react";
import { parse834 } from "../utils/parse834";
import {
  getRelationshipLabel,
  getMaintenanceTypeLabel,
  getMaintenanceReasonLabel,
  getCoverageLevelLabel,
  getMaritalStatusLabel,
  getSepReasonLabel,
  getAmrcLabel,
  getLanguageLabel,
} from "../utils/formatter";

// ─── EDI summary (mirrors Dashboard generateEdiSummary) ───────────────────────
function generateEdiSummary(parsed) {
  if (!parsed?.members?.length) return null;

  const members = parsed.members;
  const additions  = members.filter(m => m.maintenanceTypeCode === "021");
  const cancelTerms= members.filter(m => m.maintenanceTypeCode === "024");
  const changes    = members.filter(m => m.maintenanceTypeCode === "001");

  const fmtDate = (raw) => {
    if (!raw || raw.length < 8) return "N/A";
    return `${raw.slice(4,6)}/${raw.slice(6,8)}/${raw.slice(0,4)}`;
  };

  const getName = (m) => [m.firstName, m.lastName].filter(Boolean).join(" ") || "Member";
  const getPrimaryCov = (m) => m.coverages?.[0] || null;
  const getCovType    = (cov) => cov?.insuranceLineCode || "Unknown";
  const getCovDate    = (cov, key) => fmtDate(cov?.dates?.[key]);
  const isCancelAction= (m) => ["14","59","29","AI"].includes(m.maintenanceReasonCode);

  const buildNameList = (list) => {
    const entries = list.map(m => `${getRelationshipLabel(m.relationshipCode, m.isSubscriber)} ${getName(m)}`);
    if (entries.length === 1) return entries[0];
    return entries.slice(0,-1).join(", ") + " and " + entries[entries.length-1];
  };

  if (changes.length > 0 && (additions.length > 0 || cancelTerms.length > 0)) {
    if (additions.length > 0) {
      const cov = getPrimaryCov(additions[0]);
      return `This 834 is adding ${buildNameList(additions)} to this policy, with Benefit Begin Date of ${getCovDate(cov,"348")} for coverage ${getCovType(cov)}.`;
    }
    if (cancelTerms.length > 0) {
      const m = cancelTerms[0]; const cov = getPrimaryCov(m);
      const action = isCancelAction(m) ? "cancelling" : "terminating";
      if (m.isSubscriber) return `This 834 is ${action} the entire policy, with Benefit End Date of ${getCovDate(cov,"349")} for coverage ${getCovType(cov)}.`;
      return `This 834 is ${action} ${getName(m)} who is a ${getRelationshipLabel(m.relationshipCode,m.isSubscriber)} to this policy, with Benefit End Date of ${getCovDate(cov,"349")} for coverage ${getCovType(cov)}.`;
    }
  }
  if (additions.length > 0 && cancelTerms.length === 0 && changes.length === 0) {
    const cov = getPrimaryCov(additions[0]);
    return `This 834 is adding ${buildNameList(additions)}, with Benefit Begin Date of ${getCovDate(cov,"348")} for coverage ${getCovType(cov)}.`;
  }
  if (cancelTerms.length > 0 && additions.length === 0 && changes.length === 0) {
    const m = cancelTerms[0]; const cov = getPrimaryCov(m);
    const action = isCancelAction(m) ? "cancelling" : "terminating";
    if (m.isSubscriber) return `This 834 is ${action} the entire policy, with Benefit End Date of ${getCovDate(cov,"349")} for coverage ${getCovType(cov)}.`;
    return `This 834 is ${action} ${getName(m)} who is a ${getRelationshipLabel(m.relationshipCode,m.isSubscriber)} to this policy, with Benefit End Date of ${getCovDate(cov,"349")} for coverage ${getCovType(cov)}.`;
  }
  if (changes.length > 0 && additions.length === 0 && cancelTerms.length === 0) {
    const subscriber = changes.find(m => m.isSubscriber) || changes[0];
    const cov = getPrimaryCov(subscriber);
    if (cov?.cmsPlanId) return `This 834 is changing the Plan ID of the Subscriber, with Benefit Begin Date of ${getCovDate(cov,"348")} for coverage ${getCovType(cov)}.`;
    return `This 834 is changing enrollment data for the Subscriber, with Benefit Begin Date of ${getCovDate(cov,"348")} for coverage ${getCovType(cov)}.`;
  }
  return null;
}

// ─── Segment translator ────────────────────────────────────────────────────────
// Returns a human-readable label for a normalised segment string.
function translateSegment(seg) {
  if (!seg) return "";
  const f = seg.split("*");
  const tag = (f[0] || "").toUpperCase();

  const DTP_QUAL = {
    "303": "Coverage Start Reported",
    "336": "File Creation Date",
    "348": "Benefit Begin Date",
    "349": "Coverage End/Term Date",
    "007": "Effective Date (Loop)",
    "356": "Eligibility Start Date",
    "357": "Plan Period End Date",
  };

  const REF_QUAL = {
    "0F":  "Subscriber ID",
    "1L":  "Enrollment Group ID",
    "17":  "Cross-Reference ID",
    "1W":  "Member ID",
    "6O":  "Issuer-Assigned Member ID",
    "CE":  "CMS Plan ID",
    "9V":  "Financial Reference",
    "9X":  "Financial Reference",
    "3H":  "Group Policy #",
    "2V":  "Additional Ref",
    "ZZ":  "Mutually Defined Ref",
    "QQ":  "Plan-Specific Ref",
  };

  const N1_QUAL = {
    "P5": "Sponsor",
    "IN": "Payer / Insurer",
    "BO": "Broker",
    "TV": "Supervisor",
    "75": "Loop Label",
  };

  const AMT_QUAL = {
    "P3":  "Monthly Premium",
    "P5":  "Employee Premium Contribution",
    "P6":  "Employer Premium Contribution",
    "D2":  "Out-of-Pocket Amount",
    "EBA": "Premium Paid YTD",
  };

  const HD_CODE = { "021": "Addition", "001": "Change", "024": "Cancellation" };
  const COV_TYPE = { HLT: "Medical", DEN: "Dental", VIS: "Vision", "": "All" };
  const GENDER = { M: "Male", F: "Female", U: "Unknown" };
  const YN = { Y: "Yes", N: "No" };

  const fmt = (raw) => {
    if (!raw || raw === "***" || raw === "") return "—";
    // Format date D8:YYYYMMDD → MM/DD/YYYY
    if (/^\d{8}$/.test(raw)) {
      return `${raw.slice(4,6)}/${raw.slice(6,8)}/${raw.slice(0,4)}`;
    }
    return raw;
  };

  try {
    switch (tag) {
      case "ST":  return `Transaction Set: 834 (Benefit Enrollment)`;
      case "BGN": return `Transaction: type=${f[1]}, ref=${fmt(f[2])}, date=${fmt(f[3])}`;
      case "SE":  return `Transaction Set End: ${f[1]} segments`;

      case "INS": {
        const sub   = f[1]==="Y" ? "Subscriber" : "Dependent";
        const rel   = getRelationshipLabel(f[2], f[1]==="Y");
        const mtype = getMaintenanceTypeLabel(f[3]);
        const mreason = getMaintenanceReasonLabel(f[4]);
        const benefit = f[13]==="U" ? "Unknown" : f[13]==="Y" ? "Yes" : f[13] || "";
        return `Member: ${sub} | Relationship: ${rel} (${f[2]}) | Action: ${mtype} (${f[3]}) | Reason: ${mreason} (${f[4]})${benefit ? ` | Medicare: ${benefit}` : ""}`;
      }

      case "REF": {
        const qual  = REF_QUAL[f[1]] || f[1];
        const value = f[2]==="***" ? "***" : fmt(f[2]);
        return `Reference — ${qual}: ${value}`;
      }

      case "NM1": {
        const entity = { IL:"Member", P5:"Sponsor", IN:"Payer", 31:"Broker", BO:"Broker", TV:"Supervisor" }[f[1]] || f[1];
        const id = f[9]==="***" ? "" : f[9] ? ` | ID: ${f[9]}` : "";
        return `${entity} name${id}`;
      }

      case "N4": {
        const state = f[2] || "—";
        return `Location — State: ${state}`;
      }

      case "DMG": {
        const gender = GENDER[f[3]] || f[3] || "—";
        const marital = f[5] ? ` | Marital: ${getMaritalStatusLabel(f[5])}` : "";
        return `Demographics — DOB: *** | Gender: ${gender}${marital}`;
      }

      case "HD": {
        const mtype  = HD_CODE[f[1]] || f[1];
        const covType = COV_TYPE[f[3]] || f[3] || "—";
        const level   = getCoverageLevelLabel(f[5]);
        return `Coverage — Action: ${mtype} | Type: ${covType} (${f[3]}) | Level: ${level} (${f[5]})`;
      }

      case "DTP": {
        const qual = DTP_QUAL[f[1]] || `Date (${f[1]})`;
        return `${qual}: ${fmt(f[3])}`;
      }

      case "AMT": {
        const qual = AMT_QUAL[f[1]] || `Amount (${f[1]})`;
        return `${qual}: $${f[2]}`;
      }

      case "HLH": return `ICHRA / HRA Indicator: ${f[1]==="N" ? "No" : f[1]==="Y" ? "Yes" : f[1]}`;

      case "LUI": {
        const lang = getLanguageLabel(f[2]);
        const type = f[1]==="LE" ? "Spoken" : f[1]==="LD" ? "Written" : f[1];
        return `Language — ${type}: ${lang} (${f[2]})`;
      }

      case "N1": {
        const lbl = N1_QUAL[f[1]] || f[1];
        const name = f[2] && f[2]!=="***" ? ` — ${f[2]}` : "";
        return `${lbl}${name}`;
      }

      case "PER": return `Contact Info (phone/email — excluded)`;
      case "N3":  return `Street Address (excluded)`;

      case "LS":  return `Additional Information Loop Start`;
      case "LE":  return `Additional Information Loop End`;
      case "LX":  return `Loop Sequence: ${f[1]}`;

      default:    return seg;
    }
  } catch {
    return seg;
  }
}

// ─── Fields excluded from comparison ──────────────────────────────────────────
// The normaliser strips these before diffing so cosmetic differences don't
// appear as meaningful changes:
//
//   • NM1 segments (member names — first, last, middle)
//   • PER segments (email, phone)
//   • N3 segments (street address)
//   • N4 city/zip portions (state is kept — it's functionally relevant)
//   • DMG birth date (DOB is test-data noise when comparing env outputs)
//   • ISA/GS/GE/IEA control numbers & timestamps (interchange envelope metadata)
//   • BGN*xx*[ref]*[date]*[time] — transaction set timestamps
//   • ST control number suffix (transaction set control number)
//   • REF*17 when it holds timestamps (REQUEST SUBMIT TIMESTAMP loop)
//
// What IS compared (everything important for QA):
//   INS (maintenance type/reason, relationship, indicators)
//   REF*0F (subscriber ID), REF*1L (enrollment group), REF*CE (plan ID)
//   REF*9V / REF*9X (financial refs), REF*6O, REF*3H
//   HD (coverage type, level)
//   DTP (all date qualifiers — benefit start, end, eligibility, termination)
//   AMT (premium amounts)
//   LX / N1*75 / LS / LE loops (financial/additional info)
//   HLH, LUI (HRA indicator, language)

const EXCLUDED_SEGMENT_PREFIXES = [
  "ISA", "GS", "GE", "IEA",  // interchange envelope
];

// Segments to drop entirely
const DROP_SEGMENT = (seg) => {
  const tag = seg.split("*")[0].toUpperCase();
  if (EXCLUDED_SEGMENT_PREFIXES.includes(tag)) return true;
  return false;
};

// Segments to partially redact (keep tag + qualifier, blank sensitive fields)
const REDACT_RULES = {
  NM1: (fields) => {
    // NM1*IL*1*LAST*FIRST*MI***34*ID
    // Redact name (fields[3-5]) and member ID (fields[9])
    const f = [...fields];
    if (f[3]) f[3] = "***";
    if (f[4]) f[4] = "***";
    if (f[5]) f[5] = "***";
    if (f[9]) f[9] = "***";
    return f;
  },
  N1: (fields) => {
    // N1*qualifier*name*IDtype*ID
    // Drop sponsor (P5) and broker (BO) name + ID
    const qual = (fields[1] || "").toUpperCase();
    if (qual === "P5" || qual === "BO") {
      const f = [...fields];
      if (f[2]) f[2] = "***";
      if (f[4]) f[4] = "***";
      return f;
    }
    return fields;
  },
  REF: (fields) => {
    // Drop segments that carry member/subscriber/cross-reference IDs
    const qual = (fields[1] || "").toUpperCase();
    const drop = ["0F", "1L", "6O", "17", "ZZ"];
    if (drop.includes(qual)) return null;
    return fields;
  },
  PER: () => null,  // drop entirely — email/phone only
  N3:  () => null,  // drop entirely — street address
  N4: (fields) => {
    // N4*CITY*ST*ZIP**CY*COUNTY
    // Keep state (fields[2]) for relevance, redact city/zip/county
    const f = [...fields];
    if (f[1]) f[1] = "***";
    if (f[3]) f[3] = "***";
    if (f[6]) f[6] = "***";
    return f;
  },
  DMG: (fields) => {
    // DMG*D8*DOB*GENDER**RACE  — redact DOB, keep gender+race
    const f = [...fields];
    if (f[2]) f[2] = "***";
    return f;
  },
  BGN: (fields) => {
    // BGN*00*REF*DATE*TIME — redact date/time
    const f = [...fields];
    if (f[3]) f[3] = "***";
    if (f[4]) f[4] = "***";
    return f;
  },
  ST: (fields) => {
    // ST*834*CONTROL — redact control number
    const f = [...fields];
    if (f[2]) f[2] = "***";
    return f;
  },
  SE: (fields) => {
    // SE*COUNT*CONTROL — redact control
    const f = [...fields];
    if (f[2]) f[2] = "***";
    return f;
  },
};

function normaliseEdi(raw) {
  if (!raw || !raw.trim()) return [];
  const text = raw.trim();
  const separator = text.includes("~\n") ? "~\n" : text.includes("~\r\n") ? "~\r\n" : "~";
  const segments = text
    .split(separator === "~" ? /~[\r\n]*/g : separator)
    .map((s) => s.trim())
    .filter(Boolean);

  const normalised = [];
  for (const seg of segments) {
    const fields = seg.split("*");
    const tag = fields[0].toUpperCase();

    if (DROP_SEGMENT(seg)) continue;

    const rule = REDACT_RULES[tag];
    if (rule) {
      const result = rule(fields);
      if (result === null) continue; // drop
      normalised.push(result.join("*"));
    } else {
      normalised.push(fields.join("*"));
    }
  }
  return normalised;
}

function diffLines(leftLines, rightLines) {
  // Simple LCS-based line diff
  const m = leftLines.length;
  const n = rightLines.length;

  // Build LCS table
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        leftLines[i - 1] === rightLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack
  const result = []; // {left, right, type: 'same'|'changed'|'added'|'removed'}
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
      result.unshift({ left: leftLines[i - 1], right: rightLines[j - 1], type: "same" });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ left: null, right: rightLines[j - 1], type: "added" });
      j--;
    } else {
      result.unshift({ left: leftLines[i - 1], right: null, type: "removed" });
      i--;
    }
  }

  // Pair up consecutive removed+added as "changed"
  const paired = [];
  let k = 0;
  while (k < result.length) {
    const cur = result[k];
    if (cur.type === "removed" && result[k + 1]?.type === "added") {
      paired.push({ left: cur.left, right: result[k + 1].right, type: "changed" });
      k += 2;
    } else {
      paired.push(cur);
      k++;
    }
  }
  return paired;
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const S = {
  overlay:     { position:"fixed", inset:0, background:"rgba(2,8,23,0.82)", zIndex:2000, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"20px", paddingBottom:"20px", overflowY:"auto" },
  modal:       { background:"#0f172a", borderRadius:"18px", width:"99vw", maxWidth:"1700px", boxShadow:"0 30px 80px rgba(0,0,0,0.6)", display:"flex", flexDirection:"column", maxHeight:"calc(100vh - 40px)" },
  header:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 28px 16px", borderBottom:"1px solid #1e3a5f", flexShrink:0, background:"linear-gradient(to right,#0f172a,#0f1f3d)" },
  hLeft:       { display:"flex", flexDirection:"column", gap:"3px" },
  hTitle:      { color:"#f1f5f9", fontSize:"19px", fontWeight:700, margin:0 },
  hSub:        { color:"#64748b", fontSize:"12px", margin:0 },
  closeBtn:    { background:"none", border:"none", color:"#64748b", fontSize:"20px", cursor:"pointer", padding:"6px 10px", borderRadius:"8px" },
  body:        { padding:"18px 22px", display:"flex", flexDirection:"column", gap:"14px", flex:1, overflow:"hidden" },
  pasteGrid:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", flex:1, minHeight:0 },
  panel:       { display:"flex", flexDirection:"column", gap:"8px", minHeight:0 },
  panelTop:    { display:"flex", justifyContent:"space-between", alignItems:"center" },
  panelLabelA: { color:"#93c5fd", fontSize:"12px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.6px" },
  panelLabelB: { color:"#6ee7b7", fontSize:"12px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.6px" },
  clearBtn:    { background:"#1e293b", border:"1px solid #334155", color:"#94a3b8", borderRadius:"6px", padding:"3px 12px", fontSize:"12px", cursor:"pointer" },
  textarea:    { flex:1, background:"#1e293b", border:"1px solid #334155", borderRadius:"10px", color:"#cbd5e1", fontFamily:"'Fira Code','Cascadia Code','Courier New',monospace", fontSize:"12px", lineHeight:"1.8", padding:"14px", resize:"none", outline:"none", minHeight:"180px" },
  actions:     { display:"flex", justifyContent:"center", gap:"12px", flexShrink:0 },
  compareBtn:  { background:"linear-gradient(135deg,#1d4ed8,#2563eb)", color:"white", border:"none", borderRadius:"10px", padding:"10px 34px", fontSize:"15px", fontWeight:700, cursor:"pointer", letterSpacing:"0.3px" },
  editBtn:     { background:"#1e293b", border:"1px solid #3b82f6", color:"#93c5fd", borderRadius:"10px", padding:"10px 24px", fontSize:"14px", cursor:"pointer" },
  clearBothBtn:{ background:"#1e293b", border:"1px solid #475569", color:"#94a3b8", borderRadius:"10px", padding:"10px 20px", fontSize:"14px", cursor:"pointer" },

  summaryBar:  { display:"flex", gap:"14px", flexWrap:"wrap", alignItems:"center", padding:"10px 16px", background:"#1e293b", borderRadius:"10px", flexShrink:0, borderLeft:"3px solid #3b82f6" },
  sItem:       { fontSize:"13px", color:"#cbd5e1" },
  badge:       (bg, text) => ({ display:"inline-flex", alignItems:"center", gap:"4px", background:bg, borderRadius:"20px", padding:"2px 10px", fontWeight:700, fontSize:"12px" }),

  resultsWrap: { flex:1, overflow:"auto", minHeight:0, borderRadius:"12px", border:"1px solid #1e3a5f" },
  noChange:    { textAlign:"center", padding:"48px", color:"#4ade80", fontSize:"16px", fontWeight:600 },

  // Diff rows — each row is a card with raw + translation
  diffTable:   { width:"100%", borderCollapse:"collapse", fontSize:"12px" },
  colHdrA:     { padding:"10px 16px", background:"#1e293b", color:"#93c5fd", fontWeight:700, fontSize:"12px", width:"50%", borderBottom:"2px solid #1e3a5f", position:"sticky", top:0, zIndex:1 },
  colHdrB:     { padding:"10px 16px", background:"#1e293b", color:"#6ee7b7", fontWeight:700, fontSize:"12px", width:"50%", borderBottom:"2px solid #1e3a5f", position:"sticky", top:0, zIndex:1 },

  excluded:    { padding:"10px 16px", background:"#0f1f3d", borderRadius:"8px", fontSize:"11.5px", color:"#475569", lineHeight:"1.9", flexShrink:0 },
};

const TYPE_COLORS = {
  same:    { bg:"#0f172a",              border:"transparent",        rawClr:"#475569", transClr:"#64748b"  },
  changed: { bg:"rgba(161,98,7,0.10)",  border:"rgba(234,179,8,0.4)",rawClr:"#fde68a", transClr:"#fcd34d" },
  added:   { bg:"rgba(22,101,52,0.12)", border:"rgba(74,222,128,0.3)",rawClr:"#86efac", transClr:"#4ade80" },
  removed: { bg:"rgba(127,29,29,0.12)", border:"rgba(248,113,113,0.3)",rawClr:"#fca5a5",transClr:"#f87171"},
};

function hlSpan(text, side) {
  const bg = side==="left" ? "rgba(239,68,68,0.4)" : "rgba(74,222,128,0.4)";
  return <span style={{ background:bg, borderRadius:"2px", padding:"0 1px" }}>{text}</span>;
}

function charDiff(a, b) {
  let s=0;
  while (s<a.length && s<b.length && a[s]===b[s]) s++;
  let ea=a.length-1, eb=b.length-1;
  while (ea>s && eb>s && a[ea]===b[eb]) { ea--; eb--; }
  return {
    left:  [{ t:a.slice(0,s),hl:0},{ t:a.slice(s,ea+1),hl:1},{ t:a.slice(ea+1),hl:0}],
    right: [{ t:b.slice(0,s),hl:0},{ t:b.slice(s,eb+1),hl:1},{ t:b.slice(eb+1),hl:0}],
  };
}

function DiffCell({ raw, type, side, charParts }) {
  const tc = TYPE_COLORS[type];
  const labelMap = { same:"", changed:"~ Changed", added:"+ Only in File B", removed:"– Only in File A" };
  const labelClr = { same:"", changed:"#fbbf24", added:"#4ade80", removed:"#f87171" };

  function renderRaw() {
    if (charParts) {
      return charParts.map((c,i) =>
        c.hl ? hlSpan(c.t, side) : <span key={i}>{c.t}</span>
      );
    }
    return raw || null;
  }

  const translation = raw ? translateSegment(raw) : null;
  const showTranslation = translation && translation !== raw;

  return (
    <td style={{
      verticalAlign:"top",
      padding:"8px 12px",
      background: tc.bg,
      borderBottom:"1px solid #1a2a40",
      borderLeft: side==="left" && type!=="same" ? `3px solid ${tc.border}` : undefined,
      borderRight: side==="right" && type!=="same" ? `3px solid ${tc.border}` : undefined,
      width:"50%",
    }}>
      {raw ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
          {/* Status label (only for diff rows) */}
          {type !== "same" && side === "left" && (
            <span style={{ fontSize:"10px", fontWeight:700, color: labelClr[type], textTransform:"uppercase", letterSpacing:"0.5px" }}>
              {type==="removed" ? "– Only in File A" : type==="changed" ? "~ Changed" : ""}
            </span>
          )}
          {type !== "same" && side === "right" && (
            <span style={{ fontSize:"10px", fontWeight:700, color: labelClr[type], textTransform:"uppercase", letterSpacing:"0.5px" }}>
              {type==="added" ? "+ Only in File B" : type==="changed" ? "~ Changed" : ""}
            </span>
          )}
          {/* Raw EDI */}
          <div style={{
            fontFamily:"'Fira Code','Cascadia Code','Courier New',monospace",
            fontSize:"11.5px", lineHeight:"1.6",
            color: tc.rawClr,
            wordBreak:"break-all", whiteSpace:"pre-wrap",
          }}>
            {renderRaw()}
          </div>
          {/* Translation */}
          {showTranslation && (
            <div style={{
              fontSize:"11px", lineHeight:"1.5",
              color: tc.transClr,
              paddingTop:"3px",
              borderTop:"1px dashed rgba(255,255,255,0.07)",
              fontStyle:"italic",
            }}>
              ↳ {translation}
            </div>
          )}
        </div>
      ) : (
        <div style={{ height:"18px" }} />
      )}
    </td>
  );
}

export default function CompareEdiModal({ onClose }) {
  const [leftText,  setLeftText]  = useState("");
  const [rightText, setRightText] = useState("");
  const [diff,  setDiff]  = useState(null);
  const [stats, setStats] = useState(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const [leftSummary,  setLeftSummary]  = useState(null);
  const [rightSummary, setRightSummary] = useState(null);

  const handleCompare = useCallback(() => {
    const ln = normaliseEdi(leftText);
    const rn = normaliseEdi(rightText);
    const result = diffLines(ln, rn);
    setDiff(result);
    setShowAllRows(false);
    setLeftSummary(generateEdiSummary(parse834(leftText)));
    setRightSummary(generateEdiSummary(parse834(rightText)));
    setStats({
      total:   result.length,
      same:    result.filter(r=>r.type==="same").length,
      changed: result.filter(r=>r.type==="changed").length,
      added:   result.filter(r=>r.type==="added").length,
      removed: result.filter(r=>r.type==="removed").length,
    });
  }, [leftText, rightText]);

  const handleClearBoth = () => { setLeftText(""); setRightText(""); setDiff(null); setStats(null); setLeftSummary(null); setRightSummary(null); };

  const hasDiffs = stats && (stats.changed + stats.added + stats.removed) > 0;
  // By default only show diff rows + a few lines of same context; show all on demand
  const visibleDiff = diff
    ? (showAllRows ? diff : diff.filter(r => r.type !== "same"))
    : [];

  return (
    <div style={S.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={S.modal}>
        {/* ── Header ── */}
        <div style={S.header}>
          <div style={S.hLeft}>
            <p style={S.hTitle}>⇄ Compare EDI Files</p>
            <p style={S.hSub}>Paste two 834 files below — each segment is decoded and differences are highlighted. Names, addresses, phone, email, DOB, and timestamps are excluded.</p>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>
          {/* ── Paste panels (shown while composing) ── */}
          {!diff && (
            <div style={S.pasteGrid}>
              <div style={S.panel}>
                <div style={S.panelTop}>
                  <span style={S.panelLabelA}>◀ File A &nbsp;— e.g. QA environment</span>
                  <button style={S.clearBtn} onClick={()=>setLeftText("")}>Clear</button>
                </div>
                <textarea style={S.textarea} value={leftText}
                  onChange={e=>setLeftText(e.target.value)}
                  placeholder={"Paste 834 EDI content here...\n\nST*834*26504*005010X220A1~\nBGN*00*26504*20260422*1453*ET***2~\n..."}
                  spellCheck={false}/>
              </div>
              <div style={S.panel}>
                <div style={S.panelTop}>
                  <span style={S.panelLabelB}>File B ▶ &nbsp;— e.g. UAT environment</span>
                  <button style={S.clearBtn} onClick={()=>setRightText("")}>Clear</button>
                </div>
                <textarea style={S.textarea} value={rightText}
                  onChange={e=>setRightText(e.target.value)}
                  placeholder={"Paste 834 EDI content here...\n\nST*834*26504*005010X220A1~\nBGN*00*26504*20260422*1453*ET***2~\n..."}
                  spellCheck={false}/>
              </div>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={S.actions}>
            {diff ? (
              <>
                <button style={S.editBtn} onClick={()=>{setDiff(null);setStats(null);}}>← Edit Files</button>
                <button style={S.clearBothBtn} onClick={handleClearBoth}>Clear Both & Reset</button>
              </>
            ) : (
              <>
                <button style={{...S.compareBtn, opacity:(!leftText.trim()||!rightText.trim())?0.5:1}}
                  onClick={handleCompare} disabled={!leftText.trim()||!rightText.trim()}>
                  ⇄ Compare
                </button>
                <button style={S.clearBothBtn} onClick={handleClearBoth}>Clear Both</button>
              </>
            )}
          </div>

          {/* ── Results ── */}
          {diff && stats && (
            <>
              {/* Per-file summaries */}
              {(leftSummary || rightSummary) && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", flexShrink:0 }}>
                  <div style={{ background:"#0f1f3d", borderRadius:"10px", padding:"12px 16px", borderLeft:"3px solid #3b82f6" }}>
                    <div style={{ fontSize:"10px", fontWeight:700, color:"#93c5fd", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:"6px" }}>◀ File A — Summary</div>
                    <div style={{ fontSize:"13px", color:"#cbd5e1", lineHeight:"1.55" }}>{leftSummary  || <span style={{color:"#475569",fontStyle:"italic"}}>Could not generate summary.</span>}</div>
                  </div>
                  <div style={{ background:"#0f1f3d", borderRadius:"10px", padding:"12px 16px", borderLeft:"3px solid #34d399" }}>
                    <div style={{ fontSize:"10px", fontWeight:700, color:"#6ee7b7", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:"6px" }}>File B ▶ — Summary</div>
                    <div style={{ fontSize:"13px", color:"#cbd5e1", lineHeight:"1.55" }}>{rightSummary || <span style={{color:"#475569",fontStyle:"italic"}}>Could not generate summary.</span>}</div>
                  </div>
                </div>
              )}
              {/* Diff count bar */}
              <div style={S.summaryBar}>
                <span style={S.sItem}><strong style={{color:"#f1f5f9"}}>{stats.total}</strong> segments compared</span>
                {!hasDiffs ? (
                  <span style={{color:"#4ade80",fontWeight:700}}>✓ Files are structurally identical</span>
                ) : (
                  <>
                    <span style={S.sItem}><span style={S.badge("rgba(161,98,7,0.5)","")}>~ {stats.changed} changed</span></span>
                    <span style={S.sItem}><span style={S.badge("rgba(22,101,52,0.5)","")}>+ {stats.added} only in B</span></span>
                    <span style={S.sItem}><span style={S.badge("rgba(127,29,29,0.5)","")}>– {stats.removed} only in A</span></span>
                    <span style={S.sItem}><span style={S.badge("rgba(30,58,95,0.8)","")}>= {stats.same} matching</span></span>
                    <button onClick={()=>setShowAllRows(v=>!v)}
                      style={{marginLeft:"auto",background:"none",border:"1px solid #334155",color:"#94a3b8",
                             borderRadius:"6px",padding:"3px 12px",fontSize:"12px",cursor:"pointer"}}>
                      {showAllRows ? "Show differences only" : "Show all segments"}
                    </button>
                  </>
                )}
              </div>

              {!hasDiffs ? (
                <div style={S.noChange}>✓ No structural differences found after excluding names, addresses, and timestamps.</div>
              ) : (
                <div style={S.resultsWrap}>
                  <table style={S.diffTable}>
                    <thead>
                      <tr>
                        <th style={S.colHdrA}>◀ File A &nbsp;<span style={{fontWeight:400,color:"#64748b"}}>— raw segment / translation</span></th>
                        <th style={S.colHdrB}>File B ▶ &nbsp;<span style={{fontWeight:400,color:"#64748b"}}>— raw segment / translation</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleDiff.map((row, idx) => {
                        if (row.type === "same") {
                          return (
                            <tr key={idx}>
                              <DiffCell raw={row.left}  type="same" side="left"  />
                              <DiffCell raw={row.right} type="same" side="right" />
                            </tr>
                          );
                        }
                        if (row.type === "changed") {
                          const cd = charDiff(row.left, row.right);
                          return (
                            <tr key={idx}>
                              <DiffCell raw={row.left}  type="changed" side="left"  charParts={cd.left}  />
                              <DiffCell raw={row.right} type="changed" side="right" charParts={cd.right} />
                            </tr>
                          );
                        }
                        if (row.type === "added") {
                          return (
                            <tr key={idx}>
                              <DiffCell raw={null}      type="same"  side="left"  />
                              <DiffCell raw={row.right} type="added" side="right" />
                            </tr>
                          );
                        }
                        // removed
                        return (
                          <tr key={idx}>
                            <DiffCell raw={row.left} type="removed" side="left"  />
                            <DiffCell raw={null}     type="same"    side="right" />
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── Exclusions footer ── */}
          {!diff && (
            <div style={S.excluded}>
              <strong style={{color:"#334155"}}>Excluded from comparison: </strong>
              Member &amp; subscriber names · Member ID · Subscriber ID · Cross-reference ID · Sponsor name &amp; ID · Broker name &amp; ID · Street address · City/Zip · Email · Phone · Date of birth · ISA/GS/GE/IEA interchange envelope · BGN timestamps · ST/SE control numbers
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
