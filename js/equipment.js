import {
  loadEquipmentState,
  saveEquipmentState
} from "./storage.js";

import {
  EQUIPMENT_MAX_LEVEL,
  EQUIPMENT_MAX_ASCENSION,
  EQUIPMENT_STAT_NAMES,
  getEquipmentDefinition,
  getEquipmentDefinitionByCategoryAndRarity,
  getEquipmentStats,
  getEquipmentAscensionLabel,
  getEquipmentEnhancementCostForLevel,
  getEquipmentAscensionCostForLevel,
  getEquipmentEnhancementStepCost,
  getEquipmentAscensionStepCost,
  normalizeEquipmentLevel,
  normalizeEquipmentAscension
} from "./palmon-equipment.js";


// ========================================
// STATE
// ========================================

let equipmentData = null;

let items = [];

let buildMode =
  "unlimited";

let temperitCounts = {
  large: 0,
  medium: 0,
  small: 0
};

let ownedOpusPearls = 0;

let budgetBaseCost = {
  enhancementXp: 0,
  opusPearls: 0
};

let budgetBaseItems = {};

let nextInstanceId = 1;

let activeAddCategory = null;

let budgetWarning = "";

let selectedEquipmentFilter =
  "all";

let collapsedItemIds =
  new Set();

let collapsedCategoryIds =
  new Set();


// ========================================
// FORMAT
// ========================================

function formatNumber(
  number
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2
    }
  ).format(
    number
  );
}


function formatMainStatValue(
  stat
) {
  if (
    stat.unit ===
    "percent"
  ) {
    return `${formatNumber(
      stat.value
    )}%`;
  }

  return formatNumber(
    stat.value
  );
}


function formatSignedNumber(
  value,
  suffix = ""
) {
  const number =
    Number(value) || 0;

  const prefix =
    number > 0
      ? "+"
      : "";

  return `${prefix}${formatNumber(
    number
  )}${suffix}`;
}


function formatEffectValue(
  effect
) {
  const value =
    Number(
      effect.value
    ) || 0;

  const prefix =
    value > 0
      ? "+"
      : "";

  if (
    effect.unit ===
    "percent"
  ) {
    return `${prefix}${formatNumber(
      value
    )}%`;
  }

  return `${prefix}${formatNumber(
    value
  )}`;
}


// ========================================
// INITIALIZE
// ========================================

export async function
initEquipmentSystem() {
  const root =
    document.getElementById(
      "equipment-root"
    );

  if (!root) {
    return;
  }

  try {
    const response =
      await fetch(
        "./data/equipment.json"
      );

    if (!response.ok) {
      throw new Error(
        `Could not load equipment.json (${response.status})`
      );
    }

    equipmentData =
      await response.json();

    loadSavedState();

    addHelpListeners();

    render();
  }

  catch (error) {
    console.error(
      "Could not load equipment data.",
      error
    );

    root.innerHTML = `
      <div class="equipment-error">
        Equipment data could not be loaded.
      </div>
    `;
  }
}


// ========================================
// SAVE / LOAD
// ========================================

function saveState() {
  saveEquipmentState({
    items,
    buildMode,
    temperitCounts,
    ownedOpusPearls,
    budgetBaseCost,
    budgetBaseItems,
    nextInstanceId
  });
}


