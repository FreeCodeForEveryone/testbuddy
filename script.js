(function () {
  "use strict";

  // Live counter
  var count = 0;
  var countEl = document.getElementById("count");
  document.getElementById("increment").addEventListener("click", function () {
    count += 1;
    countEl.textContent = count;
  });
  document.getElementById("decrement").addEventListener("click", function () {
    count -= 1;
    countEl.textContent = count;
  });

  // Theme toggle with localStorage persistence
  var toggle = document.getElementById("theme-toggle");
  var stored = localStorage.getItem("theme");
  if (stored === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  toggle.addEventListener("click", function () {
    var isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }
  });

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();
})();
