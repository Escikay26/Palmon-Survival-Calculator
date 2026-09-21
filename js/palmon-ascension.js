// ========================================
// PALMON ASCENSION MODEL
// ========================================
//
// Dieses Modul beschreibt die bestätigte
// FORM der Ascension-Kurve.
//
// Noch NICHT endgültig bestätigt:
// - wie stark die Ascension absolut mit Level,
//   Palmon-Basiswert oder einem anderen Faktor skaliert
//
// Deshalb:
// - Kurvenform = fest
// - absolute Scale = separat
//
// Palmon-Skills wie der +20%-Skill ab 4★
// gehören NICHT hierher.
// ========================================


// ========================================
// ASCENSION STATES
// ========================================
//
// Reihenfolge:
//
// 0-0
// 0-1
// 0-2
// 0-3
// 0-4
// 1-0
// ...
// 4-4
// 5-0
//
// Insgesamt 26 Zustände.
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
// UNIVERSAL ASCENSION CURVE
// ========================================
//
// Diese Werte beschreiben NICHT direkt Stats.
//
// Sie beschreiben die relative Form der Kurve.
//
// Referenz:
// 0-0 = 0
//
// Die Werte basieren auf der vollständigen
// UR-Messreihe.
//
// Für ATK/DEF ist die Kurve innerhalb eines
// Sternblocks fast linear.
//
// HP steigt innerhalb höherer Sternblöcke
// deutlich progressiver.
//
// Deshalb gibt es getrennte Kurven je Stat.
// ========================================

export const UR_ASCENSION_CURVE = {
  attack: [
    0,

    1,
    2,
    3,
    4,
    5,

    6.537,
    8.074,
    9.611,
    11.148,
    12.685,

    14.689,
    16.693,
    18.697,
    20.701,
    22.705,

    25.455,
    28.205,
    30.955,
    33.705,
    36.455,

    39.205,
    43.943,
    48.681,
    53.419,
    58.157,

    62.895
  ],

  defense: [
    0,

    1,
    2,
    3,
    4,
    5,

    6.533,
    8.066,
    9.599,
    11.132,
    12.665,

    14.665,
    16.665,
    18.665,
    20.665,
    22.665,

    25.375,
    28.085,
    30.795,
    33.505,
    36.215,

    38.925,
    43.405,
    47.885,
    52.365,
    56.845,

    61.325
  ],

  hp: [
    0,

    1,
    2.897,
    5.010,
    7.359,
    9.968,

    12.727,
    15.747,
    19.045,
    22.646,
    26.574,

    31.144,
    36.213,
    41.767,
    47.843,
    54.497,

    61.775,
    70.737,
    80.588,
    91.391,
    103.242,

    116.235,
    135.550,
    156.525,
    179.435,
    204.432,

    231.738
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


// ========================================
// ASCENSION STATE INDEX
// ========================================

export function getAscensionStateIndex({
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
    normalizedStars * 5
    + normalizedSubLevel
  );
}


// ========================================
// CURVE VALUE
// ========================================
//
// Liefert nur die relative Kurvenposition.
//
// Beispiel:
// 0-0 => 0
// 0-1 => erster Ascension-Schritt
// 5-0 => maximale gemessene Kurvenposition
// ========================================

export function getAscensionCurveValue({
  stat,
  stars,
  subLevel = 0
}) {
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


  return curve[index];
}


// ========================================
// ASCENSION SCALE
// ========================================
//
// Noch nicht endgültig geklärt.
//
// Die Scale beschreibt:
// Wie viel RAW-Stat entspricht
// einer Kurveneinheit?
//
// Deshalb wird sie aktuell von außen
// übergeben.
//
// Später kann diese Funktion intern
// durch eine bestätigte Formel ersetzt werden.
// ========================================

export function getRawAscensionGrowth({
  stars,
  subLevel = 0,
  scale
}) {
  const attackScale =
    Number(
      scale?.attack
    ) || 0;

  const defenseScale =
    Number(
      scale?.defense
    ) || 0;

  const hpScale =
    Number(
      scale?.hp
    ) || 0;


  return {
    attack:
      getAscensionCurveValue({
        stat: "attack",
        stars,
        subLevel
      }) *
      attackScale,

    defense:
      getAscensionCurveValue({
        stat: "defense",
        stars,
        subLevel
      }) *
      defenseScale,

    hp:
      getAscensionCurveValue({
        stat: "hp",
        stars,
        subLevel
      }) *
      hpScale
  };
}


// ========================================
// CALIBRATE SCALE
// ========================================
//
// Falls wir für einen Palmon kennen:
//
// 0-0 Stats
// und
// 0-1 Stats
//
// können wir daraus eine temporäre
// Ascension-Scale ableiten.
//
// WICHTIG:
// Die übergebenen Werte müssen RAW sein,
// also vorher von Prozentboni bereinigt.
// ========================================

export function calibrateAscensionScale({
  stateA,
  stateB,
  rawStatsA,
  rawStatsB
}) {
  const indexA =
    getAscensionStateIndex(
      stateA
    );

  const indexB =
    getAscensionStateIndex(
      stateB
    );


  if (indexA === indexB) {
    throw new Error(
      "Ascension calibration states must be different."
    );
  }


  const result = {};


  [
    "attack",
    "defense",
    "hp"
  ].forEach(
    stat => {

      const curve =
        UR_ASCENSION_CURVE[
          stat
        ];

      const curveDelta =
        curve[indexB] -
        curve[indexA];

      const statDelta =
        (
          Number(
            rawStatsB?.[stat]
          ) || 0
        ) -
        (
          Number(
            rawStatsA?.[stat]
          ) || 0
        );


      result[stat] =
        curveDelta !== 0
          ? statDelta /
            curveDelta
          : 0;

    }
  );


  return result;
}


// ========================================
// APPLY ASCENSION TO RAW STATS
// ========================================

export function applyAscensionToRawStats({
  rawStats,
  stars,
  subLevel = 0,
  scale
}) {
  const growth =
    getRawAscensionGrowth({
      stars,
      subLevel,
      scale
    });


  return {
    attack:
      (
        Number(
          rawStats?.attack
        ) || 0
      ) +
      growth.attack,

    defense:
      (
        Number(
          rawStats?.defense
        ) || 0
      ) +
      growth.defense,

    hp:
      (
        Number(
          rawStats?.hp
        ) || 0
      ) +
      growth.hp
  };
}
