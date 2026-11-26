/**
 * Maru Extras — شاشات القاموس بدون شبكة والقصص التفاعلية.
 * تُعيد HTML فقط؛ الأحداث تُفوّض في app.js مثل بقية الشاشات.
 */

import { StoryEngine } from "./maru-extras.js";

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
  return Array.from({ length: max }, (_, index) =>
    `<span class="quest-star ${index < count ? "on" : ""}" aria-hidden="true">${index < count ? "★" : "☆"}</span>`).join("");
}

// ---------------------------------------------------------------------------
// القاموس بدون اتصال
// ---------------------------------------------------------------------------

export function offlineDictionaryView(ctx = {}) {
  const data = ctx.offlineDictionary || {};
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const filters = data.filters || { query: "", kind: "all", letter: "all", favoritesOnly: false };
  const stats = data.stats || {};
  const letters = Array.isArray(data.letters) ? data.letters : [];
  const favorites = ctx.maru?.dictionary?.favorites || [];

  return `
  <header class="page-head od-hero">
    <div>
      <p class="eyebrow">Offline lexicon · قاموس بلا إنترنت</p>
      <h1 class="glow-heading">كل كلماتك، حتى بدون شبكة</h1>
      <p>بحث فوري في الكلمات والجمل والأفعال والترجمة والنسخ اللاتيني. النطق يعمل من ملفات MP3 المحلية أو من صوت الجهاز — لا يُرسل شيء إلى الإنترنت.</p>
      <div class="od-hero-actions">
        <button class="soft-button" type="button" data-route="dictionary">🧠 القاموس الذكي</button>
        <button class="soft-button" type="button" data-route="offline">📴 حالة النسخة</button>
      </div>
    </div>
  </header>

  <section class="od-stats" aria-label="إحصاءات القاموس">
    <div><b>${Number(stats.total) || 0}</b><small>مدخلات محلية</small></div>
    <div><b>${Number(stats.words) || 0}</b><small>كلمات</small></div>
    <div><b>${Number(stats.phrases) || 0}</b><small>جمل</small></div>
    <div><b>${Number(stats.verbs) || 0}</b><small>أفعال</small></div>
    <div><b>${Number(stats.withAudio) || 0}</b><small>ملفات صوت</small></div>
    <div><b>${favorites.length}</b><small>مفضلة</small></div>
  </section>

  <section class="od-search card">
    <div class="od-search-row">
      <label class="sr-only" for="odQuery">Поиск в словаре</label>
      <input id="odQuery" type="search" value="${esc(filters.query)}" placeholder="قايز / عايز / 3ayez / хочу…" autocomplete="off">
      <select id="odKind" aria-label="Тип записи">
        ${[["all", "كل الأنواع"], ["word", "كلمات"], ["phrase", "جمل"], ["verb", "أفعال"], ["paradigm", "تصريفات"]]
          .map(([value, title]) => `<option value="${value}" ${filters.kind === value ? "selected" : ""}>${title}</option>`).join("")}
      </select>
      <button class="primary-button" type="button" data-od-search>ابحث</button>
    </div>
    <div class="od-chips" role="group" aria-label="الحرف الأول">
      <button class="filter-button ${filters.letter === "all" ? "active" : ""}" type="button" data-od-letter="all">كل الحروف</button>
      ${letters.map((item) => `<button class="filter-button ${filters.letter === item.letter ? "active" : ""}" type="button" data-od-letter="${esc(item.letter)}">${esc(item.letter)} <small>${item.count}</small></button>`).join("")}
    </div>
    <div class="od-search-actions">
      <button class="filter-button ${filters.favoritesOnly ? "active" : ""}" type="button" data-od-favorites>★ المفضلة (${favorites.length})</button>
      <button class="soft-button" type="button" data-od-clear>مسح الفلاتر</button>
    </div>
  </section>

  <section class="od-results" aria-live="polite">
    <p class="muted">النتائج: ${entries.length}</p>
    <div class="od-grid">
      ${entries.map((entry) => offlineCard(entry, favorites.includes(entry.key))).join("") || `<div class="empty-state">لا توجد نتائج. جرّب حرفاً آخر أو اكتب ترجمة روسية.</div>`}
    </div>
  </section>`;
}

