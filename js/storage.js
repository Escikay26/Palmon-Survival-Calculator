// =============================
// STORAGE KEYS
// =============================

const ACHIEVEMENT_STORAGE_KEY =
  "achievementPlanner";

const EQUIPMENT_STORAGE_KEY =
  "equipmentPlanner";

const BOSS_PALMON_STORAGE_KEY =
  "bossPalmonPlanner";

const RESEARCH_STORAGE_KEY =
  "researchPlanner";


const PLANNER_STORAGE_KEYS = [
  ACHIEVEMENT_STORAGE_KEY,
  EQUIPMENT_STORAGE_KEY,
  BOSS_PALMON_STORAGE_KEY,
  RESEARCH_STORAGE_KEY
];


// =============================
// RESET / CLEAR STORAGE
// =============================

export function clearAchievementState() {
  localStorage.removeItem(
    ACHIEVEMENT_STORAGE_KEY
  );
}


export function clearEquipmentState() {
  localStorage.removeItem(
    EQUIPMENT_STORAGE_KEY
  );
}


export function clearBossPalmonState() {
  localStorage.removeItem(
    BOSS_PALMON_STORAGE_KEY
  );
}


export function clearResearchState() {
  localStorage.removeItem(
    RESEARCH_STORAGE_KEY
  );
}


export function clearAllPlannerState() {
  PLANNER_STORAGE_KEYS.forEach(
    key => {
      localStorage.removeItem(key);
    }
  );
}

// =============================
// ACHIEVEMENTS
// =============================

export function loadAchievementState() {

  const saved =
    localStorage.getItem(
      ACHIEVEMENT_STORAGE_KEY
    );


  if (!saved) {

    return {
      element: "Water",
      levels: {},
      unlocked: {},
      ownedTokens: 0,
      buildMode: "unlimited",
      budgetBaseCost: 0
    };

  }


  try {

    const data =
      JSON.parse(saved);


    return {

      element:
        data.element ||
        "Water",

      levels:
        data.levels ||
        {},

      unlocked:
        data.unlocked ||
        {},

      ownedTokens:
        Number(
          data.ownedTokens
        ) || 0,

      buildMode:
        data.buildMode ||
        "unlimited",

      budgetBaseCost:
        Number(
          data.budgetBaseCost
        ) || 0

    };

  }

  catch (error) {

    console.error(
      "Could not load achievement save.",
      error
    );


    return {
      element: "Water",
      levels: {},
      unlocked: {},
      ownedTokens: 0,
      buildMode: "unlimited",
      budgetBaseCost: 0
    };

  }

}


export function saveAchievementState(
  state
) {

  try {

    localStorage.setItem(
      ACHIEVEMENT_STORAGE_KEY,
      JSON.stringify(
        state
      )
    );

  }

  catch (error) {

    console.error(
      "Could not save achievement state.",
      error
    );

  }

}



// =============================
// EQUIPMENT
// =============================

