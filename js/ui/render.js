// js/ui/render.js
import { $$, groupCount, safe, ymd } from '../utils.js';
import { chart } from './charts.js';

export function buildSelectOptions(state){
  const rows = state.rows;

  const years = [...new Set(rows.map(r => (r.date instanceof Date && !Number.isNaN(r.date)) ? r.date.getFullYear() : null).filter(Boolean))].sort((a,b)=>a-b);
  $$("#year").innerHTML = '<option value="">All</option>' + years.map(y=>`<option value="${y}">${y}</option>`).join("");

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=>`<option value="${i+1}">${m}</option>`).join("");
  $$("#month").innerHTML = `<option value="">All</option>${months}`;

  const programs = [...new Set(rows.map(r => String(r.Program||"").trim()).filter(Boolean))].sort();
  $$("#program").innerHTML = '<option value="">All</option>' + programs.map(v=>`<option>${v}</option>`).join("");

  const provinces = [...new Set(rows.map(r => r.Province).filter(Boolean))].sort();
  $$("#province").innerHTML = '<option value="">All</option>' + provinces.map(v=>`<option>${v}</option>`).join("");

  const ages = [...new Set(rows.map(r => (r["Age group"] ?? "").toString().trim()).filter(Boolean))].sort();
  $$("#age").innerHTML = '<option value="">All</option>' + ages.map(v=>`<option>${v}</option>`).join("");

  const statuses = [...new Set(rows.map(r => String(r["Current status"] ?? "").trim()).filter(Boolean))].sort();
  $$("#status").innerHTML = '<option value="">All</option>' + statuses.map(v=>`<option>${v}</option>`).join("");
}

export function renderKPIs(state){
  const now = new Date();
  const total = state.filtered.length;
  const newMo = state.filtered.filter(r => r.month === (now.getMonth()+1) && r.year === now.getFullYear()).length;
  const onbRate = (100 * (state.filtered.filter(r => r["Onboarding email sent?"]).length / (state.filtered.length || 1))).toFixed(0) + "%";
  const hrs = state.filtered.reduce((a,r)=>a + (r["Total Hours"]||0), 0).toFixed(2);
  $$("#k_total").textContent = total;
  $$("#k_new_mo").textContent = newMo;
  $$("#k_onb_rate").textContent = onbRate;
  $$("#k_hours").textContent = hrs;
}

export function renderCharts(state){
  if (!state.filtered.length){
    ["c_province","c_program","c_monthly","c_status"].forEach(id => {
      if (state.charts[id]) { state.charts[id].destroy(); delete state.charts[id]; }
    });
    return;
  }

  const byProv = groupCount(state.filtered, r => r.Province);
  chart(state, "c_province", {
    type:"bar",
    data:{ labels:Object.keys(byProv), datasets:[{ label:"Volunteers", data:Object.values(byProv)}]},
    options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{beginAtZero:true}}}
  });

  const byProg = groupCount(state.filtered, r => r.Program);
  chart(state,"c_program",{
    type:"bar",
    data:{ labels:Object.keys(byProg), datasets:[{ label:"Volunteers", data:Object.values(byProg)}]},
    options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{beginAtZero:true}}}
  });

  const monthly = groupCount(state.filtered, r => (r.year && r.month) ? (r.year + "-" + String(r.month).padStart(2,"0")) : "");
  const keys = Object.keys(monthly).filter(Boolean).sort();
  chart(state,"c_monthly",{
    type:"line",
    data:{ labels:keys, datasets:[{ label:"New entries", data:keys.map(k=>monthly[k])}]},
    options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}}}
  });

  const byStatus = groupCount(state.filtered, r => r["Current status"]);
  const statusMap = {
    "Canadian Permanent Resident": "PR",
    "International Student or Temporary Residents": "Intl",
    "Canadian Citizen": "Citizen",
    "Other": "Other",
    "Refugee status in Canada": "Refugee"
  };

  const labels = Object.keys(byStatus).map(l => statusMap[l] || l);

  chart(state,"c_status",{
    type:"bar",
    data:{
      labels: labels,
      datasets:[{
        label:"Volunteers",
        data:Object.values(byStatus),
        backgroundColor:["#4a90e2","#e94e77","#f5a623","#7ed321","#50e3c2"]
      }]
    },
    options:{
      responsive:true,
      plugins:{ legend:{ display:false }},
      scales:{
        x:{
          grid:{display:false},
          ticks:{ maxRotation:0, minRotation:0 } 
        },
        y:{ beginAtZero:true }
      }
    }
  });



}

