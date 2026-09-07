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

let researchStatsExpanded = false;

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


      const requirementEntry =
        nodeMap.get(
          requirement.key
        );


      const requirementTree =
        requirementEntry
          ?.tree ||
        null;


      const selectedTree =
        getSelectedTree();


      const crossTree =
        Boolean(
          requirementTree &&
          selectedTree &&
          requirementTree.key !==
            selectedTree.key
        );


      if (crossTree) {

        parts.push(`
          <button
            type="button"
            class="
              research-requirement
              research-cross-tree-requirement
              ${
                met
                  ? "met"
                  : "missing"
              }
            "
            data-research-jump-tree="${
              escapeHTML(
                requirementTree.key
              )
            }"
            data-research-jump-node="${
              escapeHTML(
                requirement.key
              )
            }"
            title="Open ${
              escapeHTML(
                requirementTree.name
              )
            } and show ${
              escapeHTML(
                requirement.name
              )
            }"
          >

            <span
              class="
                research-requirement-main
              "
            >
              <span>
                ${
                  met
                    ? "✓"
                    : "✕"
                }
                ${escapeHTML(
                  requirement.name
                )}
                Lv. ${
                  requirement.level
                }
              </span>

              <span
                class="
                  research-requirement-arrow
                "
                aria-hidden="true"
              >
                →
              </span>
            </span>


            <span
              class="
                research-requirement-tree
              "
            >
              ${escapeHTML(
                requirementTree.name
              )}
            </span>

          </button>
        `);

        return;

      }


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
// RESEARCH TREE
// =============================

function getGraphRequirements(
  node,
  tree
) {

  const requirements =
    new Map();


  node.levels.forEach(
    levelData => {

      const techRequirements =
        levelData
          ?.requirements
          ?.techs ||
        [];


      techRequirements.forEach(
        requirement => {

          const entry =
            nodeMap.get(
              requirement.key
            );


          if (
            !entry ||
            entry.tree.key !==
              tree.key
          ) {

            return;

          }


          const existing =
            requirements.get(
              requirement.key
            );


          requirements.set(
            requirement.key,
            {
              key:
                requirement.key,

              name:
                requirement.name,

              level:
                Math.max(
                  existing?.level || 0,
                  requirement.level || 0
                )
            }
          );

        }
      );

    }
  );


  return [
    ...requirements.values()
  ];

}


// =============================
// VISUAL TREE CONNECTIONS
// =============================

// Die echten Research-Voraussetzungen
// bleiben vollständig erhalten.
//
// Für die sichtbaren Ingame-Linien gilt
// normalerweise:
//
// Nur Voraussetzungen aus dem direkt
// vorherigen Layer werden angezeigt.
//
// Super Armigo besitzt zusätzlich
// eigene visuelle Ausnahmen.

const VISUAL_CHILD_OVERRIDES = {

  "Super Armigo": {

    "Breakthrough II":
      [],

    "Escort II": [
      "Expanded Training VI"
    ],

    "Lifesong II": [
      "Quick Instructors VI"
    ]

  }

};


// =============================
// VISUAL GRAPH REQUIREMENTS
// =============================

function getVisualGraphRequirements(
  node,
  tree
) {

  const childLayer =
    Number(
      node.layer
    ) || 0;


  return getGraphRequirements(
    node,
    tree
  ).filter(
    requirement => {

      const parentEntry =
        nodeMap.get(
          requirement.key
        );


      if (!parentEntry) {

        return false;

      }


      const parentNode =
        parentEntry.node;


      const parentLayer =
        Number(
          parentNode.layer
        ) || 0;


      // -------------------------
      // GENERAL INGAME RULE
      // -------------------------
      //
      // Sichtbare Linien existieren
      // nur zwischen direkt
      // aufeinanderfolgenden Layern.
      //
      // Beispiel:
      //
      // Layer 4 -> Layer 5
      // = sichtbare Linie
      //
      // Layer 3 -> Layer 5
      // = keine sichtbare Linie
      //
      // Die echte Voraussetzung bleibt
      // trotzdem weiterhin aktiv.

      if (
        parentLayer !==
        childLayer - 1
      ) {

        return false;

      }


      // -------------------------
      // SPECIAL VISUAL OVERRIDES
      // -------------------------

      const treeOverrides =
        VISUAL_CHILD_OVERRIDES[
          tree.name
        ];


      // Für normale Trees reicht
      // die Layer-Regel.
      if (!treeOverrides) {

        return true;

      }


      const allowedChildren =
        treeOverrides[
          parentNode.name
        ];


      // Kein Override für diesen Node:
      // normale Verbindung anzeigen.
      if (
        allowedChildren ===
        undefined
      ) {

        return true;

      }


      // Für Nodes mit Override werden
      // ausschließlich die hier genannten
      // Folge-Nodes verbunden.
      return allowedChildren.includes(
        node.name
      );

    }
  );

}


