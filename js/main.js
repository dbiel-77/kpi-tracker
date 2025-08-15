import { loadScriptSequence, scriptChain } from './loader.js';
import { initApp } from './init.js';
loadScriptSequence(scriptChain, () => {
  if (typeof Papa === 'undefined' || typeof Chart === 'undefined') { console.error('Libraries failed to load.'); return; }
  initApp();
});
