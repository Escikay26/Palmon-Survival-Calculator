// ========================================
// PALMON EQUIPMENT MODEL
// ========================================
//
// Separates:
// - Equipment definition
// - Enhancement Lv0-100
// - Ascension 0-10
// - Ascension extra effects
// - Upgrade resource costs
//
// IMPORTANT:
//
// Ascension increases the THREE normal
// equipment stats by +10% per Ascension
// level, based on the already-enhanced
// value.
//
// Flat main stats use Math.ceil after the
// Ascension multiplier.
//
// Ascension extra effects are separate.
// Ascension 6-10 replace the matching
// extra-effect slot from Ascension 1-5.
// ========================================

export const EQUIPMENT_MIN_LEVEL = 0;
export const EQUIPMENT_MAX_LEVEL = 100;

export const EQUIPMENT_MIN_ASCENSION = 0;
export const EQUIPMENT_MAX_ASCENSION = 10;


// ========================================
// STAT LABELS
// ========================================

export const EQUIPMENT_STAT_NAMES = {
  attack: "Attack",
  defense: "Defense",
  hp: "HP",
  critRate: "Crit Rate",
  critDamage: "Crit Damage",
  accuracy: "Accuracy",
  evasion: "Evasion",
  tenacity: "Tenacity",
  critDamageReduction:
    "Crit Damage Reduction",
  rageSkillDamage:
    "Rage Skill Damage",
  rageSkillDamageTakenReduction:
    "Rage Skill Damage Taken Reduction",
  finalDamage:
    "Final Damage",
  finalDamageTakenReduction:
    "Final Damage Taken Reduction",
  damageVsEarthWorldBoss:
    "Damage vs Earth World Boss",
  damageVsElectricWorldBoss:
    "Damage vs Electric World Boss"
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
  const parsed =
    Math.floor(
      Number(value)
    );

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}


export function normalizeEquipmentLevel(
  level
) {
  return clamp(
    normalizeInteger(level),
    EQUIPMENT_MIN_LEVEL,
    EQUIPMENT_MAX_LEVEL
  );
}


export function normalizeEquipmentAscension(
  ascension
) {
  return clamp(
    normalizeInteger(ascension),
    EQUIPMENT_MIN_ASCENSION,
    EQUIPMENT_MAX_ASCENSION
  );
}


function roundTo(
  value,
  decimals = 6
) {
  const factor =
    10 ** decimals;

  return (
    Math.round(
      value * factor
    ) / factor
  );
}


// ========================================
// EQUIPMENT LOOKUP
// ========================================

export function getEquipmentDefinition(
  equipmentData,
  equipmentId
) {
  return (
    equipmentData?.equipment ||
    []
  ).find(
    item =>
      item.id ===
      equipmentId
  ) || null;
}


export function getEquipmentDefinitionByCategoryAndRarity(
  equipmentData,
  category,
  rarity
) {
  return (
    equipmentData?.equipment ||
    []
  ).find(
    item =>
      item.category === category &&
      item.rarity === rarity
  ) || null;
}


// ========================================
// ENHANCEMENT GROWTH
// ========================================

function getStepGrowth(
  curve,
  targetLevel
) {
  let total = 0;

  for (
    let level = 1;
    level <= targetLevel;
    level += 1
  ) {
    const range =
      (
        curve?.ranges ||
        []
      ).find(
        item =>
          level >= item.fromLevel &&
          level <= item.toLevel
      );

    if (!range) {
      throw new Error(
        `No equipment growth range for level ${level}.`
      );
    }

    total +=
      Number(
        range.growthPerLevel
      ) || 0;
  }

  return total;
}


