/**
 * Maru Quest — شاشات الرحلة والأركيد.
 * دوال تعيد HTML فقط، وتعتمد على تفويض أحداث app.js كما في بقية المشروع.
 */

const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const arabic = (text, cls = "arabic") => `<span class="${cls}" lang="ar" dir="rtl">${esc(text)}</span>`;

function bar(percent, label = "") {
  const value = Math.min(100, Math.max(0, Number(percent) || 0));
  return `<span class="quest-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}" ${label ? `aria-label="${esc(label)}"` : ""}><span style="width:${value}%"></span></span>`;
}

function stars(count = 0, max = 3) {
  return Array.from({ length: max }, (_, index) => `<span class="quest-star ${index < count ? "on" : ""}" aria-hidden="true">${index < count ? "★" : "☆"}</span>`).join("");
}

// ---------------------------------------------------------------------------
// الرحلة التعليمية
// ---------------------------------------------------------------------------

export function questView(ctx = {}) {
  const chapters = ctx.quest?.chapters || [];
  const summary = ctx.quest?.summary || {};
  const next = ctx.quest?.next;
  const level = ctx.level || { level: 1, percent: 0 };

  return `
  <header class="page-head quest-head">
    <div>
      <p class="eyebrow">Maru Quest · رحلة مارو</p>
      <h1>رحلة من أول حرف إلى الشهادة</h1>
      <p>اثنا عشر عالَمًا، وثلاثة وثلاثون درسًا، واثنا عشر امتحانًا. كل عالم تفتحه بخطوة واحدة، وكل نجمة تعني أنك تقدّمت فعليًا.</p>
      <div class="quest-head-actions">
        <button class="primary-button" type="button" data-route="${next?.status === "mastered" ? "course" : next?.id === "final" ? "certificate" : next?.exam ? `module/${next.moduleId}` : next?.id ? `guided/${next?.moduleId ? `m${next.moduleId}l1` : "m1l1"}` : "course"}">▶ ${next?.id === "final" ? "الشهادة" : "المهمة التالية"}</button>
        <button class="soft-button" type="button" data-route="arcade">🎮 Аркада</button>
        <button class="soft-button" type="button" data-route="achievements">🏅 Достижения</button>
      </div>
    </div>
    <div class="quest-ring" style="--quest-progress:${summary.percent || 0}%" role="img" aria-label="Пройдено ${summary.percent || 0}% пути">
      <span><b>${summary.percent || 0}%</b><small>пути пройдено</small></span>
    </div>
  </header>

  <section class="quest-summary" aria-label="Прогресс пути">
    <div><span class="quest-summary-icon">⭐</span><strong>${summary.stars || 0} / ${summary.maxStars || 0}</strong><small>звёзд собрано</small></div>
    <div><span class="quest-summary-icon">📖</span><strong>${summary.lessonsDone || 0} / ${summary.lessonsTotal || 0}</strong><small>уроков пройдено</small></div>
    <div><span class="quest-summary-icon">⚔️</span><strong>${summary.bosses || 0} / ${chapters.length || 0}</strong><small>боссов побеждено</small></div>
    <div><span class="quest-summary-icon">🜂</span><strong>${level.level || 1}</strong><small>ваш уровень · ${level.percent || 0}%</small></div>
  </section>

  ${next ? `<section class="quest-next-card">
    <div class="quest-next-glow" aria-hidden="true"></div>
    <div><p class="eyebrow">Следующая миссия · المهمة القادمة</p>
      <h2>${esc(next.title)} · ${arabic(next.ar)}</h2>
      <p class="muted">${next.done} из ${next.total} уроков · ${esc(next.level)}</p>
    </div>
    <button class="primary-button" type="button" data-route="${next.id === "final" ? "certificate" : next.exam ? `module/${next.moduleId}` : `module/${next.moduleId}`}">Открыть →</button>
  </section>` : ""}

  <div class="quest-path" aria-label="Карта мира">
    <div class="quest-path-line" aria-hidden="true"></div>
    ${chapters.map((chapter, index) => `
      <article class="quest-node ${chapter.status} ${index % 2 ? "quest-node-right" : "quest-node-left"}" style="--node-color:${esc(chapter.color || "#0b4a31")}">
        <div class="quest-node-dot" aria-hidden="true"><span>${chapter.exam ? "⚔️" : chapter.status === "mastered" ? "★" : chapter.number}</span></div>
        <div class="quest-node-card">
          <div class="quest-node-top">
            <span class="quest-node-number">${chapter.number === chapters.length ? "🏁" : `Мир ${chapter.number}`}</span>
            <span class="quest-node-stars">${stars(chapter.stars)}</span>
          </div>
          <h2>${esc(chapter.title)}</h2>
          <p class="quest-node-ar" lang="ar" dir="rtl">${esc(chapter.ar)}</p>
          <p class="muted small">${esc(chapter.level)} · ${chapter.done} / ${chapter.total} уроков ${chapter.exam ? "· экзамен сдан" : ""}</p>
          ${bar(chapter.percent, `Прогресс: ${chapter.title}`)}
          <div class="quest-node-actions">
            ${chapter.unlocked ? chapter.id === "final"
              ? `<button class="soft-button" type="button" data-route="certificate">${chapter.status === "mastered" ? "Сертификат" : "Финал"} →</button>`
              : `<button class="soft-button" type="button" data-open-module="${esc(chapter.moduleId)}">${chapter.status === "mastered" ? "Повторить" : "Войти"} →</button>`
              : `<span class="quest-lock">🔒 Откройте предыдущий мир</span>`}
            ${chapter.id !== "final" && chapter.percent === 100 ? `<button class="soft-button" type="button" data-start-exam="${esc(chapter.moduleId)}">⚔️ Босс</button>` : ""}
            ${chapter.id === "final" && chapter.exam ? `<button class="soft-button" type="button" data-route="certificate">🏆 Сертификат</button>` : ""}
          </div>
        </div>
      </article>`).join("")}
  </div>
  <p class="quest-footnote">Звёзды и боссы рассчитываются из вашего реального прогресса: уроков, экзаменов и сертификата. Всё хранится только на этом устройстве.</p>`;
}

