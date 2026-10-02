import {
  loadTeamState,
  saveTeamState,
  loadEquipmentState
} from "./storage.js";

import {
  ASCENSION_STATES
} from "./palmon-ascension.js";

import {
  getEquipmentDefinition,
  getEquipmentAscensionLabel
} from "./palmon-equipment.js";

import {
  calculateTeamStats,
  PALMON_STAT_CALCULATION_STATUS
} from "./palmon-calculator.js";


// ========================================
// STATE
// ========================================

let palmons = [];

let equipmentData = null;

let traitsData = null;

let teamState = null;

let editingInstanceId = null;

let configTab = "progression";

let palmonPickerOpen = false;

let palmonPickerElement = "all";

let palmonPickerQuery = "";

let equipmentPicker = {
  open: false,
  memberInstanceId: null,
  category: null,
  query: "",
  rarity: "all"
};


// ========================================
// FORMAT
// ========================================

function formatNumber(
  value
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2
    }
  ).format(
    Number(value) || 0
  );
}


function clampInteger(
  value,
  min,
  max
) {
  return Math.min(
    max,
    Math.max(
      min,
      Math.floor(
        Number(value) || 0
      )
    )
  );
}


// ========================================
// DATA HELPERS
// ========================================

function getPalmonById(
  palmonId
) {
  return palmons.find(
    palmon =>
      palmon.id ===
      palmonId
  ) || null;
}


function getPalmonDisplayName(
  palmon,
  member
) {
  if (!palmon) {
    return "";
  }

  const stage =
    clampInteger(
      member?.evolution
        ?.stage,
      0,
      8
    );

  if (
    stage >= 5 &&
    palmon.evolution
      ?.evo5Name
  ) {
    return palmon.evolution
      .evo5Name;
  }

  if (
    stage >= 4 &&
    palmon.evolution
      ?.evo4Name
  ) {
    return palmon.evolution
      .evo4Name;
  }

  return palmon.name;
}

function getActiveTeam() {
  return (
    teamState?.teams ||
    []
  ).find(
    team =>
      team.id ===
      teamState.activeTeamId
  ) || null;
}


function teamHasPalmonSpecies(
  team,
  palmonId
) {
  if (
    !team ||
    !palmonId
  ) {
    return false;
  }

  return (
    team.palmons ||
    []
  ).some(
    member =>
      member.palmonId ===
      palmonId
  );
}


function getTeamNumber(
  teamId
) {
  const match =
    String(
      teamId ||
      ""
    ).match(
      /team-(\d+)/
    );

  return match
    ? Number(match[1])
    : null;
}


function getTeamPalmon(
  instanceId
) {
  for (
    const team of
    teamState?.teams ||
    []
  ) {
    const item =
      (
        team.palmons ||
        []
      ).find(
        palmon =>
          palmon.instanceId ===
          instanceId
      );

    if (item) {
      return {
        team,
        item
      };
    }
  }

  return null;
}


function getEquipmentInventory() {
  const state =
    loadEquipmentState();

  return Array.isArray(
    state.items
  )
    ? state.items
    : [];
}


function getEquipmentDisplayName(
  instance,
  inventory
) {
  const definition =
    getEquipmentDefinition(
      equipmentData,
      instance?.equipmentId
    );

  if (!definition) {
    return "Unknown Equipment";
  }

  const matching =
    inventory.filter(
      item =>
        item.equipmentId ===
        instance.equipmentId
    );

  if (
    matching.length <= 1
  ) {
    return definition.name;
  }

  const index =
    matching.findIndex(
      item =>
        item.instanceId ===
        instance.instanceId
    );

  return `${definition.name} #${index + 1}`;
}


function getAssignedEquipmentMap(
  ignorePalmonInstanceId = null
) {
  const result =
    new Map();

  (
    teamState?.teams ||
    []
  ).forEach(
    team => {
      (
        team.palmons ||
        []
      ).forEach(
        member => {
          if (
            ignorePalmonInstanceId &&
            member.instanceId ===
              ignorePalmonInstanceId
          ) {
            return;
          }

          Object.entries(
            member.equipment ||
            {}
          ).forEach(
            ([category, equipmentId]) => {
              if (!equipmentId) {
                return;
              }

              result.set(
                equipmentId,
                {
                  teamId:
                    team.id,
                  teamName:
                    team.name,
                  palmonInstanceId:
                    member.instanceId,
                  palmonId:
                    member.palmonId,
                  category
                }
              );
            }
          );
        }
      );
    }
  );

  return result;
}


// ========================================
// NORMALIZE / SANITIZE
// ========================================