export function loadEquipmentState() {

  const defaultState = {
    items: [],
    buildMode: "unlimited",
    temperitCounts: {
      large: 0,
      medium: 0,
      small: 0
    },
    legacyEnhancementXp: 0,
    ownedOpusPearls: 0,
    budgetBaseCost: {
      enhancementXp: 0,
      opusPearls: 0
    },
    budgetBaseItems: {},
    nextInstanceId: 1
  };


  const saved =
    localStorage.getItem(
      EQUIPMENT_STORAGE_KEY
    );


  if (!saved) {
    return defaultState;
  }


  try {

    const data =
      JSON.parse(saved);


    const hasTemperitCounts =
      data.temperitCounts &&
      typeof data.temperitCounts ===
        "object";


    return {

      items:
        Array.isArray(
          data.items
        )
          ? data.items
          : [],

      buildMode:
        data.buildMode ===
          "budget"
          ? "budget"
          : "unlimited",

      temperitCounts: {
        large:
          Math.max(
            0,
            Math.floor(
              Number(
                data.temperitCounts
                  ?.large
              ) || 0
            )
          ),

        medium:
          Math.max(
            0,
            Math.floor(
              Number(
                data.temperitCounts
                  ?.medium
              ) || 0
            )
          ),

        small:
          Math.max(
            0,
            Math.floor(
              Number(
                data.temperitCounts
                  ?.small
              ) || 0
            )
          )
      },

      // Migration helper for the very first
      // Equipment-planner version, which
      // stored raw Enhancement XP instead
      // of Temperit counts.
      legacyEnhancementXp:
        hasTemperitCounts
          ? 0
          : Math.max(
              0,
              Math.floor(
                Number(
                  data.ownedEnhancementXp
                ) || 0
              )
            ),

      ownedOpusPearls:
        Math.max(
          0,
          Math.floor(
            Number(
              data.ownedOpusPearls
            ) || 0
          )
        ),

      budgetBaseCost: {
        enhancementXp:
          Math.max(
            0,
            Number(
              data.budgetBaseCost
                ?.enhancementXp
            ) || 0
          ),

        opusPearls:
          Math.max(
            0,
            Number(
              data.budgetBaseCost
                ?.opusPearls
            ) || 0
          )
      },

      budgetBaseItems:
        data.budgetBaseItems &&
        typeof data.budgetBaseItems ===
          "object"
          ? data.budgetBaseItems
          : {},

      nextInstanceId:
        Math.max(
          1,
          Number(
            data.nextInstanceId
          ) || 1
        )

    };

  }

  catch (error) {

    console.error(
      "Could not load Equipment save.",
      error
    );


    return defaultState;

  }

}


export function saveEquipmentState(
  state
) {

  try {

    localStorage.setItem(
      EQUIPMENT_STORAGE_KEY,
      JSON.stringify(
        state
      )
    );

  }

  catch (error) {

    console.error(
      "Could not save Equipment state.",
      error
    );

  }

}


// =============================
// BOSS PALMON
// =============================

export function loadBossPalmonState() {

  const saved =
    localStorage.getItem(
      BOSS_PALMON_STORAGE_KEY
    );


  if (!saved) {

    return {
      selectedBossId:
        "inkuisitor",

      bosses: {}
    };

  }


  try {

    const data =
      JSON.parse(saved);


    return {

      selectedBossId:
        data.selectedBossId ||
        "inkuisitor",

      bosses:
        data.bosses ||
        {}

    };

  }

  catch (error) {

    console.error(
      "Could not load Boss Palmon save.",
      error
    );


    return {
      selectedBossId:
        "inkuisitor",

      bosses: {}
    };

  }

}


export function saveBossPalmonState(
  state
) {

  try {

    localStorage.setItem(
      BOSS_PALMON_STORAGE_KEY,
      JSON.stringify(
        state
      )
    );

  }

  catch (error) {

    console.error(
      "Could not save Boss Palmon state.",
      error
    );

  }

}


// =============================
// RESEARCH
// =============================

export function loadResearchState() {

  const saved =
    localStorage.getItem(
      RESEARCH_STORAGE_KEY
    );


  if (!saved) {

    return {
      selectedTreeKey: null,
      levels: {}
    };

  }


  try {

    const data =
      JSON.parse(saved);


    return {

      selectedTreeKey:
        data.selectedTreeKey ||
        null,

      levels:
        data.levels ||
        {}

    };

  }

  catch (error) {

    console.error(
      "Could not load Research save.",
      error
    );


    return {
      selectedTreeKey: null,
      levels: {}
    };

  }

}


export function saveResearchState(
  state
) {

  try {

    localStorage.setItem(
      RESEARCH_STORAGE_KEY,
      JSON.stringify(
        state
      )
    );

  }

  catch (error) {

    console.error(
      "Could not save Research state.",
      error
    );

  }

}
