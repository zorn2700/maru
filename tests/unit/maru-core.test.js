import { describe, expect, it } from "vitest";
import {
  ConversationEngine,
  DictionaryEngine,
  LearningEngine,
  PrivacyEngine,
  ProgressEngine,
  BackupEngine,
  ContentEngine,
  ListeningEngine,
  RecommendationEngine,
  createDefaultMaruState,
  ensureMaruState,
  normalizeText,
  transliterationAliases,
} from "../../site/maru-core.js";
import { dailyChallenges, conversationScenarios } from "../../site/maru-data.js";
import { wordAudioByText, wordAudioByKey } from "../../site/word-audio.js";
import { existsSync } from "node:fs";

const siteRoot = new URL("../../site/", import.meta.url);

describe("LearningEngine — التكرار المتباعد", () => {
  it("يعيد جدولة الكلمة بعد خطأ بعد دقائق", () => {
    const now = Date.now();
    const stat = LearningEngine.grade({}, "again", now);
    expect(stat.due).toBe(now + 10 * 60 * 1000);
    expect(stat.streak).toBe(0);
    expect(stat.lapses).toBe(1);
  });

  it("يزيد الفاصل عند النجاح ويحدّه بـ 30 يومًا", () => {
    expect(LearningEngine.grade({}, "good").interval).toBe(3);
    expect(LearningEngine.grade({}, "easy").interval).toBe(7);
    const long = LearningEngine.grade({ streak: 20 }, "mastered");
    expect(long.interval).toBeLessThanOrEqual(30);
  });

  it("يبني اختبارًا من مفردات الدرس", () => {
    const items = Array.from({ length: 6 }, (_, i) => ({ ar: `كلمة${i}`, ru: `слово${i}` }));
    const quiz = LearningEngine.buildQuiz(items, 5, items);
    expect(quiz).toHaveLength(5);
    quiz.forEach((q) => {
      expect(q.options).toContain(q.answer);
      expect(q.options.length).toBeLessThanOrEqual(3);
    });
  });

  it("يحتوي الدرس على الخطوات الثمانية", () => {
    expect(LearningEngine.lessonSteps({})).toHaveLength(8);
  });
});

describe("ProgressEngine — الأهداف والمهارات", () => {
  it("يحسب المستوى وXP", () => {
    expect(ProgressEngine.levelInfo(0).level).toBe(1);
    expect(ProgressEngine.levelInfo(240).level).toBe(3);
  });

  it("يعيد ضبط التحديات عند تغيير اليوم", () => {
    const state = { todayReviews: 0, completed: [] };
    const maru = createDefaultMaruState();
    maru.daily.date = "2000-01-01";
    maru.daily.progress = { "one-lesson": 1 };
    ProgressEngine.ensureDaily(maru, state);
    expect(maru.daily.progress).toEqual({});
  });

  it("يقيس المهارات الأربع بشكل منفصل", () => {
    const skills = ProgressEngine.skillScores({
      wordStats: {},
      listenPlays: 10,
      writingDone: ["a", "b"],
      recordingsMade: 2,
      maru: createDefaultMaruState(),
    });
    expect(skills.map((item) => item.id)).toEqual(["reading", "listening", "writing", "speaking"]);
    expect(skills.find((item) => item.id === "writing").score).toBeGreaterThan(0);
  });

  it("يحتوي على أربعة تحديات يومية", () => {
    expect(dailyChallenges).toHaveLength(4);
  });
});

describe("DictionaryEngine — القاموس الذكي", () => {
  const entries = DictionaryEngine.collectSources({
    lessons: [{
      id: "m1l1", title: "Приветствия", level: "A1",
      vocabulary: [{ ar: "عايز", tr: "ʿāyez", ru: "хочу" }, { ar: "عايزة", tr: "ʿāyza", ru: "хочу ж." }],
    }],
    phrases: [],
    verbs: [],
    colors: [],
  });

  it("يبحث بالعربية والروسية واللاتينية", () => {
    expect(DictionaryEngine.search(entries, "عايز").length).toBeGreaterThan(0);
    expect(DictionaryEngine.search(entries, "хочу").length).toBeGreaterThan(0);
    expect(DictionaryEngine.search(entries, "ayez").length).toBeGreaterThan(0);
    expect(DictionaryEngine.search(entries, "3ayez").length).toBeGreaterThan(0);
  });

  it("يضيف ويزيل المفضلة", () => {
    const maru = createDefaultMaruState();
    expect(DictionaryEngine.toggleFavorite(maru, "k")).toBe(true);
    expect(DictionaryEngine.isFavorite(maru, "k")).toBe(true);
    expect(DictionaryEngine.toggleFavorite(maru, "k")).toBe(false);
  });

  it("ينشئ قوائم شخصية ويتذكر السجل", () => {
    const maru = createDefaultMaruState();
    DictionaryEngine.addToList(maru, "Курс", "k1");
    DictionaryEngine.addToList(maru, "Курс", "k1");
    expect(maru.dictionary.lists["Курс"]).toEqual(["k1"]);
    DictionaryEngine.remember(maru, entries[0]);
    expect(maru.dictionary.history[0]).toBe(entries[0].key);
    DictionaryEngine.removeFromList(maru, "Курс", "k1");
    expect(maru.dictionary.lists["Курс"]).toBeUndefined();
  });

  it("ينشئ صيغًا بديلة للنطق", () => {
    expect(transliterationAliases("ʿāyez")).toContain("3ayez");
    expect(normalizeText("صباحُ الخيرِ")).toBe("صباح الخير");
  });
});

