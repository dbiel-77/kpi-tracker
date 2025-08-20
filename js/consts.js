// Data slice start for Vicky (unchanged)
export const VICKY_FROM = new Date(2023, 9, 1); // Oct 1, 2023

// KPI deadline (explicit)
export const VICKY_DEADLINE = new Date(2027, 3, 30); // Apr 30, 2027

// The six NYSN tracks
export const V_TRACKS = ["Data","Digital","Communication","Research","Compliance","Outreach"];

// Tiered goals + hours policy
export const V_GOALS = {
  // volunteers (aggregate)
  volSoft: 1600,  // Tier 1
  volHard: 2000,  // Tier 2
  hoursPerVol: 120,
  hoursSoft: 1600 * 120, // 192,000
  hoursHard: 2000 * 120, // 240,000

  // explicit per-track allocations that sum exactly to 1600 / 2000
  perTrack: {
    // SOFT total = 275+250+250+275+250+300 = 1600
    // HARD total = 325+325+325+325+350+350 = 2000
    Data:          { soft: 275, hard: 325 },
    Digital:       { soft: 250, hard: 325 },
    Communication: { soft: 250, hard: 325 },
    Research:      { soft: 275, hard: 325 },
    Compliance:    { soft: 250, hard: 350 },
    Outreach:      { soft: 300, hard: 350 },
  }
};
