import {
  alphabetGuide,
  courseMeta,
  lessons,
  modules,
  mediaLessons,
  survivalPhrases,
  studyPlan,
  transcriptionGuide,
  verbDrills,
} from "./course-data.js";

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

const STORAGE_KEY = "masri-ru-state-v1";
const defaultState = {
  completed: [],
  lastLesson: "m1l1",
  theme: "system",
  speechRate: 0.82,
  showTranscription: true,
  flashcardIndex: 0,
  flashcardFlipped: false,
  practiceMode: "cards",
};

let state = loadState();
let deferredInstallPrompt = null;
let quizState = null;
let drillState = null;
let listenState = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...defaultState, ...saved };
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
  const root = ["module", "lesson"].includes(route) ? "course" : route;
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

  return `
    <section class="hero">
      <p class="eyebrow">${escapeHtml(courseMeta.levels)} · ${courseMeta.lessonCount} уроков · офлайн</p>
      <h1>${escapeHtml(courseMeta.title)}</h1>
      <p class="arabic-display" lang="ar">${escapeHtml(courseMeta.arabicTitle)}</p>
      <p class="hero-copy">Практический каирский диалект с объяснениями на русском, живыми диалогами, произношением, упражнениями и визуальными уроками.</p>
      <div class="hero-actions">
        <button class="primary-button" type="button" data-open-lesson="${nextLesson.id}">${done ? "Продолжить" : "Начать курс"}</button>
        <button class="soft-button" type="button" data-route="course">Все уроки</button>
      </div>
    </section>

    <section class="stat-grid" aria-label="Статистика курса">
      <article class="stat-card"><strong>${progress}%</strong><span>общий прогресс</span></article>
      <article class="stat-card"><strong>${done}/${lessons.length}</strong><span>уроков завершено</span></article>
      <article class="stat-card"><strong>${vocabTotal}</strong><span>словарных единиц</span></article>
      <article class="stat-card"><strong>${courseMeta.studyWeeks}</strong><span>недель по плану</span></article>
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
        <section class="lesson-section"><h2>Закрепление</h2><p>Пройдите короткий тест по словам этого урока или проверьте понимание на слух. Ответ показывается сразу, а вопросы меняются при повторе.</p>${[6, 7].includes(lesson.module) ? `<p class="muted" style="margin-top:.5rem">Для уроков о глаголах здесь же тренируется спряжение.</p>` : ""}<div class="lesson-actions"><button class="primary-button" type="button" data-lesson-quiz="${lesson.id}">Начать тест</button><button class="primary-button" type="button" data-lesson-listen="${lesson.id}">Аудирование</button>${[6, 7].includes(lesson.module) ? `<button class="primary-button" type="button" data-lesson-drill="${lesson.id}">Спряжение</button>` : ""}<button class="primary-button complete-button ${complete ? "completed" : ""}" type="button" data-toggle-complete="${lesson.id}">${complete ? "✓ Урок завершён" : "Отметить завершённым"}</button></div>${[6, 7].includes(lesson.module) ? `<div id="lessonDrill">${drillView(true)}</div>` : ""}</section>
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
  const modeButtons = `<div class="practice-controls"><button class="${mode === "cards" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="cards">Карточки</button><button class="${mode === "quiz" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="quiz">Общий тест</button><button class="${mode === "phrases" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="phrases">Нужные фразы</button><button class="${mode === "drill" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="drill">Спряжение</button><button class="${mode === "listen" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="listen">Аудирование</button></div>`;
  let body = "";
  if (mode === "quiz") body = quizView(null);
  else if (mode === "phrases") body = survivalView();
  else if (mode === "drill") body = drillView(true);
  else if (mode === "listen") body = listeningView(true);
  else body = flashcardView();
  return `<header class="page-head"><div><p class="eyebrow">Активное повторение</p><h1>Практика</h1><p>Карточки, тест, спряжение и фразы для реальных ситуаций</p></div></header>${modeButtons}<section class="section">${body}</section>`;
}

function allVocab() {
  return lessons.flatMap((lesson) => lesson.vocabulary.map((item) => ({ ...item, lessonId: lesson.id, lessonTitle: lesson.title })));
}

function flashcardView() {
  const deck = allVocab();
  const index = ((state.flashcardIndex % deck.length) + deck.length) % deck.length;
  const item = deck[index];
  const flipped = state.flashcardFlipped;
  return `<div class="flashcard-wrap">
    <div class="flashcard" role="button" tabindex="0" data-flip-card aria-label="Перевернуть карточку">
      ${flipped ? `<div><div class="back-ru">${escapeHtml(item.ru)}</div><div class="front-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<div class="front-tr">${escapeHtml(item.tr)}</div>` : ""}</div>` : `<div><div class="front-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<div class="front-tr">${escapeHtml(item.tr)}</div>` : ""}</div>`}
      <span class="flashcard-hint">Нажмите, чтобы ${flipped ? "скрыть" : "показать"} ответ · ${index + 1}/${deck.length}</span>
    </div>
    <div class="practice-controls"><button class="soft-button" type="button" data-card-step="-1">← Назад</button>${speakButton(item.ar)}<button class="soft-button" type="button" data-card-shuffle>Перемешать</button><button class="primary-button" type="button" data-card-step="1">Дальше →</button></div>
  </div>`;
}

function buildQuiz(lessonId = null, count = 10, direction = "ar") {
  const source = lessonId ? lessons.find((item) => item.id === lessonId).vocabulary : allVocab();
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

function buildDrill(verbIndex = 0) {
  const verb = verbDrills[verbIndex];
  const correct = verb.forms[Math.floor(Math.random() * verb.forms.length)];
  const distractors = shuffle(verb.forms.filter((form) => form.person !== correct.person)).slice(0, 3);
  const options = shuffle([correct, ...distractors]);
  return { verb, correct, options, answered: false, selected: null };
}

function drillView(embedded = false) {
  if (!drillState) {
    drillState = buildDrill(Math.floor(Math.random() * verbDrills.length));
  }
  const { verb, correct, options, answered, selected } = drillState;
  const body = `<div class="card quiz-card">
    <p class="eyebrow">Потренируй спряжение · ${escapeHtml(verb.verb)}</p>
    <div class="quiz-prompt">${escapeHtml(correct.person)} — выбери правильную форму</div>
    <div class="choice-grid">
      ${options.map((form) => {
        let className = "choice-button";
        if (answered && form === correct) className += " correct";
        else if (answered && form === selected) className += " wrong";
        return `<button class="${className}" type="button" data-drill-choice="${escapeHtml(form.ar)}" ${answered ? "disabled" : ""}><span class="arabic" lang="ar">${escapeHtml(form.ar)}</span>${state.showTranscription ? `<small class="vocab-tr">${escapeHtml(form.tr)}</small>` : ""}</button>`;
      }).join("")}
    </div>
    <div class="quiz-feedback">${answered ? (selected === correct ? "✓ Верно" : `Правильный ответ: ${escapeHtml(correct.ar)}`) : ""}</div>
    ${answered ? `<div class="lesson-actions"><button class="primary-button" type="button" data-next-drill>Следующий глагол</button>${speakButton(correct.ar)}</div>` : ""}
  </div>`;
  if (embedded) return body;
  return `<section class="section"><h2>Спряжение глаголов</h2><p class="muted">Проверьте форму настоящего времени для разных лиц.</p>${body}</section>`;
}

function buildListening(lessonId = null) {
  const scope = lessonId ? lessons.find((item) => item.id === lessonId).vocabulary : allVocab();
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
      <div class="setting-row"><span><strong>Сбросить прогресс</strong><small>Отметки уроков и позиция карточек будут удалены</small></span><button class="soft-button" type="button" data-reset-progress>Сбросить</button></div>
    </div>

    <section class="section lesson-section"><h2>Как читать транскрипцию</h2><div class="plan-table"><table><thead><tr><th>Знак</th><th>Как произнести</th><th>Пример</th></tr></thead><tbody>${transcriptionGuide.map((row) => `<tr><td><strong>${escapeHtml(row[0])}</strong></td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="section lesson-section"><h2>Арабский алфавит</h2><p>Буквы пишутся справа налево и меняют вид в зависимости от позиции. Буквы ا د ذ ر ز و не соединяются со следующей буквой слева. В таблице дано каирское разговорное произношение.</p><div class="plan-table"><table><thead><tr><th>Буква</th><th>Название</th><th>Звук</th><th>Пример</th><th>Значение</th></tr></thead><tbody>${alphabetGuide.map((row) => `<tr><td class="arabic" lang="ar" style="font-size:1.4rem;font-weight:800">${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="section lesson-section"><h2>Правильная тренировка</h2><ol class="goal-list"><li>Сначала слушайте целую фразу, не читая транскрипцию.</li><li>Повторяйте одновременно с голосом, затем самостоятельно.</li><li>Записывайте себя на телефон и сравнивайте ритм, а не только отдельные звуки.</li><li>Используйте новые фразы в коротких личных примерах.</li></ol><p class="muted">Системное произношение ar-EG зависит от телефона и может звучать ближе к литературному арабскому. Диалоги и транскрипция курса сохраняют египетские формы.</p></section>`;
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
  else if (target.dataset.speak) speakArabic(target.dataset.speak);
  else if (target.dataset.openMedia) openMedia(target.dataset.openMedia);
  else if (target.dataset.toggleComplete) {
    const id = target.dataset.toggleComplete;
    state.completed = state.completed.includes(id) ? state.completed.filter((item) => item !== id) : [...state.completed, id];
    saveState();
    renderRoute();
    showToast(state.completed.includes(id) ? "Урок отмечен как завершённый" : "Отметка снята");
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
    main.innerHTML = practiceView(target.dataset.practiceMode);
    if (target.dataset.practiceMode === "listen") setTimeout(() => speakArabic(listenState.item.ar), 150);
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
  } else if (target.dataset.lessonQuiz) {
    quizState = buildQuiz(target.dataset.lessonQuiz, 8);
    main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${target.dataset.lessonQuiz}">← Вернуться к уроку</button><section class="section">${quizView(target.dataset.lessonQuiz)}</section>`;
  } else if (target.dataset.quizChoice) {
    if (quizState?.answered) return;
    quizState.selected = target.dataset.quizChoice;
    quizState.answered = true;
    if (quizState.selected === quizState.questions[quizState.index].answer) quizState.score += 1;
    const [route] = getRoute();
    if (route === "practice") main.innerHTML = practiceView("quiz");
    else main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${quizState.lessonId}">← Вернуться к уроку</button><section class="section">${quizView(quizState.lessonId)}</section>`;
  } else if (target.hasAttribute("data-next-question")) {
    if (quizState.index + 1 >= quizState.questions.length) quizState.finished = true;
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
    drillState = buildDrill(Math.floor(Math.random() * verbDrills.length));
    const anchor = document.querySelector("#lessonDrill");
    if (anchor) {
      anchor.innerHTML = drillView(true);
    } else {
      main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${target.dataset.lessonDrill}">← Вернуться к уроку</button>${drillView(true)}`;
    }
  } else if (target.dataset.lessonListen) {
    listenState = buildListening(target.dataset.lessonListen);
    renderListen(target.dataset.lessonListen, true);
  } else if (target.dataset.listenPlay) {
    speakArabic(target.dataset.listenPlay);
  } else if (target.dataset.listenChoice) {
    if (listenState?.answered) return;
    listenState.selected = target.dataset.listenChoice;
    listenState.answered = true;
    refreshListen();
  } else if (target.hasAttribute("data-next-listen")) {
    listenState = buildListening(listenState?.lessonId ?? null);
    refreshListen();
  } else if (target.dataset.drillChoice) {
    if (!drillState?.answered) {
      drillState.selected = target.dataset.drillChoice;
      drillState.answered = true;
      refreshDrill();
    }
  } else if (target.hasAttribute("data-next-drill")) {
    drillState = buildDrill(Math.floor(Math.random() * verbDrills.length));
    refreshDrill();
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
if (!location.hash) history.replaceState(null, "", "#/home");
renderRoute();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
