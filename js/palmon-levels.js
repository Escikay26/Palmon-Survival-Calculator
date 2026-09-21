// ========================================
// PALMON LEVEL MODEL
// ========================================
//
// Rekonstruiert aus Ingame-Messreihen.
//
// WICHTIG:
// - Die Arrays enthalten kumulativen RAW-Levelzuwachs relativ zu Lv1.
// - Bloodmoon ist NICHT in diesen Kurven enthalten.
// - Account-%-Boni sind herausgerechnet.
// - Sterne / Ascension sind NICHT enthalten.
// - Lv311-350 sind anhand des bestätigten linearen post-300-Wachstums extrapoliert.
//
// Referenz der rekonstruierten Kurve:
// UR Attacker (Mantleray, 0★)
//
// ========================================

export const PALMON_MIN_LEVEL = 1;
export const PALMON_MAX_LEVEL = 350;

// ========================================
// ROLE STAT BONUSES
// ========================================
//
// Durch Lucidina experimentell bestätigt:
//
// Die Rolle verändert NICHT die RAW-Levelkurve.
//
// Stattdessen ist die Rolle Teil des additiven
// Prozentpools:
//
// Attacker:
//   Attack +20%
//
// Defender:
//   Defense +20%
//   HP +20%
//
// Diese Boni werden später gemeinsam mit anderen
// %-Boni auf die RAW-Stats angewendet.
// ========================================

export const PALMON_ROLE_PERCENT_BONUSES = {
  Attacker: {
    attack: 20,
    defense: 0,
    hp: 0
  },

  Defender: {
    attack: 0,
    defense: 20,
    hp: 20
  }
};


// ========================================
// RARITY TRAIT
// ========================================
//
// Wird beim tatsächlichen Erreichen von 4★
// sofort aktiv.
//
// Wichtig:
//
// Die Ascension-Vorschau zeigt diesen Bonus
// offenbar NICHT im 4-0-Vorschauwert an.
//
// Tatsächlicher Stat-Screen:
//
// UR  = +20% ATK / DEF / HP
// SSR = +10% ATK / DEF / HP
// SR  =  +5% ATK / DEF / HP
//
// Auch dieser Bonus geht additiv in denselben
// %-Pool wie der Rollenbonus.
// ========================================

export const PALMON_RARITY_TRAIT_PERCENT = {
  UR: 20,
  SSR: 10,
  SR: 5
};

// Raritätsfaktoren auf die neutrale UR-Levelkurve.
// SSR wurde über Cerverdant bestätigt.
// SR wurde über Emboa + Auktyke bestätigt.
// SR ist statabhängig und darf NICHT als einheitlicher Faktor behandelt werden.
export const PALMON_RARITY_LEVEL_FACTORS = {
  UR: {
    attack: 1,
    defense: 1,
    hp: 1
  },
  SSR: {
    attack: 0.6,
    defense: 0.6,
    hp: 0.6
  },
  SR: {
    attack: 0.38,
    defense: 0.4,
    hp: 8536 / 60000
  }
};

export const PALMON_LEVEL_MODEL_INFO = {
  measuredThroughLevel: 310,
  extrapolatedFromLevel: 311,
  extrapolatedThroughLevel: 350,
  referenceRarity: "UR",
  referenceRole: "Attacker",
  referenceStars: 0,
  notes: [
    "Lv1-310 aus gemessenen Ingame-Werten rekonstruiert.",
    "Bloodmoon-Flat- und Prozentboni wurden aus der Levelkurve entfernt.",
    "Lv311-350 folgen dem bestätigten linearen post-300-Rohwachstum.",
    "Ascension/Sterne werden separat modelliert."
  ]
};

