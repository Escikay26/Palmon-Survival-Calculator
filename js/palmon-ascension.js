// ========================================
// PALMON ASCENSION MODEL
// ========================================
//
// Ascension:
// 0-0 -> 0-1 -> ... -> 4-4 -> 5-0
//
// Insgesamt 26 Zustände.
//
// BESTÄTIGT / STARK BESTÄTIGT:
//
// - Ascension Growth ist nicht vom
//   Palmon-Level abhängig.
//
// - Die UR-Ascension-Kurvenform ist bei
//   verschiedenen UR-Palmons praktisch gleich.
//
// - ATK, DEF und HP besitzen unterschiedliche
//   Kurvenformen.
//
// - Der Palmon-Skill ab 4★ gehört NICHT
//   zur Ascension.
//
// - Account-%, Traits, Squad-Boni,
//   Bloodmoon usw. gehören NICHT hierher.
//
// AKTUELLER MODELLSTAND:
//
// Für UR wird ein universeller RAW-Scale
// verwendet.
//
// Dieser Scale ist durch mehrere Messreihen
// stark gestützt, aber noch nicht direkt
// aus Game Data bestätigt.
//
// Deshalb kann der Scale weiterhin optional
// überschrieben werden.
//
// SSR / SR Ascension ist noch nicht bestätigt
// und wird deshalb bewusst NICHT geraten.
//
// ========================================


// ========================================
// ASCENSION STATES
// ========================================

export const ASCENSION_STATES = [
  { stars: 0, subLevel: 0 },
  { stars: 0, subLevel: 1 },
  { stars: 0, subLevel: 2 },
  { stars: 0, subLevel: 3 },
  { stars: 0, subLevel: 4 },

  { stars: 1, subLevel: 0 },
  { stars: 1, subLevel: 1 },
  { stars: 1, subLevel: 2 },
  { stars: 1, subLevel: 3 },
  { stars: 1, subLevel: 4 },

  { stars: 2, subLevel: 0 },
  { stars: 2, subLevel: 1 },
  { stars: 2, subLevel: 2 },
  { stars: 2, subLevel: 3 },
  { stars: 2, subLevel: 4 },

  { stars: 3, subLevel: 0 },
  { stars: 3, subLevel: 1 },
  { stars: 3, subLevel: 2 },
  { stars: 3, subLevel: 3 },
  { stars: 3, subLevel: 4 },

  { stars: 4, subLevel: 0 },
  { stars: 4, subLevel: 1 },
  { stars: 4, subLevel: 2 },
  { stars: 4, subLevel: 3 },
  { stars: 4, subLevel: 4 },

  { stars: 5, subLevel: 0 }
];


// ========================================
// UR ASCENSION CURVE
// ========================================
//
// Die Werte sind KUMULATIV relativ zu 0-0.
//
// Beispiel:
//
// 0-0 = 0
// 0-1 = 1
//
// Der erste Ascension-Schritt entspricht
// also exakt einer RAW-Scale-Einheit.
//
// Die Kurven wurden aus den gemessenen
// Lucidina- und Escarffier-Reihen
// normalisiert.
//
// Bis einschließlich 4-0:
// Mittel aus beiden Messreihen.
//
// Ab 4-1:
// Lucidina wurde um den ab 4★ aktiven
// +20%-Skill bereinigt.
//
// WICHTIG:
// Genau 26 Werte pro Stat.
// ========================================

export const UR_ASCENSION_CURVE = {
  attack: [
    0,
    1,
    1.999751,
    2.999751,
    3.999751,
    4.999503,

    6.536077,
    8.072900,
    9.609474,
    11.146049,
    12.682084,

    14.687140,
    16.691948,
    18.696217,
    20.700485,
    22.704754,

    25.456961,
    28.209168,
    30.961914,
    33.713333,
    36.465540,

    40.412279,
    44.359018,
    48.305757,
    52.252496,

    56.199235
  ],

  defense: [
    0,
    1,
    2.000022,
    3.003333,
    4.003355,
    5.003377,

    6.534746,
    8.072717,
    9.607398,
    11.142079,
    12.673449,

    14.676782,
    16.676826,
    18.676847,
    20.680180,
    22.680202,

    25.393125,
    28.109337,
    30.818948,
    33.531871,
    36.244772,

    40.071542,
    43.903794,
    47.730564,
    51.562816,

    55.389586
  ],

  hp: [
    0,
    1,
    3.843180,
    7.007361,
    10.528503,
    14.441858,

    18.581518,
    23.109382,
    28.054827,
    33.452708,
    39.339883,

    46.742153,
    54.860488,
    63.759379,
    73.506980,
    84.178755,

    97.327503,
    111.771677,
    127.622441,
    145.001969,
    164.041884,

    187.742265,
    213.738599,
    242.221944,
    273.400244,

    307.498587
  ]
};