function sanitizeTeamState() {
  const validPalmonIds =
    new Set(
      palmons.map(
        palmon =>
          palmon.id
      )
    );

  const inventory =
    getEquipmentInventory();

  const validEquipmentIds =
    new Set(
      inventory.map(
        item =>
          item.instanceId
      )
    );

  const alreadyAssigned =
    new Set();

  (
    teamState?.teams ||
    []
  ).forEach(
    team => {
      const usedPalmonIds =
        new Set();

      team.palmons =
        (
          team.palmons ||
          []
        )
          .filter(
            member => {
              if (
                !validPalmonIds.has(
                  member.palmonId
                )
              ) {
                return false;
              }

              if (
                usedPalmonIds.has(
                  member.palmonId
                )
              ) {
                return false;
              }

              usedPalmonIds.add(
                member.palmonId
              );

              return true;
            }
          )
          .slice(
            0,
            7
          );

      team.palmons.forEach(
        member => {
          member.level =
            clampInteger(
              member.level,
              1,
              350
            );

          member.stars =
            clampInteger(
              member.stars,
              0,
              5
            );

          member.subLevel =
            member.stars >= 5
              ? 0
              : clampInteger(
                  member.subLevel,
                  0,
                  4
                );

          member.traitIds =
            Array.isArray(
              member.traitIds
            )
              ? member.traitIds
                  .map(String)
                  .slice(0, 4)
              : [];

          member.evolution = {
            stage:
              clampInteger(
                member.evolution
                  ?.stage,
                0,
                8
              ),

            talentIndex:
              Math.max(
                0,
                Math.floor(
                  Number(
                    member.evolution
                      ?.talentIndex
                  ) || 0
                )
              ),

            talentLevel:
              clampInteger(
                member.evolution
                  ?.talentLevel,
                0,
                10
              ),

            megaEvolved:
              Boolean(
                member.evolution
                  ?.megaEvolved
              )
          };

          member.equipment = {
            weapon:
              member.equipment
                ?.weapon ||
              null,

            shield:
              member.equipment
                ?.shield ||
              null,

            accessory:
              member.equipment
                ?.accessory ||
              null,

            headgear:
              member.equipment
                ?.headgear ||
              null
          };

          Object.keys(
            member.equipment
          ).forEach(
            category => {
              const instanceId =
                member.equipment[
                  category
                ];

              if (!instanceId) {
                return;
              }

              const instance =
                inventory.find(
                  item =>
                    item.instanceId ===
                    instanceId
                );

              const definition =
                getEquipmentDefinition(
                  equipmentData,
                  instance?.equipmentId
                );

              const invalid =
                !validEquipmentIds.has(
                  instanceId
                ) ||
                definition?.category !==
                  category ||
                alreadyAssigned.has(
                  instanceId
                );

              if (invalid) {
                member.equipment[
                  category
                ] = null;

                return;
              }

              alreadyAssigned.add(
                instanceId
              );
            }
          );
        }
      );
    }
  );

  const usedIds =
    (
      teamState?.teams ||
      []
    )
      .flatMap(
        team =>
          team.palmons ||
          []
      )
      .map(
        member =>
          Number(
            String(
              member.instanceId
            ).replace(
              /^team-pal-/,
              ""
            )
          )
      )
      .filter(
        Number.isFinite
      );

  if (
    usedIds.length > 0
  ) {
    teamState.nextPalmonInstanceId =
      Math.max(
        Number(
          teamState
            .nextPalmonInstanceId
        ) || 1,
        Math.max(
          ...usedIds
        ) + 1
      );
  }

  saveState();
}


// ========================================
// SAVE
// ========================================

function saveState() {
  saveTeamState(
    teamState
  );

  window.dispatchEvent(
    new CustomEvent(
      "palmon-team-state-changed"
    )
  );
}


// ========================================
// INIT
// ========================================

export async function
initTeamOverview() {
  const root =
    document.getElementById(
      "team-overview-root"
    );

  if (!root) {
    return;
  }

  try {
    const [
      palmonResponse,
      equipmentResponse,
      traitsResponse
    ] =
      await Promise.all([
        fetch(
          "./data/palmons.json"
        ),
        fetch(
          "./data/equipment.json"
        ),
        fetch(
          "./data/traits.json"
        )
      ]);

    if (
      !palmonResponse.ok ||
      !equipmentResponse.ok ||
      !traitsResponse.ok
    ) {
      throw new Error(
        "Could not load Team Overview data."
      );
    }

    const [
      palmonJson,
      equipmentJson,
      traitJson
    ] =
      await Promise.all([
        palmonResponse.json(),
        equipmentResponse.json(),
        traitsResponse.json()
      ]);

    palmons =
      palmonJson.palmons ||
      [];

    equipmentData =
      equipmentJson;

    traitsData =
      traitJson;

    teamState =
      loadTeamState();

    sanitizeTeamState();

    render();

    window.addEventListener(
      "equipment-state-changed",
      () => {
        sanitizeTeamState();
        render();
      }
    );

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key ===
            "Escape" &&
          (
            editingInstanceId ||
            palmonPickerOpen ||
            equipmentPicker.open
          )
        ) {
          if (equipmentPicker.open) {
            equipmentPicker = {
              open: false,
              memberInstanceId: null,
              category: null,
              query: "",
              rarity: "all"
            };
          }
          else if (palmonPickerOpen) {
            palmonPickerOpen =
              false;

            palmonPickerQuery =
              "";

            palmonPickerElement =
              "all";
          }
          else if (editingInstanceId) {
            editingInstanceId =
              null;
          }

          render();
        }
      }
    );

    window.addEventListener(
      "palmon-page-shown",
      event => {
        if (
          event.detail
            ?.page ===
          "overview"
        ) {
          teamState =
            loadTeamState();

          sanitizeTeamState();

          render();
        }
      }
    );
  }
  catch (error) {
    console.error(
      "Could not initialize Team Overview.",
      error
    );

    root.innerHTML = `
      <div class="team-error">
        Team Overview could not be loaded.
      </div>
    `;
  }
}


// ========================================
// TEAM ACTIONS
// ========================================

function setActiveTeam(
  teamId
) {
  const exists =
    (
      teamState?.teams ||
      []
    ).some(
      team =>
        team.id ===
        teamId
    );

  if (!exists) {
    return;
  }

  teamState.activeTeamId =
    teamId;

  editingInstanceId =
    null;

  palmonPickerOpen =
    false;

  palmonPickerQuery =
    "";

  palmonPickerElement =
    "all";

  saveState();

  render();
}


function addPalmon(
  palmonId
) {
  const team =
    getActiveTeam();

  const palmon =
    getPalmonById(
      palmonId
    );

  if (
    !team ||
    team.palmons.length >= 7 ||
    !palmon
  ) {
    return;
  }

  if (
    teamHasPalmonSpecies(
      team,
      palmonId
    )
  ) {
    return;
  }

  const instanceId =
    `team-pal-${teamState.nextPalmonInstanceId}`;

  teamState.nextPalmonInstanceId +=
    1;

  team.palmons.push({
    instanceId,
    palmonId,

    level: 1,

    stars: 0,
    subLevel: 0,

    evolution: {
      stage: 0,
      talentIndex: 0,
      talentLevel: 0,
      megaEvolved: false
    },

    traitIds: [],

    equipment: {
      weapon: null,
      shield: null,
      accessory: null,
      headgear: null
    }
  });

  palmonPickerOpen =
    false;

  palmonPickerQuery =
    "";

  palmonPickerElement =
    "all";

  editingInstanceId =
    instanceId;

  saveState();

  render();
}


