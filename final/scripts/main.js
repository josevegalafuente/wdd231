// Shared utilities
const qs = (sel) => document.querySelector(sel);

// Fisher–Yates shuffle (randomize array order)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Header: Mobile menu
const menuToggle = qs("#menuToggle");

function setMenu(open) {
  document.body.classList.toggle("nav-open", open);
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
}

menuToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.contains("nav-open");
  setMenu(!isOpen);
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 769) setMenu(false);
});

// Footer
const yearEl = qs("#year");
const lastModEl = qs("#lastModified");

if (yearEl) yearEl.textContent = new Date().getFullYear();
if (lastModEl) lastModEl.textContent = document.lastModified;


// FORM timestamp
(function setTimestamp() {
  const ts = qs("#timestamp");
  if (!ts) return;
  ts.value = new Date().toISOString();
})();

// THANKYOU page
(function renderThankYou() {
  const dl = qs("#thanksData");
  if (!dl) return;

  const interestsBlock = qs("#interestsBlock");
  const interestsList = qs("#interestsList");

  const params = new URLSearchParams(window.location.search);

  const fields = [
    ["First Name", params.get("first") || ""],
    ["Last Name", params.get("last") || ""],
    ["Email", params.get("email") || ""],
    ["Mobile", params.get("phone") || ""],
    ["Trail Preference", params.get("trail") || ""],
    ["Notes", params.get("notes") || ""],
    ["Submitted", params.get("timestamp") || ""],
  ];

  dl.innerHTML = fields
    .filter(([, v]) => v.trim() !== "")
    .map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`)
    .join("");

  const savedParam = params.get("savedRoutes") || "";
  const ids = savedParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!ids.length || !interestsBlock || !interestsList) {
    if (interestsBlock) interestsBlock.style.display = "none";
    return;
  }

  interestsList.innerHTML = `<li class="meta">Loading interests...</li>`;

  (async () => {
    try {
      const res = await fetch("data/trails.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const trails = await res.json();

      const names = ids
        .map((id) => trails.find((t) => t.id === id))
        .filter(Boolean)
        .map((t) => t.name);

      if (!names.length) {
        interestsBlock.style.display = "none";
        return;
      }

      interestsList.innerHTML = names
        .map((name) => `<li>${escapeHtml(name)}</li>`)
        .join("");
    } catch (err) {
      console.error(err);
      interestsList.innerHTML = `<li class="meta">Sorry, we couldn't load your interests.</li>`;
    }
  })();
})();


// DATA + Dynamic content index.html
const featuredEl = qs("#featuredTrails");

// Dialog (modal)
const modal = qs("#trailModal");
const modalContent = qs("#modalContent");
const modalClose = qs("#modalClose");

// Favorites in localStorage
const FAV_KEY = "ht-favorites";

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch {
    return [];
  }
}

function setFavorites(list) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

function isFav(id) {
  return getFavorites().includes(id);
}

function toggleFav(id) {
  const favs = getFavorites();
  const updated = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
  setFavorites(updated);
}

function openModal(trail) {
  if (!modal || !modalContent) return;

  // No inline styles, only semantic markup + existing classes
  modalContent.innerHTML = `
    <div class="modal-content">
      <h2 class="modal-title">${escapeHtml(trail.name)}</h2>

      <p class="meta"><strong>Difficulty:</strong> ${escapeHtml(trail.difficulty)}</p>
      <p class="meta"><strong>Distance:</strong> ${trail.distance_km} km • <strong>Time:</strong> ${escapeHtml(trail.time_est)}</p>
      <p class="meta"><strong>Best season:</strong> ${escapeHtml(trail.best_season)}</p>

      <p class="modal-desc">${escapeHtml(trail.description)}</p>

      <p class="badge badge-safe">Safety tip: ${escapeHtml(trail.safety_tip)}</p>
    </div>
  `;

  modal.showModal();
}

modalClose?.addEventListener("click", () => modal?.close());

// Close modal when clicking outside the dialog box
modal?.addEventListener("click", (e) => {
  const rect = modal.getBoundingClientRect();
  const inDialog =
    rect.top <= e.clientY &&
    e.clientY <= rect.bottom &&
    rect.left <= e.clientX &&
    e.clientX <= rect.right;

  if (!inDialog) modal.close();
});

