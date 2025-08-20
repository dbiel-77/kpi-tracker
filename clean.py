#!/usr/bin/env python3
import pandas as pd, re
from datetime import datetime

IN_PATH  = "volunteers.csv"                 # change if needed
OUT_PATH = "cleaned_for_dashboard.csv"

def as_bool(v):
    if pd.isna(v): return False
    t = str(v).strip().lower()
    return t in {"true","yes","y","1","x","✓","check","checked"}

def yes_no(v): return "Yes" if as_bool(v) else "No"

def parse_date(raw):
    if pd.isna(raw): return pd.NaT
    t = str(raw).strip()
    if not t: return pd.NaT
    if re.fullmatch(r"\d{4,6}", t):
        n = int(t)
        if 20000 < n < 60000:
            return pd.to_datetime("1899-12-30") + pd.to_timedelta(n, unit="D")
    m = re.fullmatch(r"(\d{4})[-/](\d{1,2})", t)
    if m:
        y, mo = int(m.group(1)), int(m.group(2))
        try: return pd.Timestamp(year=y, month=mo, day=1)
        except: return pd.NaT
    if re.fullmatch(r"\d{4}\.\d{1,2}\.\d{1,2}", t): t = t.replace(".", "-")
    try: return pd.to_datetime(t, errors="raise")
    except: pass
    m = re.fullmatch(r"(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})", t)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        y = int(m.group(3)); y = 2000 + y if y < 100 else y
        M, D = (a, b) if a <= 12 else (b, a)
        try: return pd.Timestamp(year=y, month=M, day=D)
        except: return pd.NaT
    return pd.NaT

def title_case(s):
    if pd.isna(s): return ""
    s = str(s).strip()
    return re.sub(r"\b(\w)", lambda m: m.group(1).upper(), s.lower())

df = pd.read_csv(IN_PATH)

mask_identity = df["First"].astype(str).str.strip().ne("") | \
                df["Last"].astype(str).str.strip().ne("")  | \
                df.get("Personal Email Address","").astype(str).str.strip().ne("")
mask_junk = ~(df["First"].astype(str) + " " + df["Last"].astype(str)).str.contains(
    r"(insert row below|this row used for|formulas)", flags=re.I, na=False)
df = df[mask_identity & mask_junk].copy()

out = pd.DataFrame({
    "First": df.get("First","").map(title_case),
    "Last": df.get("Last","").map(title_case),
    "Personal Email Address": df.get("Personal Email Address","").fillna("").astype(str).str.strip(),
    "Program": df.get("Program","").fillna("").astype(str).str.strip().replace("", "UNKNOWN"),
    "Province": df.get("Province","").fillna("").astype(str).str.strip().str.upper().replace("", "OTHER"),
    "Current status": df.get("Current status (student or working, international or Canadian)","").fillna("").astype(str).str.strip(),
    "Age group": df.get("Age group","").fillna("").astype(str).str.strip(),
    "Date of Entry": df.get("Date of Entry").map(parse_date),
    "Onboarding email sent?": df.get("Onboarding email sent?").map(yes_no),
    "Total Hours": pd.to_numeric(df.get("Total Hours"), errors="coerce").fillna(0).round(2),
    "Data": df.get("Data").map(lambda v: "TRUE" if as_bool(v) else "FALSE"),
    "Digital": df.get("Digital").map(lambda v: "TRUE" if as_bool(v) else "FALSE"),
    "Communication": df.get("Communication").map(lambda v: "TRUE" if as_bool(v) else "FALSE"),
    "Research": df.get("Research").map(lambda v: "TRUE" if as_bool(v) else "FALSE"),
    "Compliance": df.get("Compliance").map(lambda v: "TRUE" if as_bool(v) else "FALSE"),
    "Outreach": df.get("Outreach").map(lambda v: "TRUE" if as_bool(v) else "FALSE"),
})

out["Program"] = out["Program"].replace("", "UNKNOWN")
out["Date of Entry"] = out["Date of Entry"].dt.strftime("%Y-%m-%d")

cols = ["First","Last","Personal Email Address","Program","Province","Current status","Age group","Date of Entry","Onboarding email sent?","Total Hours","Data","Digital","Communication","Research","Compliance","Outreach"]
out = out[cols]
out = out[(out["First"]!="") | (out["Last"]!="") | (out["Personal Email Address"]!="")]
out = out[~out["Program"].str.contains(r"\b(CSJ|Microgrants)\b", case=False, na=False)]


out.to_csv(OUT_PATH, index=False)
print(f"Wrote {len(out)} rows to {OUT_PATH}")