function loadSavedState() {
  const data =
    loadEquipmentState();

  items =
    Array.isArray(
      data.items
    )
      ? data.items
          .map(
            item => ({
              instanceId:
                String(
                  item.instanceId ||
                  ""
                ),

              equipmentId:
                String(
                  item.equipmentId ||
                  ""
                ),

              enhancementLevel:
                normalizeEquipmentLevel(
                  item.enhancementLevel
                ),

              ascensionLevel:
                normalizeEquipmentAscension(
                  item.ascensionLevel
                )
            })
          )
          .filter(
            item =>
              item.instanceId &&
              getEquipmentDefinition(
                equipmentData,
                item.equipmentId
              )
          )
      : [];

  buildMode =
    data.buildMode ===
      "budget"
      ? "budget"
      : "unlimited";

  temperitCounts = {
    large:
      Math.max(
        0,
        Math.floor(
          Number(
            data.temperitCounts
              ?.large
          ) || 0
        )
      ),

    medium:
      Math.max(
        0,
        Math.floor(
          Number(
            data.temperitCounts
              ?.medium
          ) || 0
        )
      ),

    small:
      Math.max(
        0,
        Math.floor(
          Number(
            data.temperitCounts
              ?.small
          ) || 0
        )
      )
  };


  // Migration from the first Equipment
  // planner version, which allowed raw XP.
  // Temperit is the only Equipment XP source,
  // so legacy XP is converted to Small Temperit.
  if (
    temperitCounts.large === 0 &&
    temperitCounts.medium === 0 &&
    temperitCounts.small === 0 &&
    Number(
      data.legacyEnhancementXp
    ) > 0
  ) {
    const smallTemperitXp =
      Number(
        equipmentData
          ?.enhancement
          ?.temperitXp
          ?.small
      ) || 10;

    temperitCounts.small =
      Math.floor(
        Number(
          data.legacyEnhancementXp
        ) /
        smallTemperitXp
      );

    if (
      Number(
        data.legacyEnhancementXp
      ) %
        smallTemperitXp !==
      0
    ) {
      console.warn(
        "Legacy Equipment XP could not be converted to Temperit without a remainder."
      );
    }
  }


  ownedOpusPearls =
    Math.max(
      0,
      Math.floor(
        Number(
          data.ownedOpusPearls
        ) || 0
      )
    );

  budgetBaseCost = {
    enhancementXp:
      Math.max(
        0,
        Number(
          data.budgetBaseCost
            ?.enhancementXp
        ) || 0
      ),

    opusPearls:
      Math.max(
        0,
        Number(
          data.budgetBaseCost
            ?.opusPearls
        ) || 0
      )
  };


  budgetBaseItems = {};

  Object.entries(
    data.budgetBaseItems ||
    {}
  ).forEach(
    ([instanceId, item]) => {

      if (
        !getItem(
          instanceId
        )
      ) {
        return;
      }

      budgetBaseItems[
        instanceId
      ] = {
        enhancementLevel:
          normalizeEquipmentLevel(
            item?.enhancementLevel
          ),

        ascensionLevel:
          normalizeEquipmentAscension(
            item?.ascensionLevel
          )
      };

    }
  );


  nextInstanceId =
    Math.max(
      1,
      Math.floor(
        Number(
          data.nextInstanceId
        ) || 1
      )
    );

  const usedNumbers =
    items
      .map(
        item =>
          Number(
            item.instanceId
              .replace(
                /^eq-/,
                ""
              )
          )
      )
      .filter(
        Number.isFinite
      );

  if (
    usedNumbers.length > 0
  ) {
    nextInstanceId =
      Math.max(
        nextInstanceId,
        Math.max(
          ...usedNumbers
        ) + 1
      );
  }


  // Migration for a Budget Build saved before
  // per-item baselines existed.
  if (
    buildMode ===
      "budget" &&
    Object.keys(
      budgetBaseItems
    ).length === 0
  ) {
    budgetBaseItems =
      createBudgetSnapshot();

    budgetBaseCost =
      calculateInventoryCost();
  }


  // Existing inventory starts compact.
  // Newly created items are opened automatically.
  collapsedItemIds =
    new Set(
      items.map(
        item =>
          item.instanceId
      )
    );


  saveState();
}


// ========================================
// INVENTORY HELPERS
// ========================================

function getItem(
  instanceId
) {
  return items.find(
    item =>
      item.instanceId ===
      instanceId
  ) || null;
}


function getDefinition(
  item
) {
  return getEquipmentDefinition(
    equipmentData,
    item?.equipmentId
  );
}


function getTemperitXpValue(
  type
) {
  return (
    Number(
      equipmentData
        ?.enhancement
        ?.temperitXp
        ?.[type]
    ) || 0
  );
}


function getOwnedEnhancementXp() {
  return (
    temperitCounts.large *
      getTemperitXpValue(
        "large"
      ) +
    temperitCounts.medium *
      getTemperitXpValue(
        "medium"
      ) +
    temperitCounts.small *
      getTemperitXpValue(
        "small"
      )
  );
}


function createBudgetSnapshot() {
  return Object.fromEntries(
    items.map(
      item => [
        item.instanceId,
        {
          enhancementLevel:
            item.enhancementLevel,

          ascensionLevel:
            item.ascensionLevel
        }
      ]
    )
  );
}


function isEquipmentItemChanged(
  item
) {

  if (
    buildMode !==
      "budget" ||
    !item
  ) {
    return false;
  }

  const base =
    budgetBaseItems[
      item.instanceId
    ];

  if (!base) {
    return false;
  }

  return (
    item.enhancementLevel !==
      normalizeEquipmentLevel(
        base.enhancementLevel
      ) ||
    item.ascensionLevel !==
      normalizeEquipmentAscension(
        base.ascensionLevel
      )
  );

}


function matchesEquipmentFilter(
  item
) {

  if (
    selectedEquipmentFilter ===
    "all"
  ) {
    return true;
  }

  if (
    selectedEquipmentFilter ===
    "changed"
  ) {
    return isEquipmentItemChanged(
      item
    );
  }

  const definition =
    getDefinition(
      item
    );

  return (
    definition?.rarity ===
    selectedEquipmentFilter
  );

}


function getBudgetBaseItem(
  instanceId
) {
  const base =
    budgetBaseItems[
      instanceId
    ];

  if (!base) {
    return null;
  }

  const current =
    getItem(
      instanceId
    );

  if (!current) {
    return null;
  }

  return {
    ...current,

    enhancementLevel:
      normalizeEquipmentLevel(
        base.enhancementLevel
      ),

    ascensionLevel:
      normalizeEquipmentAscension(
        base.ascensionLevel
      )
  };
}


function getItemDisplayName(
  item
) {
  const definition =
    getDefinition(
      item
    );

  if (!definition) {
    return "Unknown Equipment";
  }

  const matchingItems =
    items.filter(
      candidate =>
        candidate.equipmentId ===
        item.equipmentId
    );

  if (
    matchingItems.length <= 1
  ) {
    return definition.name;
  }

  const index =
    matchingItems.findIndex(
      candidate =>
        candidate.instanceId ===
        item.instanceId
    );

  return `${definition.name} #${index + 1}`;
}


