import {
  initAchievementSystem
} from "./achievements.js";


// =============================
// PAGE NAVIGATION
// =============================

let currentPage =
  "overview";


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


// =============================
// NAVIGATION EVENTS
// =============================

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
// START APP
// =============================

async function startApp() {

  addNavigationListeners();


  showPage(
    currentPage
  );


  await initAchievementSystem();

}


startApp();