function removePalmon(
  instanceId
) {
  const found =
    getTeamPalmon(
      instanceId
    );

  if (!found) {
    return;
  }

  const palmon =
    getPalmonById(
      found.item.palmonId
    );

  const confirmed =
    window.confirm(
      `Remove ${palmon?.name || "this Palmon"} from ${found.team.name}?`
    );

  if (!confirmed) {
    return;
  }

  found.team.palmons =
    found.team.palmons.filter(
      item =>
        item.instanceId !==
        instanceId
    );

  if (
    editingInstanceId ===
    instanceId
  ) {
    editingInstanceId =
      null;
  }

  saveState();

  render();
}


// ========================================
// CONFIG ACTIONS
// ========================================

function setLevel(
  instanceId,
  value
) {
  const found =
    getTeamPalmon(
      instanceId
    );

  if (!found) {
    return;
  }

  found.item.level =
    clampInteger(
      value,
      1,
      350
    );

  saveState();

  render();
}


function setAscensionProgress(
  instanceId,
  index
) {
  const found =
    getTeamPalmon(
      instanceId
    );

  if (!found) {
    return;
  }

  const normalizedIndex =
    clampInteger(
      index,
      0,
      ASCENSION_STATES.length - 1
    );

  const state =
    ASCENSION_STATES[
      normalizedIndex
    ];

  found.item.stars =
    state.stars;

  found.item.subLevel =
    state.subLevel;

  saveState();

  render();
}


function setEquipment(
  instanceId,
  category,
  equipmentInstanceId
) {
  const found =
    getTeamPalmon(
      instanceId
    );

  if (
    !found ||
    ![
      "weapon",
      "shield",
      "accessory",
      "headgear"
    ].includes(
      category
    )
  ) {
    return;
  }

  const value =
    equipmentInstanceId ||
    null;

  if (value) {
    const assigned =
      getAssignedEquipmentMap(
        instanceId
      );

    if (
      assigned.has(
        value
      )
    ) {
      return;
    }

    const inventory =
      getEquipmentInventory();

    const instance =
      inventory.find(
        item =>
          item.instanceId ===
          value
      );

    const definition =
      getEquipmentDefinition(
        equipmentData,
        instance?.equipmentId
      );

    if (
      definition?.category !==
      category
    ) {
      return;
    }
  }

  found.item.equipment[
    category
  ] = value;

  saveState();

  render();
}


// ========================================
// RENDER HELPERS
// ========================================

function renderCalculationNotice() {
  return `
    <div class="team-calculation-notice">

      <div class="team-calculation-notice-icon">
        !
      </div>

      <div>

        <strong>
          Stat calculation is still in development
        </strong>

        <p>
          The values below are a preview based on the
          systems that are currently modeled. Some
          bonus sources and game mechanics are still
          missing, so these numbers should not yet be
          treated as final ingame stats.
        </p>

        <details>
          <summary>
            What is currently missing?
          </summary>

          <div class="team-calculation-gaps">

            <span>
              Missing systems:
              <strong>
                ${PALMON_STAT_CALCULATION_STATUS
                  .missingSystems
                  .join(", ")}
              </strong>
            </span>

            <span>
              Not yet configurable here:
              <strong>
                ${PALMON_STAT_CALCULATION_STATUS
                  .configurationGaps
                  .join(", ")}
              </strong>
            </span>

            <span>
              Still being validated:
              <strong>
                ${PALMON_STAT_CALCULATION_STATUS
                  .unresolvedMechanics
                  .join(", ")}
              </strong>
            </span>

          </div>
        </details>

      </div>

    </div>
  `;
}


function renderTeamTabs() {
  return `
    <div class="team-tabs">

      ${
        (
          teamState?.teams ||
          []
        )
          .map(
            team => `
              <button
                type="button"
                class="team-tab-button ${
                  team.id ===
                    teamState.activeTeamId
                    ? "active"
                    : ""
                }"
                data-team-id="${team.id}"
              >
                <span>
                  ${team.name}
                </span>

                <small>
                  ${team.palmons.length}/7
                </small>
              </button>
            `
          )
          .join("")
      }

    </div>
  `;
}

function renderTeamSummary(
  team,
  results
) {
  const preferredElementOrder = [
    "Water",
    "Fire",
    "Earth",
    "Electric"
  ];

  const counts = new Map();

  (team?.palmons || []).forEach(
    member => {
      const palmon =
        getPalmonById(
          member.palmonId
        );

      if (!palmon?.element) {
        return;
      }

      counts.set(
        palmon.element,
        (counts.get(palmon.element) || 0) + 1
      );
    }
  );

  const elements = [
    ...preferredElementOrder.filter(
      element => counts.has(element)
    ),
    ...[...counts.keys()]
      .filter(
        element =>
          !preferredElementOrder.includes(element)
      )
      .sort(
        (a, b) => a.localeCompare(b)
      )
  ];

  const elementHtml =
    elements.length > 0
      ? elements.map(
          element => {
            const matchingResult =
              (results || []).find(
                result =>
                  result.palmon?.element === element
              );

            const bonus =
              Number(
                matchingResult?.meta?.sameElementBonus
              ) || 0;

            return `
              <div class="team-summary-element team-summary-element-${element.toLowerCase()}">
                <span>${element}</span>
                <strong>${counts.get(element)}</strong>
                ${bonus > 0 ? `<small>+${bonus}%</small>` : ""}
              </div>
            `;
          }
        ).join("")
      : `
          <span class="team-summary-empty">
            No Palmons selected yet.
          </span>
        `;

  return `
    <div class="team-summary">
      <div class="team-summary-stat">
        <span>Squad</span>
        <strong>${team.palmons.length}/7</strong>
      </div>

      <div class="team-summary-elements">
        ${elementHtml}
      </div>
    </div>
  `;
}


function getAvailablePalmonsForTeam(
  team
) {
  const usedPalmonIds =
    new Set(
      (
        team?.palmons ||
        []
      ).map(
        member =>
          member.palmonId
      )
    );

  return palmons.filter(
    palmon =>
      !usedPalmonIds.has(
        palmon.id
      )
  );
}


function renderAddPalmon(
  team
) {
  const maxed =
    team.palmons.length >= 7;

  const availableCount =
    getAvailablePalmonsForTeam(
      team
    ).length;

  const disabled =
    maxed ||
    availableCount === 0;

  return `
    <div class="team-add-palmon">

      <div class="team-add-palmon-copy">
        <strong>
          Add Palmon
        </strong>

        <span>
          Choose by element or search by name.
        </span>
      </div>

      <button
        type="button"
        data-team-open-palmon-picker
        ${disabled ? "disabled" : ""}
      >
        + Choose Palmon
      </button>

    </div>
  `;
}