describe("ConversationEngine — المحادثة التفاعلية", () => {
  it("يبدأ من سؤال المعلم ويوفر اقتراحات", () => {
    const session = ConversationEngine.start("restaurant", "guided");
    expect(session.messages[0].role).toBe("tutor");
    expect(ConversationEngine.suggestions(session).length).toBeGreaterThan(0);
  });

  it("يقبل الإجابة الصحيحة ويتقدم", () => {
    const session = ConversationEngine.start("restaurant", "guided");
    const suggestion = ConversationEngine.suggestions(session)[0];
    const result = ConversationEngine.step(session, suggestion.ar);
    expect(result.feedback.ok).toBe(true);
    expect(result.session.turnIndex).toBeGreaterThan(session.turnIndex);
    expect(result.session.messages.length).toBeGreaterThan(session.messages.length);
  });

  it("يرفض إجابة فارغة", () => {
    const session = ConversationEngine.start("restaurant", "guided");
    expect(ConversationEngine.step(session, " ").feedback.ok).toBe(false);
  });

  it("يعمل الوضع الحر مع أي إدخال", () => {
    const session = ConversationEngine.start("hotel", "free");
    const result = ConversationEngine.step(session, "عايز غرفة");
    expect(result.feedback.ok).toBe(true);
    expect(result.session.messages.at(-1).role).toBe("tutor");
  });

  it("يغطي أربعين موقفًا حياتيًا", () => {
    expect(conversationScenarios).toHaveLength(40);
  });
});

describe("state & privacy", () => {
  it("يدمج الحالة القديمة مع الإعدادات الجديدة", () => {
    const merged = ensureMaruState({ completed: ["m1l1"], maru: { privacy: { cloudSync: true } } });
    expect(merged.privacy.cloudSync).toBe(true);
    expect(merged.privacy.recordingsLocal).toBe(true);
  });

  it("يضبط إعدادات الخصوصية", () => {
    const maru = createDefaultMaruState();
    expect(PrivacyEngine.set(maru, "cloudSync", true)).toBe(true);
    expect(maru.privacy.cloudSync).toBe(true);
    expect(PrivacyEngine.infoLines(maru).length).toBeGreaterThan(0);
  });
});

describe("ListeningEngine — аудирование на реальных записях", () => {
  it("содержит упражнения и ссылается на аудиофайлы курса", () => {
    const exercises = ListeningEngine.exercises();
    expect(exercises.length).toBeGreaterThanOrEqual(6);
    exercises.forEach((exercise) => {
      expect(exercise.trackId).toMatch(/^audio-/);
      expect(exercise.prompts.length).toBeGreaterThan(0);
      exercise.prompts.forEach((prompt) => expect(prompt.options).toContain(prompt.answer));
    });
  });

  it("ведёт счёт и завершает упражнение", () => {
    let session = ListeningEngine.buildSession("listen-m1l1");
    const exercise = ListeningEngine.exercise("listen-m1l1");
    exercise.prompts.forEach((prompt) => {
      const result = ListeningEngine.step(session, prompt.options.indexOf(prompt.answer));
      expect(result.feedback.ok).toBe(true);
      session = result.session;
    });
    expect(session.finished).toBe(true);
    expect(session.score).toBe(exercise.prompts.length);
  });

  it("показывает правильный ответ при ошибке", () => {
    const exercise = ListeningEngine.exercise("listen-m1l1");
    const wrong = exercise.prompts[0].options.find((option) => option !== exercise.prompts[0].answer);
    const result = ListeningEngine.step(ListeningEngine.buildSession(exercise.id), exercise.prompts[0].options.indexOf(wrong));
    expect(result.feedback.ok).toBe(false);
    expect(result.feedback.ru).toContain(exercise.prompts[0].answer);
  });
});

