let achievements = [];

let selectedElement = "Water";

let selectedLevels = {};

let unlockedAchievements = {};

let selectedFilter = "all";

let currentPage = "overview";


// =============================
// STAT NAMES
// =============================

const statNames = {
  attack: "Attack",
  defense: "Defense",
  hp: "HP",
  critChance: "Crit Chance",
  critDamage: "Crit Damage",
  accuracy: "Accuracy",
  critDamageReduction:
    "Crit Damage Reduction",
  tenacity: "Tenacity",
  rage: "Rage",
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
// LOAD DATA
// =============================

async function loadData() {

  try {

    const response =
      await fetch(
        "./achievements.json"
      );


    if (!response.ok) {

      throw new Error(
        `Could not load achievements.json (${response.status})`
      );

    }


    const data =
      await response.json();


    achievements =
      data.achievements || [];


    loadSavedState();

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

  localStorage.setItem(
    "achievementPlanner",
    JSON.stringify({
      element:
        selectedElement,

      levels:
        selectedLevels,

      unlocked: 
        unlockedAchievements
    })
  );

}


// =============================
// LOAD SAVE
// =============================

function loadSavedState() {

  const saved =
    localStorage.getItem(
      "achievementPlanner"
    );


  if (!saved) {
    return;
  }


  try {

    const data =
      JSON.parse(saved);


    selectedElement =
      data.element ||
      "Water";


    selectedLevels =
      data.levels ||
      {};

    unlockedAchievements =
      data.unlocked ||
      {};


    const elementSelect =
      document.getElementById(
        "element"
      );


    if (elementSelect) {

      elementSelect.value =
        selectedElement;

    }

  }

  catch (error) {

    console.error(
      "Could not load save.",
      error
    );

  }

}


// =============================
// PAGE NAVIGATION
// =============================

function showPage(pageName) {

  const targetPage =
    document.getElementById(
      `page-${pageName}`
    );


  if (!targetPage) {

    console.error(
      `Page not found: ${pageName}`
    );

    return;
  }


  currentPage =
    pageName;


  document
    .querySelectorAll(
      ".app-page"
    )
    .forEach(page => {

      page.classList.remove(
        "active"
      );

    });


  document
    .querySelectorAll(
      ".nav-button"
    )
    .forEach(button => {

      button.classList.remove(
        "active"
      );

    });


  targetPage.classList.add(
    "active"
  );


  const activeButton =
    document.querySelector(
      `.nav-button[data-page="${pageName}"]`
    );


  if (activeButton) {

    activeButton.classList.add(
      "active"
    );

  }

}


function addNavigationListeners() {

  document
    .querySelectorAll(
      ".nav-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const page =
            button.dataset.page;


          showPage(page);

        }
      );

    });

}


// =============================
// AVAILABILITY
// =============================

function isAvailable(achievement) {

  const elementOK =
    !achievement.element ||
    achievement.element === selectedElement;


  // Achievements ohne Voraussetzung
  // sind direkt verfügbar.
  if (!achievement.prerequisite) {
    return elementOK;
  }


  const prerequisiteOK =
    getLevel(
      achievement.prerequisite
    ) === 6;


  const unlocked =
    unlockedAchievements[
      achievement.name
    ] === true;


  return (
    elementOK &&
    prerequisiteOK &&
    unlocked
  );

}


// =============================
// CURRENT LEVEL
// =============================

function getLevel(name) {

  return (
    selectedLevels[name] ||
    0
  );

}


// =============================
// Is Prerequisite Unlocked
// =============================

