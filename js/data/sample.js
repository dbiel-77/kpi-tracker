// js/sample.js
const TODAY = new Date('2025-08-15'); // keep deterministic "today" for trends
const N_ROWS = 500;

function rand() {
  if (globalThis.crypto && crypto.getRandomValues) {
    const u32 = new Uint32Array(1);
    crypto.getRandomValues(u32);
    return u32[0] / 2**32;
  }
  return Math.random();
}
const rint = (n) => Math.floor(rand() * n);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

function pickWeighted(items, weights) {
  const total = weights.reduce((a,b)=>a+b,0);
  let t = rand() * total;
  for (let i=0;i<items.length;i++){
    t -= weights[i];
    if (t <= 0) return items[i];
  }
  return items[items.length-1];
}
function normal(mean=0, sd=1) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + sd * z;
}
function monthsBetween(a, b) {
  return (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth()) + (b.getDate()>=a.getDate()?0: -0.25);
}
function iso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function excelSerial(d) {
  const epoch = new Date(Date.UTC(1899,11,30)); // Excel's serial epoch
  return Math.floor((d - epoch) / 86400000);
}
function randomDateTrending() {
  const start = new Date('2024-01-01');
  const horizonDays = Math.floor((TODAY - start) / 86400000);
  const skew = 2.2; // >1 → bias toward recent
  const delta = Math.floor(Math.pow(rand(), skew) * horizonDays);
  const d = new Date(TODAY);
  d.setDate(d.getDate() - delta);

  const r = rand();
  if (r < 0.02) return excelSerial(d);              // ~2% Excel serials
  if (r < 0.07) {                                   // ~5% slashed dates
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}/${m}/${day}`;
  }
  return iso(d);
}
function csvEscape(s) {
  const needs = /[",\n]/.test(s);
  return needs ? `"${String(s).replace(/"/g,'""')}"` : String(s);
}

const PROVINCES = ['ON','BC','QC','AB','MB','SK','NS','NB','NL','PE','NT','NU','YT'];
const PROV_W =   [0.35,0.18,0.17,0.12,0.05,0.04,0.025,0.02,0.015,0.008,0.004,0.004,0.004];

const STATUSES = ['Canadian Permanent Resident','Canadian Citizen','Refugee status in Canada','International Student or Temporary Residents'];
const STATUS_W = [0.30,                          0.35,               0.20,                    0.15];

const AGES = ['15-19','20-24','25-30','None of the above'];
const AGE_W = [0.20,  0.35,   0.25,    0.20];

const PROGRAMS = ['NYSN','GLOCAL','NYSN, GLOCAL'];
const PROG_W   = [0.60,  0.25,   0.15];

const FIRSTS = [
  'Aiden','Bella','Caleb','Dina','Evan','Fiona','Gavin','Hana','Isla','Jonas',
  'Kara','Leo','Mila','Nolan','Owen','Priya','Qadir','Rosa','Samir','Talia',
  'Uri','Vera','Wade','Xena','Yusuf','Zara'
];

const LASTS = [
  'Adams','Baker','Clark','Davis','Evans','Foster','Green','Hall','Irwin','Jackson',
  'King','Lewis','Morris','Nelson','Owens','Parker','Quinn','Roberts','Stevens','Turner',
  'Underwood','Vargas','White','Xu','Young','Zimmer'
];

function makeEmail(first, last, used) {
  const base = `${first}.${last}`.toLowerCase().replace(/[^a-z0-9.]/g,'');
  let email = `${base}@example.com`;
  if (!used.has(email)) { used.add(email); return email; }
  // add digits until unique
  for (let i=0;i<10000;i++){
    const d = String(rint(10000)).padStart(4,'0');
    email = `${base}${d}@example.com`;
    if (!used.has(email)) { used.add(email); return email; }
  }
  // fallback (extremely unlikely)
  email = `${base}.${Date.now()}@example.com`;
  used.add(email);
  return email;
}

function booleansFor(program, status) {
  let pData = 0.40, pDigital = 0.35, pComm = 0.30, pResearch = 0.25, pCompliance = 0.20, pOutreach = 0.25;

  if (program === 'NYSN') { pData += 0.20; pComm += 0.10; }
  if (program === 'GLOCAL') { pOutreach += 0.25; pResearch += 0.10; }
  if (program === 'NYSN, GLOCAL') { pData += 0.10; pComm += 0.06; pOutreach += 0.20; pResearch += 0.08; }

  if (status === 'Working') pCompliance += 0.05;
  if (status === 'International Student') { pDigital += 0.05; pData -= 0.05; }
  if (status === 'Canadian Citizen') pData += 0.02;

  const B = (p) => rand() < clamp(p, 0.02, 0.98);
  return {
    Data: B(pData) ? 'TRUE':'FALSE',
    Digital: B(pDigital) ? 'TRUE':'FALSE',
    Communication: B(pComm) ? 'TRUE':'FALSE',
    Research: B(pResearch) ? 'TRUE':'FALSE',
    Compliance: B(pCompliance) ? 'TRUE':'FALSE',
    Outreach: B(pOutreach) ? 'TRUE':'FALSE'
  };
}

export const INLINE_SAMPLE = (() => {
  const header = `First,Last,Personal Email Address,Program,Province,Current status,Age group,Date of Entry,Onboarding email sent?,Total Hours,Data,Digital,Communication,Research,Compliance,Outreach`;
  const rows = [];
  const usedEmails = new Set();

  for (let i = 0; i < N_ROWS; i++) {
    const first = FIRSTS[rint(FIRSTS.length)];
    const last  = LASTS[rint(LASTS.length)];
    const email = makeEmail(first, last, usedEmails);

    const program = pickWeighted(PROGRAMS, PROG_W);
    const province = pickWeighted(PROVINCES, PROV_W);
    const status = pickWeighted(STATUSES, STATUS_W);
    const age = pickWeighted(AGES, AGE_W);

    const dateVal = randomDateTrending();
    const dateObj = (typeof dateVal === 'number') // Excel serial
      ? new Date(new Date(Date.UTC(1899,11,30)).getTime() + dateVal*86400000)
      : new Date(String(dateVal).replace(/\//g,'-'));

    const mths = Math.max(0, monthsBetween(dateObj, TODAY));
    const onboardP = clamp(0.30 + 0.70 * (mths / 20), 0.30, 0.98);
    const onboard = rand() < onboardP ? 'Yes' : 'No';

    const w = booleansFor(program, status);
    const trueCount = ['Data','Digital','Communication','Research','Compliance','Outreach'].reduce((c,k)=>c+(w[k]==='TRUE'),0);

    const meanH = clamp(2.0*mths + 0.6*trueCount*mths, 0, 220);
    const hours = clamp(normal(meanH, Math.max(3, meanH*0.15)), 0, 300).toFixed(2);

    const progCSV = csvEscape(program); // quote if needed
    rows.push([
      first, last, email, progCSV, province, status, age, dateVal, onboard, hours,
      w.Data, w.Digital, w.Communication, w.Research, w.Compliance, w.Outreach
    ].join(','));
  }

  return [header, ...rows].join('\n');
})();

export async function loadSample({ prefer = 'inline' } = {}) {
  if (prefer === 'file') {
    try {
      const r = await fetch(`./sample.csv?v=${Date.now()}`, { cache: 'no-store' });
      if (r.ok) return await r.text();
    } catch {}
  }
  return INLINE_SAMPLE;
}