// =============================
// GROUP NODES BY LAYER
// =============================

function getTreeLayers(
  tree
) {

  const layerMap =
    new Map();


  tree.nodes.forEach(
    (
      node,
      sourceIndex
    ) => {

      const layer =
        Number(
          node.layer
        ) || 0;


      if (
        !layerMap.has(
          layer
        )
      ) {

        layerMap.set(
          layer,
          []
        );

      }


      layerMap.get(
        layer
      ).push({
        node,
        sourceIndex
      });

    }
  );


  const sortedLayers =
    [
      ...layerMap.keys()
    ]
      .sort(
        (a, b) =>
          a - b
      );


  const positionMap =
    new Map();


  const result =
    sortedLayers.map(
      layerNumber => {

        const entries =
          layerMap.get(
            layerNumber
          );


        entries.sort(
          (
            a,
            b
          ) => {

            const aParents =
              getVisualGraphRequirements(
                a.node,
                tree
              );


            const bParents =
              getVisualGraphRequirements(
                b.node,
                tree
              );


            const getAveragePosition =
              parents => {

                const positions =
                  parents
                    .map(
                      parent =>
                        positionMap.get(
                          parent.key
                        )
                    )
                    .filter(
                      value =>
                        value !==
                        undefined
                    );


                if (
                  positions.length ===
                  0
                ) {

                  return null;

                }


                return (
                  positions.reduce(
                    (
                      total,
                      value
                    ) =>
                      total +
                      value,
                    0
                  ) /
                  positions.length
                );

              };


            const aPosition =
              getAveragePosition(
                aParents
              );


            const bPosition =
              getAveragePosition(
                bParents
              );


            if (
              aPosition !== null &&
              bPosition !== null &&
              aPosition !==
                bPosition
            ) {

              return (
                aPosition -
                bPosition
              );

            }


            if (
              aPosition !== null &&
              bPosition === null
            ) {

              return -1;

            }


            if (
              aPosition === null &&
              bPosition !== null
            ) {

              return 1;

            }


            return (
              a.sourceIndex -
              b.sourceIndex
            );

          }
        );


        entries.forEach(
          (
            entry,
            index
          ) => {

            positionMap.set(
              entry.node.key,
              index
            );

          }
        );


        return {
          layer:
            layerNumber,

          nodes:
            entries.map(
              entry =>
                entry.node
            )
        };

      }
    );


  return result;

}


// =============================
// TREE NODE
// =============================

function renderTreeNode(
  node
) {

  const current =
    getLevel(
      node.key
    );


  const complete =
    current >=
    node.maxLevel;


  const levelOneAvailable =
    areTechRequirementsMet(
      node,
      1
    );


  return `
    <article
      class="
        research-tree-node
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
        ${
          current === 0 &&
          !levelOneAvailable
            ? "locked"
            : ""
        }
      "
      data-research-tree-node="${
        escapeHTML(
          node.key
        )
      }"
    >

      <div class="research-tree-node-header">

        <span class="research-tree-node-layer">
          Layer ${node.layer}
        </span>

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


      <h3>
        ${escapeHTML(
          node.name
        )}
      </h3>


      ${renderNodeInfo(
        node
      )}


      <div class="research-tree-node-controls">

        ${renderLevelSelect(
          node
        )}

      </div>


      ${renderNodeRequirements(
        node,
        current
      )}

    </article>
  `;

}


// =============================
// TREE LAYOUT
// =============================

