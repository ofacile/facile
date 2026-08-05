document.addEventListener("DOMContentLoaded", () => {
  const widget = document.getElementById("facileRadioWidget");
  const toggle = document.getElementById("facileRadioToggle");
  const panel = document.getElementById("facileRadioPanel");
  const closeBtn = document.getElementById("facileRadioClose");
  const searchForm = document.getElementById("facileRadioSearch");
  const searchInput = document.getElementById("facileRadioQuery");
  const results = document.getElementById("facileRadioResults");
  const audio = document.getElementById("facileRadioAudio");
  const playBtn = document.getElementById("facileRadioPlay");
  const favBtn = document.getElementById("facileRadioFav");
  const homeBtn = document.getElementById("facileRadioHome");
  const volumeToggle = document.getElementById("facileRadioVolumeToggle");
  const volumeRange = document.getElementById("facileRadioVolumeRange");
  const volumeValue = document.getElementById("facileRadioVolumeValue");
  const preset = document.getElementById("facileRadioPreset");
  const radioName = document.getElementById("facileRadioName");
  const radioMeta = document.getElementById("facileRadioMeta");
  const radioLogo = document.getElementById("facileRadioLogo");
  const statusText = document.getElementById("facileRadioStatus");

  if (!widget || !toggle || !panel || !audio || !results) return;

  const API_SERVERS = [
    "https://de1.api.radio-browser.info/json",
    "https://nl1.api.radio-browser.info/json",
    "https://at1.api.radio-browser.info/json"
  ];

  const CACHE_KEY = "facile-radio-cache-v3";
  const FAV_KEY = "facile-radio-favs-v1";
  const LAST_KEY = "facile-radio-last-v1";
  const VOLUME_KEY = "facile-radio-volume-v1";

  let apiBase = API_SERVERS[0];
  let currentStation = null;
  let currentList = [];
  let isPlaying = false;
  let initialized = false;

  function safeText(value, fallback = "") {
    return (value || fallback).toString().trim();
  }

  function stationTitle(station) {
    return safeText(station && station.name, "Emisora sin nombre");
  }

  function stationMeta(station) {
    if (!station) return "Radio online";

    const parts = [
      station.country,
      station.language,
      station.codec ? station.codec.toUpperCase() : "",
      station.bitrate ? station.bitrate + " kbps" : ""
    ].filter(Boolean);

    return parts.join(" · ") || "Radio online";
  }

  function getStreamUrl(station) {
    return (station && (station.url_resolved || station.url)) || "";
  }

  function setStatus(text) {
    if (statusText) statusText.textContent = text;
  }
function clampVolume(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 0.8;
  }

  return Math.min(1, Math.max(0, number));
}

function getSavedVolume() {
  try {
    const saved = localStorage.getItem(VOLUME_KEY);

    if (saved === null) {
      return 0.8;
    }

    return clampVolume(saved);
  } catch (_) {
    return 0.8;
  }
}

function saveVolume(value) {
  try {
    localStorage.setItem(VOLUME_KEY, String(clampVolume(value)));
  } catch (_) {}
}

function getVolumeIcon(value) {
  if (value <= 0) {
    return "🔇";
  }

  if (value < 0.35) {
    return "🔈";
  }

  if (value < 0.72) {
    return "🔉";
  }

  return "🔊";
}

let lastNonZeroVolume = getSavedVolume() || 0.8;

function renderVolume(value, shouldSave = true) {
  const volume = clampVolume(value);

  audio.volume = volume;

  if (volume > 0) {
    lastNonZeroVolume = volume;
  }

  if (volumeRange) {
    volumeRange.value = String(Math.round(volume * 100));
  }

  if (volumeValue) {
    volumeValue.textContent = Math.round(volume * 100) + "%";
  }

  if (volumeToggle) {
    volumeToggle.textContent = getVolumeIcon(volume);
    volumeToggle.setAttribute(
      "aria-label",
      volume > 0 ? "Silenciar radio" : "Restaurar volumen"
    );
  }

  if (shouldSave) {
    saveVolume(volume);
  }
}

function initVolumeControl() {
  renderVolume(getSavedVolume(), false);

  if (volumeRange) {
    volumeRange.addEventListener("input", () => {
      renderVolume(Number(volumeRange.value) / 100, true);
    });
  }

  if (volumeToggle) {
    volumeToggle.addEventListener("click", () => {
      if (audio.volume > 0) {
        renderVolume(0, true);
        return;
      }

      renderVolume(lastNonZeroVolume || 0.8, true);
    });
  }
}
  function saveCache(items) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        savedAt: Date.now(),
        items: items.slice(0, 80)
      }));
    } catch (_) {}
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data.items) ? data.items : [];
    } catch (_) {
      return [];
    }
  }

  function loadFavs() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveFavs(favs) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favs.slice(0, 25)));
    } catch (_) {}
  }

  function isFav(station) {
    if (!station) return false;
    return loadFavs().some((item) => item.stationuuid === station.stationuuid);
  }

  function syncFavButton() {
    if (favBtn) favBtn.textContent = isFav(currentStation) ? "★" : "☆";
  }

  async function fetchWithFallback(path, options = {}) {
    const timeoutMs = options.timeoutMs || 7000;

    for (const server of API_SERVERS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(server + path, {
          cache: "no-store",
          signal: controller.signal
        });

        clearTimeout(timer);

        if (!response.ok) throw new Error("HTTP " + response.status);

        apiBase = server;
        return await response.json();
      } catch (error) {
        clearTimeout(timer);
        console.warn("[FacileRadio] fallo servidor:", server, error);
      }
    }

    throw new Error("No hay servidores de radio disponibles");
  }

  function normalizeStations(items) {
    return (items || [])
      .filter((station) => {
        const url = getStreamUrl(station);
        return station && station.stationuuid && station.name && url && station.lastcheckok === 1;
      })
      .map((station) => ({
        stationuuid: station.stationuuid,
        name: station.name,
        url: station.url,
        url_resolved: station.url_resolved,
        homepage: station.homepage,
        favicon: station.favicon,
        country: station.country,
        language: station.language,
        codec: station.codec,
        bitrate: station.bitrate,
        votes: station.votes || 0,
        clickcount: station.clickcount || 0,
        lastcheckok: station.lastcheckok
      }));
  }

  function clearResults() {
    while (results.firstChild) results.removeChild(results.firstChild);
  }

  function renderStations(items) {
    currentList = items;
    clearResults();

    if (!items.length) {
      const empty = document.createElement("button");
      empty.type = "button";
      empty.className = "facile-radio-loading-row";
      empty.textContent = "No se encontraron emisoras.";
      results.appendChild(empty);
      return;
    }

    items.forEach((station) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "facile-radio-row";

      const logo = document.createElement("span");
      logo.className = "facile-radio-row-logo";

      if (station.favicon) {
        const img = document.createElement("img");
        img.src = station.favicon;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => {
          logo.textContent = "📻";
        };
        logo.appendChild(img);
      } else {
        logo.textContent = "📻";
      }

      const text = document.createElement("span");
      text.className = "facile-radio-row-text";

      const title = document.createElement("strong");
      title.textContent = stationTitle(station);

      const meta = document.createElement("em");
      meta.textContent = stationMeta(station);

      text.appendChild(title);
      text.appendChild(meta);

      row.appendChild(logo);
      row.appendChild(text);

      row.addEventListener("click", () => {
        selectStation(station, true);
      });

      results.appendChild(row);
    });
  }

  function renderPreset(items) {
    if (!preset) return;

    preset.innerHTML = '<option value="">Emisoras destacadas</option>';

    items.slice(0, 20).forEach((station) => {
      const option = document.createElement("option");
      option.value = station.stationuuid;
      option.textContent = stationTitle(station);
      preset.appendChild(option);
    });
  }

  async function reportClick(station) {
    if (!station || !station.stationuuid) return;

    try {
      await fetch(apiBase + "/url/" + encodeURIComponent(station.stationuuid), {
        cache: "no-store",
        keepalive: true
      });
    } catch (_) {}
  }

  function selectStation(station, autoplay) {
    if (!station) return;

    currentStation = station;

    if (radioName) radioName.textContent = stationTitle(station);
    if (radioMeta) radioMeta.textContent = stationMeta(station);

    if (radioLogo) {
      radioLogo.textContent = "";

      if (station.favicon) {
        const img = document.createElement("img");
        img.src = station.favicon;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => {
          radioLogo.textContent = "📻";
        };
        radioLogo.appendChild(img);
      } else {
        radioLogo.textContent = "📻";
      }
    }

    audio.src = getStreamUrl(station);
    audio.load();

    try {
      localStorage.setItem(LAST_KEY, JSON.stringify(station));
    } catch (_) {}

    syncFavButton();
    reportClick(station);

    if (autoplay) playRadio();
  }

  async function playRadio() {
    if (!currentStation && currentList.length) {
      selectStation(currentList[0], false);
    }

    if (!audio.src) return;

    try {
      setStatus("Conectando...");
      await audio.play();
      isPlaying = true;
      if (playBtn) playBtn.textContent = "⏸";
      setStatus("Reproduciendo");
    } catch (error) {
      isPlaying = false;
      if (playBtn) playBtn.textContent = "▶";
      setStatus("No se pudo reproducir");
      console.warn("[FacileRadio] error audio:", error);
    }
  }

  function pauseRadio() {
    audio.pause();
    isPlaying = false;
    if (playBtn) playBtn.textContent = "▶";
    setStatus("Pausado");
  }

  function selectStationFromLastOrFirst(items) {
    try {
      const raw = localStorage.getItem(LAST_KEY);
      if (raw) {
        const last = JSON.parse(raw);
        const found = items.find((item) => item.stationuuid === last.stationuuid);
        selectStation(found || last, false);
        return;
      }
    } catch (_) {}

    if (items.length && !currentStation) {
      selectStation(items[0], false);
    }
  }

  async function loadFeatured(options = {}) {
    const preserveCurrent = options.preserveCurrent === true;
    setStatus("Cargando...");

    const cached = loadCache();
    if (cached.length) {
      renderStations(cached);
      renderPreset(cached);
      if (!preserveCurrent || !currentStation) {
        selectStationFromLastOrFirst(cached);
      }
    }

    try {
      const data = await fetchWithFallback(
        "/stations/search?countrycode=ES&hidebroken=true&order=clickcount&reverse=true&limit=80"
      );

      const stations = normalizeStations(data);
      saveCache(stations);
      renderStations(stations);
      renderPreset(stations);
      if (!preserveCurrent || !currentStation) {
        selectStationFromLastOrFirst(stations);
      }
      setStatus("Con el poder de Radio Browser");
    } catch (error) {
      console.warn("[FacileRadio] usando caché:", error);

      if (!cached.length) {
        clearResults();

        const row = document.createElement("button");
        row.type = "button";
        row.className = "facile-radio-loading-row";
        row.textContent = "No se pudieron cargar emisoras.";
        results.appendChild(row);

        setStatus("Sin conexión");
      }
    }
  }