// ---------------------------------------------------------------------------
// Достижения
// ---------------------------------------------------------------------------

export function achievementsView(ctx = {}) {
  const items = ctx.achievements || [];
  const summary = ctx.achievementSummary || { earned: 0, total: 0, percent: 0 };
  const filter = ctx.achievementFilter || "all";
  const shown = AchievementViewFilter(items, filter);
  return `
  <header class="page-head">
    <div><p class="eyebrow">Достижения · الإنجازات</p><h1>Ваша коллекция побед</h1><p>Каждый значок подтверждён реальным действием: уроком, повторением, экзаменом или записанной речью.</p></div>
    <button class="soft-button" type="button" data-route="quest">🗺 Квест →</button>
  </header>
  <section class="achievement-hero">
    <div class="achievement-hero-ring" style="--quest-progress:${summary.percent}%" role="img" aria-label="${summary.percent}% достижений"><span><b>${summary.earned}</b><small>из ${summary.total}</small></span></div>
    <div><h2>${summary.percent}% коллекции собрано</h2>${bar(summary.percent, "Достижения")}<p class="muted">Легендарные значки открываются после всего курса и итогового экзамена.</p></div>
  </section>
  <div class="achievement-filters segmented" role="group" aria-label="Фильтр достижений">
    ${[["all", "Все"], ["earned", "Полученные"], ["locked", "В процессе"]].map(([id, label]) => `<button class="${filter === id ? "active" : ""}" type="button" data-achievement-filter="${id}" aria-pressed="${filter === id}">${label}</button>`).join("")}
  </div>
  <div class="achievement-gallery">
    ${shown.length ? shown.map((item) => `
      <article class="achievement-card ${item.earned ? "earned" : "locked"} rarity-${esc(item.rarity)}">
        <span class="achievement-card-icon" aria-hidden="true">${item.earned ? esc(item.icon) : "🔒"}</span>
        <strong>${esc(item.title)}</strong>
        <small>${esc(item.desc)}</small>
        <span class="achievement-card-status">${item.earned ? "✓ Получено" : "В процессе"}</span>
      </article>`).join("") : `<div class="empty-state">Здесь пока пусто — продолжайте учиться, и значки появятся.</div>`}
  </div>`;
}

