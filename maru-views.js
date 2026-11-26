/**
 * Maru 2.0 — الشاشات الجديدة
 * الرئيسية المُعاد تصميمها، المحادثة، القاموس الذكي، تحدي اليوم، ولوحة المهارات.
 * كل دالة ترجع HTML وتعتمد على تفويض الأحداث الموجود في app.js.
 */

import {
  ConversationEngine,
  DictionaryEngine,
  LearningEngine,
  ListeningEngine,
  ProgressEngine,
  RecommendationEngine,
  normalizeText,
} from "./maru-core.js";
import { conversationScenarios, dailyChallenges, listeningExercises, skillDefinitions } from "./maru-data.js";

const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const ar = (text, cls = "arabic") => `<span class="${cls}" lang="ar" dir="rtl">${esc(text)}</span>`;

function chip(text, tone = "") {
  return `<span class="maru-chip ${tone}">${esc(text)}</span>`;
}

function progressBar(percent, label = "") {
  return `<span class="progress-track big-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, Math.max(0, percent))}" ${label ? `aria-label="${esc(label)}"` : ""}><span class="progress-fill" style="width:${Math.min(100, Math.max(0, percent))}%"></span></span>`;
}

// ---------------------------------------------------------------------------
// الرئيسية
// ---------------------------------------------------------------------------