function renderPalmonPicker() {
  if (!palmonPickerOpen) {
    return "";
  }

  const team =
    getActiveTeam();

  if (!team) {
    return "";
  }

  const available =
    getAvailablePalmonsForTeam(
      team
    );

  const preferredElementOrder = [
    "Water",
    "Fire",
    "Earth",
    "Electric"
  ];

  const elements =
    [
      ...new Set(
        available.map(
          palmon =>
            palmon.element
        )
      )
    ];

  const orderedElements = [
    ...preferredElementOrder.filter(
      element =>
        elements.includes(
          element
        )
    ),
    ...elements
      .filter(
        element =>
          !preferredElementOrder.includes(
            element
          )
      )
      .sort(
        (a, b) =>
          a.localeCompare(b)
      )
  ];

  return `
    <div class="team-palmon-picker-modal">

      <button
        type="button"
        class="team-palmon-picker-backdrop"
        data-team-close-palmon-picker
        aria-label="Close Palmon picker"
      ></button>

      <div
        class="team-palmon-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-palmon-picker-title"
      >

        <div class="team-palmon-picker-header">

          <div>
            <h2 id="team-palmon-picker-title">
              Add Palmon
            </h2>

            <p>
              ${team.name}
              ·
              ${team.palmons.length}/7 Palmons
            </p>
          </div>

          <button
            type="button"
            class="team-palmon-picker-close"
            data-team-close-palmon-picker
            aria-label="Close"
          >
            ×
          </button>

        </div>


        <div class="team-palmon-picker-tools">

          <label class="team-palmon-picker-search">
            <span class="sr-only">
              Search Palmon
            </span>

            <input
              type="search"
              placeholder="Search Palmon..."
              autocomplete="off"
              value="${palmonPickerQuery}"
              data-team-palmon-picker-search
            >
          </label>


          <div
            class="team-palmon-picker-filters"
            role="group"
            aria-label="Filter by element"
          >
            ${[
              "all",
              ...orderedElements
            ]
              .map(
                element => `
                  <button
                    type="button"
                    class="${palmonPickerElement === element ? "active" : ""}"
                    data-team-palmon-picker-filter="${element}"
                  >
                    ${element === "all" ? "All" : element}
                  </button>
                `
              )
              .join("")}
          </div>

        </div>


        <div class="team-palmon-picker-body">

          ${orderedElements
            .map(
              element => {
                const elementPalmons =
                  available
                    .filter(
                      palmon =>
                        palmon.element ===
                        element
                    )
                    .sort(
                      (a, b) =>
                        a.name.localeCompare(
                          b.name
                        )
                    );

                return `
                  <section
                    class="team-palmon-picker-group"
                    data-team-palmon-picker-group="${element}"
                  >
                    <div class="team-palmon-picker-group-header">
                      <h3>
                        ${element}
                      </h3>

                      <span>
                        ${elementPalmons.length}
                      </span>
                    </div>

                    <div class="team-palmon-picker-grid">
                      ${elementPalmons
                        .map(
                          palmon => `
                            <button
                              type="button"
                              class="team-palmon-picker-card"
                              data-team-palmon-picker-item="${palmon.id}"
                              data-team-palmon-element="${palmon.element}"
                            >
                              <span class="team-palmon-picker-name">
                                ${palmon.name}
                              </span>

                              <span class="team-palmon-picker-meta">
                                ${palmon.role}
                                ·
                                ${palmon.rarity}
                              </span>
                            </button>
                          `
                        )
                        .join("")}
                    </div>
                  </section>
                `;
              }
            )
            .join("")}

          <div
            class="team-palmon-picker-empty team-palmon-picker-hidden"
            data-team-palmon-picker-empty
          >
            No matching Palmons found.
          </div>

        </div>

      </div>

    </div>
  `;
}


function updatePalmonPickerVisibility() {
  const query =
    palmonPickerQuery
      .trim()
      .toLowerCase();

  let visibleCount = 0;

  document
    .querySelectorAll(
      "[data-team-palmon-picker-item]"
    )
    .forEach(
      button => {
        const element =
          button.dataset
            .teamPalmonElement ||
          "";

        const matchesElement =
          palmonPickerElement ===
            "all" ||
          element ===
            palmonPickerElement;

        const matchesSearch =
          !query ||
          button.textContent
            .toLowerCase()
            .includes(
              query
            );

        const visible =
          matchesElement &&
          matchesSearch;

        button.classList.toggle(
          "team-palmon-picker-hidden",
          !visible
        );

        if (visible) {
          visibleCount += 1;
        }
      }
    );

  document
    .querySelectorAll(
      "[data-team-palmon-picker-group]"
    )
    .forEach(
      group => {
        const hasVisibleItems =
          [
            ...group.querySelectorAll(
              "[data-team-palmon-picker-item]"
            )
          ].some(
            item =>
              !item.classList.contains(
                "team-palmon-picker-hidden"
              )
          );

        group.classList.toggle(
          "team-palmon-picker-hidden",
          !hasVisibleItems
        );
      }
    );

  const empty =
    document.querySelector(
      "[data-team-palmon-picker-empty]"
    );

  if (empty) {
    empty.classList.toggle(
      "team-palmon-picker-hidden",
      visibleCount > 0
    );
  }

  document
    .querySelectorAll(
      "[data-team-palmon-picker-filter]"
    )
    .forEach(
      button => {
        button.classList.toggle(
          "active",
          button.dataset
            .teamPalmonPickerFilter ===
            palmonPickerElement
        );
      }
    );
}

