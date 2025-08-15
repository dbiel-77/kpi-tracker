// js/ui/events.js
import { $$, $all, download, copyToClipboard } from '../utils.js';

export function getActiveFilters(){
  const ws = $all(".ws:checked").map(c => c.value);
  return {
    year: $$("#year").value,
    month: $$("#month").value,
    fiscal: $$("#fiscal").value,
    program: $$("#program").value,
    province: $$("#province").value,
    age: $$("#age").value,
    status: $$("#status").value,
    q: $$("#q").value.trim().toLowerCase(),
    workstreams: ws
  };
}

export function applyFilters(state){
  const f = getActiveFilters();
  state.filtered = state.rows.filter(r => {
    if (f.year   && String(r.year)   !== String(f.year))   return false;
    if (f.month  && String(r.month)  !== String(f.month))  return false;
    if (f.fiscal && r.fyQ !== f.fiscal)                    return false;
    if (f.program && r.Program !== f.program)              return false;
    if (f.province && r.Province !== f.province)           return false;
    if (f.age && r["Age group"] !== f.age)                 return false;
    if (f.status && r["Current status"] !== f.status)      return false;
    if (f.q){
      const hay = (r.First + " " + r.Last + " " + (r.Email || "")).toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    if (f.workstreams.length){
      for (const k of f.workstreams){ if (!r[k]) return false; }
    }
    return true;
  });
}

export function bindFilterEvents(state, onChange){
  $$("#apply").addEventListener("click", () => { applyFilters(state); onChange(); });
  $$("#reset").addEventListener("click", () => {
    ["year","month","fiscal","program","province","age","status","q"].forEach(id => { const el=$$("#"+id); if (el) el.value=""; });
    $all(".ws").forEach(c => c.checked=false);
    applyFilters(state); onChange();
  });
  $$("#q").addEventListener("input", () => { applyFilters(state); onChange(); });
}

export function bindTableSort(state, onChange){
  $$("#table thead").addEventListener("click", e => {
    const th = e.target.closest("th"); if (!th) return;
    const newKey = th.getAttribute("data-k") || th.textContent.trim();
    if (state.sortKey === newKey) { state.sortAsc = !state.sortAsc; } else { state.sortKey = newKey; state.sortAsc = true; }
    onChange();
  });
}

export function bindTabs(onTab){
  $all(".tab").forEach(tabEl => {
    tabEl.addEventListener("click", () => {
      $all(".tab").forEach(x => x.classList.remove("active"));
      tabEl.classList.add("active");
      const tab = tabEl.dataset.tab;

      ["overview","calendar","people","vicky","about"].forEach(id => {
        const sec = $$("#page-" + id);
        if (id === tab) sec.classList.remove("hidden"); else sec.classList.add("hidden");
      });

      const sidebar = $$(".panel.filters");
      const grid = $$(".grid");
      if (tab === "vicky") { sidebar?.classList.add("hidden"); grid?.classList.add("grid--full"); }
      else { sidebar?.classList.remove("hidden"); grid?.classList.remove("grid--full"); }

      onTab(tab);
      setTimeout(() => window.dispatchEvent(new Event("resize")), 0);
    });
  });
}

export function bindExportButtons(getRows){
  $$("#downloadCsv").addEventListener("click", () => {
    const out = getRows(); if (!out.length) return;
    const header = Object.keys(out[0]); const lines=[header.join(",")].concat(out.map(r=>header.map(k=>r[k]).join(",")));
    download("volunteer_export.csv", lines.join("\n"));
  });
  $$("#downloadCsv2").addEventListener("click", () => {
    const out = getRows(); if (!out.length) return;
    const header = Object.keys(out[0]); const lines=[header.join(",")].concat(out.map(r=>header.map(k=>r[k]).join(",")));
    download("volunteer_export.csv", lines.join("\n"));
  });
  $$("#copyList").addEventListener("click", () => {
    const out = getRows(); if (!out.length) return;
    copyToClipboard(out.map(r => `${r.First} ${r.Last} <${r.Email}>`).join("\n"));
  });
  $$("#copyList2").addEventListener("click", () => {
    const out = getRows(); if (!out.length) return;
    copyToClipboard(out.map(r => `${r.First} ${r.Last} <${r.Email}>`).join("\n"));
  });
}
