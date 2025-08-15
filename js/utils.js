// js/utils.js
export const $$   = sel => document.querySelector(sel);
export const $all = sel => Array.from(document.querySelectorAll(sel));

export function titleCase(s){ return (s || "").toLowerCase().replace(/\b\w/g, m => m.toUpperCase()).trim(); }
export function normBool(v){ const t = String(v ?? "").trim().toLowerCase(); return t==="true"||t==="yes"||t==="y"||t==="1"||t==="x"; }

export function parseDate(raw){
  if (raw == null) return null;
  let t = String(raw).trim();
  if (!t) return null;
  if (/^\d{4,6}$/.test(t)) {
    const n = Number(t); if (!Number.isNaN(n) && n>20000 && n<60000){
      const ms = (n - 25569) * 86400000; const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  if (/^\d{4}[-/]\d{2}$/.test(t)) { const [y,m]=t.split(/[-/]/).map(Number); const d=new Date(y,m-1,1); return Number.isNaN(d.getTime())?null:d; }
  if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(t)) t = t.replace(/\./g,"-");
  let d = new Date(t); if (!Number.isNaN(d.getTime())) return d;
  const mdy = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (mdy){ const a=+mdy[1], b=+mdy[2], Y=mdy[3].length===2?+("20"+mdy[3]):+mdy[3]; const M=a<=12?a:b; const D=a<=12?b:a; d=new Date(Y,M-1,D); return Number.isNaN(d.getTime())?null:d; }
  return null;
}

export function fyQuarter(d){ if(!d) return ""; const m=d.getMonth()+1; if(m>=4&&m<=6)return"Q1"; if(m>=7&&m<=9)return"Q2"; if(m>=10&&m<=12)return"Q3"; return"Q4"; }
export function fyYear(d){ return (!d) ? "" : ((d.getMonth()+1)<=3 ? d.getFullYear()-1 : d.getFullYear()); }
export function ymd(d){ return (d ? new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10) : ""); }

export function unique(arr){ return [...new Set(arr.filter(v=>v && v!==""))].sort((a,b)=>String(a).localeCompare(String(b))); }
export function numSafe(v){ const n=parseFloat(String(v ?? "").replace(/,/g,"")); return Number.isNaN(n)?0:n; }
export function groupCount(arr, keyFn){ const m={}; for(const r of arr){ const k=keyFn(r)||""; if(!k) continue; m[k]=(m[k]||0)+1; } return m; }
export function csvEsc(v){ const s=v==null?"":String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
export function download(filename, text){ const blob=new Blob([text],{type:"text/csv;charset=utf-8;"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(url); a.remove();},0); }
export function copyToClipboard(text){ if (navigator.clipboard) navigator.clipboard.writeText(text); }
export function safe(s){ return (s==null?"":String(s)).replace(/[&<>]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[c])); }
export function pct(n,d){ return d ? Math.max(0, Math.min(100, (n/d)*100)) : 0; }

// (normalizeHeaders is only needed by ingest; if you still want it:)
export function normalizeHeaders(row){
  const out={}; for(const k in row){ const nk=String(k||"").replace(/^\uFEFF/,"").replace(/\s+/g," ").trim(); out[nk]=row[k]; } return out;
}
