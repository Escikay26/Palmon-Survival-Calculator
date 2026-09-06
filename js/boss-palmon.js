import {
  loadBossPalmonState,
  saveBossPalmonState
} from "./storage.js";

let bossData = [];
let selectedBossId = "inkuisitor";
let bossStates = {};

const STAT_LABELS = {
  attack: "Attack",
  defense: "Defense",
  hp: "HP",
  critRate: "Crit Rate",
  tenacity: "Tenacity",
  armigoMorale: "Armigo Morale",
  counterFire: "Counter Fire",
  finalDamage: "Final Damage",
  finalDamageTaken: "Final Damage Taken"
};

function getDefaultBossState() {
  return {
    level: 1,
    ascensionProgress: 0,
    skillLevels: {}
  };
}

function getCurrentBoss() {
  return bossData.find(
    boss => boss.id === selectedBossId
  ) || null;
}

function getCurrentState() {
  if (!bossStates[selectedBossId]) {
    bossStates[selectedBossId] =
      getDefaultBossState();
  }

  return bossStates[selectedBossId];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US")
    .format(value);
}

function formatPercent(value) {
  return `${value}%`;
}

function getStars(ascensionProgress) {
  return Math.floor(ascensionProgress / 5);
}

function getAscensionLabel(progress) {
  if (progress <= 0) {
    return "0★ 0/5";
  }

  const stars = Math.floor(progress / 5);
  const subLevel = progress % 5;

  if (subLevel === 0) {
    return `${stars}★`;
  }

  return `${stars}★ ${subLevel}/5`;
}

function getLevelFlatStats(boss, level) {
  const totals = {
    attack: 0,
    defense: 0,
    hp: 0
  };

  for (
    let gainedLevel = 2;
    gainedLevel <= level;
    gainedLevel++
  ) {
    const growth = boss.levelGrowth.find(
      range =>
        gainedLevel >= range.minLevel &&
        gainedLevel <= range.maxLevel
    );

    if (!growth) continue;

    totals.attack +=
      growth.perLevelIncrease.attack || 0;

    totals.defense +=
      growth.perLevelIncrease.defense || 0;

    totals.hp +=
      growth.perLevelIncrease.hp || 0;
  }

  return totals;
}

function getAscensionFlatStats(
  boss,
  progress
) {
  const totals = {
    attack: 0,
    defense: 0,
    hp: 0
  };

  for (
    let step = 1;
    step <= progress;
    step++
  ) {
    const tierIndex =
      Math.floor((step - 1) / 5);

    const tier =
      boss.ascensionTiers[tierIndex];

    if (!tier) continue;

    totals.attack +=
      tier.perStepFlatStats.attack || 0;

    totals.defense +=
      tier.perStepFlatStats.defense || 0;

    totals.hp +=
      tier.perStepFlatStats.hp || 0;
  }

  return totals;
}

function getTitanSealCost(
  boss,
  progress
) {
  let total = 0;

  for (
    let step = 1;
    step <= progress;
    step++
  ) {
    const tierIndex =
      Math.floor((step - 1) / 5);

    const tier =
      boss.ascensionTiers[tierIndex];

    if (tier) {
      total += tier.titanSealsPerStep || 0;
    }
  }

  return total;
}

function getAscensionPercentBonuses(
  boss,
  progress
) {
  const bonuses = new Map();

  boss.ascensionSteps
    .filter(step => step.progress <= progress)
    .forEach(step => {
      const effect = step.effect;

      if (
        !effect ||
        !effect.stat ||
        effect.unit !== "percent"
      ) {
        return;
      }

      const key = [
        effect.scope,
        effect.element || "general",
        effect.stat
      ].join(":");

      const existing = bonuses.get(key);

      if (effect.stacking === "replace") {
        bonuses.set(key, {
          ...effect,
          value: effect.value
        });

        return;
      }

      if (
        effect.stacking === "additive" &&
        existing
      ) {
        bonuses.set(key, {
          ...effect,
          value:
            existing.value + effect.value
        });

        return;
      }

      if (
        effect.stacking === "additive"
      ) {
        bonuses.set(key, {
          ...effect,
          value: effect.value
        });

        return;
      }

      bonuses.set(key, {
        ...effect,
        value: effect.value
      });
    });

  return [...bonuses.values()];
}

