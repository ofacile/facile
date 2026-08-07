/* =========================================================
   FACILE CLASICO - temas.js
   Sistema de temas propio para la pagina clasica.
   - No depende del temas.js moderno.
   - Controla apertura/cierre del panel.
   - Cierra radio al abrir temas.
   - Mantiene fondos personalizados por URL o archivo local.
========================================================= */
(function () {
  "use strict";

  const THEME_KEY = "facile-classic-theme-v1";
  const BG_KEY = "facile-classic-custom-bg-v1";
  const DEFAULT_THEME = "sol";

  const THEMES = {
    sol: {
      name: "Clasico 98",
      vars: {
        "--facile-brown": "#af783a",
        "--facile-brown-dark": "#6f431f",
        "--facile-brown-mid": "#9f6632",
        "--facile-brown-light": "#d9ad75",
        "--facile-desktop": "#0b7676",
        "--facile-window": "#d6d0c4",
        "--facile-window-soft": "#eee8dc",
        "--facile-window-light": "#ffffff",
        "--facile-window-shadow": "#8b8172",
        "--facile-window-dark": "#3a3028",
        "--facile-text": "#16110c",
        "--facile-muted-text": "#2f261d",
        "--facile-link": "#003399",
        "--facile-link-visited": "#5b287a",
        "--facile-accent-blue": "#0b4f9c",
        "--primary-color": "#9f6632",
        "--secondary-color": "#0b4f9c",
        "--glass-bg": "rgba(214,208,196,0.94)"
      }
    },
    luna: {
      name: "Fosforo CRT",
      vars: {
        "--facile-brown": "#274f34",
        "--facile-brown-dark": "#0f2418",
        "--facile-brown-mid": "#1f6d35",
        "--facile-brown-light": "#5aa06a",
        "--facile-desktop": "#07140b",
        "--facile-window": "#c9d6c3",
        "--facile-window-soft": "#e8f1df",
        "--facile-window-shadow": "#6f8068",
        "--facile-window-dark": "#192216",
        "--facile-text": "#0b180c",
        "--facile-muted-text": "#203020",
        "--facile-link": "#006b1b",
        "--facile-link-visited": "#375c1a",
        "--facile-accent-blue": "#167a31",
        "--primary-color": "#1f6d35",
        "--secondary-color": "#103d1f",
        "--glass-bg": "rgba(201,214,195,0.94)"
      }
    },
    forest: {
      name: "Windows NT",
      vars: {
        "--facile-brown": "#5b6f8f",
        "--facile-brown-dark": "#24344c",
        "--facile-brown-mid": "#3e5c83",
        "--facile-brown-light": "#9aacbf",
        "--facile-desktop": "#26445f",
        "--facile-window": "#c8ced8",
        "--facile-window-soft": "#edf1f6",
        "--facile-window-shadow": "#788394",
        "--facile-window-dark": "#202b3b",
        "--facile-text": "#101923",
        "--facile-muted-text": "#263447",
        "--facile-link": "#003f91",
        "--facile-link-visited": "#563f8f",
        "--facile-accent-blue": "#0b4f9c",
        "--primary-color": "#3e5c83",
        "--secondary-color": "#0b4f9c",
        "--glass-bg": "rgba(200,206,216,0.94)"
      }
    },
    sunset: {
      name: "Y2K Morado",
      vars: {
        "--facile-brown": "#8a5aa8",
        "--facile-brown-dark": "#432252",
        "--facile-brown-mid": "#74409b",
        "--facile-brown-light": "#c79bd8",
        "--facile-desktop": "#422b5e",
        "--facile-window": "#d7c9df",
        "--facile-window-soft": "#f1e8f7",
        "--facile-window-shadow": "#8a7894",
        "--facile-window-dark": "#302038",
        "--facile-text": "#170d1d",
        "--facile-muted-text": "#392643",
        "--facile-link": "#4b14b8",
        "--facile-link-visited": "#7a217c",
        "--facile-accent-blue": "#5b3df0",
        "--primary-color": "#74409b",
        "--secondary-color": "#5b3df0",
        "--glass-bg": "rgba(215,201,223,0.94)"
      }
    },
    ocean: {
      name: "MS-DOS",
      vars: {
        "--facile-brown": "#1f1f1f",
        "--facile-brown-dark": "#050505",
        "--facile-brown-mid": "#2b2b2b",
        "--facile-brown-light": "#5a5a5a",
        "--facile-desktop": "#000000",
        "--facile-window": "#c0c0c0",
        "--facile-window-soft": "#e8e8e8",
        "--facile-window-shadow": "#707070",
        "--facile-window-dark": "#101010",
        "--facile-text": "#050505",
        "--facile-muted-text": "#202020",
        "--facile-link": "#0000aa",
        "--facile-link-visited": "#550088",
        "--facile-accent-blue": "#000080",
        "--primary-color": "#202020",
        "--secondary-color": "#000080",
        "--glass-bg": "rgba(192,192,192,0.96)"
      }
    },
    aurora: {
      name: "Arcade Rojo",
      vars: {
        "--facile-brown": "#a83b32",
        "--facile-brown-dark": "#5a1410",
        "--facile-brown-mid": "#8d291f",
        "--facile-brown-light": "#e28b72",
        "--facile-desktop": "#4a1714",
        "--facile-window": "#d8c8bf",
        "--facile-window-soft": "#f4e8df",
        "--facile-window-shadow": "#8b746b",
        "--facile-window-dark": "#361714",
        "--facile-text": "#1c0705",
        "--facile-muted-text": "#3d1b17",
        "--facile-link": "#b00016",
        "--facile-link-visited": "#7b1648",
        "--facile-accent-blue": "#a01222",
        "--primary-color": "#8d291f",
        "--secondary-color": "#a01222",
        "--glass-bg": "rgba(216,200,191,0.94)"
      }
    }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function safeLocalGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeLocalSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function safeLocalRemove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  }

  function cssUrl(value) {
    if (!value) return "none";
    return "url(\"" + String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\")";
  }

  function normalizeBackgroundUrl(value) {
    const url = String(value || "").trim();
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (/^data:image\//i.test(url)) return url;
    return "";
  }

  function setActiveButton(themeKey) {
    document.querySelectorAll(".theme-btn[data-theme]").forEach(function (button) {
      const active = button.getAttribute("data-theme") === themeKey;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applyTheme(themeKey, backgroundValue) {
    const key = THEMES[themeKey] ? themeKey : DEFAULT_THEME;
    const theme = THEMES[key];
    const root = document.documentElement;

    Object.keys(theme.vars).forEach(function (name) {
      root.style.setProperty(name, theme.vars[name]);
    });

    document.documentElement.setAttribute("data-classic-theme", key);
    document.body && document.body.setAttribute("data-classic-theme", key);
    safeLocalSet(THEME_KEY, key);
    setActiveButton(key);

    if (typeof backgroundValue !== "undefined") {
      const normalized = backgroundValue === null ? "" : normalizeBackgroundUrl(backgroundValue);
      if (normalized) {
        root.style.setProperty("--custom-background", cssUrl(normalized));
        safeLocalSet(BG_KEY, normalized);
      } else {
        root.style.setProperty("--custom-background", "none");
        safeLocalRemove(BG_KEY);
      }
      return;
    }

    const savedBackground = safeLocalGet(BG_KEY);
    root.style.setProperty("--custom-background", savedBackground ? cssUrl(savedBackground) : "none");
  }

  function closeRadioIfOpen() {
    const radioWidget = $("facileRadioWidget");
    const radioToggle = $("facileRadioToggle");
    const radioPanel = $("facileRadioPanel");
    if (radioWidget) radioWidget.classList.remove("is-open");
    if (radioToggle) radioToggle.setAttribute("aria-expanded", "false");
    if (radioPanel) radioPanel.setAttribute("aria-hidden", "true");
  }

  function openThemeMenu() {
    const panel = $("theme-panel");
    const toggle = $("theme-toggle");
    const menu = $("theme-menu");
    if (!panel || !toggle || !menu) return;
    closeRadioIfOpen();
    panel.classList.add("facile-theme-menu-open", "is-open");
    menu.hidden = false;
    menu.style.display = "block";
    menu.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeThemeMenu() {
    const panel = $("theme-panel");
    const toggle = $("theme-toggle");
    const menu = $("theme-menu");
    if (!panel || !toggle || !menu) return;
    panel.classList.remove("facile-theme-menu-open", "is-open");
    menu.setAttribute("aria-hidden", "true");
    menu.style.display = "none";
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  function toggleThemeMenu(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    }
    const panel = $("theme-panel");
    if (panel && panel.classList.contains("facile-theme-menu-open")) closeThemeMenu();
    else openThemeMenu();
  }

  function applyCustomBackground() {
    const input = $("bg-url");
    const url = normalizeBackgroundUrl(input ? input.value : "");
    if (!url) {
      alert("Pega una URL de imagen valida que empiece por http://, https:// o data:image/.");
      return;
    }
    applyTheme(safeLocalGet(THEME_KEY) || DEFAULT_THEME, url);
    if (input) input.value = url;
  }

  function clearCustomBackground() {
    applyTheme(safeLocalGet(THEME_KEY) || DEFAULT_THEME, null);
    const input = $("bg-url");
    if (input) input.value = "";
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error || new Error("No se pudo leer la imagen")); };
      reader.readAsDataURL(file);
    });
  }

  function wireFileBackground() {
    const button = $("bg-file-button");
    const input = $("bg-file-input");
    if (!button || !input) return;
    button.addEventListener("click", function (event) {
      event.preventDefault();
      input.click();
    });
    input.addEventListener("change", async function () {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!/^image\//i.test(file.type)) {
        alert("El archivo seleccionado no parece una imagen.");
        input.value = "";
        return;
      }
      if (file.size > 4.5 * 1024 * 1024) {
        alert("La imagen es demasiado grande para guardarla en este navegador. Prueba con una imagen mas ligera.");
        input.value = "";
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        applyTheme(safeLocalGet(THEME_KEY) || DEFAULT_THEME, dataUrl);
        const urlInput = $("bg-url");
        if (urlInput) urlInput.value = "";
      } catch (error) {
        console.warn("[Facile clasico temas]", error);
        alert("No se pudo aplicar la imagen seleccionada.");
      } finally {
        input.value = "";
      }
    });
  }

  function wireThemeMenu() {
    const panel = $("theme-panel");
    const toggle = $("theme-toggle");
    const close = $("theme-menu-close");
    const menu = $("theme-menu");
    if (!panel || !toggle || !menu) return;

    // Initial closed state.
    closeThemeMenu();

    // Capture phase intentionally defeats old inline handlers or imported handlers.
    toggle.addEventListener("click", toggleThemeMenu, true);
    if (close) {
      close.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        closeThemeMenu();
      }, true);
    }

    document.addEventListener("click", function (event) {
      if (!panel.classList.contains("facile-theme-menu-open")) return;
      if (panel.contains(event.target)) return;
      closeThemeMenu();
    }, true);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeThemeMenu();
    });

    document.querySelectorAll(".theme-btn[data-theme]").forEach(function (button) {
      button.addEventListener("click", function () {
        const key = button.getAttribute("data-theme") || DEFAULT_THEME;
        applyTheme(key);
      });
    });
  }

  function restoreInputs() {
    const bg = safeLocalGet(BG_KEY);
    const input = $("bg-url");
    if (input && bg && /^https?:\/\//i.test(bg)) input.value = bg;
  }

  function init() {
    window.facileClassicThemes = THEMES;
    window.applyTheme = applyTheme;
    window.applyCustomBackground = applyCustomBackground;
    window.clearCustomBackground = clearCustomBackground;
    applyTheme(safeLocalGet(THEME_KEY) || DEFAULT_THEME);
    restoreInputs();
    wireThemeMenu();
    wireFileBackground();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