function AchievementViewFilter(items, mode) {
  if (mode === "earned") return items.filter((item) => item.earned);
  if (mode === "locked") return items.filter((item) => !item.earned);
  return items;
}

// ---------------------------------------------------------------------------
// Аркада и календарь серии
// ---------------------------------------------------------------------------

export function arcadeView(ctx = {}) {
  const calendar = ctx.calendar || { days: [], streak: 0, activeDays: 0, xp: 0 };
  const games = [
    { route: "practice/match", icon: "🃏", title: "Матч пар", ar: "طابق الكلمات", desc: "Соедините арабское слово с русским переводом. Считаются ходы и ошибки." },
    { route: "practice/dictation", icon: "✍️", title: "Арабский диктант", ar: "الإملاء", desc: "Прослушайте mp3 курса и напишите слово по-арабски. Подсказка — первая буква." },
    { route: "practice/builder", icon: "🧱", title: "Собери фразу", ar: "ركّب الجملة", desc: "Из перемешанных слов соберите настоящую египетскую фразу." },
  ];
  return `
  <header class="page-head">
    <div><p class="eyebrow">Maru Arcade · ألعاب مارو</p><h1>Учитесь играя</h1><p>Три мини-игры на настоящих словах и фразах курса. Работают офлайн и начисляют XP в общий прогресс.</p></div>
    <button class="soft-button" type="button" data-route="quest">🗺 Квест →</button>
  </header>
  <div class="arcade-grid">
    ${games.map((game) => `<button class="game-tile" type="button" data-route="${game.route}">
      <span class="game-tile-icon" aria-hidden="true">${game.icon}</span>
      <strong>${esc(game.title)}</strong>
      <span class="game-tile-ar" lang="ar" dir="rtl">${esc(game.ar)}</span>
      <small>${esc(game.desc)}</small>
      <span class="game-tile-arrow">Играть →</span>
    </button>`).join("")}
  </div>
  <section class="streak-panel">
    <header class="section-head compact-head"><div><h2>Серия занятий</h2><p class="muted">Каждый квадрат — день с реальной активностью в курсе.</p></div></header>
    <div class="streak-stats"><div><b>${calendar.streak}</b><small>дней подряд</small></div><div><b>${calendar.activeDays}</b><small>активных дней за 35</small></div><div><b>${calendar.xp}</b><small>XP за этот период</small></div></div>
    <div class="calendar-grid" aria-label="Календарь занятий за 35 дней">
      ${calendar.days.map((day) => `<span class="calendar-cell level-${day.level}" title="${esc(day.key)} · ${day.xp} XP, ${day.reviews} повторений"><span>${esc(day.key.slice(8))}</span></span>`).join("")}
    </div>
    <p class="muted small">Уровень цвета зависит от XP за день: темнее — больше занимались.</p>
  </section>`;
}

// ---------------------------------------------------------------------------
// Игра 1 —_match пар
// ---------------------------------------------------------------------------

