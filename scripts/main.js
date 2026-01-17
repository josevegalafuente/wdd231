// ----- Mobile Menu -----
const menuButton = document.querySelector("#menuButton");
const primaryNav = document.querySelector("#primaryNav");

menuButton.addEventListener("click", () => {
  const isOpen = primaryNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

// ----- Footer Dates -----
document.querySelector("#year").textContent = new Date().getFullYear();
document.querySelector("#lastModified").textContent = document.lastModified;

// ----- Visits (simple localStorage) -----
const visitsTodayEl = document.querySelector("#visitsToday");
const lastVisitEl = document.querySelector("#lastVisit");
const messageEl = document.querySelector("#visitMessage");

const now = new Date();
const todayKey = now.toISOString().slice(0, 10);

const lastVisit = localStorage.getItem("lastVisit");
const lastVisitDate = lastVisit ? new Date(lastVisit) : null;

const storedDay = localStorage.getItem("visitDay");
let count = Number(localStorage.getItem("visitCount") || "0");

if (storedDay !== todayKey) {
  count = 0;
  localStorage.setItem("visitDay", todayKey);
}

count += 1;
localStorage.setItem("visitCount", String(count));
localStorage.setItem("lastVisit", now.toISOString());

visitsTodayEl.textContent = String(count);

if (!lastVisitDate) {
  lastVisitEl.textContent = "This is your first visit.";
  messageEl.textContent = "Welcome! Come back soon.";
} else {
  lastVisitEl.textContent = lastVisitDate.toLocaleString();
  const diffMs = now - lastVisitDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    messageEl.textContent = "Back again today — nice!";
  } else if (diffDays === 1) {
    messageEl.textContent = "You last visited 1 day ago.";
  } else {
    messageEl.textContent = `You last visited ${diffDays} days ago.`;
  }
}

// ----- (Optional placeholder values for Information) -----
document.querySelector("#temp").textContent = "—";
document.querySelector("#cond").textContent = "—";
