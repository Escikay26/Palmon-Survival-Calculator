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
      team.palmons =
        (
          team.palmons ||
          []
        )
          .filter(
            member =>
              validPalmonIds.has(
                member.palmonId
              )
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
          editingInstanceId
        ) {
          editingInstanceId =
            null;

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

  saveState();

  render();
}


function addPalmon(
  palmonId
) {
  const team =
    getActiveTeam();

  if (
    !team ||
    team.palmons.length >= 7 ||
    !getPalmonById(
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


function renderAddPalmon(
  team
) {
  const maxed =
    team.palmons.length >= 7;

  const sorted =
    [
      ...palmons
    ].sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    );

  return `
    <div class="team-add-palmon">

      <select
        id="team-add-palmon-select"
        ${maxed ? "disabled" : ""}
      >
        ${
          sorted
            .map(
              palmon => `
                <option
                  value="${palmon.id}"
                >
                  ${palmon.name}
                  ·
                  ${palmon.element}
                  ·
                  ${palmon.role}
                  ·
                  ${palmon.rarity}
                </option>
              `
            )
            .join("")
        }
      </select>

      <button
        type="button"
        data-team-add-palmon
        ${maxed ? "disabled" : ""}
      >
        + Add Palmon
      </button>

    </div>
  `;
}


function renderEquipmentSummary(
  member
) {
  const inventory =
    getEquipmentInventory();

  const equipped =
    Object.values(
      member.equipment ||
      {}
    )
      .filter(Boolean)
      .map(
        instanceId =>
          inventory.find(
            item =>
              item.instanceId ===
              instanceId
          )
      )
      .filter(Boolean);

  if (
    equipped.length === 0
  ) {
    return `
      <span class="team-equipment-empty">
        No Equipment assigned
      </span>
    `;
  }

  return `
    <div class="team-equipment-summary">
      ${
        equipped
          .map(
            instance => {
              const definition =
                getEquipmentDefinition(
                  equipmentData,
                  instance.equipmentId
                );

              return `
                <span>
                  ${definition?.name || "Equipment"}
                </span>
              `;
            }
          )
          .join("")
      }
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

  return `
    <article class="team-palmon-card">

      <div class="team-palmon-card-header">

        <div>
          <div class="team-palmon-name-row">

            <h3>
              ${palmon.name}
            </h3>

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
        Lv${member.level}
        ·
        ${member.stars}-${member.subLevel}★
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

        <span>
          Equipment
        </span>

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


function renderEquipmentSelect({
  member,
  category,
  label
}) {
  const inventory =
    getEquipmentInventory();

  const available =
    getAvailableEquipmentForCategory({
      member,
      category
    });

  const currentId =
    member.equipment
      ?.[category] ||
    "";

  return `
    <label class="team-config-field">

      <span>
        ${label}
      </span>

      <select
        data-team-equipment-category="${category}"
        data-team-instance-id="${member.instanceId}"
      >

        <option value="">
          None
        </option>

        ${
          available
            .map(
              instance => {
                const definition =
                  getEquipmentDefinition(
                    equipmentData,
                    instance.equipmentId
                  );

                return `
                  <option
                    value="${instance.instanceId}"
                    ${
                      currentId ===
                        instance.instanceId
                        ? "selected"
                        : ""
                    }
                  >
                    ${definition?.rarity || ""}
                    ·
                    ${getEquipmentDisplayName(
                      instance,
                      inventory
                    )}
                    ·
                    Lv${instance.enhancementLevel}
                    ·
                    ${getEquipmentAscensionLabel(
                      equipmentData,
                      instance.ascensionLevel
                    )}
                  </option>
                `;
              }
            )
            .join("")
        }

      </select>

    </label>
  `;
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
              ${palmon.name}
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


        <div class="team-config-body">

          <section class="team-config-section">

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


            <label class="team-config-field">
              <span>
                Ascension
              </span>

              <select
                data-team-ascension="${member.instanceId}"
              >
                ${
                  ASCENSION_STATES
                    .map(
                      (
                        state,
                        index
                      ) => `
                        <option
                          value="${index}"
                          ${
                            ascensionIndex ===
                              index
                              ? "selected"
                              : ""
                          }
                        >
                          ${state.stars}-${state.subLevel}★
                        </option>
                      `
                    )
                    .join("")
                }
              </select>
            </label>

          </section>


          <section class="team-config-section">

            <h3>
              Equipment
            </h3>

            <p class="team-config-section-note">
              Only unassigned inventory items are shown.
              One item per category can be equipped.
            </p>

            <div class="team-equipment-config-grid">

              ${renderEquipmentSelect({
                member,
                category:
                  "weapon",
                label:
                  "Weapon"
              })}

              ${renderEquipmentSelect({
                member,
                category:
                  "shield",
                label:
                  "Shield"
              })}

              ${renderEquipmentSelect({
                member,
                category:
                  "accessory",
                label:
                  "Accessory"
              })}

              ${renderEquipmentSelect({
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


    ${renderConfigModal()}

  `;

  document.body.classList.toggle(
    "team-modal-open",
    Boolean(
      editingInstanceId
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


  const addButton =
    document.querySelector(
      "[data-team-add-palmon]"
    );

  if (addButton) {
    addButton.addEventListener(
      "click",
      () => {
        const select =
          document.getElementById(
            "team-add-palmon-select"
          );

        if (!select) {
          return;
        }

        addPalmon(
          select.value
        );
      }
    );
  }


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

            render();
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
      "[data-team-ascension]"
    )
    .forEach(
      select => {
        select.addEventListener(
          "change",
          () => {
            setAscensionProgress(
              select.dataset
                .teamAscension,
              select.value
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      "[data-team-equipment-category]"
    )
    .forEach(
      select => {
        select.addEventListener(
          "change",
          () => {
            setEquipment(
              select.dataset
                .teamInstanceId,
              select.dataset
                .teamEquipmentCategory,
              select.value
            );
          }
        );
      }
    );


}

