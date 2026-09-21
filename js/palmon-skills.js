// ========================================
// PALMON SKILLS
// ========================================
//
// Unterstützt:
//
// - Skill Slots 1 bis 6
// - Skill 1–3 immer vorhanden
// - Skill 4 ab 4★
// - Skill 5 ab Evo 3
// - Skill 6 ab Mega Evolution
// - Skill-Verstärkung durch ganze Sterne
// - Evo8 Bonus für Skill 6
// - permanente Stat-Effekte
// - Battle-Effekte
// - Bedingungen wie attackingCamps,
//   defendingCamps, afterRageSkill usw.
//
// WICHTIG:
//
// Dieses Modul berechnet NICHT:
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
  EVOLUTION_UNLOCK: "evolutionUnlock",
  MEGA_UNLOCK: "megaEvolutionUnlock"
};


// ========================================
// NORMALIZE HELPERS
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


function normalizeEvolutionStage(
  evolutionStage
) {
  return clamp(
    Math.floor(
      Number(evolutionStage) || 0
    ),
    0,
    8
  );
}


// ========================================
// ASCENSION PROGRESS
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


  if (normalizedStars >= 5) {
    return 25;
  }


  return (
    normalizedStars * 5 +
    normalizedSubLevel
  );
}


// ========================================
// SKILL UNLOCK
// ========================================
//
// Unterstützte Unlocks:
//
// {
//   type: "default"
// }
//
// {
//   type: "stars",
//   stars: 4
// }
//
// {
//   type: "evolution",
//   stage: 3
// }
//
// {
//   type: "megaEvolution"
// }
//
// ========================================

export function isPalmonSkillUnlocked({
  skill,
  stars = 0,
  subLevel = 0,
  evolutionStage = 0,
  megaEvolved = false
}) {
  if (!skill) {
    return false;
  }


  const unlock =
    skill.unlock || {
      type: "default"
    };


  switch (unlock.type) {

    case "default":
      return true;


    case "stars": {
      const requiredStars =
        normalizeStars(
          unlock.stars
        );

      const requiredSubLevel =
        normalizeSubLevel(
          requiredStars,
          unlock.subLevel || 0
        );


      const currentProgress =
        getPalmonAscensionProgress({
          stars,
          subLevel
        });


      const requiredProgress =
        getPalmonAscensionProgress({
          stars: requiredStars,
          subLevel: requiredSubLevel
        });


      return (
        currentProgress >=
        requiredProgress
      );
    }


    case "evolution":
      return (
        normalizeEvolutionStage(
          evolutionStage
        ) >=
        normalizeEvolutionStage(
          unlock.stage
        )
      );


    case "megaEvolution":
      return Boolean(
        megaEvolved
      );


    default:
      return false;
  }
}


// ========================================
// SKILL LEVEL
// ========================================
//
// Skills 1–3 existieren immer und werden
// durch volle Sterne verstärkt.
//
// Das bedeutet:
//
// 0★ => Skill Level 0
// 1★ => Skill Level 1
// ...
// 5★ => Skill Level 5
//
// Ein einzelner Skill kann diese Regel
// später mit skill.levelSource überschreiben.
// ========================================

export function getPalmonSkillLevel({
  skill,
  stars = 0,
  evolutionStage = 0
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
    "evolution"
  ) {
    return normalizeEvolutionStage(
      evolutionStage
    );
  }


  return 0;
}


