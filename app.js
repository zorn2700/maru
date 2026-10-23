import {
  alphabetGuide,
  courseMeta,
  lessons,
  modules,
  mediaLessons,
  survivalPhrases,
  studyPlan,
  transcriptionGuide,
} from "./course-data.js";
import { phrasebook, quickReference } from "./extra-data.js";
import { verbLibrary, verbTenses } from "./verb-data.js";

const main = document.querySelector("#main");
const nav = document.querySelector(".bottom-nav");
const searchDialog = document.querySelector("#searchDialog");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const mediaDialog = document.querySelector("#mediaDialog");
const lessonVideo = document.querySelector("#lessonVideo");
const mediaDialogTitle = document.querySelector("#mediaDialogTitle");
const toast = document.querySelector("#toast");
const installButton = document.querySelector("#installButton");

const STORAGE_KEY = "masri-ru-state-v2";
const defaultState = {
  completed: [],
  lastLesson: "m1l1",
  theme: "system",
  speechRate: 0.82,
  showTranscription: true,
  flashcardIndex: 0,
  flashcardFlipped: false,
  practiceMode: "cards",
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActive: "",
  todayDate: "",
  todayXp: 0,
  todayReviews: 0,
  totalReviews: 0,
  dailyGoal: 20,
  perfectQuiz: false,
  wordStats: {},
  verbStats: {},
  favorites: [],
  achievements: [],
  phraseCategory: "greetings",
};

let state = loadState();
let deferredInstallPrompt = null;
let quizState = null;
let drillState = null;
let listenState = null;
let verbTense = "present";
let drillTense = "present";
let verbFilter = "all";
let reviewRevealed = false;
let reviewKey = "";

const achievementDefs = [
  { id: "first-lesson", icon: "🎯", title: "Первый шаг", desc: "Завершите первый урок", test: () => state.completed.length >= 1 },
  { id: "five-lessons", icon: "📚", title: "В ритме", desc: "Завершите 5 уроков", test: () => state.completed.length >= 5 },
  { id: "ten-lessons", icon: "🚀", title: "Дальше и выше", desc: "Завершите 10 уроков", test: () => state.completed.length >= 10 },
  { id: "all-lessons", icon: "🏆", title: "Весь курс", desc: "Завершите все уроки", test: () => state.completed.length >= lessons.length },
  { id: "first-verb", icon: "🧩", title: "Глагольный старт", desc: "Правильно проспрягайте глагол", test: () => Object.values(state.verbStats).some((item) => item.right > 0) },
  { id: "verb-master", icon: "💪", title: "Мастер глаголов", desc: "25 верных ответов в тренажёре глаголов", test: () => Object.values(state.verbStats).reduce((sum, item) => sum + item.right, 0) >= 25 },
  { id: "streak-3", icon: "🔥", title: "Три дня подряд", desc: "Занимайтесь 3 дня подряд", test: () => state.bestStreak >= 3 },
  { id: "streak-7", icon: "⚡", title: "Неделя силы", desc: "Занимайтесь 7 дней подряд", test: () => state.bestStreak >= 7 },
  { id: "reviews-50", icon: "🧠", title: "Память работает", desc: "50 повторений слов", test: () => state.totalReviews >= 50 },
  { id: "reviews-200", icon: "🌟", title: "Двести повторений", desc: "200 повторений слов", test: () => state.totalReviews >= 200 },
  { id: "perfect-quiz", icon: "✅", title: "Без ошибок", desc: "Пройдите тест без ошибок", test: () => state.perfectQuiz },
  { id: "level-5", icon: "🏅", title: "Пятый уровень", desc: "Наберите 600 XP", test: () => state.xp >= 600 },
  { id: "collector", icon: "⭐", title: "Коллекционер фраз", desc: "Добавьте 5 фраз в избранное", test: () => state.favorites.length >= 5 },
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      ...defaultState,
      ...saved,
      completed: Array.isArray(saved.completed) ? saved.completed : [],
      wordStats: saved.wordStats && typeof saved.wordStats === "object" ? saved.wordStats : {},
      verbStats: saved.verbStats && typeof saved.verbStats === "object" ? saved.verbStats : {},
      favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
    };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function routeTo(route) {
  const next = `#/${route.replace(/^#?\/?/, "")}`;
  if (location.hash === next) renderRoute();
  else location.hash = next;
}

