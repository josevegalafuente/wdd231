// Helpers
const qs = (sel) => document.querySelector(sel);

// Header: Mobile menu
const menuToggle = qs("#menuToggle");

function setMenu(open) {
  document.body.classList.toggle("nav-open", open);
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.contains("nav-open");
    setMenu(!isOpen);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 850) setMenu(false);
  });
}


// Header: Theme toggle
const themeToggle = qs("#themeToggle");

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  if (themeToggle) themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("tcc-theme", theme);
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark");
    applyTheme(isDark ? "light" : "dark");
  });

// Load saved theme
  (() => {
    const saved = localStorage.getItem("tcc-theme");
    if (saved === "dark" || saved === "light") applyTheme(saved);
  })();
}

// Footer 
const yearEl = qs("#year");
const lastModEl = qs("#lastModified");

if (yearEl) yearEl.textContent = new Date().getFullYear();
if (lastModEl) lastModEl.textContent = document.lastModified;

// Directory Page
const membersEl = qs("#members");
const gridBtn = qs("#gridBtn");
const listBtn = qs("#listBtn");

function setView(view) {
  if (!membersEl || !gridBtn || !listBtn) return;

  const isGrid = view === "grid";
  membersEl.classList.toggle("grid", isGrid);
  membersEl.classList.toggle("list", !isGrid);

  gridBtn.setAttribute("aria-pressed", String(isGrid));
  listBtn.setAttribute("aria-pressed", String(!isGrid));

  localStorage.setItem("directoryView", view);
}

function normalizeLevel(level) {
  const v = String(level || "").toLowerCase();
  if (v === "gold" || v === "silver") return v;
  return "member";
}

function createMemberCard(member) {
  const level = normalizeLevel(member.membership);

  const card = document.createElement("article");
  card.className = "member-card";

  const img = document.createElement("img");
  img.className = "member-img";
  img.src = `images/${member.image}`;
  img.alt = `${member.name} logo or storefront`;
  img.loading = "lazy";

  const body = document.createElement("div");
  body.className = "member-body";

  const name = document.createElement("h2");
  name.className = "member-name";
  name.textContent = member.name;

  const badge = document.createElement("span");
  badge.className = "member-level";
  badge.textContent = level.toUpperCase();

  const address = document.createElement("p");
  address.className = "member-meta";
  address.innerHTML = `<strong>Address:</strong> ${member.address}`;

  const phone = document.createElement("p");
  phone.className = "member-meta";
  phone.innerHTML = `<strong>Phone:</strong> ${member.phone}`;

  const website = document.createElement("p");
  website.className = "member-meta";
  website.innerHTML =
    `<strong>Website:</strong> <a class="member-link" href="${member.website}" target="_blank" rel="noopener">Visit site</a>`;

  body.append(name, badge, address, phone, website);
  card.append(img, body);

  return card;
}

function renderMembers(list) {
  if (!membersEl) return;
  membersEl.innerHTML = "";
  list.forEach((m) => membersEl.appendChild(createMemberCard(m)));
}

async function loadMembersForDirectory() {
  if (!membersEl) return;

  try {
    const res = await fetch("data/members.json");
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    renderMembers(data);
  } catch (err) {
    membersEl.innerHTML = `<p class="member-meta">Sorry, we couldn't load the directory data.</p>`;
    console.error(err);
  }
}

if (membersEl && gridBtn && listBtn) {
  gridBtn.addEventListener("click", () => setView("grid"));
  listBtn.addEventListener("click", () => setView("list"));

  (() => {
    const saved = localStorage.getItem("directoryView");
    setView(saved === "list" ? "list" : "grid");
  })();

  loadMembersForDirectory();
}

// HOME PAGE: WEATHER
const currentTempEl = qs("#currentTemp");
const weatherDescEl = qs("#weatherDesc");
const forecastListEl = qs("#forecastList");

// OpenWeatherMap API Key
const OPENWEATHER_API_KEY = "ff956eaa9ed342f403a5bc1436bb3515";

