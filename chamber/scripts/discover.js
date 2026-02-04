import { places } from "../data/discover-data.js";

const grid = document.querySelector("#discoverGrid");
const messageEl = document.querySelector("#visitMessage");


// Render Cards

function createCard(item) {
  const card = document.createElement("article");
  card.className = "discover-card";

  const h2 = document.createElement("h2");
  h2.className = "discover-title";
  h2.textContent = item.title;

  const figure = document.createElement("figure");
  figure.className = "discover-figure";

  const img = document.createElement("img");
  img.className = "discover-img";
  img.src = item.image;
  img.alt = item.title;
  img.loading = "lazy";
  img.width = 300;
  img.height = 200;

  figure.appendChild(img);

  const address = document.createElement("address");
  address.className = "discover-address";
  address.textContent = item.address;

  const p = document.createElement("p");
  p.className = "discover-desc";
  p.textContent = item.description;

  const btn = document.createElement("a");
  btn.className = "discover-btn";
  btn.href = item.moreLink;
  btn.target = "_blank";
  btn.rel = "noopener";
  btn.textContent = "Learn more";

  card.append(h2, figure, address, p, btn);
  return card;
}

function renderCards() {
  if (!grid) return;
  grid.innerHTML = "";
  places.forEach((p) => grid.appendChild(createCard(p)));
}

renderCards();



function setVisitMessage() {
  if (!messageEl) return;

  const key = "tcc-last-visit";
  const now = Date.now();
  const last = Number(localStorage.getItem(key));

  if (!last) {
    messageEl.textContent = "Welcome! Let us know if you have any questions.";
    localStorage.setItem(key, String(now));
    return;
  }

  const diffMs = now - last;
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (diffMs < oneDayMs) {
    messageEl.textContent = "Back so soon! Awesome!";
  } else {
    const days = Math.floor(diffMs / oneDayMs);
    const dayWord = days === 1 ? "day" : "days";
    messageEl.textContent = `You last visited ${days} ${dayWord} ago.`;
  }

  localStorage.setItem(key, String(now));
}

setVisitMessage();
