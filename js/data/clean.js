// js/data/clean.js
import { titleCase, normBool, parseDate, fyQuarter, fyYear, numSafe } from '../utils.js';

export function cleanRows(input){
  if (!input || !input.length) return [];
  return input.map(r => {
    const first   = titleCase(r["First"] || r["First Name"] || "");
    const last    = titleCase(r["Last"]  || r["Last Name"]  || "");
    const programRaw = String(r["Program"] || "").trim();
    const program    = (programRaw || "UNKNOWN").split(/[;,]/)[0].trim();

    const province = String(r["Province"] || "").trim().toUpperCase() || "OTHER";
    const status   = String(r["Current status"] ?? "").trim();
    const age      = String(r["Age group"] ?? "").trim();

    const d = parseDate(r["Date of Entry"]);
    const onboarding = normBool(r["Onboarding email sent?"]);

    const totalHours = numSafe(r["Total Hours"]);
    const taskHours  = numSafe(r["Task Hours"]);
    const eventHours = numSafe(r["Event Hours"]);

    const ws = {}; ["Data","Digital","Communication","Research","Compliance","Outreach"].forEach(k => ws[k] = normBool(r[k]));

    return {
      First:first, Last:last,
      Program:program, ProgramRaw:programRaw,
      Province:province, Email:String(r["Personal Email Address"] || r["Email"] || "").trim(),
      "Age group":age, "Current status":status, "Onboarding email sent?":onboarding,
      "Date of Entry": d, date:d, year:d?d.getFullYear():"", month:d?d.getMonth()+1:"",
      fyQ: fyQuarter(d), fyY: fyYear(d),
      "Total Hours": totalHours, "Task Hours": taskHours, "Event Hours": eventHours,
      ...ws
    };
  }).filter(o => (o.First || o.Last || o.Email));
}
