// ========================================
// PALMON SKILLS
// ========================================
//
// Dieses Modul wertet die Skills eines
// einzelnen Palmons aus.
//
// Unterstützt:
//
// Skill 1:
// - Normal Attack
// - immer vorhanden
// - wird durch volle Sterne verstärkt
//
// Skill 2:
// - Rage Skill
// - immer vorhanden
// - wird durch volle Sterne verstärkt
//
// Skill 3:
// - individueller Skill
// - immer vorhanden
// - wird durch volle Sterne verstärkt
//
// Skill 4:
// - wird ab 4★ freigeschaltet
//
// Skill 5:
// - wird durch Evolution freigeschaltet
// - Evolution ist die einzige Source of Truth
// - aktuelle Evo3-Verstärkung wird übernommen
//
// Skill 6:
// - wird durch Mega Evolution freigeschaltet
// - Evo8 kann einen zusätzlichen Bonus-Effekt
//   freischalten
//
// Zusätzlich:
// - permanent vs. battle
// - Conditions
// - Flat / Percent
//
// NICHT zuständig für:
// - Level Growth
// - Ascension Stats
// - Evolution Stats
// - Rollenbonus
// - Bloodmoon
// - Research
// - Achievements
// - Boss Palmon
//
// ========================================


// ========================================
// CONSTANTS
// ========================================

export const PALMON_SKILL_TIMINGS = {
  PERMANENT: "permanent",
  BATTLE: "battle"
};


