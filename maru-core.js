/**
 * Maru 2.0 — محركات التطبيق
 * Learning Engine · Progress Engine · Search/Dictionary Engine · Conversation Engine
 * كل الوظائف نقية (pure) وتعمل على كائن حالة يمرره التطبيق، حتى يبقى مصدر الحقيقة واحدًا.
 */

import { conversationScenarios, dailyChallenges, dictionaryParadigms, listeningExercises } from "./maru-data.js";

// ---------------------------------------------------------------------------
// state
// ---------------------------------------------------------------------------

export function createDefaultMaruState() {
  return {
    dictionary: { favorites: [], lists: {}, history: [] },
    stories: { completed: [], stars: {}, learned: [], best: 0 },
    daily: { date: "", progress: {}, listeningMinutes: 0, conversations: 0 },
    skills: { reading: 0, listening: 0, writing: 0, speaking: 0 },
    conversation: { scenarioId: "", mode: "guided", turnIndex: 0, messages: [], finished: false },
    content: { scenarios: null },
    privacy: {
      recordingsLocal: true,
      cloudSync: false,
      analytics: false,
      shareProgress: false,
      recordingNoticeSeen: false,
    },
    preferences: {
      interfaceLang: "ru",
      fontSize: "normal",
      showTranscription: true,
      showLatin: true,
      dailyGoal: 20,
    },
  };
}

