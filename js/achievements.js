import {
  loadAchievementState,
  saveAchievementState
} from "./storage.js";


// =============================
// STATE
// =============================

let achievements = [];

let selectedElement =
  "Water";

let selectedLevels = {};

let unlockedAchievements = {};

let selectedFilter =
  "all";


// Unlimited ist der Standard.
let buildMode =
  "unlimited";


// Tokens, die der Spieler
// aktuell noch besitzt.
let ownedTokens = 0;


// Wert des Builds in dem Moment,
// in dem Budget Build aktiviert wird.
let budgetBaseCost = 0;


// =============================
// STAT NAMES
// =============================

const statNames = {

  attack:
    "Attack",

  defense:
    "Defense",

  hp:
    "HP",

  critChance:
    "Crit Chance",

  critDamage:
    "Crit Damage",

  accuracy:
    "Accuracy",

  critDamageReduction:
    "Crit Damage Reduction",

  tenacity:
    "Tenacity",

  rage:
    "Rage",

  rageSkillDamageBonus:
    "Rage Skill Damage Bonus",

  rageSkillDamageTakenReduction:
    "Rage Skill Damage Taken Reduction",

  allPalmonArmigoCapacity:
    "Palmon Armigo Capacity",

  armigoAttack:
    "Armigo Attack",

  armigoHP:
    "Armigo HP"

};


// =============================
// INITIALIZE
// =============================

export async function
initAchievementSystem() {

  try {

    const response =
      await fetch(
        "./data/achievements.json"
      );


    if (!response.ok) {

      throw new Error(
        `Could not load achievements.json (${response.status})`
      );

    }


    const data =
      await response.json();


    achievements =
      data.achievements ||
      [];


    loadSavedState();

    addElementListener();

    addResetListener();

    addFilterListeners();

    addBuildModeListeners();

    render();

  }

  catch (error) {

    console.error(
      "Could not load achievement data.",
      error
    );

  }

}

// =============================
// SAVE
// =============================

function saveState() {

  saveAchievementState({

    element:
      selectedElement,

    levels:
      selectedLevels,

    unlocked:
      unlockedAchievements,

    ownedTokens:
      ownedTokens,

    buildMode:
      buildMode,

    budgetBaseCost:
      budgetBaseCost

  });

}

// =============================
// LOAD SAVE
// =============================

function loadSavedState() {

  const data =
    loadAchievementState();


  selectedElement =
    data.element;

  selectedLevels =
    data.levels;

  unlockedAchievements =
    data.unlocked;

  ownedTokens =
    data.ownedTokens;

  buildMode =
    data.buildMode;

  budgetBaseCost =
    data.budgetBaseCost;


  // Migration für ältere Saves:
  // Level > 0 bedeutet,
  // dass dieses Achievement
  // bereits unlocked war.
  Object.entries(
    selectedLevels
  ).forEach(
    ([name, level]) => {

      if (
        Number(level) > 0
      ) {

        unlockedAchievements[
          name
        ] = true;

      }

    }
  );


  updatePrerequisiteStates();


  const elementSelect =
    document.getElementById(
      "element"
    );


  if (elementSelect) {

    elementSelect.value =
      selectedElement;

  }


  saveState();

}

// =============================
// AVAILABILITY
// =============================

function isAvailable(
  achievement
) {

  const elementOK =
    !achievement.element ||
    achievement.element ===
      selectedElement;


  const unlocked =
    unlockedAchievements[
      achievement.name
    ] === true;


  if (!unlocked) {

    return false;

  }


  if (
    !achievement.prerequisite
  ) {

    return elementOK;

  }


  const prerequisiteOK =
    getLevel(
      achievement.prerequisite
    ) === 6;


  return (
    elementOK &&
    prerequisiteOK
  );

}


// =============================
// CURRENT LEVEL
// =============================

function getLevel(
  name
) {

  return (
    selectedLevels[name] ||
    0
  );

}


// =============================
// PREREQUISITE STATES
// =============================