// ========================================
// UR RAW ASCENSION SCALE
// ========================================
//
// Bedeutet:
//
// Wie viel RAW-Stat entspricht
// einer Kurveneinheit?
//
// Da:
//
// 0-0 = 0
// 0-1 = 1
//
// entspricht dieser Wert gleichzeitig
// dem RAW-Zuwachs von:
//
// 0-0 -> 0-1
//
// Aktuelle Kalibrierung:
//
// Escarffier UR Defender
// gleiche Account-Boni
// Lv1 / Lv100
//
// Account-Multiplikator wurde über die
// bekannte RAW-Levelkurve herausgerechnet.
//
// Unabhängige ältere Mantleray-Messungen
// liegen sehr nahe an denselben Werten.
//
// Die Werte sind deshalb aktuell unser
// bester UR-Default.
//
// Noch nicht direkt aus Game Data bestätigt.
// ========================================

export const UR_ASCENSION_RAW_SCALE = {
  attack: 261.46,
  defense: 45.134,
  hp: 8250.97
};


// ========================================
// MODEL INFO
// ========================================

export const PALMON_ASCENSION_MODEL_INFO = {
  supportedRarities: [
    "UR"
  ],

  referenceRarity:
    "UR",

  curveStateCount:
    ASCENSION_STATES.length,

  scaleStatus:
    "provisional-but-strongly-supported",

  levelDependent:
    false,

  fourStarSkillIncluded:
    false,

  notes: [
    "UR Ascension verwendet eine universelle stat-spezifische Kurvenform.",
    "Ascension RAW Growth ist nicht vom Palmon-Level abhängig.",
    "Der +20%-Palmon-Skill ab 4★ ist nicht Teil der Ascension.",
    "Der UR RAW Scale ist experimentell stark gestützt, aber noch nicht direkt aus Game Data bestätigt.",
    "Der Scale kann zu Testzwecken weiterhin überschrieben werden.",
    "SSR- und SR-Ascension werden noch nicht geraten."
  ]
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


function normalizeRarity(
  rarity
) {
  return String(
    rarity || "UR"
  )
    .trim()
    .toUpperCase();
}


function isFiniteNumber(
  value
) {
  return Number.isFinite(
    Number(value)
  );
}


// ========================================
// SUPPORTED RARITY
// ========================================

export function isAscensionRaritySupported(
  rarity
) {
  const normalizedRarity =
    normalizeRarity(
      rarity
    );

  return (
    normalizedRarity === "UR"
  );
}


function assertSupportedRarity(
  rarity
) {
  const normalizedRarity =
    normalizeRarity(
      rarity
    );

  if (
    !isAscensionRaritySupported(
      normalizedRarity
    )
  ) {
    throw new Error(
      `Ascension model for rarity "${normalizedRarity}" is not confirmed yet.`
    );
  }

  return normalizedRarity;
}


// ========================================
// MODEL VALIDATION
// ========================================
//
// Verhindert, dass Kurven und States später
// unbemerkt unterschiedliche Längen haben.
// ========================================

export function validateAscensionModel() {
  const expectedLength =
    ASCENSION_STATES.length;

  [
    "attack",
    "defense",
    "hp"
  ]
    .forEach(
      stat => {

        const curve =
          UR_ASCENSION_CURVE[
            stat
          ];

        if (
          !Array.isArray(
            curve
          )
        ) {
          throw new Error(
            `Ascension curve "${stat}" is missing.`
          );
        }

        if (
          curve.length !==
          expectedLength
        ) {
          throw new Error(
            `Ascension curve "${stat}" contains ${curve.length} values, but ${expectedLength} states exist.`
          );
        }

      }
    );

  return true;
}


// Direkt beim Laden prüfen.

validateAscensionModel();


// ========================================
// ASCENSION STATE INDEX
// ========================================
//
// 0-0 = 0
// 0-1 = 1
// ...
// 4-4 = 24
// 5-0 = 25
// ========================================

export function getAscensionStateIndex({
  stars,
  subLevel = 0
} = {}) {
  const normalizedStars =
    normalizeStars(
      stars
    );

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
    normalizedStars * 5
    +
    normalizedSubLevel
  );
}


