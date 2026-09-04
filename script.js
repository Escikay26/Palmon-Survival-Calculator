let achievements = [];
let selectedLevels = {};
let selectedElement = "Water";

async function loadAchievements() {
  try {
    const response = await fetch("./achievements.json");

    if (!response.ok) {
      throw new Error("Could not load achievements.json");
    }

    const data = await response.json();
    achievements = data.achievements;

    renderAchievements();

  } catch (error) {
    console.error(error);

    document.getElementById("achievements").innerHTML =
      "<p>Could not load achievement data.</p>";
  }
}

function renderAchievements() {
  const container = document.getElementById("achievements");

  container.innerHTML = "";

  achievements.forEach((achievement) => {
    const card = document.createElement("div");

    card.classList.add("achievement-card");

    // Element-Klasse hinzufügen
    if (achievement.element) {
      card.classList.add(
        `element-${achievement.element.toLowerCase()}`
      );
    }

    // Prüfen, ob das Achievement zum T1 Element passt
    const wrongElement =
      achievement.element &&
      achievement.element !== selectedElement;

    // Prüfen, ob das Prerequisite Level 6 erreicht hat
    let prerequisiteLocked = false;

    if (achievement.prerequisite) {
      const prerequisiteLevel =
        selectedLevels[achievement.prerequisite] || 0;

      prerequisiteLocked = prerequisiteLevel < 6;
    }

    const locked = wrongElement || prerequisiteLocked;

    if (locked) {
      card.classList.add("locked");
    }

    // Aktuelles Level
    const currentLevel =
      selectedLevels[achievement.name] || 0;

    // Level Dropdown
    const levelOptions = [
      `<option value="0">Not unlocked</option>`
    ];

    for (let level = 1; level <= 6; level++) {
      levelOptions.push(
        `<option value="${level}" ${
          currentLevel === level ? "selected" : ""
        }>
          Level ${level}
        </option>`
      );
    }

    // Prerequisite Text
    let prerequisiteText = "None";

    if (achievement.prerequisite) {
      prerequisiteText =
        `${achievement.prerequisite} — Level 6`;
    }

    // Element Badge
    const elementBadge = achievement.element
      ? `<span class="element-badge">
          ${achievement.element}
        </span>`
      : "";

    card.innerHTML = `
      <div class="achievement-header">

        <div>
          <h3>${achievement.name}</h3>
          ${elementBadge}
        </div>

      </div>

      <div class="achievement-info">

        <div>
          <span class="label">Prerequisite</span>
          <span>${prerequisiteText}</span>
        </div>

        <div>
          <span class="label">Current Level</span>

          <select
            class="level-select"
            data-achievement="${achievement.name}"
            ${locked ? "disabled" : ""}
          >
            ${levelOptions.join("")}
          </select>

        </div>

      </div>

      ${
        prerequisiteLocked
          ? `<div class="locked-message">
               🔒 Requires ${achievement.prerequisite} Level 6
             </div>`
          : ""
      }

      ${
        wrongElement
          ? `<div class="locked-message">
               Not available for ${selectedElement} T1
             </div>`
          : ""
      }
    `;

    container.appendChild(card);
  });

  addLevelListeners();
}

function addLevelListeners() {
  const selects =
    document.querySelectorAll(".level-select");

  selects.forEach((select) => {
    select.addEventListener("change", (event) => {

      const achievementName =
        event.target.dataset.achievement;

      const level =
        Number(event.target.value);

      selectedLevels[achievementName] = level;

      renderAchievements();
    });
  });
}

// T1 Element Dropdown
const elementSelect =
  document.getElementById("element");

elementSelect.addEventListener("change", () => {

  selectedElement = elementSelect.value;

  renderAchievements();
});

// App starten
loadAchievements();
