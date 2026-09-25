// ========================================
// PALMON EVOLUTION MODEL
// ========================================
//
// Source: Mappe1Evo.xlsx + confirmed game behavior.
//
// Evolution is a LINEAR progression:
// - Talents inside a stage are completed in order.
// - A talent must reach 10/10 before the next talent unlocks.
// - A complete stage is required before the next Evo stage unlocks.
// - Evo1 requires 1★.
// - Evo2 requires 2★.
// - Evo3 requires 3★.
// - Evo4 requires 4★.
// - Evo5 / Mega Evolution requires 5★, a completed Evo4 and the matching Oath.
// - Evo1-Evo4 are available to evolution-capable Normal and Mythic Palmons.
// - Mythic Palmons stop at Evo4.
// - Normal Palmons without a Mega Evolution stop at Evo4.
// - Normal Palmons with a Mega Evolution may continue through Evo5-Evo8.
// - Evo3 unlocks Skill 5.
// - Mega Evolution / Evo5 unlocks Skill 6.
// - Completing Evo8 unlocks the bonus effect for Skill 6.
//
// IMPORTANT:
// Elemental Counter math is intentionally kept as dedicated effects
// until the exact Final Damage / Damage Taken Reduction formula is verified.
// See docs/model-open-questions.md.
// ========================================


// ========================================
// CONSTANTS
// ========================================

export const PALMON_EVOLUTION_TYPES = {
  NORMAL: "normal",
  MYTHIC: "mythic"
};


export const PALMON_EVOLUTION_ROLES = {
  ATTACKER: "Attacker",
  DEFENDER: "Defender"
};


export const EVOLUTION_TIMINGS = {
  PERMANENT: "permanent",
  BATTLE: "battle"
};


export const EVOLUTION_SCOPES = {
  SELF: "self",
  ALL_SQUADS: "allSquads"
};


const MAX_TALENT_LEVEL = 10;


// ========================================
// ASCENSION / STAR REQUIREMENTS
// ========================================
//
// Evo1 -> 1★
// Evo2 -> 2★
// Evo3 -> 3★
// Evo4 -> 4★
// Evo5+ -> 5★
//
// Evo5 benötigt zusätzlich:
// - Evo4 vollständig
// - vorhandene Megaentwicklung
// - passenden Mega-Oath
// ========================================

export const EVOLUTION_STAR_REQUIREMENTS = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 5,
  7: 5,
  8: 5
};


// ========================================
// DATA HELPERS
// ========================================

function effect({
  stat,
  value = null,
  valuePerLevel = null,
  unit = "percent",
  timing = EVOLUTION_TIMINGS.PERMANENT,
  scope = EVOLUTION_SCOPES.SELF,
  activeWhenUndeployed = false,
  notes = null
}) {
  return {
    stat,
    value,
    valuePerLevel,
    unit,
    timing,
    scope,
    activeWhenUndeployed,
    notes
  };
}


function talent(
  key,
  name,
  effects = [],
  extra = {}
) {
  return {
    key,
    name,
    maxLevel: MAX_TALENT_LEVEL,
    effects,
    ...extra
  };
}


// ========================================
// EVOLUTION DATA
// ========================================

