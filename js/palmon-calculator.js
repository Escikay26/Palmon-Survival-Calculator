// ========================================
// CENTRAL PALMON STAT CALCULATOR
// ========================================
//
// This module combines the stat systems that
// are currently modeled well enough to use.
//
// IMPORTANT:
// The result is intentionally marked as a
// PREVIEW. Missing or unresolved systems are
// not silently guessed.
//
// Current pipeline:
// - Base stats
// - Level growth
// - Palmon Ascension
// - Role percent bonus
// - Bloodmoon
// - Evolution (when configured)
// - Palmon skills (when data exists)
// - Traits (when configured)
// - Equipment
// - Achievements
// - Research
// - Boss Palmon
// - Same-element squad bonus
//
// Known gaps:
// - Element Totems
// - Player Gear
// - Dream Island boosts
// - Complete per-Palmon skill data
// - Mystic base/level model
// - Some conditional battle mechanics
// ========================================

import {
  getRawStatsAtLevel,
  getPalmonRolePercentBonuses,
  getBloodmoonBonuses,
  applyMainStatBonuses,
  roundPalmonStats
} from "./palmon-levels.js";

import {
  applyAscensionToRawStats,
  isAscensionRaritySupported
} from "./palmon-ascension.js";

import {
  getPalmonEvolutionBonuses
} from "./palmon-evolution.js";

import {
  getPalmonSkillBonuses
} from "./palmon-skills.js";

import {
  getEquipmentDefinition,
  getEquipmentStats
} from "./palmon-equipment.js";

import {
  getPalmonBonuses
} from "./calculator.js";


export const PALMON_STAT_CALCULATION_STATUS = {
  label: "Preview",
  final: false,

  includedSystems: [
    "Base Stats",
    "Level",
    "Ascension",
    "Role",
    "Bloodmoon",
    "Evolution",
    "Palmon Skills (where data exists)",
    "Traits",
    "Equipment",
    "Achievements",
    "Research",
    "Boss Palmon",
    "Same-element Squad Bonus"
  ],

  missingSystems: [
    "Element Totems",
    "Player Gear",
    "Dream Island boosts",
    "Complete per-Palmon skill data"
  ],

  unresolvedMechanics: [
    "Mystic Palmon base/level model",
    "Exact elemental-counter math",
    "Some conditional battle effects"
  ],

  configurationGaps: [
    "Full Palmon Skill setup"
  ]
};


const MAIN_STATS = [
  "attack",
  "defense",
  "hp"
];


function createBucket() {
  return {
    flat: {},
    percent: {},
    effects: []
  };
}


function addValue(
  bucket,
  stat,
  value,
  unit = "percent",
  source = null
) {
  const numeric =
    Number(value);

  if (
    !stat ||
    !Number.isFinite(
      numeric
    ) ||
    numeric === 0
  ) {
    return;
  }

  const target =
    unit === "flat"
      ? bucket.flat
      : bucket.percent;

  target[stat] =
    (
      Number(
        target[stat]
      ) || 0
    ) +
    numeric;

  bucket.effects.push({
    stat,
    value: numeric,
    unit:
      unit === "flat"
        ? "flat"
        : "percent",
    source
  });
}


function addValueMap(
  bucket,
  values,
  unit,
  source
) {
  Object.entries(
    values || {}
  ).forEach(
    ([stat, value]) => {
      addValue(
        bucket,
        stat,
        value,
        unit,
        source
      );
    }
  );
}


function addStructuredStats(
  bucket,
  stats,
  source
) {
  Object.entries(
    stats || {}
  ).forEach(
    ([stat, values]) => {
      addValue(
        bucket,
        stat,
        values?.flat,
        "flat",
        source
      );

      addValue(
        bucket,
        stat,
        values?.percent,
        "percent",
        source
      );
    }
  );
}


