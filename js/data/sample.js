// js/sample.js
export const INLINE_SAMPLE = `First,Last,Personal Email Address,Program,Province,Current status,Age group,Date of Entry,Onboarding email sent?,Total Hours,Data,Digital,Communication,Research,Compliance,Outreach
Alice,Ng,alice@example.com,NYSN,ON,Student,18-24,2025-04-12,Yes,12,TRUE,FALSE,TRUE,FALSE,FALSE,FALSE
Bob,Lee,bob@example.net,"NYSN, GLOCAL",BC,Working,25-34,2025/05/03,No,5,FALSE,TRUE,FALSE,TRUE,FALSE,FALSE
Carla,Diaz,carla@example.org,"Microgrants, NYSN",AB,International Student,18-24,45250,Yes,3,FALSE,FALSE,FALSE,TRUE,TRUE,FALSE
`;


export async function loadSample() {
  try {
    const r = await fetch('./sample.csv', { cache: 'no-store' });
    if (r.ok) return await r.text();
  } catch (e) {
    console.warn('sample.csv fetch failed, using inline sample:', e);
  }
  return INLINE_SAMPLE;
}
