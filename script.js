let achievements = [];

let selectedElement = "Water";

let selectedLevels = {};

let selectedFilter = "all";


// -----------------------------
// STAT NAMES
// -----------------------------

const statNames = {
  attack: "Attack",
  defense: "Defense",
  hp: "HP",
  critChance: "Crit Chance",
  critDamage: "Crit Damage",
  accuracy: "Accuracy",
  critDamageReduction: "Crit Damage Reduction",
  tenacity: "Tenacity",
  rage: "Rage",
  rageSkillDamageBonus: "Rage Skill Damage Bonus",
  rageSkillDamageTakenReduction:
    "Rage Skill Damage Taken Reduction",
  allPalmonArmigoCapacity:
    "Palmon Armigo Capacity",
  armigoAttack: "Armigo Attack",
  armigoHP: "Armigo HP"
};


// -----------------------------
// LOAD DATA
// -----------------------------

async function loadData() {

  const response =
    await fetch("./achievements.json");

  const data =
    await response.json();

  achievements =
    data.achievements;

  loadSavedState();

  render();
}


// -----------------------------
// SAVE
// -----------------------------

function saveState() {

  localStorage.setItem(
    "achievementPlanner",
    JSON.stringify({
      element: selectedElement,
      levels: selectedLevels
    })
  );
}


// -----------------------------
// LOAD SAVE
// -----------------------------

function loadSavedState() {

  const saved =
    localStorage.getItem(
      "achievementPlanner"
    );

  if (!saved) return;

  try {

    const data =
      JSON.parse(saved);

    selectedElement =
      data.element || "Water";

    selectedLevels =
      data.levels || {};

    document.getElementById(
      "element"
    ).value = selectedElement;

  } catch (error) {

    console.error(
      "Could not load save.",
      error
    );
  }
}


// -----------------------------
// AVAILABILITY
// -----------------------------

function isAvailable(achievement) {

  const elementOK =
    !achievement.element ||
    achievement.element ===
      selectedElement;


  const prerequisiteOK =
    !achievement.prerequisite ||
    selectedLevels[
      achievement.prerequisite
    ] === 6;


  return elementOK &&
         prerequisiteOK;
}


// -----------------------------
// CURRENT LEVEL
// -----------------------------

function getLevel(name) {

  return selectedLevels[name] || 0;
}


// -----------------------------
// TOTAL COST FOR ACHIEVEMENT
// -----------------------------

function getAchievementCost(
  achievement
) {

  const currentLevel =
    getLevel(achievement.name);

  let total = 0;

  achievement.levels.forEach(
    level => {

      if (
        level.level <= currentLevel
      ) {
        total += level.cost;
      }

    }
  );

  return total;
}


// -----------------------------
// NEXT COST
// -----------------------------

function getNextCost(
  achievement
) {

  const currentLevel =
    getLevel(achievement.name);

  if (currentLevel >= 6) {
    return null;
  }

  const nextLevel =
    currentLevel + 1;

  const data =
    achievement.levels.find(
      level =>
        level.level === nextLevel
    );

  return data
    ? data.cost
    : null;
}


// -----------------------------
// TOTAL COST
// -----------------------------

function calculateTotalCost() {

  return achievements.reduce(
    (total, achievement) => {

      return total +
        getAchievementCost(
          achievement
        );

    },
    0
  );
}


// -----------------------------
// NEXT UPGRADE COSTS
// -----------------------------

function calculateNextCosts() {

  let total = 0;

  achievements.forEach(
    achievement => {

      if (!isAvailable(achievement)) {
        return;
      }

      const next =
        getNextCost(achievement);

      if (next !== null) {
        total += next;
      }

    }
  );

  return total;
}


// -----------------------------
// STATS
// -----------------------------

function calculateStats() {

  const totals = {};


  achievements.forEach(
    achievement => {

      const currentLevel =
        getLevel(
          achievement.name
        );

      if (currentLevel === 0) {
        return;
      }


      const levelData =
        achievement.levels.find(
          level =>
            level.level ===
            currentLevel
        );


      if (!levelData) return;


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


          // Percentage stored as text:
          // "7%"

          if (
            typeof value === "string" &&
            value.includes("%")
          ) {

            totals[stat].percent +=
              parseFloat(value);

          }

          // Normal number

          else if (
            typeof value === "number"
          ) {

            totals[stat].flat +=
              value;

          }

        }
      );

    }
  );


  return totals;
}


// -----------------------------
// FORMAT NUMBER
// -----------------------------