function getActiveSkillEffects(
  boss,
  state
) {
  const stars =
    getStars(state.ascensionProgress);

  const effects = [];
  const battleEffects = [];

  boss.skills.forEach(skill => {
    if (stars < skill.requiredStars) {
      return;
    }

    const selectedLevel = Math.max(
      skill.minLevelWhenUnlocked || 1,
      Number(
        state.skillLevels[skill.id]
      ) || 1
    );

    const levelData =
      skill.levels.find(
        level =>
          level.level === selectedLevel
      );

    if (
      !levelData ||
      !levelData.effect
    ) {
      return;
    }

    const effect = levelData.effect;

    if (
      effect.scope === "conditional" ||
      effect.type?.startsWith(
        "conditional"
      )
    ) {
      battleEffects.push({
        skillName: skill.name,
        description:
          effect.description
      });

      return;
    }

    if (effect.stat) {
      effects.push({
        ...effect,
        source: skill.name
      });
    }
  });

  return {
    effects,
    battleEffects
  };
}

function combinePercentBonuses(
  ascensionEffects,
  skillEffects
) {
  const totals = new Map();

  [
    ...ascensionEffects,
    ...skillEffects
  ].forEach(effect => {
    const key = [
      effect.scope,
      effect.element || "general",
      effect.stat
    ].join(":");

    const existing =
      totals.get(key);

    totals.set(key, {
      ...effect,
      value:
        (existing?.value || 0) +
        effect.value
    });
  });

  return [...totals.values()];
}

function getPaidSkillUpgradeCount(
  boss,
  state
) {
  const stars =
    getStars(state.ascensionProgress);

  return boss.skills.reduce(
    (total, skill) => {
      if (
        stars < skill.requiredStars
      ) {
        return total;
      }

      const level = Math.max(
        skill.minLevelWhenUnlocked || 1,
        Number(
          state.skillLevels[skill.id]
        ) || 1
      );

      return (
        total +
        Math.max(0, level - 1)
      );
    },
    0
  );
}

function getBloomstoneCost(
  boss,
  state
) {
  const paidUpgrades =
    getPaidSkillUpgradeCount(
      boss,
      state
    );

  const costs =
    boss.skillUpgradeCosts?.costs || [];

  return costs
    .slice(0, paidUpgrades)
    .reduce(
      (sum, cost) => sum + cost,
      0
    );
}

function normalizeUnlockedSkills() {
  const boss = getCurrentBoss();
  const state = getCurrentState();

  if (!boss) return;

  const stars =
    getStars(state.ascensionProgress);

  boss.skills.forEach(skill => {
    if (
      stars < skill.requiredStars
    ) {
      return;
    }

    const currentLevel =
      Number(
        state.skillLevels[skill.id]
      ) || 0;

    if (currentLevel < 1) {
      state.skillLevels[skill.id] = 1;
    }
  });
}

function saveState() {
  saveBossPalmonState({
    selectedBossId,
    bosses: bossStates
  });
}

function loadState() {
  const saved =
    loadBossPalmonState();

  selectedBossId =
    saved.selectedBossId ||
    bossData[0]?.id ||
    "inkuisitor";

  bossStates =
    saved.bosses || {};

  bossData.forEach(boss => {
    if (!bossStates[boss.id]) {
      bossStates[boss.id] =
        getDefaultBossState();
    }

    const state =
      bossStates[boss.id];

    state.level = clamp(
      Number(state.level) || 1,
      1,
      boss.maxLevel
    );

    state.ascensionProgress =
      clamp(
        Number(
          state.ascensionProgress
        ) || 0,
        0,
        boss.ascensionSteps.length
      );

    state.skillLevels =
      state.skillLevels || {};
  });

  normalizeUnlockedSkills();
  saveState();
}

function renderBossSelector() {
  return `
    <div class="boss-selector">
      ${bossData.map(boss => `
        <button
          class="
            boss-selector-button
            ${
              boss.id === selectedBossId
                ? "active"
                : ""
            }
          "
          data-boss-id="${boss.id}"
          type="button"
        >
          ${boss.name}
        </button>
      `).join("")}
    </div>
  `;
}

