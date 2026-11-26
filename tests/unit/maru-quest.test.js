import { describe, expect, it } from "vitest";
import { AchievementEngine, ArcadeEngine, QuestEngine, shuffle } from "../../site/maru-quest.js";
import { modules, lessons } from "../../site/course-data.js";
import { phrasebook } from "../../site/extra-data.js";
import { createDefaultMaruState } from "../../site/maru-core.js";

const vocab = [
  { ar: "أهلاً", ru: "привет", tr: "ahlan" },
  { ar: "قهوة", ru: "кофе", tr: "ahwa" },
  { ar: "شكراً", ru: "спасибо", tr: "shokran" },
  { ar: "أنا", ru: "я", tr: "ana" },
];

describe("QuestEngine — карта пути", () => {
  it("строит главы из настоящих модулей и уроков", () => {
    const chapters = QuestEngine.chapters(modules, lessons, createDefaultMaruState(), () => false, false);
    expect(chapters).toHaveLength(modules.length + 1);
    expect(chapters[0].total).toBe(lessons.filter((lesson) => lesson.module === modules[0].id).length);
    expect(chapters[0].unlocked).toBe(true);
    expect(chapters.at(-1).id).toBe("final");
  });

  it("открывает следующий мир только после прогресса", () => {
    const state = createDefaultMaruState();
    const before = QuestEngine.chapters(modules, lessons, state, () => false, false);
    expect(before[1].unlocked).toBe(false);
    state.completed = lessons.filter((lesson) => lesson.module === modules[0].id).map((lesson) => lesson.id);
    const after = QuestEngine.chapters(modules, lessons, state, () => false, false);
    expect(after[0].stars).toBe(3);
    expect(after[0].status).toBe("ready");
    expect(after[1].unlocked).toBe(true);
  });

  it("суммирует звёзды и находит следующую миссию", () => {
    const chapters = QuestEngine.chapters(modules, lessons, createDefaultMaruState(), () => false, false);
    const summary = QuestEngine.summary(chapters);
    expect(summary.stars).toBe(0);
    expect(summary.maxStars).toBe(chapters.length * 3);
    expect(QuestEngine.next(chapters)?.id).toBe(chapters[0].id);
  });
});

describe("ArcadeEngine — игры", () => {
  it("собирает колоду матча из пар и считает ходы", () => {
    const session = ArcadeEngine.buildMatch(vocab, 4, () => 0.42);
    expect(session.pairs.length).toBe(4);
    expect(session.deck).toHaveLength(8);
    const first = session.deck.find((card) => card.kind === "ar");
    const result = ArcadeEngine.matchStep(session, first.id);
    expect(result.status).toBe("first");
    const match = ArcadeEngine.matchStep(result.session, `${first.pairId}-ru`);
    expect(match.status).toBe("matched");
    expect(match.session.moves).toBe(1);
  });

  it("различает верную и неверную пару", () => {
    const session = ArcadeEngine.buildMatch(vocab, 4, () => 0.1);
    const first = session.deck[0];
    const wrong = session.deck.find((card) => card.kind !== first.kind && card.pairId !== first.pairId);
    const result = ArcadeEngine.matchStep(ArcadeEngine.matchStep(session, first.id).session, wrong.id);
    expect(result.status).toBe("wrong");
    expect(result.session.errors).toBe(1);
  });

  it("проверяет диктант без учёта огласовок", () => {
    const question = ArcadeEngine.buildDictation(vocab, 2, () => 0.1)[0];
    expect(ArcadeEngine.checkDictation(question, question.ar).ok).toBe(true);
    expect(ArcadeEngine.checkDictation(question, "كلمة").ok).toBe(false);
  });

  it("собирает фразы из книг выражений", () => {
    const phrases = ArcadeEngine.flattenPhrases(phrasebook);
    expect(phrases.length).toBeGreaterThan(10);
    const question = ArcadeEngine.buildBuilder(phrases, 1, () => 0.5)[0];
    expect(question.tokens.join(" ")).toBe(question.answer);
    expect(ArcadeEngine.checkBuilder(question, question.tokens).ok).toBe(true);
  });

  it("строит календарь серии из реальной истории XP", () => {
    const now = new Date(2026, 0, 10);
    const history = {
      "2026-01-10": { xp: 40, reviews: 2 },
      "2026-01-09": { xp: 10, reviews: 1 },
      "2026-01-08": { xp: 0, reviews: 0 },
    };
    const calendar = ArcadeEngine.calendar(history, 5, now);
    expect(calendar.streak).toBe(2);
    expect(calendar.activeDays).toBe(2);
    expect(calendar.days.at(-1).level).toBe(3);
  });

  it("перемешивание не мутирует исходный массив", () => {
    const source = [1, 2, 3, 4, 5];
    expect(shuffle(source, () => 0.5)).toHaveLength(5);
    expect(source).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("AchievementEngine — коллекция", () => {
  it("фильтрует и считает значки", () => {
    const definitions = [
      { id: "first-step", icon: "🌱", title: "Старт", desc: "Первый урок" },
      { id: "level-10", icon: "👑", title: "Мастер", desc: "10 уровень" },
    ];
    const state = { achievements: ["first-step"] };
    const items = AchievementEngine.list(definitions, state);
    expect(items[0].earned).toBe(true);
    expect(items[1].rarity).toBe("legendary");
    expect(AchievementEngine.filter(items, "locked")).toHaveLength(1);
    expect(AchievementEngine.summary(items)).toEqual({ earned: 1, total: 2, percent: 50 });
  });
});
