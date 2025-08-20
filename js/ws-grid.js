// Persist selected tracks in window.state (optional)
function getSelectedTracks() {
  return [...document.querySelectorAll('.ws-grid .ws:checked')].map(x => x.value);
}

document.getElementById('apply')?.addEventListener('click', () => {
  window.state = window.state || {};
  window.state.selectedTracks = getSelectedTracks();
  if (typeof applyFilters === 'function') applyFilters();
});

document.getElementById('reset')?.addEventListener('click', () => {
  document.querySelectorAll('.ws-grid .ws:checked').forEach(cb => cb.checked = false);
  window.state && (window.state.selectedTracks = []);
  if (typeof applyFilters === 'function') applyFilters();
});
