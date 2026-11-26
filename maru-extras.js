/**
 * Maru Extras — منطق نقي للقاموس بدون شبكة وللقصص التفاعلية.
 * لا touches لـ DOM ولا localStorage: كل الحالة تُمرّر من app.js.
 */

import { normalizeText } from "./maru-core.js";

const LATIN_TO_AR = {
  a: "ا", e: "ا", i: "ي", o: "و", u: "و",
  "3": "ع", "7": "ح", "9": "ق", "'": "ع", "ʿ": "ع", "ʼ": "ع",
  b: "ب", d: "د", f: "ف", g: "ج", h: "ه", k: "ك",
  l: "ل", m: "م", n: "ن", r: "ر", s: "س", sh: "ش",
  t: "ت", w: "و", y: "ي", z: "ز", q: "ق", v: "ف", x: "ش",
};

function latinFold(value = "") {
  return value
    .toLocaleLowerCase()
    .replace(/sh/g, "ش")
    .replace(/[a-z0-9'ʿʼ]/g, (char) => LATIN_TO_AR[char] || char);
}

export function foldText(value = "") {
  const raw = String(value ?? "").toLocaleLowerCase();
  const latin = latinFold(raw);
  const combined = latin === raw ? raw : `${raw} ${latin}`;
  return normalizeText(combined)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstLetter(entry = {}) {
  const text = String(entry.ar || "").trim().replace(/^ال/, "");
  return [...text][0] || "#";
}

export const OfflineDictionaryEngine = {
  index(entries = [], audioResolver = null) {
    return entries.map((entry, index) => {
      const key = entry.key || `${entry.kind || "word"}:${entry.ar || index}`;
      const examples = Array.isArray(entry.examples) ? entry.examples.map((item) => `${item.ar || ""} ${item.ru || ""}`) : [];
      const forms = Array.isArray(entry.forms) ? entry.forms.map((item) => `${item.ar || ""} ${item.tr || ""} ${item.ru || ""}`) : [];
      const hay = foldText([
        entry.ar, entry.ru, entry.tr, entry.note, entry.level,
        entry.kind, ...examples, ...forms,
      ].filter(Boolean).join(" "));
      const audio = typeof audioResolver === "function" ? audioResolver(entry) || "" : entry.audio || "";
      return { ...entry, key, hay, audio, letter: firstLetter(entry) };
    });
  },

  filter(indexed = [], options = {}) {
    const {
      query = "",
      letter = "all",
      kind = "all",
      favorites = [],
      favoritesOnly = false,
      limit = 160,
    } = options;
    let result = indexed;
    if (favoritesOnly) result = result.filter((entry) => favorites.includes(entry.key));
    if (kind && kind !== "all") result = result.filter((entry) => entry.kind === kind);
    if (letter && letter !== "all") {
      const target = foldText(letter);
      result = result.filter((entry) => entry.letter === letter || foldText(entry.letter) === target);
    }
    const tokens = foldText(query).split(/\s+/).filter(Boolean);
    if (tokens.length) result = result.filter((entry) => tokens.every((token) => entry.hay.includes(token)));
    return result.slice(0, Math.max(1, Number(limit) || 160));
  },

  letters(indexed = []) {
    const groups = new Map();
    indexed.forEach((entry) => {
      const letter = entry.letter || firstLetter(entry);
      groups.set(letter, (groups.get(letter) || 0) + 1);
    });
    return [...groups.entries()]
      .map(([letter, count]) => ({ letter, count }))
      .sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter, "ar"));
  },

  stats(indexed = []) {
    return {
      total: indexed.length,
      words: indexed.filter((entry) => entry.kind === "word").length,
      phrases: indexed.filter((entry) => entry.kind === "phrase").length,
      verbs: indexed.filter((entry) => entry.kind === "verb").length,
      withAudio: indexed.filter((entry) => !!entry.audio).length,
    };
  },
};

export const StoryEngine = {
  list(stories = [], progress = {}) {
    const completed = Array.isArray(progress.completed) ? progress.completed : [];
    const stars = progress.stars && typeof progress.stars === "object" ? progress.stars : {};
    return stories.map((story, index) => {
      const previous = stories[index - 1];
      const earned = Math.min(3, Math.max(0, Number(stars[story.id] || 0)));
      const unlocked = !previous || completed.includes(previous.id) || Number(stars[previous.id] || 0) > 0;
      return {
        ...story,
        earned,
        done: completed.includes(story.id),
        unlocked,
        percent: Math.round((earned / 3) * 100),
      };
    });
  },

  summary(stories = [], progress = {}) {
    const items = StoryEngine.list(stories, progress);
    const stars = items.reduce((sum, item) => sum + item.earned, 0);
    return {
      stories: items.length,
      done: items.filter((item) => item.done).length,
      stars,
      maxStars: items.length * 3,
      percent: items.length ? Math.round((stars / (items.length * 3)) * 100) : 0,
    };
  },

  start(story = {}) {
    return {
      id: story.id || "",
      phase: "line",
      lineIndex: 0,
      questionIndex: 0,
      score: 0,
      revealed: false,
      answered: false,
      feedback: null,
      saved: false,
      stars: 0,
    };
  },

  step(session = {}, story = {}) {
    const next = {
      ...session,
      revealed: false,
      answered: false,
      feedback: null,
    };
    const lines = Array.isArray(story.lines) ? story.lines : [];
    const questions = Array.isArray(story.questions) ? story.questions : [];
    if (next.phase === "line") {
      if (next.lineIndex < lines.length - 1) return { ...next, lineIndex: next.lineIndex + 1 };
      return { ...next, phase: questions.length ? "question" : "finish", questionIndex: 0 };
    }
    if (next.phase === "question") {
      if (next.questionIndex < questions.length - 1) return { ...next, questionIndex: next.questionIndex + 1 };
      return { ...next, phase: "finish" };
    }
    return next;
  },

  answer(session = {}, story = {}, choice = 0) {
    if (session.phase !== "question" || session.answered) return { session, feedback: null };
    const questions = Array.isArray(story.questions) ? story.questions : [];
    const question = questions[session.questionIndex || 0];
    if (!question) return { session, feedback: null };
    const ok = Number(choice) === Number(question.answer);
    return {
      session: {
        ...session,
        answered: true,
        score: (Number(session.score) || 0) + (ok ? 1 : 0),
      },
      feedback: {
        ok,
        expected: question.answer,
        tip: question.tipRu || "",
      },
    };
  },

  stars(score = 0, total = 0) {
    if (!total) return 0;
    const ratio = (Number(score) || 0) / total;
    if (ratio >= 1) return 3;
    if (ratio >= 0.5) return 2;
    if (ratio >= 0.25) return 1;
    return 0;
  },

  progressPercent(session = {}, story = {}) {
    const lines = Array.isArray(story.lines) ? story.lines.length : 0;
    const questions = Array.isArray(story.questions) ? story.questions.length : 0;
    const total = Math.max(1, lines + questions);
    const done = session.phase === "finish"
      ? total
      : session.phase === "question"
        ? lines + (Number(session.questionIndex) || 0) + 1
        : (Number(session.lineIndex) || 0) + 1;
    return Math.min(100, Math.round((done / total) * 100));
  },
};

export default { OfflineDictionaryEngine, StoryEngine, foldText };
