// calendar.js
import { $$ } from './utils.js';

function ymd(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function monthShort(m){ return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m]; }

function countByDay(rows){
  const m = Object.create(null);
  for (const r of rows){ if (!r?.date) continue; const k = ymd(r.date); m[k] = (m[k] || 0) + 1; }
  return m;
}
function startOfCalendarYear(year, mon){
  const first = new Date(year,0,1);
  const dow = first.getDay(); // 0=Sun..6=Sat
  const shift = mon ? (dow === 0 ? 6 : dow-1) : dow;
  const s = new Date(first); s.setDate(first.getDate() - shift); return s;
}
function endOfCalendarYear(year){ return new Date(year,11,31); }
function weeksBetween(a,b){ return Math.floor((b - a) / (7*24*3600*1000)) + 1; }

function buildScale(max){
  const m = Math.max(1, max);
  const t1 = 1, t2 = Math.ceil(m*0.25), t3 = Math.ceil(m*0.5), t4 = Math.ceil(m*0.75);
  const colors = ["#1c2330","#32425d","#49608a","#5e82ba","#7aa2f7"];
  const pick = v => v<=0?colors[0] : v<=t1?colors[1] : v<=t2?colors[2] : v<=t3?colors[3] : colors[4];
  return { colors, pick };
}