export function homeView(ctx) {
  const { state, maru, lessons, vocab, levelGoals } = ctx;
  const done = lessons.filter((lesson) => state.completed.includes(lesson.id)).length;
  const progress = Math.round((done / Math.max(1, lessons.length)) * 100);
  const nextLesson = lessons.find((lesson) => !state.completed.includes(lesson.id)) || lessons.at(-1);
  const level = ProgressEngine.levelInfo(state.xp);
  const challenges = ProgressEngine.challengeStatus(maru, state);
  const challengeDone = challenges.filter((item) => item.done).length;
  const queue = LearningEngine.reviewQueue(state, vocab, (item) => `${item.lessonId || "global"}:${item.ar}`, 5);
  const dueCount = queue.length;
  const words = vocab.slice(0, 5);
  const skills = ProgressEngine.skillScores(state);
  const avgSkill = Math.round(skills.reduce((sum, item) => sum + item.score, 0) / skills.length);
  const name = (state.learnerName || "").trim();
  const hour = new Date().getHours();
  const greetingRu = hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const greetingAr = hour < 5 ? "ليلة سعيدة" : hour < 12 ? "صباح الخير" : "مساء الخير";
  const nextGoal = levelGoals.find((item) => item.id === (nextLesson?.level || "A0")) || levelGoals[0];

  const stats = [
    [lessons.length, "уроков в курсе"],
    [vocab.length, "слов и выражений"],
    [conversationScenarios.length, "жизненных ситуаций"],
    [state.xp || 0, "XP набрано"],
    [level.level, "ваш уровень"],
    [state.streak || 0, "дней подряд"],
    [dueCount, "слов к повторению"],
    [`${challengeDone}/${dailyChallenges.length}`, "заданий дня"],
  ];

  const doors = [
    { route: "quest", icon: "🗺️", title: "Maru Quest", count: "12 миров · 3 игры", desc: "Пройдите путь от первого звука до сертификата: звёзды, боссы-экзамены и мини-игры на настоящих словах курса.", links: [["quest", "Карта пути"], ["arcade", "Аркада"], ["achievements", "Достижения"]] },
    { route: "course", icon: "📖", title: "Курс по модулям", count: `${lessons.length} уроков`, desc: "От первых слов до уверенных диалогов. Аудио, карточки и пошаговые задания в одном месте.", links: [["course", "Модули"], ["programs", "Программы"], ["exams", "Экзамены"]] },
    { route: "basics", icon: "🔤", title: "Местоимения и времена", count: "8 форм · 5 времён", desc: "Все местоимения и все времена одного глагола на одном экране — без лишних переходов.", links: [["reference", "Шпаргалка"], ["verbs", "Глаголы"], ["grammar", "Грамматика"]] },
    { route: "practice", icon: "⚡", title: "Тренажёры", count: "4 режима", desc: "Карточки, умное повторение, спряжение глаголов и аудирование с обратной связью.", links: [["practice/smart", "Повторение"], ["practice/listen", "Аудирование"], ["challenge", "Вызов дня"]] },
    { route: "conversation", icon: "💬", title: "Живые диалоги", count: `${conversationScenarios.length} ситуаций`, desc: "Поговори по-египетски: кафе, такси, рынок, дом и ещё десятки настоящих сценариев.", links: [["conversation", "Начать диалог"], ["practice/speak", "Произношение"]] },
    { route: "dictionary", icon: "📚", title: "Умный словарь", count: `${vocab.length} слов`, desc: "Поиск по русскому, арабскому и латинице. Добавляйте слова в дневник и слушайте произношение.", links: [["dictionary", "Открыть словарь"], ["notebook", "Дневник слов"]] },
    { route: "library", icon: "🎧", title: "Аудио и учебник", count: "46 треков", desc: "Аудиокурс, учебник PDF и все записи уроков доступны офлайн после загрузки.", links: [["library", "Библиотека"], ["offline", "Офлайн-копия"]] },
    { route: "progress", icon: "📈", title: "Прогресс", count: `${progress}% курса`, desc: "Уровни, XP, серия дней и достижения — видно, как растёт ваш египетский.", links: [["progress", "Отчёт"], ["certificate", "Сертификат"]] },
    { route: "settings", icon: "⚙️", title: "Настройки", count: "тема · звук · данные", desc: "Тема, скорость речи, резервная копия и настройки приватности — всё под рукой.", links: [["settings", "Настройки"], ["admin", "Редактор"]] },
  ];

  return `
  <section class="qp-hero" aria-labelledby="qpHeroTitle">
    <div class="qp-dust" aria-hidden="true">
      ${Array.from({ length: 14 }, (_, index) => `<b style="left:${(index * 7.3 + 3) % 100}%;--w:${3 + (index % 3)}px;--h:${3 + ((index + 1) % 3)}px;--d:${13 + (index % 9)}s;--delay:-${index * 1.4}s"></b>`).join("")}
    </div>
    <div class="qp-container">
      <div class="qp-logo-wrap" aria-hidden="true">
        <div class="qp-logo-orbit">
          ${["م", "أ", "ب", "ت", "ث", "ج"].map((letter, index) => `<span class="qp-orb" style="--i:${index}">${letter}</span>`).join("")}
        </div>
        <div class="qp-logo-core">م</div>
      </div>
      <p class="qp-kicker">Maru 2.0 · ${esc(greetingAr)}</p>
      <h1 id="qpHeroTitle">${esc(greetingRu)}${name ? `, ${esc(name)}` : ""}!</h1>
      <p class="qp-hero-tag">Египетский арабский для русскоговорящих · <span class="arabic" lang="ar" dir="rtl">بسيط في الاستخدام، قوي في الداخل</span></p>
      <p class="qp-hero-tag">${esc(nextGoal.ru)} · <span class="arabic" lang="ar" dir="rtl">${esc(nextGoal.ar)}</span></p>

      <form class="qp-hero-search" id="qpHeroSearch" role="search">
        <span aria-hidden="true">⌕</span>
        <label class="sr-only" for="qpHeroInput">Поиск по курсу</label>
        <input id="qpHeroInput" type="search" autocomplete="off" placeholder="Найти слово, урок или фразу…">
        <button class="qp-btn-gold" type="submit">Найти</button>
      </form>

      <div class="qp-cta" aria-label="Быстрый старт">
        <button class="continue-button" type="button" data-open-lesson="${esc(nextLesson?.id || "m1l1")}">
          <span aria-hidden="true">▶</span> ${done ? "Продолжить" : "Начать"} <span class="continue-arrow" aria-hidden="true">→</span>
        </button>
        <button type="button" data-route="course">Все уроки</button>
        <button type="button" data-route="quest">🗺 Квест</button>
        <button type="button" data-route="basics">🔤 Местоимения и времена</button>
        <button type="button" data-route="conversation">💬 Поговорить</button>
      </div>
    </div>
  </section>

  <div class="qp-container">
    <section class="qp-stats-wrap" aria-label="Курс в цифрах">
      <div class="qp-stats">
        ${stats.map(([value, label]) => `<div class="qp-stat"><b>${esc(String(value))}</b><span>${esc(label)}</span></div>`).join("")}
      </div>
      <p class="qp-stats-note">Цифры считаются из вашего прогресса и содержимого курса — и обновляются сами.</p>
    </section>

    <section class="qp-section" aria-labelledby="qpDoorsTitle">
      <header class="qp-section-head">
        <span class="qp-kicker">Академия Maru</span>
        <h2 id="qpDoorsTitle">С чего начать?</h2>
        <p>Восемь дверей курса: слушайте, читайте, повторяйте и говорите. Каждый раздел возвращает вас к живой египетской речи.</p>
      </header>
      <div class="qp-doors">
        ${doors.map((door) => `
          <div class="qp-door">
            <button class="qp-door-main" type="button" data-route="${esc(door.route)}">
              <span class="qp-door-icon" aria-hidden="true">${door.icon}</span>
              <span class="qp-door-title">${esc(door.title)}<em class="qp-door-count">${esc(door.count)}</em></span>
              <span class="qp-door-desc">${esc(door.desc)}</span>
            </button>
            <div class="qp-door-links">
              ${door.links.map(([route, label]) => `<button type="button" data-route="${esc(route)}">${esc(label)} →</button>`).join("")}
            </div>
          </div>`).join("")}
      </div>
    </section>

    <section class="qp-section" aria-labelledby="qpContinueTitle">
      <header class="qp-section-head">
        <span class="qp-kicker">Продолжить · تابع</span>
        <h2 id="qpContinueTitle">Ваш следующий урок</h2>
        <p>${done} из ${lessons.length} уроков пройдено · ${esc(nextGoal.ru)}</p>
      </header>
      <div class="continue-card">
        <div class="continue-card-glow" aria-hidden="true"></div>
        <div class="continue-card-main">
          <p class="eyebrow">${esc(nextLesson?.level || "A0")} · ${esc(nextLesson?.vocabulary?.length || 0)} новых слов</p>
          <h2>${esc(nextLesson?.title || "Первый урок")}</h2>
          <p class="continue-ar" lang="ar" dir="rtl">${esc(nextLesson?.arTitle || "الدرس الأول")}</p>
          <p class="muted">${done ? "Вы уже начали курс — продолжим с того же места." : "Начнём с первого слова и первого звука."}</p>
        </div>
        <div class="continue-card-actions">
          <button class="primary-button" type="button" data-open-lesson="${esc(nextLesson?.id || "m1l1")}">
            <span aria-hidden="true">▶</span> ${done ? "Продолжить" : "Начать"} <span class="continue-arrow" aria-hidden="true">→</span>
          </button>
          <button class="soft-button" type="button" data-route="course">Все уроки</button>
          <button class="soft-button" type="button" data-route="basics">🔤 Местоимения и времена</button>
        </div>
      </div>
    </section>

    <section class="qp-section" aria-labelledby="qpActionsTitle">
      <header class="qp-section-head">
        <span class="qp-kicker">Быстрые действия</span>
        <h2 id="qpActionsTitle">Тренировка на сегодня</h2>
        <p>Три коротких пути: закрепить день, вернуть забытое и начать живой диалог.</p>
      </header>
      <div class="home-tiles">
        <button class="home-tile" type="button" data-route="challenge">
          <span class="home-tile-icon">⚡</span>
          <strong>Тренировка дня</strong>
          <small>${challengeDone} из ${dailyChallenges.length} заданий выполнено</small>
          ${progressBar(Math.round((challengeDone / dailyChallenges.length) * 100))}
        </button>
        <button class="home-tile" type="button" data-route="practice/smart">
          <span class="home-tile-icon">🧠</span>
          <strong>Повторить</strong>
          <small>${dueCount ? `${dueCount} слов ждут повторения` : "все слова на месте"}</small>
          ${progressBar(dueCount ? 60 : 100)}
        </button>
        <button class="home-tile" type="button" data-route="conversation">
          <span class="home-tile-icon">💬</span>
          <strong>Поговори по-египетски</strong>
          <small>${conversationScenarios.length} жизненных ситуаций</small>
          ${progressBar(avgSkill)}
        </button>
      </div>
    </section>

    <section class="qp-section" aria-labelledby="qpArcadeTitle">
      <header class="qp-section-head">
        <span class="qp-kicker">Maru Arcade · ألعاب</span>
        <h2 id="qpArcadeTitle">Учитесь играя</h2>
        <p>Матч пар, диктант по настоящим MP3 и сборка египетских фраз — три короткие игры с XP и без сети.</p>
      </header>
      <div class="quest-next-card">
        <div class="quest-next-glow" aria-hidden="true"></div>
        <div><p class="eyebrow">Новое · 2026</p><h2>🗺️ Maru Quest и 🎮 Аркада</h2><p class="muted">12 миров, 36 уроков, экзамены-боссы и коллекция из 26 достижений.</p></div>
        <div class="quest-head-actions"><button class="primary-button" type="button" data-route="quest">Открыть квест →</button><button class="soft-button" type="button" data-route="arcade">Играть</button></div>
      </div>
    </section>

    <section class="qp-section" aria-labelledby="qpWordsTitle">
      <header class="qp-section-head">
        <span class="qp-kicker">Кلمات اليوم · Слова дня</span>
        <h2 id="qpWordsTitle">Пять слов, которые пригодятся</h2>
        <p>Слушайте произношение и возвращайтесь к словам в тренажёре — они закрепятся сами.</p>
      </header>
      <div class="home-grid">
        <article class="card home-words">
          <div class="section-head compact-head">
            <h2>Словарь дня</h2>
            <button class="link-button" type="button" data-route="dictionary">Весь словарь →</button>
          </div>
          <div class="mini-word-list">
            ${words.map((item, index) => `
              <div class="mini-word-row" data-word-key="${esc(`${item.lessonId || "global"}:${item.ar}`)}">
                <span class="mini-word-index">${index + 1}</span>
                <span class="mini-word-ar arabic" lang="ar" dir="rtl">${esc(item.ar)}</span>
                <span class="mini-word-body"><strong>${esc(item.ru)}</strong><small>${esc(item.tr)}</small></span>
                <button class="mini-icon-button" type="button" data-say="${esc(item.ar)}" aria-label="Прослушать ${esc(item.ar)}">🔊</button>
              </div>`).join("")}
          </div>
          <button class="soft-button wide-button" type="button" data-route="practice/cards">Учить карточки →</button>
        </article>

        <article class="card home-progress-card">
          <div class="section-head compact-head">
            <h2>Путь от A0 к B1</h2>
            <button class="link-button" type="button" data-route="progress">Отчёт →</button>
          </div>
          <div class="home-progress-ring" style="--progress:${progress}">
            <strong>${progress}%</strong><small>курс пройден</small>
          </div>
          <p class="muted small">${done} из ${lessons.length} уроков · 🔥 ${state.streak || 0} дней подряд</p>
          <div class="skill-mini-grid">
            ${skills.map((skill) => `<div class="skill-mini" title="${esc(skill.value)}"><span>${skill.icon || ""}</span><small>${esc(skill.title)}</small><strong>${skill.score}</strong></div>`).join("")}
          </div>
        </article>
      </div>
    </section>

    <section class="qp-section" aria-labelledby="qpReviewTitle">
      <header class="qp-section-head">
        <span class="qp-kicker">Умное повторение</span>
        <h2 id="qpReviewTitle">Вернуть то, что почти забыли</h2>
        <p>Приложение само выбирает слова: сначала просроченные, затем слабые, затем новые.</p>
      </header>
      <div class="home-review-card card">
        <div class="home-review-copy">
          <h2>${dueCount ? `${dueCount} слов ждут вас` : "Все слова на месте"}</h2>
          <p class="muted">Пять минут повторения сегодня — и завтра слова всплывают сами.</p>
        </div>
        <div class="home-review-actions">
          ${queue.slice(0, 3).map((item) => ar(item.ar, "review-word")).join("")}
          <button class="primary-button" type="button" data-route="practice/smart">Начать повторение →</button>
        </div>
      </div>
    </section>
  </div>
  `;
}

