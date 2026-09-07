import {
  loadResearchState,
  saveResearchState
} from "./storage.js";


// =============================
// STATE
// =============================

let researchTrees = [];

let selectedTreeKey = null;

let selectedLevels = {};

let nodeMap = new Map();


// =============================
// LABELS
// =============================

const STAT_LABELS = {
  attack: "Attack",
  defense: "Defense",
  hp: "HP",

  finalDamage:
    "Final Damage",

  finalDamageTaken:
    "Final Damage Taken",

  finalDamageTakenReduction:
    "Final Damage Taken Reduction",

  critChance:
    "Crit Rate",

  critRate:
    "Crit Rate",

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

  armigoDefense:
    "Armigo Defense",

  armigoHP:
    "Armigo HP",

  armigoLoad:
    "Armigo Load",

  squadLoad:
    "Squad Load",

  load:
    "Load",

  morale:
    "Morale",

  researchSpeed:
    "Research Speed",

  marchSpeed:
    "March Speed",

  treasureHuntAttempts:
    "Treasure Hunt Attempts",

  powerPlantOutput:
    "Power Plant Output",

  armigoTrainingSpeed:
    "Armigo Training Speed",

  opponentDeathRate:
    "Opponent Death Rate"
};


const CONDITION_LABELS = {
  attackingCamps:
    "when attacking Camps",

  defendingCamps:
    "when defending Camps",

  combat:
    "in combat"
};


// =============================
// INITIALIZE
// =============================

export async function
initResearchSystem() {

  try {

    const response =
      await fetch(
        "./data/research-trees.json"
      );


    if (!response.ok) {

      throw new Error(
        `Could not load research-trees.json (${response.status})`
      );

    }


    const data =
      await response.json();


    researchTrees =
      data.trees || [];


    buildNodeMap();

    loadState();

    normalizeAllLevels();

    saveState();

    addResearchListeners();

    render();

  }

  catch (error) {

    console.error(
      "Could not load Research data.",
      error
    );


    const root =
      document.getElementById(
        "research-root"
      );


    if (root) {

      root.innerHTML = `
        <div class="placeholder-card">
          <h3>
            Could not load Research
          </h3>

          <p>
            Check data/research-trees.json
            and the browser console.
          </p>
        </div>
      `;

    }

  }

}


// =============================
// NODE MAP
// =============================

function buildNodeMap() {

  nodeMap =
    new Map();


  researchTrees.forEach(
    tree => {

      tree.nodes.forEach(
        node => {

          nodeMap.set(
            node.key,
            {
              tree,
              node
            }
          );

        }
      );

    }
  );

}


// =============================
// STORAGE
// =============================

function loadState() {

  const saved =
    loadResearchState();


  selectedLevels =
    saved.levels || {};


  selectedTreeKey =
    saved.selectedTreeKey;


  const treeExists =
    researchTrees.some(
      tree =>
        tree.key ===
        selectedTreeKey
    );


  if (
    !treeExists &&
    researchTrees.length > 0
  ) {

    selectedTreeKey =
      researchTrees[0].key;

  }

}


function saveState() {

  saveResearchState({

    selectedTreeKey,
    levels:
      selectedLevels

  });

}


// =============================
// HELPERS
// =============================

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


function getLevel(
  nodeKey
) {

  return Math.max(
    0,
    Number(
      selectedLevels[
        nodeKey
      ]
    ) || 0
  );

}


function setLevel(
  nodeKey,
  level
) {

  const entry =
    nodeMap.get(
      nodeKey
    );


  if (!entry) {

    return;

  }


  selectedLevels[
    nodeKey
  ] = clamp(
    Math.floor(
      Number(level) || 0
    ),
    0,
    entry.node.maxLevel
  );

}


function getSelectedTree() {

  return (
    researchTrees.find(
      tree =>
        tree.key ===
        selectedTreeKey
    ) ||
    researchTrees[0] ||
    null
  );

}


function getLevelData(
  node,
  level
) {

  return (
    node.levels.find(
      levelData =>
        levelData.level ===
        level
    ) ||
    null
  );

}


// =============================
// TECH REQUIREMENTS
// =============================

function getTechRequirements(
  node,
  targetLevel
) {

  if (
    targetLevel <= 0
  ) {

    return [];

  }


  const levelData =
    getLevelData(
      node,
      targetLevel
    );


  return (
    levelData
      ?.requirements
      ?.techs ||
    []
  );

}


function getBuildingRequirements(
  node,
  targetLevel
) {

  if (
    targetLevel <= 0
  ) {

    return [];

  }


  const levelData =
    getLevelData(
      node,
      targetLevel
    );


  return (
    levelData
      ?.requirements
      ?.buildings ||
    []
  );

}