function renderNodes(
  tree
) {

  const layers =
    getTreeLayers(
      tree
    );


  const maxNodesInLayer =
    Math.max(
      1,
      ...layers.map(
        layer =>
          layer.nodes.length
      )
    );


  const nodeWidth =
    240;


  const horizontalGap =
    80;


  const sidePadding =
    80;


  const minimumTreeWidth =
    Math.max(
      700,

      (
        maxNodesInLayer *
        nodeWidth
      ) +

      (
        Math.max(
          0,
          maxNodesInLayer - 1
        ) *
        horizontalGap
      ) +

      (
        sidePadding *
        2
      )
    );


  return `
    <div
      class="
        research-tree-scroll
      "
    >

      <div
        class="
          research-tree-canvas
        "
        style="
          min-width:
            ${minimumTreeWidth}px;
        "
      >

        <svg
          class="
            research-tree-connections
          "
          aria-hidden="true"
        ></svg>


        <div
          class="
            research-tree-layers
          "
        >

          ${
            layers.map(
              layer => {

                return `
                  <section
                    class="
                      research-tree-layer
                    "
                    data-research-layer="${
                      layer.layer
                    }"
                  >

                    <div
                      class="
                        research-tree-layer-label
                      "
                    >
                      Layer ${
                        layer.layer
                      }
                    </div>


                    <div
                      class="
                        research-tree-layer-nodes
                      "
                    >

                      ${
                        layer.nodes
                          .map(
                            node =>
                              renderTreeNode(
                                node
                              )
                          )
                          .join("")
                      }

                    </div>

                  </section>
                `;

              }
            ).join("")
          }

        </div>

      </div>

    </div>
  `;

}


// =============================
// DRAW CONNECTIONS
// =============================

function drawResearchConnections() {

  const tree =
    getSelectedTree();


  const canvas =
    document.querySelector(
      ".research-tree-canvas"
    );


  const svg =
    document.querySelector(
      ".research-tree-connections"
    );


  if (
    !tree ||
    !canvas ||
    !svg
  ) {

    return;

  }


  const width =
    canvas.offsetWidth;


  const height =
    canvas.offsetHeight;


  if (
    width <= 0 ||
    height <= 0
  ) {

    return;

  }


  svg.setAttribute(
    "width",
    width
  );


  svg.setAttribute(
    "height",
    height
  );


  svg.setAttribute(
    "viewBox",
    `0 0 ${width} ${height}`
  );


  svg.innerHTML =
    "";


  const canvasRect =
    canvas.getBoundingClientRect();


  const elementMap =
    new Map();


  canvas
    .querySelectorAll(
      "[data-research-tree-node]"
    )
    .forEach(
      element => {

        elementMap.set(
          element.dataset
            .researchTreeNode,
          element
        );

      }
    );


  tree.nodes.forEach(
    childNode => {

      const childElement =
        elementMap.get(
          childNode.key
        );


      if (!childElement) {

        return;

      }


      const requirements =
        getVisualGraphRequirements(
          childNode,
          tree
        );


      requirements.forEach(
        requirement => {

          const parentElement =
            elementMap.get(
              requirement.key
            );


          if (!parentElement) {

            return;

          }


          const parentRect =
            parentElement
              .getBoundingClientRect();


          const childRect =
            childElement
              .getBoundingClientRect();


          const startX =
            (
              parentRect.left -
              canvasRect.left
            ) +
            (
              parentRect.width /
              2
            );


          const startY =
            (
              parentRect.bottom -
              canvasRect.top
            );


          const endX =
            (
              childRect.left -
              canvasRect.left
            ) +
            (
              childRect.width /
              2
            );


          const endY =
            (
              childRect.top -
              canvasRect.top
            );


          const verticalDistance =
            Math.max(
              30,
              endY -
              startY
            );


          const curveOffset =
            verticalDistance *
            0.5;


          const path =
            document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );


          path.setAttribute(
            "d",
            `
              M
              ${startX}
              ${startY}

              C
              ${startX}
              ${startY + curveOffset},

              ${endX}
              ${endY - curveOffset},

              ${endX}
              ${endY}
            `
          );


          path.classList.add(
            "research-tree-connection"
          );


          const childLevel =
            getLevel(
              childNode.key
            );


          if (
            childLevel > 0
          ) {

            path.classList.add(
              "active"
            );

          }

          else if (
            areTechRequirementsMet(
              childNode,
              1
            )
          ) {

            path.classList.add(
              "available"
            );

          }

          else {

            path.classList.add(
              "locked"
            );

          }


          svg.appendChild(
            path
          );

        }
      );

    }
  );

}


// =============================
// SCHEDULE CONNECTION DRAW
// =============================

function scheduleConnectionDraw() {

  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        () => {

          drawResearchConnections();

        }
      );

    }
  );

}


// =============================
// RESEARCH STATS OVERVIEW
// =============================