// ========================================
// EFFECT LEVEL RESOLUTION
// ========================================
//
// Ein Skill kann seine Effekte pro Stern
// definieren:
//
// levels: {
//   0: { effects: [...] },
//   1: { effects: [...] },
//   ...
// }
//
// Falls keine Levels existieren,
// werden skill.effects verwendet.
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
    const exact =
      levels[
        skillLevel
      ];


    if (
      exact &&
      Array.isArray(
        exact.effects
      )
    ) {
      return exact.effects;
    }


    // Falls kein exakter Level existiert:
    // höchste definierte Stufe <= skillLevel verwenden.

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
      const fallback =
        levels[
          availableLevels[0]
        ];


      if (
        Array.isArray(
          fallback?.effects
        )
      ) {
        return fallback.effects;
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
// CONDITIONS
// ========================================
//
// Beispiel:
//
// conditions: [
//   "attackingCamps"
// ]
//
// oder:
//
// conditions: [
//   "battle",
//   "afterRageSkill"
// ]
//
// Alle Conditions eines Effects müssen
// aktiv sein.
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
      activeConditions || []
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

function createSkillBonusBucket() {
  return {
    flat: {},
    percent: {}
  };
}


function createPalmonSkillBonusResult() {
  return {
    permanent:
      createSkillBonusBucket(),

    battle:
      createSkillBonusBucket(),

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
    effect.timing ===
    PALMON_SKILL_TIMINGS.BATTLE
      ? PALMON_SKILL_TIMINGS.BATTLE
      : PALMON_SKILL_TIMINGS.PERMANENT;


  const unit =
    effect.unit === "flat"
      ? "flat"
      : "percent";


  const timingBucket =
    result[
      timing
    ];


  const valueBucket =
    timingBucket[
      unit
    ];


  valueBucket[
    effect.stat
  ] =
    (
      valueBucket[
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

    conditions:
      Array.isArray(
        effect.conditions
      )
        ? [
            ...effect.conditions
          ]
        : [],

    scope:
      effect.scope ||
      "self",

    source
  });
}


// ========================================
// EVO 8 BONUS
// ========================================
//
// Skill 6 kann am Ende von Evo8 einen
// zusätzlichen Effekt erhalten.
//
// Beispiel:
//
// evolution8Bonus: {
//   effects: [...]
// }
//
// ========================================

function getEvolution8BonusEffects({
  skill,
  evolutionStage
}) {
  if (
    normalizeEvolutionStage(
      evolutionStage
    ) < 8
  ) {
    return [];
  }


  const bonus =
    skill?.evolution8Bonus;


  if (
    !bonus ||
    !Array.isArray(
      bonus.effects
    )
  ) {
    return [];
  }


  return bonus.effects;
}


// ========================================
// GET PALMON SKILL BONUSES
// ========================================

export function getPalmonSkillBonuses({
  palmon,
  stars = 0,
  subLevel = 0,
  evolutionStage = 0,
  megaEvolved = false,
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

      const unlocked =
        isPalmonSkillUnlocked({
          skill,
          stars,
          subLevel,
          evolutionStage,
          megaEvolved
        });


      if (!unlocked) {
        return;
      }


      const skillLevel =
        getPalmonSkillLevel({
          skill,
          stars,
          evolutionStage
        });


      result.activeSkills.push({
        slot:
          Number(
            skill.slot
          ) || null,

        key:
          skill.key ||
          null,

        name:
          skill.name ||
          skill.key ||
          "Unknown Skill",

        type:
          skill.type ||
          null,

        level:
          skillLevel
      });


      const effects =
        getSkillEffectsForLevel({
          skill,
          skillLevel
        });


      effects.forEach(
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
            {
              type:
                "palmonSkill",

              palmonKey:
                palmon?.key ||
                null,

              palmonName:
                palmon?.name ||
                null,

              skillSlot:
                Number(
                  skill.slot
                ) || null,

              skillKey:
                skill.key ||
                null,

              skillName:
                skill.name ||
                skill.key ||
                null,

              skillLevel
            }
          );

        }
      );


      // ----------------------------------
      // EVO 8 BONUS
      // ----------------------------------

      const evolution8Effects =
        getEvolution8BonusEffects({
          skill,
          evolutionStage
        });


      evolution8Effects.forEach(
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
            {
              type:
                "palmonSkillEvolution8Bonus",

              palmonKey:
                palmon?.key ||
                null,

              palmonName:
                palmon?.name ||
                null,

              skillSlot:
                Number(
                  skill.slot
                ) || null,

              skillKey:
                skill.key ||
                null,

              skillName:
                skill.name ||
                skill.key ||
                null,

              evolutionStage: 8
            }
          );

        }
      );

    }
  );


  return result;
}