function areTechRequirementsMet(
  node,
  targetLevel
) {

  if (
    targetLevel <= 0
  ) {

    return true;

  }


  const requirements =
    getTechRequirements(
      node,
      targetLevel
    );


  return requirements.every(
    requirement => {

      return (
        getLevel(
          requirement.key
        ) >=
        requirement.level
      );

    }
  );

}


// =============================
// HIGHEST VALID LEVEL
// =============================

function getHighestValidLevel(
  node
) {

  let highest = 0;


  for (
    let level = 1;
    level <= node.maxLevel;
    level++
  ) {

    if (
      !areTechRequirementsMet(
        node,
        level
      )
    ) {

      break;

    }


    highest =
      level;

  }


  return highest;

}


// =============================
// NORMALIZE DEPENDENCIES
// =============================

function normalizeAllLevels() {

  let changed = true;

  let safetyCounter = 0;


  while (
    changed &&
    safetyCounter < 100
  ) {

    changed = false;

    safetyCounter++;


    researchTrees.forEach(
      tree => {

        tree.nodes.forEach(
          node => {

            const current =
              getLevel(
                node.key
              );


            if (
              current <= 0
            ) {

              return;

            }


            const highestValid =
              getHighestValidLevel(
                node
              );


            if (
              current >
              highestValid
            ) {

              selectedLevels[
                node.key
              ] =
                highestValid;


              changed =
                true;

            }

          }
        );

      }
    );

  }

}


// =============================
// TREE PROGRESS
// =============================

function getTreeProgress(
  tree
) {

  const maxLevels =
    tree.nodes.reduce(
      (
        total,
        node
      ) => {

        return (
          total +
          node.maxLevel
        );

      },
      0
    );


  const currentLevels =
    tree.nodes.reduce(
      (
        total,
        node
      ) => {

        return (
          total +
          Math.min(
            getLevel(
              node.key
            ),
            node.maxLevel
          )
        );

      },
      0
    );


  const percent =
    maxLevels > 0
      ? (
          currentLevels /
          maxLevels
        ) * 100
      : 0;


  return {
    currentLevels,
    maxLevels,
    percent,
    complete:
      maxLevels > 0 &&
      currentLevels ===
        maxLevels
  };

}


// =============================
// FORMAT
// =============================

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      "\"",
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function formatValue(
  value,
  unit
) {

  const prefix =
    Number(value) > 0
      ? "+"
      : "";


  if (
    unit ===
    "percent"
  ) {

    return (
      `${prefix}${value}%`
    );

  }


  return (
    `${prefix}${value}`
  );

}


function getStatLabel(
  stat
) {

  return (
    STAT_LABELS[stat] ||
    stat
  );

}


// =============================
// EFFECT TEXT
// =============================

function formatEffect(
  effect
) {

  if (
    !effect ||
    !effect.stat
  ) {

    return "";

  }


  const parts = [];


  parts.push(
    getStatLabel(
      effect.stat
    )
  );


  const value =
    effect.valuePerLevel ??
    effect.value;


  if (
    value !== undefined &&
    value !== null
  ) {

    parts.push(
      formatValue(
        value,
        effect.unit
      )
    );

  }


  if (
    effect.valuePerLevel !==
      undefined
  ) {

    parts.push(
      "per level"
    );

  }


  if (
    effect.scope ===
      "element" &&
    effect.element
  ) {

    parts.push(
      `· ${effect.element} Palmon`
    );

  }

  else if (
    effect.scope ===
      "squad" &&
    effect.squad
  ) {

    parts.push(
      `· Squad ${effect.squad}`
    );

  }

  else if (
    effect.scope ===
      "allPalmon"
  ) {

    parts.push(
      "· All Palmon"
    );

  }

  else if (
    effect.scope ===
      "armigo"
  ) {

    parts.push(
      "· Armigo"
    );

  }

  else if (
    effect.scope ===
      "allSquads"
  ) {

    parts.push(
      "· All Squads"
    );

  }


  if (
    effect.condition
  ) {

    parts.push(
      `· ${
        CONDITION_LABELS[
          effect.condition
        ] ||
        effect.condition
      }`
    );

  }


  return parts.join(
    " "
  );

}


// =============================
// TREE UNLOCK INFO
// =============================