function offlineCard(entry, favorite) {
  const key = esc(entry.key);
  const hasAudio = !!entry.audio;
  const examples = Array.isArray(entry.examples) ? entry.examples.slice(0, 2) : [];
  const forms = Array.isArray(entry.forms) ? entry.forms.slice(0, 3) : [];
  return `<article class="od-card" data-dict-remember="${key}">
    <div class="od-card-top">
      <div class="od-card-title">
        ${arabic(entry.ar, "od-ar")}
        ${entry.tr ? `<span class="od-tr">${esc(entry.tr)}</span>` : ""}
      </div>
      <div class="od-card-actions">
        <button class="mini-icon-button ${hasAudio ? "has-file" : ""}" type="button" data-say="${esc(entry.ar)}" data-word-key="${key}" aria-label="Прослушать">🔊</button>
        <button class="mini-icon-button ${favorite ? "is-favorite" : ""}" type="button" data-od-fav="${key}" aria-label="В избранное">★</button>
      </div>
    </div>
    <p class="od-ru"><strong>${esc(entry.ru)}</strong></p>
    <div class="od-tags">
      <span class="od-tag">${esc(entry.level || "A0")}</span>
      <span class="od-tag soft">${esc(entry.kind || "word")}</span>
      ${hasAudio ? `<span class="od-tag audio">MP3 محلي</span>` : ""}
    </div>
    ${forms.length ? `<div class="od-forms">${forms.map((form) => `<span lang="ar" dir="rtl">${esc(form.ar)}</span><small>${esc(form.ru || form.tr || "")}</small>`).join("")}</div>` : ""}
    ${examples.length ? `<div class="od-examples">${examples.map((example) => `<p lang="ar" dir="rtl">${esc(example.ar)}<small>${esc(example.ru || "")}</small></p>`).join("")}</div>` : ""}
  </article>`;
}

// ---------------------------------------------------------------------------
// قائمة القصص
// ---------------------------------------------------------------------------

export function storiesView(ctx = {}) {
  const items = Array.isArray(ctx.stories) ? ctx.stories : [];
  const summary = ctx.storySummary || {};
  const percent = Number(summary.percent) || 0;

  return `
  <header class="page-head story-hero">
    <div>
      <p class="eyebrow">Maru Stories · قصص مارو</p>
      <h1 class="glow-heading">اقرأ، اسمع، وأجب — وتعلّم في السياق</h1>
      <p>ست قصص قصيرة بالعربية المصرية، مع ترجمة ونطق واسئلة فهم. كل إجابة صحيحة تمنحك نجمة وخبرة، وكل قصة تُفتح بعد التي قبلها.</p>
      <div class="story-hero-ring" style="--quest-progress:${percent}%">
        <span><b>${Number(summary.stars) || 0}</b><small>من ${Number(summary.maxStars) || 0} نجمة</small></span>
      </div>
    </div>
  </header>

  <section class="story-summary">
    <div><b>${Number(summary.done) || 0}</b><small>قصص مكتملة</small></div>
    <div><b>${Number(summary.stars) || 0}</b><small>نجوم</small></div>
    <div><b>${percent}%</b><small>إنجاز</small></div>
  </section>

  <section class="story-grid">
    ${items.map((story, index) => `
      <article class="story-card ${story.unlocked ? "" : "locked"} ${story.done ? "done" : ""}" style="--story-color:${["#0f6b45", "#b4762b", "#1c6e8c", "#8a4b7d", "#4c6b2f", "#9a4a35"][index % 6]}">
        <div class="story-cover">
          <span class="story-emoji" aria-hidden="true">${esc(story.emoji || "📖")}</span>
          <span class="story-level">${esc(story.level || "A1")}</span>
          ${story.done ? `<span class="story-done">✓</span>` : ""}
        </div>
        <div class="story-card-body">
          <p class="eyebrow">${esc(story.titleRu)} · ${Number(story.minutes) || 3} دقائق</p>
          <h2 lang="ar" dir="rtl">${esc(story.titleAr)}</h2>
          <p class="muted small">${esc(story.summaryRu)}</p>
          <div class="story-stars">${stars(story.earned)}</div>
          ${bar(story.percent || 0, story.titleRu)}
          ${story.unlocked
            ? `<button class="primary-button" type="button" data-story-open="${esc(story.id)}">${story.done ? "إعادة القراءة" : "ابدأ القصة"}</button>`
            : `<button class="soft-button" type="button" disabled>🔒 أكمل القصة السابقة</button>`}
        </div>
      </article>`).join("")}
  </section>

  <p class="quest-footnote">كل المحتوى محفوظ داخل التطبيق ويعمل بعد تحميل الصفحة الأول — حتى دون اتصال.</p>`;
}

// ---------------------------------------------------------------------------
// شاشة القصة
// ---------------------------------------------------------------------------

