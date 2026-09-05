const STORAGE_KEY =
  "achievementPlanner";


export function loadAchievementState() {

  const saved =
    localStorage.getItem(
      STORAGE_KEY
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
      STORAGE_KEY,
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
