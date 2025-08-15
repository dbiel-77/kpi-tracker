// js/ui/charts.js
import { $$ } from '../utils.js';

export function chart(state, id, cfg){
  if (state.charts[id]) { state.charts[id].destroy(); delete state.charts[id]; }
  const canvas = $$("#" + id);
  if (!canvas) return;
  state.charts[id] = new Chart(canvas.getContext("2d"), cfg);
}