async function goHomeRadio() {
  if (searchInput) searchInput.value = "";
  if (preset) preset.value = "";

  setStatus("Emisoras destacadas");

  try {
    await loadFeatured({ preserveCurrent: true });
    setStatus("Con el poder de Radio Browser");
  } catch (_) {
    setStatus("No se pudieron cargar destacadas");
  }
}
  async function searchStations(query) {
    setStatus("Buscando...");
    clearResults();

    const loading = document.createElement("button");
    loading.type = "button";
    loading.className = "facile-radio-loading-row";
    loading.textContent = "Buscando emisoras...";
    results.appendChild(loading);

    try {
      const path =
        "/stations/search?hidebroken=true&order=clickcount&reverse=true&limit=80&name=" +
        encodeURIComponent(query);

      const data = await fetchWithFallback(path);
      const stations = normalizeStations(data);

      renderStations(stations);
      renderPreset(stations);
      setStatus("Resultados");
    } catch (error) {
      console.error("[FacileRadio] búsqueda:", error);
      clearResults();

      const row = document.createElement("button");
      row.type = "button";
      row.className = "facile-radio-loading-row";
      row.textContent = "No se pudo buscar ahora.";
      results.appendChild(row);

      setStatus("Error buscando");
    }
  }

  function openRadio() {
    widget.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");

    if (!initialized) {
      initialized = true;
      loadFeatured();
    }
  }

  function closeRadio() {
    widget.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
  }

  toggle.addEventListener("click", () => {
    if (widget.classList.contains("is-open")) {
      closeRadio();
    } else {
      openRadio();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeRadio);
  }
  
  initVolumeControl();
  
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (isPlaying) {
        pauseRadio();
      } else {
        playRadio();
      }
    });
  }
if (homeBtn) {
  homeBtn.addEventListener("click", goHomeRadio);
}
  if (favBtn) {
    favBtn.addEventListener("click", () => {
      if (!currentStation) return;

      const favs = loadFavs();
      const exists = favs.some((item) => item.stationuuid === currentStation.stationuuid);

      const nextFavs = exists
        ? favs.filter((item) => item.stationuuid !== currentStation.stationuuid)
        : [currentStation, ...favs];

      saveFavs(nextFavs);
      syncFavButton();
    });
  }

  if (preset) {
    preset.addEventListener("change", () => {
      const station = currentList.find((item) => item.stationuuid === preset.value);
      if (station) selectStation(station, true);
    });
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const query = searchInput.value.trim();
      if (query) searchStations(query);
    });
  }

  audio.addEventListener("playing", () => {
    isPlaying = true;
    if (playBtn) playBtn.textContent = "⏸";
    setStatus("Reproduciendo");
  });

  audio.addEventListener("pause", () => {
    isPlaying = false;
    if (playBtn) playBtn.textContent = "▶";
  });

  audio.addEventListener("error", () => {
    isPlaying = false;
    if (playBtn) playBtn.textContent = "▶";
    setStatus("Stream no disponible");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeRadio();
  });
});