function updatePrerequisiteStates() {

  achievements.forEach(
    achievement => {

      const unlocked =
        unlockedAchievements[
          achievement.name
        ] === true;


      if (!unlocked) {

        return;

      }


      // Ein freigeschaltetes
      // Achievement ist immer
      // mindestens Level 1.
      if (
        getLevel(
          achievement.name
        ) < 1
      ) {

        selectedLevels[
          achievement.name
        ] = 1;

      }


      if (
        !achievement.prerequisite
      ) {

        return;

      }


      const prerequisiteLevel =
        getLevel(
          achievement.prerequisite
        );


      // Sinkt die Voraussetzung
      // wieder unter Level 6,
      // fällt das Achievement
      // auf Level 1 zurück.
      if (
        prerequisiteLevel < 6 &&
        getLevel(
          achievement.name
        ) > 1
      ) {

        selectedLevels[
          achievement.name
        ] = 1;

      }

    }
  );

}


// =============================
// UNLOCK
// =============================

function unlockAchievement(
  achievementName
) {

  const achievement =
    achievements.find(
      item =>
        item.name ===
        achievementName
    );


  if (!achievement) {

    return;

  }


  const elementOK =
    !achievement.element ||
    achievement.element ===
      selectedElement;


  if (!elementOK) {

    return;

  }


  if (
    unlockedAchievements[
      achievement.name
    ] === true
  ) {

    return;

  }


  if (
    achievement.prerequisite
  ) {

    const prerequisiteLevel =
      getLevel(
        achievement.prerequisite
      );


    if (
      prerequisiteLevel !== 6
    ) {

      return;

    }

  }


  unlockedAchievements[
    achievement.name
  ] = true;


  selectedLevels[
    achievement.name
  ] = 1;


  saveState();

  render();

}


// =============================
// COST FOR TARGET LEVEL
// =============================

function getCostForLevel(
  achievement,
  targetLevel
) {

  let total = 0;


  achievement.levels.forEach(
    level => {

      if (
        level.level <=
        targetLevel
      ) {

        total +=
          level.cost;

      }

    }
  );


  return total;

}


// =============================
// CURRENT ACHIEVEMENT COST
// =============================

function getAchievementCost(
  achievement
) {

  const unlocked =
    unlockedAchievements[
      achievement.name
    ] === true;


  if (!unlocked) {

    return 0;

  }


  const currentLevel =
    getLevel(
      achievement.name
    );


  return getCostForLevel(
    achievement,
    currentLevel
  );

}


// =============================
// NEXT COST
// =============================

function getNextCost(
  achievement
) {

  const currentLevel =
    getLevel(
      achievement.name
    );


  if (
    currentLevel >= 6
  ) {

    return null;

  }


  const nextLevel =
    currentLevel + 1;


  const data =
    achievement.levels.find(
      level =>
        level.level ===
        nextLevel
    );


  return (
    data
      ? data.cost
      : null
  );

}


// =============================
// TOTAL COST
// =============================

function calculateTotalCost() {

  return achievements.reduce(
    (
      total,
      achievement
    ) => {

      return (
        total +
        getAchievementCost(
          achievement
        )
      );

    },
    0
  );

}


// =============================
// BUILD BUDGET
// =============================

function getTotalBudget() {

  return (
    budgetBaseCost +
    ownedTokens
  );

}


function getAvailableTokens() {

  if (
    buildMode ===
    "unlimited"
  ) {

    return Infinity;

  }


  return (
    getTotalBudget() -
    calculateTotalCost()
  );

}


function canAffordLevel(
  achievement,
  targetLevel
) {

  // Unlimited ignoriert
  // sämtliche Token-Grenzen.
  if (
    buildMode ===
    "unlimited"
  ) {

    return true;

  }


  const currentLevel =
    getLevel(
      achievement.name
    );


  // Zurückbauen ist immer erlaubt.
  if (
    targetLevel <=
    currentLevel
  ) {

    return true;

  }


  const currentCost =
    getAchievementCost(
      achievement
    );


  const targetCost =
    getCostForLevel(
      achievement,
      targetLevel
    );


  const additionalCost =
    targetCost -
    currentCost;


  return (
    additionalCost <=
    getAvailableTokens()
  );

}


function getMissingTokens(
  achievement,
  targetLevel
) {

  if (
    buildMode ===
    "unlimited"
  ) {

    return 0;

  }


  const currentCost =
    getAchievementCost(
      achievement
    );


  const targetCost =
    getCostForLevel(
      achievement,
      targetLevel
    );


  const additionalCost =
    Math.max(
      0,
      targetCost -
      currentCost
    );


  return Math.max(
    0,
    additionalCost -
      getAvailableTokens()
  );

}