export const PALMON_EVOLUTION_STAGES = {

  // ======================================
  // EVO 1
  // ======================================

  1: {
    stage: 1,

    group: "normalEvolution",

    cost: {
      resource: "Evolution Cristals",
      amount: 20
    },

    unlockEffects: [
      effect({
        stat: "initialRage",
        value: 20,
        unit: "flat",
        timing: EVOLUTION_TIMINGS.BATTLE
      }),

      effect({
        stat: "attack",
        value: 5
      }),

      effect({
        stat: "hp",
        value: 5
      })
    ],

    talents: [
      talent(
        "evo1-attack-1",
        "Attack I",
        [
          effect({
            stat: "attack",
            valuePerLevel: 50,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo1-defense",
        "Defense I",
        [
          effect({
            stat: "defense",
            valuePerLevel: 10,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo1-hp",
        "HP I",
        [
          effect({
            stat: "hp",
            valuePerLevel: 4500,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo1-attack-2",
        "Attack II",
        [
          effect({
            stat: "attack",
            valuePerLevel: 80,
            unit: "flat"
          })
        ]
      )
    ]
  },


  // ======================================
  // EVO 2
  // ======================================

  2: {
    stage: 2,

    group: "normalEvolution",

    cost: {
      resource: "Evolution Cristals",
      amount: 40
    },

    unlockEffects: [
      effect({
        stat: "finalDamageTakenReduction",
        value: 5,
        timing: EVOLUTION_TIMINGS.BATTLE
      }),

      effect({
        stat: "attack",
        value: 10
      }),

      effect({
        stat: "hp",
        value: 10
      })
    ],

    talents: [
      talent(
        "evo2-attack",
        "Attack",
        [
          effect({
            stat: "attack",
            valuePerLevel: 120,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo2-crit-rate",
        "Crit Rate",
        [
          effect({
            stat: "critRate",
            valuePerLevel: 1
          })
        ]
      ),

      talent(
        "evo2-defense",
        "Defense",
        [
          effect({
            stat: "defense",
            valuePerLevel: 24,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo2-hp",
        "HP",
        [
          effect({
            stat: "hp",
            valuePerLevel: 8000,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo2-tenacity",
        "Tenacity",
        [
          effect({
            stat: "tenacity",
            valuePerLevel: 1
          })
        ]
      ),

      talent(
        "evo2-squad-size",
        "Squad Size per Palmon Deployed",
        [
          effect({
            stat: "squadSizePerPalmonDeployed",
            valuePerLevel: 2,
            unit: "flat"
          })
        ]
      )
    ]
  },


  // ======================================
  // EVO 3
  // ======================================

  3: {
    stage: 3,

    group: "normalEvolution",

    cost: {
      resource: "Evolution Cristals",
      amount: 80
    },

    unlockEffects: [
      effect({
        stat: "critDamage",
        value: 50
      }),

      effect({
        stat: "attack",
        value: 15
      }),

      effect({
        stat: "hp",
        value: 15
      })
    ],

    unlocksSkill: 5,

    talents: [
      talent(
        "evo3-skill5-effect",
        "Skill 5 Effect",
        [],
        {
          specialType: "skillEnhancement",
          skillSlot: 5
        }
      ),

      talent(
        "evo3-attack",
        "Attack",
        [
          effect({
            stat: "attack",
            valuePerLevel: 150,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo3-evasion",
        "Evasion",
        [
          effect({
            stat: "evasion",
            valuePerLevel: 1
          })
        ]
      ),

      talent(
        "evo3-defense",
        "Defense",
        [
          effect({
            stat: "defense",
            valuePerLevel: 30,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo3-hp",
        "HP",
        [
          effect({
            stat: "hp",
            valuePerLevel: 19000,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo3-accuracy",
        "Accuracy",
        [
          effect({
            stat: "accuracy",
            valuePerLevel: 1
          })
        ]
      )
    ]
  },


  // ======================================
  // EVO 4
  // ======================================

  4: {
    stage: 4,

    group: "normalEvolution",

    cost: {
      resource: "Evolution Cristals",
      amount: 160
    },

    unlockEffects: [
      effect({
        stat: "elementCounterDamageBonus",
        value: 50,
        timing: EVOLUTION_TIMINGS.BATTLE,
        notes:
          "Exact elemental-counter damage math is not yet verified."
      }),

      effect({
        stat: "elementCounterDamageTakenReduction",
        value: 50,
        timing: EVOLUTION_TIMINGS.BATTLE,
        notes:
          "Exact elemental-counter defensive math is not yet verified."
      }),

      effect({
        stat: "attack",
        value: 20
      }),

      effect({
        stat: "hp",
        value: 20
      })
    ],

    talents: [
      talent(
        "evo4-attack",
        "Attack",
        [
          effect({
            stat: "attack",
            valuePerLevel: 200,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo4-defense",
        "Defense",
        [
          effect({
            stat: "defense",
            valuePerLevel: 40,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo4-hp",
        "HP",
        [
          effect({
            stat: "hp",
            valuePerLevel: 56000,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo4-crit-damage",
        "Crit Damage",
        [
          effect({
            stat: "critDamage",
            valuePerLevel: 2.5
          })
        ]
      ),

      talent(
        "evo4-crit-resistance",
        "Crit Resistance",
        [
          effect({
            stat: "critResistance",
            valuePerLevel: 2.5
          })
        ]
      )
    ],

    // Letztes Evo4-Talent hängt von der
    // Palmon-Rolle ab.
    //
    // Der Bonus gilt ACCOUNTWEIT für alle
    // Squads, selbst wenn dieses Palmon
    // nicht eingesetzt wird.
    roleFinalTalent: {
      Attacker:
        talent(
          "evo4-squad-attack",
          "Squad Attack (Even when Undeployed)",
          [
            effect({
              stat: "attack",
              valuePerLevel: 0.5,
              scope:
                EVOLUTION_SCOPES.ALL_SQUADS,
              activeWhenUndeployed: true
            })
          ]
        ),

      Defender:
        talent(
          "evo4-squad-defense-hp",
          "Squad Defense & HP (Even when Undeployed)",
          [
            effect({
              stat: "defense",
              valuePerLevel: 0.7,
              scope:
                EVOLUTION_SCOPES.ALL_SQUADS,
              activeWhenUndeployed: true
            }),

            effect({
              stat: "hp",
              valuePerLevel: 0.7,
              scope:
                EVOLUTION_SCOPES.ALL_SQUADS,
              activeWhenUndeployed: true
            })
          ]
        )
    }
  },


  // ======================================
  // EVO 5 / MEGA EVOLUTION
  // ======================================

  5: {
    stage: 5,

    group: "megaEvolution",

    cost: {
      resource: "Matching Mega Evolution Oath",
      amount: 1,
      label: "1 matching Mega Oath",
      dynamicResource: true,
      usesNormalEvolutionMaterials: false
    },

    unlocksSkill: 6,

    unlockEffects: [],

    talents: [
      talent(
        "evo5-attack",
        "Attack",
        [
          effect({
            stat: "attack",
            valuePerLevel: 200,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo5-defense",
        "Defense",
        [
          effect({
            stat: "defense",
            valuePerLevel: 40,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo5-hp",
        "HP",
        [
          effect({
            stat: "hp",
            valuePerLevel: 40000,
            unit: "flat"
          })
        ]
      )
    ]
  },


  // ======================================
  // EVO 6
  // ======================================

  6: {
    stage: 6,

    group: "megaEvolution",

    cost: {
      resource: "Polar Essence",
      amount: 40
    },

    unlockEffects: [
      effect({
        stat: "squadSizePerPalmonDeployed",
        value: 20,
        unit: "flat",

        // OPEN MODEL QUESTION:
        // Noch nicht sicher, ob dieser Effekt
        // nur für das entwickelte Palmon / dessen
        // Squad gilt oder accountweit wirkt.
        //
        // Siehe docs/model-open-questions.md
        scope: EVOLUTION_SCOPES.SELF
      })
    ],

    talents: [
      talent(
        "evo6-attack",
        "Attack",
        [
          effect({
            stat: "attack",
            valuePerLevel: 230,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo6-crit-rate",
        "Crit Rate",
        [
          effect({
            stat: "critRate",
            valuePerLevel: 1
          })
        ]
      ),

      talent(
        "evo6-defense",
        "Defense",
        [
          effect({
            stat: "defense",
            valuePerLevel: 46,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo6-hp",
        "HP",
        [
          effect({
            stat: "hp",
            valuePerLevel: 46000,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo6-tenacity",
        "Tenacity",
        [
          effect({
            stat: "tenacity",
            valuePerLevel: 1
          })
        ]
      )
    ]
  },


  // ======================================
  // EVO 7
  // ======================================

  7: {
    stage: 7,

    group: "megaEvolution",

    cost: {
      resource: "Polar Essence",
      amount: 80
    },

    unlockEffects: [
      effect({
        stat: "finalDamage",
        value: 10,
        timing: EVOLUTION_TIMINGS.BATTLE
      })
    ],

    talents: [
      talent(
        "evo7-attack",
        "Attack",
        [
          effect({
            stat: "attack",
            valuePerLevel: 270,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo7-counter-damage",
        "Damage Dealt to Element Counter",
        [
          effect({
            stat: "elementCounterDamageBonus",
            valuePerLevel: 0.5,
            timing: EVOLUTION_TIMINGS.BATTLE
          })
        ]
      ),

      talent(
        "evo7-counter-defense",
        "Damage Taken Reduction from Element Counter",
        [
          effect({
            stat:
              "elementCounterDamageTakenReduction",
            valuePerLevel: 0.5,
            timing: EVOLUTION_TIMINGS.BATTLE
          })
        ]
      ),

      talent(
        "evo7-defense",
        "Defense",
        [
          effect({
            stat: "defense",
            valuePerLevel: 54,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo7-hp",
        "HP",
        [
          effect({
            stat: "hp",
            valuePerLevel: 54000,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo7-accuracy",
        "Accuracy",
        [
          effect({
            stat: "accuracy",
            valuePerLevel: 1
          })
        ]
      )
    ]
  },


  // ======================================
  // EVO 8
  // ======================================

  8: {
    stage: 8,

    group: "megaEvolution",

    cost: {
      resource: "Polar Essence",
      amount: 160
    },

    unlockEffects: [
      effect({
        stat:
          "finalDamageTakenReduction",
        value: 10,
        timing: EVOLUTION_TIMINGS.BATTLE
      })
    ],

    talents: [
      talent(
        "evo8-attack",
        "Attack",
        [
          effect({
            stat: "attack",
            valuePerLevel: 300,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo8-defense",
        "Defense",
        [
          effect({
            stat: "defense",
            valuePerLevel: 60,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo8-hp",
        "HP",
        [
          effect({
            stat: "hp",
            valuePerLevel: 60000,
            unit: "flat"
          })
        ]
      ),

      talent(
        "evo8-crit-damage",
        "Crit Damage",
        [
          effect({
            stat: "critDamage",
            valuePerLevel: 2.5
          })
        ]
      ),

      talent(
        "evo8-crit-resistance",
        "Crit Resistance",
        [
          effect({
            stat: "critResistance",
            valuePerLevel: 2.5
          })
        ]
      )
    ],

    // Erst wenn Evo8 vollständig abgeschlossen
    // wurde, bekommt Skill 6 seinen Bonus-Effekt.
    completionUnlocksSkillBonus: 6
  }
};


// ========================================
// HELPERS
// ========================================

function clamp(
  value,
  min,
  max
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}


function normalizeInteger(
  value,
  fallback = 0
) {
  const number =
    Math.floor(
      Number(value)
    );

  return Number.isFinite(number)
    ? number
    : fallback;
}


function assertRole(
  role
) {
  if (
    !Object
      .values(
        PALMON_EVOLUTION_ROLES
      )
      .includes(role)
  ) {
    throw new Error(
      `Unknown Palmon role: ${role}`
    );
  }
}


function assertPalmonType(
  palmonType
) {
  if (
    !Object
      .values(
        PALMON_EVOLUTION_TYPES
      )
      .includes(palmonType)
  ) {
    throw new Error(
      `Unknown Palmon type: ${palmonType}`
    );
  }
}


// ========================================
// GET STAGE TALENTS
// ========================================
//
// Evo4 bekommt am Ende abhängig von der Rolle
// ein zusätzliches Talent.
//
// Attacker:
// Squad Attack
//
// Defender:
// Squad Defense + HP
// ========================================

function getStageTalents(
  stage,
  role
) {
  const stageData =
    PALMON_EVOLUTION_STAGES[
      stage
    ];

  if (!stageData) {
    return [];
  }


  const talents = [
    ...stageData.talents
  ];


  if (
    stageData.roleFinalTalent
  ) {
    assertRole(role);

    talents.push(
      stageData
        .roleFinalTalent[
          role
        ]
    );
  }


  return talents;
}


// ========================================
// MAX EVOLUTION
// ========================================
//
// Mythic:
// Evo4 maximum
//
// Normal:
// Evo8 maximum
// ========================================

export function getMaxEvolutionStage(
  palmonType
) {
  assertPalmonType(
    palmonType
  );


  return (
    palmonType ===
    PALMON_EVOLUTION_TYPES.MYTHIC
      ? 4
      : 8
  );
}



// ========================================
// PALMON-SPECIFIC EVOLUTION LIMIT
// ========================================
//
// Die generische Typ-Grenze oben bleibt für
// reine Modellberechnungen bestehen.
//
// Diese Funktion berücksichtigt zusätzlich
// die tatsächlichen Entwicklungsformen des
// konkreten Palmons aus data/palmons.json.
//
// Keine Evo4-Form:
// -> keine Evolution
//
// Evo4, aber keine Evo5-Form:
// -> maximal Evo4
//
// Normales Palmon mit Evo5-Form:
// -> maximal Evo8
//
// Mythic:
// -> maximal Evo4
// ========================================

export function getPalmonEvolutionStageLimit({
  palmonType =
    PALMON_EVOLUTION_TYPES.NORMAL,

  hasEvolution = false,

  hasMegaEvolution = false
} = {}) {
  assertPalmonType(
    palmonType
  );


  if (
    !hasEvolution
  ) {
    return 0;
  }


  if (
    palmonType ===
    PALMON_EVOLUTION_TYPES.MYTHIC
  ) {
    return 4;
  }


  return hasMegaEvolution
    ? 8
    : 4;
}


// ========================================
// REQUIRED STARS FOR EVO STAGE
// ========================================

export function getRequiredStarsForEvolutionStage(
  stage
) {
  const normalizedStage =
    clamp(
      normalizeInteger(
        stage
      ),
      0,
      8
    );


  if (
    normalizedStage <= 0
  ) {
    return 0;
  }


  return (
    EVOLUTION_STAR_REQUIREMENTS[
      normalizedStage
    ] || 5
  );
}


// ========================================
// EVOLUTION STAGE ELIGIBILITY
// ========================================
//
// Zentrale Regelprüfung für spätere UI und
// Calculator-Logik.
//
// targetStage 5 benötigt:
// - 5★
// - Evo4 vollständig
// - Megaentwicklung vorhanden
// - passenden Oath gezogen
//
// Für Evo6-Evo8 muss Mega bereits über Evo5
// erreicht worden sein; dadurch greift die
// normale Previous-Stage-Complete-Regel.
// ========================================

export function canUnlockEvolutionStage({
  palmonType =
    PALMON_EVOLUTION_TYPES.NORMAL,

  role,

  currentState = {},

  targetStage = 0,

  stars = 0,

  hasEvolution = false,

  hasMegaEvolution = false,

  megaOathUnlocked = false
} = {}) {
  assertPalmonType(
    palmonType
  );

  assertRole(
    role
  );


  const normalizedTargetStage =
    clamp(
      normalizeInteger(
        targetStage
      ),
      0,
      8
    );


  if (
    normalizedTargetStage === 0
  ) {
    return true;
  }


  const stageLimit =
    getPalmonEvolutionStageLimit({
      palmonType,
      hasEvolution,
      hasMegaEvolution
    });


  if (
    normalizedTargetStage >
    stageLimit
  ) {
    return false;
  }


  const normalizedStars =
    clamp(
      normalizeInteger(
        stars
      ),
      0,
      5
    );


  const requiredStars =
    getRequiredStarsForEvolutionStage(
      normalizedTargetStage
    );


  if (
    normalizedStars <
    requiredStars
  ) {
    return false;
  }


  const state =
    normalizeEvolutionState({
      ...currentState,
      palmonType,
      role
    });


  // Bereits erreichte Stufen bleiben gültig.
  if (
    normalizedTargetStage <=
    state.stage
  ) {
    return true;
  }


  if (
    normalizedTargetStage > 1 &&
    !isEvolutionStageComplete(
      state,
      normalizedTargetStage - 1
    )
  ) {
    return false;
  }


  if (
    normalizedTargetStage === 5
  ) {

    if (
      !hasMegaEvolution
    ) {
      return false;
    }


    if (
      !megaOathUnlocked
    ) {
      return false;
    }

  }


  return true;
}


// ========================================
// NORMALIZE EVOLUTION STATE
// ========================================
//
// Ein Zustand wird dargestellt durch:
//
// stage:
// aktuelle Evo-Stufe
//
// talentIndex:
// welches Talent innerhalb der Stufe
// aktuell gelevelt wird
//
// talentLevel:
// aktuelles Level dieses Talents
//
// Beispiel:
//
// {
//   stage: 2,
//   talentIndex: 2,
//   talentLevel: 6
// }
//
// Bedeutet:
//
// Evo1 vollständig.
//
// Evo2:
// Talent 0 = 10/10
// Talent 1 = 10/10
// Talent 2 = 6/10
// spätere Talente = 0/10
// ========================================

export function normalizeEvolutionState({
  palmonType =
    PALMON_EVOLUTION_TYPES.NORMAL,

  role,

  stage = 0,

  talentIndex = 0,

  talentLevel = 0,

  megaEvolved = false
} = {}) {
  assertPalmonType(
    palmonType
  );

  assertRole(
    role
  );


  const maxStage =
    getMaxEvolutionStage(
      palmonType
    );


  const normalizedStage =
    clamp(
      normalizeInteger(stage),
      0,
      maxStage
    );


  const stageTalents =
    normalizedStage > 0
      ? getStageTalents(
          normalizedStage,
          role
        )
      : [];


  const normalizedMegaEvolved =
    (
      palmonType ===
      PALMON_EVOLUTION_TYPES.NORMAL
    ) &&
    (
      Boolean(
        megaEvolved
      ) ||
      normalizedStage >= 5
    );


  if (
    normalizedStage === 0 ||
    stageTalents.length === 0
  ) {
    return {
      palmonType,
      role,
      stage:
        normalizedStage,

      talentIndex: 0,
      talentLevel: 0,

      megaEvolved:
        normalizedMegaEvolved
    };
  }


  const normalizedTalentIndex =
    clamp(
      normalizeInteger(
        talentIndex
      ),
      0,
      stageTalents.length - 1
    );


  const normalizedTalentLevel =
    clamp(
      normalizeInteger(
        talentLevel
      ),
      0,
      MAX_TALENT_LEVEL
    );


  return {
    palmonType,
    role,

    stage:
      normalizedStage,

    talentIndex:
      normalizedTalentIndex,

    talentLevel:
      normalizedTalentLevel,

    megaEvolved:
      normalizedMegaEvolved
  };
}


// ========================================
// TALENT LEVELS
// ========================================
//
// Da Evolution linear ist, müssen wir nicht
// jedes einzelne Talent-Level speichern.
//
// Alle früheren Evo-Stufen:
//
// 10/10
//
// Aktuelle Evo-Stufe:
//
// Talente vor talentIndex:
// 10/10
//
// aktuelles Talent:
// talentLevel
//
// spätere Talente:
// 0/10
// ========================================

export function getEvolutionTalentLevels(
  stateInput = {}
) {
  const state =
    normalizeEvolutionState(
      stateInput
    );


  const levels = {};


  for (
    let stage = 1;
    stage <= state.stage;
    stage += 1
  ) {
    const talents =
      getStageTalents(
        stage,
        state.role
      );


    talents.forEach(
      (
        talentData,
        index
      ) => {

        let level = 0;


        if (
          stage <
          state.stage
        ) {
          level =
            MAX_TALENT_LEVEL;
        }

        else if (
          index <
          state.talentIndex
        ) {
          level =
            MAX_TALENT_LEVEL;
        }

        else if (
          index ===
          state.talentIndex
        ) {
          level =
            state.talentLevel;
        }


        levels[
          talentData.key
        ] =
          level;

      }
    );
  }


  return levels;
}


// ========================================
// STAGE COMPLETE CHECK
// ========================================

export function isEvolutionStageComplete(
  stateInput = {},
  stageToCheck = null
) {
  const state =
    normalizeEvolutionState(
      stateInput
    );


  const stage =
    stageToCheck == null
      ? state.stage
      : normalizeInteger(
          stageToCheck
        );


  if (
    stage <= 0
  ) {
    return true;
  }


  if (
    stage <
    state.stage
  ) {
    return true;
  }


  if (
    stage >
    state.stage
  ) {
    return false;
  }


  const talents =
    getStageTalents(
      stage,
      state.role
    );


  if (
    talents.length === 0
  ) {
    return true;
  }


  return (
    state.talentIndex ===
      talents.length - 1
    &&
    state.talentLevel >=
      MAX_TALENT_LEVEL
  );
}


// ========================================
// BONUS RESULT
// ========================================

function createValueBucket() {
  return {
    flat: {},
    percent: {}
  };
}


function createScopeBucket() {
  return {
    permanent:
      createValueBucket(),

    battle:
      createValueBucket()
  };
}


function createEvolutionResult() {
  return {
    // Boni für das Palmon selbst.
    self:
      createScopeBucket(),

    // Accountweite Boni für alle Squads.
    allSquads:
      createScopeBucket(),

    effects: [],

    // Evo3 kann den Effekt von Skill 5
    // schrittweise verstärken.
    skillEnhancements: {},

    unlocks: {
      skill5: false,
      skill6: false,
      skill6Bonus: false,
      megaEvolution: false
    },

    progress: null
  };
}


// ========================================
// ADD EFFECT
// ========================================

function addEffect(
  result,
  effectData,
  multiplier,
  source
) {
  if (
    !effectData?.stat ||
    !Number.isFinite(
      multiplier
    ) ||
    multiplier === 0
  ) {
    return;
  }


  const baseValue =
    effectData.valuePerLevel != null
      ? (
          Number(
            effectData.valuePerLevel
          ) *
          multiplier
        )
      : Number(
          effectData.value
        );


  if (
    !Number.isFinite(
      baseValue
    ) ||
    baseValue === 0
  ) {
    return;
  }


  const scope =
    (
      effectData.scope ===
      EVOLUTION_SCOPES.ALL_SQUADS
    )
      ? EVOLUTION_SCOPES.ALL_SQUADS
      : EVOLUTION_SCOPES.SELF;


  const timing =
    (
      effectData.timing ===
      EVOLUTION_TIMINGS.BATTLE
    )
      ? EVOLUTION_TIMINGS.BATTLE
      : EVOLUTION_TIMINGS.PERMANENT;


  const unit =
    effectData.unit === "flat"
      ? "flat"
      : "percent";


  const bucket =
    result[
      scope
    ][
      timing
    ][
      unit
    ];


  bucket[
    effectData.stat
  ] =
    (
      bucket[
        effectData.stat
      ] || 0
    ) +
    baseValue;


  result.effects.push({
    stat:
      effectData.stat,

    value:
      baseValue,

    unit,

    timing,

    scope,

    activeWhenUndeployed:
      Boolean(
        effectData.activeWhenUndeployed
      ),

    notes:
      effectData.notes ||
      null,

    source
  });
}


// ========================================
// MAIN API
// ========================================

export function getPalmonEvolutionBonuses(
  stateInput = {}
) {
  const state =
    normalizeEvolutionState(
      stateInput
    );


  const result =
    createEvolutionResult();


  const talentLevels =
    getEvolutionTalentLevels(
      state
    );


  result.progress = {
    ...state,

    talentLevels
  };


  // --------------------------------------
  // UNLOCKS
  // --------------------------------------

  result.unlocks.skill5 =
    state.stage >= 3;


  result.unlocks.megaEvolution =
    state.megaEvolved;


  result.unlocks.skill6 =
    (
      state.palmonType ===
      PALMON_EVOLUTION_TYPES.NORMAL
    ) &&
    state.stage >= 5;


  result.unlocks.skill6Bonus =
    (
      state.palmonType ===
      PALMON_EVOLUTION_TYPES.NORMAL
    ) &&
    state.stage >= 8 &&
    isEvolutionStageComplete(
      state,
      8
    );


  // --------------------------------------
  // APPLY STAGES
  // --------------------------------------

  for (
    let stage = 1;
    stage <= state.stage;
    stage += 1
  ) {
    const stageData =
      PALMON_EVOLUTION_STAGES[
        stage
      ];


    if (!stageData) {
      continue;
    }


    // ------------------------------------
    // STAGE UNLOCK EFFECTS
    // ------------------------------------
    //
    // Diese Effekte sind kumulativ.
    //
    // Beispiel:
    //
    // Evo1 Attack +5%
    // Evo2 Attack +10%
    //
    // Bei Evo2:
    // insgesamt +15%.
    // ------------------------------------

    (
      stageData
        .unlockEffects ||
      []
    )
      .forEach(
        effectData => {

          addEffect(
            result,
            effectData,
            1,
            {
              type:
                "evolutionStageUnlock",

              stage
            }
          );

        }
      );


    // ------------------------------------
    // TALENTS
    // ------------------------------------

    const talents =
      getStageTalents(
        stage,
        state.role
      );


    talents.forEach(
      talentData => {

        const level =
          talentLevels[
            talentData.key
          ] || 0;


        if (
          level <= 0
        ) {
          return;
        }


        // --------------------------------
        // SKILL ENHANCEMENT
        // --------------------------------

        if (
          talentData
            .specialType ===
          "skillEnhancement"
        ) {
          result
            .skillEnhancements[
              talentData.skillSlot
            ] =
              level;

          return;
        }


        // --------------------------------
        // NORMAL EFFECTS
        // --------------------------------

        (
          talentData
            .effects ||
          []
        )
          .forEach(
            effectData => {

              addEffect(
                result,
                effectData,
                level,
                {
                  type:
                    "evolutionTalent",

                  stage,

                  talentKey:
                    talentData.key,

                  talentName:
                    talentData.name,

                  talentLevel:
                    level
                }
              );

            }
          );

      }
    );
  }


  return result;
}


// ========================================
// GET CURRENT TALENT
// ========================================
//
// Praktisch für die spätere UI.
// ========================================

export function getCurrentEvolutionTalent(
  stateInput = {}
) {
  const state =
    normalizeEvolutionState(
      stateInput
    );


  if (
    state.stage === 0
  ) {
    return null;
  }


  const talents =
    getStageTalents(
      state.stage,
      state.role
    );


  const current =
    talents[
      state.talentIndex
    ];


  if (!current) {
    return null;
  }


  return {
    stage:
      state.stage,

    index:
      state.talentIndex,

    key:
      current.key,

    name:
      current.name,

    level:
      state.talentLevel,

    maxLevel:
      current.maxLevel
  };
}


// ========================================
// GET STAGE DEFINITION
// ========================================
//
// Ebenfalls praktisch für die spätere UI.
// ========================================

export function getEvolutionStageDefinition(
  stage,
  role
) {
  const normalizedStage =
    clamp(
      normalizeInteger(
        stage
      ),
      1,
      8
    );


  const stageData =
    PALMON_EVOLUTION_STAGES[
      normalizedStage
    ];


  if (!stageData) {
    return null;
  }


  return {
    ...stageData,

    talents:
      getStageTalents(
        normalizedStage,
        role
      )
  };
}
