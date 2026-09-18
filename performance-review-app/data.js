// ── SHARED CONSTANTS ──────────────────────────────────────────────────────────
// Token and board ID are loaded from config.js (excluded from git).
// See config.example.js for setup instructions.
const MONDAY_TOKEN = (typeof MONDAY_CONFIG !== "undefined") ? MONDAY_CONFIG.token   : "";
const BOARD_ID     = (typeof MONDAY_CONFIG !== "undefined") ? MONDAY_CONFIG.boardId : "18394437029";

// ── QUARTER → COLUMN ID MAP ───────────────────────────────────────────────────
// Each quarter maps to its own set of Monday column IDs.
const QUARTERS = {
  "3Q 2026": {
    bizOutcomes: "color_mm6w9kzf",
    skills:      "color_mm6w8eb",
    behaviors:   "color_mm6wdfc6",
    rating:      "color_mm6wh443",
    concern:     "color_mm7anpsq",
    note:        "long_text_mkwr2w6g",
    pip:         "boolean_mm799jx6"
  },
  "4Q 2026": {
    bizOutcomes: "color_mm7aw5tf",
    skills:      "color_mm7a51t3",
    behaviors:   "color_mm7apgtx",
    rating:      "color_mm7a8q3y",
    concern:     "color_mm7aya03",
    note:        "long_text_mm7a6nq",
    pip:         "boolean_mm7a1p3v"
  },
  "1Q 2027": {
    bizOutcomes: "color_mm7aj4ve",
    skills:      "color_mm7adbmp",
    behaviors:   "color_mm7ahsfb",
    rating:      "color_mm7asgeb",
    concern:     "color_mm7aam5t",
    note:        "long_text_mm7azdat",
    pip:         "boolean_mm7a2pbh"
  },
  "2Q 2027": {
    bizOutcomes: "color_mm7a7rrd",
    skills:      "color_mm7aac83",
    behaviors:   "color_mm7a67tf",
    rating:      "color_mm7aaccm",
    concern:     "color_mm7a2jqw",
    note:        "long_text_mm7av9q",
    pip:         "boolean_mm7at521"
  }
};

// ── CONFIG — stored in Monday board item "_CONFIG" ────────────────────────────
const CONFIG_ITEM_ID       = "13081116629";  // Monday item ID for _CONFIG row
const ACTIVE_QUARTER_COL   = "text_mm7aq2rf"; // text column holding the active quarter

// ── STATIC COLUMN IDs (never change quarter to quarter) ───────────────────────
const COL = {
  status:    "color_mm795nh2",
  talentId:  "text_mkkkv4c9",
  leader:    "leader_mkkkmn8x",
  manager:   "downline_manager_mkkk8yqm",
  band:      "text_mkzcwnr1",
  country:   "dropdown_mkzctsf9",
  isPplMgr:  "boolean_mkqssbyx",
  evalStatus:"dropdown_mkzcttrs"
};

// Active statuses to include (Separated = excluded)
const ACTIVE_STATUSES = ["Active", "Active_LOA"];

// ── ACTIVE QUARTER STATE ──────────────────────────────────────────────────────
// Resolved at runtime by fetchActiveQuarter(). Falls back to "3Q 2026".
let ACTIVE_QUARTER = "3Q 2026";
let QC             = QUARTERS[ACTIVE_QUARTER];

// Fetch the active quarter from the _CONFIG item on the Monday board.
// Must be awaited before any data load.
async function fetchActiveQuarter() {
  try {
    const data = await mondayQuery(`{
      items(ids: [${CONFIG_ITEM_ID}]) {
        column_values(ids: ["${ACTIVE_QUARTER_COL}"]) { text }
      }
    }`);
    const val = data.items?.[0]?.column_values?.[0]?.text?.trim();
    if (val && QUARTERS[val]) {
      ACTIVE_QUARTER = val;
      QC             = QUARTERS[val];
    }
  } catch(e) {
    console.warn("Could not fetch active quarter — using default:", ACTIVE_QUARTER);
  }
  return ACTIVE_QUARTER;
}

// Save a new active quarter to Monday (executive admin only).
async function setActiveQuarter(quarter) {
  if (!QUARTERS[quarter]) throw new Error("Unknown quarter: " + quarter);
  await mondayQuery(`mutation {
    change_simple_column_value(
      board_id: ${BOARD_ID},
      item_id:  ${CONFIG_ITEM_ID},
      column_id: "${ACTIVE_QUARTER_COL}",
      value: "${quarter}"
    ) { id }
  }`);
  ACTIVE_QUARTER = quarter;
  QC             = QUARTERS[quarter];
}

