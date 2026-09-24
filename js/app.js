import {
  initAchievementSystem
} from "./achievements.js";

import {
  initBossPalmonSystem
} from "./boss-palmon.js";

import {
  initResearchSystem
} from "./research.js";

import {
  clearAchievementState,
  clearBossPalmonState,
  clearResearchState,
  clearAllPlannerState
} from "./storage.js";


// =============================
// PAGE STATE
// =============================

let currentPage =
  "overview";


// =============================
// NAVIGATION
// =============================

function showPage(
  pageName
) {
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
    .forEach(
      page => {
        page.classList.remove(
          "active"
        );
      }
    );


  document
    .querySelectorAll(
      ".nav-button"
    )
    .forEach(
      button => {
        button.classList.remove(
          "active"
        );
      }
    );


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
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const page =
              button.dataset.page;


            showPage(
              page
            );

          }
        );

      }
    );
}


// =============================
// RESET HELPERS
// =============================

function reloadAfterReset() {
  window.location.reload();
}


function addResetListener({
  buttonId,
  message,
  reset
}) {
  const button =
    document.getElementById(
      buttonId
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    () => {

      const confirmed =
        window.confirm(
          message
        );


      if (!confirmed) {
        return;
      }


      reset();

      reloadAfterReset();

    }
  );
}


// =============================
// RESET LISTENERS
// =============================

function addResetListeners() {

  // ---------------------------------
  // GLOBAL RESET
  // ---------------------------------

  addResetListener({
    buttonId:
      "reset-all-button",

    message:
      "Reset ALL saved calculator progress?\n\nAchievements, Boss Palmon and Research will all be reset.",

    reset:
      clearAllPlannerState
  });


  // ---------------------------------
  // ACHIEVEMENTS
  // ---------------------------------

  addResetListener({
    buttonId:
      "achievements-reset-button",

    message:
      "Reset all Achievement progress, UR Tokens and build settings?",

    reset:
      clearAchievementState
  });


  // ---------------------------------
  // BOSS PALMON
  // ---------------------------------

  addResetListener({
    buttonId:
      "boss-palmon-reset-button",

    message:
      "Reset all Boss Palmon progress?",

    reset:
      clearBossPalmonState
  });


  // ---------------------------------
  // RESEARCH
  // ---------------------------------

  addResetListener({
    buttonId:
      "research-reset-all-button",

    message:
      "Reset ALL Research progress?\n\nThis resets every Research tree.",

    reset:
      clearResearchState
  });
}


// =============================
// START APP
// =============================

async function startApp() {

  addNavigationListeners();

  addResetListeners();

  showPage(
    currentPage
  );


  await Promise.all([
    initAchievementSystem(),
    initBossPalmonSystem(),
    initResearchSystem()
  ]);
}


startApp();