function getResearchStatsContexts() {

  return [
    {
      key: "global",
      title: "All Palmon",
      context: {}
    },

    {
      key: "squad1",
      title: "Squad 1",
      context: {
        squadNumber: 1
      }
    },

    {
      key: "squad2",
      title: "Squad 2",
      context: {
        squadNumber: 2
      }
    },

    {
      key: "squad3",
      title: "Squad 3",
      context: {
        squadNumber: 3
      }
    },

    {
      key: "squad4",
      title: "Squad 4",
      context: {
        squadNumber: 4
      }
    },

    {
      key: "water",
      title: "Water Palmon",
      context: {
        element: "Water"
      }
    },

    {
      key: "fire",
      title: "Fire Palmon",
      context: {
        element: "Fire"
      }
    },

    {
      key: "earth",
      title: "Earth Palmon",
      context: {
        element: "Earth"
      }
    },

    {
      key: "electric",
      title: "Electric Palmon",
      context: {
        element: "Electric"
      }
    }
  ];

}


// =============================
// UNIQUE EFFECT FILTER
// =============================

const RESEARCH_STATS_VISIBLE_STATS =
  new Set([
    "attack",
    "defense",
    "hp",

    "finalDamage",
    "finalDamageTaken",
    "finalDamageTakenReduction",

    "critChance",
    "critRate",
    "critDamage",
    "critDamageReduction",

    "accuracy",
    "tenacity",
    "rage",

    "rageSkillDamageBonus",
    "rageSkillDamageTakenReduction",

    "allPalmonArmigoCapacity",

    "armigoAttack",
    "armigoDefense",
    "armigoHP",

    "armigoLoad",
    "squadLoad",
    "load",

    "morale",
    "opponentDeathRate"
  ]);

function filterResearchStatsEffects(
  effects,
  contextKey
) {

  return effects.filter(
    effect => {

      if (
        !RESEARCH_STATS_VISIBLE_STATS.has(
          effect.stat
        )
      ) {

        return false;

      }


      // Conditional Research effects
      // are intentionally not shown
      // in the general Research Stats
      // overview.
      if (
        effect.condition
      ) {

        return false;

      }


      // -------------------------
      // ALL PALMON / GENERAL
      // -------------------------

      if (
        contextKey ===
        "global"
      ) {

        return (
          effect.scope !==
            "squad" &&
          effect.scope !==
            "element"
        );

      }


      // -------------------------
      // SQUADS
      // -------------------------

      if (
        contextKey.startsWith(
          "squad"
        )
      ) {

        return (
          effect.scope ===
          "squad"
        );

      }


      // -------------------------
      // ELEMENTS
      // -------------------------

      if (
        [
          "water",
          "fire",
          "earth",
          "electric"
        ].includes(
          contextKey
        )
      ) {

        return (
          effect.scope ===
          "element"
        );

      }


      return false;

    }
  );

}


// =============================
// COMBINE DISPLAY EFFECTS
// =============================

function combineResearchStatsEffects(
  effects
) {

  const totals =
    new Map();


  effects.forEach(
    effect => {

      const key = [
        effect.stat,
        effect.unit
      ].join(":");


      const existing =
        totals.get(
          key
        );


      if (existing) {

        existing.value +=
          effect.value;

        return;

      }


      totals.set(
        key,
        {
          stat:
            effect.stat,

          unit:
            effect.unit,

          value:
            effect.value
        }
      );

    }
  );


  return [
    ...totals.values()
  ];

}


// =============================
// STAT GROUP
// =============================

function renderResearchStatsGroup(
  title,
  effects
) {

  const combined =
    combineResearchStatsEffects(
      effects
    );


  if (
    combined.length === 0
  ) {

    return "";

  }


  return `
    <div class="research-stats-group">

      <h4>
        ${escapeHTML(
          title
        )}
      </h4>


      <div class="research-stats-list">

        ${
          combined.map(
            effect => {

              return `
                <div
                  class="
                    research-stat-row
                  "
                >

                  <span>
                    ${escapeHTML(
                      getStatLabel(
                        effect.stat
                      )
                    )}
                  </span>


                  <strong>
                    ${escapeHTML(
                      formatValue(
                        effect.value,
                        effect.unit
                      )
                    )}
                  </strong>

                </div>
              `;

            }
          ).join("")
        }

      </div>

    </div>
  `;

}


// =============================
// RESEARCH STATS PANEL
// =============================