function renderProgressControls(
  boss,
  state
) {
  return `
    <section
      class="boss-card boss-progress-card"
    >
      <div class="boss-card-header">
        <div>
          <span
            class="
              boss-element-badge
              ${boss.element.toLowerCase()}
            "
          >
            ${boss.element}
          </span>

          <h3>${boss.name}</h3>
        </div>
      </div>

      <div class="boss-progress-grid">
        <div class="boss-control-group">
          <span class="boss-control-label">
            Boss Level
          </span>

          <div class="boss-stepper">
            <button
              type="button"
              data-level-change="-1"
            >
              −
            </button>

            <input
              id="boss-level-input"
              type="number"
              min="1"
              max="${boss.maxLevel}"
              value="${state.level}"
            >

            <button
              type="button"
              data-level-change="1"
            >
              +
            </button>
          </div>

          <span class="boss-control-hint">
            Max ${boss.maxLevel}
          </span>
        </div>

        <div class="boss-control-group">
          <span class="boss-control-label">
            Ascension
          </span>

          <div
            class="
              boss-stepper
              boss-ascension-stepper
            "
          >
            <button
              type="button"
              data-ascension-change="-1"
            >
              −
            </button>

            <strong>
              ${getAscensionLabel(
                state.ascensionProgress
              )}
            </strong>

            <button
              type="button"
              data-ascension-change="1"
            >
              +
            </button>
          </div>

          <span class="boss-control-hint">
            ${state.ascensionProgress}
            /
            ${boss.ascensionSteps.length}
            steps
          </span>
        </div>
      </div>
    </section>
  `;
}

function renderResourceSummary(
  boss,
  state
) {
  const paidUpgrades =
    getPaidSkillUpgradeCount(
      boss,
      state
    );

  return `
    <section class="boss-resource-grid">
      <div class="boss-resource-card">
        <span>Titan Seals</span>

        <strong>
          ${formatNumber(
            getTitanSealCost(
              boss,
              state.ascensionProgress
            )
          )}
        </strong>

        <small>
          for current Ascension
        </small>
      </div>

      <div class="boss-resource-card">
        <span>Bloomstones</span>

        <strong>
          ${formatNumber(
            getBloomstoneCost(
              boss,
              state
            )
          )}
        </strong>

        <small>
          for Skill upgrades
        </small>
      </div>

      <div class="boss-resource-card">
        <span>
          Paid Skill Upgrades
        </span>

        <strong>
          ${paidUpgrades}
          /
          ${
            boss.skillUpgradeCosts
              ?.paidUpgradeCountMax ||
            20
          }
        </strong>

        <small>
          Level 1 is free
        </small>
      </div>
    </section>
  `;
}