describe("RecommendationEngine — рекомендации", () => {
  it("находит слабые слова по ошибкам", () => {
    const state = { wordStats: { "m1l1:أهلاً": { wrong: 4, right: 1, lapses: 2 }, "m1l1:شكراً": { wrong: 0, right: 5, lapses: 0 } } };
    const items = [{ ar: "أهلاً", ru: "привет" }, { ar: "شكراً", ru: "спасибо" }];
    const weak = RecommendationEngine.weakWords(state, items);
    expect(weak.map((item) => item.ar)).toEqual(["أهلاً"]);
    expect(weak[0].priority).toBeGreaterThan(0);
  });

  it("рекомендует следующий непройденный урок", () => {
    const lessons = [{ id: "l1" }, { id: "l2" }];
    expect(RecommendationEngine.nextLesson({ completed: ["l1"] }, lessons).lesson.id).toBe("l2");
    expect(RecommendationEngine.nextLesson({}, lessons).reason).toBe("new");
  });
});

describe("BackupEngine и ContentEngine — данные и редактор", () => {
  it("шифрует и расшифровывает копию паролем", async () => {
    const payload = BackupEngine.payload({ xp: 42, maru: createDefaultMaruState() });
    const file = await BackupEngine.encrypt(payload, "sekret");
    expect(file.format).toBe("maru-encrypted-v1");
    const restored = await BackupEngine.decrypt(file, "sekret");
    expect(restored.state.xp).toBe(42);
    await expect(BackupEngine.decrypt(file, "неверно")).rejects.toThrow();
  });

  it("отвергает короткий пароль и чужой формат", async () => {
    await expect(BackupEngine.encrypt({}, "a")).rejects.toThrow();
    expect(BackupEngine.restore({ app: "other", state: {} }).ok).toBe(false);
  });

  it("восстанавливает состояние со значениями по умолчанию", () => {
    const restored = BackupEngine.restore(BackupEngine.payload({ xp: 7, completed: ["l1"] }));
    expect(restored.ok).toBe(true);
    expect(restored.state.completed).toEqual(["l1"]);
    expect(restored.state.maru.privacy.recordingsLocal).toBe(true);
  });

  it("проверяет JSON сценариев", () => {
    expect(ContentEngine.validateScenarios(conversationScenarios)).toBeNull();
    expect(new Set(conversationScenarios.map((item) => item.id)).size).toBe(conversationScenarios.length);
    expect(ContentEngine.parseScenarios("not json").ok).toBe(false);
    expect(ContentEngine.validateScenarios([{ id: "x", titleRu: "X", titleAr: "خ", turns: [] }])).toMatch(/реплик/);
    const duplicate = [conversationScenarios[0], conversationScenarios[0]];
    expect(ContentEngine.validateScenarios(duplicate)).toMatch(/повторяющийся id/i);
  });

  it("пользуется пользовательскими сценариями в диалоге", () => {
    const custom = [{
      id: "custom", icon: "⭐", titleRu: "Тест", titleAr: "اختبار", level: "A1",
      summaryRu: "Тест", summaryAr: "اختبار",
      turns: [
        { id: "c1", speaker: "tutor", ar: "أهلاً", tr: "ahlan", ru: "Привет" },
        { id: "c2", speaker: "learner", ar: "أهلاً بيك", tr: "ahlan bīk", ru: "И тебе привет", hints: ["أهلاً"], alternatives: [{ ar: "أهلاً", tr: "ahlan", ru: "Привет" }] },
      ],
      freeReplies: [],
      freeFallback: { ar: "تمام", tr: "tammām", ru: "Хорошо" },
    }];
    const session = ConversationEngine.start("custom", "guided", custom);
    expect(session.messages[0].ar).toBe("أهلاً");
    expect(ConversationEngine.suggestions(session, custom).length).toBe(2);
    expect(ConversationEngine.step(session, "أهلاً", custom).session.finished).toBe(true);
  });
});

describe("Content integrity — audio paths", () => {
  it("كل مسارات الصوت المولّدة تشير إلى ملفات موجودة", () => {
    const paths = [...Object.values(wordAudioByText), ...Object.values(wordAudioByKey)];
    const missing = [...new Set(paths)].filter((path) => !existsSync(new URL(path, siteRoot)));
    expect(missing).toEqual([]);
  });

  it("عدد الصوت المعلن يطابق الخريطة الفعلية", async () => {
    const { wordAudioCount, wordAudioUniqueCount } = await import("../../site/word-audio.js");
    expect(wordAudioCount).toBe(Object.keys(wordAudioByKey).length);
    expect(wordAudioUniqueCount).toBe(Object.keys(wordAudioByText).length);
  });
});
