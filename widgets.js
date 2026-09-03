(function(){
  "use strict";

  function ready(callback){
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  function afterPaint(callback){
    window.requestAnimationFrame(function(){
      window.requestAnimationFrame(callback);
    });
  }

  function idle(callback, timeout){
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: timeout || 1200 });
      return;
    }
    window.setTimeout(callback, Math.min(timeout || 1200, 700));
  }

  ready(function(){
    afterPaint(initWidgets);
  });

  function initWidgets(){
    const container = document.getElementById("widgets-container");
    if (!container || container.dataset.facileWidgetsReady === "1") return;
    container.dataset.facileWidgetsReady = "1";

    const mobileMenu = document.querySelector(".mobile-menu-native");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const desktopQuery = window.matchMedia("(min-width: 768px)");

    let barVisible = true;
    let clockTimer = 0;
    let dateTimer = 0;
    let iconCache = null;

    function isMobile(){
      return mobileQuery.matches;
    }

    function menuOpen(){
      return !!(mobileMenu && mobileMenu.open);
    }

    function canRunTimers(){
      return !document.hidden && !menuOpen() && barVisible;
    }

    function syncMobileMenuState(){
      document.body.classList.toggle("facile-mobile-menu-open", menuOpen());
    }

    if (mobileMenu) {
      mobileMenu.addEventListener("toggle", function(){
        syncMobileMenuState();
        resumeTimers();
      }, { passive: true });
      syncMobileMenuState();
    }

    function closeMobileMenuOnDesktop(){
      if (desktopQuery.matches && mobileMenu && mobileMenu.open) {
        mobileMenu.open = false;
        syncMobileMenuState();
      }
    }

    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", closeMobileMenuOnDesktop);
      mobileQuery.addEventListener("change", resumeTimers);
    } else if (desktopQuery.addListener) {
      desktopQuery.addListener(closeMobileMenuOnDesktop);
      mobileQuery.addListener(resumeTimers);
    }

    closeMobileMenuOnDesktop();

    const oldBar = container.querySelector(".widgets-bar");
    if (oldBar) oldBar.remove();

    const bar = document.createElement("div");
    bar.className = "widgets-bar";
    bar.setAttribute("aria-label", "Widgets rápidos");

    const fragment = document.createDocumentFragment();

    const dateWidget = document.createElement("a");
    dateWidget.className = "widget-box facile-info-widget facile-date-widget";
    dateWidget.href = "https://bcalendar.com/new";
    dateWidget.target = "_blank";
    dateWidget.rel = "noopener noreferrer";
    dateWidget.setAttribute("aria-label", "Abrir calendario");
    fragment.appendChild(dateWidget);

    const clockWidget = document.createElement("a");
    clockWidget.className = "widget-box facile-info-widget facile-clock-widget";
    clockWidget.href = "https://reloj-alarma.es";
    clockWidget.target = "_blank";
    clockWidget.rel = "noopener noreferrer";
    clockWidget.setAttribute("aria-label", "Reloj y alarma");
    fragment.appendChild(clockWidget);

    const SEARCH_ENGINES = {
      google: {
        label: "Google",
        action: "https://www.google.com/search",
        param: "q",
        placeholder: "Buscar en Google...",
        badge: "G",
        icon: "https://play-lh.googleusercontent.com/xqk8hd6dMyffxE6iQa59cUt75EA-0YDvjnJlxH4z8W63-e5KwaWXbrNob6Q-OoH5SSDa78Y0I0YA3BB0zDVnB8w=w240-h480-rw"
      },
      bing: {
        label: "Bing",
        action: "https://www.bing.com/search",
        param: "q",
        placeholder: "Buscar en Bing...",
        badge: "B",
        icon: "https://play-lh.googleusercontent.com/QRIZ4daMDMSMar3I4RRdR4WeZrBGZ6GhKCi67iWJIIggplWjckmizIvOejreclDC4w"
      },
      startpage: {
        label: "Startpage",
        action: "https://www.startpage.com/sp/search",
        param: "query",
        placeholder: "Buscar en Startpage...",
        badge: "S",
        icon: "https://www.startpage.com/startpageblog/wp-content/uploads/2021/05/linkedin-profile-image.png"
      },
      duckduckgo: {
        label: "DuckDuckGo",
        action: "https://duckduckgo.com/",
        param: "q",
        placeholder: "Buscar en DuckDuckGo...",
        badge: "D",
        icon: "https://play-lh.googleusercontent.com/NW2ASwJ4qtxfThhVIpm4641sR4o-yGv80yqaJnOnpC4lEmdxEcNTFcF6-TlZYtmdaA=w240-h480"
      },
      brave: {
        label: "Brave Search",
        action: "https://search.brave.com/search",
        param: "q",
        placeholder: "Buscar en Brave Search...",
        badge: "B",
        icon: "https://play-lh.googleusercontent.com/I1foi2Irrv7tW9ee9kgP0wfnMzaVb6y17muvpKsFcUrKYsDlmCyWuTRh5m93KJZ24dY"
      },
      yahoo: {
        label: "Yahoo",
        action: "https://search.yahoo.com/search",
        param: "p",
        placeholder: "Buscar en Yahoo...",
        badge: "Y",
        icon: "https://play-lh.googleusercontent.com/xWZvkiGh8swIP2th1KT_Nf5skmDoC0a8v2oE6kJq-zP5FVm1Gr643ITaEwcdR3KLZqc"
      }
    };

    const searchWidget = document.createElement("div");
    searchWidget.className = "widget-box facile-search-widget";

    const form = document.createElement("form");
    form.id = "facileSearchForm";
    form.className = "facile-search-form";
    form.method = "get";
    form.target = "_blank";
    form.autocomplete = "off";

    const engineWrap = document.createElement("div");
    engineWrap.className = "facile-search-engine-wrap";

    const badge = document.createElement("span");
    badge.id = "facileSearchBadge";
    badge.className = "facile-search-engine-badge";
    badge.setAttribute("aria-hidden", "true");

    const select = document.createElement("select");
    select.id = "facileSearchEngine";
    select.className = "facile-search-engine";
    select.setAttribute("aria-label", "Seleccionar buscador");

    Object.keys(SEARCH_ENGINES).forEach(function(key){
      const option = document.createElement("option");
      option.value = key;
      option.textContent = SEARCH_ENGINES[key].label;
      select.appendChild(option);
    });

    const input = document.createElement("input");
    input.id = "facileSearchInput";
    input.className = "facile-search-input";
    input.type = "text";
    input.placeholder = "Buscar...";
    input.setAttribute("aria-label", "Buscar");
    input.required = true;

    const inputWrap = document.createElement("div");
    inputWrap.className = "facile-search-input-wrap";

    const clearButton = document.createElement("button");
    clearButton.id = "facileSearchClear";
    clearButton.className = "facile-search-clear";
    clearButton.type = "button";
    clearButton.hidden = true;
    clearButton.setAttribute("aria-label", "Borrar busqueda");
    clearButton.setAttribute("title", "Borrar busqueda");
    clearButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path d="M6 6l12 12"></path>' +
        '<path d="M18 6L6 18"></path>' +
      '</svg>';

    const submit = document.createElement("button");
    submit.id = "facileSearchSubmit";
    submit.className = "facile-search-submit";
    submit.type = "submit";
    submit.textContent = "Buscar";

    inputWrap.appendChild(input);
    inputWrap.appendChild(clearButton);
    engineWrap.appendChild(badge);
    engineWrap.appendChild(select);
    form.appendChild(engineWrap);
    form.appendChild(inputWrap);
    form.appendChild(submit);
    searchWidget.appendChild(form);
    fragment.appendChild(searchWidget);

    bar.appendChild(fragment);
    container.replaceChildren(bar);

    function normalize(text){
      return (text || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
    }

    function buildIconCache(){
      const cache = Object.create(null);
      document.querySelectorAll("#buscadores img").forEach(function(img){
        const key = normalize(img.getAttribute("alt"));
        if (!key || cache[key]) return;
        cache[key] = img.currentSrc || img.src || "";
      });
      iconCache = cache;
    }

    function findIcon(engineKey){
      if (!iconCache) return "";
      const aliases = {
        google: "google",
        bing: "bing",
        startpage: "startpage",
        duckduckgo: "duckduckgo",
        brave: "brave",
        yahoo: "yahoo"
      };
      const engine = SEARCH_ENGINES[engineKey] || SEARCH_ENGINES.google;
      return iconCache[normalize(aliases[engineKey] || engineKey)] || engine.icon || "";
    }

    function setBadge(engineKey, allowIcon){
      const engine = SEARCH_ENGINES[engineKey] || SEARCH_ENGINES.google;
      badge.replaceChildren();
      const iconSrc = allowIcon ? findIcon(engineKey) : "";
      if (iconSrc) {
        const icon = document.createElement("img");
        icon.src = iconSrc;
        icon.alt = "";
        icon.loading = "lazy";
        icon.decoding = "async";
        badge.appendChild(icon);
      } else {
        badge.textContent = engine.badge;
      }
      badge.setAttribute("data-engine", engineKey);
    }

    function syncSearchEngine(engineKey, options){
      const engine = SEARCH_ENGINES[engineKey] || SEARCH_ENGINES.google;
      const useIcon = !!(options && options.useIcon);
      form.action = engine.action;
      form.setAttribute("data-engine", engineKey);
      input.name = engine.param;
      input.placeholder = engine.placeholder;
      input.setAttribute("aria-label", engine.placeholder);
      select.value = engineKey;
      setBadge(engineKey, useIcon);
      try {
        localStorage.setItem("facileSearchEngine", engineKey);
      } catch (_) {}
    }

    function updateDate(){
      const now = new Date();
      dateWidget.textContent = "📅 " + now.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
    }

    function scheduleDate(){
      if (dateTimer) window.clearTimeout(dateTimer);
      dateTimer = 0;
      if (!canRunTimers()) return;
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0, 0);
      dateTimer = window.setTimeout(function(){
        updateDate();
        scheduleDate();
      }, Math.max(60000, tomorrow.getTime() - now.getTime()));
    }

    function updateClock(){
      const now = new Date();
      clockWidget.textContent = "🕒 " + now.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: isMobile() ? undefined : "2-digit"
      });
    }

    function scheduleClock(){
      if (clockTimer) window.clearTimeout(clockTimer);
      clockTimer = 0;
      if (!canRunTimers()) return;
      const now = new Date();
      const delay = isMobile()
        ? 60000 - (now.getSeconds() * 1000 + now.getMilliseconds())
        : 1000 - now.getMilliseconds();
      clockTimer = window.setTimeout(function(){
        updateClock();
        scheduleClock();
      }, Math.max(isMobile() ? 1000 : 250, delay));
    }

    function clearTimers(){
      if (clockTimer) window.clearTimeout(clockTimer);
      if (dateTimer) window.clearTimeout(dateTimer);
      clockTimer = 0;
      dateTimer = 0;
    }

    function resumeTimers(){
      clearTimers();
      if (!canRunTimers()) return;
      updateClock();
      updateDate();
      scheduleClock();
      scheduleDate();
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          barVisible = entry.isIntersecting;
          resumeTimers();
        });
      }, { rootMargin: "180px 0px" });
      observer.observe(bar);
    }

    document.addEventListener("visibilitychange", resumeTimers, { passive: true });

    function syncClearButton(){
      const hasText = input.value.length > 0;
      clearButton.hidden = !hasText;
      clearButton.setAttribute("aria-hidden", hasText ? "false" : "true");
      inputWrap.classList.toggle("has-text", hasText);
    }

    input.addEventListener("input", syncClearButton);
    input.addEventListener("search", syncClearButton);

    clearButton.addEventListener("click", function(event){
      event.preventDefault();
      event.stopPropagation();
      input.value = "";
      syncClearButton();
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    select.addEventListener("change", function(){
      syncSearchEngine(select.value, { useIcon: true });
      if (!isMobile()) input.focus();
    });

    const savedEngine = (() => {
      try { return localStorage.getItem("facileSearchEngine") || "google"; }
      catch (_) { return "google"; }
    })();

    syncSearchEngine(savedEngine, { useIcon: false });
    syncClearButton();
    updateClock();
    updateDate();
    resumeTimers();

    idle(function(){
      buildIconCache();
      syncSearchEngine(select.value, { useIcon: true });
    }, 1600);
  }
})();