function renderSkills(
  boss,
  state
) {
  const stars =
    getStars(state.ascensionProgress);

  return `
    <section class="boss-card">
      <div class="boss-card-header">
        <div>
          <h3>Skills</h3>

          <p>
            Unlocked Skills automatically
            start at Level 1.
          </p>
        </div>
      </div>

      <div class="boss-skills">
        ${boss.skills.map(skill => {
          const unlocked =
            stars >= skill.requiredStars;

          const currentLevel =
            unlocked
              ? Math.max(
                  1,
                  Number(
                    state.skillLevels[
                      skill.id
                    ]
                  ) || 1
                )
              : 0;

          const currentData =
            unlocked
              ? skill.levels.find(
                  level =>
                    level.level ===
                    currentLevel
                )
              : null;

          return `
            <div
              class="
                boss-skill
                ${unlocked ? "" : "locked"}
              "
            >
              <div class="boss-skill-info">
                <div>
                  <h4>
                    ${skill.name}
                  </h4>

                  <span>
                    Requires ${skill.requiredStars}★
                  </span>
                </div>

                <strong>
                  ${
                    unlocked
                      ? `Lv. ${currentLevel}/5`
                      : "Locked"
                  }
                </strong>
              </div>

              <div class="boss-skill-levels">
                ${[1, 2, 3, 4, 5].map(level => `
                  <button
                    type="button"
                    class="boss-skill-level ${
                      currentLevel === level
                        ? "active"
                        : ""
                    }"
                    data-skill-id="${skill.id}"
                    data-skill-level="${level}"
                    ${unlocked ? "" : "disabled"}
                  >
                    ${level}
                  </button>
                `).join("")}
              </div>

              <p class="boss-skill-description">
                ${
                  unlocked
                    ? currentData
                        ?.effect
                        ?.description ||
                      "No effect data available."
                    : `Unlocks at ${skill.requiredStars}★.`
                }
              </p>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderBonusList(
  title,
  items,
  emptyText
) {
  return `
    <div class="boss-bonus-column">
      <h4>${title}</h4>

      <div class="boss-bonus-list">
        ${
          items.length > 0
            ? items.map(item => `
                <div
                  class="
                    boss-bonus-row
                  "
                >
                  <span>
                    ${item.label}
                  </span>

                  <strong>
                    ${item.value}
                  </strong>
                </div>
              `).join("")
            : `
              <p class="boss-empty-text">
                ${emptyText}
              </p>
            `
        }
      </div>
    </div>
  `;
}

function renderBonuses(
  boss,
  state
) {
  const levelStats =
    getLevelFlatStats(
      boss,
      state.level
    );

  const ascensionStats =
    getAscensionFlatStats(
      boss,
      state.ascensionProgress
    );

  const ascensionEffects =
    getAscensionPercentBonuses(
      boss,
      state.ascensionProgress
    );

  const skillData =
    getActiveSkillEffects(
      boss,
      state
    );

  const percentEffects =
    combinePercentBonuses(
      ascensionEffects,
      skillData.effects
    );

  const generalItems = [
    {
      label: "Attack",
      value:
        `+${formatNumber(
          levelStats.attack +
          ascensionStats.attack
        )}`
    },
    {
      label: "Defense",
      value:
        `+${formatNumber(
          levelStats.defense +
          ascensionStats.defense
        )}`
    },
    {
      label: "HP",
      value:
        `+${formatNumber(
          levelStats.hp +
          ascensionStats.hp
        )}`
    }
  ];

  percentEffects
    .filter(
      effect =>
        effect.scope === "general"
    )
    .forEach(effect => {
      generalItems.push({
        label:
          STAT_LABELS[effect.stat] ||
          effect.stat,

        value:
          `+${formatPercent(
            effect.value
          )}`
      });
    });

  const waterItems =
    percentEffects
      .filter(
        effect =>
          effect.scope === "element" &&
          effect.element === "Water"
      )
      .map(effect => ({
        label:
          STAT_LABELS[effect.stat] ||
          effect.stat,

        value:
          `+${formatPercent(
            effect.value
          )}`
      }));

  return `
    <section class="boss-card">
      <div class="boss-card-header">
        <div>
          <h3>Current Bonuses</h3>

          <p>
            General bonuses apply to all Palmon
            in the Squad. Water bonuses apply only
            to Water Palmon.
          </p>
        </div>
      </div>

      <div class="boss-bonus-grid">
        ${renderBonusList(
          "General · All Palmon",
          generalItems,
          "No general bonuses."
        )}

        ${renderBonusList(
          "Water Palmon",
          waterItems,
          "No Water-specific bonuses."
        )}
      </div>

      <div class="boss-battle-effects">
        <h4>Battle Effects</h4>

        ${
          skillData
            .battleEffects
            .length > 0
            ? skillData
                .battleEffects
                .map(effect => `
                  <div
                    class="
                      boss-battle-effect
                    "
                  >
                    <strong>
                      ${effect.skillName}
                    </strong>

                    <span>
                      ${effect.description}
                    </span>
                  </div>
                `).join("")
            : `
              <p class="boss-empty-text">
                No active conditional
                battle effects.
              </p>
            `
        }
      </div>
    </section>
  `;
}

function render() {
  const root =
    document.getElementById(
      "boss-palmon-root"
    );

  if (!root) return;

  const boss = getCurrentBoss();
  const state = getCurrentState();

  if (!boss) {
    root.innerHTML =
      "<p>Could not load Boss Palmon data.</p>";

    return;
  }

  normalizeUnlockedSkills();

  root.innerHTML = `
    ${renderBossSelector()}
    ${renderProgressControls(
      boss,
      state
    )}
    ${renderResourceSummary(
      boss,
      state
    )}
    ${renderSkills(
      boss,
      state
    )}
    ${renderBonuses(
      boss,
      state
    )}
  `;

  addBossListeners();
}

function changeLevel(amount) {
  const boss = getCurrentBoss();
  const state = getCurrentState();

  if (!boss) return;

  state.level = clamp(
    state.level + amount,
    1,
    boss.maxLevel
  );

  saveState();
  render();
}

function changeAscension(amount) {
  const boss = getCurrentBoss();
  const state = getCurrentState();

  if (!boss) return;

  state.ascensionProgress =
    clamp(
      state.ascensionProgress +
        amount,
      0,
      boss.ascensionSteps.length
    );

  normalizeUnlockedSkills();
  saveState();
  render();
}

function addBossListeners() {
  document
    .querySelectorAll(
      ".boss-selector-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          selectedBossId =
            button.dataset.bossId;

          normalizeUnlockedSkills();
          saveState();
          render();
        }
      );
    });

  document
    .querySelectorAll(
      "[data-level-change]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          changeLevel(
            Number(
              button.dataset.levelChange
            )
          );
        }
      );
    });

  const levelInput =
    document.getElementById(
      "boss-level-input"
    );

  if (levelInput) {
    levelInput.addEventListener(
      "change",
      event => {
        const boss =
          getCurrentBoss();

        const state =
          getCurrentState();

        if (!boss) return;

        state.level = clamp(
          Math.floor(
            Number(
              event.target.value
            ) || 1
          ),
          1,
          boss.maxLevel
        );

        saveState();
        render();
      }
    );
  }

  document
    .querySelectorAll(
      "[data-ascension-change]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          changeAscension(
            Number(
              button.dataset
                .ascensionChange
            )
          );
        }
      );
    });

  document
    .querySelectorAll(
      ".boss-skill-level"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const boss =
            getCurrentBoss();

          const state =
            getCurrentState();

          if (!boss) return;

          const skillId =
            button.dataset.skillId?.trim();

          const targetLevel =
            Number(
              button.dataset.skillLevel
            );

          const skill =
            boss.skills.find(
              item =>
                item.id === skillId
            );

          if (!skill) {
            console.error(
              "Skill not found:",
              skillId
            );

            return;
          }

          const stars =
            getStars(
              state.ascensionProgress
            );

          if (
            stars <
            skill.requiredStars
          ) {
            return;
          }

          state.skillLevels[
            skill.id
          ] = clamp(
            targetLevel,
            1,
            skill.maxLevel
          );

          saveState();
          render();
        }
      );
    });
}