// ── TOKEN → MANAGER MAPPING ───────────────────────────────────────────────────
// Each manager gets a unique unguessable token.
// Distribute each manager's link individually — they can only see their own team.
// Executive tokens (Gembala, Carpenter, Silva) see rollup across sub-teams.
const MANAGER_TOKENS = {
  // ── Gembala org ──────────────────────────────────────────────────────────────
  "gMb9xK2mPqR7vL":  { name: "Gembala, Maureen",       role: "leader"    },
  "jOs4nT8wQf3hX":   { name: "Silva, Jose Maria",       role: "executive" },
  "sBy7nK3mZt9wQ":   { name: "Bagharian, Sonny",        role: "executive" },
  "iTo9yF5jNq6tK":   { name: "Ivory, Tom",              role: "leader"    },
  "gJn2pY6rCk9mW":   { name: "Gordon, Jason",           role: "leader"    },
  "iVc5tZ1sBj8nQ":   { name: "Iancu, Valentin",         role: "leader"    },
  "mKl3uA7dEo2xP":   { name: "Mikellides, Simon",       role: "leader"    },
  "rGn6vB4fHp1yT":   { name: "Regan, John",             role: "leader"    },
  "tVc8wD2gKm5rN":   { name: "True, Victoria",          role: "leader"    },
  "hJb2zA8kOr7uL":   { name: "Herbert, Julie",          role: "manager"   },
  "bSd4xC6lPs9vM":   { name: "Bird, Steven",            role: "manager"   },
  "fMn1yG7mQt2wN":   { name: "Farndale, Martin",        role: "manager"   },
  "fOt3zA5nRu8xP":   { name: "Fotinopoulos, Alexandra", role: "manager"   },
  "mLb6wC2oSv1yQ":   { name: "Milburn, Steven",         role: "manager"   },
  "mPc4xD8pTw3zR":   { name: "Mocanu, Petrica",         role: "manager"   },
  "sMe7yE1qUx4aS":   { name: "Scordos, Michelle",       role: "manager"   },
  "tRn9zF3rVy5bT":   { name: "Thompson, Ronald",        role: "manager"   },
  "vDo2aG6sWz7cU":   { name: "VanderReyden, Mike",      role: "manager"   },
  "yRp5bH8tXa1dV":   { name: "Young, Robert",           role: "leader"    },
  // ── Carpenter org ────────────────────────────────────────────────────────────
  "cJm8cI2uYb3eW":   { name: "Carpenter, James",        role: "leader"    },
  "mTy1dJ4vZc6fX":   { name: "Mattay, Mark",            role: "leader"    }
};

// ── ROLLUP RULES ─────────────────────────────────────────────────────────────
// For leaders/executives: which downline manager names roll up into their view
// in addition to their own direct reports.
const ROLLUP = {
  // Ivory sees Jose + everyone under Jose
  "Ivory, Tom": [
    "Silva, Jose Maria",
    "Gembala, Maureen",
    "Iancu, Valentin","Mocanu, Petrica",
    "Regan, John",
    "Gordon, Jason","Herbert, Julie",
    "Mikellides, Simon",
    "Carpenter, James","Mattay, Mark",
    "True, Victoria",
    "Bird, Steven","Farndale, Martin","Fotinopoulos, Alexandra",
    "Milburn, Steven","Scordos, Michelle","Thompson, Ronald",
    "VanderReyden, Mike","Young, Robert"
  ],
  // Silva sees everyone who reports to him
  "Silva, Jose Maria": [
    "Gembala, Maureen",
    "Iancu, Valentin","Mocanu, Petrica",
    "Regan, John",
    "Gordon, Jason","Herbert, Julie",
    "Mikellides, Simon",
    "Carpenter, James","Mattay, Mark",
    "True, Victoria",
    "Bird, Steven","Farndale, Martin","Fotinopoulos, Alexandra",
    "Milburn, Steven","Scordos, Michelle","Thompson, Ronald",
    "VanderReyden, Mike","Young, Robert"
  ],
  // Bagharian is executive — same full org view as Silva + Ivory
  "Bagharian, Sonny": [
    "Ivory, Tom",
    "Silva, Jose Maria",
    "Gembala, Maureen",
    "Iancu, Valentin","Mocanu, Petrica",
    "Regan, John",
    "Gordon, Jason","Herbert, Julie",
    "Mikellides, Simon",
    "Carpenter, James","Mattay, Mark",
    "True, Victoria",
    "Bird, Steven","Farndale, Martin","Fotinopoulos, Alexandra",
    "Milburn, Steven","Scordos, Michelle","Thompson, Ronald",
    "VanderReyden, Mike","Young, Robert"
  ],
  "Iancu, Valentin":   ["Mocanu, Petrica"],
  "True, Victoria":    [
    "Bird, Steven","Farndale, Martin","Fotinopoulos, Alexandra",
    "Milburn, Steven","Scordos, Michelle","Thompson, Ronald",
    "VanderReyden, Mike","Young, Robert"
  ],
  "Gordon, Jason":     ["Herbert, Julie"],
  "Carpenter, James":  ["Mattay, Mark"],
};