export function getEquipmentEnhancementGrowth({
  equipmentData,
  rarity,
  curveKey,
  level
} = {}) {
  const normalizedLevel =
    normalizeEquipmentLevel(
      level
    );

  const curve =
    equipmentData
      ?.enhancement
      ?.curves
      ?.[rarity]
      ?.[curveKey];

  if (!curve) {
    throw new Error(
      `Missing equipment curve: ${rarity} / ${curveKey}`
    );
  }

  if (
    curve.type ===
    "level-growth"
  ) {
    const value =
      curve.values?.[
        normalizedLevel
      ];

    if (
      !Number.isFinite(
        Number(value)
      )
    ) {
      throw new Error(
        `Missing equipment level-growth value: ${rarity} / ${curveKey} / Lv${normalizedLevel}`
      );
    }

    return Number(value);
  }

  if (
    curve.type ===
    "step-growth"
  ) {
    return getStepGrowth(
      curve,
      normalizedLevel
    );
  }

  throw new Error(
    `Unknown equipment curve type: ${curve.type}`
  );
}


// ========================================
// ENHANCED 0★ MAIN STATS
// ========================================

export function getEnhancedEquipmentMainStats({
  equipmentData,
  equipment,
  level
} = {}) {
  if (!equipment) {
    return [];
  }

  const normalizedLevel =
    normalizeEquipmentLevel(
      level
    );

  return (
    equipment.baseStats ||
    []
  ).map(
    stat => {

      const growth =
        getEquipmentEnhancementGrowth({
          equipmentData,
          rarity:
            equipment.rarity,
          curveKey:
            stat.curve,
          level:
            normalizedLevel
        });

      return {
        stat:
          stat.stat,

        unit:
          stat.unit,

        value:
          roundTo(
            Number(stat.value) +
            growth
          )
      };

    }
  );
}


// ========================================
// ASCENSION MAIN-STAT MULTIPLIER
// ========================================

export function getEquipmentAscensionMultiplier({
  equipmentData,
  ascension
} = {}) {
  const normalizedAscension =
    normalizeEquipmentAscension(
      ascension
    );

  const percentPerLevel =
    Number(
      equipmentData
        ?.ascension
        ?.mainStatPercentPerLevel
    ) || 10;

  return (
    1 +
    (
      normalizedAscension *
      percentPerLevel
    ) /
    100
  );
}


export function getEquipmentMainStats({
  equipmentData,
  equipment,
  level,
  ascension
} = {}) {
  const enhancedStats =
    getEnhancedEquipmentMainStats({
      equipmentData,
      equipment,
      level
    });

  const multiplier =
    getEquipmentAscensionMultiplier({
      equipmentData,
      ascension
    });

  return enhancedStats.map(
    stat => {

      const multiplied =
        stat.value *
        multiplier;

      return {
        ...stat,

        value:
          stat.unit === "flat"
            ? Math.ceil(
                multiplied
              )
            : roundTo(
                multiplied,
                6
              )
      };

    }
  );
}


// ========================================
// ASCENSION EXTRA EFFECTS
// ========================================
//
// Slots:
// 1 <-> 6
// 2 <-> 7
// 3 <-> 8
// 4 <-> 9
// 5 <-> 10
//
// Example Ascension 7:
// - Asc 6 replaces Asc 1
// - Asc 7 replaces Asc 2
// - Asc 3/4/5 remain active
// ========================================

export function getActiveEquipmentAscensionEffects({
  equipmentData,
  equipment,
  ascension
} = {}) {
  if (!equipment) {
    return [];
  }

  const normalizedAscension =
    normalizeEquipmentAscension(
      ascension
    );

  if (
    normalizedAscension <= 0
  ) {
    return [];
  }

  const effectsByLevel =
    equipment
      .ascensionExtraEffects ||
    {};

  const replacementSlots =
    equipmentData
      ?.ascension
      ?.replacementSlots ||
    {};

  const activeLevels = [];

  for (
    let slot = 1;
    slot <= 5;
    slot += 1
  ) {
    const replacementLevel =
      Number(
        Object.entries(
          replacementSlots
        ).find(
          ([, replacedSlot]) =>
            Number(replacedSlot) ===
            slot
        )?.[0]
      );

    if (
      replacementLevel &&
      normalizedAscension >=
        replacementLevel
    ) {
      activeLevels.push(
        replacementLevel
      );
      continue;
    }

    if (
      normalizedAscension >=
      slot
    ) {
      activeLevels.push(
        slot
      );
    }
  }

  const result = [];

  activeLevels.forEach(
    level => {

      (
        effectsByLevel[
          String(level)
        ] ||
        []
      ).forEach(
        effect => {

          result.push({
            ...effect,
            ascensionLevel:
              level
          });

        }
      );

    }
  );

  return result;
}