function addSimpleEffectList(
  bucket,
  effects,
  sourceType
) {
  (
    effects ||
    []
  ).forEach(
    effect => {
      addValue(
        bucket,
        effect.stat,
        effect.value,
        effect.unit,
        {
          type:
            sourceType,
          ...(effect.source || {})
        }
      );
    }
  );
}


function getConfiguredEvolution(
  palmon,
  config
) {
  const state = {
    palmonType:
      palmon.palmonType ||
      "normal",

    role:
      palmon.role,

    stage:
      Number(
        config?.evolution?.stage
      ) || 0,

    talentIndex:
      Number(
        config
          ?.evolution
          ?.talentIndex
      ) || 0,

    talentLevel:
      Number(
        config
          ?.evolution
          ?.talentLevel
      ) || 0,

    megaEvolved:
      Boolean(
        config
          ?.evolution
          ?.megaEvolved
      )
  };

  return getPalmonEvolutionBonuses(
    state
  );
}


function collectAllSquadEvolutionBonuses(
  resolvedMembers
) {
  const result =
    createBucket();

  resolvedMembers.forEach(
    member => {
      const evolution =
        getConfiguredEvolution(
          member.palmon,
          member.config
        );

      addValueMap(
        result,
        evolution
          ?.allSquads
          ?.permanent
          ?.flat,
        "flat",
        {
          type:
            "evolutionAllSquads",
          palmonId:
            member.palmon.id
        }
      );

      addValueMap(
        result,
        evolution
          ?.allSquads
          ?.permanent
          ?.percent,
        "percent",
        {
          type:
            "evolutionAllSquads",
          palmonId:
            member.palmon.id
        }
      );
    }
  );

  return result;
}


function getSelectedTraitEffects({
  config,
  traitsData
}) {
  const selectedIds =
    new Set(
      Array.isArray(
        config?.traitIds
      )
        ? config.traitIds
        : []
    );

  return (
    traitsData?.traits ||
    []
  )
    .filter(
      trait =>
        selectedIds.has(
          trait.id
        )
    )
    .flatMap(
      trait =>
        (
          trait.effects ||
          []
        ).map(
          effect => ({
            ...effect,
            source: {
              type:
                "trait",
              traitId:
                trait.id,
              traitName:
                trait.name,
              traitRank:
                trait.rank
            }
          })
        )
    );
}


function getAssignedEquipmentInstances({
  config,
  equipmentInstances
}) {
  const ids =
    Object.values(
      config?.equipment ||
      {}
    )
      .filter(Boolean);

  const byId =
    new Map(
      (
        equipmentInstances ||
        []
      ).map(
        item => [
          item.instanceId,
          item
        ]
      )
    );

  return ids
    .map(
      id =>
        byId.get(id)
    )
    .filter(Boolean);
}


function addEquipmentBonuses({
  bucket,
  config,
  equipmentData,
  equipmentInstances
}) {
  const equipped =
    getAssignedEquipmentInstances({
      config,
      equipmentInstances
    });

  equipped.forEach(
    instance => {
      const definition =
        getEquipmentDefinition(
          equipmentData,
          instance.equipmentId
        );

      if (!definition) {
        return;
      }

      const result =
        getEquipmentStats({
          equipmentData,
          equipmentId:
            definition.id,
          level:
            instance.enhancementLevel,
          ascension:
            instance.ascensionLevel
        });

      (
        result?.mainStats ||
        []
      ).forEach(
        stat => {
          addValue(
            bucket,
            stat.stat,
            stat.value,
            stat.unit,
            {
              type:
                "equipmentMainStat",
              instanceId:
                instance.instanceId,
              equipmentId:
                definition.id,
              equipmentName:
                definition.name
            }
          );
        }
      );

      (
        result?.extraEffects ||
        []
      ).forEach(
        effect => {
          addValue(
            bucket,
            effect.stat,
            effect.value,
            effect.unit,
            {
              type:
                "equipmentAscensionEffect",
              instanceId:
                instance.instanceId,
              equipmentId:
                definition.id,
              equipmentName:
                definition.name,
              ascensionLevel:
                effect.ascensionLevel
            }
          );
        }
      );
    }
  );
}


