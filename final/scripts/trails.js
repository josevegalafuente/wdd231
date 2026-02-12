// trails.js
// Renders ALL trails from data/trails.json and filters by difficulty.
// Depends on functions already defined in main.js: trailCardHtml, toggleFav, isFav, openModal

const gridEl = document.querySelector("#allTrails");
const filterEl = document.querySelector("#difficultyFilter");
const countEl = document.querySelector("#resultsCount");

let allTrails = [];

function setCount(n, total, label) {
  if (!countEl) return;
  const suffix = label && label !== "all" ? ` • Filter: ${label}` : "";
  countEl.textContent = `${n} of ${total} trails${suffix}`;
}

function wireCardButtons(trailsInMemory) {
  if (!gridEl) return;

  // View details
  gridEl.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-view");
      const t = trailsInMemory.find((x) => x.id === id);
      if (t && typeof openModal === "function") openModal(t);
    });
  });

  // Favorites
  gridEl.querySelectorAll("[data-fav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-fav");
      if (typeof toggleFav === "function" && typeof isFav === "function") {
        toggleFav(id);
        btn.textContent = isFav(id) ? "★ Saved" : "☆ Save";
      }
    });
  });
}

function render(list, label = "all") {
  if (!gridEl) return;

  gridEl.innerHTML = list.map(trailCardHtml).join("");
  wireCardButtons(allTrails);

  setCount(list.length, allTrails.length, label);
}

function applyFilter() {
  const value = filterEl ? filterEl.value : "all";
  if (value === "all") {
    render(allTrails, "all");
    return;
  }
  const filtered = allTrails.filter((t) => t.difficulty === value);
  render(filtered, value);
}

async function init() {
  if (!gridEl) return;

  try {
    const res = await fetch("data/trails.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allTrails = await res.json();

    render(allTrails, "all");

    filterEl?.addEventListener("change", applyFilter);
  } catch (err) {
    console.error(err);
    gridEl.innerHTML = `<p class="meta">Sorry, we couldn't load trail data right now.</p>`;
    if (countEl) countEl.textContent = "Unable to load trails.";
  }
}

init();