export function renderTable(state){
  const tb = $$("#table tbody");
  const data = state.filtered.slice();
  const sortKey = state.sortKey, sortAsc = state.sortAsc;

  function valForSort(obj, key) {
    if (key === "Date of Entry") return obj.date ? obj.date.getTime() : 0;
    if (key === "Total Hours")   return obj["Total Hours"] || 0;
    return String(obj[key] ?? "").toLowerCase();
  }

  if (sortKey){
    data.sort((a,b)=>{
      const va = valForSort(a, sortKey);
      const vb = valForSort(b, sortKey);
      if (va<vb) return sortAsc?-1:1;
      if (va>vb) return sortAsc? 1:-1;
      return 0;
    });
  }

  tb.innerHTML = data.map(r =>
    `<tr>
      <td>${safe(r.First)}</td>
      <td>${safe(r.Last)}</td>
      <td>${safe(r.Email)}</td>
      <td>${safe(r.Program)}</td>
      <td>${safe(r.Province)}</td>
      <td>${safe(r["Age group"])}</td>
      <td><span class="tag">${safe(r["Current status"])}</span></td>
      <td>${r.date ? ymd(r.date) : ""}</td>
      <td>${r["Onboarding email sent?"] ? '<span class="tag ok">Yes</span>' : '<span class="tag warn">No</span>'}</td>
      <td class="right">${(r["Total Hours"]||0).toFixed(2)}</td>
    </tr>`
  ).join("");
}

export function renderCalendar(state){
  const y = Number($$("#year").value) || (new Date().getFullYear());
  const cal = $$("#calendar");
  const heat = (v)=> v<=0?"#1c2330": (v===1?"#32425d": (v===2?"#49608a": (v<=4?"#5e82ba":"#7aa2f7")));
  const ymdLocal = (d)=> new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  const days = (()=>{ const m={}; for(const r of state.filtered.filter(r=>r.year===y)){ if(!r.date) continue; const k=ymdLocal(r.date); m[k]=(m[k]||0)+1; } return m; })();
  const first = new Date(y,0,1);
  const start = new Date(first); start.setDate(first.getDate() - ((first.getDay()+6)%7));
  const end = new Date(y,11,31);
  const weeks = Math.floor((end-start)/(7*24*3600*1000)) + 1;

  cal.innerHTML = "";
  for(let w=0; w<weeks; w++){
    for(let d=0; d<7; d++){
      const cellDate = new Date(start); cellDate.setDate(start.getDate() + w*7 + d);
      const key = ymdLocal(cellDate);
      const inYear = cellDate.getFullYear() === y;
      const count = inYear ? (days[key] || 0) : 0;
      const div = document.createElement("div");
      div.className = "day";
      div.title = `${key} • ${count} new`;
      div.style.background = heat(count);
      cal.appendChild(div);
    }
  }
}

export function renderAll(state, deps){
  renderKPIs(state);
  renderCharts(state);
  renderTable(state);

  const year = Number($$("#year")?.value) || new Date().getFullYear();
  const calYearEl = $$("#calYear");
  if (calYearEl) calYearEl.textContent = year;

  renderCalendar(state, {
    year,
    cell: 18,
    gutter: 3,
    showWeekdayLabels: true,
    showMonthLabels: true,
    height: 'calc(100vh - 220px)',
    startOnMonday: true,
  });

  if (!$$("#page-vicky")?.classList.contains("hidden")) {
    deps.renderVicky(state, deps);
  }
}