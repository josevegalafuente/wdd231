// =====================
// Shared utilities
// =====================
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

// =====================
// Header: Mobile menu
// =====================
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

// =====================
// Footer info
// =====================
const yearEl = qs("#year");
const lastModEl = qs("#lastModified");

if (yearEl) yearEl.textContent = new Date().getFullYear();
if (lastModEl) lastModEl.textContent = document.lastModified;

// =====================
// FORM timestamp (reservations.html)
// =====================
(function setTimestamp() {
  const ts = qs("#timestamp");
  if (!ts) return;
  ts.value = new Date().toISOString();
})();

// =====================
// THANKYOU page: read query params + render (now includes Interests)
// =====================
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
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`)
    .join("");

  // Interests (from savedRoutes param)
  const savedParam = params.get("savedRoutes") || "";
  const ids = savedParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Hide if there are no selected saved routes
  if (!ids.length || !interestsBlock || !interestsList) {
    if (interestsBlock) interestsBlock.style.display = "none";
    return;
  }

  // Render loading state immediately
  interestsList.innerHTML = `<li class="meta">Loading interests...</li>`;

  // Fetch trails and map IDs to names
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





function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =====================
// DATA + Dynamic content (index.html)
// =====================
const featuredEl = qs("#featuredTrails");

// Modal (dialog)
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

  modalContent.innerHTML = `
    <div style="padding: 0 1rem 1rem;">
      <h2 style="margin:.25rem 0 0.25rem;">${escapeHtml(trail.name)}</h2>
      <p class="meta"><strong>Difficulty:</strong> ${escapeHtml(trail.difficulty)}</p>
      <p class="meta"><strong>Distance:</strong> ${trail.distance_km} km • <strong>Time:</strong> ${escapeHtml(trail.time_est)}</p>
      <p class="meta"><strong>Best season:</strong> ${escapeHtml(trail.best_season)}</p>
      <p style="margin:.6rem 0 0;">${escapeHtml(trail.description)}</p>
      <p class="tag tag-safe" style="margin-top:.75rem;">Safety tip: ${escapeHtml(trail.safety_tip)}</p>
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
    <article class="card">
      <img src="images/trails/${encodeURI(t.image)}" alt="${escapeHtml(t.name)}" loading="lazy" width="600" height="400">
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(t.name)}</h3>
        <p class="meta"><strong>Difficulty:</strong> ${escapeHtml(t.difficulty)}</p>
        <p class="meta"><strong>Distance:</strong> ${t.distance_km} km • <strong>Time:</strong> ${escapeHtml(t.time_est)}</p>
        ${t.safe_route ? `<span class="tag tag-safe">Safe Route</span>` : ``}

        <div style="margin-top:.8rem; display:flex; gap:.5rem; flex-wrap:wrap;">
          <button class="btn btn-primary" type="button" data-view="${escapeHtml(t.id)}">View details</button>
          <button class="btn" type="button" data-fav="${escapeHtml(t.id)}">${saved ? "★ Saved" : "☆ Save"}</button>
        </div>
      </div>
    </article>
  `;
}

function pickFeatured(trails, total = 6) {
  // Goal: show only 6, but change on refresh.
  // Prefer safe routes (up to 4), then fill remaining randomly.

  const safe = trails.filter((t) => t.safe_route);
  const other = trails.filter((t) => !t.safe_route);

  const safeShuffled = shuffle(safe);
  const otherShuffled = shuffle(other);

  const pickSafeCount = Math.min(4, safeShuffled.length, total);
  const picks = safeShuffled.slice(0, pickSafeCount);

  const remaining = total - picks.length;

  // Fill remaining from remaining safe + others (random)
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

    // Pick 6 randomized featured trails
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

// Init (index.html only, because #featuredTrails exists only there)
loadFeaturedTrails();

// OPTIONAL: rotate featured trails automatically every 20 seconds
// Uncomment if you want it to change without refresh.
// setInterval(loadFeaturedTrails, 20000);



// =====================
// Reservations page: show saved routes (from localStorage favorites)
// =====================
(async function renderSavedRoutesOnReservations() {
  const box = document.querySelector("#savedRoutesBox");
  const optionsEl = document.querySelector("#savedRoutesOptions");
  const hiddenEl = document.querySelector("#savedRoutes");

  // Only run on reservations.html (these elements exist only there)
  if (!box || !optionsEl || !hiddenEl) return;

  const favIds = getFavorites(); // uses FAV_KEY already defined above

  // If no favorites, show a friendly message + link
  if (!favIds.length) {
    optionsEl.innerHTML = `
      <p class="meta" style="margin:.2rem 0;">
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
        <p class="meta" style="margin:.2rem 0;">
          Your saved list is empty or unavailable right now.
          <a class="link" href="trails.html">Browse trails</a>.
        </p>
      `;
      hiddenEl.value = "";
      return;
    }

    // Build checkbox list
    optionsEl.innerHTML = savedTrails
      .map((t) => {
        const safeTag = t.safe_route ? `<span class="tag tag-safe" style="margin-left:.35rem;">Safe Route</span>` : "";
        return `
          <label class="field" style="margin:.35rem 0;">
            <span style="display:flex; gap:.5rem; align-items:center;">
              <input type="checkbox" class="saved-route" value="${escapeHtml(t.id)}" checked>
              <span>
                <strong>${escapeHtml(t.name)}</strong>
                <span class="meta" style="display:block; margin:.1rem 0 0;">
                  ${escapeHtml(t.difficulty)} • ${t.distance_km} km • ${escapeHtml(t.time_est)}
                </span>
              </span>
              ${safeTag}
            </span>
          </label>
        `;
      })
      .join("");

    function syncHidden() {
      const checked = Array.from(document.querySelectorAll(".saved-route:checked")).map((el) => el.value);
      hiddenEl.value = checked.join(",");
    }

    // Initial value + update on change
    syncHidden();
    optionsEl.addEventListener("change", syncHidden);
  } catch (err) {
    console.error(err);
    optionsEl.innerHTML = `<p class="meta">Sorry, we couldn't load your saved routes right now.</p>`;
    hiddenEl.value = "";
  }
})();
