// ===== Helpers =====
const qs = (sel) => document.querySelector(sel);

// ===== Mobile menu =====
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

// ===== Theme toggle =====
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

// ===== Footer info =====
qs("#year").textContent = new Date().getFullYear();
qs("#lastModified").textContent = document.lastModified;