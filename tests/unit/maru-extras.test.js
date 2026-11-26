import { describe, expect, it } from "vitest";
import { OfflineDictionaryEngine, StoryEngine, foldText } from "../../site/maru-extras.js";
import { stories } from "../../site/maru-stories-data.js";
import { audioById } from "../../site/library-data.js";

const entries = [
  { key: "word:1", ar: "عايز", tr: "3ayez", ru: "хочу", kind: "word", level: "A1" },
  { key: "word:2", ar: "قهوة", tr: "qahwa", ru: "кофе", kind: "word", level: "A1" },
  { key: "phrase:1", ar: "صباح الخير", tr: "ṣabāḥ al-khayr", ru: "доброе утро", kind: "phrase", level: "A0", examples: [{ ar: "صباح الخير يا أستاذ", ru: "Доброе утро, учитель" }] },
  { key: "verb:1", ar: "كتب", tr: "kataba", ru: "писать", kind: "verb", level: "A2", forms: [{ ar: "بيكتب", ru: "пишет" }] },
];

const story = stories[0];

describe("OfflineDictionaryEngine", () => {
  it("сворачивает латиницу в арабский для поиска", () => {
    expect(foldText("3ayez")).toContain("عاياز");
    expect(foldText("кофе")).toContain("кофе");
    expect(foldText("ʿaayiz")).toBeTruthy();
  });

  it("индексирует записи и находит их по арабскому, русскому и транскрипции", () => {
    const indexed = OfflineDictionaryEngine.index(entries, (entry) => entry.ar === "قهوة" ? "mp3" : "");
    expect(indexed[0].key).toBe("word:1");
    expect(indexed[0].hay.length).toBeGreaterThan(0);
    expect(OfflineDictionaryEngine.filter(indexed, { query: "عايز" }).map((item) => item.key)).toEqual(["word:1"]);
    expect(OfflineDictionaryEngine.filter(indexed, { query: "кофе" }).map((item) => item.key)).toEqual(["word:2"]);
    expect(OfflineDictionaryEngine.filter(indexed, { query: "qahwa" }).map((item) => item.key)).toEqual(["word:2"]);
    expect(OfflineDictionaryEngine.filter(indexed, { query: "3ayez" }).map((item) => item.key)).toEqual(["word:1"]);
  });

  it("фильтрует по типу, буквам и избранному", () => {
    const indexed = OfflineDictionaryEngine.index(entries);
    expect(OfflineDictionaryEngine.filter(indexed, { kind: "verb" })).toHaveLength(1);
    expect(OfflineDictionaryEngine.filter(indexed, { letter: "ق" })).toHaveLength(1);
    expect(OfflineDictionaryEngine.filter(indexed, { favoritesOnly: true, favorites: ["phrase:1"] })).toHaveLength(1);
    expect(OfflineDictionaryEngine.letters(indexed).reduce((sum, item) => sum + item.count, 0)).toBe(entries.length);
  });

  it("считает офлайн-статистику", () => {
    const indexed = OfflineDictionaryEngine.index(entries, (entry) => entry.ar === "قهوة" ? "mp3" : "");
    expect(OfflineDictionaryEngine.stats(indexed)).toEqual({ total: 4, words: 2, phrases: 1, verbs: 1, withAudio: 1 });
  });
});

describe("StoryEngine", () => {
  it("открывает истории постепенно", () => {
    const list = StoryEngine.list(stories, { completed: [stories[0].id], stars: { [stories[0].id]: 2 } });
    expect(list[0].done).toBe(true);
    expect(list[0].earned).toBe(2);
    expect(list[1].unlocked).toBe(true);
    expect(list[2].unlocked).toBe(false);
    expect(StoryEngine.summary(stories, {}).maxStars).toBe(stories.length * 3);
  });

  it("проходит все реплики, вопросы и завершение", () => {
    let session = StoryEngine.start(story);
    expect(session.phase).toBe("line");
    for (let index = 0; index < story.lines.length - 1; index += 1) {
      session = StoryEngine.step(session, story);
      expect(session.phase).toBe("line");
    }
    session = StoryEngine.step(session, story);
    expect(session.phase).toBe("question");
    for (let index = 0; index < story.questions.length; index += 1) {
      const answered = StoryEngine.answer(session, story, story.questions[index].answer);
      expect(answered.feedback.ok).toBe(true);
      session = StoryEngine.step(answered.session, story);
    }
    expect(session.phase).toBe("finish");
    expect(session.score).toBe(story.questions.length);
    expect(StoryEngine.stars(session.score, story.questions.length)).toBe(3);
  });

  it("не засчитывает повторный ответ и считает звёзды", () => {
    let session = { ...StoryEngine.start(story), phase: "question" };
    const wrong = StoryEngine.answer(session, story, (story.questions[0].answer + 1) % 3);
    expect(wrong.feedback.ok).toBe(false);
    session = wrong.session;
    expect(StoryEngine.answer(session, story, story.questions[0].answer).session.score).toBe(session.score);
    expect(StoryEngine.stars(1, 2)).toBe(2);
    expect(StoryEngine.stars(0, 2)).toBe(0);
  });

  it("прогресс монотонно растёт", () => {
    let session = StoryEngine.start(story);
    let previous = 0;
    for (let index = 0; index < story.lines.length + story.questions.length; index += 1) {
      const current = StoryEngine.progressPercent(session, story);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
      session = StoryEngine.step(session, story);
    }
    expect(StoryEngine.progressPercent(session, story)).toBe(100);
  });
});

describe("maru-stories-data", () => {
  it("содержит целостные локальные истории", () => {
    expect(stories.length).toBe(6);
    expect(new Set(stories.map((item) => item.id)).size).toBe(6);
    stories.forEach((item) => {
      expect(item.lines.length).toBeGreaterThanOrEqual(4);
      expect(item.questions.length).toBeGreaterThanOrEqual(2);
      expect(item.vocab.length).toBeGreaterThanOrEqual(4);
      item.questions.forEach((question) => {
        expect(question.options.length).toBeGreaterThanOrEqual(3);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
      });
      expect(audioById[item.audioTrack]).toBeTruthy();
    });
  });
});
