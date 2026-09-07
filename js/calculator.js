import {
  calculateAchievementStats
} from "./achievements.js";


import {
  getBossPalmonBonuses
} from "./boss-palmon.js";


import {
  getResearchBonuses
} from "./research.js";


// =============================
// PALMON RELEVANT STATS
// =============================

const PALMON_STATS =
  new Set([

    "attack",
    "defense",
    "hp",

    "critChance",
    "critRate",
    "critDamage",
    "critDamageReduction",

    "accuracy",
    "tenacity",

    "rage",

    "rageSkillDamageBonus",
    "rageSkillDamageTakenReduction",

    "finalDamage",
    "finalDamageTaken",
    "finalDamageTakenReduction",

    "allPalmonArmigoCapacity",

    "armigoAttack",
    "armigoDefense",
    "armigoHP",

    "morale",
    "armigoMorale",

    "opponentDeathRate",

    "counterFire",
    "counterWater",
    "counterElectric",
    "counterEarth"

  ]);


// =============================
// BONUS RESULT
// =============================

function createBonusResult() {

  return {
    flat: {},
    percent: {},

    sources: {
      achievements: [],
      bossPalmon: [],
      research: [],
      sameElement: [],
      elementCounter: []
    },

    meta: {
      sameElementCount: 0,
      sameElementBonus: 0,
      elementCounterActive: false
    }
  };

}


// =============================
// ADD BONUS
// =============================

function addBonus(
  result,
  stat,
  value,
  unit,
  sourceType,
  source = null
) {

  if (
    !stat ||
    !PALMON_STATS.has(
      stat
    )
  ) {

    return;

  }


  const numericValue =
    Number(value);


  if (
    !Number.isFinite(
      numericValue
    ) ||
    numericValue === 0
  ) {

    return;

  }


  const bucket =
    unit === "flat"
      ? result.flat
      : result.percent;


  bucket[stat] =
    (
      bucket[stat] || 0
    ) +
    numericValue;


  if (
    result.sources[
      sourceType
    ]
  ) {

    result.sources[
      sourceType
    ].push({

      stat,
      value:
        numericValue,

      unit:
        unit === "flat"
          ? "flat"
          : "percent",

      source

    });

  }

}


// =============================
// ADD STAT OBJECT
// =============================

function addStructuredStats(
  result,
  stats,
  sourceType,
  sourceLabel
) {

  Object.entries(
    stats || {}
  ).forEach(
    ([stat, values]) => {

      if (
        !values ||
        typeof values !==
          "object"
      ) {

        return;

      }


      addBonus(
        result,
        stat,
        values.flat,
        "flat",
        sourceType,
        sourceLabel
      );


      addBonus(
        result,
        stat,
        values.percent,
        "percent",
        sourceType,
        sourceLabel
      );

    }
  );

}


// =============================
// ACHIEVEMENTS
// =============================

function addAchievementBonuses(
  result,
  element
) {

  const achievementStats =
    calculateAchievementStats();


  addStructuredStats(
    result,
    achievementStats.general,
    "achievements",
    "General Achievements"
  );


  if (
    element &&
    achievementStats
      .elements?.[
        element
      ]
  ) {

    addStructuredStats(
      result,
      achievementStats
        .elements[
          element
        ],
      "achievements",
      `${element} Achievements`
    );

  }

}


// =============================
// BOSS PALMON
// =============================

function addBossPalmonBonuses(
  result,
  element
) {

  const bossBonuses =
    getBossPalmonBonuses();


  addStructuredStats(
    result,
    bossBonuses.general,
    "bossPalmon",
    "Boss Palmon · General"
  );


  if (
    element &&
    bossBonuses
      .elements?.[
        element
      ]
  ) {

    addStructuredStats(
      result,
      bossBonuses
        .elements[
          element
        ],
      "bossPalmon",
      `Boss Palmon · ${element}`
    );

  }

}


// =============================
// RESEARCH
// =============================

function addResearchBonuses(
  result,
  {
    squadNumber,
    element,
    conditions
  }
) {

  const researchBonuses =
    getResearchBonuses({

      squadNumber,

      element,

      conditions

    });


  (
    researchBonuses.effects ||
    []
  ).forEach(
    effect => {

      addBonus(
        result,
        effect.stat,
        effect.value,
        effect.unit,
        "research",
        effect.source
      );

    }
  );

}


// =============================
// SAME ELEMENT BONUS
// =============================