// ---------------------------------------------------------------------------
// المحادثة — «تحدث بالمصري»
// ---------------------------------------------------------------------------

export function conversationView(ctx) {
  const { maru } = ctx;
  const scenarios = ctx.scenarios || ConversationEngine.scenarios();
  const session = maru.conversation?.scenarioId ? maru.conversation : ConversationEngine.start("restaurant", "guided", scenarios);
  const scenario = ConversationEngine.scenario(session.scenarioId, scenarios);
  return `
  <header class="page-head">
    <div><p class="eyebrow">تحدث بالمصري · Speaking lab</p><h1>Поговори с египтянином</h1><p>Выберите ситуацию — помощник ответит по-египетски, а перевод и подсказки будут на русском.</p></div>
    <div class="lesson-actions"><button class="soft-button" type="button" data-route="practice/speak">Тренажёр произношения</button></div>
  </header>

  <section class="scenario-strip" aria-label="Ситуации">
    ${scenarios.map((item) => `
      <button class="scenario-card ${item.id === scenario.id ? "active" : ""}" type="button" data-scenario="${esc(item.id)}">
        <span class="scenario-icon" aria-hidden="true">${item.icon}</span>
        <strong>${esc(item.titleRu)}</strong>
        <small lang="ar" dir="rtl">${esc(item.titleAr)}</small>
        ${chip(item.level)}
      </button>`).join("")}
  </section>

  <section class="chat-card card">
    <div class="chat-head">
      <div class="chat-persona">
        <span class="chat-avatar" aria-hidden="true">م</span>
        <div><strong>مريم · Мариам</strong><small>${esc(scenario.titleRu)} · ${esc(scenario.summaryRu)}</small></div>
      </div>
      <div class="chat-modes" role="group" aria-label="Режим диалога">
        <button class="segment-button ${session.mode === "guided" ? "active" : ""}" type="button" data-conversation-mode="guided">С подсказками</button>
        <button class="segment-button ${session.mode === "free" ? "active" : ""}" type="button" data-conversation-mode="free">Свободный</button>
      </div>
    </div>
    <div id="chatMessages" class="chat-messages" aria-live="polite">
      ${chatMessagesHtml(session)}
    </div>
    <div id="chatFeedback" class="chat-feedback" aria-live="polite"></div>
    <div class="chat-composer">
      <div id="chatSuggestions" class="chat-suggestions">${suggestionsHtml(session, scenarios)}</div>
      <form id="chatForm" class="chat-form" autocomplete="off">
        <label class="sr-only" for="chatInput">Ваш ответ по-египетски</label>
        <input id="chatInput" type="text" placeholder="Напишите по-арабски أو اكتب بالعربية…" lang="ar" dir="auto">
        <button class="primary-button" type="submit">Отправить →</button>
      </form>
      <p class="muted small">Подсказка: можно писать русскими буквами — поиск поймёт транскрипцию.</p>
    </div>
  </section>
  `;
}

export function chatMessagesHtml(session) {
  const messages = session.messages || [];
  return messages.map((message) => {
    if (message.role === "tutor") {
      return `<div class="chat-row tutor">
        <span class="chat-bubble-avatar" aria-hidden="true">م</span>
        <div class="chat-bubble">
          <span class="chat-bubble-ar" lang="ar" dir="rtl">${esc(message.ar)}</span>
          <span class="chat-bubble-tr">${esc(message.tr || "")}</span>
          <span class="chat-bubble-ru">${esc(message.ru || "")}</span>
          <button class="bubble-speak" type="button" data-say="${esc(message.ar)}" aria-label="Прослушать">🔊</button>
        </div>
      </div>`;
    }
    return `<div class="chat-row learner">
      <div class="chat-bubble">
        <span class="chat-bubble-ar" lang="ar" dir="auto">${esc(message.ar)}</span>
        ${message.ru ? `<span class="chat-bubble-ru">${esc(message.ru)}</span>` : ""}
      </div>
    </div>`;
  }).join("") || `<p class="muted">Нажмите «Начать диалог».</p>`;
}

export function suggestionsHtml(session, scenarios = null) {
  const suggestions = ConversationEngine.suggestions(session, scenarios || undefined);
  if (!suggestions.length) {
    if (session.finished) return `<span class="chat-finished">✓ Диалог завершён. Начните новый или выберите другую ситуацию.</span>`;
    return "";
  }
  return `<span class="suggestion-label">Можно ответить:</span>${suggestions.map((item, index) => `
    <button class="suggestion-button" type="button" data-chat-suggestion="${index}">
      <span lang="ar" dir="rtl">${esc(item.ar)}</span><small>${esc(item.ru)}</small>
    </button>`).join("")}`;
}

// ---------------------------------------------------------------------------
// القاموس الذكي
// ---------------------------------------------------------------------------