const UR_ATTACKER_ATTACK_GROWTH = [
  0, 24, 48.2, 72.2, 96.2, 120.2, 144, 168, 192, 216.2,
  240.2, 264.2, 288, 312, 336, 366, 396, 426, 456, 486,
  516, 546.2, 576.2, 606.2, 636.2, 672.2, 708, 744, 780.2, 816.2,
  883.4, 925.2, 967.4, 1009.2, 1051.4, 1093.2, 1135.4, 1177.2, 1219.4, 1261.2,
  1338, 1386.2, 1434.2, 1482, 1530.2, 1578.2, 1626, 1674, 1722.2, 1770.2,
  1847, 1894.8, 1943, 1991, 2038.8, 2087, 2135, 2182.8, 2231, 2279,
  2374.8, 2434.8, 2494.8, 2554.8, 2615, 2675, 2735, 2795, 2855, 2915,
  3030.2, 3102, 3174.2, 3246, 3318.2, 3390, 3462.2, 3534, 3606.2, 3678,
  3812.4, 3896.4, 3980.4, 4064.4, 4148.4, 4232.4, 4316.6, 4400.6, 4484.6, 4568.6,
  4722, 4818, 4914.2, 5010, 5106.2, 5202.2, 5298, 5394.2, 5490.2, 5586,
  5759, 5867, 5974.8, 6082.8, 6191, 6299, 6407, 6514.8, 6622.8, 6731,
  6903.6, 7011.6, 7119.8, 7227.8, 7335.8, 7443.6, 7551.6, 7659.8, 7767.8, 7875.8,
  8067.6, 8187.8, 8307.8, 8427.8, 8547.6, 8667.6, 8787.8, 8907.8, 9027.8, 9147.6,
  9339.8, 9459.6, 9579.6, 9699.8, 9819.8, 9939.8, 10059.6, 10179.6, 10299.8, 10419.8,
  10650, 10794, 10938, 11082, 11226, 11370, 11514.4, 11658.2, 11802.2, 11946.2,
  12176.6, 12320.6, 12464.6, 12608.6, 12752.4, 12896.4, 13040.4, 13184.4, 13328.4, 13472.4,
  13741.2, 13909.2, 14077.4, 14245.4, 14413.4, 14581.4, 14749.4, 14917.6, 15085.2, 15253.2,
  15522, 15690.2, 15858.2, 16026.2, 16194.2, 16362.2, 16530.4, 16698, 16866, 17034,
  17341.4, 17533.2, 17725.4, 17917.4, 18109.4, 18301.2, 18493.4, 18685.4, 18877.6, 19069.2,
  19376.6, 19568.4, 19760.6, 19952.6, 20144.6, 20336.4, 20528.6, 20720.6, 20912.8, 21104.4,
  21450, 21666.2, 21882, 22098.2, 22314.4, 22530.2, 22746.2, 22962, 23178.2, 23394.4,
  23739.6, 23955.8, 24172, 24387.8, 24603.8, 24819.6, 25035.8, 25252, 25467.8, 25683.8,
  26067.8, 26308, 26547.8, 26787.6, 27027.8, 27267.8, 27507.8, 27747.8, 27988, 28227.8,
  28611.6, 28851.8, 29091.6, 29331.8, 29571.8, 29812, 30051.8, 30291.6, 30531.8, 30771.8,
  31155.8, 31395.8, 31636, 31875.8, 32115.6, 32355.8, 32595.8, 32836, 33075.8, 33416,
  33799.8, 34040, 34279.8, 34519.6, 34759.8, 34999.8, 35240, 35479.8, 35719.6, 35959.8,
  36343.6, 36583.8, 36823.8, 37064, 37303.8, 37544, 37783.8, 38023.8, 38263.8, 38503.8,
  38887.8, 39127.8, 39367.6, 39608, 39847.8, 40087.8, 40327.8, 40568, 40808, 41047.8,
  41431.8, 41671.8, 41912, 42151.8, 42391.8, 42631.8, 42871.6, 43112, 43351.8, 43591.8,
  43975.8, 44216, 44456, 44695.8, 44935.8, 45175.6, 45416, 45655.8, 45895.8, 46135.8,
  46376, 46616, 46855.8, 47095.8, 47335.6, 47576, 47815.8, 48055.8, 48295.8, 48535.8,
  48775.8, 49015.8, 49255.8, 49495.8, 49735.8, 49975.8, 50215.8, 50455.8, 50695.8, 50935.8,
  51175.8, 51415.8, 51655.8, 51895.8, 52135.8, 52375.8, 52615.8, 52855.8, 53095.8, 53335.8,
  53575.8, 53815.8, 54055.8, 54295.8, 54535.8, 54775.8, 55015.8, 55255.8, 55495.8, 55735.8,
  55975.8, 56215.8, 56455.8, 56695.8, 56935.8, 57175.8, 57415.8, 57655.8, 57895.8, 58135.8
];