// =============================
// NEXT UPGRADE COSTS
// =============================

function calculateNextCosts() {

  let total = 0;


  achievements.forEach(
    achievement => {

      if (
        !isAvailable(
          achievement
        )
      ) {

        return;

      }


      const next =
        getNextCost(
          achievement
        );


      if (
        next !== null
      ) {

        total += next;

      }

    }
  );


  return total;

}


// =============================
// STATS
// =============================

export function
calculateAchievementStats() {

  const totals = {};


  achievements.forEach(
    achievement => {

      const unlocked =
        unlockedAchievements[
          achievement.name
        ] === true;


      if (!unlocked) {

        return;

      }


      const currentLevel =
        getLevel(
          achievement.name
        );


      if (
        currentLevel < 1
      ) {

        return;

      }


      const levelData =
        achievement.levels.find(
          level =>
            level.level ===
            currentLevel
        );


      if (!levelData) {

        return;

      }


      Object.entries(
        levelData.stats
      ).forEach(
        ([stat, value]) => {

          if (!totals[stat]) {

            totals[stat] = {
              flat: 0,
              percent: 0
            };

          }


          if (
            typeof value ===
              "string" &&
            value.includes("%")
          ) {

            totals[stat]
              .percent +=
              parseFloat(
                value
              );

          }

          else if (
            typeof value ===
            "number"
          ) {

            totals[stat]
              .flat +=
              value;

          }

        }
      );

    }
  );


  return totals;

}


// =============================
// FORMAT NUMBER
// =============================

function formatNumber(
  number
) {

  return new Intl.NumberFormat(
    "en-US"
  ).format(
    number
  );

}


// =============================
// RENDER STATS
// =============================

function renderStats() {

  const container =
    document.getElementById(
      "stats"
    );


  if (!container) {

    return;

  }


  const stats =
    calculateAchievementStats();


  container.innerHTML =
    "";


  Object.keys(
    statNames
  ).forEach(
    key => {

      const stat =
        stats[key];


      if (!stat) {

        return;

      }


      if (
        stat.flat === 0 &&
        stat.percent === 0
      ) {

        return;

      }


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "stat-card";


      let valueHTML = "";


      if (
        stat.flat !== 0
      ) {

        valueHTML += `
          <span class="stat-value">
            ${
              formatNumber(
                stat.flat
              )
            }
          </span>
        `;

      }


      if (
        stat.percent !== 0
      ) {

        valueHTML += `
          <span class="stat-percent">
            +${stat.percent}%
          </span>
        `;

      }


      card.innerHTML = `
        <span class="stat-name">
          ${statNames[key]}
        </span>

        ${valueHTML}
      `;


      container.appendChild(
        card
      );

    }
  );


  if (
    container.children.length ===
    0
  ) {

    container.innerHTML = `
      <div class="stat-card">

        <span class="stat-name">
          No stats selected yet.
        </span>

      </div>
    `;

  }

}


// =============================
// RENDER SUMMARY
// =============================

function renderSummary() {

  const buildCostElement =
    document.getElementById(
      "build-cost"
    );


  const availableElement =
    document.getElementById(
      "available-tokens"
    );


  const tokenInput =
    document.getElementById(
      "owned-tokens"
    );


  if (buildCostElement) {

    buildCostElement.textContent =
      `${formatNumber(
        calculateTotalCost()
      )} UR Tokens`;

  }


  if (availableElement) {

    if (
      buildMode ===
      "unlimited"
    ) {

      availableElement.textContent =
        "Unlimited";

    }

    else {

      const available =
        Math.max(
          0,
          getAvailableTokens()
        );


      availableElement.textContent =
        `${formatNumber(
          available
        )} UR Tokens`;

    }

  }


  if (tokenInput) {

    tokenInput.value =
      ownedTokens;

  }


  document
    .querySelectorAll(
      ".build-mode-button"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.buildMode ===
            buildMode
        );

      }
    );

}


// =============================
// RENDER ACHIEVEMENTS
// =============================

