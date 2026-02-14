import { places } from "../data/discover-data.js";

const grid = document.querySelector("#discoverGrid");
const messageEl = document.querySelector("#visitMessage");

// localStorage last visit message
function setVisitMessage() {
  const key = "ht-last-visit";
  const now = Date.now();
  const last = Number(localStorage.getItem(key));

  if (!messageEl) return;

  if (!last) {
    messageEl.textContent = "Welcome! Let us know if you have any questions.";
    localStorage.setItem(key, String(now));
    return;
  }

  const diffMs = now - last;
  const oneDay = 24 * 60 * 60 * 1000;

  if (diffMs < oneDay) {
    messageEl.textContent = "Back so soon! Awesome!";
  } else {
    const days = Math.floor(diffMs / oneDay);
    messageEl.textContent = `You last visited ${days} ${days === 1 ? "day" : "days"} ago.`;
  }

  localStorage.setItem(key, String(now));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cardTemplate(p) {
  const title = escapeHtml(p.title);
  const address = escapeHtml(p.address);
  const description = escapeHtml(p.description);

  return `
    <article class="discover-card">
      <h2 class="discover-title">${title}</h2>

      <img src="${p.image}" alt="${title}" loading="lazy" width="300" height="200">

      <address class="discover-address">${address}</address>

      <p class="discover-desc">${description}</p>

      <a class="action action-primary" href="${p.moreLink}" target="_blank" rel="noopener">
        Learn more
      </a>
    </article>
  `;
}

function render() {
  if (!grid) return;
  grid.innerHTML = places.map(cardTemplate).join("");
}

setVisitMessage();
render();
