export function loadScriptSequence(seq, done){
  const next = (i) => {
    if (i >= seq.length) { done && done(); return; }
    const opt = seq[i];
    const s = document.createElement("script");
    s.src = opt.src;
    s.async = false;
    s.onload = () => next(i + 1);
    s.onerror = () => {
      if (opt.fallback) {
        const f = document.createElement("script");
        f.src = opt.fallback;
        f.async = false;
        f.onload = () => next(i + 1);
        f.onerror = () => { console.error("Failed to load", opt); next(i + 1); };
        document.head.appendChild(f);
      } else {
        next(i + 1);
      }
    };
    document.head.appendChild(s);
  };
  next(0);
}

export const scriptChain = [
  { src: './libs/papaparse.min.js', fallback: 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js' },
  { src: './libs/chart.4.4.1.min.js', fallback: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js' }
];