function updatePrerequisiteStates() {

  achievements.forEach(
    achievement => {

      if (!achievement.prerequisite) {
        return;
      }


      const unlocked =
        unlockedAchievements[
          achievement.name
        ] === true;


      if (!unlocked) {
        return;
      }


      const prerequisiteLevel =
        getLevel(
          achievement.prerequisite
        );


      // Ein einmal freigeschaltetes Achievement
      // bleibt mindestens Level 1.
      if (
        getLevel(
          achievement.name
        ) < 1
      ) {

        selectedLevels[
          achievement.name
        ] = 1;

      }


      // Wird die Voraussetzung zurückgesetzt,
      // fällt das Achievement auf Level 1 zurück.
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
// TOTAL COST FOR ACHIEVEMENT
// =============================

function getAchievementCost(
  achievement
) {

  const currentLevel =
    getLevel(
      achievement.name
    );


  let total = 0;


  achievement.levels.forEach(
    level => {

      if (
        level.level <=
        currentLevel
      ) {

        total +=
          level.cost;

      }

    }
  );


  return total;

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

function calculateStats() {

  const totals = {};


  achievements.forEach(
    achievement => {

      const currentLevel =
        getLevel(
          achievement.name
        );


      if (
        currentLevel === 0
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

          if (
            !totals[stat]
          ) {

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
              parseFloat(value);

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
  ).format(number);

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
    calculateStats();


  container.innerHTML = "";


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
// RENDER ACHIEVEMENTS
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


  if (!achievement.prerequisite) {
    return;
  }


  const prerequisiteLevel =
    getLevel(
      achievement.prerequisite
    );


  if (prerequisiteLevel !== 6) {
    return;
  }


  unlockedAchievements[
    achievement.name
  ] = true;


  if (
    getLevel(
      achievement.name
    ) < 1
  ) {

    selectedLevels[
      achievement.name
    ] = 1;

  }


  saveState();

  render();

}

function renderAchievements() {

  const container =
    document.getElementById(
      "achievements"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  achievements.forEach(
    achievement => {

      const available =
        isAvailable(
          achievement
        );


      const currentLevel =
        getLevel(
          achievement.name
        );


      const permanentlyUnlocked =
        unlockedAchievements[
          achievement.name
        ] === true;

      const prerequisiteMet =
        !achievement.prerequisite ||
        getLevel(
          achievement.prerequisite
        ) === 6;


      const canMarkAsUnlocked =
        achievement.prerequisite &&
        !permanentlyUnlocked &&
        prerequisiteMet &&
        (
          !achievement.element ||
          achievement.element ===
            selectedElement
        );

      const trulyLocked =
        !available &&
        !permanentlyUnlocked;


      if (
        selectedFilter === "selected" &&
        currentLevel === 0
      ) {

        return;

      }


      if (
        selectedFilter === "available" &&
        !available
      ) {

        return;

      }


      if (
        selectedFilter === "locked" &&
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


      if (!available) {

        if (permanentlyUnlocked) {

          row.classList.add(
            "upgrade-locked"
          );
  
        }

        else {

          row.classList.add(
            "locked"
          );

        }

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
        let level = 0;
        level <= 6;
        level++
      ) {

      const disableLevelZero =
        permanentlyUnlocked &&
        level === 0;

        const label =
          level === 0
            ? "—"
            : level;


        buttons += `
          <button
            class="
              level-button
              ${
                currentLevel ===
                level
                  ? "active"
                  : ""
              }
            "
            data-name="${
              achievement.name
            }"
            data-level="${level}"
            ${
              !available ||
              disableLevelZero
                ? "disabled"
                : ""
            }
          >
            ${label}
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


      const costText =
        nextCost === null
          ? "MAX"
          : formatNumber(
              nextCost
            );


      // -------------------------
      // LOCK MESSAGE
      // -------------------------

    let lockMessage = "";


    if (
      achievement.prerequisite &&
      !permanentlyUnlocked
    ) {

      if (!prerequisiteMet) {

        lockMessage =
          `🔒 Locked · Requires ${achievement.prerequisite} Level 6`;

      }

      else {

        lockMessage =
          `🔒 Locked · Additional Palmon requirement not tracked`;

      }

    }

    else if (
      achievement.prerequisite &&
      permanentlyUnlocked &&
      !prerequisiteMet
    ) {

      lockMessage =
        `✓ Unlocked · Requires ${achievement.prerequisite} Level 6 to upgrade`;

    }

    else if (
      achievement.element &&
      achievement.element !==
        selectedElement
    ) {

      lockMessage =
        `Not available for ${selectedElement} T1`;

    }

    let unlockButtonHTML = "";


    if (canMarkAsUnlocked) {

      unlockButtonHTML = `
        <button
          class="unlock-button"
          data-unlock="${
            achievement.name
          }"
        >
          Mark as Unlocked
        </button>
      `;

    }
      
      
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
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const name =
            button.dataset.name;


          const level =
            Number(
              button.dataset.level
            );


          selectedLevels[name] =
            level;

          updatePrerequisiteStates();

          saveState();

          render();

        }
      );

    });

}

function addUnlockListeners() {

  document
    .querySelectorAll(
      ".unlock-button"
    )
    .forEach(button => {

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

    });

}

// =============================
// SUMMARY
// =============================

function renderSummary() {

  const totalCost =
    document.getElementById(
      "total-cost"
    );


  const nextCost =
    document.getElementById(
      "next-cost"
    );


  if (totalCost) {

    totalCost.textContent =
      `${formatNumber(
        calculateTotalCost()
      )} UR Tokens`;

  }


  if (nextCost) {

    nextCost.textContent =
      `${formatNumber(
        calculateNextCosts()
      )} UR Tokens`;

  }

}


// =============================
// RENDER EVERYTHING
// =============================

function render() {

  renderSummary();

  renderStats();

  renderAchievements();

}


// =============================
// ELEMENT SELECT
// =============================

const elementSelect =
  document.getElementById(
    "element"
  );


if (elementSelect) {

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

const resetButton =
  document.getElementById(
    "reset-button"
  );


if (resetButton) {

  resetButton.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Reset all selected achievement levels?"
        );


      if (!confirmed) {
        return;
      }


      selectedLevels = {};


      saveState();

      render();

    }
  );

}


// =============================
// ACHIEVEMENT FILTERS
// =============================

function addFilterListeners() {

  document
    .querySelectorAll(
      ".filter-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedFilter =
            button.dataset.filter;


          document
            .querySelectorAll(
              ".filter-button"
            )
            .forEach(filterButton => {

              filterButton.classList.remove(
                "active"
              );

            });


          button.classList.add(
            "active"
          );


          renderAchievements();

        }
      );

    });

}


// =============================
// START
// =============================

addNavigationListeners();

addFilterListeners();

showPage(
  currentPage
);

loadData();
