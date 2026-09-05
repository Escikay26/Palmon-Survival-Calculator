const ACHIEVEMENT_STORAGE_KEY =
  "achievementPlanner";

const BOSS_PALMON_STORAGE_KEY =
  "bossPalmonPlanner";

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
    const data = JSON.parse(saved);

    return {
      element:
        data.element || "Water",

      levels:
        data.levels || {},

      unlocked:
        data.unlocked || {},

      ownedTokens:
        Number(data.ownedTokens) || 0,

      buildMode:
        data.buildMode || "unlimited",

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
      JSON.stringify(state)
    );
  }
  catch (error) {
    console.error(
      "Could not save achievement state.",
      error
    );
  }
}

export function loadBossPalmonState() {
  const saved =
    localStorage.getItem(
      BOSS_PALMON_STORAGE_KEY
    );

  if (!saved) {
    return {
      selectedBossId: "inkuisitor",
      bosses: {}
    };
  }

  try {
    const data = JSON.parse(saved);

    return {
      selectedBossId:
        data.selectedBossId ||
        "inkuisitor",

      bosses:
        data.bosses || {}
    };
  }
  catch (error) {
    console.error(
      "Could not load Boss Palmon save.",
      error
    );

    return {
      selectedBossId: "inkuisitor",
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
      JSON.stringify(state)
    );
  }
  catch (error) {
    console.error(
      "Could not save Boss Palmon state.",
      error
    );
  }
}