export function matchGameView(ctx = {}, session = {}, feedback = null) {
  const matched = Number(session.matched?.length || 0);
  const total = Number(session.pairs?.length || 0);
  return `
  <header class="page-head game-head">
    <div><p class="eyebrow">Maru Arcade · المطابقة</p><h1>Матч пар</h1><p>Нажмите арабское слово и его русский перевод. Чем меньше ходов — тем лучше.</p></div>
    <button class="soft-button" type="button" data-route="arcade">К аркаде →</button>
  </header>
  <section class="game-panel">
    <div class="game-hud">
      <span>Пары <b>${matched} / ${total}</b></span><span>Ходы <b>${session.moves || 0}</b></span><span>Ошибки <b>${session.errors || 0}</b></span>
      <button class="soft-button" type="button" data-match-new>↻ Новая игра</button>
    </div>
    <div id="matchFeedback" class="game-feedback ${feedback?.ok ? "ok" : feedback ? "warn" : ""}" aria-live="polite">${feedback ? esc(feedback.message || "") : ""}</div>
    <div class="match-board">
      ${(session.deck || []).map((card) => `
        <button class="match-card ${session.matched?.includes(card.pairId) ? "matched" : ""} ${session.picked?.includes(card.id) ? "picked" : ""} ${feedback?.wrongPair === card.pairId ? "wrong" : ""}" type="button" data-match-card="${esc(card.id)}" ${session.matched?.includes(card.pairId) ? "disabled" : ""}>
          <span class="match-card-text ${card.lang === "ar" ? "arabic" : ""}" ${card.lang === "ar" ? 'lang="ar" dir="rtl"' : ""}>${esc(card.text)}</span>
          ${card.kind === "ar" && card.tr ? `<small>${esc(card.tr)}</small>` : ""}
        </button>`).join("")}
    </div>
    ${session.finished ? `<div class="game-finish"><span>🏆</span><h2>Все пары найдены!</h2><p>${session.moves} ходов · ${session.errors} ошибок · +25 XP</p><div class="lesson-actions"><button class="primary-button" type="button" data-match-new>Играть ещё</button><button class="soft-button" type="button" data-route="arcade">Другие игры</button></div></div>` : ""}
  </section>`;
}

// ---------------------------------------------------------------------------
// Игра 2 — диктант
// ---------------------------------------------------------------------------

export function dictationView(ctx = {}, session = {}, feedback = null) {
  const questions = session.questions || [];
  const index = Math.min(Number(session.index || 0), Math.max(0, questions.length - 1));
  const question = questions[index];
  if (!question) return `<div class="empty-state">Нет слов для диктанта. <button class="soft-button" type="button" data-route="arcade">К аркаде</button></div>`;
  return `
  <header class="page-head game-head">
    <div><p class="eyebrow">Maru Arcade · الإملاء</p><h1>Арабский диктант</h1><p>Слушайте запись курса и введите слово арабскими буквами. Ошибки в огласовках не считаются.</p></div>
    <button class="soft-button" type="button" data-route="arcade">К аркаде →</button>
  </header>
  <section class="game-panel dictation-panel">
    <div class="game-hud"><span>Вопрос <b>${index + 1} / ${questions.length}</b></span><span>Верно <b>${session.score || 0}</b></span><button class="soft-button" type="button" data-dictation-new>↻ Заново</button></div>
    ${bar(Math.round(((index + (feedback?.ok ? 1 : 0)) / Math.max(1, questions.length)) * 100), "Диктант")}
    <div class="dictation-prompt">
      <button class="primary-button" type="button" data-say="${esc(question.ar)}">▶ Прослушать</button>
      <p class="muted small">Подсказка: ${arabic(question.hint)} · ${esc(question.ru)}</p>
    </div>
    <label class="sr-only" for="dictationInput">Слово арабскими буквами</label>
    <input id="dictationInput" class="dictation-input" type="text" dir="rtl" lang="ar" autocomplete="off" spellcheck="false" placeholder="اكتب الكلمة هنا" value="${esc(feedback?.keep || "")}">
    <div id="dictationFeedback" class="game-feedback ${feedback?.ok ? "ok" : feedback ? "warn" : ""}" aria-live="polite">${feedback ? esc(feedback.message || "") : ""}</div>
    <div class="lesson-actions">
      ${feedback?.ok ? `<button class="primary-button" type="button" data-dictation-next>Следующее слово →</button>` : `<button class="primary-button" type="button" data-dictation-check>Проверить</button>`}
      <button class="soft-button" type="button" data-dictation-hint>Подсказка</button>
      <button class="soft-button" type="button" data-dictation-skip>Пропустить</button>
    </div>
    ${session.finished ? `<div class="game-finish"><span>✍️</span><h2>Диктант завершён</h2><p>${session.score || 0} из ${questions.length} слов написано верно</p><div class="lesson-actions"><button class="primary-button" type="button" data-dictation-new>Ещё раз</button><button class="soft-button" type="button" data-route="arcade">К аркаде</button></div></div>` : ""}
  </section>`;
}

