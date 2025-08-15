// js/data/ingest.js
import { state } from '../state.js';
import { cleanRows } from './clean.js';

// Decode CSVs saved as UTF-8 or UTF-16 (Excel “Unicode Text”)
export function decodeArrayBuffer(buf) {
  const u8 = new Uint8Array(buf);
  if (u8.length >= 2) {
    const bom = (u8[0] << 8) | u8[1];
    if (bom === 0xFEFF) return new TextDecoder('utf-16be').decode(u8);
    if (bom === 0xFFFE) return new TextDecoder('utf-16le').decode(u8);
  }
  const sample = u8.subarray(0, Math.min(1024, u8.length));
  const nulFrac = sample.reduce((a, b) => a + (b === 0), 0) / Math.max(1, sample.length);
  if (nulFrac > 0.1) {
    try { return new TextDecoder('utf-16le').decode(u8); } catch {}
    try { return new TextDecoder('utf-16be').decode(u8); } catch {}
  }
  return new TextDecoder('utf-8').decode(u8);
}

export async function readFileAsText(file) {
  const buf = await file.arrayBuffer();
  return decodeArrayBuffer(buf);
}

/** Uniform CSV parsing. Resolves to raw row objects array (un-cleaned). */
export function parseCSVText(txt) {
  return new Promise((resolve, reject) => {
    Papa.parse(txt, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => String(h ?? '')
        .normalize('NFKC')
        .replace(/^\uFEFF/, '')
        .replace(/\s+/g, ' ')
        .trim(),
      complete: res => resolve(res.data || []),
      error: err => reject(err),
    });
  });
}

/** Apply raw rows into state (clean -> set -> return snapshot). No UI here. */
export function ingestToState(rawRows) {
  state.rawRows = rawRows || [];
  state.rows = cleanRows(state.rawRows);
  state.filtered = state.rows.slice();
  return {
    rawRows: state.rawRows,
    rows: state.rows,
    filtered: state.filtered,
  };
}