// ── MONDAY API HELPER ─────────────────────────────────────────────────────────
async function mondayQuery(query) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": MONDAY_TOKEN,
      "API-Version":   "2024-01"
    },
    body: JSON.stringify({ query })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// ── FETCH TEAM FOR A MANAGER ──────────────────────────────────────────────────
// Fetches all active employees where Downline Manager = managerName
// For executives/leaders also fetches rollup sub-teams.
// Uses cursor-based pagination to retrieve ALL items (Monday caps per-page at 500).
async function fetchTeamData(managerName) {
  const subMgrs = ROLLUP[managerName] || [];
  const allMgrs = [managerName, ...subMgrs];
  // Use the view-overridden quarter columns if set (exec/leader browsing history),
  // otherwise fall back to the global active quarter columns.
  const _qc = (typeof window !== "undefined" && window._viewQC) || QC;
  const allColIds = [
    ...Object.values(COL),
    ...Object.values(_qc)
  ].map(c => `"${c}"`).join(",");
  const colIds = allColIds;

  // Paginate through all items using cursor
  let allItems = [];
  let cursor   = null;

  do {
    const pageArg = cursor
      ? `limit: 500, cursor: "${cursor}"`
      : `limit: 500`;

    const query = `{
      boards(ids: [${BOARD_ID}]) {
        items_page(${pageArg}) {
          cursor
          items {
            id name
            column_values(ids: [${colIds}]) { id text }
          }
        }
      }
    }`;

    const data  = await mondayQuery(query);
    const page  = data.boards[0].items_page;
    allItems    = allItems.concat(page.items);
    cursor      = page.cursor || null;
  } while (cursor);

  // Parse into clean objects
  const employees = allItems.map(item => {
    const cv = {};
    item.column_values.forEach(c => { cv[c.id] = c.text || ""; });
    return {
      mondayId:    item.id,
      name:        item.name.replace(/\s*\(202[56]\)\s*$/i, "").trim(),
      talentId:    cv[COL.talentId],
      leader:      cv[COL.leader],
      manager:     cv[COL.manager],
      band:        cv[COL.band],
      country:     cv[COL.country],
      isPplMgr:    cv[COL.isPplMgr] === "true",
      pip:         cv[_qc.pip] === "true",
      evalStatus:  cv[COL.evalStatus],
      status:      cv[COL.status],
      bizOutcomes: cv[_qc.bizOutcomes],
      skills:      cv[_qc.skills],
      behaviors:   cv[_qc.behaviors],
      rating:      cv[_qc.rating],
      concern:     cv[_qc.concern] || "",
      note:        cv[_qc.note]
    };
  });

  // Filter: only active, only in this manager's scope
  const active = employees.filter(e =>
    ACTIVE_STATUSES.includes(e.status) &&
    allMgrs.some(m => m.toLowerCase() === e.manager.toLowerCase())
  );

  // Group by downline manager
  const teams = {};
  allMgrs.forEach(m => { teams[m] = []; });
  active.forEach(e => {
    const key = allMgrs.find(m => m.toLowerCase() === e.manager.toLowerCase());
    if (key) teams[key].push(e);
  });

  // Only include managers that have at least one active direct report
  const activeMgrs = allMgrs.filter(m => teams[m].length > 0);

  return { teams, allMgrs: activeMgrs, ownTeam: managerName };
}

// ── GLASS GAUGE HELPERS ───────────────────────────────────────────────────────
// Score 0–4 for a single employee based on their 4 rating fields.
//   4   = Top + all outcomes Met  → overflowing green
//   3   = Core + all outcomes Met → full blue
//   2   = good rating but 1+ Not Met, or partial → half amber
//   1.5 = Not Eligible or any On Hold → low grey
//   1   = Low or Performance Concern → low red
//   0   = nothing rated            → empty grey
function calcGlassScore(r) {
  if (!r) return 0;
  const { bizOutcomes, skills, behaviors, rating, concern } = r;
  if (!bizOutcomes && !skills && !behaviors && !rating && !concern) return 0;
  // Concern flag pulls glass down one notch from its primary rating
  const hasConcern = !!concern;
  if (hasConcern) {
    // Concern + Top → show as mixed (amber) since it's flagged
    if (rating === "Top")  return 2;
    // Concern + Core or no primary → show as concern (red-low)
    return 1;
  }
  if (rating === "Low") return 1;
  if (rating === "Not Eligible") return 1.5;
  const allMet = bizOutcomes === "Met" && skills === "Met" && behaviors === "Met";
  if (rating === "Top"  && allMet) return 4;
  if (rating === "Core" && allMet) return 3;
  return 2;
}