export function storyView(ctx = {}, session = {}, feedback = null) {
  const story = ctx.story;
  if (!story) return `<section class="empty-state">القصة غير موجودة. <button class="soft-button" type="button" data-route="stories">العودة للقصص</button></section>`;

  const lines = Array.isArray(story.lines) ? story.lines : [];
  const questions = Array.isArray(story.questions) ? story.questions : [];
  const phase = session.phase || "line";
  const progress = StoryEngine.progressPercent(session, story);
  const feedbackData = feedback || session.feedback;

  let body = "";
  if (phase === "line") {
    const line = lines[session.lineIndex || 0] || lines[0] || {};
    body = `
      <div class="story-line">
        <p class="story-speaker">${esc(line.speaker || "")}</p>
        <p class="story-line-ar" lang="ar" dir="rtl">${esc(line.ar || "")}</p>
        <button class="story-listen" type="button" data-say="${esc(line.ar || "")}" aria-label="Прослушать реплику">🔊 استمع للجملة</button>
        <div class="story-line-ru ${session.revealed ? "shown" : ""}">${session.revealed ? esc(line.ru || "") : "اضغط «اعرف الترجمة» لعرض المعنى"}</div>
        <div class="story-actions">
          <button class="soft-button" type="button" data-story-reveal ${session.revealed ? "disabled" : ""}>اعرف الترجمة</button>
          <button class="primary-button" type="button" data-story-next>${session.lineIndex >= lines.length - 1 ? "أسئلة الفهم" : "التالي"}</button>
        </div>
      </div>`;
  } else if (phase === "question") {
    const question = questions[session.questionIndex || 0] || questions[0] || {};
    const options = Array.isArray(question.options) ? question.options : [];
    body = `
      <div class="story-question">
        <p class="story-q-ru">${esc(question.ru || "")}</p>
        <p class="story-q-ar" lang="ar" dir="rtl">${esc(question.ar || "")}</p>
        <div class="story-choices">
          ${options.map((option, index) => `
            <button class="story-choice ${session.answered ? (index === Number(feedbackData?.expected) ? "correct" : index === session.picked ? "wrong" : "") : ""}" type="button" data-story-choice="${index}" ${session.answered ? "disabled" : ""}>
              ${arabic(option.ar || "")}<small>${esc(option.ru || "")}</small>
            </button>`).join("")}
        </div>
        ${session.answered ? `<p class="game-feedback ${feedbackData?.ok ? "ok" : "warn"}">${feedbackData?.ok ? "أحسنت! +XP" : `الإجابة الصحيحة: ${esc(options[feedbackData?.expected]?.ar || "")}`}${feedbackData?.tip ? ` · ${esc(feedbackData.tip)}` : ""}</p>` : ""}
        ${session.answered ? `<div class="story-actions"><button class="primary-button" type="button" data-story-next>${session.questionIndex >= questions.length - 1 ? "النتيجة" : "السؤال التالي"}</button></div>` : ""}
      </div>`;
  } else {
    const earned = Number(session.stars) || StoryEngine.stars(session.score, questions.length);
    body = `
      <div class="story-finish">
        <span aria-hidden="true">🏁</span>
        <h2>خلصت القصة!</h2>
        <div class="story-finish-stars">${stars(earned)}</div>
        <p>${Number(session.score) || 0} من ${questions.length} إجابات صحيحة · ${8 + earned * 2} XP</p>
        <div class="story-actions">
          <button class="soft-button" type="button" data-story-list>📚 كل القصص</button>
          <button class="soft-button" type="button" data-story-replay>↻ إعادة</button>
          ${story.nextId ? `<button class="primary-button" type="button" data-story-next-story="${esc(story.nextId)}">القصة التالية</button>` : ""}
        </div>
      </div>`;
  }

  return `
  <section class="story-panel" style="--quest-progress:${progress}%">
    <div class="story-panel-head">
      <div>
        <p class="eyebrow">Maru Stories · ${esc(story.level || "A1")}</p>
        <h1 class="glow-heading" lang="ar" dir="rtl">${esc(story.titleAr)}</h1>
        <small>${esc(story.titleRu)}</small>
      </div>
      <button class="mini-icon-button" type="button" data-story-exit aria-label="الخروج">✕</button>
    </div>
    ${bar(progress, story.titleRu)}
    <div class="story-vocab">
      ${story.audioTrack ? `<button class="story-vocab-chip" type="button" data-play-audio="${esc(story.audioTrack)}">🎧 <small>Аудио урока</small></button>` : ""}
      ${(Array.isArray(story.vocab) ? story.vocab : []).slice(0, 4).map((item) => `
        <button class="story-vocab-chip" type="button" data-say="${esc(item.ar)}">
          ${arabic(item.ar || "")}<small>${esc(item.ru || "")}</small>
        </button>`).join("")}
    </div>
    ${body}
  </section>`;
}