function renderAchievements() {

  const container =
    document.getElementById(
      "achievements"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  achievements.forEach(
    achievement => {

      const currentLevel =
        getLevel(
          achievement.name
        );


      const unlocked =
        unlockedAchievements[
          achievement.name
        ] === true;


      const elementOK =
        !achievement.element ||
        achievement.element ===
          selectedElement;


      const prerequisiteMet =
        !achievement.prerequisite ||
        getLevel(
          achievement.prerequisite
        ) === 6;


      const available =
        isAvailable(
          achievement
        );


      const levelOneAffordable =
        buildMode ===
          "unlimited" ||
        getCostForLevel(
          achievement,
          1
        ) <=
          getAvailableTokens();


      const canMarkAsUnlocked =
        !unlocked &&
        elementOK &&
        prerequisiteMet &&
        levelOneAffordable;


      const trulyLocked =
        !unlocked;


      // -------------------------
      // FILTER
      // -------------------------

      if (
        selectedFilter ===
          "selected" &&
        !unlocked
      ) {

        return;

      }


      if (
        selectedFilter ===
          "available" &&
        !available
      ) {

        return;

      }


      if (
        selectedFilter ===
          "locked" &&
        !trulyLocked
      ) {

        return;

      }


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "achievement";


      if (
        achievement.element
      ) {

        row.classList.add(
          achievement.element
            .toLowerCase()
        );

      }


      if (!unlocked) {

        row.classList.add(
          "locked"
        );

      }

      else if (!available) {

        row.classList.add(
          "upgrade-locked"
        );

      }


      // -------------------------
      // META
      // -------------------------

      let meta = "";


      if (
        achievement.element
      ) {

        meta =
          achievement.element;

      }


      if (
        achievement.prerequisite
      ) {

        meta +=
          `${
            meta
              ? " · "
              : ""
          }` +
          `Requires ${
            achievement.prerequisite
          } Lv. 6`;

      }


      // -------------------------
      // LEVEL BUTTONS
      // -------------------------

      let buttons = "";


      for (
        let level = 1;
        level <= 6;
        level++
      ) {

        const affordable =
          canAffordLevel(
            achievement,
            level
          );


        const disabled =
          !available ||
          !affordable;


        let buttonTitle =
          "";


        if (
          available &&
          !affordable
        ) {

          const missingTokens =
            getMissingTokens(
              achievement,
              level
            );


          buttonTitle =
            `Not enough UR Tokens · Need ${formatNumber(
              missingTokens
            )} more`;

        }


        buttons += `
          <button
            class="
              level-button
              ${
                unlocked &&
                currentLevel ===
                  level
                  ? "active"
                  : ""
              }

              ${
                !affordable &&
                available
                  ? "unaffordable"
                  : ""
              }
            "
            data-name="${
              achievement.name
            }"
            data-level="${level}"
            ${
              disabled
                ? "disabled"
                : ""
            }
            ${
              buttonTitle
                ? `title="${buttonTitle}"`
                : ""
            }
          >
            ${level}
          </button>
        `;

      }


      // -------------------------
      // COST
      // -------------------------

      const nextCost =
        getNextCost(
          achievement
        );


      let costText =
        "LOCKED";


      if (unlocked) {

        costText =
          nextCost === null
            ? "MAX"
            : `${formatNumber(
                nextCost
              )} UR Tokens`;

      }


      // -------------------------
      // STATUS MESSAGE
      // -------------------------

      let lockMessage = "";


      if (!elementOK) {

        lockMessage =
          `Not available for ${selectedElement} T1`;

      }

      else if (!unlocked) {

        if (
          achievement.prerequisite &&
          !prerequisiteMet
        ) {

          lockMessage =
            `🔒 Locked · Requires ${achievement.prerequisite} Level 6`;

        }

        else if (
          achievement.prerequisite
        ) {

          lockMessage =
            "🔒 Locked · Additional Palmon requirement not tracked";

        }

        else {

          lockMessage =
            "🔒 Locked · Mark as unlocked when available ingame";

        }

      }

      else if (
        achievement.prerequisite &&
        !prerequisiteMet
      ) {

        lockMessage =
          `✓ Unlocked · Requires ${achievement.prerequisite} Level 6 to upgrade`;

      }


      // -------------------------
      // UNLOCK BUTTON
      // -------------------------

      let unlockButtonHTML =
        "";


      if (!unlocked) {

        unlockButtonHTML = `
          <button
            class="unlock-button"
            data-unlock="${
              achievement.name
            }"
            ${
              canMarkAsUnlocked
                ? ""
                : "disabled"
            }
          >
            Mark as Unlocked
          </button>
        `;

      }


      // -------------------------
      // HTML
      // -------------------------

      row.innerHTML = `

        <div>

          <div class="achievement-name">
            ${achievement.name}
          </div>

          <div class="achievement-meta">
            ${meta || "Universal"}
          </div>

          ${
            lockMessage
              ? `
                <div class="locked-text">
                  ${lockMessage}
                </div>
              `
              : ""
          }

          ${unlockButtonHTML}

        </div>


        <div class="levels">
          ${buttons}
        </div>


        <div class="achievement-cost">

          <span class="cost-label">
            Next Upgrade
          </span>

          <span class="cost-value">
            ${costText}
          </span>

        </div>

      `;


      container.appendChild(
        row
      );

    }
  );


  addLevelListeners();

  addUnlockListeners();

}


// =============================
// LEVEL BUTTON EVENTS
// =============================

function addLevelListeners() {

  document
    .querySelectorAll(
      ".level-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const name =
              button.dataset.name;


            const level =
              Number(
                button.dataset.level
              );


            const achievement =
              achievements.find(
                item =>
                  item.name ===
                  name
              );


            if (!achievement) {

              return;

            }


            if (
              !isAvailable(
                achievement
              )
            ) {

              return;

            }


            if (
              !canAffordLevel(
                achievement,
                level
              )
            ) {

              return;

            }


            selectedLevels[
              name
            ] = level;


            updatePrerequisiteStates();

            saveState();

            render();

          }
        );

      }
    );

}