function trailCardHtml(t) {
  const saved = isFav(t.id);

  return `
    <article class="content-card">
      <img src="images/trails/${encodeURI(t.image)}" alt="${escapeHtml(t.name)}" loading="lazy" width="600" height="400">
      <div class="content-card-body">
        <h3 class="content-card-title">${escapeHtml(t.name)}</h3>

        <p class="meta"><strong>Difficulty:</strong> ${escapeHtml(t.difficulty)}</p>
        <p class="meta"><strong>Distance:</strong> ${t.distance_km} km • <strong>Time:</strong> ${escapeHtml(t.time_est)}</p>

        ${t.safe_route ? `<span class="badge badge-safe">Safe Route</span>` : ``}

        <div class="card-actions">
          <button class="action action-primary" type="button" data-view="${escapeHtml(t.id)}">View details</button>
          <button class="action" type="button" data-fav="${escapeHtml(t.id)}">${saved ? "★ Saved" : "☆ Save"}</button>
        </div>
      </div>
    </article>
  `;
}

function pickFeatured(trails, total = 6) {
  const safe = trails.filter((t) => t.safe_route);
  const other = trails.filter((t) => !t.safe_route);

  const safeShuffled = shuffle(safe);
  const otherShuffled = shuffle(other);

  const pickSafeCount = Math.min(4, safeShuffled.length, total);
  const picks = safeShuffled.slice(0, pickSafeCount);

  const remaining = total - picks.length;
  const fillPool = shuffle([...safeShuffled.slice(pickSafeCount), ...otherShuffled]);
  picks.push(...fillPool.slice(0, remaining));

  return picks;
}

async function loadFeaturedTrails() {
  if (!featuredEl) return;

  try {
    const res = await fetch("data/trails.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const trails = await res.json();
    const featured = pickFeatured(trails, 6);

    featuredEl.innerHTML = featured.map(trailCardHtml).join("");

    // Wire up "View details"
    featuredEl.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-view");
        const trail = trails.find((t) => t.id === id);
        if (trail) openModal(trail);
      });
    });

    // Wire up favorites
    featuredEl.querySelectorAll("[data-fav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-fav");
        toggleFav(id);
        btn.textContent = isFav(id) ? "★ Saved" : "☆ Save";
      });
    });
  } catch (err) {
    console.error(err);
    featuredEl.innerHTML = `<p class="meta">Sorry, we couldn't load trail data right now.</p>`;
  }
}

// Init (index.html only)
loadFeaturedTrails();


// Reservations page

(async function renderSavedRoutesOnReservations() {
  const box = document.querySelector("#savedRoutesBox");
  const optionsEl = document.querySelector("#savedRoutesOptions");
  const hiddenEl = document.querySelector("#savedRoutes");

  if (!box || !optionsEl || !hiddenEl) return;

  const favIds = getFavorites();

  // If no favorites
  if (!favIds.length) {
    optionsEl.innerHTML = `
      <p class="meta">
        You don't have any saved routes yet.
        <a class="link" href="trails.html">Browse trails</a> and click “☆ Save”.
      </p>
    `;
    hiddenEl.value = "";
    return;
  }

  try {
    const res = await fetch("data/trails.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const trails = await res.json();

    const savedTrails = trails.filter((t) => favIds.includes(t.id));

    if (!savedTrails.length) {
      optionsEl.innerHTML = `
        <p class="meta">
          Your saved list is empty or unavailable right now.
          <a class="link" href="trails.html">Browse trails</a>.
        </p>
      `;
      hiddenEl.value = "";
      return;
    }

    // Checkbox list 
    optionsEl.innerHTML = savedTrails
      .map((t) => {
        const safeBadge = t.safe_route ? `<span class="badge badge-safe">Safe Route</span>` : "";
        return `
          <label class="field saved-route-item">
            <span class="saved-route-row">
              <input type="checkbox" class="saved-route" value="${escapeHtml(t.id)}" checked>
              <span class="saved-route-text">
                <strong>${escapeHtml(t.name)}</strong>
                <span class="meta saved-route-meta">
                  ${escapeHtml(t.difficulty)} • ${t.distance_km} km • ${escapeHtml(t.time_est)}
                </span>
              </span>
              ${safeBadge}
            </span>
          </label>
        `;
      })
      .join("");

    function syncHidden() {
      const checked = Array.from(document.querySelectorAll(".saved-route:checked")).map((el) => el.value);
      hiddenEl.value = checked.join(",");
    }

    syncHidden();
    optionsEl.addEventListener("change", syncHidden);
  } catch (err) {
    console.error(err);
    optionsEl.innerHTML = `<p class="meta">Sorry, we couldn't load your saved routes right now.</p>`;
    hiddenEl.value = "";
  }
})();