function getRoute() {
  const path = location.hash.replace(/^#\/?/, "") || "home";
  return path.split("/").filter(Boolean);
}

function moduleLessons(moduleId) {
  return lessons.filter((lesson) => lesson.module === Number(moduleId));
}

function completedCount(items = lessons) {
  return items.filter((lesson) => state.completed.includes(lesson.id)).length;
}

function percent(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

function dayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function yesterdayKey() {
  return dayKey(new Date(Date.now() - 86400000));
}

function activeStreak() {
  if (!state.lastActive) return 0;
  return [dayKey(), yesterdayKey()].includes(state.lastActive) ? Number(state.streak) || 0 : 0;
}

function levelInfo() {
  const xp = Number(state.xp) || 0;
  const level = Math.floor(xp / 120) + 1;
  const current = xp % 120;
  return { level, current, next: 120, percent: percent(current, 120) };
}

function touchStreak() {
  const today = dayKey();
  if (state.todayDate === today) return;
  const yesterday = yesterdayKey();
  state.streak = state.lastActive === yesterday ? (Number(state.streak) || 0) + 1 : 1;
  state.bestStreak = Math.max(Number(state.bestStreak) || 0, state.streak);
  state.todayDate = today;
  state.todayXp = 0;
  state.todayReviews = 0;
  state.lastActive = today;
  saveState();
}

function checkAchievements() {
  let changed = false;
  achievementDefs.forEach((item) => {
    if (!state.achievements.includes(item.id) && item.test()) {
      state.achievements.push(item.id);
      changed = true;
      showToast(`${item.icon} Достижение: ${item.title}`);
    }
  });
  if (changed) saveState();
}

function awardXp(amount) {
  touchStreak();
  state.xp = (Number(state.xp) || 0) + amount;
  state.todayXp = (Number(state.todayXp) || 0) + amount;
  saveState();
  checkAchievements();
}

function vocabKey(item) {
  return `${item.lessonId || "global"}:${item.ar}`;
}

function wordStat(item) {
  return state.wordStats[vocabKey(item)] || { seen: 0, right: 0, wrong: 0, streak: 0, interval: 0, due: 0, last: 0 };
}

function rateWord(item, quality) {
  touchStreak();
  const key = vocabKey(item);
  const stat = { ...wordStat(item) };
  stat.seen += 1;
  stat.last = Date.now();
  if (quality === "again") {
    stat.wrong += 1;
    stat.streak = 0;
    stat.interval = 0;
    stat.due = Date.now() + 10 * 60 * 1000;
  } else {
    stat.right += 1;
    stat.streak += 1;
    if (quality === "easy") stat.interval = Math.max(4, Math.round((stat.interval || 1) * 2.6));
    else stat.interval = stat.interval ? Math.min(60, stat.interval * 2) : 1;
    stat.due = Date.now() + stat.interval * 86400000;
  }
  state.wordStats[key] = stat;
  state.totalReviews = (Number(state.totalReviews) || 0) + 1;
  state.todayReviews = (Number(state.todayReviews) || 0) + 1;
  awardXp(quality === "again" ? 2 : 6);
  saveState();
}

function verbStat(verbId) {
  return state.verbStats[verbId] || { seen: 0, right: 0, wrong: 0, streak: 0 };
}

function recordVerb(verbId, correct) {
  touchStreak();
  const stat = { ...verbStat(verbId) };
  stat.seen += 1;
  if (correct) {
    stat.right += 1;
    stat.streak = (Number(stat.streak) || 0) + 1;
  } else {
    stat.wrong += 1;
    stat.streak = 0;
  }
  state.verbStats[verbId] = stat;
  awardXp(correct ? 5 : 1);
  saveState();
  checkAchievements();
}

function dueCount() {
  const now = Date.now();
  return allVocab().filter((item) => {
    const stat = state.wordStats[vocabKey(item)];
    return stat && stat.due <= now;
  }).length;
}

function reviewPool(limit = 30) {
  const now = Date.now();
  const due = allVocab()
    .filter((item) => {
      const stat = state.wordStats[vocabKey(item)];
      return stat && stat.due <= now;
    })
    .sort((a, b) => (state.wordStats[vocabKey(a)].due || 0) - (state.wordStats[vocabKey(b)].due || 0));
  const unseen = shuffle(allVocab().filter((item) => !state.wordStats[vocabKey(item)]));
  return [...due, ...unseen].slice(0, limit);
}

function allPhrases() {
  return phrasebook.flatMap((category) => category.phrases.map((item) => ({ ...item, categoryId: category.id, categoryTitle: category.title })));
}

function favoritePhrases() {
  const pool = allPhrases();
  return state.favorites.map((ar) => pool.find((item) => item.ar === ar)).filter(Boolean);
}

function toggleFavorite(ar) {
  state.favorites = state.favorites.includes(ar) ? state.favorites.filter((item) => item !== ar) : [...state.favorites, ar];
  saveState();
  checkAchievements();
}

function verbOfTheDay() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((new Date() - start) / 86400000);
  return verbLibrary[day % verbLibrary.length];
}

function setTheme() {
  const dark = state.theme === "dark" || (state.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function activateNav(route) {
  let root = route;
  if (["module", "lesson"].includes(route)) root = "course";
  else if (route === "verb") root = "verbs";
  else if (["phrases", "reference"].includes(route)) root = "practice";
  nav.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.route === root));
}

function moduleCard(module) {
  const items = moduleLessons(module.id);
  const done = completedCount(items);
  const value = percent(done, items.length);
  return `
    <button class="module-card" type="button" data-open-module="${module.id}" style="--module-color:${module.color}">
      <img src="${module.image}" alt="" loading="lazy">
      <span class="module-card-body">
        <span class="module-card-meta"><span>${escapeHtml(module.level)}</span><span>${done}/${items.length}</span></span>
        <h3>${escapeHtml(module.title)}</h3>
        <span class="arabic" lang="ar">${escapeHtml(module.ar)}</span>
        <span class="progress-track" aria-label="Прогресс ${value}%"><span class="progress-fill" style="width:${value}%"></span></span>
      </span>
    </button>`;
}

function homeView() {
  const done = completedCount();
  const progress = percent(done, lessons.length);
  const vocabTotal = lessons.reduce((sum, lesson) => sum + lesson.vocabulary.length, 0);
  const nextLesson = lessons.find((lesson) => !state.completed.includes(lesson.id)) || lessons.at(-1);
  const mediaCards = mediaLessons.slice(0, 3).map(mediaCard).join("");
  const level = levelInfo();
  const streak = activeStreak();
  const due = dueCount();
  const goal = Number(state.dailyGoal) || 20;
  const today = Number(state.todayReviews) || 0;
  const goalPercent = Math.min(100, percent(today, goal));
  const verb = verbOfTheDay();
  const firstForm = verb.forms.present[0];
  const learnedVerbs = Object.values(state.verbStats).filter((item) => item.right >= 3).length;

  return `
    <section class="hero">
      <p class="eyebrow">${escapeHtml(courseMeta.levels)} · ${courseMeta.lessonCount} уроков · офлайн</p>
      <h1>${escapeHtml(courseMeta.title)}</h1>
      <p class="arabic-display" lang="ar">${escapeHtml(courseMeta.arabicTitle)}</p>
      <p class="hero-copy">Практический каирский диалект: живые диалоги, произношение, умное повторение и большая лаборатория глаголов.</p>
      <div class="hero-actions">
        <button class="primary-button" type="button" data-open-lesson="${nextLesson.id}">${done ? "Продолжить" : "Начать курс"}</button>
        <button class="soft-button" type="button" data-route="verbs">Глаголы</button>
        <button class="soft-button" type="button" data-practice-mode="smart">Умное повторение</button>
      </div>
    </section>

    <section class="stat-grid" aria-label="Статистика обучения">
      <article class="stat-card"><strong>${progress}%</strong><span>общий прогресс · ${done}/${lessons.length} уроков</span></article>
      <article class="stat-card"><strong>🔥 ${streak}</strong><span>${streak === 1 ? "день подряд" : "дней подряд"}</span></article>
      <article class="stat-card"><strong>⭐ ${level.level}</strong><span>уровень · ${state.xp || 0} XP</span></article>
      <article class="stat-card"><strong>${due}</strong><span>слов к повторению</span></article>
    </section>

    <section class="section dashboard-grid">
      <article class="card daily-card">
        <div class="daily-top">
          <div><p class="eyebrow">Цель дня</p><h2>${today} / ${goal} повторений</h2></div>
          <span class="daily-badge">${goalPercent >= 100 ? "выполнено ✓" : `${goalPercent}%`}</span>
        </div>
        <span class="progress-track big-track" aria-label="Цель дня ${goalPercent}%"><span class="progress-fill" style="width:${goalPercent}%"></span></span>
        <p class="muted">${due ? `${due} слов уже ждут повторения. Умный режим сам подберёт слабые места.` : "Расписание свободно: можно взять новые слова или закрепить глаголы."}</p>
        <div class="lesson-actions"><button class="primary-button" type="button" data-practice-mode="smart">Повторить умно</button><button class="soft-button" type="button" data-practice-mode="drill">Тренажёр глаголов</button></div>
      </article>
      <article class="card verb-of-day">
        <div class="verb-of-day-head">
          <div><p class="eyebrow">Глагол дня</p><div class="verb-of-day-ar arabic" lang="ar">${escapeHtml(verb.ar)}</div></div>
          ${speakButton(verb.ar)}
        </div>
        <p class="verb-of-day-ru"><strong>${escapeHtml(verb.ru)}</strong> · ${escapeHtml(verb.tr)}</p>
        <div class="mini-form"><span>${escapeHtml(firstForm.person)}</span><span class="arabic" lang="ar">${escapeHtml(firstForm.ar)}</span><small>${escapeHtml(firstForm.tr)}</small></div>
        <p class="muted">Корень ${escapeHtml(verb.root)} · ${escapeHtml(verb.pattern)}</p>
        <button class="soft-button" type="button" data-open-verb="${verb.id}">Открыть спряжение →</button>
      </article>
    </section>

    <section class="section">
      <div class="section-head"><div><h2>Быстрый доступ</h2><p>Новые инструменты для самостоятельной практики</p></div></div>
      <div class="feature-grid">
        <button class="card feature-card" type="button" data-route="verbs"><span class="feature-icon">🧩</span><strong>Лаборатория глаголов</strong><small>${verbLibrary.length} глаголов · 5 времён · ${learnedVerbs} освоено</small></button>
        <button class="card feature-card" type="button" data-route="phrases"><span class="feature-icon">💬</span><strong>Разговорник</strong><small>${allPhrases().length} готовых фраз по ситуациям</small></button>
        <button class="card feature-card" type="button" data-route="reference"><span class="feature-icon">📐</span><strong>Шпаргалка</strong><small>Местоимения, предлоги, числа и формулы времён</small></button>
        <button class="card feature-card" type="button" data-route="settings"><span class="feature-icon">🏅</span><strong>Достижения</strong><small>${state.achievements.length} из ${achievementDefs.length} открыто</small></button>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><div><h2>Модули курса</h2><p>От первых звуков до самостоятельного общения</p></div></div>
      <div class="module-grid">${modules.map(moduleCard).join("")}</div>
    </section>

    <section class="section">
      <div class="section-head"><div><h2>Визуальные уроки</h2><p>Короткие повторения ключевых ситуаций</p></div><button class="soft-button" type="button" data-route="media">Все видео</button></div>
      <div class="media-grid">${mediaCards}</div>
    </section>`;
}

function courseView() {
  return `
    <header class="page-head"><div><p class="eyebrow">Учебная программа</p><h1>Курс по модулям</h1><p>${lessons.length} уроков · ${courseMeta.levels} · ${courseMeta.studyWeeks} недель</p></div></header>
    <div class="lesson-actions compact-actions"><button class="soft-button" type="button" data-route="verbs">🧩 Глаголы</button><button class="soft-button" type="button" data-route="phrases">💬 Разговорник</button><button class="soft-button" type="button" data-route="reference">📐 Шпаргалка</button></div>
    <div class="module-grid">${modules.map(moduleCard).join("")}</div>
    <section class="section">
      <div class="section-head"><div><h2>План на 16 недель</h2><p>Оптимальный ритм — три учебных дня и один день повторения в неделю</p></div></div>
      <div class="plan-table"><table><thead><tr><th>Недели</th><th>Материал</th><th>Результат</th></tr></thead><tbody>
        ${studyPlan.map((item) => `<tr><td>${item.weeks}</td><td>${escapeHtml(item.focus)}</td><td>${escapeHtml(item.target)}</td></tr>`).join("")}
      </tbody></table></div>
    </section>`;
}

function moduleView(moduleId) {
  const module = modules.find((item) => item.id === Number(moduleId));
  if (!module) return notFoundView();
  const items = moduleLessons(module.id);
  const done = completedCount(items);
  return `
    <button class="soft-button back-button" type="button" data-route="course">← К модулям</button>
    <section class="module-banner section" style="--module-color:${module.color}">
      <div class="module-banner-copy">
        <p class="eyebrow">Модуль ${module.id} · ${escapeHtml(module.level)}</p>
        <h1>${escapeHtml(module.title)}</h1>
        <p class="arabic-display" lang="ar">${escapeHtml(module.ar)}</p>
        <p>${done} из ${items.length} уроков завершено</p>
      </div>
      <img src="${module.image}" alt="">
    </section>
    <div class="lesson-list">
      ${items.map((lesson, index) => {
        const complete = state.completed.includes(lesson.id);
        return `<button class="lesson-row ${complete ? "completed" : ""}" type="button" data-open-lesson="${lesson.id}">
          <span class="lesson-number">${index + 1}</span>
          <span><h3>${escapeHtml(lesson.title)}</h3><p><span class="arabic" lang="ar">${escapeHtml(lesson.arTitle)}</span> · ${lesson.minutes} мин.</p></span>
          <span class="lesson-status" aria-label="${complete ? "Завершено" : "Не завершено"}">${complete ? "✓" : "›"}</span>
        </button>`;
      }).join("")}
    </div>`;
}

function speakButton(text, label = "Прослушать") {
  return `<button class="speak-button" type="button" data-speak="${escapeHtml(text)}" aria-label="${label}" title="${label}">🔊</button>`;
}

function lessonView(lessonId) {
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return notFoundView();
  const module = modules.find((item) => item.id === lesson.module);
  const complete = state.completed.includes(lesson.id);
  state.lastLesson = lesson.id;
  saveState();

  const vocabulary = lesson.vocabulary.map((item) => `
    <article class="vocab-item">
      <div>
        <div class="vocab-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>
        ${state.showTranscription ? `<div class="vocab-tr">${escapeHtml(item.tr)}</div>` : ""}
        <div class="vocab-ru">${escapeHtml(item.ru)}</div>
        ${item.note ? `<div class="vocab-note">${escapeHtml(item.note)}</div>` : ""}
      </div>
      ${speakButton(item.ar)}
    </article>`).join("");

  const grammarBlocks = lesson.grammar.map((item) => `
    <section class="grammar-block">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.explanation)}</p>
      <div class="example-list">
        ${item.examples.map((ex) => `<div class="example-row"><span class="arabic" lang="ar">${escapeHtml(ex.ar)}</span><small>${escapeHtml(ex.tr)}</small><div>${escapeHtml(ex.ru)}</div></div>`).join("")}
      </div>
    </section>`).join("");

  const dialogue = lesson.dialogue.map((item) => `
    <div class="dialogue-line">
      <span class="avatar" aria-hidden="true">${escapeHtml(item.speaker.trim().slice(0, 1).toUpperCase())}</span>
      <div class="bubble"><strong>${escapeHtml(item.speaker)}</strong><div class="arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<div class="transcription">${escapeHtml(item.tr)}</div>` : ""}<p>${escapeHtml(item.ru)}</p></div>
      ${speakButton(item.ar, `Прослушать реплику ${item.speaker}`)}
    </div>`).join("");

  return `
    <button class="soft-button back-button" type="button" data-open-module="${module.id}">← Модуль ${module.id}</button>
    <section class="lesson-hero section" style="--module-color:${module.color}">
      <p class="eyebrow">Урок ${lesson.order} · ${escapeHtml(lesson.level)}</p>
      <h1>${escapeHtml(lesson.title)}</h1>
      <div class="arabic-display" lang="ar">${escapeHtml(lesson.arTitle)}</div>
      <div class="lesson-meta"><span class="chip">${lesson.minutes} минут</span><span class="chip">${lesson.vocabulary.length} слов и фраз</span><span class="chip">Диалог</span><span class="chip">Тест</span></div>
    </section>

    <div class="lesson-layout">
      <div class="lesson-content">
        <section class="lesson-section"><h2>Цели урока</h2><ul class="goal-list">${lesson.goals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join("")}</ul></section>
        <section class="lesson-section"><h2>Слова и фразы</h2><div class="vocab-list">${vocabulary}</div></section>
        <section class="lesson-section"><h2>Грамматика без перегруза</h2>${grammarBlocks}</section>
        <section class="lesson-section"><h2>Живой диалог</h2><div class="dialogue">${dialogue}</div></section>
        <section class="lesson-section"><h2>Контекст и культура</h2><p class="culture-note">${escapeHtml(lesson.culture)}</p></section>
        <section class="lesson-section"><h2>Закрепление</h2><p>Пройдите короткий тест по словам этого урока или проверьте понимание на слух. Ответ показывается сразу, а вопросы меняются при повторе.</p>${[4, 5, 6, 7].includes(lesson.module) ? `<p class="muted" style="margin-top:.5rem">Для уроков о глаголах здесь же тренируется спряжение, а в лаборатории доступны все времена.</p>` : ""}<div class="lesson-actions"><button class="primary-button" type="button" data-lesson-quiz="${lesson.id}">Начать тест</button><button class="primary-button" type="button" data-lesson-listen="${lesson.id}">Аудирование</button>${[4, 5, 6, 7].includes(lesson.module) ? `<button class="primary-button" type="button" data-lesson-drill="${lesson.id}">Спряжение</button><button class="soft-button" type="button" data-route="verbs">Все глаголы</button>` : ""}<button class="primary-button complete-button ${complete ? "completed" : ""}" type="button" data-toggle-complete="${lesson.id}">${complete ? "✓ Урок завершён" : "Отметить завершённым"}</button></div>${[4, 5, 6, 7].includes(lesson.module) ? `<div id="lessonDrill">${drillView(true)}</div>` : ""}</section>
      </div>
      <aside class="card">
        <h3>Как пройти урок</h3>
        <p class="muted">1. Прослушайте каждую фразу.<br>2. Повторите её три раза.<br>3. Разыграйте обе роли диалога.<br>4. Пройдите тест без подсказки.</p>
        <button class="soft-button" type="button" data-practice-lesson="${lesson.id}">Карточки урока</button>
      </aside>
    </div>`;
}

function practiceView(mode = state.practiceMode) {
  state.practiceMode = mode;
  saveState();
  const modeButtons = `<div class="practice-controls mode-scroll"><button class="${mode === "smart" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="smart">Умное повторение</button><button class="${mode === "cards" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="cards">Карточки</button><button class="${mode === "quiz" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="quiz">Общий тест</button><button class="${mode === "drill" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="drill">Глаголы</button><button class="${mode === "listen" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="listen">Аудирование</button><button class="${mode === "phrases" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="phrases">Разговорник</button></div>`;
  let body = "";
  if (mode === "quiz") body = quizView(null);
  else if (mode === "phrases") body = phrasebookView(true);
  else if (mode === "drill") body = drillView(true);
  else if (mode === "listen") body = listeningView(true);
  else if (mode === "smart") body = smartReviewView();
  else body = flashcardView();
  return `<header class="page-head"><div><p class="eyebrow">Активное повторение</p><h1>Практика</h1><p>${dueCount()} слов к повторению · серия ${activeStreak()} дн. · уровень ${levelInfo().level}</p></div></header>${modeButtons}<section class="section">${body}</section>`;
}

function allVocab() {
  return lessons.flatMap((lesson) => lesson.vocabulary.map((item) => ({ ...item, lessonId: lesson.id, lessonTitle: lesson.title })));
}

function flashcardView() {
  const deck = allVocab();
  const index = ((state.flashcardIndex % deck.length) + deck.length) % deck.length;
  const item = deck[index];
  const flipped = state.flashcardFlipped;
  const stat = wordStat(item);
  return `<div class="flashcard-wrap">
    <div class="flashcard" role="button" tabindex="0" data-flip-card aria-label="Перевернуть карточку">
      ${flipped ? `<div><div class="back-ru">${escapeHtml(item.ru)}</div><div class="front-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<div class="front-tr">${escapeHtml(item.tr)}</div>` : ""}</div>` : `<div><div class="front-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<div class="front-tr">${escapeHtml(item.tr)}</div>` : ""}</div>`}
      <span class="flashcard-hint">Нажмите, чтобы ${flipped ? "скрыть" : "показать"} ответ · ${index + 1}/${deck.length}${stat.seen ? ` · повторений: ${stat.seen}` : ""}</span>
    </div>
    <div class="practice-controls"><button class="soft-button" type="button" data-card-step="-1">← Назад</button>${speakButton(item.ar)}<button class="soft-button" type="button" data-card-shuffle>Перемешать</button><button class="primary-button" type="button" data-card-step="1">Дальше →</button></div>
    ${flipped ? `<div class="rating-row"><span>Насколько уверенно?</span><div class="practice-controls"><button class="soft-button danger-soft" type="button" data-card-rate="again">Не знаю</button><button class="soft-button" type="button" data-card-rate="good">Помню</button><button class="primary-button" type="button" data-card-rate="easy">Легко</button></div></div>` : `<p class="muted" style="text-align:center">Переверните карточку и оцените себя — интервал повтора подстроится.</p>`}
  </div>`;
}

function smartReviewView() {
  const pool = reviewPool(40);
  const item = pool[0] || allVocab()[0];
  const key = vocabKey(item);
  if (reviewKey !== key) {
    reviewKey = key;
    reviewRevealed = false;
  }
  const stat = wordStat(item);
  const due = dueCount();
  const goal = Number(state.dailyGoal) || 20;
  const today = Number(state.todayReviews) || 0;
  const goalPercent = Math.min(100, percent(today, goal));
  return `<div class="smart-review">
    <div class="card daily-card">
      <div class="daily-top"><div><p class="eyebrow">Умное повторение</p><h2>${due ? `${due} слов ждут` : "Свободная тренировка"}</h2></div><span class="daily-badge">${today}/${goal}</span></div>
      <span class="progress-track big-track"><span class="progress-fill" style="width:${goalPercent}%"></span></span>
      <p class="muted">Правильные ответы увеличивают интервал, ошибки возвращают слово уже через 10 минут.</p>
    </div>
    <div class="card quiz-card">
      <p class="eyebrow">${escapeHtml(item.lessonTitle || "Словарь")} · ${stat.right} ✓ / ${stat.wrong} ✗</p>
      <div class="quiz-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>
      ${state.showTranscription ? `<p class="vocab-tr">${escapeHtml(item.tr)}</p>` : ""}
      ${reviewRevealed
        ? `<div class="smart-answer"><strong>${escapeHtml(item.ru)}</strong>${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}</div><div class="rating-row"><span>Как запомнилось?</span><div class="practice-controls"><button class="soft-button danger-soft" type="button" data-review-rate="again">Ещё раз</button><button class="soft-button" type="button" data-review-rate="good">Помню</button><button class="primary-button" type="button" data-review-rate="easy">Легко</button></div></div>`
        : `<div class="lesson-actions centered-actions"><button class="primary-button" type="button" data-review-reveal>Показать перевод</button>${speakButton(item.ar)}</div>`}
    </div>
  </div>`;
}

function buildQuiz(lessonId = null, count = 10, direction = "ar") {
  const lesson = lessonId ? lessons.find((item) => item.id === lessonId) : null;
  const source = lesson ? lesson.vocabulary.map((item) => ({ ...item, lessonId: lesson.id, lessonTitle: lesson.title })) : allVocab();
  const pool = lessonId ? source : shuffle([...source]).slice(0, Math.min(60, source.length));
  const selected = shuffle([...pool]).slice(0, Math.min(count, pool.length));
  const globalMeanings = [...new Set(allVocab().map((item) => item.ru))];
  const globalArabic = [...new Set(allVocab().map((item) => item.ar))];
  const questions = selected.map((item) => {
    const distractors = direction === "ru"
      ? shuffle(globalArabic.filter((value) => value !== item.ar)).slice(0, 3)
      : shuffle(globalMeanings.filter((meaning) => meaning !== item.ru)).slice(0, 3);
    const answer = direction === "ru" ? item.ar : item.ru;
    return { item, direction, answer, options: shuffle([...new Set([answer, ...distractors])]) };
  });
  return { lessonId, direction, questions, index: 0, score: 0, answered: false, selected: null, finished: false };
}

function quizView(lessonId = null) {
  if (!quizState || quizState.lessonId !== lessonId) quizState = buildQuiz(lessonId, lessonId ? 8 : 12, "ar");
  if (quizState.finished) {
    const total = quizState.questions.length;
    return `<div class="card quiz-card"><p class="eyebrow">Результат</p><h2>${quizState.score} из ${total}</h2><p>${quizState.score >= Math.ceil(total * .75) ? "Хороший результат. Повторите ошибки и двигайтесь дальше." : "Повторите карточки и попробуйте ещё раз."}</p><div class="lesson-actions"><button class="primary-button" type="button" data-restart-quiz="${lessonId || "all"}">Пройти снова</button>${lessonId ? `<button class="soft-button" type="button" data-open-lesson="${lessonId}">Вернуться к уроку</button>` : ""}</div></div>`;
  }
  const { item, answer, direction, options } = quizState.questions[quizState.index];
  const readingArabic = direction === "ru";
  const optionButtons = options.map((option) => {
    let className = "choice-button";
    if (quizState.answered && option === answer) className += " correct";
    else if (quizState.answered && option === quizState.selected) className += " wrong";
    const label = readingArabic ? `<span class="arabic" lang="ar">${escapeHtml(option)}</span>` : escapeHtml(option);
    return `<button class="${className}" type="button" data-quiz-choice="${escapeHtml(option)}" ${quizState.answered ? "disabled" : ""}>${label}</button>`;
  }).join("");
  return `<div class="card quiz-card">
    <p class="eyebrow">Вопрос ${quizState.index + 1} из ${quizState.questions.length}</p>
    <div class="quiz-direction" role="group" aria-label="Направление теста">
      <button class="${readingArabic ? "" : "active-soft-button"}" type="button" data-quiz-direction="ar">Слова → Перевод</button>
      <button class="${readingArabic ? "active-soft-button" : ""}" type="button" data-quiz-direction="ru">Перевод → Слова</button>
    </div>
    <div class="quiz-prompt">${readingArabic ? "Как это по-арабски?" : "Выберите правильный перевод"}</div>
    ${readingArabic ? `<div class="quiz-ru">${escapeHtml(item.ru)}${quizState.answered ? " " + speakButton(answer) : ""}</div>` : `<div class="quiz-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<p class="vocab-tr">${escapeHtml(item.tr)}</p>` : ""}`}
    ${readingArabic && !quizState.answered ? `<p class="muted">Выберите арабскую запись фразы</p>` : ""}
    <div class="choice-grid">${optionButtons}</div>
    <div class="quiz-feedback">${quizState.answered ? (quizState.selected === answer ? "✓ Верно" : `Правильный ответ: ${readingArabic ? `<span class="arabic" lang="ar">${escapeHtml(answer)}</span>${state.showTranscription ? ` <span class="vocab-tr">${escapeHtml(item.tr)}</span>` : ""}` : escapeHtml(item.ru)}`) : ""}</div>
    ${quizState.answered ? `<button class="primary-button" type="button" data-next-question>${quizState.index + 1 === quizState.questions.length ? "Показать результат" : "Следующий вопрос"}</button>` : ""}
  </div>`;
}

function survivalView() {
  return `<div class="card"><h2>Фразы первой необходимости</h2><p class="muted">Сохраните этот раздел офлайн и потренируйте произношение заранее.</p><div class="vocab-list">${survivalPhrases.map((item) => `<article class="vocab-item"><div><div class="vocab-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<div class="vocab-tr">${escapeHtml(item.tr)}</div>` : ""}<div>${escapeHtml(item.ru)}</div></div>${speakButton(item.ar)}</article>`).join("")}</div></div>`;
}

function verbCard(verb) {
  const stat = verbStat(verb.id);
  const learned = stat.right >= 3;
  return `<button class="card verb-card ${learned ? "learned" : ""}" type="button" data-open-verb="${verb.id}" data-verb-search="${escapeHtml(`${verb.ar} ${verb.tr} ${verb.ru} ${verb.root} ${verb.pattern}`.toLocaleLowerCase("ru"))}">
    <span class="verb-card-top"><span class="verb-card-ar arabic" lang="ar">${escapeHtml(verb.ar)}</span><span class="verb-level">${escapeHtml(verb.level)}</span></span>
    <span class="verb-card-tr">${escapeHtml(verb.tr)}</span>
    <span class="verb-card-ru">${escapeHtml(verb.ru)}</span>
    <span class="verb-card-meta"><span>${escapeHtml(verb.root)}</span><span>${escapeHtml(verb.pattern)}</span></span>
    <span class="verb-card-score">${learned ? "✓ освоено" : `${stat.right} ✓ / ${stat.wrong} ✗`}</span>
  </button>`;
}

function verbsView() {
  const filters = [["all", "Все"], ["A1", "A1"], ["A2", "A2"], ["learned", "Освоенные"]];
  const list = verbLibrary.filter((verb) => {
    if (verbFilter === "learned") return verbStat(verb.id).right >= 3;
    if (verbFilter === "A1" || verbFilter === "A2") return verb.level === verbFilter;
    return true;
  });
  const mastered = Object.values(state.verbStats).filter((item) => item.right >= 3).length;
  return `<header class="page-head"><div><p class="eyebrow">Новый раздел</p><h1>Лаборатория глаголов</h1><p>${verbLibrary.length} глаголов · 5 времён · ${mastered} освоено</p></div><button class="soft-button" type="button" data-practice-mode="drill">Тренажёр</button></header>
    <div class="card verb-toolbar">
      <input id="verbSearch" type="search" autocomplete="off" placeholder="Найти глагол: писать, katab, шرب…">
      <div class="filter-row">${filters.map(([id, label]) => `<button class="${verbFilter === id ? "primary-button" : "soft-button"}" type="button" data-verb-filter="${id}">${label}</button>`).join("")}</div>
    </div>
    <div class="verb-grid" id="verbGrid">${list.map(verbCard).join("") || `<div class="empty-state">Пока нет глаголов в этом фильтре. Потренируйтесь, чтобы отметить освоенные.</div>`}</div>`;
}

function verbDetailView(verbId) {
  const verb = verbLibrary.find((item) => item.id === verbId);
  if (!verb) return notFoundView();
  const forms = verb.forms[verbTense] || verb.forms.present;
  const tenseInfo = verbTenses.find((item) => item.id === verbTense) || verbTenses[0];
  const stat = verbStat(verb.id);
  const mastery = Math.min(100, percent(stat.right, 3));
  return `<button class="soft-button back-button" type="button" data-route="verbs">← Все глаголы</button>
    <section class="lesson-hero verb-hero" style="--module-color:#00838F">
      <p class="eyebrow">Глагол · ${escapeHtml(verb.level)} · корень ${escapeHtml(verb.root)}</p>
      <h1><span class="arabic" lang="ar">${escapeHtml(verb.ar)}</span> <span class="verb-hero-tr">${escapeHtml(verb.tr)}</span></h1>
      <p class="hero-copy">${escapeHtml(verb.ru)}</p>
      <div class="lesson-meta"><span class="chip">${escapeHtml(verb.pattern)}</span><span class="chip">${stat.right} ✓ / ${stat.wrong} ✗</span></div>
      <div class="lesson-actions"><button class="primary-button" type="button" data-drill-verb="${verb.id}">Тренировать этот глагол</button>${speakButton(verb.ar, "Прослушать глагол")}</div>
    </section>
    <section class="lesson-section">
      <div class="section-head"><div><h2>Спряжение</h2><p>${escapeHtml(tenseInfo.hint)}</p></div><span class="chip">${escapeHtml(tenseInfo.title)}</span></div>
      <div class="tense-tabs">${verbTenses.map((item) => `<button class="${item.id === verbTense ? "active" : ""}" type="button" data-verb-tense="${item.id}">${escapeHtml(item.title)}</button>`).join("")}</div>
      <div class="plan-table conj-table"><table><thead><tr><th>Лицо</th><th>Арабский</th><th>Транскрипция</th><th></th></tr></thead><tbody>
        ${forms.map((form) => `<tr><td>${escapeHtml(form.person)}</td><td class="arabic" lang="ar">${escapeHtml(form.ar)}</td><td class="vocab-tr">${escapeHtml(form.tr)}</td><td>${speakButton(form.ar)}</td></tr>`).join("")}
      </tbody></table></div>
      <div class="mastery-row"><span>Освоение</span><span class="progress-track"><span class="progress-fill" style="width:${mastery}%"></span></span><small>${stat.right >= 3 ? "✓ закреплено" : "3 верных ответа"}</small></div>
    </section>
    ${verb.note ? `<section class="lesson-section"><h2>Подсказка</h2><p>${escapeHtml(verb.note)}</p></section>` : ""}
    <section class="lesson-section"><h2>Пример</h2><div class="example-row"><span class="arabic" lang="ar">${escapeHtml(verb.example.ar)}</span><small>${escapeHtml(verb.example.tr)}</small><div>${escapeHtml(verb.example.ru)}</div></div></section>`;
}

function phraseItem(item) {
  const favorite = state.favorites.includes(item.ar);
  return `<article class="vocab-item phrase-item">
    <div>
      <div class="vocab-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>
      ${state.showTranscription ? `<div class="vocab-tr">${escapeHtml(item.tr)}</div>` : ""}
      <div class="vocab-ru">${escapeHtml(item.ru)}</div>
    </div>
    <div class="phrase-actions">${speakButton(item.ar)}<button class="fav-button ${favorite ? "active" : ""}" type="button" data-fav-phrase="${escapeHtml(item.ar)}" aria-label="${favorite ? "Убрать из избранного" : "В избранное"}" title="${favorite ? "Убрать из избранного" : "В избранное"}">${favorite ? "★" : "☆"}</button></div>
  </article>`;
}

function phrasebookView(embedded = false) {
  if (!phrasebook.some((category) => category.id === state.phraseCategory)) state.phraseCategory = phrasebook[0].id;
  const active = phrasebook.find((category) => category.id === state.phraseCategory) || phrasebook[0];
  const items = active.id === "favorites" ? favoritePhrases() : active.phrases;
  const body = `<div class="phrasebook">
    <div class="phrase-categories">${phrasebook.map((category) => `<button class="${category.id === active.id ? "primary-button" : "soft-button"}" type="button" data-phrase-category="${category.id}"><span aria-hidden="true">${category.icon}</span> ${escapeHtml(category.title)}${category.id === "favorites" ? ` (${state.favorites.length})` : ""}</button>`).join("")}</div>
    <div class="section-head"><div><h2>${escapeHtml(active.icon)} ${escapeHtml(active.title)}</h2><p>${items.length ? `${items.length} фраз · нажмите ★, чтобы сохранить` : "Сохраняйте нужные фразы звёздочкой"}</p></div></div>
    <div class="vocab-list">${items.map(phraseItem).join("") || `<div class="empty-state">В избранном пока пусто. Откройте любую категорию и нажмите ★ у нужной фразы.</div>`}</div>
  </div>`;
  if (embedded) return body;
  return `<header class="page-head"><div><p class="eyebrow">Быстрая помощь</p><h1>Разговорник</h1><p>${allPhrases().length} фраз для реальных ситуаций · работает офлайн</p></div><button class="soft-button" type="button" data-route="reference">Шпаргалка</button></header>${body}`;
}

function referenceView() {
  const cell = (value) => {
    const arabic = /[\u0600-\u06FF]/.test(value);
    return `<td${arabic ? ` class="arabic ref-arabic" lang="ar"` : ""}>${escapeHtml(value)}</td>`;
  };
  return `<header class="page-head"><div><p class="eyebrow">Быстрый справочник</p><h1>Шпаргалка</h1><p>Местоимения, суффиксы, вопросы, предлоги и формулы времён</p></div><button class="soft-button" type="button" data-route="phrases">Разговорник</button></header>
    ${quickReference.map((section) => `<section class="lesson-section ref-section"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.intro)}</p><div class="plan-table"><table><thead><tr>${section.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${section.rows.map((row) => `<tr>${row.map(cell).join("")}</tr>`).join("")}</tbody></table></div></section>`).join("")}`;
}

function buildDrill(verbId = null, tense = drillTense) {
  const verb = (verbId && verbLibrary.find((item) => item.id === verbId)) || verbLibrary[Math.floor(Math.random() * verbLibrary.length)];
  const chosenTense = tense === "all" || !verb.forms[tense] ? verbTenses[Math.floor(Math.random() * verbTenses.length)].id : tense;
  const forms = verb.forms[chosenTense];
  const uniqueForms = forms.filter((form, index) => forms.findIndex((entry) => entry.ar === form.ar) === index);
  const correct = uniqueForms[Math.floor(Math.random() * uniqueForms.length)];
  const distractors = shuffle(uniqueForms.filter((form) => form.ar !== correct.ar)).slice(0, 3);
  const options = shuffle([correct, ...distractors]);
  return { verb, tense: chosenTense, correct, options, answered: false, selected: null };
}

function drillTenseTabs(current) {
  return `<div class="tense-tabs">${verbTenses.map((item) => `<button class="${item.id === current ? "active" : ""}" type="button" data-drill-tense="${item.id}">${escapeHtml(item.title)}</button>`).join("")}</div>`;
}

function drillView(embedded = false) {
  if (!drillState) drillState = buildDrill();
  const { verb, correct, options, answered, selected, tense } = drillState;
  const tenseInfo = verbTenses.find((item) => item.id === tense) || verbTenses[0];
  const stat = verbStat(verb.id);
  const body = `<div class="card quiz-card">
    <div class="drill-head">
      <p class="eyebrow">Спряжение · ${escapeHtml(verb.ru)} · ${stat.right} ✓ / ${stat.wrong} ✗</p>
      <button class="link-button" type="button" data-open-verb="${verb.id}">${escapeHtml(verb.ar)} →</button>
    </div>
    ${drillTenseTabs(tense)}
    <p class="muted tense-hint">${escapeHtml(tenseInfo.hint)}</p>
    <div class="quiz-prompt">${escapeHtml(correct.person)} — выберите форму<br><span class="drill-verb">${escapeHtml(verb.ar)} · ${escapeHtml(verb.tr)}</span></div>
    <div class="choice-grid">
      ${options.map((form) => {
        let className = "choice-button";
        if (answered && form.ar === correct.ar) className += " correct";
        else if (answered && form.ar === selected) className += " wrong";
        return `<button class="${className}" type="button" data-drill-choice="${escapeHtml(form.ar)}" ${answered ? "disabled" : ""}><span class="arabic" lang="ar">${escapeHtml(form.ar)}</span>${state.showTranscription ? `<small class="vocab-tr">${escapeHtml(form.tr)}</small>` : ""}</button>`;
      }).join("")}
    </div>
    <div class="quiz-feedback">${answered ? (selected === correct.ar ? "✓ Верно" : `Правильный ответ: <span class="arabic" lang="ar">${escapeHtml(correct.ar)}</span>${state.showTranscription ? ` <small class="vocab-tr">${escapeHtml(correct.tr)}</small>` : ""}`) : ""}</div>
    ${answered ? `<div class="lesson-actions"><button class="primary-button" type="button" data-next-drill>Следующий глагол</button>${speakButton(correct.ar)}</div>` : ""}
  </div>`;
  if (embedded) return body;
  return `<section class="section"><h2>Лаборатория глаголов</h2><p class="muted">Выберите время, лицо и проверьте форму. Всего в базе ${verbLibrary.length} глаголов.</p>${body}</section>`;
}

function buildListening(lessonId = null) {
  const lesson = lessonId ? lessons.find((item) => item.id === lessonId) : null;
  const scope = lesson ? lesson.vocabulary.map((item) => ({ ...item, lessonId: lesson.id, lessonTitle: lesson.title })) : allVocab();
  const pool = lessonId ? scope : shuffle([...scope]).slice(0, 60);
  const item = pool[Math.floor(Math.random() * pool.length)];
  const localMeanings = [...new Set(scope.map((entry) => entry.ru))];
  const globalMeanings = [...new Set(allVocab().map((entry) => entry.ru))];
  const distractors = shuffle(lessonId ? localMeanings : globalMeanings).filter((meaning) => meaning !== item.ru).slice(0, 3);
  return { lessonId, item, options: shuffle([item.ru, ...distractors]), answered: false, selected: null };
}

function listeningView(embedded = false) {
  if (!listenState) listenState = buildListening(null);
  const { item, options, answered, selected } = listenState;
  const body = `<div class="card quiz-card">
    <p class="eyebrow">Тренировка аудирования</p>
    <div class="quiz-prompt">Послушайте фразу и выберите её значение</div>
    <button class="listen-play" type="button" data-listen-play="${escapeHtml(item.ar)}">🔊 <span>Прослушать ещё раз</span></button>
    ${answered ? `<div class="quiz-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<p class="vocab-tr">${escapeHtml(item.tr)}</p>` : ""}` : ""}
    <div class="choice-grid">
      ${options.map((option) => {
        let className = "choice-button";
        if (answered && option === item.ru) className += " correct";
        else if (answered && option === selected) className += " wrong";
        return `<button class="${className}" type="button" data-listen-choice="${escapeHtml(option)}" ${answered ? "disabled" : ""}>${escapeHtml(option)}</button>`;
      }).join("")}
    </div>
    <div class="quiz-feedback">${answered ? (selected === item.ru ? "✓ Верно" : `Правильный ответ: ${escapeHtml(item.ru)}`) : ""}</div>
    ${answered ? `<div class="lesson-actions"><button class="primary-button" type="button" data-next-listen>Следующая фраза</button>${speakButton(item.ar)}</div>` : ""}
  </div>`;
  if (embedded) return body;
  return `<section class="section"><h2>Аудирование</h2><p class="muted">Слушайте и определяйте значение услышанной фразы.</p>${body}</section>`;
}

function renderListen(backLessonId = null, play = true) {
  const back = backLessonId ? `<button class="soft-button back-button" type="button" data-open-lesson="${backLessonId}">← Вернуться к уроку</button>` : "";
  main.innerHTML = `${back}<section class="section">${listeningView(true)}</section>`;
  if (play) setTimeout(() => speakArabic(listenState.item.ar), 150);
}

function refreshListen() {
  const [route, lessonId] = getRoute();
  if (route === "practice") {
    main.innerHTML = practiceView("listen");
    setTimeout(() => speakArabic(listenState.item.ar), 150);
    return;
  }
  renderListen(lessonId || listenState.lessonId, false);
}

function mediaCard(media) {
  return `<button class="card media-card" type="button" data-open-media="${media.id}"><div class="media-thumb"><img src="${media.poster}" alt="" loading="lazy"><span class="play-mark" aria-hidden="true">▶</span></div><div class="media-copy"><h3>${escapeHtml(media.title)}</h3><p>${escapeHtml(media.subtitle)}</p></div></button>`;
}

function mediaView() {
  return `<header class="page-head"><div><p class="eyebrow">Визуальное повторение</p><h1>Видео</h1><p>Короткие озвученные сцены с субтитрами. Для тренировки произношения используйте кнопку звука в уроках.</p></div></header><div class="media-grid">${mediaLessons.map(mediaCard).join("")}</div>`;
}

function settingsView() {
  return `<header class="page-head"><div><p class="eyebrow">Приложение</p><h1>Настройки и справка</h1><p>Изменения сохраняются только на этом устройстве</p></div></header>
    <div class="settings-list">
      <label class="setting-row"><span><strong>Тема</strong><small>Светлая, тёмная или системная</small></span><select id="themeSelect"><option value="system" ${state.theme === "system" ? "selected" : ""}>Системная</option><option value="light" ${state.theme === "light" ? "selected" : ""}>Светлая</option><option value="dark" ${state.theme === "dark" ? "selected" : ""}>Тёмная</option></select></label>
      <label class="setting-row"><span><strong>Показывать транскрипцию</strong><small>Латинская запись египетского произношения</small></span><span class="switch"><input id="transcriptionToggle" type="checkbox" ${state.showTranscription ? "checked" : ""}><span></span></span></label>
      <label class="setting-row"><span><strong>Скорость произношения</strong><small>Голос зависит от установленных голосов устройства</small></span><select id="speechRateSelect"><option value="0.68" ${Number(state.speechRate) === .68 ? "selected" : ""}>Медленно</option><option value="0.82" ${Number(state.speechRate) === .82 ? "selected" : ""}>Учебная</option><option value="1" ${Number(state.speechRate) === 1 ? "selected" : ""}>Обычно</option></select></label>
      <label class="setting-row"><span><strong>Цель дня</strong><small>Сколько повторений слов выполнять ежедневно</small></span><select id="dailyGoalSelect"><option value="10" ${Number(state.dailyGoal) === 10 ? "selected" : ""}>10</option><option value="20" ${Number(state.dailyGoal) === 20 ? "selected" : ""}>20</option><option value="30" ${Number(state.dailyGoal) === 30 ? "selected" : ""}>30</option><option value="50" ${Number(state.dailyGoal) === 50 ? "selected" : ""}>50</option></select></label>
      <div class="setting-row"><span><strong>Сбросить статистику слов</strong><small>Интервалы повторения, XP и серия будут очищены, уроки останутся</small></span><button class="soft-button" type="button" data-reset-stats>Очистить</button></div>
      <div class="setting-row"><span><strong>Сбросить весь прогресс</strong><small>Уроки, статистика, избранное и достижения будут удалены</small></span><button class="soft-button" type="button" data-reset-progress>Сбросить</button></div>
    </div>

    <section class="section lesson-section" id="achievements">
      <div class="section-head"><div><h2>Достижения</h2><p>${state.achievements.length} из ${achievementDefs.length} открыто · ${state.xp || 0} XP</p></div><span class="chip">Уровень ${levelInfo().level}</span></div>
      <span class="progress-track big-track"><span class="progress-fill" style="width:${levelInfo().percent}%"></span></span>
      <div class="achievement-grid">${achievementDefs.map((item) => `<article class="achievement ${state.achievements.includes(item.id) ? "unlocked" : ""}"><span class="achievement-icon">${state.achievements.includes(item.id) ? item.icon : "🔒"}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.desc)}</small></article>`).join("")}</div>
    </section>

    <section class="section lesson-section">
      <div class="section-head"><div><h2>Инструменты</h2><p>Дополнительные разделы работают без интернета</p></div></div>
      <div class="feature-grid">
        <button class="card feature-card" type="button" data-route="verbs"><span class="feature-icon">🧩</span><strong>Лаборатория глаголов</strong><small>${verbLibrary.length} глаголов и 5 времён</small></button>
        <button class="card feature-card" type="button" data-route="phrases"><span class="feature-icon">💬</span><strong>Разговорник</strong><small>${allPhrases().length} фраз и избранное</small></button>
        <button class="card feature-card" type="button" data-route="reference"><span class="feature-icon">📐</span><strong>Шпаргалка</strong><small>Грамматика в таблицах</small></button>
      </div>
    </section>

    <section class="section lesson-section"><h2>Как читать транскрипцию</h2><div class="plan-table"><table><thead><tr><th>Знак</th><th>Как произнести</th><th>Пример</th></tr></thead><tbody>${transcriptionGuide.map((row) => `<tr><td><strong>${escapeHtml(row[0])}</strong></td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="section lesson-section"><h2>Арабский алфавит</h2><p>Буквы пишутся справа налево и меняют вид в зависимости от позиции. Буквы ا د ذ ر ز و не соединяются со следующей буквой слева. В таблице дано каирское разговорное произношение.</p><div class="plan-table"><table><thead><tr><th>Буква</th><th>Название</th><th>Звук</th><th>Пример</th><th>Значение</th></tr></thead><tbody>${alphabetGuide.map((row) => `<tr><td class="arabic" lang="ar" style="font-size:1.4rem;font-weight:800">${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="section lesson-section"><h2>Правильная тренировка</h2><ol class="goal-list"><li>Сначала слушайте целую фразу, не читая транскрипцию.</li><li>Повторяйте одновременно с голосом, затем самостоятельно.</li><li>Записывайте себя на телефон и сравнивайте ритм, а не только отдельные звуки.</li><li>Используйте новые фразы в коротких личных примерах.</li></ol><p class="muted">Системное произношение ar-EG зависит от телефона и может звучать ближе к литературному арабскому. Диалоги и транскрипция курса сохраняют египетские формы.</p></section>
    <section class="section lesson-section"><h2>О разработчике</h2><p>Нашли ошибку, хотите новую тему или свой пример в курсе — напишите, отвечу удобным способом.</p><div class="contact-links"><a class="contact-link" href="https://wa.me/971561101262" target="_blank" rel="noopener"><span>WhatsApp</span><span dir="ltr">+971 56 110 1262</span></a><a class="contact-link" href="https://t.me/mourssi2700" target="_blank" rel="noopener"><span>Telegram</span><span dir="ltr">@mourssi2700</span></a></div></section>`;
}

function notFoundView() {
  return `<div class="empty-state"><h1>Раздел не найден</h1><button class="primary-button" type="button" data-route="home">На главную</button></div>`;
}

function renderRoute() {
  const [route, value] = getRoute();
  activateNav(route);
  if (route === "home") main.innerHTML = homeView();
  else if (route === "course") main.innerHTML = courseView();
  else if (route === "module") main.innerHTML = moduleView(value);
  else if (route === "lesson") main.innerHTML = lessonView(value);
  else if (route === "verbs") main.innerHTML = verbsView();
  else if (route === "verb") main.innerHTML = verbDetailView(value);
  else if (route === "phrases") main.innerHTML = phrasebookView();
  else if (route === "reference") main.innerHTML = referenceView();
  else if (route === "practice") main.innerHTML = practiceView();
  else if (route === "media") main.innerHTML = mediaView();
  else if (route === "settings") main.innerHTML = settingsView();
  else main.innerHTML = notFoundView();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function refreshDrill() {
  const anchor = document.querySelector("#lessonDrill");
  if (anchor) {
    anchor.innerHTML = drillView(true);
    return;
  }
  const [route, lessonId] = getRoute();
  if (route === "practice") {
    main.innerHTML = practiceView("drill");
    return;
  }
  main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${lessonId}">← Вернуться к уроку</button>${drillView(true)}`;
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function speakArabic(text) {
  if (!("speechSynthesis" in window)) {
    showToast("На этом устройстве нет системного синтеза речи");
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-EG";
  utterance.rate = Number(state.speechRate) || .82;
  const voices = speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === "ar-eg") || voices.find((voice) => voice.lang.toLowerCase().startsWith("ar")) || null;
  speechSynthesis.speak(utterance);
}

function openMedia(mediaId) {
  const media = mediaLessons.find((item) => item.id === mediaId);
  if (!media) return;
  mediaDialogTitle.textContent = media.title;
  lessonVideo.replaceChildren();
  lessonVideo.src = media.file;
  const track = document.createElement("track");
  track.kind = "captions";
  track.label = "Русские субтитры";
  track.srclang = "ru";
  track.src = media.captions;
  track.default = true;
  lessonVideo.append(track);
  mediaDialog.showModal();
}

function updateSearch(query) {
  const needle = query.trim().toLocaleLowerCase("ru");
  if (!needle) {
    searchResults.innerHTML = `<div class="empty-state">Введите русское или арабское слово</div>`;
    return;
  }
  const found = [];
  lessons.forEach((lesson) => {
    const lessonHit = `${lesson.title} ${lesson.arTitle}`.toLocaleLowerCase("ru").includes(needle);
    if (lessonHit) found.push({ type: "lesson", lessonId: lesson.id, ar: lesson.arTitle, ru: lesson.title, tr: `Урок ${lesson.order}` });
    lesson.vocabulary.forEach((item) => {
      if (`${item.ar} ${item.tr} ${item.ru}`.toLocaleLowerCase("ru").includes(needle)) found.push({ type: "vocab", lessonId: lesson.id, ...item });
    });
  });
  searchResults.innerHTML = found.length ? found.slice(0, 60).map((item) => `<button class="search-result" type="button" data-search-open="${item.lessonId}"><span class="arabic" lang="ar">${escapeHtml(item.ar)}</span><strong> · ${escapeHtml(item.ru)}</strong><small>${escapeHtml(item.tr || "")}</small></button>`).join("") : `<div class="empty-state">Ничего не найдено</div>`;
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, [data-flip-card]");
  if (!target) return;
  if (target.dataset.route) routeTo(target.dataset.route);
  else if (target.dataset.openModule) routeTo(`module/${target.dataset.openModule}`);
  else if (target.dataset.openLesson) routeTo(`lesson/${target.dataset.openLesson}`);
  else if (target.dataset.openVerb) routeTo(`verb/${target.dataset.openVerb}`);
  else if (target.dataset.speak) speakArabic(target.dataset.speak);
  else if (target.dataset.openMedia) openMedia(target.dataset.openMedia);
  else if (target.dataset.toggleComplete) {
    const id = target.dataset.toggleComplete;
    const adding = !state.completed.includes(id);
    state.completed = adding ? [...state.completed, id] : state.completed.filter((item) => item !== id);
    saveState();
    if (adding) {
      touchStreak();
      awardXp(40);
      showToast("Урок завершён! +40 XP");
    }
    renderRoute();
    if (!adding) showToast("Отметка снята");
  } else if (target.dataset.practiceLesson) {
    const lesson = lessons.find((item) => item.id === target.dataset.practiceLesson);
    state.flashcardIndex = Math.max(0, allVocab().findIndex((item) => item.lessonId === lesson.id));
    state.flashcardFlipped = false;
    state.practiceMode = "cards";
    saveState();
    routeTo("practice");
  } else if (target.dataset.practiceMode) {
    quizState = null;
    drillState = null;
    listenState = null;
    reviewRevealed = false;
    reviewKey = "";
    main.innerHTML = practiceView(target.dataset.practiceMode);
    if (target.dataset.practiceMode === "listen" && listenState) setTimeout(() => speakArabic(listenState.item.ar), 150);
    if (target.dataset.practiceMode === "smart") reviewRevealed = false;
  } else if (target.hasAttribute("data-flip-card")) {
    state.flashcardFlipped = !state.flashcardFlipped;
    saveState();
    main.innerHTML = practiceView("cards");
  } else if (target.dataset.cardStep) {
    state.flashcardIndex += Number(target.dataset.cardStep);
    state.flashcardFlipped = false;
    saveState();
    main.innerHTML = practiceView("cards");
  } else if (target.hasAttribute("data-card-shuffle")) {
    state.flashcardIndex = Math.floor(Math.random() * allVocab().length);
    state.flashcardFlipped = false;
    saveState();
    main.innerHTML = practiceView("cards");
  } else if (target.dataset.cardRate) {
    const deck = allVocab();
    const index = ((state.flashcardIndex % deck.length) + deck.length) % deck.length;
    rateWord(deck[index], target.dataset.cardRate);
    state.flashcardFlipped = false;
    state.flashcardIndex += 1;
    saveState();
    main.innerHTML = practiceView("cards");
    showToast(target.dataset.cardRate === "again" ? "Будет повторено через 10 минут" : "Интервал повтора увеличен");
  } else if (target.hasAttribute("data-review-reveal")) {
    reviewRevealed = true;
    const [route] = getRoute();
    if (route === "practice") main.innerHTML = practiceView("smart");
    else main.innerHTML = practiceView("smart");
  } else if (target.dataset.reviewRate) {
    const pool = reviewPool(40);
    const item = pool[0] || allVocab()[0];
    rateWord(item, target.dataset.reviewRate);
    reviewRevealed = false;
    reviewKey = "";
    const [route] = getRoute();
    if (route === "practice") main.innerHTML = practiceView("smart");
    else main.innerHTML = practiceView("smart");
    showToast(target.dataset.reviewRate === "again" ? "Слово вернётся для повтора" : "Повтор запланирован");
  } else if (target.dataset.lessonQuiz) {
    quizState = buildQuiz(target.dataset.lessonQuiz, 8);
    main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${target.dataset.lessonQuiz}">← Вернуться к уроку</button><section class="section">${quizView(target.dataset.lessonQuiz)}</section>`;
  } else if (target.dataset.quizChoice) {
    if (quizState?.answered) return;
    quizState.selected = target.dataset.quizChoice;
    quizState.answered = true;
    const correct = quizState.selected === quizState.questions[quizState.index].answer;
    if (correct) quizState.score += 1;
    touchStreak();
    state.totalReviews = (Number(state.totalReviews) || 0) + 1;
    state.todayReviews = (Number(state.todayReviews) || 0) + 1;
    awardXp(correct ? 8 : 3);
    saveState();
    const [route] = getRoute();
    if (route === "practice") main.innerHTML = practiceView("quiz");
    else main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${quizState.lessonId}">← Вернуться к уроку</button><section class="section">${quizView(quizState.lessonId)}</section>`;
  } else if (target.hasAttribute("data-next-question")) {
    if (quizState.index + 1 >= quizState.questions.length) {
      quizState.finished = true;
      if (quizState.score === quizState.questions.length) {
        state.perfectQuiz = true;
        saveState();
        checkAchievements();
      }
    }
    else { quizState.index += 1; quizState.answered = false; quizState.selected = null; }
    const [route] = getRoute();
    if (route === "practice") main.innerHTML = practiceView("quiz");
    else main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${quizState.lessonId}">← Вернуться к уроку</button><section class="section">${quizView(quizState.lessonId)}</section>`;
  } else if (target.dataset.quizDirection) {
    quizState = buildQuiz(quizState.lessonId, quizState.lessonId ? 8 : 12, target.dataset.quizDirection);
    const [route] = getRoute();
    if (route === "practice") main.innerHTML = practiceView("quiz");
    else main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${quizState.lessonId}">← Вернуться к уроку</button><section class="section">${quizView(quizState.lessonId)}</section>`;
  } else if (target.dataset.restartQuiz) {
    const id = target.dataset.restartQuiz === "all" ? null : target.dataset.restartQuiz;
    quizState = buildQuiz(id, id ? 8 : 12, quizState?.direction || "ar");
    if (id) main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${id}">← Вернуться к уроку</button><section class="section">${quizView(id)}</section>`;
    else main.innerHTML = practiceView("quiz");
  } else if (target.dataset.lessonDrill) {
    drillState = buildDrill();
    const anchor = document.querySelector("#lessonDrill");
    if (anchor) {
      anchor.innerHTML = drillView(true);
    } else {
      main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${target.dataset.lessonDrill}">← Вернуться к уроку</button>${drillView(true)}`;
    }
  } else if (target.dataset.drillVerb) {
    drillState = buildDrill(target.dataset.drillVerb, "all");
    routeTo("practice");
    main.innerHTML = practiceView("drill");
  } else if (target.dataset.verbFilter) {
    verbFilter = target.dataset.verbFilter;
    if (getRoute()[0] === "verbs") main.innerHTML = verbsView();
  } else if (target.dataset.verbTense) {
    verbTense = target.dataset.verbTense;
    if (getRoute()[0] === "verb") main.innerHTML = verbDetailView(getRoute()[1]);
  } else if (target.dataset.drillTense) {
    if (drillState) drillState = buildDrill(drillState.verb.id, target.dataset.drillTense);
    refreshDrill();
  } else if (target.dataset.phraseCategory) {
    state.phraseCategory = target.dataset.phraseCategory;
    if (getRoute()[0] === "phrases") main.innerHTML = phrasebookView();
  } else if (target.dataset.favPhrase) {
    toggleFavorite(target.dataset.favPhrase);
    const route = getRoute()[0];
    if (route === "phrases") main.innerHTML = phrasebookView();
    else if (route === "practice") main.innerHTML = practiceView("phrases");
  } else if (target.dataset.lessonListen) {
    listenState = buildListening(target.dataset.lessonListen);
    renderListen(target.dataset.lessonListen, true);
  } else if (target.dataset.listenPlay) {
    speakArabic(target.dataset.listenPlay);
  } else if (target.dataset.listenChoice) {
    if (listenState?.answered) return;
    listenState.selected = target.dataset.listenChoice;
    listenState.answered = true;
    touchStreak();
    state.totalReviews = (Number(state.totalReviews) || 0) + 1;
    state.todayReviews = (Number(state.todayReviews) || 0) + 1;
    awardXp(target.dataset.listenChoice === listenState.item.ru ? 6 : 2);
    saveState();
    refreshListen();
  } else if (target.hasAttribute("data-next-listen")) {
    listenState = buildListening(listenState?.lessonId ?? null);
    refreshListen();
  } else if (target.dataset.drillChoice) {
    if (!drillState?.answered) {
      drillState.selected = target.dataset.drillChoice;
      drillState.answered = true;
      recordVerb(drillState.verb.id, target.dataset.drillChoice === drillState.correct.ar);
      refreshDrill();
    }
  } else if (target.hasAttribute("data-next-drill")) {
    drillState = buildDrill(drillState?.verb.id, drillState?.tense || drillTense);
    refreshDrill();
  } else if (target.hasAttribute("data-reset-stats")) {
    if (confirm("Очистить статистику слов, глаголов, XP и серию? Уроки останутся.")) {
      state.wordStats = {};
      state.verbStats = {};
      state.xp = 0;
      state.streak = 0;
      state.bestStreak = 0;
      state.todayDate = "";
      state.lastActive = "";
      state.todayXp = 0;
      state.todayReviews = 0;
      state.totalReviews = 0;
      state.perfectQuiz = false;
      state.achievements = [];
      saveState();
      renderRoute();
      showToast("Статистика очищена");
    }
  } else if (target.hasAttribute("data-reset-progress")) {
    if (confirm("Сбросить весь учебный прогресс на этом устройстве?")) {
      state = { ...defaultState, theme: state.theme };
      saveState();
      renderRoute();
      showToast("Прогресс сброшен");
    }
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.hasAttribute("data-flip-card")) {
    event.preventDefault();
    event.target.click();
  }
  if ((event.key === "Enter" || event.key === " ") && event.target.id === "verbSearch") {
    event.preventDefault();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "verbSearch") {
    const query = event.target.value.trim().toLocaleLowerCase("ru");
    document.querySelectorAll(".verb-card").forEach((card) => {
      const hay = card.dataset.verbSearch || "";
      card.classList.toggle("hidden", query.length > 0 && !hay.includes(query));
    });
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "themeSelect") {
    state.theme = event.target.value;
    saveState();
    setTheme();
  } else if (event.target.id === "transcriptionToggle") {
    state.showTranscription = event.target.checked;
    saveState();
  } else if (event.target.id === "speechRateSelect") {
    state.speechRate = Number(event.target.value);
    saveState();
  } else if (event.target.id === "dailyGoalSelect") {
    state.dailyGoal = Number(event.target.value);
    saveState();
    showToast("Цель дня обновлена");
  }
});

document.querySelector("#brandButton").addEventListener("click", () => routeTo("home"));
document.querySelector("#searchButton").addEventListener("click", () => {
  searchDialog.showModal();
  searchInput.value = "";
  updateSearch("");
  setTimeout(() => searchInput.focus(), 80);
});
searchInput.addEventListener("input", () => updateSearch(searchInput.value));
searchResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-search-open]");
  if (!button) return;
  searchDialog.close();
  routeTo(`lesson/${button.dataset.searchOpen}`);
});
mediaDialog.addEventListener("close", () => { lessonVideo.pause(); lessonVideo.removeAttribute("src"); lessonVideo.load(); });

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.classList.remove("hidden");
});
installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    showToast("Откройте меню браузера и выберите «Добавить на экран Домой»");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.classList.add("hidden");
});

window.addEventListener("hashchange", renderRoute);
const colorSchemeQuery = matchMedia("(prefers-color-scheme: dark)");
const syncSystemTheme = () => { if (state.theme === "system") setTheme(); };
if (colorSchemeQuery.addEventListener) colorSchemeQuery.addEventListener("change", syncSystemTheme);
else colorSchemeQuery.addListener(syncSystemTheme);
setTheme();
touchStreak();
checkAchievements();
if (!location.hash) history.replaceState(null, "", "#/home");
renderRoute();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
