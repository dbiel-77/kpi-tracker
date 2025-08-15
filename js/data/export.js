export function currentExportRows() {
    return filtered.map(r => ({ First: r.First, Last: r.Last, Email: r.Email })).filter(x => x.Email);
  }
  function toCsv(rows) {
    const header = Object.keys(rows[0] || { First: "", Last: "", Email: "" });
    const lines = [header.join(",")].concat(rows.map(r => header.map(k => csvEsc(r[k])).join(",")));
    return lines.join("\n");
  }

  $$("#downloadCsv").addEventListener("click", () => {
    const out = currentExportRows();
    if (!out.length) return;
    download("volunteer_export.csv", toCsv(out));
  });
  $$("#downloadCsv2").addEventListener("click", () => {
    const out = currentExportRows();
    if (!out.length) return;
    download("volunteer_export.csv", toCsv(out));
  });
  $$("#copyList").addEventListener("click", () => {
    const out = currentExportRows();
    if (!out.length) return;
    copyToClipboard(out.map(r => r.First + " " + r.Last + " <" + r.Email + ">").join("\n"));
  });
  $$("#copyList2").addEventListener("click", () => {
    const out = currentExportRows();
    if (!out.length) return;
    copyToClipboard(out.map(r => r.First + " " + r.Last + " <" + r.Email + ">").join("\n"));
  });