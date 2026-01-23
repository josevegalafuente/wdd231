// Helpers
const qs = (sel) => document.querySelector(sel);

// Mobile menu
const menuToggle = qs("#menuToggle");

function setMenu(open) {
  document.body.classList.toggle("nav-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.contains("nav-open");
  setMenu(!isOpen);
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 850) setMenu(false);
});

// Theme toggle
const themeToggle = qs("#themeToggle");

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("tcc-theme", theme);
}

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark");
  applyTheme(isDark ? "light" : "dark");
});

// Load saved theme
(() => {
  const saved = localStorage.getItem("tcc-theme");
  if (saved === "dark" || saved === "light") applyTheme(saved);
})();

// Footer info 
qs("#year").textContent = new Date().getFullYear();
qs("#lastModified").textContent = document.lastModified;

// Directory: Fetch + Render
const membersEl = qs("#members");
const gridBtn = qs("#gridBtn");
const listBtn = qs("#listBtn");

function setView(view) {
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
  website.innerHTML = `<strong>Website:</strong> <a class="member-link" href="${member.website}" target="_blank" rel="noopener">Visit site</a>`;

  body.append(name, badge, address, phone, website);
  card.append(img, body);

  return card;
}

function renderMembers(list) {
  membersEl.innerHTML = "";
  list.forEach((m) => membersEl.appendChild(createMemberCard(m)));
}

async function loadMembers() {
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

// View toggle events
gridBtn.addEventListener("click", () => setView("grid"));
listBtn.addEventListener("click", () => setView("list"));

// Load saved view
(() => {
  const saved = localStorage.getItem("directoryView");
  setView(saved === "list" ? "list" : "grid");
})();

// Init
loadMembers();

