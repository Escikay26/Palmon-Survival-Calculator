const ACHIEVEMENT_STORAGE_KEY =
  "achievementPlanner";

const BOSS_PALMON_STORAGE_KEY =
  "bossPalmonPlanner";

const RESEARCH_STORAGE_KEY =
  "researchPlanner";


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