function renderResearchStats() {

  const contexts =
    getResearchStatsContexts();


  const groups = [];


  contexts.forEach(
    item => {

      const bonuses =
        getResearchBonuses(
          item.context
        );


      const effects =
        filterResearchStatsEffects(
          bonuses.effects,
          item.key
        );


      const html =
        renderResearchStatsGroup(
          item.title,
          effects
        );


      if (html) {

        groups.push(
          html
        );

      }

    }
  );


  const content =
    groups.length > 0
      ? groups.join("")
      : `
        <p class="research-stats-empty">
          No active Research bonuses yet.
        </p>
      `;


  return `
    <section
      class="
        research-stats-panel
        ${
          researchStatsExpanded
            ? "expanded"
            : ""
        }
      "
    >

      <button
        id="research-stats-toggle"
        class="research-stats-toggle"
        type="button"
        aria-expanded="${
          researchStatsExpanded
        }"
      >

        <div>

          <strong>
            Research Stats
          </strong>

          <span>
            Current bonuses from all
            Research Trees
          </span>

        </div>


        <span
          class="
            research-stats-toggle-icon
          "
          aria-hidden="true"
        >
          ${
            researchStatsExpanded
              ? "−"
              : "+"
          }
        </span>

      </button>


      ${
        researchStatsExpanded
          ? `
            <div
              class="
                research-stats-content
              "
            >
              ${content}
            </div>
          `
          : ""
      }

    </section>
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


      <div
        class="
          research-tree-actions
        "
      >

        <button
          id="research-max-tree"
          class="
            research-max-tree-button
          "
          type="button"
        >
          Max Tree
        </button>


        <button
          id="research-reset-tree"
          class="reset-button"
          type="button"
        >
          Reset Tree
        </button>

      </div>

    </section>


    ${renderTreeUnlockInfo(
      tree
    )}


    ${renderSummary(
      tree
    )}


    ${renderResearchStats()}


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

  scheduleConnectionDraw();

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
// MAX CURRENT TREE
// =============================

function maxCurrentTree() {

  const tree =
    getSelectedTree();


  if (!tree) {

    return;

  }


  tree.nodes.forEach(
    node => {

      selectedLevels[
        node.key
      ] =
        node.maxLevel;

    }
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

  window.addEventListener(
    "resize",
    () => {

      scheduleConnectionDraw();

    }
  );


  const researchNavButton =
    document.querySelector(
      '.nav-button[data-page="research"]'
    );


  if (researchNavButton) {

    researchNavButton.addEventListener(
      "click",
      () => {

        scheduleConnectionDraw();

      }
    );

  }

}


// =============================
// CROSS-TREE NAVIGATION
// =============================

function jumpToResearchNode(
  treeKey,
  nodeKey
) {

  const targetTree =
    researchTrees.find(
      tree =>
        tree.key ===
        treeKey
    );


  const targetEntry =
    nodeMap.get(
      nodeKey
    );


  if (
    !targetTree ||
    !targetEntry
  ) {

    return;

  }


  selectedTreeKey =
    targetTree.key;


  saveState();

  render();


  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        () => {

          const targetNode =
            document.querySelector(
              `[data-research-tree-node="${CSS.escape(
                nodeKey
              )}"]`
            );


          if (!targetNode) {

            return;

          }


          targetNode.scrollIntoView({
            behavior:
              "smooth",

            block:
              "center",

            inline:
              "center"
          });


          targetNode.classList.add(
            "research-node-highlight"
          );


          window.setTimeout(
            () => {

              targetNode.classList.remove(
                "research-node-highlight"
              );

            },
            1800
          );

        }
      );

    }
  );

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

    const maxTreeButton =
    document.getElementById(
      "research-max-tree"
    );


  if (maxTreeButton) {

    maxTreeButton.addEventListener(
      "click",
      maxCurrentTree
    );

  }


  const statsToggle =
    document.getElementById(
      "research-stats-toggle"
    );


  if (statsToggle) {

    statsToggle.addEventListener(
      "click",
      () => {

        researchStatsExpanded =
          !researchStatsExpanded;


        render();

      }
    );

  }
  
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

  document
    .querySelectorAll(
      "[data-research-jump-tree]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const treeKey =
              button.dataset
                .researchJumpTree;


            const nodeKey =
              button.dataset
                .researchJumpNode;


            if (
              !treeKey ||
              !nodeKey
            ) {

              return;

            }


            jumpToResearchNode(
              treeKey,
              nodeKey
            );

          }
        );

      }
    );
  
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