export function dictionaryView(ctx) {
  const { maru, dictionaryEntries } = ctx;
  const filters = ctx.dictionaryFilters || { query: "", level: "all", kind: "all", favoritesOnly: false, historyOnly: false };
  let results = DictionaryEngine.search(dictionaryEntries, filters.query, { ...filters, favorites: maru.dictionary.favorites, limit: 80 });
  if (filters.historyOnly) {
    const keys = maru.dictionary.history || [];
    const byKey = new Map(results.map((entry) => [entry.key, entry]));
    results = keys.map((key) => byKey.get(key)).filter(Boolean);
  }
  if (filters.weakOnly) {
    const stats = ctx.state?.wordStats || {};
    results = results.filter((entry) => {
      const stat = Object.entries(stats).find(([key]) => key.endsWith(`:${entry.ar}`))?.[1];
      return stat && (Number(stat.lapses || 0) > 0 || Number(stat.wrong || 0) > Number(stat.right || 0));
    });
  }
  const lists = DictionaryEngine.lists(maru);
  const favorites = maru.dictionary.favorites || [];

  return `
  <header class="page-head">
    <div><p class="eyebrow">قاموس ذكي · Smart dictionary</p><h1>Словарь по-египетски</h1><p>Поиск по арабскому написанию, русскому переводу и латинской транскрипции. Все формы — только египетский диалект.</p></div>
  </header>

  <section class="dictionary-search card">
    <div class="dictionary-search-row">
      <label class="sr-only" for="dictQuery">Поисковый запрос</label>
      <input id="dictQuery" type="search" value="${esc(filters.query)}" placeholder="عايز / ʿaayiz / 3ayez / хочу…" autocomplete="off">
      <button class="primary-button" type="button" data-dict-search>Найти</button>
    </div>
    <div class="dictionary-filters">
      <label>Уровень
        <select id="dictLevel">
          ${["all", "A0", "A1", "A2", "B1"].map((level) => `<option value="${level}" ${filters.level === level ? "selected" : ""}>${level === "all" ? "Все" : level}</option>`).join("")}
        </select>
      </label>
      <label>Тип
        <select id="dictKind">
          ${[["all", "Всё"], ["word", "Слова"], ["phrase", "Фразы"], ["verb", "Глаголы"], ["paradigm", "Формы"]].map(([value, title]) => `<option value="${value}" ${filters.kind === value ? "selected" : ""}>${title}</option>`).join("")}
        </select>
      </label>
      <button class="filter-button ${filters.favoritesOnly ? "active" : ""}" type="button" data-dict-favorites>★ Избранное (${favorites.length})</button>
      <button class="filter-button" type="button" data-dict-history>🕘 История</button>
      <button class="filter-button ${filters.weakOnly ? "active" : ""}" type="button" data-dict-weak>⚠ Слабые слова</button>
    </div>
    <div class="dictionary-list-row">
      <label>Списки
        <select id="dictList">
          <option value="">Выберите список</option>
          ${lists.map((name) => `<option value="${esc(name)}">${esc(name)} (${(maru.dictionary.lists[name] || []).length})</option>`).join("")}
        </select>
      </label>
      <button class="soft-button" type="button" data-dict-new-list>+ Новый список</button>
    </div>
  </section>

  <section class="dictionary-results" aria-live="polite">
    <p class="muted">Найдено: ${results.length}</p>
    ${results.map((entry) => dictionaryEntryHtml(ctx, entry)).join("") || `<div class="empty-state">Ничего не найдено. Попробуйте другое написание или сбросьте фильтры.</div>`}
  </section>
  `;
}

function dictionaryEntryHtml(ctx, entry) {
  const { maru } = ctx;
  const favorite = DictionaryEngine.isFavorite(maru, entry.key);
  const forms = entry.forms || [];
  const examples = entry.examples || [];
  return `<article class="dictionary-entry card" data-entry-key="${esc(entry.key)}" data-dict-remember="${esc(entry.key)}">
    <div class="dictionary-entry-head">
      <div>
        <span class="dictionary-entry-ar" lang="ar" dir="rtl">${esc(entry.ar)}</span>
        <span class="dictionary-entry-tr">${esc(entry.tr)}</span>
        ${chip(entry.level)}
        ${chip(entry.kind === "word" ? "слово" : entry.kind === "phrase" ? "фраза" : entry.kind === "verb" ? "глагол" : entry.kind === "paradigm" ? "формы" : entry.kind, "soft")}
      </div>
      <div class="dictionary-entry-actions">
        <button class="mini-icon-button" type="button" data-say="${esc(entry.ar)}" aria-label="Прослушать">🔊</button>
        <button class="mini-icon-button ${favorite ? "is-favorite" : ""}" type="button" data-dict-fav="${esc(entry.key)}" aria-label="В избранное">★</button>
        <button class="mini-icon-button" type="button" data-dict-add="${esc(entry.key)}" aria-label="Добавить в список">＋</button>
      </div>
    </div>
    <p class="dictionary-entry-ru"><strong>${esc(entry.ru)}</strong></p>
    ${entry.note ? `<p class="muted small">${esc(entry.note)}</p>` : ""}
    ${forms.length ? `<div class="dictionary-forms">${forms.map((form) => `<div><span lang="ar" dir="rtl">${esc(form.ar)}</span><small>${esc(form.tr)}</small><em>${esc(form.ru)}</em></div>`).join("")}</div>` : ""}
    ${examples.length ? `<div class="dictionary-examples">${examples.map((example) => `<p lang="ar" dir="rtl">${esc(example.ar)}<small>${esc(example.ru)}</small></p>`).join("")}</div>` : ""}
    <p class="muted tiny">Источник: ${esc((entry.sources || [entry.lessonTitle]).join(" · "))}</p>
  </article>`;
}

// ---------------------------------------------------------------------------
// Тренировка дня
// ---------------------------------------------------------------------------

export function challengeView(ctx) {
  const { maru, state } = ctx;
  const challenges = ProgressEngine.challengeStatus(maru, state);
  const done = challenges.filter((item) => item.done).length;
  return `
  <header class="page-head">
    <div><p class="eyebrow">تحدي اليوم · Daily challenge</p><h1>Тренировка дня</h1><p>Четыре коротких задания. 5–10 минут в день достаточно, чтобы язык оставался живым.</p></div>
    <div class="challenge-count">${done} / ${challenges.length}</div>
  </header>
  <section class="challenge-grid">
    ${challenges.map((item, index) => `
      <article class="card challenge-card ${item.done ? "done" : ""}">
        <span class="challenge-icon">${item.icon}</span>
        <div class="challenge-body">
          <p class="eyebrow">Задание ${index + 1}</p>
          <h2>${esc(item.titleRu)}</h2>
          <small lang="ar" dir="rtl">${esc(item.titleAr)}</small>
          <p class="muted">${esc(item.descriptionRu)}</p>
          ${progressBar(item.percent, item.titleRu)}
          <p class="challenge-meta"><strong>${item.current} / ${item.target} ${esc(item.unit)}</strong> · +${item.xp} XP</p>
        </div>
        <button class="${item.done ? "soft-button" : "primary-button"}" type="button" data-route="${esc(item.route)}">${item.done ? "Повторить" : "Начать →"}</button>
      </article>`).join("")}
  </section>
  <section class="card challenge-tip">
    <strong>Как это работает</strong>
    <p class="muted">Прогресс обновляется автоматически, когда вы учите слова, проходите уроки, слушаете аудио и ведёте диалог. Ничего не нужно отмечать вручную.</p>
  </section>`;
}

// ---------------------------------------------------------------------------
// Отчёт о прогрессе / четыре навыка
// ---------------------------------------------------------------------------

