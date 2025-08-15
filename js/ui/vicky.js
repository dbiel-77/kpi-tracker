// js/ui/vicky.js
import { $$, groupCount } from '../utils.js';
import { chart } from './charts.js';

const DEADLINE = new Date(2027, 3, 30); // April 30, 2027 (0-based month)

// ---------- helpers ----------
function uniqueCount(arr, keyFn){
  const s = new Set();
  for (const r of arr){
    const k = keyFn(r);
    if (k) s.add(k);
  }
  return s.size;
}

function monthsRemainingInclusive(fromDate, toDate){
  const a = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const b = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  const diff = (b.getFullYear() - a.getFullYear())*12 + (b.getMonth() - a.getMonth());
  return Math.max(0, diff + 1); // include current month
}

function setBar(el, value, goal){
  if (!el) return;
  const pct = goal ? Math.max(0, Math.min(100, (value/goal)*100)) : 0;
  el.style.width = pct.toFixed(1) + "%";
}

function monthSpanLabels(fromDate, toDate){
  const a = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const b = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  const labels = [];
  const fmt = (y,m) => `${y}-${String(m+1).padStart(2,"0")}`;
  let y = a.getFullYear(), m = a.getMonth();
  while (y < b.getFullYear() || (y === b.getFullYear() && m <= b.getMonth())) {
    labels.push(fmt(y,m));
    m++; if (m === 12){ m = 0; y++; }
  }
  return labels;
}

