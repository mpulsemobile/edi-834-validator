/**
 * generate834.js
 * Builds a valid X12 834 Benefits Enrollment EDI string from structured input.
 */

function pad(str, len, char = " ") {
  return String(str).padEnd(len, char).slice(0, len);
}

function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function nowTime() {
  const d = new Date();
  return d.toTimeString().slice(0, 5).replace(":", "");
}

function randomControlNum() {
  return String(Math.floor(Math.random() * 999999999)).padStart(9, "0");
}

function fmtDate(dateStr) {
  // accepts YYYY-MM-DD or YYYYMMDD, outputs YYYYMMDD
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "");
}

/**
 * Main generator.
 *
 * @param {Object} input
 * @param {string} input.transactionType  - "021" (new enrollment), "024" (termination), "001" (change/add dependent)
 * @param {string} input.maintenanceReason - "AI" (initial), "4N" (termination), etc.
 * @param {Object} input.sponsor          - { name, ein }
 * @param {Object} input.payer            - { name, ein }
 * @param {Object} input.broker           - { name, id } (optional)
 * @param {Object} input.subscriber       - see shape below
 * @param {Array}  input.dependents       - array of dependent objects (optional)
 *
 * subscriber / dependent shape:
 * {
 *   firstName, lastName,
 *   dob,          // YYYY-MM-DD
 *   gender,       // M / F / U
 *   ssn,          // 9 digits, no dashes
 *   memberId,     // optional — falls back to ssn
 *   address1, address2, city, state, zip,
 *   phone, email,
 *   coverages: [{ type: "HLT|DEN|VIS", planId, effectiveDate, termDate, premium }]
 * }
 */
export function generate834(input) {
  const {
    transactionType = "021",
    maintenanceReason = "AI",
    sponsor = { name: "SPONSOR", ein: "000000000" },
    payer = { name: "PAYER", ein: "000000000" },
    broker,
    subscriber,
    dependents = [],
  } = input;

  const ctlNum = randomControlNum();
  const stNum = "00001";
  const dateStr = today();
  const timeStr = nowTime();
  const refNum = String(Date.now()).slice(-8);

  const lines = [];
  let segCount = 0;

  const seg = (...parts) => {
    lines.push(parts.join("*") + "~");
    segCount++;
  };

  // ISA / GS envelope
  lines.push(
    `ISA*00*          *00*          *ZZ*${pad(sponsor.ein, 15)}*ZZ*${pad(payer.ein, 15)}*${dateStr.slice(2)}*${timeStr}*^*00501*${ctlNum}*0*T*:~`
  );
  lines.push(`GS*BE*${sponsor.ein}*${payer.ein}*${dateStr}*${timeStr}*1*X*005010X220A1~`);

  // ST / BGN
  seg(`ST`, `834`, stNum, `005010X220A1`);
  seg(`BGN`, `00`, refNum, dateStr, timeStr, `ET`, ``, ``, `2`);

  // N1 loops
  seg(`N1`, `P5`, sponsor.name, `FI`, sponsor.ein);
  seg(`N1`, `IN`, payer.name, `FI`, payer.ein);
  if (broker) {
    seg(`N1`, `BO`, broker.name, `94`, broker.id);
  }

  // Helper: emit one member (subscriber or dependent)
  const emitMember = (member, isSubscriber) => {
    const relCode = isSubscriber ? "18" : (member.relationshipCode || "19");
    const id = member.memberId || member.ssn || "000000000";

    seg(`INS`, isSubscriber ? `Y` : `N`, relCode, transactionType, maintenanceReason, `A`, ``, ``, `FT`, ``, `N`, ``, ``, `U`);
    seg(`REF`, `0F`, id);
    if (member.groupId) seg(`REF`, `1L`, member.groupId);
    if (member.exchangeId) seg(`REF`, `17`, member.exchangeId);

    // Effective / benefit dates from first coverage, or subscriber-level
    if (member.effectiveDate) seg(`DTP`, `336`, `D8`, fmtDate(member.effectiveDate));
    if (member.planYearStart) seg(`DTP`, `356`, `D8`, fmtDate(member.planYearStart));
    if (member.planYearEnd) seg(`DTP`, `357`, `D8`, fmtDate(member.planYearEnd));

    // NM1 — member name
    seg(`NM1`, `IL`, `1`, member.lastName || ``, member.firstName || ``, ``, ``, ``, `34`, id);

    // PER — contact
    if (member.phone || member.email) {
      const parts = [`PER`, `IP`, ``];
      if (member.phone) { parts.push(`HP`); parts.push(member.phone.replace(/\D/g, "")); }
      if (member.email) { parts.push(`EM`); parts.push(member.email); }
      seg(...parts);
    }

    // N3 / N4 — address
    if (member.address1) {
      seg(`N3`, member.address1 + (member.address2 ? ` ${member.address2}` : ``));
      seg(`N4`, member.city || ``, member.state || ``, member.zip || ``);
    }

    // DMG — demographics
    if (member.dob || member.gender) {
      seg(`DMG`, `D8`, fmtDate(member.dob) || ``, member.gender || ``);
    }

    // HD + DTP per coverage
    for (const cov of (member.coverages || [])) {
      const covLevel = cov.coverageLevel || (isSubscriber ? "IND" : "DEP");
      seg(`HD`, transactionType, ``, cov.type || `HLT`, cov.planId || ``, covLevel);
      if (cov.effectiveDate) seg(`DTP`, `303`, `D8`, fmtDate(cov.effectiveDate));
      if (cov.effectiveDate) seg(`DTP`, `348`, `D8`, fmtDate(cov.effectiveDate));
      if (cov.termDate) seg(`DTP`, `349`, `D8`, fmtDate(cov.termDate));
      if (cov.premium) seg(`AMT`, `P3`, String(cov.premium));
      if (cov.planId) seg(`REF`, `CE`, cov.planId);
    }
  };

  emitMember(subscriber, true);
  for (const dep of dependents) {
    emitMember(dep, false);
  }

  // SE
  seg(`SE`, String(segCount + 1), stNum); // +1 for SE itself

  lines.push(`GE*1*1~`);
  lines.push(`IEA*1*${ctlNum}~`);

  return lines.join("\n");
}

// Transaction type options for the form
export const TRANSACTION_TYPES = [
  { value: "021", label: "021 — New Enrollment" },
  { value: "024", label: "024 — Termination" },
  { value: "001", label: "001 — Change / Add Dependent" },
];

export const COVERAGE_TYPES = [
  { value: "HLT", label: "HLT — Medical" },
  { value: "DEN", label: "DEN — Dental" },
  { value: "VIS", label: "VIS — Vision" },
];

export const MAINTENANCE_REASONS = {
  "021": [
    { value: "AI", label: "AI — Initial Enrollment" },
    { value: "XN", label: "XN — Special Enrollment Period" },
  ],
  "024": [
    { value: "4N", label: "4N — Termination of Benefits" },
    { value: "AB", label: "AB — Disenrollment" },
  ],
  "001": [
    { value: "AI", label: "AI — Change" },
    { value: "EC", label: "EC — Add Dependent" },
  ],
};