function renderEquipmentSummary(
  member
) {
  const inventory =
    getEquipmentInventory();

  const slots = [
    { category: "weapon", label: "Weapon" },
    { category: "shield", label: "Shield" },
    { category: "accessory", label: "Accessory" },
    { category: "headgear", label: "Headgear" }
  ];

  const equippedCount =
    slots.filter(
      slot =>
        Boolean(
          member.equipment?.[slot.category]
        )
    ).length;

  return `
    <div class="team-equipment-summary-heading">
      <span>Equipment</span>
      <strong>${equippedCount}/4</strong>
    </div>

    <div class="team-equipment-summary-grid">
      ${slots.map(
        slot => {
          const instanceId =
            member.equipment?.[slot.category] ||
            null;

          const instance =
            instanceId
              ? inventory.find(
                  item =>
                    item.instanceId === instanceId
                )
              : null;

          const definition =
            instance
              ? getEquipmentDefinition(
                  equipmentData,
                  instance.equipmentId
                )
              : null;

          if (!instance || !definition) {
            return `
              <button
                type="button"
                class="team-equipment-summary-slot empty"
                data-team-card-equipment-picker="${slot.category}"
                data-team-instance-id="${member.instanceId}"
                aria-label="Choose ${slot.label}"
              >
                <span class="team-equipment-summary-slot-label">
                  ${slot.label}
                </span>
                <strong>Empty</strong>
                <span class="team-equipment-summary-slot-detail">—</span>
                <span class="team-equipment-summary-slot-detail">—</span>
              </button>
            `;
          }

          return `
            <button
              type="button"
              class="team-equipment-summary-slot"
              data-team-card-equipment-picker="${slot.category}"
              data-team-instance-id="${member.instanceId}"
              aria-label="Change ${slot.label}"
            >
              <span class="team-equipment-summary-slot-label">
                ${slot.label}
              </span>

              <strong title="${getEquipmentDisplayName(instance, inventory)}">
                ${getEquipmentDisplayName(instance, inventory)}
              </strong>

              <span class="team-equipment-summary-slot-detail">
                Lv${instance.enhancementLevel}
              </span>

              <span class="team-equipment-summary-slot-detail">
                ${getEquipmentAscensionLabel(
                  equipmentData,
                  instance.ascensionLevel
                )}
              </span>
            </button>
          `;
        }
      ).join("")}
    </div>
  `;
}

function renderTeamPalmonCard(
  member,
  result
) {
  const palmon =
    getPalmonById(
      member.palmonId
    );

  if (!palmon) {
    return "";
  }

  const supported =
    Boolean(
      result?.supported
    );

  const displayName =
    getPalmonDisplayName(
      palmon,
      member
    );

  const evolvedNameActive =
    displayName !==
    palmon.name;

  const evolutionStage =
    clampInteger(
      member.evolution
        ?.stage,
      0,
      8
    );

  return `
    <article class="team-palmon-card">

      <div class="team-palmon-card-header">

        <div>
          <div class="team-palmon-name-row">

            <div class="team-palmon-title">
              <h3>
                ${displayName}
              </h3>

              ${evolvedNameActive
                ? `
                  <span class="team-palmon-origin-name">
                    ${palmon.name} evolution line
                  </span>
                `
                : ""}
            </div>

            <span class="team-preview-badge">
              Preview
            </span>

          </div>

          <div class="team-palmon-meta">

            <span class="team-element team-element-${palmon.element.toLowerCase()}">
              ${palmon.element}
            </span>

            <span>
              ${palmon.role}
            </span>

            <span>
              ${palmon.rarity}
            </span>

          </div>
        </div>


        <button
          type="button"
          class="team-configure-button"
          data-team-configure="${member.instanceId}"
        >
          Configure
        </button>

      </div>


      <div class="team-palmon-progress">
        <span>
          Lv${member.level}
        </span>

        <span>
          ${member.stars}-${member.subLevel}★
        </span>

        <span>
          Evo ${evolutionStage}
        </span>
      </div>


      ${
        supported
          ? `
            <div class="team-stat-grid">

              <div>
                <span>Attack</span>
                <strong>
                  ${formatNumber(
                    result.finalStats
                      .attack
                  )}
                </strong>
              </div>

              <div>
                <span>Defense</span>
                <strong>
                  ${formatNumber(
                    result.finalStats
                      .defense
                  )}
                </strong>
              </div>

              <div>
                <span>HP</span>
                <strong>
                  ${formatNumber(
                    result.finalStats
                      .hp
                  )}
                </strong>
              </div>

            </div>

            ${
              result.meta
                ?.sameElementBonus > 0
                ? `
                  <div class="team-squad-bonus">
                    ${result.meta.sameElementCount}
                    ${palmon.element} Palmon
                    ·
                    +${result.meta.sameElementBonus}%
                    ATK / DEF / HP
                  </div>
                `
                : ""
            }
          `
          : `
            <div class="team-stat-unavailable">
              Stat preview unavailable for this Palmon.
              ${result?.warnings?.[0] || ""}
            </div>
          `
      }


      <div class="team-palmon-equipment">

        ${renderEquipmentSummary(
          member
        )}

      </div>


      <div class="team-palmon-card-actions">

        <button
          type="button"
          class="team-remove-button"
          data-team-remove="${member.instanceId}"
        >
          Remove
        </button>

      </div>

    </article>
  `;
}


function getAscensionIndex(
  member
) {
  const index =
    ASCENSION_STATES.findIndex(
      state =>
        state.stars ===
          member.stars &&
        state.subLevel ===
          member.subLevel
    );

  return index >= 0
    ? index
    : 0;
}


function changeAscensionProgress(
  instanceId,
  direction
) {
  const found =
    getTeamPalmon(
      instanceId
    );

  if (!found) {
    return;
  }

  const currentIndex =
    getAscensionIndex(
      found.item
    );

  setAscensionProgress(
    instanceId,
    clampInteger(
      currentIndex +
        Number(direction || 0),
      0,
      ASCENSION_STATES.length - 1
    )
  );
}


function getAvailableEquipmentForCategory({
  member,
  category
}) {
  const inventory =
    getEquipmentInventory();

  const assignedElsewhere =
    getAssignedEquipmentMap(
      member.instanceId
    );

  return inventory.filter(
    instance => {
      const definition =
        getEquipmentDefinition(
          equipmentData,
          instance.equipmentId
        );

      if (
        definition?.category !==
        category
      ) {
        return false;
      }

      if (
        member.equipment
          ?.[category] ===
        instance.instanceId
      ) {
        return true;
      }

      return !assignedElsewhere.has(
        instance.instanceId
      );
    }
  );
}