function createItem(
  equipmentId
) {
  const definition =
    getEquipmentDefinition(
      equipmentData,
      equipmentId
    );

  if (!definition) {
    return;
  }

  const instanceId =
    `eq-${nextInstanceId}`;

  items.push({
    instanceId,

    equipmentId:
      definition.id,

    enhancementLevel: 0,

    ascensionLevel: 0
  });

  nextInstanceId += 1;

  collapsedItemIds.delete(
    instanceId
  );

  activeAddCategory =
    null;

  saveState();

  render();
}


function duplicateItem(
  instanceId
) {
  if (
    buildMode !==
    "unlimited"
  ) {
    return;
  }

  const source =
    getItem(
      instanceId
    );

  if (!source) {
    return;
  }

  const instanceId =
    `eq-${nextInstanceId}`;

  items.push({
    ...source,

    instanceId
  });

  nextInstanceId += 1;

  collapsedItemIds.delete(
    instanceId
  );

  saveState();

  render();
}


function removeItem(
  instanceId
) {
  if (
    buildMode !==
    "unlimited"
  ) {
    return;
  }

  const item =
    getItem(
      instanceId
    );

  if (!item) {
    return;
  }

  const confirmed =
    window.confirm(
      `Remove ${getItemDisplayName(
        item
      )} from your inventory?`
    );

  if (!confirmed) {
    return;
  }

  items =
    items.filter(
      entry =>
        entry.instanceId !==
        instanceId
    );

  collapsedItemIds.delete(
    instanceId
  );

  saveState();

  render();
}


// ========================================
// COSTS
// ========================================

function getItemCost(
  item
) {
  return {
    enhancementXp:
      getEquipmentEnhancementCostForLevel(
        equipmentData,
        item.enhancementLevel
      ),

    opusPearls:
      getEquipmentAscensionCostForLevel(
        equipmentData,
        item.ascensionLevel
      )
  };
}


function calculateInventoryCost() {
  return items.reduce(
    (
      total,
      item
    ) => {

      const cost =
        getItemCost(
          item
        );

      total.enhancementXp +=
        cost.enhancementXp;

      total.opusPearls +=
        cost.opusPearls;

      return total;

    },
    {
      enhancementXp: 0,
      opusPearls: 0
    }
  );
}


function getAvailableBudget() {
  if (
    buildMode ===
    "unlimited"
  ) {
    return {
      enhancementXp:
        Infinity,

      opusPearls:
        Infinity
    };
  }

  const currentCost =
    calculateInventoryCost();

  return {
    enhancementXp:
      (
        budgetBaseCost
          .enhancementXp +
        getOwnedEnhancementXp()
      ) -
      currentCost
        .enhancementXp,

    opusPearls:
      (
        budgetBaseCost
          .opusPearls +
        ownedOpusPearls
      ) -
      currentCost
        .opusPearls
  };
}


function getPlanCostDelta() {
  const currentCost =
    calculateInventoryCost();

  return {
    enhancementXp:
      currentCost
        .enhancementXp -
      budgetBaseCost
        .enhancementXp,

    opusPearls:
      currentCost
        .opusPearls -
      budgetBaseCost
        .opusPearls
  };
}


// ========================================
// LEVEL CHANGES
// ========================================

function setEnhancementLevel(
  instanceId,
  requestedLevel
) {
  const item =
    getItem(
      instanceId
    );

  if (!item) {
    return;
  }

  const currentLevel =
    item.enhancementLevel;

  let targetLevel =
    normalizeEquipmentLevel(
      requestedLevel
    );

  budgetWarning = "";

  if (
    buildMode ===
      "budget" &&
    targetLevel >
      currentLevel
  ) {
    const available =
      Math.max(
        0,
        getAvailableBudget()
          .enhancementXp
      );

    const currentCost =
      getEquipmentEnhancementCostForLevel(
        equipmentData,
        currentLevel
      );

    let affordableLevel =
      currentLevel;

    for (
      let level =
        currentLevel + 1;
      level <=
        targetLevel;
      level += 1
    ) {
      const targetCost =
        getEquipmentEnhancementCostForLevel(
          equipmentData,
          level
        );

      if (
        targetCost -
          currentCost <=
        available
      ) {
        affordableLevel =
          level;
      }
      else {
        break;
      }
    }

    if (
      affordableLevel <
      targetLevel
    ) {
      targetLevel =
        affordableLevel;

      budgetWarning =
        "Enhancement target was limited to the highest level your current XP budget can afford.";
    }
  }

  item.enhancementLevel =
    targetLevel;

  saveState();

  render();
}