function renderTreeUnlockInfo(
  tree
) {

  const unlock =
    tree.unlockRequirements;


  if (!unlock) {

    return "";

  }


  const parts = [];


  const buildings =
    unlock.buildingsAnyOf ||
    [];


  if (
    buildings.length > 0
  ) {

    parts.push(
      `Building: ${
        buildings
          .map(
            item =>
              `${escapeHTML(
                item.name
              )} Lv. ${
                item.level
              }`
          )
          .join(" or ")
      }`
    );

  }


  if (
    Number(
      unlock.openDayAfter
    ) > 0
  ) {

    parts.push(
      `Opens after Day ${
        unlock.openDayAfter
      }`
    );

  }


  if (
    (
      unlock.seasonRestriction ||
      []
    ).length > 0
  ) {

    parts.push(
      `Season restriction: ${
        unlock
          .seasonRestriction
          .join(", ")
      }`
    );

  }


  if (
    parts.length === 0
  ) {

    return "";

  }


  return `
    <div class="research-tree-unlock-note">
      <strong>
        Tree unlock requirements
      </strong>

      <span>
        ${parts.join(" · ")}
      </span>

      <small>
        These requirements are shown for
        reference only and are not enforced yet.
      </small>
    </div>
  `;

}


// =============================
// COMPLETION BONUS
// =============================

function getCompletionText(
  tree
) {

  if (
    tree.completionEffect
      ?.sourceText
  ) {

    return tree
      .completionEffect
      .sourceText
      .replace(
        /^100%\s*completion\s*bonus:\s*/i,
        ""
      )
      .replace(
        /^100%\s*completion\s*Bonus:\s*/i,
        ""
      );

  }


  if (
    tree.completionEffect
  ) {

    return formatEffect(
      tree.completionEffect
    );

  }


  if (
    tree.completionNote
  ) {

    return tree
      .completionNote
      .replace(
        /^100%\s*completion\s*bonus:\s*/i,
        ""
      )
      .replace(
        /^100%\s*completion\s*Bonus:\s*/i,
        ""
      );

  }


  return (
    "No completion bonus recorded."
  );

}


// =============================
// REQUIREMENT TEXT
// =============================

function renderNodeRequirements(
  node,
  currentLevel
) {

  if (
    currentLevel >=
    node.maxLevel
  ) {

    return `
      <div class="research-requirements max">
        Max Level reached
      </div>
    `;

  }


  const targetLevel =
    currentLevel + 1;


  const techRequirements =
    getTechRequirements(
      node,
      targetLevel
    );


  const buildingRequirements =
    getBuildingRequirements(
      node,
      targetLevel
    );


  if (
    techRequirements.length === 0 &&
    buildingRequirements.length === 0
  ) {

    return `
      <div class="research-requirements available">
        Next level has no tracked prerequisite.
      </div>
    `;

  }


  const parts = [];


  techRequirements.forEach(
    requirement => {

      const current =
        getLevel(
          requirement.key
        );


      const met =
        current >=
        requirement.level;


      parts.push(`
        <span
          class="
            research-requirement
            ${
              met
                ? "met"
                : "missing"
            }
          "
        >
          ${
            met
              ? "✓"
              : "✕"
          }
          ${escapeHTML(
            requirement.name
          )}
          Lv. ${requirement.level}
        </span>
      `);

    }
  );


  buildingRequirements.forEach(
    requirement => {

      parts.push(`
        <span
          class="
            research-requirement
            building
          "
        >
          ◇
          ${escapeHTML(
            requirement.name
          )}
          Lv. ${requirement.level}
        </span>
      `);

    }
  );


  return `
    <div class="research-requirements">

      <span class="research-requirements-label">
        Lv. ${targetLevel} requires
      </span>

      <div class="research-requirement-list">
        ${parts.join("")}
      </div>

    </div>
  `;

}


// =============================
// NODE EFFECTS / NOTES
// =============================

function renderNodeInfo(
  node
) {

  const effects =
    node.effects || [];


  const notes =
    node.notes || [];


  if (
    effects.length === 0 &&
    notes.length === 0
  ) {

    return "";
  }


  let html = "";


  effects.forEach(
    effect => {

      html += `
        <div class="research-effect">
          <span class="research-effect-label">
            Effect
          </span>

          <span>
            ${escapeHTML(
              formatEffect(
                effect
              )
            )}
          </span>
        </div>
      `;

    }
  );


  notes.forEach(
    note => {

      html += `
        <div class="research-note">
          <span class="research-note-label">
            Note
          </span>

          <span>
            ${escapeHTML(
              note
            )}
          </span>
        </div>
      `;

    }
  );


  return `
    <div class="research-node-info">
      ${html}
    </div>
  `;

}


// =============================
// LEVEL SELECT
// =============================