// Tarija, Bolivia
const WEATHER_CITY_QUERY = "Tarija,BO";
const WEATHER_UNITS = "metric";

function formatTempC(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${Math.round(value)}°C`;
}

function pickThreeDayForecast(list) {
  const byDay = new Map();

  for (const item of list) {
    const dtTxt = item.dt_txt; 
    if (!dtTxt) continue;

    const [dateStr, timeStr] = dtTxt.split(" ");
    if (!dateStr || !timeStr) continue;

    // Prefer noon
    if (timeStr.startsWith("12:00:00") && !byDay.has(dateStr)) {
      byDay.set(dateStr, item);
    }
  }

  if (byDay.size < 3) {
    for (const item of list) {
      const dtTxt = item.dt_txt;
      if (!dtTxt) continue;
      const [dateStr] = dtTxt.split(" ");
      if (!byDay.has(dateStr)) byDay.set(dateStr, item);
      if (byDay.size >= 3) break;
    }
  }

  // skip "today" if present
  const days = Array.from(byDay.keys()).sort();
  const todayStr = new Date().toISOString().slice(0, 10);

  const nextDays = days.filter((d) => d !== todayStr).slice(0, 3);
  return nextDays.map((d) => ({ date: d, entry: byDay.get(d) }));
}

async function loadWeather() {
  if (!currentTempEl || !weatherDescEl || !forecastListEl) return;

  if (!OPENWEATHER_API_KEY) {
    currentTempEl.textContent = "--";
    weatherDescEl.textContent = "Add your OpenWeatherMap API Key in directory.js";
    forecastListEl.innerHTML = "";
    return;
  }

  try {
  // Current weather
    const currentUrl =
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(WEATHER_CITY_QUERY)}&units=${WEATHER_UNITS}&appid=${OPENWEATHER_API_KEY}`;

    const currentRes = await fetch(currentUrl);
    if (!currentRes.ok) throw new Error(`Weather HTTP error: ${currentRes.status}`);
    const currentData = await currentRes.json();

    const temp = currentData?.main?.temp;
    const desc = currentData?.weather?.[0]?.description;

    currentTempEl.textContent = formatTempC(temp);
    weatherDescEl.textContent = desc ? desc : "--";

    // Forecast
    const forecastUrl =
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(WEATHER_CITY_QUERY)}&units=${WEATHER_UNITS}&appid=${OPENWEATHER_API_KEY}`;

    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) throw new Error(`Forecast HTTP error: ${forecastRes.status}`);
    const forecastData = await forecastRes.json();

    const picks = pickThreeDayForecast(forecastData.list || []);

    forecastListEl.innerHTML = "";
    for (const p of picks) {
      const dateObj = new Date(`${p.date}T00:00:00`);
      const label = dateObj.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
      });

      const t = p.entry?.main?.temp;
      const d = p.entry?.weather?.[0]?.description;

      const li = document.createElement("li");
      li.textContent = `${label}: ${formatTempC(t)} — ${d || "—"}`;
      forecastListEl.appendChild(li);
    }
  } catch (err) {
    console.error(err);
    currentTempEl.textContent = "--";
    weatherDescEl.textContent = "Unable to load weather right now.";
    forecastListEl.innerHTML = "";
  }
}

loadWeather();

// Home Page Spotlights
const spotlightsEl = qs("#spotlights");

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadSpotlights() {
  if (!spotlightsEl) return;

  try {
    const res = await fetch("data/members.json");
    if (!res.ok) throw new Error(`Members HTTP error: ${res.status}`);
    const members = await res.json();

    const eligible = members.filter((m) => {
      const lvl = String(m.membership || "").toLowerCase();
      return lvl === "gold" || lvl === "silver";
    });

    const count = eligible.length >= 3 ? 3 : 2;
    const picks = shuffle(eligible).slice(0, count);

    spotlightsEl.innerHTML = "";
    picks.forEach((m) => {
      const card = createMemberCard(m);
      spotlightsEl.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    spotlightsEl.innerHTML = `<p class="member-meta">Sorry, we couldn't load spotlights.</p>`;
  }
}

loadSpotlights();
