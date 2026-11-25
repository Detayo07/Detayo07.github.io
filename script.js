const cards = [...document.querySelectorAll('.gallery-card')];
const details = [...document.querySelectorAll('.project-detail')];
const gallery = document.getElementById('gallery');
const currentNumber = document.getElementById('current-number');
const crumbCurrent = document.getElementById('crumb-current');
const jumpButtons = [...document.querySelectorAll('[data-jump]')];
const introPanel = document.querySelector('.intro-panel');
const hirePanel = document.getElementById('availability');
const hireTrigger = document.getElementById('hire-trigger');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const backToTop = document.getElementById('back-to-top');
const projectNames = ['About', 'Flashcards', 'Quiz', 'Mind Maps', 'Audio Podcast', 'Cubbes Support', 'CampusLife', 'Offline SMS Classifier', 'Open Source', 'Education'];

let activeIndex = 0;
let wheelUntil = 0;
let wheelDeltaX = 0;
let wheelResetTimer = 0;
let dragStartX = 0;
let dragStartY = 0;
let dragStartTime = 0;
let dragAxis = null;
let dragLastDx = 0;
let suppressClickUntil = 0;

function setHireOpen(open) {
  introPanel.classList.toggle('is-career', open);
  hirePanel.setAttribute('aria-hidden', String(!open));
  hirePanel.inert = !open;
  hireTrigger.setAttribute('aria-expanded', String(open));
}

function animateHire(open) {
  if (introPanel.classList.contains('is-career') === open) return Promise.resolve();
  if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return document.startViewTransition(() => setHireOpen(open)).ready.catch(() => {});
  }
  setHireOpen(open);
  return Promise.resolve();
}

function positionCircularCards() {
  const total = cards.length;
  const half = Math.floor(total / 2);
  cards.forEach((card, index) => {
    let offset = (index - activeIndex + total) % total;
    if (offset > half) offset -= total;
    const isActive = offset === 0;
    card.classList.toggle('active', isActive);
    card.setAttribute('aria-pressed', String(isActive));
    if (offset <= -3) {
      card.dataset.offset = 'back-left';
      card.setAttribute('aria-hidden', 'true');
      card.tabIndex = -1;
    } else if (offset >= 3) {
      card.dataset.offset = 'back-right';
      card.setAttribute('aria-hidden', 'true');
      card.tabIndex = -1;
    } else {
      card.dataset.offset = String(offset);
      card.removeAttribute('aria-hidden');
      card.tabIndex = 0;
    }
  });
}