function renderEquipmentSlot({
  member,
  category,
  label
}) {
  const inventory =
    getEquipmentInventory();

  const currentId =
    member.equipment
      ?.[category] ||
    null;

  const instance =
    currentId
      ? inventory.find(
          item =>
            item.instanceId ===
            currentId
        )
      : null;

  const definition =
    instance
      ? getEquipmentDefinition(
          equipmentData,
          instance.equipmentId
        )
      : null;

  return `
    <div class="team-equipment-slot">

      <div class="team-equipment-slot-header">
        <span>
          ${label}
        </span>

        ${definition
          ? `
            <span class="team-equipment-slot-rarity">
              ${definition.rarity || ""}
            </span>
          `
          : ""}
      </div>

      <div class="team-equipment-slot-content">

        ${definition
          ? `
            <strong>
              ${getEquipmentDisplayName(
                instance,
                inventory
              )}
            </strong>

            <span>
              Lv${instance.enhancementLevel}
              ·
              ${getEquipmentAscensionLabel(
                equipmentData,
                instance.ascensionLevel
              )}
            </span>
          `
          : `
            <strong>
              None equipped
            </strong>

            <span>
              Choose an item from your inventory.
            </span>
          `
        }

      </div>

      <div class="team-equipment-slot-actions">

        <button
          type="button"
          class="team-equipment-choose-button"
          data-team-open-equipment-picker="${category}"
          data-team-instance-id="${member.instanceId}"
        >
          ${definition ? "Change" : "Choose"}
        </button>

        ${definition
          ? `
            <button
              type="button"
              class="team-equipment-unequip-button"
              data-team-unequip-category="${category}"
              data-team-instance-id="${member.instanceId}"
            >
              Unequip
            </button>
          `
          : ""}
      </div>

    </div>
  `;
}


function renderEquipmentPicker() {
  if (
    !equipmentPicker.open ||
    !equipmentPicker.memberInstanceId ||
    !equipmentPicker.category
  ) {
    return "";
  }

  const found =
    getTeamPalmon(
      equipmentPicker.memberInstanceId
    );

  if (!found) {
    return "";
  }

  const member =
    found.item;

  const category =
    equipmentPicker.category;

  const inventory =
    getEquipmentInventory();

  const available =
    getAvailableEquipmentForCategory({
      member,
      category
    });

  const categoryLabel =
    category.charAt(0).toUpperCase() +
    category.slice(1);

  const currentId =
    member.equipment
      ?.[category] ||
    "";

  return `
    <div class="team-equipment-picker-modal">

      <button
        type="button"
        class="team-equipment-picker-backdrop"
        data-team-close-equipment-picker
        aria-label="Close Equipment picker"
      ></button>

      <div
        class="team-equipment-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-equipment-picker-title"
      >

        <div class="team-equipment-picker-header">

          <div>
            <h2 id="team-equipment-picker-title">
              Choose ${categoryLabel}
            </h2>

            <p>
              ${found.team.name}
              ·
              ${getPalmonById(member.palmonId)?.name || "Palmon"}
            </p>
          </div>

          <button
            type="button"
            class="team-equipment-picker-close"
            data-team-close-equipment-picker
            aria-label="Close"
          >
            ×
          </button>

        </div>

        <div class="team-equipment-picker-tools">

          <input
            type="search"
            placeholder="Search Equipment..."
            autocomplete="off"
            value="${equipmentPicker.query}"
            data-team-equipment-picker-search
          >

          <div class="team-equipment-picker-filters">
            ${["all", "UR", "SSR"]
              .map(
                rarity => `
                  <button
                    type="button"
                    class="${equipmentPicker.rarity === rarity ? "active" : ""}"
                    data-team-equipment-picker-rarity="${rarity}"
                  >
                    ${rarity === "all" ? "All" : rarity}
                  </button>
                `
              )
              .join("")}
          </div>

        </div>

        <div class="team-equipment-picker-body">

          <button
            type="button"
            class="team-equipment-picker-item team-equipment-picker-none"
            data-team-equipment-picker-item=""
          >
            <strong>
              None
            </strong>

            <span>
              Unequip this slot
            </span>
          </button>

          ${available
            .map(
              instance => {
                const definition =
                  getEquipmentDefinition(
                    equipmentData,
                    instance.equipmentId
                  );

                if (!definition) {
                  return "";
                }

                return `
                  <button
                    type="button"
                    class="team-equipment-picker-item ${currentId === instance.instanceId ? "active" : ""}"
                    data-team-equipment-picker-item="${instance.instanceId}"
                    data-team-equipment-name="${getEquipmentDisplayName(instance, inventory)}"
                    data-team-equipment-rarity="${definition.rarity || ""}"
                  >
                    <div>
                      <strong>
                        ${getEquipmentDisplayName(
                          instance,
                          inventory
                        )}
                      </strong>

                      <span>
                        ${definition.rarity || ""}
                        ·
                        Lv${instance.enhancementLevel}
                        ·
                        ${getEquipmentAscensionLabel(
                          equipmentData,
                          instance.ascensionLevel
                        )}
                      </span>
                    </div>

                    ${currentId === instance.instanceId
                      ? `
                        <small>
                          Equipped
                        </small>
                      `
                      : ""}
                  </button>
                `;
              }
            )
            .join("")}

          <div
            class="team-equipment-picker-empty team-palmon-picker-hidden"
            data-team-equipment-picker-empty
          >
            No matching Equipment found.
          </div>

        </div>

      </div>

    </div>
  `;
}