export function progressView(ctx) {
  const { state, maru, lessons } = ctx;
  const skills = ProgressEngine.skillScores(state);
  const done = lessons.filter((lesson) => state.completed.includes(lesson.id)).length;
  const level = ProgressEngine.levelInfo(state.xp);
  const challenges = ProgressEngine.challengeStatus(maru, state);
  return `
  <header class="page-head">
    <div><p class="eyebrow">تقرير التطور · Progress report</p><h1>Ваш путь в языке</h1><p>Четыре навыка измеряются отдельно: чтение, аудирование, письмо и говорение.</p></div>
    <button class="soft-button" type="button" data-route="settings">Настройки →</button>
  </header>

  <section class="progress-summary">
    <article class="card"><strong>${Math.round((done / Math.max(1, lessons.length)) * 100)}%</strong><span>курс · ${done}/${lessons.length} уроков</span></article>
    <article class="card"><strong>${state.xp || 0}</strong><span>XP · уровень ${level.level}</span></article>
    <article class="card"><strong>${state.streak || 0}</strong><span>дней подряд</span></article>
    <article class="card"><strong>${Object.keys(state.wordStats || {}).length}</strong><span>слов в памяти</span></article>
  </section>

  <section class="skills-grid">
    ${skills.map((skill) => {
      const def = skillDefinitions.find((item) => item.id === skill.id);
      const label = ProgressEngine.skillLabel(skill.score);
      return `<button class="card skill-card" type="button" data-route="${esc(def?.route || "home")}">
        <span class="skill-icon">${def?.icon || ""}</span>
        <div><strong>${esc(def?.titleRu || skill.id)}</strong><small lang="ar" dir="rtl">${esc(def?.titleAr || "")}</small></div>
        <span class="skill-score">${skill.score}</span>
        ${progressBar(skill.score, def?.titleRu || skill.id)}
        <small class="muted">${esc(skill.value)} · ${esc(label.ru)}</small>
      </button>`;
    }).join("")}
  </section>

  <section class="card">
    <p class="section-kicker">Сегодня</p>
    <h2>Задания дня</h2>
    <div class="progress-task-list">
      ${challenges.map((item) => `<div><span>${item.icon} ${esc(item.titleRu)}</span><strong>${item.current}/${item.target}</strong>${progressBar(item.percent)}</div>`).join("")}
    </div>
  </section>

  ${(() => {
    const weak = RecommendationEngine.weakWords(state, ctx.vocab || [], 6);
    const next = RecommendationEngine.nextLesson(state, lessons);
    if (!weak.length && !next.lesson) return "";
    return `
    <section class="card recommendation-card">
      <p class="section-kicker">Рекомендации</p>
      <h2>Что делать дальше</h2>
      ${next.lesson ? `<p><strong>${esc(next.ru)}:</strong> «${esc(next.lesson.title)}» · ${esc(next.lesson.level)} <button class="link-button" type="button" data-route="guided/${esc(next.lesson.id)}">Открыть →</button></p>` : ""}
      ${weak.length ? `<p class="muted">Слова, которые пока даются труднее всего:</p>
        <div class="weak-word-list">${weak.map((item) => `<button class="weak-word" type="button" data-route="dictionary" data-weak-word="${esc(item.ar)}"><span lang="ar" dir="rtl">${esc(item.ar)}</span><small>${esc(item.ru)}</small><span class="weak-count">${item.wrong} ✗</span></button>`).join("")}</div>` : `<p class="muted">Слабых слов пока нет — так держать!</p>`}
      <button class="soft-button" type="button" data-route="notebook">📓 Мой дневник слов</button>
    </section>`;
  })()}`;
}

// ---------------------------------------------------------------------------
// Настройки интерфейса и приватности (дополнение к существующим)
// ---------------------------------------------------------------------------