// ---------- main render ----------
export function renderVicky(state, { VICKY_FROM, V_GOALS, V_TRACKS }){
  const host = $$("#vicky-kpi") || $$("#page-vicky .vkpi-host");
  if (!host) return;

  // Scope: NYSN since VICKY_FROM
  const vData = state.rows.filter(r =>
    r.date &&
    r.date >= VICKY_FROM &&
    String(r.ProgramRaw || r.Program).toUpperCase().includes("NYSN")
  );

  // Totals
  const volunteers = uniqueCount(vData, r => (r.Email || `${r.First}|${r.Last}`).toLowerCase());
  const hours = vData.reduce((a,r)=> a + (r["Total Hours"] || 0), 0);

  // Track counts (cumulative by person flags)
  const byTrack = V_TRACKS.reduce((m,k)=>(m[k]=0,m),{});
  for (const r of vData){ V_TRACKS.forEach(k => { if (r[k]) byTrack[k]++; }); }

  // Monthly series for charts
  const monthly = groupCount(vData, r => (r.year && r.month) ? (r.year + "-" + String(r.month).padStart(2,"0")) : "");
  const mKeys = Object.keys(monthly).filter(Boolean).sort();

  const hoursMonthly = {};
  for (const r of vData){
    if (!r.date) continue;
    const k = r.year + "-" + String(r.month).padStart(2,"0");
    hoursMonthly[k] = (hoursMonthly[k] || 0) + (r["Total Hours"] || 0);
  }
  const hKeys = Object.keys(hoursMonthly).sort();

  // Time context
  const now = new Date();
  const monthsLeft = monthsRemainingInclusive(now, DEADLINE);
  const nowY = now.getFullYear();
  const nowM = now.getMonth() + 1;

  // This month counts by track
  const thisMonthTrackCounts = V_TRACKS.map(k =>
    vData.filter(r => r.year === nowY && r.month === nowM && r[k]).length
  );

  // Tier goals
  const tierGoals = {
    1: { vols: 1600, hours: Math.round(240000 * (1600/2000)) }, // 192k at Tier1
    2: { vols: 2000, hours: 240000 }
  };
  const perTrackTotalGoal = (tier) => {
    const v = tierGoals[tier].vols;
    const base = Math.floor(v / V_TRACKS.length);
    const rem  = v - base * V_TRACKS.length;
    return V_TRACKS.map((_, i) => base + (i < rem ? 1 : 0));
  };
  function monthsBetweenInclusive(a, b){
    const A = new Date(a.getFullYear(), a.getMonth(), 1);
    const B = new Date(b.getFullYear(), b.getMonth(), 1);
    const diff = (B.getFullYear() - A.getFullYear()) * 12 + (B.getMonth() - A.getMonth());
    return Math.max(0, diff + 1); // include both endpoints
  }

  // Helper for cumulative series (uses vData + VICKY_FROM)
  function computeCumeSeries(tier){
    // labels: from start to *now* (what we actually show)
    const labels = monthSpanLabels(VICKY_FROM, new Date());

    // Actual cumulative (unique new volunteers by month)
    const monthToSet = new Map(); // ym -> Set<email>
    for (const r of vData) {
      if (!r.date) continue;
      const ym = `${r.year}-${String(r.month).padStart(2,"0")}`;
      if (!monthToSet.has(ym)) monthToSet.set(ym, new Set());
      const key = (r.Email || `${r.First}|${r.Last}`).toLowerCase();
      monthToSet.get(ym).add(key);
    }
    const monthlyNew = labels.map(ym => (monthToSet.get(ym)?.size || 0));
    const cumulativeActual = [];
    monthlyNew.reduce((acc, v, i) => (cumulativeActual[i] = acc + v, acc + v), 0);

    // Expected cumulative ramp to the DEADLINE (not to now)
    const goalVols = tierGoals[tier].vols;                    // 1600 or 2000
    const totalToDeadline = monthsBetweenInclusive(VICKY_FROM, DEADLINE);
    // For each displayed month i (1..labels.length), expected is proportional to
    // the fraction of the whole journey to the deadline that should be done by month i.
    const expectedCume = labels.map((_, i) => {
      const elapsedToHere = i + 1; // months since VICKY_FROM (inclusive)
      const frac = Math.min(1, elapsedToHere / Math.max(1, totalToDeadline));
      return Math.round(goalVols * frac);
    });

    return { labels, cumulativeActual, expectedCume, goalVols };
  }

  //build shell
  if (!host.dataset.ready){
    host.dataset.ready = "1";
    host.innerHTML = `
      <div class="vkpi">
        <div class="row">
          <div class="kcard" id="kpi-main">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
              <h3 style="margin:0">KPI target</h3>
              <div class="pill-switch" id="tierSwitch">
                <div class="pill active" data-tier="1">Tier 1</div>
                <div class="pill" data-tier="2">Tier 2</div>
              </div>
            </div>
            <div class="sub" id="kpi-deadline"></div>

            <div class="grid-2" style="margin-top:8px">
              <div>
                <div class="big knum" id="volLine"></div>
                <div class="sub" id="volNeedLine"></div>
                <div class="progress" style="margin-top:8px"><b id="volProg"></b></div>
              </div>
              <div>
                <div class="big knum" id="hrsLine"></div>
                <div class="sub" id="hrsNeedLine"></div>
                <div class="progress" style="margin-top:8px"><b id="hrsProg"></b></div>
              </div>
            </div>

            <div class="kcard" style="margin-top:12px">
              <h3 style="margin:0 0 6px 0">Progress vs. plan (cumulative volunteers)</h3>
              <div class="cume-wrap"><canvas id="c_vicky_cume"></canvas></div>
              <div class="sub" id="monthHint" style="margin-top:6px"></div>
            </div>
          </div>

          <div class="kcard" id="kpi-track">
            <h3>Needed this month</h3>
            <div class="track-list" id="trackList"></div>
          </div>
        </div>
      </div>
    `;

    // Tier toggle wiring (once)
    if (!host._tierWired) {
      host._tierWired = true;
      const pills = host.querySelectorAll('.pill[data-tier]');
      pills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          pills.forEach(x => x.classList.remove('active'));
          pill.classList.add('active');
          const tier = Number(pill.dataset.tier) || 1;
          paint(tier); // repaint only
        }, { passive: true });
      });
    }

    // Create cumulative chart once; keep a handle
    host._charts ||= {};
    if (!host._charts.cume) {
      const ctx = host.querySelector("#c_vicky_cume").getContext("2d");
      const { labels, cumulativeActual, expectedCume, goalVols } = computeCumeSeries(1);
      host._charts.cume = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { type: "bar",  label: "Cumulative volunteers", data: cumulativeActual, borderWidth: 0 },
            { type: "line", label: `Expected (${goalVols.toLocaleString()})`, data: expectedCume, tension: 0.25, pointRadius: 0, borderWidth: 2 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,   // fill .cume-wrap
          plugins: { legend: { display: true } },
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
        }
      });
      window.addEventListener("resize", () => host._charts.cume?.resize(), { passive: true });
    }
  }

  // Determine active tier (default 1)
  const activePill = host.querySelector('.pill.active[data-tier]');
  const startingTier = activePill ? Number(activePill.dataset.tier) : 1;

  // Deadline label
  const dl = host.querySelector("#kpi-deadline");
  if (dl) dl.textContent = `Deadline: ${DEADLINE.toLocaleDateString(undefined, { year:'numeric', month:'long' })}`;

  // ---------- painter: fills numbers & charts for selected tier ----------
  function paint(tier){
    const goals = tierGoals[tier];
    const volunteersGoal = goals.vols;
    const hoursGoal = goals.hours;

    // Remaining
    const volNeedTotal = Math.max(0, volunteersGoal - volunteers);
    const hrsNeedTotal = Math.max(0, hoursGoal - hours);

    // Even-pace guidance
    const paceVol = monthsLeft ? Math.ceil(volNeedTotal / monthsLeft) : 0;
    const paceHrs = monthsLeft ? Math.ceil(hrsNeedTotal / monthsLeft) : 0;

    // Top KPI lines + bars
    host.querySelector("#volLine").textContent =
      `${volunteers.toLocaleString()} / ${volunteersGoal.toLocaleString()} volunteers`;
    host.querySelector("#volNeedLine").textContent =
      `${volNeedTotal.toLocaleString()} needed • ${paceVol.toLocaleString()}/mo pace (${monthsLeft} months left)`;
    host.querySelector("#hrsLine").textContent =
      `${Math.round(hours).toLocaleString()} / ${hoursGoal.toLocaleString()} hours`;
    host.querySelector("#hrsNeedLine").textContent =
      `${hrsNeedTotal.toLocaleString()} needed • ${paceHrs.toLocaleString()}/mo pace`;

    setBar(host.querySelector("#volProg"), volunteers, volunteersGoal);
    setBar(host.querySelector("#hrsProg"), hours, hoursGoal);

    const hint = host.querySelector("#monthHint");
    if (hint) hint.textContent = `Includes this month • ${monthsLeft} months remaining`;

    // Per-track monthly quotas from tier totals
    const trackTotals  = perTrackTotalGoal(tier);
    const monthlyQuota = trackTotals.map(g => g / Math.max(1, monthsLeft));

    // Right column: per-track progress pills (80/20 layout done via CSS)
    const tl = host.querySelector("#trackList");
    if (tl){
      tl.replaceChildren();
      V_TRACKS.forEach((tname, i) => {
        const haveThisMonth = thisMonthTrackCounts[i];
        const quota         = monthlyQuota[i];
        const needThisMonth = Math.max(0, Math.ceil(quota - haveThisMonth));

        const pct        = quota ? (haveThisMonth / quota) * 100 : 0;
        const pctClamped = Math.min(100, Math.max(0, pct));
        const quotaCeil  = Math.ceil(quota);

        const row = document.createElement("div");
        row.className = "track-item";
        row.setAttribute("data-track", tname);
        row.setAttribute("data-color", String(i));
        row.innerHTML = `
          <div class="track-bar">
            <div class="track-fill" style="width:${pctClamped.toFixed(1)}%"></div>
            <div class="track-title">${tname}</div>
          </div>
          <div class="track-stats">
            <div class="track-meta">${haveThisMonth.toLocaleString()} / ${quotaCeil.toLocaleString()} (${Math.round(pct)}%)</div>
            <div class="track-sub">need ${needThisMonth.toLocaleString()}</div>
          </div>
        `;
        tl.appendChild(row);
      });
    }

    // ----- Update cumulative volunteers vs expected (bar + line) -----
    const ch = host._charts?.cume;
    if (ch) {
      const { labels, cumulativeActual, expectedCume, goalVols } = computeCumeSeries(tier);
      ch.data.labels = labels;
      ch.data.datasets[0].data = cumulativeActual;
      ch.data.datasets[1].data = expectedCume;
      ch.data.datasets[1].label = `Expected (${goalVols.toLocaleString()})`;
      ch.update();
    }
  }

  // initial paint (respect active pill)
  paint(startingTier);

  // ---- other charts (use existing helper) ----
  chart(state, "c_vicky_monthly", {
    type:"bar",
    data:{ labels:mKeys, datasets:[{ label:"New volunteers (NYSN)", data:mKeys.map(k=>monthly[k]) }] },
    options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{beginAtZero:true}} }
  });

  const trackCounts = V_TRACKS.map(k => byTrack[k] || 0);
  chart(state, "c_vicky_program", {
    type:"bar",
    data:{ labels:V_TRACKS, datasets:[{ label:"Participants by track", data:trackCounts }] },
    options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{beginAtZero:true}} }
  });

  chart(state, "c_vicky_hours", {
    type:"line",
    data:{ labels:hKeys, datasets:[{ label:"Total hours (NYSN)", data:hKeys.map(k=>hoursMonthly[k]) }] },
    options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}} }
  });
}