function glassProps(score) {
  if (score >= 4)   return { fill: "100%", color: "#16a34a", grad: "#4ade80,#16a34a", spill: true,  label: "Top ⭐"    };
  if (score >= 3)   return { fill: "78%",  color: "#1d4ed8", grad: "#60a5fa,#1d4ed8", spill: false, label: "Core ✓"   };
  if (score >= 2)   return { fill: "50%",  color: "#d97706", grad: "#fde68a,#d97706", spill: false, label: "Mixed ⚠"  };
  if (score >= 1.5) return { fill: "30%",  color: "#8d8d8d", grad: "#d1d5db,#9ca3af", spill: false, label: "On Hold"  };
  if (score >= 1)   return { fill: "22%",  color: "#dc2626", grad: "#fca5a5,#dc2626", spill: false, label: "Concern ⛔"};
  return             { fill: "3%",   color: "#9ca3af", grad: "#e5e7eb,#e5e7eb", spill: false, label: "Not rated" };
}

// Render a water-glass HTML element at given pixel dimensions
function renderGlass(score, w, h) {
  const p = glassProps(score);
  const spill = p.spill
    ? `<div style="width:${w+8}px;height:5px;background:#4ade80;border-radius:3px;margin:0 auto -1px;"></div>`
    : `<div style="width:${w+8}px;height:5px;"></div>`;
  return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:0;">
    ${spill}
    <div style="width:${w}px;height:${h}px;border:2px solid #d1d5db;border-radius:3px 3px 6px 6px;background:#f9fafb;overflow:hidden;position:relative;">
      <div style="position:absolute;bottom:0;left:0;right:0;height:${p.fill};background:linear-gradient(180deg,${p.grad});border-radius:0 0 4px 4px;"></div>
    </div>
    <div style="font-size:9px;font-weight:700;color:${p.color};margin-top:3px;text-align:center;white-space:nowrap;">${p.label}</div>
  </div>`;
}

// Average glass score for an array of employees.
// Reads from live ratingsMap if provided, otherwise falls back to board values.
function teamGlassScore(emps, ratingsMap) {
  if (!emps || emps.length === 0) return 0;
  const total = emps.reduce((sum, e) => {
    const r = (ratingsMap && ratingsMap[e.mondayId]) || e;
    return sum + calcGlassScore(r);
  }, 0);
  return total / emps.length;
}

// ── SAVE RATINGS TO MONDAY ────────────────────────────────────────────────────
async function saveRatings(ratings) {
  // ratings = { [mondayId]: { bizOutcomes, skills, behaviors, rating, concern, pip, note } }
  const entries = Object.entries(ratings).filter(([, r]) =>
    r.bizOutcomes || r.skills || r.behaviors || r.rating || r.note || r.pip != null
  );

  let saved = 0, failed = 0;
  for (const [itemId, r] of entries) {
    const cols = {};
    if (r.bizOutcomes)      cols[QC.bizOutcomes] = { label: r.bizOutcomes };
    if (r.skills)           cols[QC.skills]      = { label: r.skills };
    if (r.behaviors)        cols[QC.behaviors]   = { label: r.behaviors };
    if (r.rating)           cols[QC.rating]      = { label: r.rating };
    if (r.concern)          cols[QC.concern]     = { label: r.concern };
    if (r.note)             cols[QC.note]        = { text: r.note };
    if (r.pip != null)      cols[QC.pip]         = { checked: r.pip ? "true" : "false" };

    const mutation = `mutation {
      change_multiple_column_values(
        board_id: ${BOARD_ID},
        item_id: ${itemId},
        column_values: ${JSON.stringify(JSON.stringify(cols))}
      ) { id }
    }`;
    try {
      const d = await mondayQuery(mutation);
      if (d.change_multiple_column_values?.id) saved++;
      else failed++;
    } catch(e) {
      console.error(itemId, e);
      failed++;
    }
  }
  return { saved, failed };
}

// ── TOKEN VALIDATION ──────────────────────────────────────────────────────────
function getManagerFromToken() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get("token");
  if (!token) return null;
  return MANAGER_TOKENS[token] || null;
}