function updateEquipmentPickerVisibility() {
  const query =
    equipmentPicker.query
      .trim()
      .toLowerCase();

  let visibleCount = 0;

  document
    .querySelectorAll(
      "[data-team-equipment-picker-item]"
    )
    .forEach(
      button => {
        const instanceId =
          button.dataset
            .teamEquipmentPickerItem;

        if (instanceId === "") {
          button.classList.remove(
            "team-palmon-picker-hidden"
          );

          return;
        }

        const name =
          button.dataset
            .teamEquipmentName
            ?.toLowerCase() ||
          "";

        const rarity =
          button.dataset
            .teamEquipmentRarity ||
          "";

        const matchesQuery =
          !query ||
          name.includes(
            query
          );

        const matchesRarity =
          equipmentPicker.rarity ===
            "all" ||
          rarity ===
            equipmentPicker.rarity;

        const visible =
          matchesQuery &&
          matchesRarity;

        button.classList.toggle(
          "team-palmon-picker-hidden",
          !visible
        );

        if (visible) {
          visibleCount += 1;
        }
      }
    );

  const empty =
    document.querySelector(
      "[data-team-equipment-picker-empty]"
    );

  if (empty) {
    empty.classList.toggle(
      "team-palmon-picker-hidden",
      visibleCount > 0
    );
  }

  document
    .querySelectorAll(
      "[data-team-equipment-picker-rarity]"
    )
    .forEach(
      button => {
        button.classList.toggle(
          "active",
          button.dataset
            .teamEquipmentPickerRarity ===
            equipmentPicker.rarity
        );
      }
    );
}

function renderConfigModal() {
  if (!editingInstanceId) {
    return "";
  }

  const found =
    getTeamPalmon(
      editingInstanceId
    );

  if (!found) {
    return "";
  }

  const member =
    found.item;

  const palmon =
    getPalmonById(
      member.palmonId
    );

  if (!palmon) {
    return "";
  }

  const ascensionIndex =
    getAscensionIndex(
      member
    );

  const displayName =
    getPalmonDisplayName(
      palmon,
      member
    );

  return `
    <div class="team-config-modal">

      <button
        type="button"
        class="team-config-backdrop"
        data-team-config-close
        aria-label="Close configuration"
      ></button>


      <div
        class="team-config-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-config-title"
      >

        <div class="team-config-header">

          <div>
            <h2 id="team-config-title">
              ${displayName}
            </h2>

            <p>
              ${found.team.name}
              ·
              ${palmon.element}
              ·
              ${palmon.role}
            </p>
          </div>

          <button
            type="button"
            class="team-config-close"
            data-team-config-close
            aria-label="Close"
          >
            ×
          </button>

        </div>


        <div class="team-config-tabs">
          <button
            type="button"
            class="${configTab === "progression" ? "active" : ""}"
            data-team-config-tab="progression"
          >
            Progression
          </button>

          <button
            type="button"
            class="${configTab === "equipment" ? "active" : ""}"
            data-team-config-tab="equipment"
          >
            Equipment
          </button>
        </div>


        <div class="team-config-body">

          <section class="team-config-section team-config-panel ${configTab === "progression" ? "active" : ""}">

            <h3>
              Progression
            </h3>

            <label class="team-config-field">
              <span>
                Level
              </span>

              <input
                type="number"
                min="1"
                max="350"
                step="1"
                value="${member.level}"
                data-team-level="${member.instanceId}"
              >
            </label>


            <input
              class="team-level-range"
              type="range"
              min="1"
              max="350"
              step="1"
              value="${member.level}"
              data-team-level-range="${member.instanceId}"
            >


            <div class="team-ascension-control">

              <div class="team-ascension-label-row">
                <span>
                  Ascension
                </span>

                <strong>
                  ${ASCENSION_STATES[ascensionIndex].stars}-${ASCENSION_STATES[ascensionIndex].subLevel}★
                </strong>
              </div>

              <div class="team-ascension-stepper">
                <button
                  type="button"
                  data-team-ascension-step="-1"
                  data-team-instance-id="${member.instanceId}"
                  ${ascensionIndex <= 0 ? "disabled" : ""}
                  aria-label="Previous Ascension stage"
                >
                  −
                </button>

                <div
                  class="team-ascension-options"
                  data-team-ascension-options
                >
                  ${
                    ASCENSION_STATES
                      .map(
                        (
                          state,
                          index
                        ) => `
                          <button
                            type="button"
                            class="${ascensionIndex === index ? "active" : ""}"
                            data-team-ascension-option="${index}"
                            data-team-instance-id="${member.instanceId}"
                          >
                            ${state.stars}-${state.subLevel}★
                          </button>
                        `
                      )
                      .join("")
                  }
                </div>

                <button
                  type="button"
                  data-team-ascension-step="1"
                  data-team-instance-id="${member.instanceId}"
                  ${ascensionIndex >= ASCENSION_STATES.length - 1 ? "disabled" : ""}
                  aria-label="Next Ascension stage"
                >
                  +
                </button>
              </div>

            </div>

          </section>


          <section class="team-config-section team-config-panel ${configTab === "equipment" ? "active" : ""}">

            <h3>
              Equipment
            </h3>

            <p class="team-config-section-note">
              Only unassigned inventory items are shown.
              One item per category can be equipped.
            </p>

            <div class="team-equipment-config-grid">

              ${renderEquipmentSlot({
                member,
                category:
                  "weapon",
                label:
                  "Weapon"
              })}

              ${renderEquipmentSlot({
                member,
                category:
                  "shield",
                label:
                  "Shield"
              })}

              ${renderEquipmentSlot({
                member,
                category:
                  "accessory",
                label:
                  "Accessory"
              })}

              ${renderEquipmentSlot({
                member,
                category:
                  "headgear",
                label:
                  "Headgear"
              })}

            </div>

          </section>


          <div class="team-config-future-note">

            <strong>
              Still to be added to this Palmon editor
            </strong>

            <span>
              Evolution progression, Traits and full
              Palmon Skill configuration. Until those
              systems are connected here, the displayed
              stat preview can be lower than the final
              ingame value.
            </span>

          </div>

        </div>


        <div class="team-config-footer">

          <button
            type="button"
            class="team-config-done"
            data-team-config-close
          >
            Done
          </button>

        </div>

      </div>

    </div>
  `;
}


// ========================================
// RENDER
// ========================================