// ========================================
// TOTAL EQUIPMENT EFFECTS
// ========================================
//
// Main stats and Ascension extra effects
// remain separate in the return value.
// This is intentional because later the
// Palmon calculator can put them into the
// correct flat/percent/battle buckets.
// ========================================

export function getEquipmentStats({
  equipmentData,
  equipmentId,
  level = 0,
  ascension = 0
} = {}) {
  const equipment =
    getEquipmentDefinition(
      equipmentData,
      equipmentId
    );

  if (!equipment) {
    return null;
  }

  return {
    equipment,
    level:
      normalizeEquipmentLevel(
        level
      ),
    ascension:
      normalizeEquipmentAscension(
        ascension
      ),
    mainStats:
      getEquipmentMainStats({
        equipmentData,
        equipment,
        level,
        ascension
      }),
    extraEffects:
      getActiveEquipmentAscensionEffects({
        equipmentData,
        equipment,
        ascension
      })
  };
}


// ========================================
// ASCENSION DISPLAY
// ========================================

export function getEquipmentAscensionLabel(
  equipmentData,
  ascension
) {
  const normalizedAscension =
    normalizeEquipmentAscension(
      ascension
    );

  return (
    equipmentData
      ?.ascension
      ?.display
      ?.[
        String(
          normalizedAscension
        )
      ] ||
    (
      normalizedAscension === 0
        ? "0★"
        : `Ascension ${normalizedAscension}`
    )
  );
}


// ========================================
// ENHANCEMENT COST
// ========================================

export function getEquipmentEnhancementStepCost(
  equipmentData,
  fromLevel
) {
  const normalizedLevel =
    clamp(
      normalizeInteger(
        fromLevel
      ),
      0,
      EQUIPMENT_MAX_LEVEL - 1
    );

  const range =
    (
      equipmentData
        ?.enhancement
        ?.upgradeCosts ||
      []
    ).find(
      item =>
        normalizedLevel >=
          item.fromLevel &&
        normalizedLevel <=
          item.toLevel
    );

  return range
    ? Number(
        range.xpPerLevel
      ) || 0
    : 0;
}


export function getEquipmentEnhancementCostForLevel(
  equipmentData,
  targetLevel
) {
  const normalizedLevel =
    normalizeEquipmentLevel(
      targetLevel
    );

  let total = 0;

  for (
    let level = 0;
    level < normalizedLevel;
    level += 1
  ) {
    total +=
      getEquipmentEnhancementStepCost(
        equipmentData,
        level
      );
  }

  return total;
}


// ========================================
// ASCENSION COST
// ========================================

export function getEquipmentAscensionStepCost(
  equipmentData,
  targetAscension
) {
  const normalizedAscension =
    normalizeEquipmentAscension(
      targetAscension
    );

  if (
    normalizedAscension <= 0
  ) {
    return 0;
  }

  return (
    Number(
      equipmentData
        ?.ascension
        ?.opusPearlCosts
        ?.[
          String(
            normalizedAscension
          )
        ]
    ) || 0
  );
}


export function getEquipmentAscensionCostForLevel(
  equipmentData,
  targetAscension
) {
  const normalizedAscension =
    normalizeEquipmentAscension(
      targetAscension
    );

  let total = 0;

  for (
    let ascension = 1;
    ascension <=
      normalizedAscension;
    ascension += 1
  ) {
    total +=
      getEquipmentAscensionStepCost(
        equipmentData,
        ascension
      );
  }

  return total;
}


// ========================================
// INSTANCE COST
// ========================================

export function getEquipmentInstanceCost(
  equipmentData,
  instance
) {
  return {
    enhancementXp:
      getEquipmentEnhancementCostForLevel(
        equipmentData,
        instance?.enhancementLevel
      ),

    opusPearls:
      getEquipmentAscensionCostForLevel(
        equipmentData,
        instance?.ascensionLevel
      )
  };
}