export function
getSameElementBonus(
  element,
  squadElements = []
) {

  if (!element) {

    return {
      count: 0,
      percent: 0
    };

  }


  const count =
    squadElements.filter(
      squadElement =>
        squadElement ===
        element
    ).length;


  let percent = 0;


  if (
    count >= 7
  ) {

    percent = 30;

  }

  else if (
    count === 6
  ) {

    percent = 25;

  }

  else if (
    count === 5
  ) {

    percent = 20;

  }

  else if (
    count === 4
  ) {

    percent = 10;

  }

  else if (
    count === 3
  ) {

    percent = 5;

  }


  return {
    count,
    percent
  };

}


// =============================
// ADD SAME ELEMENT BONUS
// =============================

function addSameElementBonus(
  result,
  element,
  squadElements
) {

  const sameElement =
    getSameElementBonus(
      element,
      squadElements
    );


  result.meta.sameElementCount =
    sameElement.count;


  result.meta.sameElementBonus =
    sameElement.percent;


  if (
    sameElement.percent <= 0
  ) {

    return;

  }


  [
    "attack",
    "defense",
    "hp"
  ].forEach(
    stat => {

      addBonus(
        result,
        stat,
        sameElement.percent,
        "percent",
        "sameElement",
        `${sameElement.count} ${element} Palmon`
      );

    }
  );

}


// =============================
// ELEMENT COUNTER
// =============================

const ELEMENT_COUNTERS = {

  Water:
    "Fire",

  Electric:
    "Water",

  Earth:
    "Electric",

  Fire:
    "Earth"

};


// =============================
// CHECK ELEMENT COUNTER
// =============================

export function isElementCounter(
  attackerElement,
  defenderElement
) {

  if (
    !attackerElement ||
    !defenderElement
  ) {

    return false;

  }


  return (
    ELEMENT_COUNTERS[
      attackerElement
    ] ===
    defenderElement
  );

}


// =============================
// ADD BASE COUNTER BONUS
// =============================

function addElementCounterBonus(
  result,
  element,
  enemyElement,
  conditions
) {

  if (
    !conditions.includes(
      "combat"
    )
  ) {

    return;

  }


  const active =
    isElementCounter(
      element,
      enemyElement
    );


  result.meta
    .elementCounterActive =
      active;


  if (!active) {

    return;

  }


  // Base Element Counter:
  //
  // +10% Final Damage
  // +10% Final Damage Taken Reduction

  addBonus(
    result,
    "finalDamage",
    10,
    "percent",
    "elementCounter",
    `${element} counters ${enemyElement}`
  );


  addBonus(
    result,
    "finalDamageTakenReduction",
    10,
    "percent",
    "elementCounter",
    `${element} counters ${enemyElement}`
  );

}


// =============================
// CONDITIONS
// =============================

function normalizeConditions({
  combat = false,
  attackingCamps = false,
  defendingCamps = false,
  conditions = []
} = {}) {

  const result =
    new Set(
      Array.isArray(
        conditions
      )
        ? conditions
        : []
    );


  if (combat) {

    result.add(
      "combat"
    );

  }


  if (attackingCamps) {

    result.add(
      "combat"
    );

    result.add(
      "attackingCamps"
    );

  }


  if (defendingCamps) {

    result.add(
      "combat"
    );

    result.add(
      "defendingCamps"
    );

  }


  return [
    ...result
  ];

}


// =============================
// GET PALMON BONUSES
// =============================

export function getPalmonBonuses({

  squadNumber = null,

  element = null,

  squadElements = [],

  enemyElement = null,

  combat = false,

  attackingCamps = false,

  defendingCamps = false,

  conditions = []

} = {}) {

  const result =
    createBonusResult();


  const activeConditions =
    normalizeConditions({

      combat,

      attackingCamps,

      defendingCamps,

      conditions

    });


  // -------------------------
  // ACHIEVEMENTS
  // -------------------------

  addAchievementBonuses(
    result,
    element
  );


  // -------------------------
  // BOSS PALMON
  // -------------------------

  addBossPalmonBonuses(
    result,
    element
  );


  // -------------------------
  // RESEARCH
  // -------------------------

  addResearchBonuses(
    result,
    {
      squadNumber,
      element,
      conditions:
        activeConditions
    }
  );


  // -------------------------
  // SAME ELEMENT
  // -------------------------

  addSameElementBonus(
    result,
    element,
    squadElements
  );


  // -------------------------
  // ELEMENT COUNTER
  // -------------------------

  addElementCounterBonus(
    result,
    element,
    enemyElement,
    activeConditions
  );


  return result;

}