function renderLevelSelect(
  node
) {

  const current =
    getLevel(
      node.key
    );


  let options = "";


  for (
    let level = 0;
    level <= node.maxLevel;
    level++
  ) {

    const available =
      level === 0 ||
      areTechRequirementsMet(
        node,
        level
      );


    options += `
      <option
        value="${level}"
        ${
          current === level
            ? "selected"
            : ""
        }
        ${
          !available
            ? "disabled"
            : ""
        }
      >
        ${
          level === 0
            ? "0"
            : level
        }
      </option>
    `;

  }


  return `
    <div class="research-level-control">

      <button
        class="research-level-step"
        type="button"
        data-research-node="${
          escapeHTML(
            node.key
          )
        }"
        data-research-change="-1"
        ${
          current <= 0
            ? "disabled"
            : ""
        }
      >
        −
      </button>


      <select
        class="research-level-select"
        data-research-level="${
          escapeHTML(
            node.key
          )
        }"
        aria-label="${
          escapeHTML(
            node.name
          )
        } level"
      >
        ${options}
      </select>


      <button
        class="research-level-step"
        type="button"
        data-research-node="${
          escapeHTML(
            node.key
          )
        }"
        data-research-change="1"
        ${
          current >=
            node.maxLevel ||
          !areTechRequirementsMet(
            node,
            current + 1
          )
            ? "disabled"
            : ""
        }
      >
        +
      </button>

    </div>


    <span class="research-level-max">
      Lv. ${current} / ${node.maxLevel}
    </span>
  `;

}


// =============================
// TREE SELECTOR
// =============================

function renderTreeSelector() {

  return `
    <div class="research-tree-selector">

      ${
        researchTrees.map(
          tree => {

            const progress =
              getTreeProgress(
                tree
              );


            return `
              <button
                type="button"
                class="
                  research-tree-button
                  ${
                    tree.key ===
                      selectedTreeKey
                      ? "active"
                      : ""
                  }
                  ${
                    progress.complete
                      ? "complete"
                      : ""
                  }
                "
                data-research-tree="${
                  escapeHTML(
                    tree.key
                  )
                }"
              >
                <span>
                  ${escapeHTML(
                    tree.name
                  )}
                </span>

                <small>
                  ${
                    Math.floor(
                      progress.percent
                    )
                  }%
                </small>
              </button>
            `;

          }
        ).join("")
      }

    </div>
  `;

}


// =============================
// SUMMARY
// =============================

function renderSummary(
  tree
) {

  const progress =
    getTreeProgress(
      tree
    );


  const completionText =
    getCompletionText(
      tree
    );


  return `
    <section class="research-summary">

      <div class="research-summary-card">

        <span>
          Tree Progress
        </span>

        <strong>
          ${
            progress.percent
              .toFixed(1)
          }%
        </strong>

        <div class="research-progress-bar">
          <div
            class="
              research-progress-fill
              ${
                progress.complete
                  ? "complete"
                  : ""
              }
            "
            style="
              width: ${
                Math.min(
                  100,
                  progress.percent
                )
              }%;
            "
          ></div>
        </div>

      </div>


      <div class="research-summary-card">

        <span>
          Research Levels
        </span>

        <strong>
          ${
            progress.currentLevels
          }
          /
          ${
            progress.maxLevels
          }
        </strong>

        <small>
          Total selected levels
        </small>

      </div>


      <div
        class="
          research-summary-card
          research-completion-card
          ${
            progress.complete
              ? "active"
              : ""
          }
        "
      >

        <span>
          100% Completion Bonus
        </span>

        <strong>
          ${
            progress.complete
              ? "ACTIVE"
              : "LOCKED"
          }
        </strong>

        <small>
          ${escapeHTML(
            completionText
          )}
        </small>

      </div>

    </section>
  `;

}


// =============================
// NODE LIST
// =============================

function renderNodes(
  tree
) {

  const nodes =
    [...tree.nodes]
      .sort(
        (a, b) => {

          const layerDifference =
            (
              Number(a.layer) || 0
            ) -
            (
              Number(b.layer) || 0
            );


          if (
            layerDifference !== 0
          ) {

            return layerDifference;

          }


          return a.name.localeCompare(
            b.name
          );

        }
      );


  return `
    <div class="research-node-list">

      ${
        nodes.map(
          node => {

            const current =
              getLevel(
                node.key
              );


            const complete =
              current >=
              node.maxLevel;


            return `
              <article
                class="
                  research-node
                  ${
                    current > 0
                      ? "selected"
                      : ""
                  }
                  ${
                    complete
                      ? "complete"
                      : ""
                  }
                "
              >

                <div class="research-node-main">

                  <div class="research-node-heading">

                    <div>

                      <span class="research-layer">
                        Layer ${
                          node.layer
                        }
                      </span>

                      <h3>
                        ${escapeHTML(
                          node.name
                        )}
                      </h3>

                    </div>


                    ${
                      complete
                        ? `
                          <span
                            class="
                              research-max-badge
                            "
                          >
                            MAX
                          </span>
                        `
                        : ""
                    }

                  </div>


                  ${renderNodeInfo(
                    node
                  )}


                  ${renderNodeRequirements(
                    node,
                    current
                  )}

                </div>


                <div class="research-node-level">

                  ${renderLevelSelect(
                    node
                  )}

                </div>

              </article>
            `;

          }
        ).join("")
      }

    </div>
  `;

}


