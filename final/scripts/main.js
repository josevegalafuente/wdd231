// Shared utilities
const qs = (sel) => document.querySelector(sel);

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
menuToggle?.addEventListener("click", () => setMenu(!document.body.classList.contains("nav-open")));
window.addEventListener("resize", () => { if (window.innerWidth >= 769) setMenu(false); });

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
// THANKYOU page: read query params + render
// =====================
(function renderThankYou() {
  const dl = qs("#thanksData");
  if (!dl) return;

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
// DATA FETCH + Dynamic content (index.html)
// - fetch local JSON using async/await + try/catch
// - generate cards dynamically
// - use array methods + template literals
// - localStorage favorites
// - modal (dialog)
// =====================
const featuredEl = qs("#featuredTrails");
const modal = qs("#trailModal");
const modalContent = qs("#modalContent");
const modalClose = qs("#modalClose");

const FAV_KEY = "ht-favorites";

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
  catch { return []; }
}
function setFavorites(list) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

function isFav(id) {
  return getFavorites().includes(id);
}

function toggleFav(id) {
  const favs = getFavorites();
  const updated = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
  setFavorites(updated);
}

function openModal(trail) {
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div style="padding: 0 1rem 1rem;">
      <h2 style="margin:.25rem 0 0.25rem;">${trail.name}</h2>
      <p class="meta"><strong>Difficulty:</strong> ${trail.difficulty}</p>
      <p class="meta"><strong>Distance:</strong> ${trail.distance_km} km • <strong>Time:</strong> ${trail.time_est}</p>
      <p class="meta"><strong>Best season:</strong> ${trail.best_season}</p>
      <p style="margin:.6rem 0 0;">${trail.description}</p>
      <p class="tag tag-safe" style="margin-top:.75rem;">Safety tip: ${trail.safety_tip}</p>
    </div>
  `;

  modal.showModal();
}

modalClose?.addEventListener("click", () => modal?.close());
modal?.addEventListener("click", (e) => {
  const rect = modal.getBoundingClientRect();
  const inDialog =
    rect.top <= e.clientY && e.clientY <= rect.bottom &&
    rect.left <= e.clientX && e.clientX <= rect.right;
  if (!inDialog) modal.close();
});

async function loadFeaturedTrails() {
  if (!featuredEl) return;

  try {
    const res = await fetch("data/trails.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const trails = await res.json();

    // Example of array methods
    const safeScore = (t) => (t.safe_route ? 1 : 0) + (t.difficulty === "Beginner" ? 1 : 0);
    const top = [...trails]
      .sort((a, b) => safeScore(b) - safeScore(a))
      .slice(0, 6);

    featuredEl.innerHTML = top.map(trailCardHtml).join("");

    // wire up buttons
    featuredEl.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-view");
        const trail = trails.find(t => t.id === id);
        if (trail) openModal(trail);
      });
    });

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

function trailCardHtml(t) {
  const saved = isFav(t.id);
  return `
    <article class="card">
      <img src="images/trails/${t.image}" alt="${t.name}" loading="lazy" width="600" height="400">
      <div class="card-body">
        <h3 class="card-title">${t.name}</h3>
        <p class="meta"><strong>Difficulty:</strong> ${t.difficulty}</p>
        <p class="meta"><strong>Distance:</strong> ${t.distance_km} km • <strong>Time:</strong> ${t.time_est}</p>
        ${t.safe_route ? `<span class="tag tag-safe">Safe Route</span>` : ``}
        <div style="margin-top:.8rem; display:flex; gap:.5rem; flex-wrap:wrap;">
          <button class="btn btn-primary" type="button" data-view="${t.id}">View details</button>
          <button class="btn" type="button" data-fav="${t.id}">${saved ? "★ Saved" : "☆ Save"}</button>
        </div>
      </div>
    </article>
  `;
}

loadFeaturedTrails();