// ========================================
// GET STATE BY INDEX
// ========================================

export function getAscensionStateByIndex(
  index
) {
  const normalizedIndex =
    clamp(
      Math.floor(
        Number(index) || 0
      ),
      0,
      ASCENSION_STATES.length - 1
    );

  return {
    ...ASCENSION_STATES[
      normalizedIndex
    ]
  };
}


// ========================================
// CURVE VALUE
// ========================================
//
// Liefert nur die relative Kurvenposition.
//
// Noch KEIN RAW-Stat.
// ========================================

export function getAscensionCurveValue({
  stat,
  stars,
  subLevel = 0,
  rarity = "UR"
} = {}) {
  assertSupportedRarity(
    rarity
  );


  const curve =
    UR_ASCENSION_CURVE[
      stat
    ];


  if (!curve) {
    throw new Error(
      `Unknown ascension stat: ${stat}`
    );
  }


  const index =
    getAscensionStateIndex({
      stars,
      subLevel
    });


  return curve[
    index
  ];
}


// ========================================
// GET ASCENSION SCALE
// ========================================
//
// Standard:
//
// UR_ASCENSION_RAW_SCALE
//
// Optional:
//
// scale kann zum Testen überschrieben werden.
//
// Beispiel:
//
// scale: {
//   attack: 260,
//   defense: 45,
//   hp: 8250
// }
//
// Fehlende Werte im Override fallen auf
// den UR-Default zurück.
// ========================================

export function getAscensionScale({
  rarity = "UR",
  scale = null
} = {}) {
  const normalizedRarity =
    assertSupportedRarity(
      rarity
    );


  if (
    normalizedRarity !== "UR"
  ) {
    throw new Error(
      `No ascension scale available for rarity "${normalizedRarity}".`
    );
  }


  const fallback =
    UR_ASCENSION_RAW_SCALE;


  return {
    attack:
      isFiniteNumber(
        scale?.attack
      )
        ? Number(
            scale.attack
          )
        : fallback.attack,

    defense:
      isFiniteNumber(
        scale?.defense
      )
        ? Number(
            scale.defense
          )
        : fallback.defense,

    hp:
      isFiniteNumber(
        scale?.hp
      )
        ? Number(
            scale.hp
          )
        : fallback.hp
  };
}


// ========================================
// RAW ASCENSION GROWTH
// ========================================
//
// Liefert ausschließlich:
//
// RAW Ascension Growth
//
// NICHT enthalten:
//
// - RAW Lv1
// - Level Growth
// - Evolution
// - Flat Bonuses
// - Rollen-%
// - Traits
// - Skills
// - Bloodmoon
// - Research
// - Achievements
// - Boss
// - Squad-Boni
//
// Beispiel:
//
// getRawAscensionGrowth({
//   rarity: "UR",
//   stars: 1,
//   subLevel: 0
// });
//
// ========================================

export function getRawAscensionGrowth({
  stars,
  subLevel = 0,
  rarity = "UR",
  scale = null
} = {}) {
  const ascensionScale =
    getAscensionScale({
      rarity,
      scale
    });


  return {
    attack:
      getAscensionCurveValue({
        stat:
          "attack",

        stars,
        subLevel,
        rarity
      })
      *
      ascensionScale.attack,


    defense:
      getAscensionCurveValue({
        stat:
          "defense",

        stars,
        subLevel,
        rarity
      })
      *
      ascensionScale.defense,


    hp:
      getAscensionCurveValue({
        stat:
          "hp",

        stars,
        subLevel,
        rarity
      })
      *
      ascensionScale.hp
  };
}


// ========================================
// RAW ASCENSION STEP GROWTH
// ========================================
//
// Praktisch für Tests.
//
// Beispiel:
//
// 0-0 -> 0-1
//
// oder
//
// 3-4 -> 4-0
//
// ========================================