const UR_ATTACKER_DEFENSE_GROWTH = [
  0, 4, 8, 12, 16, 20, 24, 28, 32, 36,
  40, 44, 48, 52, 56, 61, 66, 71, 76, 81,
  86, 91, 96, 101, 106, 112, 118, 124, 130, 136,
  148, 155, 162, 169, 176, 183, 190, 197, 204, 211,
  224, 232, 240, 248, 256, 264, 272, 280, 288, 296,
  309, 317, 325, 333, 341, 349, 357, 365, 373, 381,
  398, 408, 418, 428, 438, 448, 458, 468, 478, 488,
  508, 520, 532, 544, 556, 569, 580, 592, 605, 616,
  641, 654, 668, 682, 696, 710, 724, 739, 753, 767,
  793, 810, 826, 842, 858, 873, 890, 906, 922, 938,
  968, 986, 1004, 1022, 1040, 1058, 1076, 1094, 1112, 1130,
  1160, 1178, 1196, 1214, 1232, 1250, 1268, 1286, 1304, 1322,
  1356, 1376, 1396, 1416, 1436, 1456, 1476, 1496, 1516, 1536,
  1570, 1590, 1610, 1630, 1650, 1670, 1690, 1710, 1730, 1750,
  1790, 1814, 1838, 1862, 1886, 1910, 1934, 1958, 1982, 2006,
  2046, 2070, 2094, 2119, 2142, 2166, 2190, 2215, 2238, 2262,
  2311, 2340, 2369, 2398, 2427, 2456, 2485, 2514, 2542, 2571,
  2620, 2649, 2678, 2707, 2736, 2765, 2794, 2823, 2852, 2881,
  2936, 2969, 3002, 3035, 3068, 3101, 3134, 3167, 3200, 3233,
  3288, 3321, 3354, 3387, 3420, 3453, 3486, 3519, 3552, 3585,
  3646, 3683, 3720, 3758, 3795, 3832, 3869, 3906, 3943, 3980,
  4040, 4077, 4114, 4151, 4188, 4225, 4263, 4300, 4337, 4374,
  4442, 4483, 4524, 4565, 4606, 4647, 4688, 4729, 4770, 4811,
  4879, 4920, 4961, 5002, 5043, 5084, 5125, 5166, 5207, 5248,
  5316, 5357, 5398, 5439, 5480, 5522, 5562, 5604, 5644, 5686,
  5753, 5795, 5836, 5877, 5918, 5959, 6000, 6041, 6082, 6123,
  6191, 6232, 6273, 6314, 6355, 6396, 6437, 6478, 6519, 6560,
  6628, 6669, 6710, 6751, 6792, 6833, 6874, 6915, 6956, 6997,
  7065, 7106, 7147, 7188, 7230, 7270, 7311, 7352, 7394, 7435,
  7502, 7543, 7585, 7626, 7667, 7708, 7749, 7790, 7831, 7872,
  7912, 7952, 7992, 8032, 8072, 8112, 8152, 8192, 8232, 8272,
  8312, 8352, 8392, 8432, 8472, 8512, 8552, 8592, 8632, 8672,
  8712, 8752, 8792, 8832, 8872, 8912, 8952, 8992, 9032, 9072,
  9112, 9152, 9192, 9232, 9272, 9312, 9352, 9392, 9432, 9472,
  9512, 9552, 9592, 9632, 9672, 9712, 9752, 9792, 9832, 9872
];