/* FACILE WEATHER - INTRO PARA BUSCAR CIUDAD V1 */
(function(){
  "use strict";

  if (window.__facileWeatherEnterReady) return;
  window.__facileWeatherEnterReady = true;

  document.addEventListener("keydown", function(event){
    const input = event.target;

    if (!input || input.id !== "city-input" || event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const city = input.value.trim();
    if (!city) {
      input.focus();
      return;
    }

    const weatherWidget = input.closest("#weather-widget");
    const searchButton = weatherWidget
      ? weatherWidget.querySelector("button")
      : null;

    if (searchButton && !searchButton.disabled) {
      searchButton.click();
    }
  });
})();

/* FACILE PAGE FAVORITES V1 */
(function(){
  "use strict";

  const STORAGE_KEY = "facilePageFavoritesV1";
  const MAX_FAVORITES = 24;

  function ready(callback){
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  function loadFavorites(){
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data.slice(0, MAX_FAVORITES) : [];
    } catch (error) {
      return [];
    }
  }

  function saveFavorites(items){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_FAVORITES)));
      return true;
    } catch (error) {
      return false;
    }
  }

  function normalizeUrl(value){
    let candidate = String(value || "").trim();
    if (!candidate) return "";
    if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
      candidate = "https://" + candidate;
    }
    try {
      const url = new URL(candidate);
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      return url.href;
    } catch (error) {
      return "";
    }
  }

  function makeId(){
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "fav-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function domainLabel(url){
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (error) {
      return "Página favorita";
    }
  }

  ready(function(){
    const host = document.getElementById("facileFavoritesApp");
    if (!host || host.dataset.ready === "1") return;
    host.dataset.ready = "1";

    const header = document.createElement("div");
    header.className = "facile-favorites-header";

    const headingWrap = document.createElement("div");
    headingWrap.className = "facile-favorites-heading";

    const title = document.createElement("h2");
    title.id = "facileFavoritesTitle";
    title.textContent = "Mis páginas favoritas";

    const count = document.createElement("span");
    count.className = "facile-favorites-count";
    count.setAttribute("aria-live", "polite");

    headingWrap.append(title, count);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "facile-favorites-add-toggle";
    toggle.textContent = "Añadir página";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "facileFavoritesForm");

    header.append(headingWrap, toggle);

    const form = document.createElement("form");
    form.id = "facileFavoritesForm";
    form.className = "facile-favorites-form";
    form.hidden = true;
    form.autocomplete = "off";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "facile-favorites-name";
    nameInput.placeholder = "Nombre de la página";
    nameInput.maxLength = 48;
    nameInput.setAttribute("aria-label", "Nombre de la página favorita");

    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.className = "facile-favorites-url";
    urlInput.placeholder = "https://ejemplo.com";
    urlInput.inputMode = "url";
    urlInput.setAttribute("aria-label", "Dirección de la página favorita");
    urlInput.required = true;

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.className = "facile-favorites-save";
    saveButton.textContent = "Guardar";

    const message = document.createElement("p");
    message.className = "facile-favorites-message";
    message.setAttribute("aria-live", "polite");

    form.append(nameInput, urlInput, saveButton, message);

    const list = document.createElement("div");
    list.className = "facile-favorites-list";
    list.setAttribute("role", "list");

    const empty = document.createElement("p");
    empty.className = "facile-favorites-empty";
    empty.textContent = "Todavía no hay páginas guardadas. Añade tus accesos habituales aquí.";

    host.append(header, form, list, empty);

    let favorites = loadFavorites();

    function setMessage(text, isError){
      message.textContent = text || "";
      message.classList.toggle("is-error", !!isError);
    }

    function render(){
      const fragment = document.createDocumentFragment();
      favorites.forEach(function(item){
        const card = document.createElement("div");
        card.className = "facile-favorite-card";
        card.setAttribute("role", "listitem");

        const link = document.createElement("a");
        link.className = "facile-favorite-link";
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.title = item.name + " · " + item.url;

        const icon = document.createElement("span");
        icon.className = "facile-favorite-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = (item.name || domainLabel(item.url)).trim().charAt(0).toUpperCase() || "★";

        const text = document.createElement("span");
        text.className = "facile-favorite-text";

        const strong = document.createElement("strong");
        strong.textContent = item.name;

        const small = document.createElement("small");
        small.textContent = domainLabel(item.url);

        text.append(strong, small);
        link.append(icon, text);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "facile-favorite-remove";
        remove.textContent = "×";
        remove.dataset.favoriteId = item.id;
        remove.setAttribute("aria-label", "Eliminar " + item.name + " de favoritas");
        remove.title = "Eliminar";

        card.append(link, remove);
        fragment.appendChild(card);
      });

      list.replaceChildren(fragment);
      empty.hidden = favorites.length > 0;
      count.textContent = favorites.length + "/" + MAX_FAVORITES;
    }

    toggle.addEventListener("click", function(){
      const willOpen = form.hidden;
      form.hidden = !willOpen;
      toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
      toggle.textContent = willOpen ? "Cerrar" : "Añadir página";
      setMessage("");
      if (willOpen) nameInput.focus();
    });

    form.addEventListener("submit", function(event){
      event.preventDefault();
      const url = normalizeUrl(urlInput.value);
      if (!url) {
        setMessage("Escribe una dirección web válida.", true);
        urlInput.focus();
        return;
      }
      if (favorites.length >= MAX_FAVORITES) {
        setMessage("Has alcanzado el límite de " + MAX_FAVORITES + " páginas.", true);
        return;
      }
      if (favorites.some(function(item){ return item.url === url; })) {
        setMessage("Esa página ya está guardada.", true);
        return;
      }

      const name = nameInput.value.trim() || domainLabel(url);
      favorites.unshift({ id: makeId(), name: name.slice(0, 48), url: url });
      if (!saveFavorites(favorites)) {
        favorites.shift();
        setMessage("El navegador no permite guardar datos para esta página.", true);
        return;
      }

      form.reset();
      setMessage("Página guardada.", false);
      render();
      nameInput.focus();
    });

    list.addEventListener("click", function(event){
      const button = event.target.closest(".facile-favorite-remove");
      if (!button) return;
      const id = button.dataset.favoriteId;
      favorites = favorites.filter(function(item){ return item.id !== id; });
      saveFavorites(favorites);
      render();
    });

    window.addEventListener("storage", function(event){
      if (event.key !== STORAGE_KEY) return;
      favorites = loadFavorites();
      render();
    });

    render();
  });
})();