function render() {
  const root =
    document.getElementById(
      "team-overview-root"
    );

  if (
    !root ||
    !teamState
  ) {
    return;
  }

  const team =
    getActiveTeam();

  if (!team) {
    return;
  }

  const inventory =
    getEquipmentInventory();

  const results =
    calculateTeamStats({
      team,
      palmons,
      equipmentData,
      equipmentInstances:
        inventory,
      traitsData,
      squadNumber:
        getTeamNumber(
          team.id
        )
    });

  const resultMap =
    new Map(
      results.map(
        result => [
          result.config
            ?.instanceId,
          result
        ]
      )
    );

  root.innerHTML = `

    ${renderCalculationNotice()}

    ${renderTeamTabs()}


    <section class="section team-builder-section">

      <div class="section-header team-builder-header">

        <div>
          <h2>
            ${team.name}
          </h2>

          <p>
            Build a squad with 1–7 Palmons.
            Equipment assignments are shared with
            your Equipment inventory.
          </p>
        </div>

        <span class="team-size-badge">
          ${team.palmons.length}/7
        </span>

      </div>


      ${renderTeamSummary(
        team,
        results
      )}

      ${renderAddPalmon(
        team
      )}


      <div class="team-palmon-grid">

        ${
          team.palmons.length > 0
            ? team.palmons
                .map(
                  member =>
                    renderTeamPalmonCard(
                      member,
                      resultMap.get(
                        member.instanceId
                      )
                    )
                )
                .join("")
            : `
              <div class="team-empty-state">
                <strong>
                  No Palmons in this team yet.
                </strong>

                <span>
                  Choose a Palmon above to start
                  building ${team.name}.
                </span>
              </div>
            `
        }

      </div>

    </section>


    ${renderPalmonPicker()}

    ${renderConfigModal()}

    ${renderEquipmentPicker()}

  `;

  document.body.classList.toggle(
    "team-modal-open",
    Boolean(
      editingInstanceId ||
      palmonPickerOpen ||
      equipmentPicker.open
    )
  );

  addListeners();
}


// ========================================
// LISTENERS
// ========================================

function addListeners() {
  document
    .querySelectorAll(
      "[data-team-id]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            setActiveTeam(
              button.dataset
                .teamId
            );
          }
        );
      }
    );


  const openPickerButton =
    document.querySelector(
      "[data-team-open-palmon-picker]"
    );

  if (openPickerButton) {
    openPickerButton.addEventListener(
      "click",
      () => {
        palmonPickerOpen =
          true;

        palmonPickerElement =
          "all";

        palmonPickerQuery =
          "";

        render();

        requestAnimationFrame(
          () => {
            document
              .querySelector(
                "[data-team-palmon-picker-search]"
              )
              ?.focus();
          }
        );
      }
    );
  }


  document
    .querySelectorAll(
      "[data-team-close-palmon-picker]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            palmonPickerOpen =
              false;

            palmonPickerElement =
              "all";

            palmonPickerQuery =
              "";

            render();
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-palmon-picker-filter]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            palmonPickerElement =
              button.dataset
                .teamPalmonPickerFilter ||
              "all";

            updatePalmonPickerVisibility();
          }
        );
      }
    );


  const pickerSearch =
    document.querySelector(
      "[data-team-palmon-picker-search]"
    );

  if (pickerSearch) {
    pickerSearch.addEventListener(
      "input",
      () => {
        palmonPickerQuery =
          pickerSearch.value;

        updatePalmonPickerVisibility();
      }
    );
  }


  document
    .querySelectorAll(
      "[data-team-palmon-picker-item]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            addPalmon(
              button.dataset
                .teamPalmonPickerItem
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-configure]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            editingInstanceId =
              button.dataset
                .teamConfigure;

            configTab =
              "progression";

            render();
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-config-tab]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            configTab =
              button.dataset
                .teamConfigTab ||
              "progression";

            render();
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-card-equipment-picker]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            equipmentPicker = {
              open: true,
              memberInstanceId:
                button.dataset
                  .teamInstanceId,
              category:
                button.dataset
                  .teamCardEquipmentPicker,
              query: "",
              rarity: "all"
            };

            render();

            requestAnimationFrame(
              () => {
                document
                  .querySelector(
                    "[data-team-equipment-picker-search]"
                  )
                  ?.focus();
              }
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-remove]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            removePalmon(
              button.dataset
                .teamRemove
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-config-close]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            editingInstanceId =
              null;

            configTab =
              "progression";

            render();
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-level]"
    )
    .forEach(
      input => {
        input.addEventListener(
          "change",
          () => {
            setLevel(
              input.dataset
                .teamLevel,
              input.value
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-level-range]"
    )
    .forEach(
      input => {
        input.addEventListener(
          "change",
          () => {
            setLevel(
              input.dataset
                .teamLevelRange,
              input.value
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-ascension-option]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            setAscensionProgress(
              button.dataset
                .teamInstanceId,
              button.dataset
                .teamAscensionOption
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-ascension-step]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            changeAscensionProgress(
              button.dataset
                .teamInstanceId,
              button.dataset
                .teamAscensionStep
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-open-equipment-picker]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            equipmentPicker = {
              open: true,
              memberInstanceId:
                button.dataset
                  .teamInstanceId,
              category:
                button.dataset
                  .teamOpenEquipmentPicker,
              query: "",
              rarity: "all"
            };

            render();

            requestAnimationFrame(
              () => {
                document
                  .querySelector(
                    "[data-team-equipment-picker-search]"
                  )
                  ?.focus();
              }
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-unequip-category]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            setEquipment(
              button.dataset
                .teamInstanceId,
              button.dataset
                .teamUnequipCategory,
              null
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-close-equipment-picker]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            equipmentPicker = {
              open: false,
              memberInstanceId: null,
              category: null,
              query: "",
              rarity: "all"
            };

            render();
          }
        );
      }
    );


  const equipmentPickerSearch =
    document.querySelector(
      "[data-team-equipment-picker-search]"
    );

  if (equipmentPickerSearch) {
    equipmentPickerSearch.addEventListener(
      "input",
      () => {
        equipmentPicker.query =
          equipmentPickerSearch.value;

        updateEquipmentPickerVisibility();
      }
    );
  }


  document
    .querySelectorAll(
      "[data-team-equipment-picker-rarity]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            equipmentPicker.rarity =
              button.dataset
                .teamEquipmentPickerRarity ||
              "all";

            updateEquipmentPickerVisibility();
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-equipment-picker-item]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            setEquipment(
              equipmentPicker.memberInstanceId,
              equipmentPicker.category,
              button.dataset
                .teamEquipmentPickerItem ||
                null
            );

            equipmentPicker = {
              open: false,
              memberInstanceId: null,
              category: null,
              query: "",
              rarity: "all"
            };

            render();
          }
        );
      }
    );


}