export function ensureMaruState(state) {
  const defaults = createDefaultMaruState();
  if (!state || typeof state !== "object") return defaults;
  const merged = { ...defaults, ...(state.maru || {}) };
  for (const key of Object.keys(defaults)) {
    if (defaults[key] && typeof defaults[key] === "object" && !Array.isArray(defaults[key])) {
      merged[key] = { ...defaults[key], ...(merged[key] || {}) };
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

export function normalizeText(value = "") {
  return String(value)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[؟?،,؛;.!()]/g, " ")
    .replace(/[ʿʼʔ']/g, "")
    .replace(/[āáâà]/g, "a")
    .replace(/[īíîì]/g, "i")
    .replace(/[ūúûù]/g, "u")
    .replace(/[ḥḤ]/g, "h")
    .replace(/[ṣẓṭḍ]/g, "s")
    .replace(/[šsh]/g, "sh")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ru");
}

/** Варианты латинской записи: 3 = ع، 7 = ح، aa = ā и т.п. */
export function transliterationAliases(tr = "") {
  const base = String(tr)
    .replace(/[ʿʼʔ']/g, "")
    .replace(/[āáâà]/g, "a")
    .replace(/[īíîì]/g, "i")
    .replace(/[ūúûù]/g, "u")
    .replace(/ḥ/g, "h")
    .replace(/ṣ|ẓ|ṭ|ḍ/g, "s")
    .replace(/kh/g, "5")
    .replace(/gh/g, "g")
    .toLowerCase();
  const arabizi = String(tr)
    .replace(/[ʿʼʔ']/g, "3")
    .replace(/[āáâà]/g, "aa")
    .replace(/[īíîì]/g, "ii")
    .replace(/[ūúûù]/g, "uu")
    .replace(/ḥ/g, "7")
    .replace(/ṣ|ẓ|ṭ|ḍ/g, "s")
    .replace(/sh/g, "sh")
    .replace(/kh/g, "5")
    .toLowerCase();
  const short = arabizi.replace(/aa/g, "a").replace(/ii/g, "i").replace(/uu/g, "u");
  return [...new Set([base, arabizi, short])];
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Learning Engine — التكرار المتباعد / адаптивное повторение
// ---------------------------------------------------------------------------

export const LearningEngine = {
  /** جدول البداية المقترح بالأيام حسب تقييم المتعلم. */
  intervals: { again: 0, hard: 1, good: 3, easy: 7, mastered: 14 },

  defaultStat() {
    return { seen: 0, right: 0, wrong: 0, streak: 0, interval: 0, due: 0, last: 0, lapses: 0 };
  },

  /**
   * تحديث بطاقة ذاكرة بعد تقييم المتعلم.
   * @param {object} stat حالة البطاقة الحالية
   * @param {"again"|"hard"|"good"|"easy"|"mastered"} quality التقييم
   * @param {number} now وقت التقييم بالمللي ثانية
   */
  grade(stat = {}, quality = "good", now = Date.now()) {
    const next = { ...this.defaultStat(), ...stat };
    next.seen += 1;
    next.last = now;
    if (quality === "again") {
      next.wrong += 1;
      next.lapses += 1;
      next.streak = 0;
      next.interval = 0;
      next.due = now + 10 * 60 * 1000;
      return next;
    }
    next.right += 1;
    next.streak += 1;
    const base = this.intervals[quality] ?? this.intervals.good;
    // زيادة تدريجية حسب عدد النجاحات المتتالية، بحد أقصى 30 يومًا.
    const adaptive = quality === "easy" || quality === "mastered"
      ? Math.round(base * (1 + Math.min(next.streak - 1, 4) * 0.4))
      : base;
    next.interval = Math.min(30, Math.max(1, adaptive));
    next.due = now + next.interval * 86400000;
    return next;
  },

  dueItems(state, items, keyOf, now = Date.now()) {
    const stats = state?.wordStats || {};
    return items.filter((item) => {
      const stat = stats[keyOf(item)];
      return stat && Number(stat.due || 0) <= now;
    });
  },

  reviewQueue(state, items, keyOf, limit = 20) {
    const stats = state?.wordStats || {};
    const now = Date.now();
    const due = items
      .filter((item) => stats[keyOf(item)] && Number(stats[keyOf(item)].due || 0) <= now)
      .sort((a, b) => Number(stats[keyOf(a)].due) - Number(stats[keyOf(b)].due));
    const unseen = items.filter((item) => !stats[keyOf(item)]);
    const weak = items
      .filter((item) => stats[keyOf(item)] && Number(stats[keyOf(item)].lapses || 0) > 0 && Number(stats[keyOf(item)].due) > now)
      .sort((a, b) => Number(stats[keyOf(b)].lapses) - Number(stats[keyOf(a)].lapses));
    return [...due, ...weak.slice(0, 5), ...unseen].slice(0, limit);
  },

  /** الخطوات الثابتة لأي درس كما وردت في الخطة. */
  lessonSteps(lesson) {
    return [
      { id: "present", icon: "👀", ru: "الكلمة / الجملة", ar: "المفردة أو الجملة" },
      { id: "translate", icon: "🔤", ru: "الترجمة الروسية", ar: "الترجمة" },
      { id: "transcribe", icon: "🅰", ru: "النطق اللاتيني", ar: "النطق" },
      { id: "listen", icon: "🔊", ru: "الصوت المصري", ar: "الاستماع" },
      { id: "usage", icon: "💬", ru: "الاستخدام اليومي", ar: "الاستخدام" },
      { id: "check", icon: "❓", ru: "سؤال الفهم", ar: "سؤال" },
      { id: "speak", icon: "🎙", ru: "تدريب النطق", ar: "التحدث" },
      { id: "quiz", icon: "✅", ru: "اختبار قصير", ar: "اختبار" },
    ];
  },

  /** بناء اختبار قصير من مفردات الدرس. */
  buildQuiz(items, count = 5, allItems = []) {
    const pool = items.length >= 4 ? items : allItems;
    return pool
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, pool.length))
      .map((item, index) => {
        const distractors = allItems
          .filter((other) => normalizeText(other.ru) !== normalizeText(item.ru))
          .sort(() => Math.random() - 0.5)
          .slice(0, 2)
          .map((other) => other.ru);
        return {
          id: `q${index}`,
          item,
          options: [item.ru, ...distractors].sort(() => Math.random() - 0.5),
          answer: item.ru,
        };
      });
  },
};

// ---------------------------------------------------------------------------
// Progress Engine — التقدم، الأهداف، والمهارات الأربع
// ---------------------------------------------------------------------------

export const ProgressEngine = {
  levelInfo(xp = 0) {
    const level = Math.floor(Number(xp) / 120) + 1;
    const current = Number(xp) % 120;
    return { level, current, next: 120, percent: Math.round((current / 120) * 100) };
  },

  ensureDaily(maru, state) {
    const today = todayKey();
    if (maru.daily.date !== today) {
      maru.daily.date = today;
      maru.daily.progress = {};
      maru.daily.listeningMinutes = 0;
      maru.daily.conversations = 0;
      if (state) state.todayReviews = 0;
    }
    return maru.daily;
  },

  challengeStatus(maru, state) {
    const daily = this.ensureDaily(maru, state);
    return dailyChallenges.map((challenge) => {
      let current = Number(daily.progress[challenge.id] || 0);
      if (challenge.id === "five-words") current = Number(state?.todayReviews || 0);
      if (challenge.id === "one-lesson") current = Number(state?.completed?.length || 0) > 0 ? (daily.progress[challenge.id] ? current : 0) : 0;
      if (challenge.id === "listen") current = Number(daily.listeningMinutes || 0);
      if (challenge.id === "talk") current = Number(daily.conversations || 0);
      return { ...challenge, current: Math.min(current, challenge.target), done: current >= challenge.target, percent: Math.min(100, Math.round((current / challenge.target) * 100)) };
    });
  },

  bumpChallenge(maru, id, amount = 1, state = null) {
    const daily = this.ensureDaily(maru, state);
    daily.progress[id] = Number(daily.progress[id] || 0) + amount;
    return daily.progress[id];
  },

  /** أربع مهارات منفصلة كما أوصت الخطة. */
  skillScores(state) {
    const maru = ensureMaruState(state);
    const stats = state?.wordStats || {};
    const values = Object.values(stats);
    const mastered = values.filter((item) => Number(item.streak || 0) >= 3).length;
    const right = values.reduce((sum, item) => sum + Number(item.right || 0), 0);
    const wrong = values.reduce((sum, item) => sum + Number(item.wrong || 0), 0);
    const listening = Number(state?.listenPlays || 0) + Number(maru.daily.listeningMinutes || 0);
    const speaking = Number(state?.recordingsMade || 0) + Number(maru.daily.conversations || 0) * 3;
    const writing = Number(state?.writingDone?.length || 0);
    const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
    return [
      { id: "reading", score: clamp(mastered * 2 + right / 4), value: `${mastered} слов освоено` },
      { id: "listening", score: clamp(listening * 2), value: `${listening} упражнений` },
      { id: "writing", score: clamp(writing * 8), value: `${writing} заданий` },
      { id: "speaking", score: clamp(speaking * 3), value: `${speaking} попыток` },
    ];
  },

  skillLabel(score) {
    if (score >= 75) return { ru: "уверенно", ar: "بثقة", tone: "good" };
    if (score >= 40) return { ru: "растёт", ar: "في نمو", tone: "medium" };
    if (score > 0) return { ru: "начало", ar: "بداية", tone: "low" };
    return { ru: "не начато", ar: "لم يبدأ", tone: "none" };
  },
};

// ---------------------------------------------------------------------------
// Listening Engine — аудирование на реальных аудиофайлах курса
// ---------------------------------------------------------------------------

export const ListeningEngine = {
  exercises() {
    return listeningExercises;
  },

  exercise(id = "listen-m1l1") {
    return listeningExercises.find((item) => item.id === id) || listeningExercises[0];
  },

  buildSession(exerciseId = "listen-m1l1") {
    const exercise = this.exercise(exerciseId);
    return { exerciseId: exercise.id, index: 0, answers: [], score: 0, finished: false, plays: 0 };
  },

  step(session, choiceIndex = -1) {
    const exercise = this.exercise(session.exerciseId);
    const prompt = exercise.prompts[session.index];
    if (!prompt) return { session: { ...session, finished: true }, feedback: { ok: false, ru: "Упражнение завершено." } };
    const chosen = prompt.options[Number(choiceIndex)] || "";
    const ok = chosen === prompt.answer;
    const next = {
      ...session,
      index: session.index + 1,
      answers: [...(session.answers || []), { ar: prompt.ar, chosen, correct: ok }],
      score: Number(session.score || 0) + (ok ? 1 : 0),
    };
    next.finished = next.index >= exercise.prompts.length;
    return {
      session: next,
      feedback: { ok, ru: ok ? "Верно — вы услышали правильно." : `Правильный ответ: ${prompt.answer}`, ar: prompt.ar },
    };
  },
};

// ---------------------------------------------------------------------------
// Recommendation Engine — слабые слова и следующий урок
// ---------------------------------------------------------------------------

export const RecommendationEngine = {
  weakWords(state, items = [], limit = 8) {
    const stats = state?.wordStats || {};
    return items
      .map((item) => {
        const key = Object.keys(stats).find((candidate) => candidate.endsWith(`:${item.ar}`));
        const stat = key ? stats[key] : null;
        if (!stat) return null;
        const lapses = Number(stat.lapses || 0);
        const wrong = Number(stat.wrong || 0);
        const right = Number(stat.right || 0);
        if (!lapses && wrong <= right) return null;
        return { ...item, lapses, wrong, right, priority: lapses * 2 + wrong - right, stat };
      })
      .filter(Boolean)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  },

  nextLesson(state, lessons = []) {
    const pending = lessons.find((lesson) => !(state?.completed || []).includes(lesson.id));
    if (pending) return { lesson: pending, reason: "new", ru: "Следующий непройденный урок" };
    const last = lessons.find((lesson) => lesson.id === state?.lastLesson);
    if (last) return { lesson: last, reason: "repeat", ru: "Повторите последний урок" };
    return { lesson: lessons[0] || null, reason: "start", ru: "Начните с первого урока" };
  },
};

// ---------------------------------------------------------------------------
// Dictionary Engine — البحث الذكي
// ---------------------------------------------------------------------------

export const DictionaryEngine = {
  /** تحويل مصدر إلى مدخلات موحدة. */
  collectSources({ lessons = [], phrases = [], verbs = [], colors = [] } = {}) {
    const entries = [];
    lessons.forEach((lesson) => {
      (lesson.vocabulary || []).forEach((item) => entries.push({
        key: `${item.ar}::${item.ru}`,
        ar: item.ar,
        tr: item.tr,
        ru: item.ru,
        note: item.note || "",
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        level: lesson.level || "A1",
        kind: "word",
        examples: [],
      }));
    });
    phrases.forEach((item) => entries.push({
      key: `phrase::${item.ar}::${item.ru}`,
      ar: item.ar,
      tr: item.tr,
      ru: item.ru,
      note: item.categoryTitle || "",
      lessonId: "",
      lessonTitle: item.categoryTitle || "Разговорник",
      level: "A1",
      kind: "phrase",
      examples: [],
    }));
    verbs.forEach((verb) => entries.push({
      key: `verb::${verb.id}`,
      ar: verb.ar,
      tr: verb.tr,
      ru: verb.ru,
      note: `${verb.root} · ${verb.pattern}`,
      lessonId: "",
      lessonTitle: verb.ru,
      level: verb.level || "A1",
      kind: "verb",
      examples: verb.example ? [verb.example] : [],
    }));
    (colors || []).forEach((color) => entries.push({
      key: `color::${color.ar}`,
      ar: color.ar,
      tr: color.tr,
      ru: color.ru,
      note: color.fem ? `ж. ${color.femTr}` : "",
      lessonId: "",
      lessonTitle: "Цвета",
      level: "A1",
      kind: "color",
      examples: [],
    }));
    dictionaryParadigms.forEach((item) => entries.push({
      key: `paradigm::${item.id}`,
      ar: item.headword,
      tr: item.tr,
      ru: item.ru,
      note: item.noteRu,
      lessonId: "",
      lessonTitle: item.part,
      level: item.level,
      kind: "paradigm",
      examples: item.examples,
      forms: item.forms,
    }));
    // دمج النطاق نفسه: نفس الكلمة في أكثر من مصدر تظهر مرة واحدة مع أمثلة.
    const map = new Map();
    entries.forEach((entry) => {
      const key = normalizeText(entry.ar);
      if (!map.has(key)) map.set(key, { ...entry, sources: [entry.lessonTitle] });
      else {
        const existing = map.get(key);
        existing.examples = [...(existing.examples || []), ...(entry.examples || [])];
        existing.sources = [...new Set([...(existing.sources || []), entry.lessonTitle])];
        if (entry.forms?.length) existing.forms = entry.forms;
      }
    });
    return [...map.values()];
  },

  search(entries, query = "", filters = {}) {
    const needle = normalizeText(query);
    let result = entries;
    if (needle) {
      result = result.filter((entry) => {
        const haystack = [
          entry.ar, entry.ru, entry.note,
          ...transliterationAliases(entry.tr),
          ...(entry.forms || []).flatMap((f) => [f.ar, f.ru, ...transliterationAliases(f.tr)]),
        ].map(normalizeText).join(" ");
        // البحث بالنطق اللاتيني يعمل بعد إزالة التشكيل والهمزات.
        return haystack.includes(needle);
      });
    }
    if (filters.level && filters.level !== "all") result = result.filter((entry) => entry.level === filters.level);
    if (filters.kind && filters.kind !== "all") result = result.filter((entry) => entry.kind === filters.kind);
    if (filters.favoritesOnly) result = result.filter((entry) => (filters.favorites || []).includes(entry.key));
    return result.slice(0, filters.limit || 120);
  },

  isFavorite(maru, key) {
    return (maru.dictionary.favorites || []).includes(key);
  },

  toggleFavorite(maru, key) {
    const list = maru.dictionary.favorites || [];
    const index = list.indexOf(key);
    if (index >= 0) list.splice(index, 1);
    else list.push(key);
    maru.dictionary.favorites = list;
    return index < 0;
  },

  remember(maru, entry) {
    const history = maru.dictionary.history || [];
    const next = [entry.key, ...history.filter((key) => key !== entry.key)].slice(0, 30);
    maru.dictionary.history = next;
  },

  lists(maru) {
    return Object.keys(maru.dictionary.lists || {});
  },

  addToList(maru, listName, key) {
    const lists = maru.dictionary.lists || {};
    const safeName = String(listName || "Мой список").trim().slice(0, 48);
    lists[safeName] = [...new Set([...(lists[safeName] || []), key])];
    maru.dictionary.lists = lists;
  },

  removeFromList(maru, listName, key) {
    const lists = maru.dictionary.lists || {};
    if (!lists[listName]) return;
    lists[listName] = lists[listName].filter((item) => item !== key);
    if (!lists[listName].length) delete lists[listName];
    maru.dictionary.lists = lists;
  },
};

// ---------------------------------------------------------------------------
// Conversation Engine — المحادثة التفاعلية
// ---------------------------------------------------------------------------

export const ConversationEngine = {
  scenarios() {
    return conversationScenarios;
  },

  scenario(id, list = conversationScenarios) {
    return list.find((item) => item.id === id) || list[0];
  },

  start(scenarioId = "restaurant", mode = "guided", list = conversationScenarios) {
    const scenario = this.scenario(scenarioId, list);
    const learnerIndex = Math.max(0, scenario.turns.findIndex((turn) => turn.speaker === "learner"));
    const opening = scenario.turns.slice(0, learnerIndex).filter((turn) => turn.speaker === "tutor");
    return {
      scenarioId: scenario.id,
      mode,
      turnIndex: learnerIndex,
      messages: opening.map((turn) => ({ role: "tutor", ar: turn.ar, tr: turn.tr, ru: turn.ru })),
      finished: false,
      turnsDone: 0,
    };
  },

  currentTurn(session, list = conversationScenarios) {
    const scenario = this.scenario(session.scenarioId, list);
    return scenario.turns[session.turnIndex] || null;
  },

  suggestions(session, list = conversationScenarios) {
    const turn = this.currentTurn(session, list);
    if (!turn || turn.speaker !== "learner") return [];
    return [turn, ...(turn.alternatives || [])].map((item) => ({ ar: item.ar, tr: item.tr, ru: item.ru }));
  },

  /**
   * خطوة محادثة. في الوضع الموجه نتحقق من وجود إحدى الكلمات الدليلية؛
   * وفي الوضع الحر نختار ردًا مناسبًا حسب الكلمات المفتاحية.
   */
  step(session, input = "", list = conversationScenarios) {
    const scenario = this.scenario(session.scenarioId, list);
    const next = { ...session, messages: [...(session.messages || [])] };
    const turn = scenario.turns[next.turnIndex];
    const text = String(input || "").trim();
    if (!text) return { session: next, feedback: { ok: false, ru: "Напишите или выберите ответ." } };

    next.messages.push({ role: "learner", ar: text, tr: "", ru: "" });
    let feedback;

    if (next.mode === "guided" && turn?.speaker === "learner") {
      const hints = (turn.hints || []).map(normalizeText);
      const typed = normalizeText(text);
      const ok = hints.some((hint) => typed.includes(hint)) || [turn, ...(turn.alternatives || [])].some((alt) => normalizeText(alt.ar) === typed);
      feedback = ok
        ? { ok: true, ru: "Отлично! Именно так говорят по-египетски." }
        : { ok: false, ru: `Попробуйте использовать: ${turn.hints.join(" · ")}`, expected: turn.ar };
      if (ok) {
        next.turnsDone = Number(next.turnsDone || 0) + 1;
        next.turnIndex += 1;
        // Показываем все реплики помощника и останавливаемся на следующем ходе ученика.
        while (next.turnIndex < scenario.turns.length && scenario.turns[next.turnIndex].speaker === "tutor") {
          const reply = scenario.turns[next.turnIndex];
          next.messages.push({ role: "tutor", ar: reply.ar, tr: reply.tr, ru: reply.ru });
          next.turnIndex += 1;
        }
        if (next.turnIndex >= scenario.turns.length) next.finished = true;
      }
      return { session: next, feedback };
    }

    // الوضع الحر: ردود مرنة حسب الكلمات المفتاحية.
    const normalized = normalizeText(text);
    const matched = (scenario.freeReplies || []).find((reply) => reply.keys.some((key) => normalized.includes(normalizeText(key))));
    const reply = matched || scenario.freeFallback;
    next.turnsDone = Number(next.turnsDone || 0) + 1;
    next.messages.push({ role: "tutor", ar: reply.ar, tr: reply.tr, ru: reply.ru });
    if (next.turnsDone >= Math.max(3, scenario.turns.filter((t) => t.speaker === "learner").length)) next.finished = true;
    return { session: next, feedback: { ok: true, ru: matched ? "Естественный ответ!" : "Понятно, продолжайте." } };
  },

  restart(session, list = conversationScenarios) {
    return this.start(session.scenarioId, session.mode, list);
  },
};

// ---------------------------------------------------------------------------
// Privacy — الخصوصية والتخزين
// ---------------------------------------------------------------------------

export const PrivacyEngine = {
  infoLines(maru, recordingCount = 0) {
    return [
      { ru: `Аудиозаписи (${recordingCount}): хранятся только в IndexedDB на этом устройстве.`, icon: "🔒" },
      { ru: maru.privacy.cloudSync ? "Синхронизация включена: данные могут покинуть устройство." : "Синхронизация выключена: данные не покидают устройство.", icon: maru.privacy.cloudSync ? "☁️" : "📴" },
      { ru: maru.privacy.analytics ? "Статистика использования включена." : "Статистика использования выключена.", icon: "📊" },
    ];
  },

  set(maru, key, value) {
    if (key in maru.privacy) {
      maru.privacy[key] = Boolean(value);
      return true;
    }
    return false;
  },
};

// ---------------------------------------------------------------------------
// Backup Engine — экспорт, импорт и шифрование данных пользователя
// ---------------------------------------------------------------------------

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(String(value || ""));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export const BackupEngine = {
  payload(state) {
    return { app: "maru-2.0", version: 2, exportedAt: new Date().toISOString(), state };
  },

  restore(payload) {
    if (!payload || payload.app !== "maru-2.0" || !payload.state || typeof payload.state !== "object") {
      return { ok: false, error: "Это не резервная копия Maru 2.0." };
    }
    const saved = payload.state;
    return {
      ok: true,
      state: {
        ...saved,
        completed: Array.isArray(saved.completed) ? saved.completed : [],
        wordStats: saved.wordStats && typeof saved.wordStats === "object" ? saved.wordStats : {},
        writingDone: Array.isArray(saved.writingDone) ? saved.writingDone : [],
        achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
        maru: ensureMaruState(saved),
      },
    };
  },

  async deriveKey(passphrase, salt) {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  },

  async encrypt(payload, passphrase) {
    if (!passphrase || String(passphrase).length < 4) throw new Error("Пароль должен быть не короче 4 символов.");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(passphrase, salt);
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(payload)));
    return {
      format: "maru-encrypted-v1",
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(cipher)),
    };
  },

  async decrypt(document, passphrase) {
    if (document?.format !== "maru-encrypted-v1") throw new Error("Неизвестный формат зашифрованного файла.");
    const key = await this.deriveKey(passphrase, base64ToBytes(document.salt));
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(document.iv) },
      key,
      base64ToBytes(document.data),
    );
    return JSON.parse(new TextDecoder().decode(plain));
  },
};

// ---------------------------------------------------------------------------
// Content Engine — проверка JSON редактора контента (Admin CMS)
// ---------------------------------------------------------------------------

export const ContentEngine = {
  parseScenarios(text) {
    let data;
    try {
      data = JSON.parse(String(text || ""));
    } catch (error) {
      return { ok: false, error: `Ошибка JSON: ${error.message}` };
    }
    const error = this.validateScenarios(data);
    return error ? { ok: false, error } : { ok: true, data };
  },

  validateScenarios(data) {
    if (!Array.isArray(data) || !data.length) return "Нужен непустой массив сценариев.";
    const ids = new Set();
    for (const scenario of data) {
      if (!scenario.id || !scenario.titleRu || !scenario.titleAr) return `У сценария нет id или заголовка: ${scenario.id || "?"}`;
      if (ids.has(scenario.id)) return `Повторяющийся id сценария: ${scenario.id}.`;
      ids.add(scenario.id);
      if (!Array.isArray(scenario.turns) || !scenario.turns.length) return `Нет реплик в сценарии ${scenario.id}.`;
      if (!scenario.turns.some((turn) => turn.speaker === "learner")) return `Нет хода ученика в сценарии ${scenario.id}.`;
      if (!scenario.freeFallback?.ar) return `Нет ответа по умолчанию в сценарии ${scenario.id}.`;
      for (const turn of scenario.turns) {
        if (!turn.ar || !turn.ru) return `Пустая реплика в сценарии ${scenario.id}.`;
        if (turn.speaker === "learner" && (!turn.hints?.length || !turn.alternatives?.length)) {
          return `Для хода ученика ${scenario.id}/${turn.id} нужны hints и alternatives.`;
        }
      }
    }
    return null;
  },
};