export function renderCalendar(
  state,
  {
    year = new Date().getFullYear(),
    cell = 18,
    gutter = 3,
    height = 'calc(100vh - 220px)',
    startOnMonday = true,
    showWeekdayLabels = true,
    showMonthLabels = true,
  } = {}
){
  const root = $$("#calendar");
  if (!root) return;

  // base sizing
  root.innerHTML = "";
  root.style.position = "relative";
  root.style.minHeight = height;

  // wrappers (grid + label overlays)
  const grid = document.createElement("div");
  const monthsOverlay = document.createElement("div");
  const weekdaysOverlay = document.createElement("div");

  grid.style.position = "relative";
  monthsOverlay.style.position = "absolute";
  weekdaysOverlay.style.position = "absolute";

  monthsOverlay.style.top = "0";
  monthsOverlay.style.left = showWeekdayLabels ? `${Math.ceil(cell*1.35)}px` : "0";
  monthsOverlay.style.right = "0";
  monthsOverlay.style.height = `${cell}px`;
  monthsOverlay.style.display = showMonthLabels ? "block" : "none";

  weekdaysOverlay.style.top = showMonthLabels ? `${cell + gutter}px` : "0";
  weekdaysOverlay.style.left = "0";
  weekdaysOverlay.style.width = showWeekdayLabels ? `${Math.ceil(cell*1.35)}px` : "0";
  weekdaysOverlay.style.bottom = "0";
  weekdaysOverlay.style.display = showWeekdayLabels ? "block" : "none";

  // compute timeline
  const rows = (state.filtered || state.rows || []).filter(r => r?.date && r.date.getFullYear() === year);
  const dayCounts = countByDay(rows);
  let maxCount = 0; for (const v of Object.values(dayCounts)) if (v > maxCount) maxCount = v;
  const scale = buildScale(maxCount);

  const calStart = startOfCalendarYear(year, startOnMonday);
  const calEnd   = endOfCalendarYear(year);
  const weeks    = weeksBetween(calStart, calEnd);

  // grid sizing
  const leftPad = showWeekdayLabels ? Math.ceil(cell*1.35) + gutter : 0;
  const topPad  = showMonthLabels ? cell + gutter : 0;
  grid.style.marginLeft = `${leftPad}px`;
  grid.style.marginTop  = `${topPad}px`;
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = `repeat(${weeks}, ${cell}px)`;
  grid.style.gridTemplateRows    = `repeat(7, ${cell}px)`;
  grid.style.columnGap = `${gutter}px`;
  grid.style.rowGap    = `${gutter}px`;

  // month labels (absolute overlay across week columns)
  if (showMonthLabels){
    monthsOverlay.innerHTML = "";
    let lastM = -1;
    for (let w=0; w<weeks; w++){
      const weekStart = new Date(calStart); weekStart.setDate(calStart.getDate() + w*7);
      if (weekStart.getFullYear() !== year) continue;
      const m = weekStart.getMonth();
      if (m === lastM) continue;
      lastM = m;
      const lbl = document.createElement("div");
      lbl.textContent = monthShort(m);
      lbl.style.position = "absolute";
      lbl.style.left = `${w*(cell+gutter)}px`;
      lbl.style.top  = "0";
      lbl.style.fontSize = "12px";
      lbl.style.color = "var(--muted)";
      monthsOverlay.appendChild(lbl);
    }
  }

  // weekday labels (absolute overlay down the left)
  if (showWeekdayLabels){
    weekdaysOverlay.innerHTML = "";
    const order = startOnMonday ? [1,2,3,4,5,6,0] : [0,1,2,3,4,5,6];
    const names = startOnMonday ? ["M","T","W","T","F","S","S"] : ["S","M","T","W","T","F","S"];
    order.forEach((dow, iRow) => {
      const lbl = document.createElement("div");
      lbl.textContent = names[iRow];
      lbl.style.position = "absolute";
      lbl.style.top = `${iRow*(cell+gutter)}px`;
      lbl.style.right = "6px";
      lbl.style.fontSize = "12px";
      lbl.style.color = "var(--muted)";
      lbl.style.lineHeight = `${cell}px`;
      weekdaysOverlay.appendChild(lbl);
    });
  }

  // day cells
  const todayKey = ymd(new Date());
  for (let w=0; w<weeks; w++){
    for (let d=0; d<7; d++){
      const date = new Date(calStart); date.setDate(calStart.getDate() + w*7 + d);
      const inYear = date.getFullYear() === year;
      const k = ymd(date);
      const v = inYear ? (dayCounts[k] || 0) : 0;

      const cellDiv = document.createElement("div");
      cellDiv.style.width = `${cell}px`;
      cellDiv.style.height = `${cell}px`;
      cellDiv.style.borderRadius = "4px";
      cellDiv.style.background = inYear ? scale.pick(v) : "transparent";
      if (!inYear) cellDiv.style.opacity = "0.25";
      if (k === todayKey) cellDiv.style.boxShadow = "inset 0 0 0 2px var(--accent-2)";
      cellDiv.title = `${k} • ${v} new`;

      cellDiv.style.transition = "transform .06s ease";
      cellDiv.addEventListener("mouseenter", ()=> cellDiv.style.transform = "scale(1.08)");
      cellDiv.addEventListener("mouseleave", ()=> cellDiv.style.transform = "none");

      grid.appendChild(cellDiv);
    }
  }

  // legend
  let legend = root.nextElementSibling;
  if (!legend || !legend.classList.contains("legend")){
    legend = document.createElement("div");
    legend.className = "legend";
    legend.style.display = "flex";
    legend.style.alignItems = "center";
    legend.style.gap = "8px";
    legend.style.marginTop = "8px";
    root.parentElement?.insertBefore(legend, root.nextSibling);
  }
  legend.innerHTML = "";
  const less = document.createElement("span"); less.textContent = "Less"; less.style.fontSize="12px"; less.style.color="var(--muted)";
  const more = document.createElement("span"); more.textContent = "More"; more.style.fontSize="12px"; more.style.color="var(--muted)";
  legend.appendChild(less);
  buildScale(4).colors.forEach(c => { // static sample gradient for legend
    const sw = document.createElement("span");
    sw.style.display="inline-block"; sw.style.width="14px"; sw.style.height="14px";
    sw.style.borderRadius="3px"; sw.style.background=c; legend.appendChild(sw);
  });
  legend.appendChild(more);

  // mount
  root.appendChild(monthsOverlay);
  root.appendChild(weekdaysOverlay);
  root.appendChild(grid);
}
