/* FACILE - Adaptador estable de temas de la version clasica para la pagina principal V1 */
(function () {
  "use strict";

  var DEFAULT_THEME = "sol";
  var VALID_THEMES = ["sol", "luna", "forest", "sunset", "ocean", "aurora"];
  var STORAGE_KEYS = [
    "theme", "selectedTheme", "facile.theme", "facile.selectedTheme",
    "facileTheme", "facile-theme", "classicTheme", "facile.classic.theme"
  ];

  function validTheme(theme) {
    return VALID_THEMES.indexOf(theme) !== -1;
  }

  function panel() { return document.getElementById("theme-panel"); }
  function menu() { return document.getElementById("theme-menu"); }
  function toggle() { return document.getElementById("theme-toggle"); }

  function setMenuOpen(open) {
    var box = panel();
    var popup = menu();
    var button = toggle();
    if (!box || !popup || !button) return;

    box.classList.toggle("facile-theme-menu-open", open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
    popup.setAttribute("aria-hidden", open ? "false" : "true");
    popup.hidden = false;
  }

  function syncButtons(theme) {
    document.querySelectorAll("#theme-menu .theme-btn[data-theme]").forEach(function (button) {
      var active = validTheme(theme) && button.dataset.theme === theme;
      button.classList.toggle("is-selected", active);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem("facile.theme", theme);
      localStorage.setItem("selectedTheme", theme);
    } catch (error) {}
  }

  function readTheme() {
    var htmlTheme = document.documentElement.getAttribute("data-theme") ||
                    document.documentElement.getAttribute("data-classic-theme");
    if (validTheme(htmlTheme)) return htmlTheme;
    try {
      for (var i = 0; i < STORAGE_KEYS.length; i++) {
        var value = localStorage.getItem(STORAGE_KEYS[i]);
        if (validTheme(value)) return value;
      }
    } catch (error) {}
    return DEFAULT_THEME;
  }

  function applyThemeCompat(theme, persist) {
    if (!validTheme(theme)) return;

    /* Conserva la URL/fondo personalizado mientras se cambia la paleta. */
    var root = document.documentElement;
    var customBackground = root.style.getPropertyValue("--custom-background");

    if (typeof window.applyTheme === "function" && !window.applyTheme.__facileCompatInternal) {
      try { window.applyTheme(theme); } catch (error) {}
    }

    /* Los dos atributos permiten funcionar con la CSS principal y la clasica. */
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-classic-theme", theme);
    if (customBackground) root.style.setProperty("--custom-background", customBackground);

    syncButtons(theme);
    if (persist !== false) saveTheme(theme);
    window.dispatchEvent(new CustomEvent("facilethemechange", { detail: { theme: theme } }));
  }

  function clearSavedTheme() {
    try { STORAGE_KEYS.forEach(function (key) { localStorage.removeItem(key); }); } catch (error) {}
    try { STORAGE_KEYS.forEach(function (key) { sessionStorage.removeItem(key); }); } catch (error) {}
  }

  function removeTheme() {
    clearSavedTheme();
    /* Quitar un tema devuelve la pagina al tema base Sol, sin borrar el fondo personalizado. */
    applyThemeCompat(DEFAULT_THEME, false);
    syncButtons("");
    document.documentElement.removeAttribute("data-classic-theme");
    document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    setMenuOpen(false);
  }

  function addRemoveButton() {
    var popup = menu();
    if (!popup || document.getElementById("facile-remove-theme")) return;
    var button = document.createElement("button");
    button.type = "button";
    button.id = "facile-remove-theme";
    button.className = "theme-btn facile-remove-theme";
    button.textContent = "Quitar tema";
    button.setAttribute("aria-label", "Quitar el tema actual y volver al aspecto original");

    var backgroundHeading = Array.from(popup.querySelectorAll("h4")).find(function (heading) {
      return /fondo/i.test(heading.textContent || "");
    });
    if (backgroundHeading) popup.insertBefore(button, backgroundHeading);
    else popup.appendChild(button);
  }

  function install() {
    var box = panel();
    var popup = menu();
    var openButton = toggle();
    if (!box || !popup || !openButton || box.dataset.facileClassicAdapter === "1") return;
    box.dataset.facileClassicAdapter = "1";
    popup.hidden = false;
    addRemoveButton();
    syncButtons(readTheme());

    openButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setMenuOpen(!box.classList.contains("facile-theme-menu-open"));
    }, true);

    var closeButton = document.getElementById("theme-menu-close");
    if (closeButton) closeButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setMenuOpen(false);
    }, true);

    popup.addEventListener("click", function (event) {
      var themeButton = event.target.closest(".theme-btn[data-theme]");
      var removeButton = event.target.closest("#facile-remove-theme");
      if (themeButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        applyThemeCompat(themeButton.dataset.theme, true);
        return;
      }
      if (removeButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        removeTheme();
      }
    }, true);

    document.addEventListener("click", function (event) {
      if (!box.contains(event.target)) setMenuOpen(false);
    }, true);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenuOpen(false);
    });
  }

  window.facileApplyTheme = applyThemeCompat;
  window.facileRemoveTheme = removeTheme;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
  window.addEventListener("load", install, { once: true });
})();