function setAscensionLevel(
  instanceId,
  requestedAscension
) {
  const item =
    getItem(
      instanceId
    );

  if (!item) {
    return;
  }

  const currentAscension =
    item.ascensionLevel;

  let targetAscension =
    normalizeEquipmentAscension(
      requestedAscension
    );

  budgetWarning = "";

  if (
    buildMode ===
      "budget" &&
    targetAscension >
      currentAscension
  ) {
    const available =
      Math.max(
        0,
        getAvailableBudget()
          .opusPearls
      );

    const currentCost =
      getEquipmentAscensionCostForLevel(
        equipmentData,
        currentAscension
      );

    let affordableAscension =
      currentAscension;

    for (
      let ascension =
        currentAscension + 1;
      ascension <=
        targetAscension;
      ascension += 1
    ) {
      const targetCost =
        getEquipmentAscensionCostForLevel(
          equipmentData,
          ascension
        );

      if (
        targetCost -
          currentCost <=
        available
      ) {
        affordableAscension =
          ascension;
      }
      else {
        break;
      }
    }

    if (
      affordableAscension <
      targetAscension
    ) {
      targetAscension =
        affordableAscension;

      budgetWarning =
        "Ascension target was limited to the highest level your current Opus Pearl budget can afford.";
    }
  }

  item.ascensionLevel =
    targetAscension;

  saveState();

  render();
}


// ========================================
// BUILD MODE
// ========================================

function setBuildMode(
  newMode
) {
  if (
    newMode ===
    buildMode
  ) {
    return;
  }

  budgetWarning = "";

  if (
    newMode ===
    "budget"
  ) {
    budgetBaseCost =
      calculateInventoryCost();

    budgetBaseItems =
      createBudgetSnapshot();

    buildMode =
      "budget";

    activeAddCategory =
      null;
  }

  else {
    buildMode =
      "unlimited";

    budgetBaseCost = {
      enhancementXp: 0,
      opusPearls: 0
    };

    budgetBaseItems = {};
  }

  saveState();

  render();
}


function resetPlan(
  instanceId = null
) {
  if (
    buildMode !==
    "budget"
  ) {
    return;
  }

  items.forEach(
    item => {

      if (
        instanceId &&
        item.instanceId !==
          instanceId
      ) {
        return;
      }

      const base =
        budgetBaseItems[
          item.instanceId
        ];

      if (!base) {
        return;
      }

      item.enhancementLevel =
        normalizeEquipmentLevel(
          base.enhancementLevel
        );

      item.ascensionLevel =
        normalizeEquipmentAscension(
          base.ascensionLevel
        );

    }
  );

  budgetWarning = "";

  saveState();

  render();
}


// ========================================
// RENDER HELPERS
// ========================================

function renderMainStats(
  stats
) {
  return stats
    .map(
      stat => `
        <div class="equipment-stat-chip">
          <span>
            ${
              EQUIPMENT_STAT_NAMES[
                stat.stat
              ] ||
              stat.stat
            }
          </span>

          <strong>
            ${formatMainStatValue(
              stat
            )}
          </strong>
        </div>
      `
    )
    .join("");
}


function renderExtraEffects(
  effects
) {
  if (
    effects.length === 0
  ) {
    return `
      <span class="equipment-no-extra">
        No Ascension extra effects yet.
      </span>
    `;
  }

  return effects
    .map(
      effect => `
        <div class="equipment-extra-chip">
          <span>
            ${
              EQUIPMENT_STAT_NAMES[
                effect.stat
              ] ||
              effect.label ||
              effect.stat
            }
          </span>

          <strong>
            ${formatEffectValue(
              effect
            )}
          </strong>
        </div>
      `
    )
    .join("");
}


function renderPlanComparison(
  item,
  definition,
  plannedStats
) {
  if (
    buildMode !==
    "budget"
  ) {
    return "";
  }

  const baseItem =
    getBudgetBaseItem(
      item.instanceId
    );

  if (!baseItem) {
    return "";
  }

  const baseStats =
    getEquipmentStats({
      equipmentData,
      equipmentId:
        definition.id,
      level:
        baseItem.enhancementLevel,
      ascension:
        baseItem.ascensionLevel
    });

  const baseStatMap =
    Object.fromEntries(
      baseStats.mainStats.map(
        stat => [
          stat.stat,
          stat
        ]
      )
    );

  const statChanges =
    plannedStats.mainStats
      .map(
        stat => {

          const baseStat =
            baseStatMap[
              stat.stat
            ];

          const delta =
            stat.value -
            (
              baseStat?.value ||
              0
            );

          if (
            Math.abs(
              delta
            ) < 0.000001
          ) {
            return "";
          }

          return `
            <div class="equipment-plan-stat">
              <span>
                ${
                  EQUIPMENT_STAT_NAMES[
                    stat.stat
                  ] ||
                  stat.stat
                }
              </span>

              <strong class="${
                delta >= 0
                  ? "positive"
                  : "negative"
              }">
                ${
                  stat.unit ===
                    "percent"
                    ? formatSignedNumber(
                        delta,
                        "%"
                      )
                    : formatSignedNumber(
                        delta
                      )
                }
              </strong>
            </div>
          `;

        }
      )
      .filter(
        Boolean
      )
      .join("");

  const baseCost =
    getItemCost(
      baseItem
    );

  const plannedCost =
    getItemCost(
      item
    );

  const xpDelta =
    plannedCost
      .enhancementXp -
    baseCost
      .enhancementXp;

  const pearlDelta =
    plannedCost
      .opusPearls -
    baseCost
      .opusPearls;

  const changed =
    item.enhancementLevel !==
      baseItem.enhancementLevel ||
    item.ascensionLevel !==
      baseItem.ascensionLevel;

  return `
    <div class="equipment-plan-comparison ${
      changed
        ? "changed"
        : "unchanged"
    }">

      <div class="equipment-plan-header">

        <div>
          <span class="equipment-card-section-label">
            Current → Planned
          </span>

          <strong>
            Lv${baseItem.enhancementLevel}
            ·
            ${getEquipmentAscensionLabel(
              equipmentData,
              baseItem.ascensionLevel
            )}
            →
            Lv${item.enhancementLevel}
            ·
            ${getEquipmentAscensionLabel(
              equipmentData,
              item.ascensionLevel
            )}
          </strong>
        </div>

        <button
          type="button"
          class="equipment-plan-reset-item"
          data-equipment-reset-item="${item.instanceId}"
          ${changed ? "" : "disabled"}
        >
          Reset Item
        </button>

      </div>


      ${
        statChanges
          ? `
            <div class="equipment-plan-stat-list">
              ${statChanges}
            </div>
          `
          : `
            <span class="equipment-plan-no-change">
              No stat changes planned.
            </span>
          `
      }


      <div class="equipment-plan-costs">

        <span>
          XP
          <strong>
            ${formatSignedNumber(
              xpDelta
            )}
          </strong>
        </span>

        <span>
          Opus Pearls
          <strong>
            ${formatSignedNumber(
              pearlDelta
            )}
          </strong>
        </span>

      </div>

    </div>
  `;
}


