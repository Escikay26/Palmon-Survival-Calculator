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

const TEAM_STORAGE_KEY =
  "teamPlanner";


const PLANNER_STORAGE_KEYS = [
  ACHIEVEMENT_STORAGE_KEY,
  EQUIPMENT_STORAGE_KEY,
  BOSS_PALMON_STORAGE_KEY,
  RESEARCH_STORAGE_KEY,
  TEAM_STORAGE_KEY
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


export function clearTeamState() {
  localStorage.removeItem(
    TEAM_STORAGE_KEY
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

  const defaultState = {
    element: "Water",
    levels: {},
    unlocked: {},
    ownedTokens: 0,
    buildMode: "unlimited",
    budgetBaseCost: 0,
    budgetBaseLevels: {},
    budgetBaseUnlocked: {}
  };


  const saved =
    localStorage.getItem(
      ACHIEVEMENT_STORAGE_KEY
    );


  if (!saved) {
    return defaultState;
  }


  try {

    const data =
      JSON.parse(saved);


    return {

      element:
        data.element ||
        "Water",

      levels:
        data.levels &&
        typeof data.levels ===
          "object"
          ? data.levels
          : {},

      unlocked:
        data.unlocked &&
        typeof data.unlocked ===
          "object"
          ? data.unlocked
          : {},

      ownedTokens:
        Math.max(
          0,
          Number(
            data.ownedTokens
          ) || 0
        ),

      buildMode:
        data.buildMode ===
          "budget"
          ? "budget"
          : "unlimited",

      budgetBaseCost:
        Math.max(
          0,
          Number(
            data.budgetBaseCost
          ) || 0
        ),

      budgetBaseLevels:
        data.budgetBaseLevels &&
        typeof data.budgetBaseLevels ===
          "object"
          ? data.budgetBaseLevels
          : {},

      budgetBaseUnlocked:
        data.budgetBaseUnlocked &&
        typeof data.budgetBaseUnlocked ===
          "object"
          ? data.budgetBaseUnlocked
          : {}

    };

  }

  catch (error) {

    console.error(
      "Could not load achievement save.",
      error
    );


    return defaultState;

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
// TEAM OVERVIEW
// =============================

function createDefaultTeams() {
  return [
    {
      id: "team-1",
      name: "Team 1",
      palmons: []
    },
    {
      id: "team-2",
      name: "Team 2",
      palmons: []
    },
    {
      id: "team-3",
      name: "Team 3",
      palmons: []
    },
    {
      id: "team-4",
      name: "Team 4",
      palmons: []
    }
  ];
}


function normalizeTeamPalmon(
  item
) {
  if (
    !item ||
    typeof item !==
      "object"
  ) {
    return null;
  }

  const instanceId =
    String(
      item.instanceId ||
      ""
    );

  const palmonId =
    String(
      item.palmonId ||
      ""
    );

  if (
    !instanceId ||
    !palmonId
  ) {
    return null;
  }

  const stars =
    Math.min(
      5,
      Math.max(
        0,
        Math.floor(
          Number(
            item.stars
          ) || 0
        )
      )
    );

  return {
    instanceId,
    palmonId,

    level:
      Math.min(
        350,
        Math.max(
          1,
          Math.floor(
            Number(
              item.level
            ) || 1
          )
        )
      ),

    stars,

    subLevel:
      stars >= 5
        ? 0
        : Math.min(
            4,
            Math.max(
              0,
              Math.floor(
                Number(
                  item.subLevel
                ) || 0
              )
            )
          ),

    evolution: {
      stage:
        Math.min(
          8,
          Math.max(
            0,
            Math.floor(
              Number(
                item.evolution
                  ?.stage
              ) || 0
            )
          )
        ),

      talentIndex:
        Math.max(
          0,
          Math.floor(
            Number(
              item.evolution
                ?.talentIndex
            ) || 0
          )
        ),

      talentLevel:
        Math.min(
          10,
          Math.max(
            0,
            Math.floor(
              Number(
                item.evolution
                  ?.talentLevel
            ) || 0
          )
        ),

      megaEvolved:
        Boolean(
          item.evolution
            ?.megaEvolved
        )
    },

    traitIds:
      Array.isArray(
        item.traitIds
      )
        ? item.traitIds
            .map(String)
            .slice(0, 4)
        : [],

    equipment: {
      weapon:
        item.equipment
          ?.weapon ||
        null,

      shield:
        item.equipment
          ?.shield ||
        null,

      accessory:
        item.equipment
          ?.accessory ||
        null,

      headgear:
        item.equipment
          ?.headgear ||
        null
    }
  };
}


export function loadTeamState() {
  const defaultState = {
    activeTeamId:
      "team-1",

    teams:
      createDefaultTeams(),

    nextPalmonInstanceId: 1
  };

  const saved =
    localStorage.getItem(
      TEAM_STORAGE_KEY
    );

  if (!saved) {
    return defaultState;
  }

  try {
    const data =
      JSON.parse(saved);

    const savedTeams =
      Array.isArray(
        data.teams
      )
        ? data.teams
        : [];

    const defaultTeams =
      createDefaultTeams();

    const teams =
      defaultTeams.map(
        defaultTeam => {
          const savedTeam =
            savedTeams.find(
              team =>
                team?.id ===
                defaultTeam.id
            );

          return {
            id:
              defaultTeam.id,

            name:
              String(
                savedTeam?.name ||
                defaultTeam.name
              ),

            palmons:
              Array.isArray(
                savedTeam?.palmons
              )
                ? savedTeam.palmons
                    .map(
                      normalizeTeamPalmon
                    )
                    .filter(Boolean)
                    .slice(0, 7)
                : []
          };
        }
      );

    const validTeamIds =
      new Set(
        teams.map(
          team =>
            team.id
        )
      );

    return {
      activeTeamId:
        validTeamIds.has(
          data.activeTeamId
        )
          ? data.activeTeamId
          : "team-1",

      teams,

      nextPalmonInstanceId:
        Math.max(
          1,
          Math.floor(
            Number(
              data.nextPalmonInstanceId
            ) || 1
          )
        )
    };
  }
  catch (error) {
    console.error(
      "Could not load Team save.",
      error
    );

    return defaultState;
  }
}


export function saveTeamState(
  state
) {
  try {
    localStorage.setItem(
      TEAM_STORAGE_KEY,
      JSON.stringify(
        state
      )
    );
  }
  catch (error) {
    console.error(
      "Could not save Team state.",
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