export function getRawAscensionStepGrowth({
  from,
  to,
  rarity = "UR",
  scale = null
} = {}) {
  const fromGrowth =
    getRawAscensionGrowth({
      stars:
        from?.stars ?? 0,

      subLevel:
        from?.subLevel ?? 0,

      rarity,
      scale
    });


  const toGrowth =
    getRawAscensionGrowth({
      stars:
        to?.stars ?? 0,

      subLevel:
        to?.subLevel ?? 0,

      rarity,
      scale
    });


  return {
    attack:
      toGrowth.attack
      -
      fromGrowth.attack,

    defense:
      toGrowth.defense
      -
      fromGrowth.defense,

    hp:
      toGrowth.hp
      -
      fromGrowth.hp
  };
}


// ========================================
// CALIBRATE SCALE
// ========================================
//
// Diagnose-/Testfunktion.
//
// Falls zwei RAW-Stat-Zustände bekannt sind,
// kann daraus der beobachtete Scale
// zurückgerechnet werden.
//
// WICHTIG:
//
// rawStatsA / rawStatsB müssen wirklich RAW
// sein.
//
// Also OHNE:
//
// - Rollen-%
// - Traits
// - Skills
// - Account-%
// - Squad-Boni
// - Bloodmoon-%
// usw.
//
// ========================================

export function calibrateAscensionScale({
  stateA,
  stateB,
  rawStatsA,
  rawStatsB,
  rarity = "UR"
} = {}) {
  assertSupportedRarity(
    rarity
  );


  const indexA =
    getAscensionStateIndex(
      stateA || {}
    );

  const indexB =
    getAscensionStateIndex(
      stateB || {}
    );


  if (
    indexA === indexB
  ) {
    throw new Error(
      "Ascension calibration states must be different."
    );
  }


  const result = {};


  [
    "attack",
    "defense",
    "hp"
  ]
    .forEach(
      stat => {

        const curve =
          UR_ASCENSION_CURVE[
            stat
          ];


        const curveDelta =
          curve[indexB]
          -
          curve[indexA];


        const statDelta =
          (
            Number(
              rawStatsB?.[
                stat
              ]
            ) || 0
          )
          -
          (
            Number(
              rawStatsA?.[
                stat
              ]
            ) || 0
          );


        result[
          stat
        ] =
          curveDelta !== 0
            ? statDelta /
              curveDelta
            : 0;

      }
    );


  return result;
}


// ========================================
// COMPARE CALIBRATED SCALE TO DEFAULT
// ========================================
//
// Praktisch für zukünftige Tests.
//
// Gibt die Abweichung zum aktuell verwendeten
// UR-Default zurück.
// ========================================

export function compareAscensionScaleToDefault(
  calibratedScale
) {
  const result = {};


  [
    "attack",
    "defense",
    "hp"
  ]
    .forEach(
      stat => {

        const expected =
          UR_ASCENSION_RAW_SCALE[
            stat
          ];


        const actual =
          Number(
            calibratedScale?.[
              stat
            ]
          ) || 0;


        result[
          stat
        ] = {
          expected,
          actual,

          difference:
            actual -
            expected,

          differencePercent:
            expected !== 0
              ? (
                  (
                    actual -
                    expected
                  )
                  /
                  expected
                )
                *
                100
              : 0
        };

      }
    );


  return result;
}


// ========================================
// APPLY ASCENSION TO RAW STATS
// ========================================
//
// rawStats sollte bereits enthalten:
//
// RAW Lv1
// +
// RAW Level Growth
//
// Danach wird Ascension addiert.
//
// Beispiel:
//
// RAW Lv1
// + Level Growth
// + Ascension Growth
//
// Noch KEINE %-Multiplikatoren.
// ========================================

export function applyAscensionToRawStats({
  rawStats,
  stars,
  subLevel = 0,
  rarity = "UR",
  scale = null
} = {}) {
  const growth =
    getRawAscensionGrowth({
      stars,
      subLevel,
      rarity,
      scale
    });


  return {
    attack:
      (
        Number(
          rawStats?.attack
        ) || 0
      )
      +
      growth.attack,


    defense:
      (
        Number(
          rawStats?.defense
        ) || 0
      )
      +
      growth.defense,


    hp:
      (
        Number(
          rawStats?.hp
        ) || 0
      )
      +
      growth.hp
  };
}