function renderInventorySummary() {
  const rarityCounts =
    Object.fromEntries(
      (
        equipmentData?.rarities ||
        []
      ).map(
        rarity => [
          rarity,
          items.filter(
            item =>
              getDefinition(
                item
              )?.rarity ===
              rarity
          ).length
        ]
      )
    );

  const categoryCounts =
    Object.fromEntries(
      (
        equipmentData?.categories ||
        []
      ).map(
        category => [
          category.id,
          items.filter(
            item =>
              getDefinition(
                item
              )?.category ===
              category.id
          ).length
        ]
      )
    );

  return `
    <div class="equipment-inventory-summary">

      <div class="equipment-inventory-summary-card">
        <span>Total</span>
        <strong>${items.length}</strong>
      </div>

      ${
        (
          equipmentData?.rarities ||
          []
        )
          .map(
            rarity => `
              <div class="equipment-inventory-summary-card">
                <span>${rarity}</span>
                <strong>
                  ${rarityCounts[rarity] || 0}
                </strong>
              </div>
            `
          )
          .join("")
      }

      ${
        (
          equipmentData?.categories ||
          []
        )
          .map(
            category => `
              <div class="equipment-inventory-summary-card">
                <span>${category.name}</span>
                <strong>
                  ${categoryCounts[category.id] || 0}
                </strong>
              </div>
            `
          )
          .join("")
      }

    </div>
  `;
}


function renderAscensionOptions(
  currentAscension
) {
  let html = "";

  for (
    let ascension = 0;
    ascension <=
      EQUIPMENT_MAX_ASCENSION;
    ascension += 1
  ) {
    html += `
      <option
        value="${ascension}"
        ${
          ascension ===
          currentAscension
            ? "selected"
            : ""
        }
      >
        ${getEquipmentAscensionLabel(
          equipmentData,
          ascension
        )}
      </option>
    `;
  }

  return html;
}


