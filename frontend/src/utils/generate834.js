/**
 * generate834.js
 * Generates a valid X12 834 EDI for SEP Off-Exchange Subscriber Only.
 * Structure mirrors: 01-sep-off-exchange-subscriber-only-medical.edi
 */

function pad(str, len) {
  return String(str || "").padEnd(len, " ").slice(0, len);
}

function fmtDate(dateStr) {
  return (dateStr || "").replace(/-/g, "");
}

function nowTimestamp() {
  const d = new Date();
  const YYYY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

function nowDate() { return nowTimestamp().slice(0, 8); }
function nowTime() { return nowTimestamp().slice(8, 12); }

export function generateSepOffExchange(f) {
  const ts = nowTimestamp();
  const dateStr = nowDate();
  const timeStr = nowTime();
  const ctlNum = f.interchangeControlNum || String(Date.now()).slice(-9).padStart(9, "0");
  const stCtl = f.stControlNum || "26504";

  const segs = [];
  let segCount = 0;

  const seg = (parts) => {
    segs.push(parts.join("*") + "~");
    segCount++;
  };

  // Envelope
  segs.push(
    `ISA*00*          *00*          *ZZ*${pad(f.sponsorEin, 15)}*ZZ*${pad(f.payerEin, 15)}*${dateStr.slice(2)}*${timeStr}*^*00501*${ctlNum}*0*T*:~`
  );
  segs.push(`GS*BE*${f.sponsorEin}*${f.payerEin}*${dateStr}*${timeStr}*1*X*005010X220A1~`);

  // ST / BGN
  seg(["ST", "834", stCtl, "005010X220A1"]);
  seg(["BGN", "00", stCtl, dateStr, timeStr, "ET", "", "", "2"]);

  // N1 Loops
  seg(["N1", "P5", f.sponsorName, "FI", f.sponsorEin]);
  seg(["N1", "IN", f.payerName, "FI", f.payerEin]);
  if (f.brokerName) seg(["N1", "BO", f.brokerName, "94", f.brokerId || ""]);

  // INS
  seg(["INS", "Y", "18", "021", "AI", "A", "", "", "FT", "", "N", "", "", "U"]);

  // REF
  seg(["REF", "0F", f.subscriberId]);
  if (f.groupNumber) seg(["REF", "1L", f.groupNumber]);
  seg(["REF", "17", f.exchangeMemberId || f.subscriberId]);
  if (f.refCode6O) seg(["REF", "6O", f.refCode6O]);

  // DTP enrollment / plan year
  seg(["DTP", "336", "D8", fmtDate(f.enrollmentDate)]);
  seg(["DTP", "356", "D8", fmtDate(f.planYearStart)]);
  seg(["DTP", "357", "D8", fmtDate(f.planYearEnd)]);

  // NM1 member name
  seg(["NM1", "IL", "1", f.lastName, f.firstName, "", "", "", "34", f.subscriberId]);

  // PER contact
  const perParts = ["PER", "IP", ""];
  if (f.phone) { perParts.push("HP"); perParts.push(f.phone.replace(/\D/g, "")); }
  if (f.email) { perParts.push("EM"); perParts.push(f.email); }
  if (perParts.length > 3) seg(perParts);

  // N3 / N4 address
  if (f.address) {
    seg(["N3", f.address]);
    const n4 = ["N4", f.city || "", f.state || "", f.zip || ""];
    if (f.countyCode) { n4.push("", "CY", f.countyCode); }
    seg(n4);
  }

  // DMG demographics
  const dmgParts = ["DMG", "D8", fmtDate(f.dob), f.gender || ""];
  if (f.raceEthnicity) dmgParts.push("", f.raceEthnicity);
  seg(dmgParts);

  // HLH / LUI
  if (f.tobaccoUse) seg(["HLH", f.tobaccoUse]);
  if (f.spokenLanguage) seg(["LUI", "LE", f.spokenLanguage, "", "7"]);

  // HD coverage
  seg(["HD", "021", "", f.coverageType || "HLT", "", "IND"]);
  seg(["DTP", "303", "D8", fmtDate(f.coverageEffectiveDate)]);
  seg(["DTP", "348", "D8", fmtDate(f.coverageEffectiveDate)]);
  if (f.premium) seg(["AMT", "P3", String(f.premium)]);
  if (f.planId) seg(["REF", "CE", f.planId]);
  if (f.billingArrangement) seg(["REF", "9V", f.billingArrangement]);

  // 2700 Loop
  seg(["LS", "2700"]);

  seg(["LX", "1"]);
  seg(["N1", "75", "REQUEST SUBMIT TIMESTAMP"]);
  seg(["REF", "17", ts]);

  seg(["LX", "2"]);
  seg(["N1", "75", "SOURCE EXCHANGE ID"]);
  seg(["REF", "17", f.sourceExchangeId || ""]);

  seg(["LX", "3"]);
  seg(["N1", "75", "ISFFM"]);
  seg(["REF", "17", f.isFFM || "false"]);

  seg(["LX", "4"]);
  seg(["N1", "75", "PRE AMT TOT"]);
  seg(["REF", "9X", String(f.preAmtTot || f.premium || "")]);
  seg(["DTP", "007", "D8", fmtDate(f.coverageEffectiveDate)]);

  seg(["LX", "5"]);
  seg(["N1", "75", "PRE AMT 1"]);
  seg(["REF", "9X", String(f.preAmt1 || f.premium || "")]);
  seg(["DTP", "007", "D8", fmtDate(f.coverageEffectiveDate)]);

  seg(["LX", "6"]);
  seg(["N1", "75", "TOT RES AMT"]);
  seg(["REF", "9V", String(f.totResAmt || f.premium || "")]);
  seg(["DTP", "007", "D8", fmtDate(f.coverageEffectiveDate)]);

  seg(["LX", "7"]);
  seg(["N1", "75", "RATING AREA"]);
  seg(["REF", "9X", f.ratingArea || ""]);
  seg(["DTP", "007", "D8", fmtDate(f.coverageEffectiveDate)]);

  seg(["LX", "8"]);
  seg(["N1", "75", "SEP REASON"]);
  seg(["REF", "17", f.sepReason || "AI"]);
  seg(["DTP", "007", "D8", fmtDate(f.coverageEffectiveDate)]);

  seg(["LX", "9"]);
  seg(["N1", "75", "ICHRA/QSEHRA"]);
  seg(["REF", "17", f.ichraQsehra || "N"]);

  seg(["LX", "10"]);
  seg(["N1", "75", "QSEHRA Spouse"]);
  seg(["REF", "17", f.qsehraSpouse || "N"]);

  seg(["LX", "11"]);
  seg(["N1", "75", "QSEHRA Both"]);
  seg(["REF", "17", f.qsehraBoth || "N"]);

  seg(["LE", "2700"]);

  // SE
  seg(["SE", String(segCount + 1), stCtl]);

  segs.push("GE*1*1~");
  segs.push(`IEA*1*${ctlNum}~`);

  return segs.join("\n");
}

/**
 * generateAddSpouse — mirrors 10-add-spouse-subscriber-and-spouse-medical.edi
 * Two INS loops: subscriber (Y/18) + spouse (N/01), each with their own 2700 loop.
 *
 * f.subscriber — same shape as generateSepOffExchange
 * f.spouse — { firstName, lastName, dob, gender, memberId, exchangeMemberId,
 *               address1, city, state, zip, countyCode,
 *               coverageType, coverageEffectiveDate, coverageAppDate, premium, planId }
 */
export function generateAddSpouse(f) {
  const ts = nowTimestamp();
  const dateStr = nowDate();
  const timeStr = nowTime();
  const ctlNum = f.interchangeControlNum || String(Date.now()).slice(-9).padStart(9, "0");
  const stCtl = f.stControlNum || "26516";

  const segs = [];
  let segCount = 0;
  const seg = (parts) => { segs.push(parts.join("*") + "~"); segCount++; };

  // Envelope
  segs.push(
    `ISA*00*          *00*          *ZZ*${pad(f.sponsorEin, 15)}*ZZ*${pad(f.payerEin, 15)}*${dateStr.slice(2)}*${timeStr}*^*00501*${ctlNum}*0*T*:~`
  );
  segs.push(`GS*BE*${f.sponsorEin}*${f.payerEin}*${dateStr}*${timeStr}*1*X*005010X220A1~`);

  seg(["ST", "834", stCtl, "005010X220A1"]);
  seg(["BGN", "00", stCtl, dateStr, timeStr, "ET", "", "", "2"]);

  // N1 loops
  seg(["N1", "P5", f.sponsorName, "FI", f.sponsorEin]);
  seg(["N1", "IN", f.payerName, "FI", f.payerEin]);
  if (f.brokerName) seg(["N1", "BO", f.brokerName, "94", f.brokerId || ""]);

  // ── SUBSCRIBER ────────────────────────────────────────────────────────────
  const sub = f.subscriber;
  seg(["INS", "Y", "18", "021", "32", "A", "", "", "FT", "", "N", "", "", "U"]);
  seg(["REF", "0F", sub.subscriberId]);
  if (sub.groupNumber) seg(["REF", "1L", sub.groupNumber]);
  seg(["REF", "17", sub.exchangeMemberId || sub.subscriberId]);
  if (sub.refCode6O) seg(["REF", "6O", sub.refCode6O]);
  seg(["DTP", "336", "D8", fmtDate(sub.enrollmentDate)]);
  seg(["DTP", "356", "D8", fmtDate(sub.planYearStart)]);
  seg(["DTP", "357", "D8", fmtDate(sub.planYearEnd)]);
  seg(["NM1", "IL", "1", sub.lastName, sub.firstName, "", "", "", "34", sub.subscriberId]);
  const perParts = ["PER", "IP", ""];
  if (sub.phone) { perParts.push("HP"); perParts.push(sub.phone.replace(/\D/g, "")); }
  if (sub.email) { perParts.push("EM"); perParts.push(sub.email); }
  if (perParts.length > 3) seg(perParts);
  if (sub.address) {
    seg(["N3", sub.address]);
    const n4 = ["N4", sub.city || "", sub.state || "", sub.zip || ""];
    if (sub.countyCode) n4.push("", "CY", sub.countyCode);
    seg(n4);
  }
  const dmg = ["DMG", "D8", fmtDate(sub.dob), sub.gender || ""];
  if (sub.raceEthnicity) dmg.push("", sub.raceEthnicity);
  seg(dmg);
  if (sub.tobaccoUse) seg(["HLH", sub.tobaccoUse]);
  if (sub.spokenLanguage) seg(["LUI", "LE", sub.spokenLanguage, "", "7"]);

  // Subscriber coverage (TWO = subscriber + spouse)
  seg(["HD", "021", "", sub.coverageType || "HLT", "", "TWO"]);
  seg(["DTP", "303", "D8", fmtDate(sub.coverageAppDate || sub.coverageEffectiveDate)]);
  seg(["DTP", "348", "D8", fmtDate(sub.coverageEffectiveDate)]);
  if (sub.premium) seg(["AMT", "P3", String(sub.premium)]);
  if (sub.planId) seg(["REF", "CE", sub.planId]);
  if (sub.billingArrangement) seg(["REF", "9V", sub.billingArrangement]);

  // Subscriber 2700 loop (10 LX — no SEP REASON, ICHRA replaces it at LX*8)
  seg(["LS", "2700"]);
  seg(["LX", "1"]); seg(["N1", "75", "REQUEST SUBMIT TIMESTAMP"]); seg(["REF", "17", ts]);
  seg(["LX", "2"]); seg(["N1", "75", "SOURCE EXCHANGE ID"]); seg(["REF", "17", f.sourceExchangeId || ""]);
  seg(["LX", "3"]); seg(["N1", "75", "ISFFM"]); seg(["REF", "17", f.isFFM || "false"]);
  seg(["LX", "4"]); seg(["N1", "75", "PRE AMT TOT"]); seg(["REF", "9X", String(f.preAmtTot || "")]); seg(["DTP", "007", "D8", fmtDate(sub.coverageAppDate || sub.coverageEffectiveDate)]);
  seg(["LX", "5"]); seg(["N1", "75", "PRE AMT 1"]); seg(["REF", "9X", String(sub.premium || "")]); seg(["DTP", "007", "D8", fmtDate(sub.coverageAppDate || sub.coverageEffectiveDate)]);
  seg(["LX", "6"]); seg(["N1", "75", "TOT RES AMT"]); seg(["REF", "9V", String(f.totResAmt || "")]); seg(["DTP", "007", "D8", fmtDate(sub.coverageAppDate || sub.coverageEffectiveDate)]);
  seg(["LX", "7"]); seg(["N1", "75", "RATING AREA"]); seg(["REF", "9X", f.ratingArea || ""]); seg(["DTP", "007", "D8", fmtDate(sub.coverageAppDate || sub.coverageEffectiveDate)]);
  seg(["LX", "8"]); seg(["N1", "75", "ICHRA/QSEHRA"]); seg(["REF", "17", f.ichraQsehra || "N"]);
  seg(["LX", "9"]); seg(["N1", "75", "QSEHRA Spouse"]); seg(["REF", "17", f.qsehraSpouse || "N"]);
  seg(["LX", "10"]); seg(["N1", "75", "QSEHRA Both"]); seg(["REF", "17", f.qsehraBoth || "N"]);
  seg(["LE", "2700"]);

  // ── SPOUSE ────────────────────────────────────────────────────────────────
  const sp = f.spouse;
  seg(["INS", "N", "01", "021", "32", "A", "", "", "", "", "N", "", "", "U"]);
  seg(["REF", "0F", sub.subscriberId]);
  if (sub.groupNumber) seg(["REF", "1L", sub.groupNumber]);
  seg(["REF", "17", sp.exchangeMemberId || sp.memberId || ""]);
  if (sub.refCode6O) seg(["REF", "6O", sub.refCode6O]);
  seg(["DTP", "336", "D8", fmtDate(sub.enrollmentDate)]);
  seg(["DTP", "356", "D8", fmtDate(sub.planYearStart)]);
  seg(["DTP", "357", "D8", fmtDate(sub.planYearEnd)]);
  seg(["NM1", "IL", "1", sp.lastName, sp.firstName, "", "", "", "34", sp.memberId || ""]);
  if (sp.address) {
    seg(["N3", sp.address]);
    const n4sp = ["N4", sp.city || "", sp.state || "", sp.zip || ""];
    if (sp.countyCode) n4sp.push("", "CY", sp.countyCode);
    seg(n4sp);
  }
  seg(["DMG", "D8", fmtDate(sp.dob), sp.gender || ""]);
  if (sp.tobaccoUse) seg(["HLH", sp.tobaccoUse]);

  // Spouse coverage
  seg(["HD", "021", "", sp.coverageType || "HLT", "", "TWO"]);
  seg(["DTP", "303", "D8", fmtDate(sp.coverageAppDate || sp.coverageEffectiveDate)]);
  seg(["DTP", "348", "D8", fmtDate(sp.coverageEffectiveDate)]);
  if (sp.premium) seg(["AMT", "P3", String(sp.premium)]);
  if (sp.planId) seg(["REF", "CE", sp.planId]);

  // Spouse 2700 loop (4 LX only)
  seg(["LS", "2700"]);
  seg(["LX", "1"]); seg(["N1", "75", "REQUEST SUBMIT TIMESTAMP"]); seg(["REF", "17", ts]);
  seg(["LX", "2"]); seg(["N1", "75", "SOURCE EXCHANGE ID"]); seg(["REF", "17", f.sourceExchangeId || ""]);
  seg(["LX", "3"]); seg(["N1", "75", "ISFFM"]); seg(["REF", "17", f.isFFM || "false"]);
  seg(["LX", "4"]); seg(["N1", "75", "PRE AMT 1"]); seg(["REF", "9X", String(sp.premium || "")]); seg(["DTP", "007", "D8", fmtDate(sp.coverageAppDate || sp.coverageEffectiveDate)]);
  seg(["LE", "2700"]);

  seg(["SE", String(segCount + 1), stCtl]);
  segs.push("GE*1*1~");
  segs.push(`IEA*1*${ctlNum}~`);
  return segs.join("\n");
}

export const SEP_REASONS = [
  { value: "AI", label: "AI — Initial / New SEP" },
  { value: "AE", label: "AE — Loss of Coverage" },
  { value: "AB", label: "AB — Marriage" },
  { value: "17", label: "17 — Birth / Adoption" },
  { value: "EC", label: "EC — Relocation" },
  { value: "QE", label: "QE — Other" },
];

export const COVERAGE_TYPES = [
  { value: "HLT", label: "HLT — Medical" },
  { value: "DEN", label: "DEN — Dental" },
  { value: "VIS", label: "VIS — Vision" },
];
