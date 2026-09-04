console.log("Achievement Planner loaded!");

const elementSelect = document.getElementById("element");

elementSelect.addEventListener("change", function () {
  console.log("Selected element:", elementSelect.value);
});