const UR_ATTACKER_HP_GROWTH = [
  0, 600, 1200, 1800, 2400, 3000, 3600, 4200, 4800, 5400,
  6000, 6600, 7200, 7800, 8400, 9100, 9900, 10600, 11400, 12100,
  12900, 13600, 14400, 15100, 15900, 16800, 17700, 18600, 19500, 20400,
  22100, 23200, 24200, 25300, 26300, 27400, 28400, 29500, 30500, 31600,
  33600, 34800, 36000, 37200, 38400, 39600, 40800, 42000, 43200, 44400,
  46400, 47600, 48800, 50000, 51200, 52400, 53600, 54800, 56000, 57200,
  59700, 61200, 62700, 64200, 65600, 67200, 68700, 70200, 71700, 73200,
  76200, 78000, 79800, 81600, 83400, 85200, 87000, 88800, 90600, 92400,
  96600, 99400, 102300, 105200, 108100, 111100, 114100, 117200, 120300, 123400,
  128700, 132200, 135800, 139500, 143900, 146900, 150700, 154600, 158500, 162400,
  168800, 173200, 177700, 182200, 186800, 191400, 196100, 200900, 205700, 210500,
  217700, 222700, 227800, 232900, 238100, 243400, 248700, 254100, 259500, 265000,
  273700, 279800, 285900, 292200, 298500, 304800, 311300, 317800, 324500, 331200,
  340600, 347300, 354100, 361000, 367900, 374900, 381900, 389100, 396300, 403700,
  415700, 424100, 432700, 441300, 450100, 458900, 467900, 476900, 486000, 495200,
  508600, 518000, 527600, 537300, 547100, 557000, 567000, 577100, 587300, 597700,
  614200, 625800, 637700, 649600, 661700, 673900, 686200, 698700, 711300, 724100,
  742300, 755400, 768600, 782000, 795500, 809200, 823000, 836900, 851100, 865300,
  893400, 915400, 937800, 960600, 984000, 1007700, 1031900, 1056600, 1081800, 1107500,
  1141100, 1167900, 1195200, 1223000, 1251300, 1280200, 1309600, 1339600, 1370100, 1401300,
  1432700, 1454800, 1477100, 1499600, 1522300, 1545100, 1568200, 1591500, 1615000, 1638800,
  1672700, 1696900, 1721300, 1745900, 1770700, 1795800, 1821000, 1846500, 1872200, 1898100,
  1937900, 1966100, 1994500, 2023300, 2052200, 2081500, 2110900, 2140700, 2170700, 2200900,
  2244900, 2274700, 2305800, 2337200, 2368900, 2400800, 2433000, 2465500, 2498200, 2531200,
  2577700, 2611400, 2645300, 2679600, 2714100, 2749000, 2784100, 2819500, 2855200, 2891300,
  2941500, 2978200, 3015200, 3052500, 3090200, 3128200, 3166400, 3205000, 3244000, 3283200,
  3337200, 3377000, 3417100, 3457600, 3498300, 3539400, 3580900, 3622600, 3664800, 3707200,
  3765500, 3808700, 3852300, 3896300, 3940600, 3985300, 4030300, 4075700, 4121500, 4167600,
  4230400, 4277400, 4324800, 4372500, 4420600, 4469100, 4518000, 4567300, 4617000, 4667100,
  4734800, 4785700, 4837100, 4888900, 4941200, 4993800, 5046900, 5100300, 5154200, 5790000,
  5850000, 5910000, 5970000, 6030000, 6090000, 6150000, 6210000, 6270000, 6330000, 6390000,
  6450000, 6510000, 6570000, 6630000, 6690000, 6750000, 6810000, 6870000, 6930000, 6990000,
  7050000, 7110000, 7170000, 7230000, 7290000, 7350000, 7410000, 7470000, 7530000, 7590000,
  7650000, 7710000, 7770000, 7830000, 7890000, 7950000, 8010000, 8070000, 8130000, 8190000,
  8250000, 8310000, 8370000, 8430000, 8490000, 8550000, 8610000, 8670000, 8730000, 8790000
];

