/**
 * Maru Quest — محركات المسار التعليمي والآركيد.
 * منطق نقي بالكامل: لا DOM، لا شبكة، لا تخزين. كل شيء يعمل داخل GitHub Pages
 * وحتى دون اتصال، لأنه يعتمد فقط على البيانات المحلية وحالة المتعلم.
 */

import { normalizeText } from "./maru-core.js";

const defaultRandom = () => Math.random();

export function shuffle(items, random = defaultRandom) {
  const out = [...items];
  for (let index = out.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [out[index], out[next]] = [out[next], out[index]];
  }
  return out;
}

function uniqueBy(items, keyOf) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyOf(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Quest Engine — خريطة الموديولات كرحلة ذات نجوم ومدارس/بوسات
// ---------------------------------------------------------------------------

export const QuestEngine = {
  /** تبني فصول الرحلة من الموديولات والدروس الحقيقية (لا بيانات مكررة). */
  chapters(modules = [], lessons = [], state = {}, examPassed = () => false, certificateEligible = false) {
    const completed = Array.isArray(state.completed) ? state.completed : [];
    let previousStarted = true;

    const chapters = modules.map((module, index) => {
      const items = lessons.filter((lesson) => lesson.module === module.id);
      const done = items.filter((lesson) => completed.includes(lesson.id)).length;
      const exam = !!examPassed(`module-${module.id}`);
      const ratio = items.length ? done / items.length : 0;
      const stars = done === 0 ? 0 : ratio >= 1 ? 3 : ratio >= 0.5 ? 2 : 1;
      const unlocked = index === 0 || previousStarted;
      const status = exam ? "mastered" : ratio >= 1 ? "ready" : done > 0 ? "active" : unlocked ? "available" : "locked";
      previousStarted = done > 0 || exam;
      return {
        id: `module-${module.id}`,
        moduleId: module.id,
        number: index + 1,
        title: module.title,
        ar: module.ar,
        level: module.level,
        color: module.color,
        image: module.image,
        total: items.length,
        done,
        percent: Math.round(ratio * 100),
        stars,
        exam,
        unlocked,
        status,
      };
    });

    const finalExam = !!examPassed("final");
    chapters.push({
      id: "final",
      moduleId: "final",
      number: chapters.length + 1,
      title: "الشهادة · Финал",
      ar: "الشهادة النهائية",
      level: "B1",
      color: "#d8a455",
      image: "",
      total: 1,
      done: finalExam && certificateEligible ? 1 : 0,
      percent: finalExam && certificateEligible ? 100 : finalExam ? 60 : 0,
      stars: finalExam && certificateEligible ? 3 : finalExam ? 2 : 0,
      exam: finalExam,
      unlocked: chapters.every((item) => item.done > 0 || item.exam),
      status: finalExam && certificateEligible ? "mastered" : finalExam ? "ready" : "locked",
    });
    return chapters;
  },

  summary(chapters = []) {
    const stars = chapters.reduce((sum, item) => sum + Number(item.stars || 0), 0);
    const maxStars = chapters.length * 3;
    const lessonsDone = chapters.reduce((sum, item) => sum + Number(item.done || 0), 0);
    const lessonsTotal = chapters.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const bosses = chapters.filter((item) => item.exam).length;
    return {
      stars,
      maxStars,
      lessonsDone,
      lessonsTotal,
      bosses,
      percent: maxStars ? Math.round((stars / maxStars) * 100) : 0,
      mastered: chapters.filter((item) => item.status === "mastered").length,
    };
  },

  next(chapters = []) {
    return chapters.find((item) => item.unlocked && item.status !== "mastered")
      || chapters.find((item) => item.status !== "mastered")
      || chapters.at(-1)
      || null;
  },
};

// ---------------------------------------------------------------------------
// Arcade Engine — مطابقة، إملاء، وبناء جمل
// ---------------------------------------------------------------------------

export const ArcadeEngine = {
  buildMatch(vocab = [], count = 6, random = defaultRandom) {
    const pool = uniqueBy(vocab.filter((item) => item?.ar && item?.ru), (item) => normalizeText(item.ru));
    const pairs = shuffle(pool, random).slice(0, Math.max(2, Math.min(count, pool.length)))
      .map((item, index) => ({ ...item, pairId: `p${index}` }));
    const deck = shuffle(pairs.flatMap((item) => [
      { id: `${item.pairId}-ar`, pairId: item.pairId, text: item.ar, kind: "ar", tr: item.tr, ru: item.ru, lang: "ar" },
      { id: `${item.pairId}-ru`, pairId: item.pairId, text: item.ru, kind: "ru", tr: item.tr, ar: item.ar, lang: "ru" },
    ]), random);
    return { pairs, deck, picked: [], matched: [], moves: 0, errors: 0, finished: pairs.length === 0 };
  },

  matchStep(session, cardId) {
    if (!session || session.finished) return { session, status: "ignored" };
    const card = session.deck.find((item) => item.id === cardId);
    if (!card || session.matched.includes(card.pairId) || session.picked.includes(cardId)) {
      return { session, status: "ignored" };
    }
    if (!session.picked.length) {
      return { session: { ...session, picked: [cardId] }, status: "first" };
    }
    const first = session.deck.find((item) => item.id === session.picked[0]);
    const moves = Number(session.moves || 0) + 1;
    if (first && first.pairId === card.pairId) {
      const matched = [...session.matched, card.pairId];
      return {
        session: { ...session, picked: [], matched, moves, finished: matched.length === session.pairs.length },
        status: "matched",
        pairId: card.pairId,
      };
    }
    return {
      session: { ...session, picked: [], moves, errors: Number(session.errors || 0) + 1 },
      status: "wrong",
      pairId: card.pairId,
    };
  },

  buildDictation(vocab = [], count = 5, random = defaultRandom) {
    const pool = uniqueBy(vocab.filter((item) => item?.ar), (item) => normalizeText(item.ar));
    return shuffle(pool, random).slice(0, Math.min(count, pool.length)).map((item, index) => ({
      id: `dict-${index}`,
      ar: item.ar,
      tr: item.tr || "",
      ru: item.ru || "",
      hint: `${[...item.ar][0] || ""}…`,
    }));
  },

  checkDictation(question, answer, normalize = normalizeText) {
    const expected = question?.ar || "";
    const ok = !!expected && normalize(answer || "") === normalize(expected);
    return { ok, expected, heard: String(answer || "").trim() };
  },

  flattenPhrases(groups = []) {
    return uniqueBy(
      groups.flatMap((group) => (group.phrases || []).map((item) => ({ ...item, group: group.title || "" })))
        .filter((item) => item?.ar && item.ar.split(/\s+/).length >= 2),
      (item) => normalizeText(item.ar),
    );
  },

  buildBuilder(phrases = [], count = 4, random = defaultRandom) {
    return shuffle(phrases, random).slice(0, Math.min(count, phrases.length)).map((item, index) => ({
      id: `build-${index}`,
      answer: item.ar,
      tokens: shuffle(item.ar.split(/\s+/), random),
      tr: item.tr || "",
      ru: item.ru || "",
      group: item.group || "",
    }));
  },

  checkBuilder(question, selected = [], normalize = normalizeText) {
    const answer = question?.answer || "";
    return { ok: !!answer && normalize(selected.join(" ")) === normalize(answer), expected: answer };
  },

  /** تقويم نشاط حقيقي من سجل XP اليومي الموجود أصلاً في الحالة. */
  calendar(history = {}, days = 35, now = new Date()) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const result = [];
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const entry = history[key] || {};
      const xp = Number(entry.xp || 0);
      result.push({
        key,
        xp,
        reviews: Number(entry.reviews || 0),
        audio: Number(entry.audio || 0),
        active: xp > 0 || Number(entry.reviews || 0) > 0,
        level: xp >= 60 ? 4 : xp >= 30 ? 3 : xp > 0 ? 2 : xp === 0 ? 0 : 1,
      });
    }
    let streak = 0;
    for (let index = result.length - 1; index >= 0; index -= 1) {
      if (!result[index].active) break;
      streak += 1;
    }
    return { days: result, streak, activeDays: result.filter((item) => item.active).length, xp: result.reduce((sum, item) => sum + item.xp, 0) };
  },
};

// ---------------------------------------------------------------------------
// Achievement Engine — عرض إنجازات app.js بطريقة قابلة للاختبار
// ---------------------------------------------------------------------------

const RARITY = {
  "all-lessons": "legendary",
  "all-exams": "legendary",
  "final-exam": "legendary",
  "academy-complete": "legendary",
  "level-10": "legendary",
  "reviews-400": "epic",
  "voice-10": "epic",
  "level-5": "epic",
  "streak-7": "epic",
};

export const AchievementEngine = {
  list(definitions = [], state = {}) {
    const earned = Array.isArray(state.achievements) ? state.achievements : [];
    return definitions.map((item) => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      desc: item.desc,
      earned: earned.includes(item.id),
      rarity: RARITY[item.id] || "common",
    }));
  },

  filter(items = [], mode = "all") {
    if (mode === "earned") return items.filter((item) => item.earned);
    if (mode === "locked") return items.filter((item) => !item.earned);
    return items;
  },

  summary(items = []) {
    const earned = items.filter((item) => item.earned).length;
    return { earned, total: items.length, percent: items.length ? Math.round((earned / items.length) * 100) : 0 };
  },
};