function getSecondaryStats(
  bucket
) {
  const result = {};

  const keys =
    new Set([
      ...Object.keys(
        bucket.flat
      ),
      ...Object.keys(
        bucket.percent
      )
    ]);

  keys.forEach(
    stat => {
      if (
        MAIN_STATS.includes(
          stat
        )
      ) {
        return;
      }

      result[stat] = {
        flat:
          Number(
            bucket.flat[stat]
          ) || 0,
        percent:
          Number(
            bucket.percent[stat]
          ) || 0
      };
    }
  );

  return result;
}


export function calculatePalmonStats({
  palmon,
  config,
  squadNumber = null,
  squadElements = [],
  equipmentData = null,
  equipmentInstances = [],
  traitsData = null,
  allSquadEvolutionBonuses = null
} = {}) {
  const warnings = [];

  if (
    !palmon ||
    !config
  ) {
    return {
      supported: false,
      warnings: [
        "Missing Palmon configuration."
      ]
    };
  }

  if (
    !palmon.baseStats
  ) {
    warnings.push(
      "This Palmon does not have a confirmed/derived base-stat model yet."
    );

    return {
      supported: false,
      palmon,
      config,
      warnings,
      status:
        PALMON_STAT_CALCULATION_STATUS
    };
  }

  const rarity =
    String(
      palmon.rarity ||
      ""
    )
      .trim()
      .toUpperCase();

  if (
    rarity !== "UR"
  ) {
    warnings.push(
      `Final stat preview currently supports normal UR base stats only. "${palmon.rarity}" is not modeled safely yet.`
    );

    return {
      supported: false,
      palmon,
      config,
      warnings,
      status:
        PALMON_STAT_CALCULATION_STATUS
    };
  }

  const level =
    Math.min(
      350,
      Math.max(
        1,
        Math.floor(
          Number(
            config.level
          ) || 1
        )
      )
    );

  const stars =
    Math.min(
      5,
      Math.max(
        0,
        Math.floor(
          Number(
            config.stars
          ) || 0
        )
      )
    );

  const subLevel =
    stars >= 5
      ? 0
      : Math.min(
          4,
          Math.max(
            0,
            Math.floor(
              Number(
                config.subLevel
              ) || 0
            )
          )
        );

  let rawStats =
    getRawStatsAtLevel({
      level,
      rarity,
      level1Stats:
        palmon.baseStats
    });

  if (
    isAscensionRaritySupported(
      rarity
    )
  ) {
    rawStats =
      applyAscensionToRawStats({
        rawStats,
        stars,
        subLevel,
        rarity
      });
  }
  else {
    warnings.push(
      `Ascension is not modeled for ${rarity}.`
    );
  }

  const bonuses =
    createBucket();

  const roleBonuses =
    getPalmonRolePercentBonuses(
      palmon.role
    );

  addValueMap(
    bonuses,
    roleBonuses,
    "percent",
    {
      type:
        "role",
      role:
        palmon.role
    }
  );

  const bloodmoon =
    getBloodmoonBonuses(
      level
    );

  addValueMap(
    bonuses,
    bloodmoon.flat,
    "flat",
    {
      type:
        "bloodmoon"
    }
  );

  addValueMap(
    bonuses,
    bloodmoon.percent,
    "percent",
    {
      type:
        "bloodmoon"
    }
  );

  const evolution =
    getConfiguredEvolution(
      palmon,
      config
    );

  addValueMap(
    bonuses,
    evolution
      ?.self
      ?.permanent
      ?.flat,
    "flat",
    {
      type:
        "evolutionSelf"
    }
  );

  addValueMap(
    bonuses,
    evolution
      ?.self
      ?.permanent
      ?.percent,
    "percent",
    {
      type:
        "evolutionSelf"
    }
  );

  if (
    allSquadEvolutionBonuses
  ) {
    addValueMap(
      bonuses,
      allSquadEvolutionBonuses.flat,
      "flat",
      {
        type:
          "evolutionAllSquads"
      }
    );

    addValueMap(
      bonuses,
      allSquadEvolutionBonuses.percent,
      "percent",
      {
        type:
          "evolutionAllSquads"
      }
    );
  }

  const skillBonuses =
    getPalmonSkillBonuses({
      palmon,
      stars,
      subLevel,
      evolution
    });

  addValueMap(
    bonuses,
    skillBonuses
      ?.permanent
      ?.flat,
    "flat",
    {
      type:
        "palmonSkill"
    }
  );

  addValueMap(
    bonuses,
    skillBonuses
      ?.permanent
      ?.percent,
    "percent",
    {
      type:
        "palmonSkill"
    }
  );

  if (
    !Array.isArray(
      palmon.skills
    ) ||
    palmon.skills.length === 0
  ) {
    warnings.push(
      "Per-Palmon skill effects are not fully entered yet and are not included."
    );
  }

  addSimpleEffectList(
    bonuses,
    getSelectedTraitEffects({
      config,
      traitsData
    }),
    "trait"
  );

  addEquipmentBonuses({
    bucket:
      bonuses,
    config,
    equipmentData,
    equipmentInstances
  });

  const accountBonuses =
    getPalmonBonuses({
      squadNumber,
      element:
        palmon.element,
      squadElements,
      combat: false
    });

  addValueMap(
    bonuses,
    accountBonuses.flat,
    "flat",
    {
      type:
        "accountAndSquad"
    }
  );

  addValueMap(
    bonuses,
    accountBonuses.percent,
    "percent",
    {
      type:
        "accountAndSquad"
    }
  );

  const unrounded =
    applyMainStatBonuses({
      rawStats,
      flatBonuses:
        bonuses.flat,
      percentBonuses:
        bonuses.percent
    });

  const finalStats =
    roundPalmonStats(
      unrounded
    );

  return {
    supported: true,

    status:
      PALMON_STAT_CALCULATION_STATUS,

    palmon,
    config: {
      ...config,
      level,
      stars,
      subLevel
    },

    rawStats,
    flatBonuses:
      bonuses.flat,
    percentBonuses:
      bonuses.percent,
    finalStats,

    secondaryStats:
      getSecondaryStats(
        bonuses
      ),

    evolution,
    skillBonuses,

    meta: {
      sameElementCount:
        accountBonuses
          ?.meta
          ?.sameElementCount ||
        0,

      sameElementBonus:
        accountBonuses
          ?.meta
          ?.sameElementBonus ||
        0
    },

    effects:
      bonuses.effects,

    warnings
  };
}


export function calculateTeamStats({
  team,
  palmons = [],
  equipmentData = null,
  equipmentInstances = [],
  traitsData = null,
  squadNumber = null
} = {}) {
  const palmonMap =
    new Map(
      palmons.map(
        palmon => [
          palmon.id,
          palmon
        ]
      )
    );

  const resolvedMembers =
    (
      team?.palmons ||
      []
    )
      .map(
        config => ({
          config,
          palmon:
            palmonMap.get(
              config.palmonId
            ) || null
        })
      )
      .filter(
        member =>
          member.palmon
      );

  const squadElements =
    resolvedMembers.map(
      member =>
        member.palmon.element
    );

  const allSquadEvolutionBonuses =
    collectAllSquadEvolutionBonuses(
      resolvedMembers
    );

  return resolvedMembers.map(
    member =>
      calculatePalmonStats({
        palmon:
          member.palmon,
        config:
          member.config,
        squadNumber,
        squadElements,
        equipmentData,
        equipmentInstances,
        traitsData,
        allSquadEvolutionBonuses
      })
  );
}
