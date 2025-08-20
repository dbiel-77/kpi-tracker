import { $$ } from './utils.js';
import { state } from './state.js';
import { VICKY_FROM, V_GOALS, V_TRACKS, VICKY_DEADLINE } from './consts.js';
import { cleanRows } from './data/clean.js';
import { buildSelectOptions, renderAll } from './ui/render.js';
import { bindTabs, bindFilterEvents, bindTableSort, bindExportButtons, applyFilters } from './ui/events.js';
import { renderVicky } from './ui/vicky.js';
import { parseCSVText, readFileAsText, ingestToState } from './data/ingest.js';
import { loadSample } from './data/sample.js';


export function initApp(){
    // Month dropdown initial fill
    const mSel = $$("#month");
    if (mSel) {
        mSel.innerHTML = '<option value="">All</option>' +
        ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        .map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
    }

    // Tabs
    bindTabs(tab => {

        setTimeout(() => window.dispatchEvent(new Event("resize")), 0);
        renderAll(state, { renderVicky, VICKY_FROM, V_GOALS, V_TRACKS });
    });

    bindFilterEvents(state, () => renderAll(state, { renderVicky, VICKY_FROM, V_GOALS, V_TRACKS }));
    bindTableSort(state, () => renderAll(state, { renderVicky, VICKY_FROM, V_GOALS, V_TRACKS }));
    bindExportButtons(() => state.filtered.map(r => ({ First:r.First, Last:r.Last, Email:r.Email })).filter(x=>x.Email));

    // Ingest: file input
    $$("#file")?.addEventListener("change", async (e)=>{
        const f = e.target.files[0]; if (!f) return;
        try {
        const txt = await readFileAsText(f);
        const raw = await parseCSVText(txt);         // <— Promise API
        state.rawRows = raw || [];
        state.rows = cleanRows(state.rawRows);
        state.filtered = state.rows.slice();
        state.VICKY_DEADLINE = VICKY_DEADLINE;

        // reset UI filters
        ['year','month','fiscal','program','province','age','status','q'].forEach(id => {
            const el = $$('#' + id); if (el) el.value = '';
        });
        document.querySelectorAll('.ws').forEach(c => c.checked = false);

        buildSelectOptions(state);
        applyFilters(state);
        renderAll(state, { renderVicky, VICKY_FROM, V_GOALS, V_TRACKS });
        } catch (err) {
        console.error('File read/parse failed:', err);
        }
    });

  // Ingest: sample
    $$("#loadSample")?.addEventListener("click", async () => {
    const txt = await loadSample();
    const parsed = await parseCSVText(txt);
    ingestToState(parsed);

    buildSelectOptions(state);
    applyFilters(state);
    renderAll(state, { renderVicky, VICKY_FROM, V_GOALS, V_TRACKS });
    });

  // Optional first render if you want a blank shell drawn
  renderAll(state, { renderVicky, VICKY_FROM, V_GOALS, V_TRACKS });
}