export const UR_ATTACKER_RAW_LEVEL_GROWTH = {
  attack: UR_ATTACKER_ATTACK_GROWTH,
  defense: UR_ATTACKER_DEFENSE_GROWTH,
  hp: UR_ATTACKER_HP_GROWTH
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLevel(level) {
  return clamp(
    Math.floor(Number(level) || PALMON_MIN_LEVEL),
    PALMON_MIN_LEVEL,
    PALMON_MAX_LEVEL
  );
}

function assertRole(role) {
  if (!PALMON_ROLE_PERCENT_BONUSES[role]) {
    throw new Error(
      `Unknown Palmon role: ${role}`
    );
  }
}

function assertRarity(rarity) {
  if (!PALMON_RARITY_LEVEL_FACTORS[rarity]) {
    throw new Error(`Unknown Palmon rarity: ${rarity}`);
  }
}

// ========================================
// RAW LEVEL GROWTH
// ========================================
//
// Liefert ausschließlich den kumulativen
// RAW-Levelzuwachs relativ zu Lv1.
//
// Die RAW-Levelkurve ist unabhängig von:
// - Attacker / Defender
// - Role +20%
// - Rarity 4★ Trait
// - Bloodmoon
// - Achievements
// - Research
// - Boss Palmon
// - etc.
//
// Die Mantleray-Referenzkurve stammt von einem
// UR Attacker.
//
// Da dessen sichtbare ATK-Levelkurve bereits den
// Attacker-Effekt repräsentierte, wird die
// gespeicherte Attack-Referenz hier durch 1.20
// normalisiert.
//
// DEF und HP benötigen bei einem Attacker keine
// solche Rollenkorrektur.
// ========================================

export function getRawLevelGrowth({
  level,
  rarity
}) {
  const normalizedLevel =
    normalizeLevel(level);

  assertRarity(rarity);

  const index =
    normalizedLevel - 1;


  // --------------------------------------
  // NEUTRALE UR-RAW-KURVE
  // --------------------------------------

  const neutralUrGrowth = {
    attack:
      UR_ATTACKER_RAW_LEVEL_GROWTH
        .attack[index] / 1.2,

    defense:
      UR_ATTACKER_RAW_LEVEL_GROWTH
        .defense[index],

    hp:
      UR_ATTACKER_RAW_LEVEL_GROWTH
        .hp[index]
  };


  // --------------------------------------
  // RARITY LEVEL FACTORS
  // --------------------------------------

  const rarityFactors =
    PALMON_RARITY_LEVEL_FACTORS[
      rarity
    ];


  return {
    attack:
      neutralUrGrowth.attack *
      rarityFactors.attack,

    defense:
      neutralUrGrowth.defense *
      rarityFactors.defense,

    hp:
      neutralUrGrowth.hp *
      rarityFactors.hp
  };
}

// ========================================
// RAW STATS AT LEVEL
// ========================================
//
// Berechnet die RAW-Stats eines Palmons,
// bevor irgendwelche Prozentboni angewendet
// werden.
//
// level1Stats müssen ebenfalls RAW-Stats sein.
// ========================================

export function getRawStatsAtLevel({
  level,
  rarity,
  level1Stats
}) {
  const growth =
    getRawLevelGrowth({
      level,
      rarity
    });

  return {
    attack:
      (
        Number(
          level1Stats?.attack
        ) || 0
      ) +
      growth.attack,

    defense:
      (
        Number(
          level1Stats?.defense
        ) || 0
      ) +
      growth.defense,

    hp:
      (
        Number(
          level1Stats?.hp
        ) || 0
      ) +
      growth.hp
  };
}

// ========================================
// RAW LEVEL 1 STATS
// ========================================
//
// Rechnet einen bereits vollständig von
// %-Boni / Flat-Boni / Ascension bereinigten
// RAW-Wert auf Lv1 zurück.
// ========================================

export function getRawLevel1Stats({
  level,
  rarity,
  targetStats
}) {
  const growth =
    getRawLevelGrowth({
      level,
      rarity
    });

  return {
    attack:
      (
        Number(
          targetStats?.attack
        ) || 0
      ) -
      growth.attack,

    defense:
      (
        Number(
          targetStats?.defense
        ) || 0
      ) -
      growth.defense,

    hp:
      (
        Number(
          targetStats?.hp
        ) || 0
      ) -
      growth.hp
  };
}

// ========================================
// INTRINSIC PALMON PERCENT BONUSES
// ========================================
//
// Enthält ausschließlich Boni, die direkt
// zum Palmon selbst gehören:
//
// - Attacker / Defender Rolle
// - Rarity Trait ab 4★
//
// Beispiel:
//
// UR Attacker 3★:
// ATK +20%
//
// UR Attacker 4★:
// ATK +40%
// DEF +20%
// HP  +20%
//
// UR Defender 4★:
// ATK +20%
// DEF +40%
// HP  +40%
//
// includeRarityTrait=false kann später für
// den Ascension-Vorschau-Screen benutzt werden,
// da dieser den 4★-Trait offenbar nicht anzeigt.
// ========================================

export function getIntrinsicPalmonPercentBonuses({
  rarity,
  role,
  stars = 0,
  includeRarityTrait = true
}) {
  assertRarity(rarity);
  assertRole(role);

  const roleBonus =
    PALMON_ROLE_PERCENT_BONUSES[
      role
    ];

  const normalizedStars =
    Math.max(
      0,
      Math.floor(
        Number(stars) || 0
      )
    );


  const rarityTraitActive =
    includeRarityTrait &&
    normalizedStars >= 4;


  const rarityTraitValue =
    rarityTraitActive
      ? PALMON_RARITY_TRAIT_PERCENT[
          rarity
        ]
      : 0;


  return {
    attack:
      roleBonus.attack +
      rarityTraitValue,

    defense:
      roleBonus.defense +
      rarityTraitValue,

    hp:
      roleBonus.hp +
      rarityTraitValue
  };
}

// ========================================
// BLOODMOON
// ========================================
//
// Experimentell bestätigt:
// (RAW + FLAT) * (1 + SUM_PERCENT / 100)
//
// Bloodmoon bleibt bewusst außerhalb
// der eigentlichen Levelkurve.
// ========================================

export const BLOODMOON_BOOSTS = [
  {
    level: 250,
    effects: [
      { stat: "attack", value: 500, unit: "flat" }
    ]
  },
  {
    level: 260,
    effects: [
      { stat: "hp", value: 100000, unit: "flat" }
    ]
  },
  {
    level: 270,
    effects: [
      { stat: "attack", value: 2, unit: "percent" },
      { stat: "defense", value: 2, unit: "percent" },
      { stat: "hp", value: 2, unit: "percent" }
    ]
  },
  {
    level: 280,
    effects: [
      { stat: "rageSkillDamageBonus", value: 5, unit: "percent" }
    ]
  },
  {
    level: 290,
    effects: [
      {
        stat: "rageSkillDamageTakenReduction",
        value: 5,
        unit: "percent"
      }
    ]
  },
  {
    level: 300,
    effects: [
      { stat: "finalDamage", value: 5, unit: "percent" },
      {
        stat: "finalDamageTakenReduction",
        value: 5,
        unit: "percent"
      }
    ]
  },
  {
    level: 310,
    effects: [
      { stat: "attack", value: 4, unit: "percent" },
      { stat: "defense", value: 4, unit: "percent" },
      { stat: "hp", value: 4, unit: "percent" }
    ]
  },
  {
    level: 320,
    effects: [
      { stat: "rageSkillDamageBonus", value: 7.5, unit: "percent" }
    ]
  },
  {
    level: 330,
    effects: [
      {
        stat: "rageSkillDamageTakenReduction",
        value: 7.5,
        unit: "percent"
      }
    ]
  },
  {
    level: 340,
    effects: [
      { stat: "finalDamage", value: 7.5, unit: "percent" }
    ]
  },
  {
    level: 350,
    effects: [
      {
        stat: "finalDamageTakenReduction",
        value: 7.5,
        unit: "percent"
      }
    ]
  }
];

export function getBloodmoonBonuses(level) {
  const normalizedLevel = normalizeLevel(level);

  const result = {
    flat: {},
    percent: {},
    effects: []
  };

  BLOODMOON_BOOSTS
    .filter(boost => normalizedLevel >= boost.level)
    .forEach(boost => {
      boost.effects.forEach(effect => {
        const bucket =
          effect.unit === "flat"
            ? result.flat
            : result.percent;

        bucket[effect.stat] =
          (bucket[effect.stat] || 0) +
          effect.value;

        result.effects.push({
          ...effect,
          source: {
            type: "bloodmoon",
            level: boost.level
          }
        });
      });
    });

  return result;
}

export function applyMainStatBonuses({
  rawStats,
  flatBonuses = {},
  percentBonuses = {}
}) {
  const result = {};

  ["attack", "defense", "hp"].forEach(stat => {
    const raw =
      Number(rawStats?.[stat]) || 0;

    const flat =
      Number(flatBonuses?.[stat]) || 0;

    const percent =
      Number(percentBonuses?.[stat]) || 0;

    result[stat] =
      (raw + flat) *
      (1 + percent / 100);
  });

  return result;
}

export function roundPalmonStats(stats) {
  return {
    attack: Math.round(Number(stats?.attack) || 0),
    defense: Math.round(Number(stats?.defense) || 0),
    hp: Math.round(Number(stats?.hp) || 0)
  };
}