// =============================
// RESEARCH BONUS API
// =============================

function createResearchBonusResult() {

  return {
    percent: {},
    flat: {},
    effects: []
  };

}


function addResearchBonus(
  result,
  effect,
  value,
  source
) {

  if (
    !effect?.stat ||
    !Number.isFinite(value) ||
    value === 0
  ) {

    return;

  }


  const bucket =
    effect.unit === "flat"
      ? result.flat
      : result.percent;


  bucket[effect.stat] =
    (
      bucket[effect.stat] || 0
    ) + value;


  result.effects.push({

    stat:
      effect.stat,

    value,

    unit:
      effect.unit || "percent",

    scope:
      effect.scope || null,

    element:
      effect.element || null,

    squad:
      effect.squad || null,

    condition:
      effect.condition || null,

    source

  });

}


// =============================
// EFFECT FILTERING
// =============================

function researchEffectApplies(
  effect,
  context
) {

  if (!effect) {

    return false;

  }


  // -------------------------
  // SQUAD-SPECIFIC
  // -------------------------

  if (
    effect.scope ===
    "squad"
  ) {

    if (
      Number(effect.squad) !==
      Number(
        context.squadNumber
      )
    ) {

      return false;

    }

  }


  // -------------------------
  // ELEMENT-SPECIFIC
  // -------------------------

  if (
    effect.scope ===
    "element"
  ) {

    if (
      !context.element ||
      effect.element !==
        context.element
    ) {

      return false;

    }

  }


  // -------------------------
  // CONDITIONAL EFFECTS
  // -------------------------

  if (
    effect.condition
  ) {

    const activeConditions =
      new Set(
        context.conditions || []
      );


    if (
      !activeConditions.has(
        effect.condition
      )
    ) {

      return false;

    }

  }


  return true;

}


// =============================
// TREE COMPLETION
// =============================

function isResearchTreeComplete(
  tree
) {

  return tree.nodes.every(
    node =>
      getLevel(
        node.key
      ) >= node.maxLevel
  );

}


// =============================
// GET RESEARCH BONUSES
// =============================

export function getResearchBonuses({
  squadNumber = null,
  element = null,
  conditions = [],
  condition = null
} = {}) {

  const result =
    createResearchBonusResult();

  // -------------------------
  // NORMALIZE CONDITIONS
  // -------------------------
  //
  // "conditions" ist die neue API.
  //
  // "condition" bleibt vorerst
  // als Rückwärtskompatibilität
  // bestehen.

  const normalizedConditions =
    Array.isArray(
      conditions
    )
      ? [
          ...conditions
        ]
      : [];


  if (
    condition &&
    !normalizedConditions.includes(
      condition
    )
  ) {

    normalizedConditions.push(
      condition
    );

  }


  const context = {
    squadNumber,
    element,
    conditions:
      normalizedConditions
  };

  const context = {
    squadNumber,
    element,
    condition
  };


  researchTrees.forEach(
    tree => {

      // -------------------------
      // NODE EFFECTS
      // -------------------------

      tree.nodes.forEach(
        node => {

          const level =
            getLevel(
              node.key
            );


          if (level <= 0) {

            return;

          }


          (
            node.effects || []
          ).forEach(
            effect => {

              if (
                !researchEffectApplies(
                  effect,
                  context
                )
              ) {

                return;

              }


              const value =
                (
                  Number(
                    effect.valuePerLevel
                  ) || 0
                ) * level;


              addResearchBonus(
                result,
                effect,
                value,
                {
                  type: "node",
                  treeKey: tree.key,
                  treeName: tree.name,
                  nodeKey: node.key,
                  nodeName: node.name,
                  level
                }
              );

            }
          );

        }
      );


      // -------------------------
      // TREE COMPLETION EFFECT
      // -------------------------

      if (
        tree.completionEffect &&
        isResearchTreeComplete(
          tree
        ) &&
        researchEffectApplies(
          tree.completionEffect,
          context
        )
      ) {

        const effect =
          tree.completionEffect;


        const value =
          Number(
            effect.value ??
            effect.valuePerLevel
          ) || 0;


        addResearchBonus(
          result,
          effect,
          value,
          {
            type:
              "treeCompletion",

            treeKey:
              tree.key,

            treeName:
              tree.name
          }
        );

      }

    }
  );


  return result;

}
