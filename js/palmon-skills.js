// ========================================
// PALMON SKILLS
// ========================================
//
// Dieses Modul wertet Palmon-Skills aus,
// die abhängig von Sternen / Ascension
// freigeschaltet werden.
//
// WICHTIG:
//
// Hier gehören KEINE Dinge hinein wie:
//
// - Level Growth
// - Ascension Growth
// - Attacker / Defender Rollenbonus
// - Bloodmoon
// - Achievements
// - Research
// - Boss Palmon
//
// Diese Systeme bleiben separat.
//
// Beispiel:
// Ein Palmon besitzt einen Skill,
// der ab 4★
//
// Attack  +20%
// Defense +20%
// HP      +20%
//
// gewährt.
//
// Dieser Effekt wird hier aktiviert.
// ========================================


// ========================================
// HELPERS
// ========================================

function normalizeStars(
  stars
) {
  return Math.max(
    0,
    Math.min(
      5,
      Math.floor(
        Number(stars) || 0
      )
    )
  );
}


function normalizeSubLevel(
  stars,
  subLevel
) {
  if (stars >= 5) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      4,
      Math.floor(
        Number(subLevel) || 0
      )
    )
  );
}


// ========================================
// ASCENSION PROGRESS
// ========================================
//
// 0-0 = 0
// 0-1 = 1
// ...
// 0-4 = 4
// 1-0 = 5
// ...
// 4-0 = 20
// ...
// 5-0 = 25
//
// Damit können später auch Skills modelliert
// werden, die nicht exakt bei einem vollen
// Stern freigeschaltet werden.
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
// SKILL UNLOCK CHECK
// ========================================
//
// Unterstützt aktuell:
//
// unlockStars
// unlockSubLevel
//
// Beispiele:
//
// {
//   unlockStars: 4
// }
//
// wird bei 4-0 aktiv.
//
// {
//   unlockStars: 3,
//   unlockSubLevel: 2
// }
//
// wird bei 3-2 aktiv.
// ========================================

export function isPalmonSkillUnlocked({
  skill,
  stars,
  subLevel = 0
}) {
  if (!skill) {
    return false;
  }

  const currentProgress =
    getPalmonAscensionProgress({
      stars,
      subLevel
    });


  const requiredStars =
    normalizeStars(
      skill.unlockStars ?? 0
    );


  const requiredSubLevel =
    normalizeSubLevel(
      requiredStars,
      skill.unlockSubLevel ?? 0
    );


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


// ========================================
// RESULT
// ========================================

function createPalmonSkillBonusResult() {
  return {
    flat: {},
    percent: {},
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
    !effect ||
    !effect.stat
  ) {
    return;
  }


  const value =
    Number(
      effect.value
    ) || 0;


  if (value === 0) {
    return;
  }


  const unit =
    effect.unit === "flat"
      ? "flat"
      : "percent";


  const bucket =
    result[unit];


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

    condition:
      effect.condition ||
      null,

    scope:
      effect.scope ||
      "self",

    source
  });
}


// ========================================
// CONDITION CHECK
// ========================================
//
// Für den 4★-Stat-Skill brauchen wir aktuell
// keine Condition.
//
// Die Unterstützung ist trotzdem schon hier,
// damit spätere Palmon-Skills z.B.
//
// attackingCamps
// defendingCamps
// combat
//
// verwenden können.
// ========================================

function skillEffectApplies(
  effect,
  conditions
) {
  if (
    !effect?.condition
  ) {
    return true;
  }


  const activeConditions =
    new Set(
      Array.isArray(
        conditions
      )
        ? conditions
        : []
    );


  return activeConditions.has(
    effect.condition
  );
}


// ========================================
// GET PALMON SKILL BONUSES
// ========================================
//
// Erwartetes Palmon-Datenmodell:
//
// {
//   name: "Lucidina",
//
//   skills: [
//     {
//       key: "promising",
//
//       name: "Promising",
//
//       unlockStars: 4,
//
//       unlockSubLevel: 0,
//
//       effects: [
//         {
//           stat: "attack",
//           value: 20,
//           unit: "percent"
//         },
//         ...
//       ]
//     }
//   ]
// }
//
// ========================================

export function getPalmonSkillBonuses({
  palmon,
  stars = 0,
  subLevel = 0,
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

      if (
        !isPalmonSkillUnlocked({
          skill,
          stars,
          subLevel
        })
      ) {
        return;
      }


      result.activeSkills.push({
        key:
          skill.key ||
          null,

        name:
          skill.name ||
          skill.key ||
          "Unknown Skill",

        unlockStars:
          Number(
            skill.unlockStars
          ) || 0,

        unlockSubLevel:
          Number(
            skill.unlockSubLevel
          ) || 0
      });


      const effects =
        Array.isArray(
          skill.effects
        )
          ? skill.effects
          : [];


      effects.forEach(
        effect => {

          if (
            !skillEffectApplies(
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

              skillKey:
                skill.key ||
                null,

              skillName:
                skill.name ||
                skill.key ||
                null
            }
          );

        }
      );

    }
  );


  return result;
}