function renderItemCard(
  item
) {
  const definition =
    getDefinition(
      item
    );

  if (!definition) {
    return "";
  }

  const displayName =
    getItemDisplayName(
      item
    );

  const stats =
    getEquipmentStats({
      equipmentData,
      equipmentId:
        definition.id,
      level:
        item.enhancementLevel,
      ascension:
        item.ascensionLevel
    });

  const nextEnhancementCost =
    item.enhancementLevel >=
      EQUIPMENT_MAX_LEVEL
      ? null
      : getEquipmentEnhancementStepCost(
          equipmentData,
          item.enhancementLevel
        );

  const nextAscensionCost =
    item.ascensionLevel >=
      EQUIPMENT_MAX_ASCENSION
      ? null
      : getEquipmentAscensionStepCost(
          equipmentData,
          item.ascensionLevel + 1
        );

  const planComparison =
    renderPlanComparison(
      item,
      definition,
      stats
    );

  const ascensionBoost =
    item.ascensionLevel *
    (
      Number(
        equipmentData
          ?.ascension
          ?.mainStatPercentPerLevel
      ) || 10
    );

  return `
    <article
      class="equipment-card"
      data-equipment-instance="${item.instanceId}"
    >

      <div class="equipment-card-header">

        <div>
          <div class="equipment-card-title-row">

            <span
              class="equipment-rarity equipment-rarity-${definition.rarity.toLowerCase()}"
            >
              ${definition.rarity}
            </span>

            <h4>
              ${displayName}
            </h4>

          </div>

          <p>
            Enhancement Lv${item.enhancementLevel}
            ·
            ${getEquipmentAscensionLabel(
              equipmentData,
              item.ascensionLevel
            )}
          </p>
        </div>


        <div class="equipment-card-actions">

          <button
            class="equipment-card-action"
            type="button"
            data-equipment-duplicate="${item.instanceId}"
            ${
              buildMode ===
                "budget"
                ? "disabled"
                : ""
            }
            title="Duplicate this inventory item"
          >
            Duplicate
          </button>

          <button
            class="equipment-card-action equipment-card-remove"
            type="button"
            data-equipment-remove="${item.instanceId}"
            ${
              buildMode ===
                "budget"
                ? "disabled"
                : ""
            }
          >
            Remove
          </button>

        </div>

      </div>


      <div class="equipment-current-stats">

        <span class="equipment-card-section-label">
          ${
            buildMode ===
              "budget"
              ? "Planned Main Stats"
              : "Current Main Stats"
          }
        </span>

        <div class="equipment-stat-list">
          ${renderMainStats(
            stats.mainStats
          )}
        </div>

        <div class="equipment-ascension-main-boost">
          Ascension main-stat boost:
          <strong>
            +${ascensionBoost}%
          </strong>
        </div>

      </div>


      ${planComparison}


      <div class="equipment-control-section">

        <div class="equipment-control-heading">
          <div>
            <strong>
              Enhancement
            </strong>

            <span>
              Lv0–100
            </span>
          </div>

          <span>
            Next:
            <strong>
              ${
                nextEnhancementCost ===
                  null
                  ? "MAX"
                  : `${formatNumber(
                      nextEnhancementCost
                    )} XP`
              }
            </strong>
          </span>
        </div>


        <div class="equipment-level-controls">

          <button
            type="button"
            data-equipment-level-step="-10"
            data-equipment-instance-id="${item.instanceId}"
            ${item.enhancementLevel <= 0 ? "disabled" : ""}
          >
            −10
          </button>

          <button
            type="button"
            data-equipment-level-step="-1"
            data-equipment-instance-id="${item.instanceId}"
            ${item.enhancementLevel <= 0 ? "disabled" : ""}
          >
            −1
          </button>

          <input
            class="equipment-level-input"
            type="number"
            min="0"
            max="100"
            step="1"
            value="${item.enhancementLevel}"
            data-equipment-level-input="${item.instanceId}"
            aria-label="Enhancement level"
          >

          <button
            type="button"
            data-equipment-level-step="1"
            data-equipment-instance-id="${item.instanceId}"
            ${item.enhancementLevel >= 100 ? "disabled" : ""}
          >
            +1
          </button>

          <button
            type="button"
            data-equipment-level-step="10"
            data-equipment-instance-id="${item.instanceId}"
            ${item.enhancementLevel >= 100 ? "disabled" : ""}
          >
            +10
          </button>

          <button
            type="button"
            class="equipment-level-max-button"
            data-equipment-level-max="${item.instanceId}"
            ${item.enhancementLevel >= 100 ? "disabled" : ""}
          >
            MAX
          </button>

        </div>


        <input
          class="equipment-level-range"
          type="range"
          min="0"
          max="100"
          step="1"
          value="${item.enhancementLevel}"
          data-equipment-level-range="${item.instanceId}"
          aria-label="Enhancement level slider"
        >

      </div>


      <div class="equipment-control-section">

        <div class="equipment-control-heading">
          <div>
            <strong>
              Ascension
            </strong>

            <span>
              Gold 1–5 → Red 1–5
            </span>
          </div>

          <span>
            Next:
            <strong>
              ${
                nextAscensionCost ===
                  null
                  ? "MAX"
                  : `${formatNumber(
                      nextAscensionCost
                    )} Opus Pearls`
              }
            </strong>
          </span>
        </div>


        <div class="equipment-ascension-controls">

          <button
            type="button"
            data-equipment-ascension-step="-1"
            data-equipment-instance-id="${item.instanceId}"
            ${item.ascensionLevel <= 0 ? "disabled" : ""}
          >
            −1
          </button>

          <select
            class="equipment-ascension-select"
            data-equipment-ascension-select="${item.instanceId}"
          >
            ${renderAscensionOptions(
              item.ascensionLevel
            )}
          </select>

          <button
            type="button"
            data-equipment-ascension-step="1"
            data-equipment-instance-id="${item.instanceId}"
            ${item.ascensionLevel >= 10 ? "disabled" : ""}
          >
            +1
          </button>

          <button
            type="button"
            class="equipment-level-max-button"
            data-equipment-ascension-max="${item.instanceId}"
            ${item.ascensionLevel >= 10 ? "disabled" : ""}
          >
            MAX
          </button>

        </div>

      </div>


      <div class="equipment-extra-section">

        <span class="equipment-card-section-label">
          Active Ascension Extra Effects
        </span>

        <div class="equipment-extra-list">
          ${renderExtraEffects(
            stats.extraEffects
          )}
        </div>

      </div>

    </article>
  `;
}