function selectProject(index) {
  activeIndex = (index + cards.length) % cards.length;
  const key = cards[activeIndex].dataset.project;
  if (introPanel.classList.contains('is-career')) animateHire(false);
  positionCircularCards();
  details.forEach(detail => {
    const active = detail.dataset.detail === key;
    detail.classList.toggle('active', active);
    detail.hidden = !active;
  });
  currentNumber.textContent = String(activeIndex + 1).padStart(2, '0');
  crumbCurrent.textContent = projectNames[activeIndex];
  const activeGroup = activeIndex === 0 ? 0 : activeIndex <= 4 ? 1 : activeIndex <= 8 ? 5 : 9;
  jumpButtons.forEach(button => {
    if (Number(button.dataset.jump) === activeGroup) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

cards.forEach((card, index) => {
  card.addEventListener('click', event => {
    if (Date.now() < suppressClickUntil) {
      event.preventDefault();
      return;
    }
    selectProject(index);
  });
});
jumpButtons.forEach(button => button.addEventListener('click', () => selectProject(Number(button.dataset.jump))));
jumpButtons[0].setAttribute('aria-current', 'page');
hireTrigger.addEventListener('click', () => animateHire(!introPanel.classList.contains('is-career')));
function setMobileMenu(open) {
  mobileMenu.hidden = !open;
  mobileMenuToggle.setAttribute('aria-expanded', String(open));
  mobileMenuToggle.setAttribute('aria-label', open ? 'Close section menu' : 'Open section menu');
}
mobileMenuToggle.addEventListener('click', event => {
  event.stopPropagation();
  setMobileMenu(mobileMenu.hidden);
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMobileMenu(false)));
document.addEventListener('click', event => {
  if (!mobileMenu.hidden && !mobileMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
    setMobileMenu(false);
  }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') setMobileMenu(false); });
function updateBackToTop() { backToTop.hidden = window.scrollY < 550; }
window.addEventListener('scroll', updateBackToTop, { passive: true });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
updateBackToTop();
document.getElementById('prev').addEventListener('click', () => selectProject(activeIndex - 1));
document.getElementById('next').addEventListener('click', () => selectProject(activeIndex + 1));
gallery.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') { event.preventDefault(); selectProject(activeIndex + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); selectProject(activeIndex - 1); }
});
gallery.addEventListener('wheel', event => {
  const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 0;
  const isShiftWheel = event.shiftKey && Math.abs(event.deltaY) >= 4;
  if (!isHorizontal && !isShiftWheel) return;
  event.preventDefault();
  if (isShiftWheel) {
    if (Date.now() < wheelUntil) return;
    wheelUntil = Date.now() + 190;
    selectProject(activeIndex + Math.sign(event.deltaY));
    return;
  }
  clearTimeout(wheelResetTimer);
  wheelResetTimer = setTimeout(() => {
    wheelDeltaX = 0;
    gallery.style.setProperty('--drag-x', '0px');
  }, 110);
  if (Date.now() < wheelUntil) return;
  wheelDeltaX += event.deltaX;
  const preview = Math.max(-22, Math.min(22, -wheelDeltaX * 0.6));
  gallery.style.setProperty('--drag-x', `${preview}px`);
  if (Math.abs(wheelDeltaX) >= 18) {
    gallery.style.setProperty('--drag-x', '0px');
    selectProject(activeIndex + Math.sign(wheelDeltaX));
    wheelDeltaX = 0;
    wheelUntil = Date.now() + 190;
  }
}, { passive: false });

gallery.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragStartTime = Date.now();
  dragAxis = null;
  dragLastDx = 0;
});

gallery.addEventListener('pointermove', event => {
  if (!dragStartTime) return;
  const dx = event.clientX - dragStartX;
  const dy = event.clientY - dragStartY;
  if (!dragAxis) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    dragAxis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    if (dragAxis === 'x') gallery.classList.add('is-dragging');
  }
  if (dragAxis !== 'x') return;
  dragLastDx = dx;
  const damped = Math.max(-140, Math.min(140, dx * 0.72));
  gallery.style.setProperty('--drag-x', `${damped}px`);
});

function endGalleryDrag() {
  if (!dragStartTime) return;
  const wasHorizontal = dragAxis === 'x';
  const dx = dragLastDx;
  const elapsed = Math.max(1, Date.now() - dragStartTime);
  dragStartTime = 0;
  dragAxis = null;
  dragLastDx = 0;
  gallery.classList.remove('is-dragging');
  gallery.style.setProperty('--drag-x', '0px');
  if (wasHorizontal) {
    suppressClickUntil = Date.now() + 160;
    const velocity = Math.abs(dx) / elapsed;
    if (Math.abs(dx) > 26 || (velocity > 0.22 && Math.abs(dx) > 10)) {
      selectProject(activeIndex + (dx < 0 ? 1 : -1));
    }
  }
}

gallery.addEventListener('pointerup', endGalleryDrag);
gallery.addEventListener('pointercancel', endGalleryDrag);
gallery.addEventListener('pointerleave', event => {
  if (event.pointerType === 'mouse') endGalleryDrag();
});
gallery.addEventListener('dragstart', event => event.preventDefault());
positionCircularCards();

const skillIcons = {
  Python: 'python', TypeScript: 'typescript', JavaScript: 'javascript', Rust: 'rust',
  FastAPI: 'fastapi', React: 'react', 'Next.js': 'nextdotjs', 'Node.js': 'nodedotjs',
  NestJS: 'nestjs', Express: 'express', Gemini: 'googlegemini', Claude: 'claude',
  Codex: 'openai', Antigravity: 'antigravity', 'Vertex AI': 'vertexai', 'OpenAI API': 'openai',
  LangChain: 'langchain', LangGraph: 'langgraph', 'scikit-learn': 'scikitlearn',
  ElevenLabs: 'elevenlabs', PostgreSQL: 'postgresql', pgvector: 'postgresql',
  MySQL: 'mysql', Redis: 'redis', SQLAlchemy: 'sqlalchemy', GCP: 'googlecloud',
  'Cloud Run': 'googlecloud', 'Cloud Tasks': 'googlecloud', 'Cloud SQL': 'googlecloud',
  'Google Cloud Storage': 'googlecloud', 'Cloudflare R2': 'cloudflare', 'AWS S3': 'aws',
  Docker: 'docker', FFmpeg: 'ffmpeg', pytest: 'pytest', Vitest: 'vitest', Jest: 'jest',
  Git: 'git', GitHub: 'github'
};
const darkInvertIcons = new Set(['rust', 'nextdotjs', 'express', 'openai', 'elevenlabs', 'github']);
const darkBrightIcons = new Set(['langchain', 'langgraph']);
const darkBoostIcons = new Set(['postgresql', 'mysql', 'sqlalchemy', 'jest', 'aws']);
document.querySelectorAll('.skill-group p').forEach(group => {
  const skills = group.textContent.split(' · ');
  group.replaceChildren(...skills.map(skill => {
    const tag = document.createElement('span');
    if (skillIcons[skill]) {
      const iconName = skillIcons[skill];
      const logo = document.createElement('img');
      logo.src = `assets/icons/${iconName}.svg?v=4`;
      logo.decoding = 'async';
      logo.alt = '';
      logo.loading = 'lazy';
      if (darkInvertIcons.has(iconName)) logo.className = 'icon-invert-dark';
      else if (darkBrightIcons.has(iconName)) logo.className = 'icon-bright-dark';
      else if (darkBoostIcons.has(iconName)) logo.className = 'icon-boost-dark';
      tag.append(logo);
    }
    tag.append(document.createTextNode(skill));
    return tag;
  }));
});