// =============================
// UNLOCK BUTTON EVENTS
// =============================

function addUnlockListeners() {

  document
    .querySelectorAll(
      ".unlock-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const achievementName =
              button.dataset.unlock;


            unlockAchievement(
              achievementName
            );

          }
        );

      }
    );

}


// =============================
// ELEMENT
// =============================

function addElementListener() {

  const elementSelect =
    document.getElementById(
      "element"
    );


  if (!elementSelect) {

    return;

  }


  elementSelect.addEventListener(
    "change",
    event => {

      selectedElement =
        event.target.value;


      saveState();

      render();

    }
  );

}


// =============================
// RESET
// =============================

function addResetListener() {

  const resetButton =
    document.getElementById(
      "reset-button"
    );


  if (!resetButton) {

    return;

  }


  resetButton.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Reset all achievements?"
        );


      if (!confirmed) {

        return;

      }


      selectedLevels = {};

      unlockedAchievements = {};


      saveState();

      render();

    }
  );

}


// =============================
// BUILD MODE
// =============================

function addBuildModeListeners() {

  const tokenInput =
    document.getElementById(
      "owned-tokens"
    );


  if (tokenInput) {

    tokenInput.addEventListener(
      "input",
      event => {

        const value =
          Number(
            event.target.value
          );


        ownedTokens =
          Math.max(
            0,
            Number.isFinite(value)
              ? Math.floor(value)
              : 0
          );


        saveState();

        render();

      }
    );

  }


  document
    .querySelectorAll(
      ".build-mode-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const newMode =
              button.dataset.buildMode;


            if (
              newMode === buildMode
            ) {

              return;

            }


            if (
              newMode ===
              "budget"
            ) {

              // Der aktuelle Build wird
              // zum Ausgangspunkt.
              budgetBaseCost =
                calculateTotalCost();


              buildMode =
                "budget";

            }

            else {

              buildMode =
                "unlimited";

              budgetBaseCost = 0;

            }


            saveState();

            render();

          }
        );

      }
    );

}


// =============================
// FILTERS
// =============================

function addFilterListeners() {

  document
    .querySelectorAll(
      ".filter-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            selectedFilter =
              button.dataset.filter;


            document
              .querySelectorAll(
                ".filter-button"
              )
              .forEach(
                filterButton => {

                  filterButton
                    .classList
                    .remove(
                      "active"
                    );

                }
              );


            button.classList.add(
              "active"
            );


            renderAchievements();

          }
        );

      }
    );

}


// =============================
// RENDER EVERYTHING
// =============================

function render() {

  renderSummary();

  renderStats();

  renderAchievements();

}