// ---------------------------------------------------------------------------
// Игра 3 — сборка фразы
// ---------------------------------------------------------------------------

export function builderView(ctx = {}, session = {}, feedback = null) {
  const questions = session.questions || [];
  const index = Math.min(Number(session.index || 0), Math.max(0, questions.length - 1));
  const question = questions[index];
  if (!question) return `<div class="empty-state">Нет фраз для сборки. <button class="soft-button" type="button" data-route="arcade">К аркаде</button></div>`;
  const selected = Array.isArray(session.selected) ? session.selected : [];
  return `
  <header class="page-head game-head">
    <div><p class="eyebrow">Maru Arcade · التركيب</p><h1>Собери фразу</h1><p>Нажимайте на слова в правильном порядке. Можно убрать последнее слово и вернуться назад.</p></div>
    <button class="soft-button" type="button" data-route="arcade">К аркаде →</button>
  </header>
  <section class="game-panel builder-panel">
    <div class="game-hud"><span>Фраза <b>${index + 1} / ${questions.length}</b></span><span>Верно <b>${session.score || 0}</b></span><button class="soft-button" type="button" data-builder-new>↻ Заново</button></div>
    ${bar(Math.round(((index + (feedback?.ok ? 1 : 0)) / Math.max(1, questions.length)) * 100), "Сборка фраз")}
    <div class="builder-translation"><span class="eyebrow">Перевод</span><strong>${esc(question.ru)}</strong><small>${esc(question.tr)}</small></div>
    <div class="builder-slot ${selected.length ? "" : "empty"}" aria-label="Собранная фраза" lang="ar" dir="rtl">
      ${selected.length ? selected.map((item, position) => `<button type="button" class="builder-selected" data-builder-remove="${position}" aria-label="Убрать слово ${esc(item)}">${esc(item)}</button>`).join("") : "اضغط على الكلمات لبناء الجملة"}
    </div>
    <div class="builder-tokens" aria-label="Доступные слова" lang="ar" dir="rtl">
      ${question.tokens.map((token, position) => `<button type="button" class="builder-token ${selected.includes(position) ? "used" : ""}" data-builder-token="${position}" ${selected.includes(position) ? "disabled" : ""}>${esc(token)}</button>`).join("")}
    </div>
    <div id="builderFeedback" class="game-feedback ${feedback?.ok ? "ok" : feedback ? "warn" : ""}" aria-live="polite">${feedback ? esc(feedback.message || "") : ""}</div>
    <div class="lesson-actions">
      ${feedback?.ok ? `<button class="primary-button" type="button" data-builder-next>Следующая фраза →</button>` : `<button class="primary-button" type="button" data-builder-check>Проверить</button>`}
      <button class="soft-button" type="button" data-builder-undo>← Убрать слово</button>
      <button class="soft-button" type="button" data-builder-clear>Очистить</button>
      <button class="soft-button" type="button" data-builder-skip>Пропустить</button>
    </div>
    ${session.finished ? `<div class="game-finish"><span>🧱</span><h2>Фразы собраны</h2><p>${session.score || 0} из ${questions.length} фраз без ошибок</p><div class="lesson-actions"><button class="primary-button" type="button" data-builder-new>Ещё раз</button><button class="soft-button" type="button" data-route="arcade">К аркаде</button></div></div>` : ""}
  </section>`;
}