const themeToggle = document.getElementById('theme-toggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(theme, persist = false) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  if (themeColorMeta) themeColorMeta.content = isDark ? '#0b0c0e' : '#f4f6fa';
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if (persist) {
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
  }
}
applyTheme(document.documentElement.dataset.theme || (darkSchemeQuery.matches ? 'dark' : 'light'));
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  });
}
darkSchemeQuery.addEventListener('change', event => {
  try { if (localStorage.getItem('theme')) return; } catch {}
  applyTheme(event.matches ? 'dark' : 'light');
});

const contributionCalendar = window.contributionData;
if (contributionCalendar) {
  const grid = document.getElementById('contrib-grid');
  const months = document.getElementById('contrib-months');
  const firstSunday = Date.UTC(2025, 11, 28);
  const snapshotDay = contributionCalendar.capturedAt;
  const dayMs = 24 * 60 * 60 * 1000;
  const dayFragment = document.createDocumentFragment();
  contributionCalendar.days.forEach(day => {
    const date = new Date(`${day.date}T00:00:00Z`);
    const week = Math.floor((date.getTime() - firstSunday) / (dayMs * 7));
    const cell = document.createElement('span');
    cell.className = 'contrib-day';
    cell.dataset.level = String(day.level);
    if (day.date > snapshotDay) cell.classList.add('is-future');
    cell.style.gridColumn = String(week + 1);
    cell.style.gridRow = String(date.getUTCDay() + 1);
    cell.title = `${day.date}: ${day.count} ${day.count === 1 ? 'contribution' : 'contributions'}`;
    cell.setAttribute('aria-hidden', 'true');
    dayFragment.append(cell);
  });
  grid.append(dayFragment);
  for (let month = 0; month < 12; month++) {
    const first = Date.UTC(2026, month, 1);
    const week = Math.floor((first - firstSunday) / (dayMs * 7));
    const label = document.createElement('span');
    label.textContent = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(first);
    label.style.gridColumn = String(week + 1);
    months.append(label);
  }
  document.querySelector('.github-stat strong').textContent = contributionCalendar.total.toLocaleString('en');
}

const lagosTime = document.getElementById('lagos-time');
const visitorTimeNote = document.getElementById('visitor-time-note');
const lagosClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
});
function updateLagosTime() { lagosTime.textContent = lagosClock.format(new Date()); }
updateLagosTime();
visitorTimeNote.textContent = new Date().getTimezoneOffset() === -60 ? 'same time as you' : 'West Africa Time · UTC+1';
setInterval(updateLagosTime, 1000);

const copyEmail = document.getElementById('copy-email');
const copyLabel = copyEmail.querySelector('span');
copyEmail.addEventListener('click', async () => {
  const email = 'adeboyeadetayo107@gmail.com';
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(email);
    else {
      const field = document.createElement('textarea');
      field.value = email;
      document.body.appendChild(field);
      field.select();
      if (!document.execCommand('copy')) throw new Error('Copy failed');
      field.remove();
    }
    copyLabel.textContent = 'Copied';
    setTimeout(() => { copyLabel.textContent = 'Copy'; }, 2200);
  } catch {
    copyLabel.textContent = 'Use email link';
    setTimeout(() => { copyLabel.textContent = 'Copy'; }, 2200);
  }
});