export const PALMON_SKILL_TYPES = {
  NORMAL_ATTACK: "normalAttack",
  RAGE_SKILL: "rageSkill",
  UNIQUE: "unique",
  STAR_UNLOCK: "starUnlock",
  EVOLUTION_SKILL: "evolutionSkill",
  MEGA_SKILL: "megaSkill"
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


function normalizeStars(
  stars
) {
  return clamp(
    Math.floor(
      Number(stars) || 0
    ),
    0,
    5
  );
}


function normalizeSubLevel(
  stars,
  subLevel
) {
  if (stars >= 5) {
    return 0;
  }

  return clamp(
    Math.floor(
      Number(subLevel) || 0
    ),
    0,
    4
  );
}


function normalizeSkillSlot(
  slot
) {
  return clamp(
    Math.floor(
      Number(slot) || 0
    ),
    0,
    6
  );
}


// ========================================
// ASCENSION PROGRESS
// ========================================
//
// 0-0 = 0
// 0-1 = 1
// ...
// 1-0 = 5
// ...
// 4-0 = 20
// ...
// 5-0 = 25
// ========================================

export function getPalmonAscensionProgress({
  stars,
  subLevel = 0
}) {
  const normalizedStars =
    normalizeStars(stars);

  const normalizedSubLevel =
    normalizeSubLevel(
      normalizedStars,
      subLevel
    );


  if (
    normalizedStars >= 5
  ) {
    return 25;
  }


  return (
    normalizedStars * 5 +
    normalizedSubLevel
  );
}


// ========================================
// EVOLUTION RESULT HELPERS
// ========================================
//
// Erwartet das Ergebnis von:
//
// getPalmonEvolutionBonuses(...)
//
// Beispiel:
//
// {
//   unlocks: {
//     skill5: true,
//     skill6: true,
//     skill6Bonus: false,
//     megaEvolution: true
//   },
//
//   skillEnhancements: {
//     5: 7
//   }
// }
//
// ========================================

function getEvolutionUnlocks(
  evolution
) {
  return {
    skill5:
      Boolean(
        evolution?.unlocks?.skill5
      ),

    skill6:
      Boolean(
        evolution?.unlocks?.skill6
      ),

    skill6Bonus:
      Boolean(
        evolution
          ?.unlocks
          ?.skill6Bonus
      ),

    megaEvolution:
      Boolean(
        evolution
          ?.unlocks
          ?.megaEvolution
      )
  };
}


function getEvolutionSkillEnhancement(
  evolution,
  skillSlot
) {
  const value =
    Number(
      evolution
        ?.skillEnhancements
        ?.[skillSlot]
    );


  return Number.isFinite(
    value
  )
    ? value
    : 0;
}


// ========================================
// SKILL UNLOCK
// ========================================
//
// Evolution entscheidet ausschließlich
// über Skill 5 und Skill 6.
//
// Dadurch wird die Unlock-Logik nicht
// gleichzeitig in zwei Dateien gepflegt.
// ========================================

export function isPalmonSkillUnlocked({
  skill,
  stars = 0,
  subLevel = 0,
  evolution = null
}) {
  if (!skill) {
    return false;
  }


  const slot =
    normalizeSkillSlot(
      skill.slot
    );


  const unlocks =
    getEvolutionUnlocks(
      evolution
    );


  // --------------------------------------
  // SKILLS 1 - 3
  // --------------------------------------

  if (
    slot >= 1 &&
    slot <= 3
  ) {
    return true;
  }


  // --------------------------------------
  // SKILL 4
  // --------------------------------------
  //
  // Standard:
  // ab 4-0★
  //
  // Falls ein Palmon später eine Ausnahme
  // besitzt, kann unlock.stars benutzt werden.
  // --------------------------------------

  if (slot === 4) {
    const requiredStars =
      normalizeStars(
        skill?.unlock?.stars ??
        4
      );


    const requiredSubLevel =
      normalizeSubLevel(
        requiredStars,
        skill?.unlock?.subLevel ??
        0
      );


    const currentProgress =
      getPalmonAscensionProgress({
        stars,
        subLevel
      });


    const requiredProgress =
      getPalmonAscensionProgress({
        stars:
          requiredStars,

        subLevel:
          requiredSubLevel
      });


    return (
      currentProgress >=
      requiredProgress
    );
  }


  // --------------------------------------
  // SKILL 5
  // --------------------------------------

  if (slot === 5) {
    return unlocks.skill5;
  }


  // --------------------------------------
  // SKILL 6
  // --------------------------------------

  if (slot === 6) {
    return unlocks.skill6;
  }


  return false;
}


// ========================================
// BASE SKILL LEVEL
// ========================================
//
// Skills werden durch ganze Sterne
// verstärkt.
//
// 0★ -> Skill-Level 0
// 1★ -> Skill-Level 1
// ...
// 5★ -> Skill-Level 5
//
// Falls ein Skill später davon abweicht,
// kann levelSource angepasst werden.
// ========================================

export function getPalmonSkillLevel({
  skill,
  stars = 0
}) {
  if (!skill) {
    return 0;
  }


  const levelSource =
    skill.levelSource ||
    "stars";


  if (
    levelSource ===
    "stars"
  ) {
    return normalizeStars(
      stars
    );
  }


  if (
    levelSource ===
    "fixed"
  ) {
    return Math.max(
      0,
      Math.floor(
        Number(
          skill.fixedLevel
        ) || 0
      )
    );
  }


  return 0;
}


// ========================================
// STAR-BASED SKILL EFFECTS
// ========================================
//
// Erwartete Struktur:
//
// levels: {
//   0: {
//     effects: [...]
//   },
//
//   1: {
//     effects: [...]
//   },
//
//   ...
// }
//
// Falls eine exakte Stufe fehlt,
// wird die höchste definierte Stufe
// <= aktuellem Skill-Level benutzt.
// ========================================

function getSkillEffectsForLevel({
  skill,
  skillLevel
}) {
  if (!skill) {
    return [];
  }


  const levels =
    skill.levels;


  if (
    levels &&
    typeof levels === "object"
  ) {
    const exactLevel =
      levels[
        skillLevel
      ];


    if (
      exactLevel &&
      Array.isArray(
        exactLevel.effects
      )
    ) {
      return exactLevel.effects;
    }


    const availableLevels =
      Object
        .keys(levels)
        .map(Number)
        .filter(
          level =>
            Number.isFinite(level) &&
            level <= skillLevel
        )
        .sort(
          (a, b) =>
            b - a
        );


    if (
      availableLevels.length > 0
    ) {
      const fallbackLevel =
        levels[
          availableLevels[0]
        ];


      if (
        Array.isArray(
          fallbackLevel?.effects
        )
      ) {
        return fallbackLevel.effects;
      }
    }
  }


  return Array.isArray(
    skill.effects
  )
    ? skill.effects
    : [];
}


// ========================================
// EVOLUTION SKILL ENHANCEMENT
// ========================================
//
// Aktuell relevant für Skill 5.
//
// Evolution liefert z.B.:
//
// skillEnhancements: {
//   5: 7
// }
//
// Das bedeutet:
// Skill 5 Evo-Verstärkung 7/10.
//
// WICHTIG:
//
// Wir kennen noch nicht für jedes Palmon,
// WAS diese zehn Stufen konkret verändern.
//
// Deshalb wird die Verstärkung nicht
// automatisch mathematisch erfunden.
//
// Unterstützte Palmon-Daten:
//
// evolutionEnhancements: {
//   0: { effects: [...] },
//   1: { effects: [...] },
//   ...
//   10: { effects: [...] }
// }
//
// Falls solche Daten noch fehlen,
// bleibt die Enhancement-Stufe trotzdem
// im Ergebnis sichtbar.
// ========================================

function getEvolutionEnhancementEffects({
  skill,
  enhancementLevel
}) {
  const levels =
    skill?.evolutionEnhancements;


  if (
    !levels ||
    typeof levels !== "object"
  ) {
    return [];
  }


  const exact =
    levels[
      enhancementLevel
    ];


  if (
    exact &&
    Array.isArray(
      exact.effects
    )
  ) {
    return exact.effects;
  }


  const availableLevels =
    Object
      .keys(levels)
      .map(Number)
      .filter(
        level =>
          Number.isFinite(level) &&
          level <=
            enhancementLevel
      )
      .sort(
        (a, b) =>
          b - a
      );


  if (
    availableLevels.length === 0
  ) {
    return [];
  }


  const fallback =
    levels[
      availableLevels[0]
    ];


  return Array.isArray(
    fallback?.effects
  )
    ? fallback.effects
    : [];
}


// ========================================
// EVO8 SKILL 6 BONUS
// ========================================
//
// Nur aktiv wenn:
//
// evolution.unlocks.skill6Bonus
// === true
//
// Erwartete Skill-Daten:
//
// evolution8Bonus: {
//   effects: [...]
// }
//
// ========================================

function getSkill6Evolution8Effects({
  skill,
  evolution
}) {
  if (
    normalizeSkillSlot(
      skill?.slot
    ) !== 6
  ) {
    return [];
  }


  if (
    !evolution
      ?.unlocks
      ?.skill6Bonus
  ) {
    return [];
  }


  const bonus =
    skill?.evolution8Bonus;


  return Array.isArray(
    bonus?.effects
  )
    ? bonus.effects
    : [];
}


// ========================================
// CONDITIONS
// ========================================
//
// Alle Conditions eines Effects müssen
// aktiv sein.
//
// Beispiele:
//
// conditions: [
//   "attackingCamps"
// ]
//
// conditions: [
//   "battle",
//   "afterRageSkill"
// ]
//
// ========================================

function effectConditionsApply(
  effect,
  activeConditions
) {
  const requiredConditions =
    Array.isArray(
      effect?.conditions
    )
      ? effect.conditions
      : [];


  if (
    requiredConditions.length === 0
  ) {
    return true;
  }


  const active =
    new Set(
      Array.isArray(
        activeConditions
      )
        ? activeConditions
        : []
    );


  return requiredConditions.every(
    condition =>
      active.has(
        condition
      )
  );
}


// ========================================
// RESULT
// ========================================

function createSkillValueBucket() {
  return {
    flat: {},
    percent: {}
  };
}


function createPalmonSkillBonusResult() {
  return {
    // ------------------------------------
    // NORMALER STAT-SCREEN
    // ------------------------------------

    permanent:
      createSkillValueBucket(),


    // ------------------------------------
    // ERST IM KAMPF
    // ------------------------------------

    battle:
      createSkillValueBucket(),


    // ------------------------------------
    // DEBUG / UI / SOURCES
    // ------------------------------------

    effects: [],

    activeSkills: []
  };
}


// ========================================
// ADD EFFECT
// ========================================

function addSkillEffect(
  result,
  effect,
  source
) {
  if (
    !effect?.stat
  ) {
    return;
  }


  const value =
    Number(
      effect.value
    ) || 0;


  if (
    value === 0
  ) {
    return;
  }


  const timing =
    (
      effect.timing ===
      PALMON_SKILL_TIMINGS.BATTLE
    )
      ? PALMON_SKILL_TIMINGS.BATTLE
      : PALMON_SKILL_TIMINGS.PERMANENT;


  const unit =
    (
      effect.unit ===
      "flat"
    )
      ? "flat"
      : "percent";


  const bucket =
    result[
      timing
    ][
      unit
    ];


  bucket[
    effect.stat
  ] =
    (
      bucket[
        effect.stat
      ] || 0
    ) +
    value;


  result.effects.push({
    stat:
      effect.stat,

    value,

    unit,

    timing,

    scope:
      effect.scope ||
      "self",

    conditions:
      Array.isArray(
        effect.conditions
      )
        ? [
            ...effect.conditions
          ]
        : [],

    source
  });
}


// ========================================
// APPLY EFFECT LIST
// ========================================

function applySkillEffects({
  result,
  effects,
  conditions,
  source
}) {
  (
    Array.isArray(
      effects
    )
      ? effects
      : []
  )
    .forEach(
      effect => {

        if (
          !effectConditionsApply(
            effect,
            conditions
          )
        ) {
          return;
        }


        addSkillEffect(
          result,
          effect,
          source
        );

      }
    );
}


// ========================================
// MAIN API
// ========================================
//
// evolution:
// Ergebnis von
//
// getPalmonEvolutionBonuses(...)
//
// Beispiel:
//
// const evolution =
//   getPalmonEvolutionBonuses({
//     palmonType: "normal",
//     role: "Attacker",
//     stage: 3,
//     talentIndex: 0,
//     talentLevel: 7
//   });
//
// const skills =
//   getPalmonSkillBonuses({
//     palmon,
//     stars: 4,
//     subLevel: 0,
//     evolution
//   });
//
// ========================================

export function getPalmonSkillBonuses({
  palmon,
  stars = 0,
  subLevel = 0,
  evolution = null,
  conditions = []
} = {}) {
  const result =
    createPalmonSkillBonusResult();


  const skills =
    Array.isArray(
      palmon?.skills
    )
      ? palmon.skills
      : [];


  skills.forEach(
    skill => {

      // ----------------------------------
      // UNLOCK CHECK
      // ----------------------------------

      const unlocked =
        isPalmonSkillUnlocked({
          skill,
          stars,
          subLevel,
          evolution
        });


      if (!unlocked) {
        return;
      }


      // ----------------------------------
      // BASE SKILL LEVEL
      // ----------------------------------

      const skillLevel =
        getPalmonSkillLevel({
          skill,
          stars
        });


      // ----------------------------------
      // EVOLUTION ENHANCEMENT
      // ----------------------------------

      const skillSlot =
        normalizeSkillSlot(
          skill.slot
        );


      const evolutionEnhancementLevel =
        getEvolutionSkillEnhancement(
          evolution,
          skillSlot
        );


      // ----------------------------------
      // ACTIVE SKILL INFO
      // ----------------------------------

      result
        .activeSkills
        .push({
          slot:
            skillSlot,

          key:
            skill.key ||
            null,

          name:
            skill.name ||
            skill.key ||
            `Skill ${skillSlot}`,

          type:
            skill.type ||
            null,

          level:
            skillLevel,

          evolutionEnhancementLevel,

          evolution8BonusActive:
            (
              skillSlot === 6 &&
              Boolean(
                evolution
                  ?.unlocks
                  ?.skill6Bonus
              )
            )
        });


      // ----------------------------------
      // NORMAL STAR-LEVEL EFFECTS
      // ----------------------------------

      const starEffects =
        getSkillEffectsForLevel({
          skill,
          skillLevel
        });


      applySkillEffects({
        result,

        effects:
          starEffects,

        conditions,

        source: {
          type:
            "palmonSkill",

          palmonKey:
            palmon?.key ||
            null,

          palmonName:
            palmon?.name ||
            null,

          skillSlot,

          skillKey:
            skill.key ||
            null,

          skillName:
            skill.name ||
            null,

          skillLevel
        }
      });


      // ----------------------------------
      // EVO SKILL ENHANCEMENT
      // ----------------------------------
      //
      // Z.B. Skill 5 bei Evo3.
      // ----------------------------------

      if (
        evolutionEnhancementLevel > 0
      ) {
        const evolutionEffects =
          getEvolutionEnhancementEffects({
            skill,

            enhancementLevel:
              evolutionEnhancementLevel
          });


        applySkillEffects({
          result,

          effects:
            evolutionEffects,

          conditions,

          source: {
            type:
              "palmonSkillEvolutionEnhancement",

            palmonKey:
              palmon?.key ||
              null,

            palmonName:
              palmon?.name ||
              null,

            skillSlot,

            skillKey:
              skill.key ||
              null,

            skillName:
              skill.name ||
              null,

            enhancementLevel:
              evolutionEnhancementLevel
          }
        });
      }


      // ----------------------------------
      // EVO8 BONUS FOR SKILL 6
      // ----------------------------------

      const evolution8Effects =
        getSkill6Evolution8Effects({
          skill,
          evolution
        });


      applySkillEffects({
        result,

        effects:
          evolution8Effects,

        conditions,

        source: {
          type:
            "palmonSkillEvolution8Bonus",

          palmonKey:
            palmon?.key ||
            null,

          palmonName:
            palmon?.name ||
            null,

          skillSlot,

          skillKey:
            skill.key ||
            null,

          skillName:
            skill.name ||
            null
        }
      });

    }
  );


  return result;
}