function renderCategory(
  category
) {
  const categoryItems =
    items.filter(
      item =>
        getDefinition(
          item
        )?.category ===
        category.id
    );

  const addOpen =
    activeAddCategory ===
    category.id;

  const addOptions =
    (
      equipmentData?.rarities ||
      []
    )
      .map(
        rarity => {

          const definition =
            getEquipmentDefinitionByCategoryAndRarity(
              equipmentData,
              category.id,
              rarity
            );

          if (!definition) {
            return "";
          }

          return `
            <button
              type="button"
              class="equipment-add-option"
              data-equipment-add-id="${definition.id}"
            >
              <span class="equipment-rarity equipment-rarity-${rarity.toLowerCase()}">
                ${rarity}
              </span>

              ${definition.name}
            </button>
          `;

        }
      )
      .join("");

  return `
    <section class="equipment-category">

      <div class="equipment-category-header">

        <div>
          <h3>
            ${category.name}
          </h3>

          <span>
            ${categoryItems.length}
            ${categoryItems.length === 1 ? "item" : "items"}
          </span>
        </div>


        <button
          type="button"
          class="equipment-add-button"
          data-equipment-add-category="${category.id}"
          ${
            buildMode ===
              "budget"
              ? "disabled"
              : ""
          }
          title="${
            buildMode ===
              "budget"
              ? "Switch to Unlimited mode to change the inventory."
              : `Add ${category.name}`
          }"
        >
          + Add
        </button>

      </div>


      ${
        addOpen &&
        buildMode ===
          "unlimited"
          ? `
            <div class="equipment-add-menu">
              ${addOptions}
            </div>
          `
          : ""
      }


      <div class="equipment-category-items">

        ${
          categoryItems.length > 0
            ? categoryItems
                .map(
                  renderItemCard
                )
                .join("")
            : `
              <div class="equipment-empty-state">
                No ${category.name} added yet.
              </div>
            `
        }

      </div>

    </section>
  `;
}


// ========================================
// RENDER
// ========================================

function render() {
  const root =
    document.getElementById(
      "equipment-root"
    );

  if (
    !root ||
    !equipmentData
  ) {
    return;
  }

  const currentCost =
    calculateInventoryCost();

  const available =
    getAvailableBudget();

  const planDelta =
    getPlanCostDelta();

  const ownedEnhancementXp =
    getOwnedEnhancementXp();

  root.innerHTML = `

    <section class="build-settings equipment-build-settings">

      <div class="build-settings-header">

        <div>
          <h3>
            Build Mode
          </h3>

          <p>
            Use Unlimited to recreate your current inventory.
            Enter the Temperit and Opus Pearls you own, then
            switch to Budget Build to plan your upgrades.
          </p>
        </div>


        <div class="build-mode-toggle">

          <button
            type="button"
            class="equipment-build-mode-button ${
              buildMode ===
                "unlimited"
                ? "active"
                : ""
            }"
            data-equipment-build-mode="unlimited"
          >
            Unlimited
          </button>

          <button
            type="button"
            class="equipment-build-mode-button ${
              buildMode ===
                "budget"
                ? "active"
                : ""
            }"
            data-equipment-build-mode="budget"
          >
            Budget Build
          </button>

        </div>

      </div>


      <div class="equipment-budget-summary">

        <div class="summary-card equipment-temperit-card">

          <span class="summary-label">
            Owned Temperit
          </span>

          <div class="equipment-temperit-grid">

            ${
              [
                ["large", "Large"],
                ["medium", "Medium"],
                ["small", "Small"]
              ]
                .map(
                  ([type, label]) => `
                    <label class="equipment-temperit-input">
                      <span>
                        ${label}
                        <small>
                          +${formatNumber(
                            getTemperitXpValue(
                              type
                            )
                          )} XP
                        </small>
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value="${temperitCounts[type]}"
                        data-equipment-temperit="${type}"
                      >
                    </label>
                  `
                )
                .join("")
            }

          </div>

          <div class="equipment-temperit-total">
            Total Enhancement XP
            <strong>
              ${formatNumber(
                ownedEnhancementXp
              )}
            </strong>
          </div>

        </div>


        <div class="summary-card">

          <span class="summary-label">
            Available XP
          </span>

          <strong>
            ${
              buildMode ===
                "unlimited"
                ? "Unlimited"
                : formatNumber(
                    Math.max(
                      0,
                      available
                        .enhancementXp
                    )
                  )
            }
          </strong>

        </div>


        <div class="summary-card">

          <span class="summary-label">
            ${
              buildMode ===
                "budget"
                ? "Plan XP Spend"
                : "Inventory XP Value"
            }
          </span>

          <strong>
            ${
              buildMode ===
                "budget"
                ? formatSignedNumber(
                    planDelta
                      .enhancementXp
                  )
                : formatNumber(
                    currentCost
                      .enhancementXp
                  )
            }
          </strong>

        </div>


        <label class="summary-card token-input-card">

          <span class="summary-label">
            Owned Opus Pearls
          </span>

          <input
            id="equipment-owned-pearls"
            class="token-input"
            type="number"
            min="0"
            step="1"
            value="${ownedOpusPearls}"
          >

        </label>


        <div class="summary-card">

          <span class="summary-label">
            Available Pearls
          </span>

          <strong>
            ${
              buildMode ===
                "unlimited"
                ? "Unlimited"
                : formatNumber(
                    Math.max(
                      0,
                      available
                        .opusPearls
                    )
                  )
            }
          </strong>

        </div>


        <div class="summary-card">

          <span class="summary-label">
            ${
              buildMode ===
                "budget"
                ? "Plan Pearl Spend"
                : "Inventory Pearl Value"
            }
          </span>

          <strong>
            ${
              buildMode ===
                "budget"
                ? formatSignedNumber(
                    planDelta
                      .opusPearls
                  )
                : formatNumber(
                    currentCost
                      .opusPearls
                  )
            }
          </strong>

        </div>

      </div>


      <div class="equipment-budget-note">

        <span>
          ${
            buildMode ===
              "budget"
              ? "Budget Build keeps your current inventory fixed. Temperit is converted into Enhancement XP automatically; downgrading frees that XP and Opus Pearl budget for other planned upgrades."
              : "Configure the equipment you currently own here. Temperit is the only Enhancement XP source. Each saved item will later be assignable to exactly one Palmon in the Team Overview."
          }
        </span>

        ${
          buildMode ===
            "budget"
            ? `
              <button
                type="button"
                class="equipment-reset-plan-button"
                data-equipment-reset-plan
              >
                Reset Plan
              </button>
            `
            : ""
        }

      </div>

    </section>


    ${
      budgetWarning
        ? `
          <div class="equipment-budget-warning">
            ${budgetWarning}
          </div>
        `
        : ""
    }


    <section class="section">

      <div class="section-header equipment-inventory-header">

        <div>
          <h2>
            Equipment Inventory
          </h2>

          <p>
            Add multiple copies if you own the same equipment more than once.
          </p>
        </div>

        <span class="equipment-inventory-count">
          ${items.length}
          ${items.length === 1 ? "item" : "items"}
        </span>

      </div>


      ${renderInventorySummary()}


      <div class="equipment-category-grid">

        ${
          (
            equipmentData
              .categories ||
            []
          )
            .map(
              renderCategory
            )
            .join("")
        }

      </div>

    </section>

  `;

  addListeners();
}