function formatNumber(number) {

  return new Intl.NumberFormat(
    "en-US"
  ).format(number);
}


// -----------------------------
// RENDER STATS
// -----------------------------

function renderStats() {

  const container =
    document.getElementById(
      "stats"
    );

  const stats =
    calculateStats();

  container.innerHTML = "";


  Object.keys(statNames).forEach(
    key => {

      const stat =
        stats[key];

      if (!stat) return;


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


      if (stat.flat !== 0) {

        valueHTML += `
          <span class="stat-value">
            ${formatNumber(
              stat.flat
            )}
          </span>
        `;

      }


      if (stat.percent !== 0) {

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
    container.children.length === 0
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


// -----------------------------
// RENDER ACHIEVEMENTS
// -----------------------------

function renderAchievements() {

  const container =
    document.getElementById(
      "achievements"
    );

  container.innerHTML = "";


  achievements.forEach(
    achievement => {

      const available =
        isAvailable(
          achievement
        );

      if (
        selectedFilter === "available" &&
        !available
      ) {
        return;
      }

      if (
        selectedFilter === "locked" &&
        available
      ) {
        return;
      }

      const currentLevel =
        getLevel(
          achievement.name
        );


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "achievement";


      if (achievement.element) {

        row.classList.add(
          achievement.element
            .toLowerCase()
        );

      }


      if (!available) {

        row.classList.add(
          "locked"
        );

      }


      // -----------------
      // NAME
      // -----------------

      let meta = "";


      if (achievement.element) {

        meta =
          achievement.element;

      }


      if (
        achievement.prerequisite
      ) {

        meta +=
          `${meta ? " · " : ""}` +
          `Requires ${
            achievement.prerequisite
          } Lv. 6`;

      }


      // -----------------
      // LEVEL BUTTONS
      // -----------------

      let buttons = "";


      for (
        let level = 0;
        level <= 6;
        level++
      ) {

        const label =
          level === 0
            ? "—"
            : level;


        buttons += `
          <button
            class="
              level-button
              ${
                currentLevel === level
                  ? "active"
                  : ""
              }
            "
            data-name="${
              achievement.name
            }"
            data-level="${level}"
            ${
              !available
                ? "disabled"
                : ""
            }
          >
            ${label}
          </button>
        `;

      }


      // -----------------
      // COST
      // -----------------

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


      // -----------------
      // LOCK MESSAGE
      // -----------------

      let lockMessage = "";


      if (!available) {

        if (
          achievement.element &&
          achievement.element !==
            selectedElement
        ) {

          lockMessage =
            `Not available for ` +
            `${selectedElement} T1`;

        }

        else if (
          achievement.prerequisite
        ) {

          lockMessage =
            `🔒 Requires ` +
            `${achievement.prerequisite} ` +
            `Level 6`;

        }

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
}


// -----------------------------
// LEVEL BUTTON EVENTS
// -----------------------------

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


          saveState();

          render();

        }
      );

    });
}


// -----------------------------
// SUMMARY
// -----------------------------

function renderSummary() {

  document.getElementById(
    "total-cost"
  ).textContent =
    formatNumber(
      calculateTotalCost()
    );


  document.getElementById(
    "next-cost"
  ).textContent =
    formatNumber(
      calculateNextCosts()
    );
}


// -----------------------------
// RENDER EVERYTHING
// -----------------------------

function render() {

  renderSummary();

  renderStats();

  renderAchievements();
}


// -----------------------------
// ELEMENT SELECT
// -----------------------------

document.getElementById(
  "element"
).addEventListener(
  "change",
  event => {

    selectedElement =
      event.target.value;

    saveState();

    render();

  }
);


// -----------------------------
// RESET
// -----------------------------

document.getElementById(
  "reset-button"
).addEventListener(
  "click",
  () => {

    const confirmed =
      confirm(
        "Reset all selected levels?"
      );

    if (!confirmed) return;


    selectedLevels = {};

    saveState();

    render();

  }
);

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
          .forEach(otherButton => {

            otherButton.classList.remove(
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

// -----------------------------
// PAGE NAVIGATION
// -----------------------------

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


        document
          .querySelectorAll(
            ".nav-button"
          )
          .forEach(navButton => {

            navButton.classList.remove(
              "active"
            );

          });


        document
          .querySelectorAll(
            ".app-page"
          )
          .forEach(pageElement => {

            pageElement.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );


        document
          .getElementById(
            `page-${page}`
          )
          .classList.add(
            "active"
          );

      }
    );

  });

// -----------------------------
// START
// -----------------------------

loadData();
