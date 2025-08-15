// js/sample.js
export const INLINE_SAMPLE = (() => {
  const header = `First,Last,Personal Email Address,Program,Province,Current status,Age group,Date of Entry,Onboarding email sent?,Total Hours,Data,Digital,Communication,Research,Compliance,Outreach`;
  const rows = [];
  rows.push(`Alice,Ng,alice@example.com,NYSN,ON,Student,18-24,2025-04-12,Yes,12,TRUE,FALSE,TRUE,FALSE,FALSE,FALSE`);
  rows.push(`Bob,Lee,bob@example.net,"NYSN, GLOCAL",BC,Working,25-34,2025/05/03,No,5,FALSE,TRUE,FALSE,TRUE,FALSE,FALSE`);
  rows.push(`Carla,Diaz,carla@example.org,"Microgrants, NYSN",AB,International Student,18-24,45250,Yes,3,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE`);

  const PROVS = ['ON','BC','AB','MB','SK','QC','NS','NB','NL','PE','NT','NU','YT'];
  const STATUS = ['Canadian Citizen', 'Temporary Resident','Working','International Student', 'Refugee',];
  const AGE = ['15-19','20-24','25-30','None of the above'];
  function prog(i){
    const opts = ['NYSN','GLOCAL'];
    return opts[i % opts.length];
  }
  function pad(n){ return n.toString().padStart(2,'0'); }

  for (let i = 4; i <= 100; i++) {
    const first = `First${i}`;
    const last = `Last${i}`;
    const email = `user${i}@example.com`;
    const program = prog(i);
    const prov = PROVS[i % PROVS.length];
    const status = STATUS[i % STATUS.length];
    const age = AGE[i % AGE.length];

    let date;
    if (i % 25 === 0) {
      date = 45250 + i; // Excel-style serial occasionally
    } else if (i % 10 === 0) {
      date = `2025/${pad((i % 12) + 1)}/${pad(((i * 7) % 28) + 1)}`;
    } else {
      date = `2025-${pad((i % 12) + 1)}-${pad(((i * 7) % 28) + 1)}`;
    }

    const onboard = (i % 3 === 0) ? 'Yes' : 'No';
    const hours = ((i * 1.25) % 120).toFixed(2);

    const Data = (i % 2 === 0) ? 'TRUE' : 'FALSE';
    const Digital = (i % 3 === 0) ? 'TRUE' : 'FALSE';
    const Communication = (i % 4 === 0) ? 'TRUE' : 'FALSE';
    const Research = (i % 5 === 0) ? 'TRUE' : 'FALSE';
    const Compliance = (i % 7 === 0) ? 'TRUE' : 'FALSE';
    const Outreach = (i % 11 === 0) ? 'TRUE' : 'FALSE';

    rows.push([
      first, last, email, program, prov, status, age, date, onboard, hours,
      Data, Digital, Communication, Research, Compliance, Outreach
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