export function maruSettingsExtras(ctx) {
  const { maru } = ctx;
  const prefs = maru.preferences;
  const privacy = maru.privacy;
  return `
  <section class="card settings-extra">
    <p class="section-kicker">Интерфейс</p>
    <h2>Удобство</h2>
    <div class="settings-rows">
      <label>Размер шрифта
        <select data-maru-pref="fontSize">
          <option value="normal" ${prefs.fontSize === "normal" ? "selected" : ""}>Обычный</option>
          <option value="large" ${prefs.fontSize === "large" ? "selected" : ""}>Крупный</option>
          <option value="huge" ${prefs.fontSize === "huge" ? "selected" : ""}>Очень крупный</option>
        </select>
      </label>
      <label class="switch-row">Показывать транскрипцию
        <input type="checkbox" data-maru-pref="showTranscription" ${prefs.showTranscription ? "checked" : ""}>
      </label>
    </div>
    <p class="muted small">Язык объяснений — русский; целевой язык — египетский арабский. Переключение языка интерфейса и латиницы пока не реализовано.</p>
  </section>
  <section class="card settings-extra">
    <p class="section-kicker">Приватность · الخصوصية</p>
    <h2>Ваши записи — только ваши</h2>
    <div class="settings-rows">
      <label class="switch-row">Хранить записи только на устройстве
        <input type="checkbox" data-maru-privacy="recordingsLocal" ${privacy.recordingsLocal ? "checked" : ""}>
      </label>
      <label class="switch-row">Синхронизация с облаком (выключена по умолчанию)
        <input type="checkbox" data-maru-privacy="cloudSync" ${privacy.cloudSync ? "checked" : ""}>
      </label>
      <label class="switch-row">Анонимная статистика использования
        <input type="checkbox" data-maru-privacy="analytics" ${privacy.analytics ? "checked" : ""}>
      </label>
    </div>
    <p class="muted small">Аудиозаписи хранятся в IndexedDB браузера и не отправляются на сервер. Их можно удалить в разделе «Мои записи».</p>
  </section>
  <section class="card settings-extra">
    <p class="section-kicker">Данные · البيانات</p>
    <h2>Резервная копия</h2>
    <p class="muted">Прогресс, словарь и настройки хранятся только на этом устройстве. Сделайте копию перед очисткой браузера.</p>
    <div class="lesson-actions">
      <button class="soft-button" type="button" data-route="notebook">📓 Дневник слов и копия</button>
      <button class="soft-button" type="button" data-route="offline">📴 Офлайн-копия курса</button>
      <button class="soft-button" type="button" data-route="offline-dictionary">🔎 Словарь без сети</button>
      <button class="soft-button" type="button" data-route="stories">📖 Истории</button>
      <button class="soft-button" type="button" data-export-backup>⬇ Простая копия (.json)</button>
      <button class="soft-button" type="button" data-route="admin">🛠 Редактор контента</button>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------
// Тренажёр произношения — сравнение образца и своей записи
// ---------------------------------------------------------------------------

export function speakingView(ctx, index = 0) {
  const { state, maru, vocab } = ctx;
  const phrases = (vocab || []).filter((item) => item.ar).slice(0, 60);
  const item = phrases[index % Math.max(1, phrases.length)] || { ar: "أهلاً", tr: "ahlan", ru: "Привет" };
  const difficulty = ["ح", "خ", "ع", "ق", "ص"].find((letter) => item.ar.includes(letter)) || "";
  const hints = difficulty
    ? `Сложный звук «${difficulty}»: найдите его положение в слове и повторите медленно.`
    : "Следите за долгими гласными и ударением, затем сравните запись с образцом.";

  return `
  <header class="page-head">
    <div><p class="eyebrow">Тренажёр произношения</p><h1>Сравните свой голос с образцом</h1><p>Сначала прослушайте носителя, затем запишите себя. Оценка по распознанному тексту не показывает качество звука — поэтому главный инструмент здесь ваше ухо.</p></div>
    <button class="soft-button" type="button" data-route="recordings">🎙 Мои записи</button>
  </header>

  <section class="speaking-grid">
    <article class="card speaking-source">
      <p class="eyebrow">Образец · от носителя</p>
      <div class="guided-ar" lang="ar" dir="rtl">${esc(item.ar)}</div>
      <div class="guided-tr">${esc(item.tr)}</div>
      <p><strong>${esc(item.ru)}</strong></p>
      <button class="primary-button" type="button" data-say="${esc(item.ar)}">▶ Прослушать образец</button>
    </article>
    <article class="card speaking-own">
      <p class="eyebrow">Ваша запись</p>
      <div class="speaking-placeholder" aria-hidden="true">🎙</div>
      <p class="muted">Запишите фразу, затем нажмите «Прослушать мою запись» в окне сравнения.</p>
      <button class="soft-button" type="button" data-record-say="${esc(item.ar)}">● Записать себя</button>
    </article>
  </section>

  <section class="card speaking-tips">
    <strong>Как тренироваться</strong>
    <p class="muted">${esc(hints)}</p>
    <p class="muted small">Записи хранятся локально (IndexedDB) и не отправляются на сервер без вашего согласия.</p>
    <div class="speaking-rate">
      <span>Оцените своё произношение:</span>
      <button class="soft-button danger-soft" type="button" data-speak-rate="again">Надо повторить</button>
      <button class="soft-button" type="button" data-speak-rate="good">Помню</button>
      <button class="primary-button" type="button" data-speak-rate="easy">Звучит близко</button>
    </div>
    <div class="speech-check">
      <button class="soft-button" type="button" data-speech-check="${esc(item.ar)}">🗣 Проверить распознавание</button>
      <p class="muted small">Система попытается распознать вашу речь. Совпадение текста не оценивает качество произношения — это только проверка понятности.</p>
      <div id="speechCheckResult" class="speech-check-result" aria-live="polite"></div>
    </div>
    <div class="lesson-actions"><button class="soft-button" type="button" data-speak-next>Следующая фраза →</button><button class="soft-button" type="button" data-route="practice/cards">К карточкам</button></div>
  </section>

  <p class="muted small">Фраза ${index + 1} из ${phrases.length} · оценок сегодня: ${Number(maru.daily.progress?.speak || 0)}</p>`;
}

// ---------------------------------------------------------------------------
// Пошаговый урок — 8 шагов как в методике Maru
// ---------------------------------------------------------------------------

export function guidedLessonView(ctx, session) {
  const { lesson, wordIndex, step, revealed, choice } = session;
  const steps = LearningEngine.lessonSteps(lesson);
  const item = lesson.vocabulary[wordIndex] || lesson.vocabulary[0];
  const current = steps[step] || steps[0];
  const totalWords = lesson.vocabulary.length;
  const percentDone = Math.round(((step + 1) / steps.length) * 100);
  const wordPercent = Math.round(((wordIndex + 1) / totalWords) * 100);
  const distractors = lesson.vocabulary
    .filter((other) => other.ar !== item.ar && other.ru !== item.ru)
    .slice(0, 2);
  const options = [item.ru, ...distractors.map((other) => other.ru)].sort(() => Math.random() - 0.5);
  const isCorrect = choice === item.ru;

  let body = "";
  if (current.id === "present") {
    body = `<p class="guided-label">Прочитайте и запомните написание</p>
      <div class="guided-ar" lang="ar" dir="rtl">${esc(item.ar)}</div>
      <p class="muted small">Модуль ${lesson.module} · ${esc(lesson.level)} · слово ${wordIndex + 1} из ${totalWords}</p>`;
  } else if (current.id === "translate") {
    body = `<p class="guided-label">Перевод на русский</p><div class="guided-ru">${esc(item.ru)}</div>
      ${item.note ? `<p class="muted">${esc(item.note)}</p>` : ""}`;
  } else if (current.id === "transcribe") {
    body = `<p class="guided-label">Как это звучит по-русски буквами</p>
      <div class="guided-tr">${esc(item.tr)}</div>
      <p class="muted small">Обратите внимание на долгие гласные и гортанные звуки ʿ, ḥ, ʔ.</p>`;
  } else if (current.id === "listen") {
    body = `<p class="guided-label">Прослушайте каирское произношение</p>
      <div class="guided-ar" lang="ar" dir="rtl">${esc(item.ar)}</div>
      <div class="guided-audio-actions">
        <button class="primary-button" type="button" data-say="${esc(item.ar)}">▶ Прослушать</button>
        <button class="soft-button" type="button" data-record-say="${esc(item.ar)}">🎙 Записать себя</button>
      </div>
      <p class="muted small">После прослушивания повторите слово вслух, затем запишите и сравните.</p>`;
  } else if (current.id === "usage") {
    const example = (lesson.dialogue || []).find((line) => line.ar.includes(item.ar)) || (lesson.grammar || []).flatMap((g) => g.examples || []).find((ex) => ex.ar.includes(item.ar));
    body = `<p class="guided-label">Как используют в живой речи</p>
      ${example ? `<div class="guided-example"><span class="guided-ar small" lang="ar" dir="rtl">${esc(example.ar)}</span><span class="guided-tr">${esc(example.tr)}</span><p>${esc(example.ru)}</p></div>` : `<div class="guided-example"><span class="guided-ar small" lang="ar" dir="rtl">${esc(item.ar)}</span><p>${esc(item.ru)}</p></div>`}
      <p class="muted small">Египетский диалект отличается от литературного арабского: обратите внимание на форму обращения и частицу «مش» в отрицании.</p>`;
  } else if (current.id === "check") {
    body = `<p class="guided-label">Что означает это слово?</p>
      <div class="guided-ar small" lang="ar" dir="rtl">${esc(item.ar)}</div>
      <div class="guided-options">${options.map((option) => `<button class="guided-option ${revealed ? (option === item.ru ? "correct" : choice === option ? "wrong" : "") : ""}" type="button" data-guided-choice="${esc(option)}" ${revealed ? "disabled" : ""}>${esc(option)}</button>`).join("")}</div>
      ${revealed ? `<p class="guided-feedback ${isCorrect ? "ok" : "warn"}">${isCorrect ? "Верно!" : `Правильный ответ: ${esc(item.ru)}`}</p>` : ""}`;
  } else if (current.id === "speak") {
    body = `<p class="guided-label">Скажите слово вслух и сравните</p>
      <div class="guided-ar" lang="ar" dir="rtl">${esc(item.ar)}</div>
      <div class="guided-tr">${esc(item.tr)}</div>
      <div class="guided-audio-actions">
        <button class="primary-button" type="button" data-say="${esc(item.ar)}">▶ Образец</button>
        <button class="soft-button" type="button" data-record-say="${esc(item.ar)}">🎙 Ваш голос</button>
        <button class="soft-button" type="button" data-route="recordings">Мои записи</button>
      </div>
      <p class="muted small">Сравните запись с образцом. Оценка по тексту распознавания не показывает качество произношения — доверяйте своему уху и постепенной практике.</p>`;
  } else {
    const quiz = LearningEngine.buildQuiz(lesson.vocabulary, 3, allVocabSafe(ctx));
    body = `<p class="guided-label">Быстрый тест по уроку</p>
      <div class="guided-quiz">${quiz.map((question, index) => `<div class="guided-quiz-item"><span lang="ar" dir="rtl">${esc(question.item.ar)}</span><small>${esc(question.answer)}</small></div>`).join("")}</div>
      <button class="primary-button" type="button" data-guided-finish>Завершить урок ✓</button>`;
  }

  return `
  <button class="soft-button back-button" type="button" data-open-lesson="${esc(lesson.id)}">← К уроку</button>
  <section class="guided-shell">
    <div class="guided-head">
      <div><p class="eyebrow">Пошаговый урок · ${esc(lesson.title)}</p><h1>${esc(current.ru)}</h1><p class="muted">${esc(current.ar)}</p></div>
      <span class="guided-counter">${step + 1} / ${steps.length}</span>
    </div>
    <div class="guided-steps">${steps.map((s, index) => `<button class="guided-step ${index === step ? "active" : ""} ${index < step ? "done" : ""}" type="button" data-guided-goto="${index}" title="${esc(s.ru)}"><span>${s.icon}</span><small>${esc(s.ru)}</small></button>`).join("")}</div>
    <div class="guided-body card">${body}</div>
    <div class="guided-nav">
      <button class="soft-button" type="button" data-guided-back ${step === 0 ? "disabled" : ""}>← Назад</button>
      <span class="muted small">Слово ${wordIndex + 1} из ${totalWords} · ${wordPercent}% пройдено</span>
      <button class="primary-button" type="button" data-guided-next ${step === steps.length - 1 ? "disabled" : ""}>Далее →</button>
    </div>
    <span class="progress-track big-track"><span class="progress-fill" style="width:${percentDone}%"></span></span>
  </section>`;
}

function allVocabSafe(ctx) {
  return (ctx.vocab || []).map((item) => ({ ar: item.ar, ru: item.ru }));
}

/** Быстрый поиск для панели поиска: результаты аналогичны словарю. */
export function quickDictionaryResults(entries, query) {
  return DictionaryEngine.search(entries, query, { limit: 8 });
}

// ---------------------------------------------------------------------------
// Аудирование на реальных файлах курса
// ---------------------------------------------------------------------------

export function listeningLabView(ctx, session = null, feedback = null) {
  const { state } = ctx;
  const exercises = ListeningEngine.exercises();
  const active = session || ListeningEngine.buildSession(exercises[0].id);
  const exercise = ListeningEngine.exercise(active.exerciseId);
  const prompt = exercise.prompts[active.index];
  const answered = active.answers?.[active.index - 1];
  const percent = Math.round((Number(active.index || 0) / exercise.prompts.length) * 100);

  return `
  <header class="page-head">
    <div><p class="eyebrow">Аудирование · الاستماع</p><h1>Слушайте настоящую речь</h1><p>Записи курса звучат по-египетски. Прослушайте фрагмент и выберите, что услышали.</p></div>
    <button class="soft-button" type="button" data-route="practice">К другим тренажёрам →</button>
  </header>

  <section class="card listening-lab">
    <div class="listening-selector">
      <label class="sr-only" for="listeningExercise">Упражнение</label>
      <select id="listeningExercise" data-listen-exercise>
        ${exercises.map((item) => `<option value="${esc(item.id)}" ${item.id === exercise.id ? "selected" : ""}>${esc(item.titleRu)} · ${esc(item.level)}</option>`).join("")}
      </select>
      <span class="maru-chip">${active.score || 0} / ${exercise.prompts.length}</span>
    </div>
    ${progressBar(percent, "Прогресс аудирования")}

    ${active.finished ? `
      <div class="listening-result">
        <p class="eyebrow">Результат</p>
        <h2>${active.score} из ${exercise.prompts.length} верно</h2>
        <p class="muted">${active.score === exercise.prompts.length ? "Отличное понимание на слух!" : "Прослушайте ещё раз и повторите сложные места."}</p>
        <div class="lesson-actions"><button class="primary-button" type="button" data-listen-restart>Повторить упражнение</button><button class="soft-button" type="button" data-route="progress">Мой прогресс</button></div>
      </div>` : `
      <p class="eyebrow">${esc(exercise.titleRu)} · ${esc(exercise.titleAr)}</p>
      <button class="listen-play" type="button" data-listen-track="${esc(exercise.trackId)}">▶ Прослушать запись урока</button>
      <p class="muted small">Файл хранится на устройстве и работает без интернета. Можно нажать кнопку ещё раз.</p>
      <div class="listening-question">
        <p class="guided-label">Вопрос ${active.index + 1} из ${exercise.prompts.length}</p>
        <h2>${esc(prompt.ru)}</h2>
        <div class="listening-ar" lang="ar" dir="rtl">${esc(prompt.ar)}</div>
      </div>
      <div class="choice-grid">
        ${prompt.options.map((option, index) => `<button class="choice-button" type="button" data-listen-answer="${index}">${esc(option)}</button>`).join("")}
      </div>
      <div id="listenFeedback" class="quiz-feedback">${feedback ? `<span class="chat-feedback-pill ${feedback.ok ? "ok" : "warn"}">${esc(feedback.ru)}</span>` : ""}</div>
      ${answered ? `<div class="lesson-actions"><button class="primary-button" type="button" data-listen-next>Следующий вопрос →</button></div>` : ""}`}
  </section>
  <p class="muted small">Сегодня прослушано: ${Math.round(Number(ctx.maru?.daily?.listeningMinutes || 0))} мин · всего воспроизведений: ${state.audioPlays || 0}</p>`;
}

// ---------------------------------------------------------------------------
// Дневник слов и резервная копия
// ---------------------------------------------------------------------------

export function notebookView(ctx) {
  const { state, maru, dictionaryEntries } = ctx;
  const weak = RecommendationEngine.weakWords(state, ctx.vocab || [], 12);
  const favorites = (maru.dictionary.favorites || [])
    .map((key) => dictionaryEntries.find((entry) => entry.key === key))
    .filter(Boolean);
  const lists = Object.entries(maru.dictionary.lists || {});
  return `
  <header class="page-head">
    <div><p class="eyebrow">Дневник слов · مفكرة الكلمات</p><h1>Мои слова</h1><p>Слова, которые даются труднее всего, собираются здесь автоматически. Их можно записать в свой список и выучить.</p></div>
    <button class="soft-button" type="button" data-route="dictionary">📖 Открыть словарь</button>
  </header>

  <section class="card notebook-section">
    <div class="section-head"><div><h2>Слабые слова</h2><p class="muted">Ошибки и повторные просрочки — приоритет на повторение</p></div><span class="maru-chip">${weak.length}</span></div>
    ${weak.length ? `<div class="notebook-list">${weak.map((item) => `
      <div class="notebook-row">
        <span lang="ar" dir="rtl" class="notebook-ar">${esc(item.ar)}</span>
        <span class="notebook-ru">${esc(item.ru)}</span>
        <span class="notebook-stat">${item.wrong} ✗ · ${item.right} ✓</span>
        <button class="mini-icon-button" type="button" data-say="${esc(item.ar)}" aria-label="Прослушать">🔊</button>
      </div>`).join("")}</div>` : `<p class="muted">Пока нет ошибок — продолжайте тренироваться.</p>`}
    <button class="soft-button" type="button" data-route="practice/smart">Повторить сейчас →</button>
  </section>

  <section class="card notebook-section">
    <div class="section-head"><div><h2>Избранное и списки</h2><p class="muted">${favorites.length} в избранном · ${lists.length} списков</p></div></div>
    <div class="notebook-lists">
      ${lists.map(([name, keys]) => `<span class="maru-chip soft">${esc(name)} · ${keys.length}</span>`).join("") || `<span class="muted small">Своих списков пока нет — добавьте их в словаре.</span>`}
    </div>
  </section>

  <section class="card notebook-section">
    <p class="section-kicker">Резервная копия · النسخ الاحتياطي</p>
    <h2>Сохраните свой прогресс</h2>
    <p class="muted">Простая копия — открытый JSON. Копия с паролем шифруется на устройстве (AES-GCM, PBKDF2) и может храниться где угодно, включая облако.</p>
    <div class="backup-controls">
      <label>Пароль (минимум 4 символа)<input id="backupPassphrase" type="password" autocomplete="new-password" placeholder="••••••••"></label>
      <button class="soft-button" type="button" data-export-backup>⬇ Обычная копия</button>
      <button class="primary-button" type="button" data-export-encrypted>🔒 Копия с паролем</button>
      <label class="file-button">⬆ Восстановить из файла<input id="backupFile" type="file" accept=".json,application/json" data-import-backup hidden></label>
    </div>
    <div id="backupStatus" class="backup-status" aria-live="polite"></div>
    <p class="muted small">Внимание: восстановление заменяет текущий прогресс на этом устройстве. Аудиозаписи не входят в копию — они остаются в IndexedDB.</p>
    <button class="soft-button danger-soft" type="button" data-reset-progress>Очистить прогресс</button>
  </section>`;
}

// ---------------------------------------------------------------------------
// Редактор контента (локальный CMS)
// ---------------------------------------------------------------------------

export function offlineView(ctx, stats = null) {
  const online = typeof navigator !== "undefined" ? navigator.onLine !== false : true;
  const total = Number(stats?.total || 0);
  const cached = Number(stats?.cached || 0);
  const percent = total ? Math.round((cached / total) * 100) : 0;
  return `
  <header class="page-head">
    <div><p class="eyebrow">Офлайн-режим · بدون إنترنت</p><h1>Уроки всегда под рукой</h1><p>Аудио, видео, PDF и все разделы курса сохраняются на устройстве. Проверьте готовность перед поездкой.</p></div>
    <button class="soft-button" type="button" data-route="settings">Настройки →</button>
  </header>

  <section class="card offline-card">
    <div class="offline-status ${online ? "online" : "offline"}">
      <span class="offline-status-icon" aria-hidden="true">${online ? "🌐" : "📴"}</span>
      <div><strong>${online ? "Сеть доступна" : "Нет сети — работают загруженные материалы"}</strong><p class="muted">${online ? "Можно обновить копию курса." : "Подключитесь к сети, чтобы обновить материалы."}</p></div>
    </div>
    <p class="eyebrow">Готовность курса</p>
    <h2>${total ? `${cached} из ${total} файлов` : "Проверьте копию"}</h2>
    ${progressBar(percent, "Готовность офлайн-копии")}
    <p class="muted">${stats?.ready ? "✓ Все основные материалы сохранены на устройстве." : total ? "Часть файлов ещё не в кэше — нажмите «Обновить копию»." : "Нажмите «Проверить», чтобы узнать, что уже сохранено."}</p>
    ${stats?.wordTotal ? `<p class="muted small">Слова с голосом: ${stats.wordCached || 0} из ${stats.wordTotal} MP3 · ${stats.wordsReady ? "все слова доступны без сети" : "остальные скачиваются по кнопке ниже"}</p>` : ""}
    ${stats?.missing?.length ? `<p class="muted small">Не в кэше: ${stats.missing.map((path) => `<code>${esc(path)}</code>`).join(", ")}</p>` : ""}
    <div class="lesson-actions">
      <button class="primary-button" type="button" data-cache-check>🔎 Проверить копию</button>
      <button class="soft-button" type="button" data-cache-download ${online ? "" : "disabled"}>⬇ Обновить копию</button>
      <button class="soft-button" type="button" data-cache-words ${online ? "" : "disabled"}>🔊 Скачать все слова</button>
      <button class="soft-button" type="button" data-route="library">Аудио и PDF</button>
    </div>
    <div id="cacheStatus" class="backup-status" aria-live="polite"></div>
  </section>

  <section class="card offline-card">
    <p class="section-kicker">Что работает без сети</p>
    <ul class="offline-list">
      <li>Все 36 уроков, словарь, грамматика и экзамены</li>
      <li>Аудиокурс, видео с субтитрами и PDF-главы учебника</li>
      <li>Свои записи и прогресс (IndexedDB и localStorage)</li>
      <li>Диалоги и пошаговые уроки</li>
    </ul>
    <p class="muted small">Распознавание речи и синхронизация с облаком требуют сети и работают только по вашему согласию.</p>
  </section>`;
}

export function adminView(ctx, editorText = null, message = null) {
  const scenarios = ctx.scenarios || conversationScenarios;
  const text = editorText ?? JSON.stringify(scenarios, null, 2);
  return `
  <header class="page-head">
    <div><p class="eyebrow">Редактор контента · CMS</p><h1>Свои диалоги</h1><p>Измените сценарии в формате JSON и проверьте их сразу в приложении. Изменения хранятся на этом устройстве.</p></div>
    <button class="soft-button" type="button" data-route="conversation">К диалогам →</button>
  </header>
  <section class="card admin-card">
    <div class="section-head"><div><h2>Сценарии общения</h2><p class="muted">${scenarios.length} сценариев · проверка структуры перед применением</p></div></div>
    <label class="sr-only" for="adminJson">JSON сценариев</label>
    <textarea id="adminJson" class="admin-json" spellcheck="false" dir="ltr">${esc(text)}</textarea>
    <div id="adminMessage" class="admin-message ${message?.ok ? "ok" : message ? "warn" : ""}" aria-live="polite">${message ? esc(message.ru) : ""}</div>
    <div class="lesson-actions">
      <button class="primary-button" type="button" data-admin-apply>Проверить и применить</button>
      <button class="soft-button" type="button" data-admin-download>⬇ Скачать JSON</button>
      <button class="soft-button" type="button" data-admin-reset>Вернуть исходные сценарии</button>
    </div>
    <p class="muted small">Структура: массив объектов с полями id, icon, titleRu, titleAr, level, summaryRu, turns[{id, speaker, ar, tr, ru, hints, alternatives}], freeReplies, freeFallback.</p>
  </section>`;
}
