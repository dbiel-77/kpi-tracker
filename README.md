# Volunteer KPI Tracker

This project provides a simple way to **clean**, **analyze**, and **visualize** volunteer data.  
It was built to track onboarding, engagement, and program distribution for volunteer cohorts.

The tool runs entirely in the browser and is published here:  
[dbiel-77.github.io/kpi-tracker](https://dbiel-77.github.io/kpi-tracker/)

---

## Purpose

- Standardize messy volunteer input data into a consistent format.  
- Provide quick **KPIs** (total volunteers, new this month, onboarding rate, hours logged).  
- Generate **charts** by province, program, monthly entries, and status.  
- Offer a **sortable table** view of all records.  
- (Calendar heatmap was originally included but has been removed for simplicity.)

---

## Getting Started

1. **Prepare your data**  
   - Start with "Daniel’s volunteer list” export (CSV).  
   - Rename this file to `volunteers.csv` and place it in the project folder.
     > Because the naming convention of this csv is so random, I don't have a fix other than to rename it for now. In the future I'll allow dirty imports to be cleaned on-site
   - If you don’t have current data, ask Daniel for the latest version or try out the demo with "load sample".

2. **Run the cleaner**  
   - Place `clean.py` in the same folder.  
   - Run:
     ```bash
     python clean.py
     ```
   - This outputs a cleaned and verified dataset ready for the tracker - rows without at least one of `first, last, email` will be tossed.

3. **View the tracker**  
   - Open [dbiel-77.github.io/kpi-tracker](https://dbiel-77.github.io/kpi-tracker/) in your browser.  
   - Upload or load the cleaned dataset to explore KPIs, charts, and tables.

---

## Access

- The live version is deployed automatically to GitHub Pages:  
  [https://dbiel-77.github.io/kpi-tracker/](https://dbiel-77.github.io/kpi-tracker/)  

No installation needed beyond cleaning your dataset.