// ========================================
// LISTENERS
// ========================================

function addListeners() {

  document
    .querySelectorAll(
      "[data-equipment-build-mode]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            setBuildMode(
              button.dataset
                .equipmentBuildMode
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-temperit]"
    )
    .forEach(
      input => {

        input.addEventListener(
          "change",
          () => {

            const type =
              input.dataset
                .equipmentTemperit;

            if (
              !Object.prototype
                .hasOwnProperty
                .call(
                  temperitCounts,
                  type
                )
            ) {
              return;
            }

            temperitCounts[
              type
            ] =
              Math.max(
                0,
                Math.floor(
                  Number(
                    input.value
                  ) || 0
                )
              );

            saveState();

            render();

          }
        );

      }
    );


  const resetPlanButton =
    document.querySelector(
      "[data-equipment-reset-plan]"
    );

  if (resetPlanButton) {
    resetPlanButton.addEventListener(
      "click",
      () => {
        resetPlan();
      }
    );
  }


  document
    .querySelectorAll(
      "[data-equipment-reset-item]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            resetPlan(
              button.dataset
                .equipmentResetItem
            );

          }
        );

      }
    );


  const pearlInput =
    document.getElementById(
      "equipment-owned-pearls"
    );

  if (pearlInput) {
    pearlInput.addEventListener(
      "change",
      event => {

        ownedOpusPearls =
          Math.max(
            0,
            Math.floor(
              Number(
                event.target.value
              ) || 0
            )
          );

        saveState();

        render();

      }
    );
  }


  document
    .querySelectorAll(
      "[data-equipment-add-category]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            if (
              buildMode !==
              "unlimited"
            ) {
              return;
            }

            const category =
              button.dataset
                .equipmentAddCategory;

            activeAddCategory =
              activeAddCategory ===
                category
                ? null
                : category;

            render();

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-add-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            if (
              buildMode !==
              "unlimited"
            ) {
              return;
            }

            createItem(
              button.dataset
                .equipmentAddId
            );

            activeAddCategory =
              null;

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-duplicate]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            duplicateItem(
              button.dataset
                .equipmentDuplicate
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-remove]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            removeItem(
              button.dataset
                .equipmentRemove
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-level-step]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const item =
              getItem(
                button.dataset
                  .equipmentInstanceId
              );

            if (!item) {
              return;
            }

            const step =
              Number(
                button.dataset
                  .equipmentLevelStep
              ) || 0;

            setEnhancementLevel(
              item.instanceId,
              item.enhancementLevel +
                step
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-level-input]"
    )
    .forEach(
      input => {

        input.addEventListener(
          "change",
          () => {

            setEnhancementLevel(
              input.dataset
                .equipmentLevelInput,
              input.value
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-level-range]"
    )
    .forEach(
      input => {

        input.addEventListener(
          "change",
          () => {

            setEnhancementLevel(
              input.dataset
                .equipmentLevelRange,
              input.value
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-level-max]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            setEnhancementLevel(
              button.dataset
                .equipmentLevelMax,
              EQUIPMENT_MAX_LEVEL
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-ascension-step]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const item =
              getItem(
                button.dataset
                  .equipmentInstanceId
              );

            if (!item) {
              return;
            }

            const step =
              Number(
                button.dataset
                  .equipmentAscensionStep
              ) || 0;

            setAscensionLevel(
              item.instanceId,
              item.ascensionLevel +
                step
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-ascension-select]"
    )
    .forEach(
      select => {

        select.addEventListener(
          "change",
          () => {

            setAscensionLevel(
              select.dataset
                .equipmentAscensionSelect,
              select.value
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-equipment-ascension-max]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            setAscensionLevel(
              button.dataset
                .equipmentAscensionMax,
              EQUIPMENT_MAX_ASCENSION
            );

          }
        );

      }
    );

}
