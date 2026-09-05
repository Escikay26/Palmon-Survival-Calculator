import {
  initAchievementSystem
} from "./achievements.js";

import {
  initBossPalmonSystem
} from "./boss-palmon.js";

let currentPage = "overview";

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

  currentPage = pageName;

  document
    .querySelectorAll(".app-page")
    .forEach(page => {
      page.classList.remove(
        "active"
      );
    });

  document
    .querySelectorAll(".nav-button")
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
    .querySelectorAll(".nav-button")
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

async function startApp() {
  addNavigationListeners();
  showPage(currentPage);

  await Promise.all([
    initAchievementSystem(),
    initBossPalmonSystem()
  ]);
}

startApp();