export function getBossPalmonBonuses() {
  const boss = getCurrentBoss();
  const state = getCurrentState();

  if (!boss) {
    return {
      general: {},
      element: {},
      battleEffects: []
    };
  }

  const levelStats =
    getLevelFlatStats(
      boss,
      state.level
    );

  const ascensionStats =
    getAscensionFlatStats(
      boss,
      state.ascensionProgress
    );

  const ascensionEffects =
    getAscensionPercentBonuses(
      boss,
      state.ascensionProgress
    );

  const skillData =
    getActiveSkillEffects(
      boss,
      state
    );

  const percentEffects =
    combinePercentBonuses(
      ascensionEffects,
      skillData.effects
    );

  const result = {
    general: {
      attack:
        levelStats.attack +
        ascensionStats.attack,

      defense:
        levelStats.defense +
        ascensionStats.defense,

      hp:
        levelStats.hp +
        ascensionStats.hp
    },

    element: {},

    battleEffects:
      skillData.battleEffects
  };

  percentEffects.forEach(effect => {
    if (
      effect.scope === "general"
    ) {
      result.general[
        effect.stat
      ] = effect.value;

      return;
    }

    if (
      effect.scope === "element"
    ) {
      if (
        !result.element[
          effect.element
        ]
      ) {
        result.element[
          effect.element
        ] = {};
      }

      result.element[
        effect.element
      ][effect.stat] =
        effect.value;
    }
  });

  return result;
}

export async function initBossPalmonSystem() {
  try {
    const response =
      await fetch(
        "./data/boss-palmon.json"
      );

    if (!response.ok) {
      throw new Error(
        `Could not load boss-palmon.json (${response.status})`
      );
    }

    const data =
      await response.json();

    bossData =
      data.bosses || [];

    loadState();
    render();
  }
  catch (error) {
    console.error(
      "Could not load Boss Palmon data.",
      error
    );
  }
}