// =============================
// RENDER
// =============================

function render() {

  const root =
    document.getElementById(
      "research-root"
    );


  if (!root) {

    return;

  }


  const tree =
    getSelectedTree();


  if (!tree) {

    root.innerHTML = `
      <div class="placeholder-card">
        <h3>
          No Research data
        </h3>

        <p>
          No Research Trees were found.
        </p>
      </div>
    `;

    return;

  }


  root.innerHTML = `

    ${renderTreeSelector()}


    <section class="research-tree-header">

      <div>

        <span class="research-tree-index">
          Tech Tree ${tree.index}
        </span>

        <h2>
          ${escapeHTML(
            tree.name
          )}
        </h2>

        <p>
          ${tree.techCount}
          Research Nodes
        </p>

      </div>


      <button
        id="research-reset-tree"
        class="reset-button"
        type="button"
      >
        Reset Tree
      </button>

    </section>


    ${renderTreeUnlockInfo(
      tree
    )}


    ${renderSummary(
      tree
    )}


    <section class="section">

      <div class="section-header">

        <h2>
          Research Nodes
        </h2>

        <p class="research-section-description">
          Building requirements are currently
          informational only.
          Tech prerequisites are enforced.
        </p>

      </div>


      ${renderNodes(
        tree
      )}

    </section>

  `;


  addRenderedListeners();

}


// =============================
// CHANGE LEVEL
// =============================

function changeNodeLevel(
  nodeKey,
  targetLevel
) {

  const entry =
    nodeMap.get(
      nodeKey
    );


  if (!entry) {

    return;

  }


  const node =
    entry.node;


  const target =
    clamp(
      Math.floor(
        Number(targetLevel) || 0
      ),
      0,
      node.maxLevel
    );


  if (
    target > 0 &&
    !areTechRequirementsMet(
      node,
      target
    )
  ) {

    return;

  }


  setLevel(
    nodeKey,
    target
  );


  normalizeAllLevels();

  saveState();

  render();

}


// =============================
// RESET TREE
// =============================

function resetCurrentTree() {

  const tree =
    getSelectedTree();


  if (!tree) {

    return;

  }


  const confirmed =
    confirm(
      `Reset all Research levels in ${tree.name}?`
    );


  if (!confirmed) {

    return;

  }


  tree.nodes.forEach(
    node => {

      selectedLevels[
        node.key
      ] = 0;

    }
  );


  normalizeAllLevels();

  saveState();

  render();

}


// =============================
// STATIC LISTENERS
// =============================

function addResearchListeners() {

  // Currently no static controls outside
  // the rendered Research root.
  // Kept as its own function so global
  // Research controls can be added later.

}


// =============================
// RENDERED LISTENERS
// =============================

function addRenderedListeners() {

  document
    .querySelectorAll(
      "[data-research-tree]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            selectedTreeKey =
              button.dataset
                .researchTree;


            saveState();

            render();

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-research-level]"
    )
    .forEach(
      select => {

        select.addEventListener(
          "change",
          () => {

            changeNodeLevel(
              select.dataset
                .researchLevel,

              Number(
                select.value
              )
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-research-change]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const nodeKey =
              button.dataset
                .researchNode;


            const change =
              Number(
                button.dataset
                  .researchChange
              );


            changeNodeLevel(
              nodeKey,
              getLevel(
                nodeKey
              ) +
              change
            );

          }
        );

      }
    );


  const resetTreeButton =
    document.getElementById(
      "research-reset-tree"
    );


  if (resetTreeButton) {

    resetTreeButton.addEventListener(
      "click",
      resetCurrentTree
    );

  }

}


// =============================
// PUBLIC DATA
// =============================

export function
getResearchProgress() {

  const trees = {};


  researchTrees.forEach(
    tree => {

      trees[
        tree.key
      ] =
        getTreeProgress(
          tree
        );

    }
  );


  return trees;

}
