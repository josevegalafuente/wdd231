// ----- Mobile Menu -----
const menuButton = document.querySelector("#menuButton");
const primaryNav = document.querySelector("#primaryNav");

menuButton.addEventListener("click", () => {
  const isOpen = primaryNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

// ----- Web Certificate Courses -----

const courses = [
  { code: "CSE 110", name: "Introduction to Web and Computer Programming", credits: 2, category: "CSE" },
  { code: "WDD 130", name: "Web Fundamentals", credits: 2, category: "WDD", highlight: true },
  { code: "CSE 111", name: "Programming with Functions", credits: 2, category: "CSE" },
  { code: "WDD 131", name: "Developing Web Applications", credits: 3, category: "WDD", highlight: true },
  { code: "WDD 231", name: "Visual Design and the Web", credits: 3, category: "WDD" },
  { code: "CSE 210", name: "Programming with Classes", credits: 3, category: "CSE" },
  { code: "WDD 331", name: "Frontend Development", credits: 3, category: "WDD" }
];

const grid = document.querySelector("#coursesGrid");
const totalEl = document.querySelector("#creditsTotal");
const buttons = document.querySelectorAll(".filter-btn");

function renderCourses(filter) {
  const normalized = filter.toUpperCase();
  const filtered = normalized === "ALL"
    ? courses
    : courses.filter(c => c.category === normalized);

  grid.innerHTML = filtered.map(courseToCardHTML).join("");

  const total = filtered.reduce((sum, c) => sum + c.credits, 0);
  totalEl.textContent = String(total);
}

function courseToCardHTML(c) {
  const highlightClass = c.highlight ? "highlight" : "";
  return `
    <div class="course-card ${highlightClass}">
      <p class="course-code">${c.code}</p>
      <p class="course-line"><strong>Name:</strong> ${c.name}</p>
      <p class="course-line"><strong>Credits:</strong> ${c.credits}</p>
    </div>
  `;
}

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    renderCourses(btn.dataset.filter);
  });
});

// ----- Footer Dates -----
document.querySelector("#year").textContent = new Date().getFullYear();
document.querySelector("#lastModified").textContent = document.lastModified;

// ----- Visits -----
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

// Initial render
renderCourses("ALL");
