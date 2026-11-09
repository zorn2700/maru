import {
  alphabetGuide,
  courseMeta,
  lessons,
  modules,
  mediaLessons,
  survivalPhrases,
  studyPlan,
  transcriptionGuide,
} from "./course-data.js";
import { phrasebook, quickReference } from "./extra-data.js";
import { verbLibrary, verbTenses } from "./verb-data.js";
import { colorLesson } from "./colors-data.js";
import { cultureGuide, examMeta, learningPrograms, writingTasks, writingTips } from "./academy-data.js";
import {
  audioById,
  audioLibrary,
  lessonAudio,
  lessonPdf,
  modulePdfMap,
  textbookFrontMatter,
  textbookMeta,
  textbookParts,
  textbookPdfCount,
  textbookUnits,
  wordAudioCount,
  wordAudioFor,
  wordAudioUniqueCount,
} from "./library-data.js";
import {
  clearRecordings,
  deleteRecording,
  getRecording,
  listRecordings,
  putRecording,
} from "./audio-db.js";

const main = document.querySelector("#main");
const audioTotalCount = audioLibrary.length + wordAudioCount;
const nav = document.querySelector(".bottom-nav");
const searchDialog = document.querySelector("#searchDialog");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const mediaDialog = document.querySelector("#mediaDialog");
const lessonVideo = document.querySelector("#lessonVideo");
const mediaDialogTitle = document.querySelector("#mediaDialogTitle");
const pdfDialog = document.querySelector("#pdfDialog");
const pdfDialogTitle = document.querySelector("#pdfDialogTitle");
const pdfFrame = document.querySelector("#pdfFrame");
const pdfOpenLink = document.querySelector("#pdfOpenLink");
const audioDialog = document.querySelector("#audioDialog");
const audioDialogTitle = document.querySelector("#audioDialogTitle");
const audioDialogPhrase = document.querySelector("#audioDialogPhrase");
const audioDialogRu = document.querySelector("#audioDialogRu");
const audioDialogStatus = document.querySelector("#audioDialogStatus");
const audioPlayer = document.querySelector("#audioPlayer");
const audioDock = document.querySelector("#audioDock");
const audioTitle = document.querySelector("#audioTitle");
const audioSubtitle = document.querySelector("#audioSubtitle");
const audioToggle = document.querySelector("#audioToggle");
const audioSeek = document.querySelector("#audioSeek");
const audioTime = document.querySelector("#audioTime");
const audioDuration = document.querySelector("#audioDuration");
const audioRateButton = document.querySelector("#audioRate");
const audioLoopButton = document.querySelector("#audioLoop");
const audioPrev = document.querySelector("#audioPrev");
const audioNext = document.querySelector("#audioNext");
const audioClose = document.querySelector("#audioClose");
const audioPlayPhrase = document.querySelector("#audioPlayPhrase");
const audioRecordPhrase = document.querySelector("#audioRecordPhrase");
const audioUploadPhrase = document.querySelector("#audioUploadPhrase");
const audioDeletePhrase = document.querySelector("#audioDeletePhrase");
const audioTtsPhrase = document.querySelector("#audioTtsPhrase");
const audioFileInput = document.querySelector("#audioFileInput");
const backupInput = document.querySelector("#backupInput");
const paletteGrid = document.querySelector("#paletteGrid");
const themeSegment = document.querySelector("#themeSegment");
const surfaceSegment = document.querySelector("#surfaceSegment");
const paletteButton = document.querySelector("#paletteButton");
const paletteDialog = document.querySelector("#paletteDialog");
const libraryButton = document.querySelector("#libraryButton");
const toast = document.querySelector("#toast");
const installButton = document.querySelector("#installButton");

const STORAGE_KEY = "masri-ru-state-v3";
const LEGACY_STORAGE_KEY = "masri-ru-state-v2";
const defaultState = {
  completed: [],
  lastLesson: "m1l1",
  theme: "system",
  accent: "blue",
  surface: "warm",
  speechRate: 0.82,
  audioMode: "auto",
  audioRate: 1,
  audioLoop: false,
  autoplayCards: false,
  showTranscription: true,
  flashcardIndex: 0,
  flashcardFlipped: false,
  practiceMode: "cards",
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActive: "",
  todayDate: "",
  todayXp: 0,
  todayReviews: 0,
  totalReviews: 0,
  dailyGoal: 20,
  perfectQuiz: false,
  wordStats: {},
  verbStats: {},
  favorites: [],
  achievements: [],
  phraseCategory: "greetings",
  libraryTab: "audio",
  lastAudio: "",
  audioPlays: 0,
  recordingsMade: 0,
  pdfOpens: 0,
  listenPlays: 0,
  history: {},
  examScores: {},
  writingDone: [],
  grammarModule: "all",
  learnerName: "",
};

let state = loadState();
let deferredInstallPrompt = null;
let quizState = null;
let drillState = null;
let listenState = null;
let examState = null;
let verbTense = "present";
let drillTense = "present";
let verbFilter = "all";
let reviewRevealed = false;
let reviewKey = "";
let currentAudioTrack = null;
let audioQueue = [];
let audioQueueIndex = -1;
let currentObjectUrl = "";
let audioDialogText = "";
let audioDialogRuText = "";
let mediaRecorder = null;
let recordChunks = [];
let recordStream = null;
let isRecording = false;


const achievementDefs = [
  { id: "first-lesson", icon: "🎯", title: "Первый шаг", desc: "Завершите первый урок", test: () => state.completed.length >= 1 },
  { id: "five-lessons", icon: "📚", title: "В ритме", desc: "Завершите 5 уроков", test: () => state.completed.length >= 5 },
  { id: "ten-lessons", icon: "🚀", title: "Дальше и выше", desc: "Завершите 10 уроков", test: () => state.completed.length >= 10 },
  { id: "all-lessons", icon: "🏆", title: "Весь курс", desc: "Завершите все уроки", test: () => state.completed.length >= lessons.length },
  { id: "first-verb", icon: "🧩", title: "Глагольный старт", desc: "Правильно проспрягайте глагол", test: () => Object.values(state.verbStats).some((item) => item.right > 0) },
  { id: "verb-master", icon: "💪", title: "Мастер глаголов", desc: "25 верных ответов в тренажёре глаголов", test: () => Object.values(state.verbStats).reduce((sum, item) => sum + item.right, 0) >= 25 },
  { id: "streak-3", icon: "🔥", title: "Три дня подряд", desc: "Занимайтесь 3 дня подряд", test: () => state.bestStreak >= 3 },
  { id: "streak-7", icon: "⚡", title: "Неделя силы", desc: "Занимайтесь 7 дней подряд", test: () => state.bestStreak >= 7 },
  { id: "reviews-50", icon: "🧠", title: "Память работает", desc: "50 повторений слов", test: () => state.totalReviews >= 50 },
  { id: "reviews-200", icon: "🌟", title: "Двести повторений", desc: "200 повторений слов", test: () => state.totalReviews >= 200 },
  { id: "perfect-quiz", icon: "✅", title: "Без ошибок", desc: "Пройдите тест без ошибок", test: () => state.perfectQuiz },
  { id: "level-5", icon: "🏅", title: "Пятый уровень", desc: "Наберите 600 XP", test: () => state.xp >= 600 },
  { id: "collector", icon: "⭐", title: "Коллекционер фраз", desc: "Добавьте 5 фраз в избранное", test: () => state.favorites.length >= 5 },
  { id: "first-audio", icon: "🎧", title: "Слушатель", desc: "Запустите аудиоматериал", test: () => state.audioPlays >= 1 },
  { id: "audio-25", icon: "🔊", title: "Аудиокурс", desc: "25 запусков аудио", test: () => state.audioPlays >= 25 },
  { id: "own-voice", icon: "🎙", title: "Свой голос", desc: "Запишите первую фразу", test: () => state.recordingsMade >= 1 },
  { id: "voice-10", icon: "🎤", title: "Постановка голоса", desc: "Запишите 10 фраз", test: () => state.recordingsMade >= 10 },
  { id: "bookworm", icon: "📖", title: "Учебник открыт", desc: "Откройте 5 PDF-глав", test: () => state.pdfOpens >= 5 },
  { id: "listener-50", icon: "👂", title: "Тонкий слух", desc: "50 ответов в аудировании", test: () => state.listenPlays >= 50 },
  { id: "first-exam", icon: "📝", title: "Первый экзамен", desc: "Сдайте любой модульный экзамен", test: () => passedExamCount() >= 1 },
  { id: "all-exams", icon: "🎓", title: "Все модули сданы", desc: "Сдайте 12 модульных экзаменов", test: () => passedExamCount() >= moduleExamIds().length },
  { id: "final-exam", icon: "🏛", title: "Итоговый экзамен", desc: "Сдайте финальный экзамен курса", test: () => examPassed("final") },
  { id: "writer-10", icon: "✍️", title: "Пишу по-арабски", desc: "Выполните 10 заданий письма", test: () => state.writingDone.length >= 10 },
  { id: "academy-complete", icon: "🏆", title: "Академия пройдена", desc: "Получите право на сертификат", test: () => certificateEligibility().eligible },
  { id: "reviews-400", icon: "🧠", title: "Глубокая память", desc: "400 повторений слов", test: () => state.totalReviews >= 400 },
  { id: "level-10", icon: "👑", title: "Десятый уровень", desc: "Наберите 1080 XP", test: () => state.xp >= 1080 },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "{}";
    const saved = JSON.parse(raw);
    return {
      ...defaultState,
      ...saved,
      completed: Array.isArray(saved.completed) ? saved.completed : [],
      wordStats: saved.wordStats && typeof saved.wordStats === "object" ? saved.wordStats : {},
      verbStats: saved.verbStats && typeof saved.verbStats === "object" ? saved.verbStats : {},
      favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
      history: saved.history && typeof saved.history === "object" ? saved.history : {},
      examScores: saved.examScores && typeof saved.examScores === "object" ? saved.examScores : {},
      writingDone: Array.isArray(saved.writingDone) ? saved.writingDone : [],
      grammarModule: typeof saved.grammarModule === "string" ? saved.grammarModule : "all",
      learnerName: typeof saved.learnerName === "string" ? saved.learnerName : "",
    };
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

function moduleExamIds() {
  return modules.map((module) => `module-${module.id}`);
}

function examTotal(examId) {
  return examId === "final" ? examMeta.finalQuestions : examMeta.moduleQuestions;
}

function examPassScore(examId) {
  return Math.ceil(examTotal(examId) * (examMeta.passPercent / 100));
}

function examPassed(examId) {
  const score = Number(state.examScores?.[examId]?.best) || 0;
  return score >= examPassScore(examId);
}

function passedExamCount() {
  return moduleExamIds().filter((id) => examPassed(id)).length;
}

function certificateEligibility() {
  const lessonsDone = completedCount();
  const examsDone = passedExamCount();
  const writingDone = state.writingDone.filter((id) => writingTasks.some((task) => task.id === id)).length;
  const finalDone = examPassed("final");
  const eligible = lessonsDone >= lessons.length && examsDone >= moduleExamIds().length && finalDone && writingDone >= 10;
  return { eligible, lessonsDone, examsDone, writingDone, finalDone };
}

function normalizeArabic(value = "") {
  return String(value)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[؟?،,؛;.!]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function writingDoneCount() {
  return writingTasks.filter((task) => state.writingDone.includes(task.id)).length;
}

function completedCount(items = lessons) {
  return items.filter((lesson) => state.completed.includes(lesson.id)).length;
}

function percent(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

function dayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function yesterdayKey() {
  return dayKey(new Date(Date.now() - 86400000));
}

function activeStreak() {
  if (!state.lastActive) return 0;
  return [dayKey(), yesterdayKey()].includes(state.lastActive) ? Number(state.streak) || 0 : 0;
}

function levelInfo() {
  const xp = Number(state.xp) || 0;
  const level = Math.floor(xp / 120) + 1;
  const current = xp % 120;
  return { level, current, next: 120, percent: percent(current, 120) };
}

function touchStreak() {
  const today = dayKey();
  if (state.todayDate === today) return;
  const yesterday = yesterdayKey();
  state.streak = state.lastActive === yesterday ? (Number(state.streak) || 0) + 1 : 1;
  state.bestStreak = Math.max(Number(state.bestStreak) || 0, state.streak);
  state.todayDate = today;
  state.todayXp = 0;
  state.todayReviews = 0;
  state.lastActive = today;
  saveState();
}

function checkAchievements() {
  let changed = false;
  achievementDefs.forEach((item) => {
    if (!state.achievements.includes(item.id) && item.test()) {
      state.achievements.push(item.id);
      changed = true;
      showToast(`${item.icon} Достижение: ${item.title}`);
    }
  });
  if (changed) saveState();
}

function awardXp(amount) {
  touchStreak();
  state.xp = (Number(state.xp) || 0) + amount;
  state.todayXp = (Number(state.todayXp) || 0) + amount;
  bumpHistory("xp", amount);
  pruneHistory();
  saveState();
  checkAchievements();
}

function vocabKey(item) {
  return `${item.lessonId || "global"}:${item.ar}`;
}

function wordStat(item) {
  return state.wordStats[vocabKey(item)] || { seen: 0, right: 0, wrong: 0, streak: 0, interval: 0, due: 0, last: 0 };
}

function rateWord(item, quality) {
  touchStreak();
  const key = vocabKey(item);
  const stat = { ...wordStat(item) };
  stat.seen += 1;
  stat.last = Date.now();
  if (quality === "again") {
    stat.wrong += 1;
    stat.streak = 0;
    stat.interval = 0;
    stat.due = Date.now() + 10 * 60 * 1000;
  } else {
    stat.right += 1;
    stat.streak += 1;
    if (quality === "easy") stat.interval = Math.max(4, Math.round((stat.interval || 1) * 2.6));
    else stat.interval = stat.interval ? Math.min(60, stat.interval * 2) : 1;
    stat.due = Date.now() + stat.interval * 86400000;
  }
  state.wordStats[key] = stat;
  recordReviewActivity();
  awardXp(quality === "again" ? 2 : 6);
  saveState();
}

function verbStat(verbId) {
  return state.verbStats[verbId] || { seen: 0, right: 0, wrong: 0, streak: 0 };
}

function recordVerb(verbId, correct) {
  touchStreak();
  const stat = { ...verbStat(verbId) };
  stat.seen += 1;
  if (correct) {
    stat.right += 1;
    stat.streak = (Number(stat.streak) || 0) + 1;
  } else {
    stat.wrong += 1;
    stat.streak = 0;
  }
  state.verbStats[verbId] = stat;
  awardXp(correct ? 5 : 1);
  saveState();
  checkAchievements();
}

function dueCount() {
  const now = Date.now();
  return allVocab().filter((item) => {
    const stat = state.wordStats[vocabKey(item)];
    return stat && stat.due <= now;
  }).length;
}

function reviewPool(limit = 30) {
  const now = Date.now();
  const due = allVocab()
    .filter((item) => {
      const stat = state.wordStats[vocabKey(item)];
      return stat && stat.due <= now;
    })
    .sort((a, b) => (state.wordStats[vocabKey(a)].due || 0) - (state.wordStats[vocabKey(b)].due || 0));
  const unseen = shuffle(allVocab().filter((item) => !state.wordStats[vocabKey(item)]));
  return [...due, ...unseen].slice(0, limit);
}

function allPhrases() {
  return phrasebook.flatMap((category) => category.phrases.map((item) => ({ ...item, categoryId: category.id, categoryTitle: category.title })));
}

function favoritePhrases() {
  const pool = allPhrases();
  return state.favorites.map((ar) => pool.find((item) => item.ar === ar)).filter(Boolean);
}

function toggleFavorite(ar) {
  state.favorites = state.favorites.includes(ar) ? state.favorites.filter((item) => item !== ar) : [...state.favorites, ar];
  saveState();
  checkAchievements();
}

function verbOfTheDay() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((new Date() - start) / 86400000);
  return verbLibrary[day % verbLibrary.length];
}

const accents = [
  {
    id: "blue",
    name: "Средиземный",
    ar: "أزرق متوسط",
    light: { blue: "#1565c0", soft: "#e8f1fb", navy: "#102a43", navy2: "#243b53", deep: "#0d3b66", hero: ["#102a43", "#155799", "#167d87"], glow: "#ffe0a5", sand: "#f6f1e8" },
    dark: { blue: "#73b4ff", soft: "#18324d", navy: "#d9eaf7", navy2: "#b6cbdc", deep: "#1e4b7a", hero: ["#0b1c2c", "#123f6b", "#135e66"], glow: "#ffe9b8", sand: "#111a22" },
  },
  {
    id: "teal",
    name: "Изумруд",
    ar: "أخضر زمردي",
    light: { blue: "#00796b", soft: "#e0f2f1", navy: "#103b3a", navy2: "#1f5d59", deep: "#004d40", hero: ["#083b3a", "#0b6b63", "#2a9d8f"], glow: "#c8f7e8", sand: "#eef6f3" },
    dark: { blue: "#5de0cf", soft: "#123b38", navy: "#d6f5f1", navy2: "#a8d9d3", deep: "#176b63", hero: ["#062423", "#0a4b46", "#14756c"], glow: "#c8f7e8", sand: "#0e1b19" },
  },
  {
    id: "violet",
    name: "Фиалка",
    ar: "بنفسجي",
    light: { blue: "#6a1b9a", soft: "#f3e8fb", navy: "#2f1b4a", navy2: "#4a2b6b", deep: "#4a148c", hero: ["#2b1246", "#5b2a86", "#8e44ad"], glow: "#f2d7ff", sand: "#f6f0f8" },
    dark: { blue: "#c58bff", soft: "#32204a", navy: "#eeddfb", navy2: "#cbb4df", deep: "#6d3d9e", hero: ["#1b0d2d", "#3d1c5c", "#64347f"], glow: "#f2d7ff", sand: "#17101f" },
  },
  {
    id: "amber",
    name: "Шафран",
    ar: "أصفر زعفراني",
    light: { blue: "#b45309", soft: "#fff1dc", navy: "#3d2a12", navy2: "#5a3d1b", deep: "#92400e", hero: ["#3b2410", "#8a4b16", "#c27c2c"], glow: "#ffe4b0", sand: "#fbf3e5" },
    dark: { blue: "#fbbf24", soft: "#3d2a12", navy: "#fcebd0", navy2: "#dfc5a2", deep: "#a16207", hero: ["#241407", "#5a3210", "#8c5a1f"], glow: "#ffe4b0", sand: "#1b140c" },
  },
  {
    id: "rose",
    name: "Роза",
    ar: "وردي",
    light: { blue: "#be185d", soft: "#fce7f0", navy: "#431025", navy2: "#63213b", deep: "#9d174d", hero: ["#3d0f22", "#8e1d4a", "#c94f7c"], glow: "#ffd6e5", sand: "#fbf0f4" },
    dark: { blue: "#ff8fbb", soft: "#42192b", navy: "#ffe0ec", navy2: "#e5b9cb", deep: "#9d174d", hero: ["#280815", "#5e132f", "#8d3151"], glow: "#ffd6e5", sand: "#1d1014" },
  },
  {
    id: "ocean",
    name: "Океан",
    ar: "أزرق محيطي",
    light: { blue: "#0369a1", soft: "#e0f2fe", navy: "#0c2f44", navy2: "#174a63", deep: "#075985", hero: ["#082f49", "#075985", "#0e7490"], glow: "#bae6fd", sand: "#edf5f9" },
    dark: { blue: "#5cc8ff", soft: "#0d3145", navy: "#d7f0ff", navy2: "#a8cfe3", deep: "#0e6b9e", hero: ["#041e2f", "#064663", "#0a667a"], glow: "#bae6fd", sand: "#0b1720" },
  },
  {
    id: "forest",
    name: "Лес",
    ar: "أخضر غامق",
    light: { blue: "#2f6f2f", soft: "#e8f4e5", navy: "#173b1c", navy2: "#2a5730", deep: "#1b5e20", hero: ["#102b14", "#1f5a28", "#3f7d3a"], glow: "#d7f5c9", sand: "#eff5eb" },
    dark: { blue: "#7ed87e", soft: "#17351b", navy: "#e1f7de", navy2: "#b8d9b5", deep: "#2f7a35", hero: ["#0a1b0d", "#153c1c", "#28602c"], glow: "#d7f5c9", sand: "#101810" },
  },
  {
    id: "graphite",
    name: "Графит",
    ar: "رمادي فحمي",
    light: { blue: "#475569", soft: "#e9eef3", navy: "#1e293b", navy2: "#334155", deep: "#334155", hero: ["#111827", "#334155", "#546b82"], glow: "#e2e8f0", sand: "#f1f3f5" },
    dark: { blue: "#b6c7d9", soft: "#263442", navy: "#eef4f9", navy2: "#c4d2de", deep: "#475569", hero: ["#0b1119", "#1f2a37", "#3b4b5c"], glow: "#e2e8f0", sand: "#11161c" },
  },
];

function isDarkMode() {
  return state.theme === "dark" || (state.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
}

function setTheme() {
  const dark = isDarkMode();
  const palette = accents.find((item) => item.id === state.accent) || accents[0];
  const colors = dark ? palette.dark : palette.light;
  const root = document.documentElement;
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.accent = palette.id;
  root.dataset.surface = state.surface || "warm";
  const set = (name, value) => root.style.setProperty(name, value);
  set("--blue", colors.blue);
  set("--blue-soft", colors.soft);
  set("--navy", colors.navy);
  set("--navy-2", colors.navy2);
  set("--accent-deep", colors.deep);
  set("--hero-a", colors.hero[0]);
  set("--hero-b", colors.hero[1]);
  set("--hero-c", colors.hero[2]);
  set("--hero-glow", colors.glow);
  let sand = colors.sand;
  if (state.surface === "cool") sand = dark ? "#0e1720" : "#eef3f7";
  else if (state.surface === "plain") sand = dark ? "#121212" : "#f6f6f6";
  set("--sand", sand);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? sand : colors.navy);
  renderPaletteChoices();
}

function paletteMarkup() {
  return accents.map((palette) => {
    const colors = palette.light;
    return `<button class="color-swatch ${state.accent === palette.id ? "active" : ""}" type="button" data-accent-choice="${palette.id}" style="--swatch-a:${colors.blue};--swatch-b:${colors.deep}" aria-pressed="${state.accent === palette.id}"><span class="swatch-preview" aria-hidden="true"></span><span class="swatch-name">${escapeHtml(palette.name)}</span><span class="swatch-ar arabic" lang="ar">${escapeHtml(palette.ar)}</span></button>`;
  }).join("");
}

function renderPaletteChoices() {
  if (!paletteGrid) return;
  paletteGrid.innerHTML = paletteMarkup();
  const settingsPalette = document.querySelector("#settingsPalette");
  if (settingsPalette) settingsPalette.innerHTML = paletteMarkup();
  themeSegment?.querySelectorAll("[data-theme-choice]").forEach((button) => {
    const active = button.dataset.themeChoice === state.theme;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  surfaceSegment?.querySelectorAll("[data-surface-choice]").forEach((button) => {
    const active = button.dataset.surfaceChoice === (state.surface || "warm");
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const themeSelect = document.querySelector("#themeSelect");
  if (themeSelect) themeSelect.value = state.theme;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function historyEntry(key = dayKey()) {
  if (!state.history[key]) state.history[key] = { xp: 0, reviews: 0, audio: 0 };
  return state.history[key];
}

function bumpHistory(field, amount = 1) {
  const entry = historyEntry();
  entry[field] = (Number(entry[field]) || 0) + amount;
}

function pruneHistory() {
  const cutoff = dayKey(new Date(Date.now() - 120 * 86400000));
  Object.keys(state.history).forEach((key) => {
    if (key < cutoff) delete state.history[key];
  });
}

function recordReviewActivity() {
  bumpHistory("reviews", 1);
  state.todayReviews = (Number(state.todayReviews) || 0) + 1;
  state.totalReviews = (Number(state.totalReviews) || 0) + 1;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function showAudioDock() {
  audioDock.classList.remove("hidden");
  document.body.classList.add("has-audio");
}

function hideAudioDock() {
  audioDock.classList.add("hidden");
  document.body.classList.remove("has-audio");
}

function updateAudioDock() {
  const playing = !audioPlayer.paused && !audioPlayer.ended;
  audioToggle.textContent = playing ? "⏸" : "▶";
  audioToggle.setAttribute("aria-label", playing ? "Пауза" : "Играть");
  audioToggle.title = playing ? "Пауза" : "Играть";
  audioTime.textContent = formatTime(audioPlayer.currentTime);
  audioDuration.textContent = formatTime(audioPlayer.duration);
  const progress = audioPlayer.duration ? (audioPlayer.currentTime / audioPlayer.duration) * 1000 : 0;
  audioSeek.value = String(Math.min(1000, Math.max(0, progress)));
  audioRateButton.textContent = `${Number(state.audioRate).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`;
  audioRateButton.classList.toggle("active", Number(state.audioRate) !== 1);
  audioLoopButton.classList.toggle("active", !!state.audioLoop);
  document.querySelectorAll(".audio-row").forEach((row) => {
    const active = !!currentAudioTrack && row.dataset.audioId === currentAudioTrack.id;
    row.classList.toggle("playing", active);
    const icon = row.querySelector(".audio-row-play");
    if (icon) icon.textContent = active && playing ? "⏸" : "▶";
  });
}

function playTrack(track, queue = null) {
  if (!track?.src) return;
  if (queue) {
    audioQueue = queue;
    audioQueueIndex = audioQueue.findIndex((item) => item.id === track.id);
  } else if (!audioQueue.some((item) => item.id === track.id)) {
    audioQueue = [track];
    audioQueueIndex = 0;
  } else {
    audioQueueIndex = audioQueue.findIndex((item) => item.id === track.id);
  }
  if (currentObjectUrl && currentObjectUrl !== track.src) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = "";
  }
  if (track.objectUrl) currentObjectUrl = track.objectUrl;
  currentAudioTrack = track;
  audioTitle.textContent = track.title || "Аудио";
  audioSubtitle.textContent = track.subtitle || "";
  audioPlayer.src = track.src;
  audioPlayer.loop = !!state.audioLoop;
  audioPlayer.playbackRate = Number(state.audioRate) || 1;
  showAudioDock();
  audioPlayer.play().catch(() => showToast("Не удалось запустить аудиофайл"));
  state.audioPlays = (Number(state.audioPlays) || 0) + 1;
  if (!String(track.id || "").startsWith("rec:") && track.kind !== "word") state.lastAudio = track.id || "";
  bumpHistory("audio", 1);
  saveState();
  checkAchievements();
  updateAudioDock();
}

function playTrackById(trackId, queue = audioLibrary) {
  const track = queue.find((item) => item.id === trackId) || audioById[trackId];
  if (track) playTrack(track, queue);
}

function playAdjacentTrack(step) {
  if (!audioQueue.length) return;
  if (audioQueueIndex < 0) audioQueueIndex = 0;
  const nextIndex = (audioQueueIndex + step + audioQueue.length) % audioQueue.length;
  playTrack(audioQueue[nextIndex], audioQueue);
}

function playWordList(lessonId) {
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return;
  const queue = lesson.vocabulary
    .map((item, index) => wordTrack(item.ar, `${lesson.id}:${index + 1}`))
    .filter(Boolean);
  if (!queue.length) {
    showToast("Для этого урока пока нет аудио слов");
    return;
  }
  playTrack(queue[0], queue);
}

function closeAudioPlayer() {
  audioPlayer.pause();
  audioPlayer.removeAttribute("src");
  audioPlayer.load();
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = "";
  }
  currentAudioTrack = null;
  hideAudioDock();
  updateAudioDock();
}

function meaningFor(text) {
  const vocab = allVocab().find((item) => item.ar === text);
  if (vocab) return vocab.ru;
  const phrase = allPhrases().find((item) => item.ar === text);
  if (phrase) return phrase.ru;
  const verb = verbLibrary.find((item) => item.ar === text);
  if (verb) return verb.ru;
  return "";
}

function wordTrack(text, key = "") {
  const src = wordAudioFor(text, key);
  if (!src) return null;
  return {
    id: `word:${key || text}`,
    src,
    title: text,
    subtitle: key ? "Слово урока · аудио курса" : "Слово · аудио курса",
    kind: "word",
    isWord: true,
  };
}

async function playPhrase(text, options = {}) {
  if (state.audioMode !== "tts") {
    const record = await getRecording(text);
    if (record) {
      const url = URL.createObjectURL(record.blob);
      playTrack({ id: `rec:${text}`, src: url, title: text, subtitle: "Ваша запись", objectUrl: url, isRecording: true });
      return true;
    }
    const word = wordTrack(text, options.wordKey || "");
    if (word) {
      playTrack(word, [word]);
      return true;
    }
  }
  if (options.onlyRecording) {
    showToast("Для этой фразы пока нет записанного аудио");
    return false;
  }
  if (state.audioMode === "files") {
    showToast("Нет аудиофайла. Запишите фразу или загрузите файл.");
    if (options.openDialog !== false) openAudioDialog(text);
    return false;
  }
  speakArabic(text);
  return true;
}

function maybeAutoplayCard() {
  if (!state.autoplayCards) return;
  const deck = allVocab();
  if (!deck.length) return;
  const index = ((state.flashcardIndex % deck.length) + deck.length) % deck.length;
  setTimeout(() => playPhrase(deck[index].ar, { openDialog: false }), 140);
}

async function refreshAudioDialogStatus() {
  if (!audioDialogText) return;
  const record = await getRecording(audioDialogText);
  if (record) {
    const updated = new Date(record.updated || Date.now());
    audioDialogStatus.textContent = `Есть ваша запись · ${Math.max(1, Math.round((record.size || 0) / 1024))} КБ · ${updated.toLocaleDateString("ru-RU")} · ${updated.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
    audioDeletePhrase.disabled = false;
  } else if (wordAudioFor(audioDialogText)) {
    audioDialogStatus.textContent = "Есть аудио курса. Можно прослушать его или записать свою версию.";
    audioDeletePhrase.disabled = true;
  } else {
    audioDialogStatus.textContent = "Записи пока нет. Можно записать голос или загрузить готовый аудиофайл.";
    audioDeletePhrase.disabled = true;
  }
  await refreshRecordingBadges();
}

async function refreshRecordingBadges() {
  const buttons = [...document.querySelectorAll("[data-say], [data-record-say]")];
  if (!buttons.length) return;
  const records = await listRecordings();
  const keys = new Set(records.map((item) => item.key));
  buttons.forEach((button) => {
    const key = button.dataset.say || button.dataset.recordSay || "";
    button.classList.toggle("has-recording", keys.has(key));
  });
}

function openAudioDialog(text) {
  if (isRecording) stopRecording();
  audioDialogText = text;
  audioDialogRuText = meaningFor(text);
  audioDialogTitle.textContent = "Аудио фразы";
  audioDialogPhrase.textContent = text;
  audioDialogRu.textContent = audioDialogRuText;
  audioDialogStatus.textContent = "Проверяем запись…";
  audioRecordPhrase.textContent = "● Записать";
  audioRecordPhrase.classList.remove("audio-recording");
  audioDialog.showModal();
  refreshAudioDialogStatus();
}

async function saveAudioBlob(blob, source = "record") {
  if (!audioDialogText) return;
  if (blob.size > 8 * 1024 * 1024) {
    showToast("Файл больше 8 МБ. Выберите запись короче.");
    return;
  }
  await putRecording(audioDialogText, blob, { ru: audioDialogRuText, source });
  if (source === "record") state.recordingsMade = (Number(state.recordingsMade) || 0) + 1;
  saveState();
  checkAchievements();
  showToast(source === "record" ? "Запись сохранена" : "Аудиофайл добавлен");
  await refreshAudioDialogStatus();
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    showToast("Запись с микрофона не поддерживается этим браузером");
    return;
  }
  try {
    recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((type) => MediaRecorder.isTypeSupported(type));
    mediaRecorder = new MediaRecorder(recordStream, preferred ? { mimeType: preferred } : undefined);
    recordChunks = [];
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) recordChunks.push(event.data);
    });
    mediaRecorder.addEventListener("stop", async () => {
      const blob = new Blob(recordChunks, { type: mediaRecorder?.mimeType || "audio/webm" });
      recordChunks = [];
      if (recordStream) recordStream.getTracks().forEach((track) => track.stop());
      recordStream = null;
      if (blob.size) await saveAudioBlob(blob, "record");
    });
    mediaRecorder.start();
    isRecording = true;
    audioRecordPhrase.textContent = "■ Остановить";
    audioRecordPhrase.classList.add("audio-recording");
    audioDialogStatus.textContent = "Идёт запись… Говорите чётко и не спеша.";
    clearTimeout(startRecording.timer);
    startRecording.timer = setTimeout(() => { if (isRecording) stopRecording(); }, 30000);
  } catch {
    showToast("Не удалось получить доступ к микрофону");
    if (recordStream) recordStream.getTracks().forEach((track) => track.stop());
    recordStream = null;
  }
}

function stopRecording() {
  clearTimeout(startRecording.timer);
  if (mediaRecorder && isRecording) {
    isRecording = false;
    try { mediaRecorder.stop(); } catch { /* already stopped */ }
  }
  isRecording = false;
  audioRecordPhrase.textContent = "● Записать";
  audioRecordPhrase.classList.remove("audio-recording");
}

function openPdf(path, title) {
  if (!path) return;
  pdfDialogTitle.textContent = title || "Учебник PDF";
  pdfFrame.src = path;
  pdfOpenLink.href = path;
  pdfDialog.showModal();
  state.pdfOpens = (Number(state.pdfOpens) || 0) + 1;
  saveState();
  checkAchievements();
}

function exportBackup() {
  const payload = {
    app: "masri-ru",
    version: 3,
    exported: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `masri-ru-backup-${dayKey()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Резервная копия скачана");
}

async function importBackup(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const saved = parsed?.state && typeof parsed.state === "object" ? parsed.state : parsed;
    if (!saved || typeof saved !== "object") throw new Error("bad backup");
    state = {
      ...defaultState,
      ...saved,
      completed: Array.isArray(saved.completed) ? saved.completed : [],
      wordStats: saved.wordStats && typeof saved.wordStats === "object" ? saved.wordStats : {},
      verbStats: saved.verbStats && typeof saved.verbStats === "object" ? saved.verbStats : {},
      favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
      history: saved.history && typeof saved.history === "object" ? saved.history : {},
      examScores: saved.examScores && typeof saved.examScores === "object" ? saved.examScores : {},
      writingDone: Array.isArray(saved.writingDone) ? saved.writingDone : [],
      grammarModule: typeof saved.grammarModule === "string" ? saved.grammarModule : "all",
      learnerName: typeof saved.learnerName === "string" ? saved.learnerName : "",
    };
    saveState();
    setTheme();
    renderRoute();
    showToast("Прогресс восстановлен из резервной копии");
  } catch {
    showToast("Не удалось прочитать файл резервной копии");
  }
}


function activateNav(route) {
  let root = route;
  if (["module", "lesson", "library", "media", "colors", "programs", "program", "grammar", "culture", "writing"].includes(route)) root = "course";
  else if (route === "verb") root = "verbs";
  else if (["phrases", "reference", "exams", "exam"].includes(route)) root = "practice";
  else if (route === "recordings" || route === "certificate") root = "settings";
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
  const level = levelInfo();
  const streak = activeStreak();
  const due = dueCount();
  const goal = Number(state.dailyGoal) || 20;
  const today = Number(state.todayReviews) || 0;
  const goalPercent = Math.min(100, percent(today, goal));
  const verb = verbOfTheDay();
  const firstForm = verb.forms.present[0];
  const learnedVerbs = Object.values(state.verbStats).filter((item) => item.right >= 3).length;
  const dayIndex = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const dayWord = allVocab()[dayIndex % allVocab().length];
  const lastTrack = audioById[state.lastAudio] || audioLibrary[0];
  const recordingCount = Number(state.recordingsMade) || 0;

  return `
    <section class="hero">
      <div class="hero-grid">
        <div class="hero-main">
          <p class="eyebrow">${escapeHtml(courseMeta.levels)} · ${courseMeta.lessonCount} уроков · офлайн</p>
          <h1>${escapeHtml(courseMeta.title)}</h1>
          <p class="arabic-display" lang="ar">${escapeHtml(courseMeta.arabicTitle)}</p>
          <p class="hero-copy">Практический каирский диалект: живые диалоги, аудиофайлы, запись своего голоса, умное повторение и большая лаборатория глаголов.</p>
          <div class="hero-actions">
            <button class="primary-button" type="button" data-open-lesson="${nextLesson.id}">${done ? "Продолжить" : "Начать курс"}</button>
            <button class="soft-button" type="button" data-route="library">🎧 Аудиокурс</button>
            <button class="soft-button" type="button" data-practice-mode="smart">Умное повторение</button>
          </div>
        </div>
        <aside class="hero-progress" aria-label="Прогресс курса">
          <div class="hero-ring" style="--progress:${progress}">
            <span><strong>${progress}%</strong><small>курс</small></span>
          </div>
          <strong class="hero-progress-title">${done} из ${lessons.length} уроков</strong>
          <span class="hero-progress-meta">🔥 ${streak} · ⭐ ${level.level} уровень</span>
          <span class="hero-progress-meta">${due} слов к повторению</span>
        </aside>
      </div>
    </section>

    <section class="stat-grid" aria-label="Статистика обучения">
      <article class="stat-card"><span class="stat-icon" aria-hidden="true">📈</span><div><strong>${progress}%</strong><span>общий прогресс · ${done}/${lessons.length} уроков</span></div></article>
      <article class="stat-card"><span class="stat-icon" aria-hidden="true">🔥</span><div><strong>${streak}</strong><span>${streak === 1 ? "день подряд" : "дней подряд"}</span></div></article>
      <article class="stat-card"><span class="stat-icon" aria-hidden="true">⭐</span><div><strong>${level.level}</strong><span>уровень · ${state.xp || 0} XP</span></div></article>
      <article class="stat-card"><span class="stat-icon" aria-hidden="true">🧠</span><div><strong>${due}</strong><span>слов к повторению</span></div></article>
    </section>

    <section class="section card home-audio-card">
      <div class="continue-track">
        <span class="continue-art" aria-hidden="true">🎧</span>
        <div><strong>${state.lastAudio ? "Продолжить аудио" : "Аудиокурс и учебник"}</strong><small>${state.lastAudio ? `${escapeHtml(lastTrack.title)} · ${escapeHtml(lastTrack.subtitle)}` : `${audioTotalCount} аудиофайлов, ${textbookPdfCount} PDF-глав и ваши собственные записи`}</small></div>
      </div>
      <div class="lesson-actions">
        <button class="primary-button" type="button" data-play-audio="${lastTrack.id}">▶ ${state.lastAudio ? "Продолжить" : "Слушать"}</button>
        <button class="soft-button" type="button" data-route="library">Библиотека</button>
        <button class="soft-button" type="button" data-route="recordings">🎙 Мои записи${recordingCount ? ` (${recordingCount})` : ""}</button>
      </div>
    </section>

    <section class="section dashboard-grid">
      <article class="card daily-card">
        <div class="daily-top">
          <div><p class="eyebrow">Цель дня</p><h2>${today} / ${goal} повторений</h2></div>
          <span class="daily-badge">${goalPercent >= 100 ? "выполнено ✓" : `${goalPercent}%`}</span>
        </div>
        <span class="progress-track big-track" aria-label="Цель дня ${goalPercent}%"><span class="progress-fill" style="width:${goalPercent}%"></span></span>
        <p class="muted">${due ? `${due} слов уже ждут повторения. Умный режим сам подберёт слабые места.` : "Расписание свободно: можно взять новые слова или закрепить глаголы."}</p>
        <div class="lesson-actions"><button class="primary-button" type="button" data-practice-mode="smart">Повторить умно</button><button class="soft-button" type="button" data-practice-mode="drill">Тренажёр глаголов</button></div>
      </article>
      <article class="card word-of-day">
        <p class="eyebrow">Слово дня</p>
        <div class="word-of-day-ar arabic" lang="ar">${escapeHtml(dayWord.ar)}</div>
        ${state.showTranscription ? `<p class="vocab-tr">${escapeHtml(dayWord.tr)}</p>` : ""}
        <p><strong>${escapeHtml(dayWord.ru)}</strong></p>
        <p class="muted small">${escapeHtml(dayWord.lessonTitle || "Из курса")}</p>
        <div class="audio-actions">${speakButton(dayWord.ar)}${recordButton(dayWord.ar)}</div>
      </article>
      <article class="card verb-of-day">
        <div class="verb-of-day-head">
          <div><p class="eyebrow">Глагол дня</p><div class="verb-of-day-ar arabic" lang="ar">${escapeHtml(verb.ar)}</div></div>
          ${speakButton(verb.ar)}
        </div>
        <p class="verb-of-day-ru"><strong>${escapeHtml(verb.ru)}</strong> · ${escapeHtml(verb.tr)}</p>
        <div class="mini-form"><span>${escapeHtml(firstForm.person)}</span><span class="arabic" lang="ar">${escapeHtml(firstForm.ar)}</span><small>${escapeHtml(firstForm.tr)}</small></div>
        <p class="muted">Корень ${escapeHtml(verb.root)} · ${escapeHtml(verb.pattern)}</p>
        <button class="soft-button" type="button" data-open-verb="${verb.id}">Открыть спряжение →</button>
      </article>
    </section>

    <section class="section">
      <div class="section-head"><div><p class="section-kicker">Программы</p><h2>Выберите свой маршрут</h2><p>Пять полных программ — от первого слова до уверенного общения</p></div><button class="soft-button" type="button" data-route="programs">Все программы</button></div>
      <div class="program-grid">${learningPrograms.map(programCard).join("")}</div>
    </section>

    <section class="section">
      <div class="section-head"><div><p class="section-kicker">Основной курс</p><h2>Модули курса</h2><p>12 модулей · 36 уроков · от первых звуков до самостоятельного общения</p></div><button class="soft-button" type="button" data-route="course">Открыть курс</button></div>
      <div class="module-grid">${modules.map(moduleCard).join("")}</div>
    </section>

    <section class="section">
      <div class="section-head"><div><p class="section-kicker">Академия</p><h2>Учёба и проверка знаний</h2><p>Экзамены, грамматика, письмо, культура и сертификат</p></div><button class="soft-button" type="button" data-route="exams">К экзаменам</button></div>
      <div class="feature-grid">
        <button class="card feature-card" type="button" data-route="exams"><span class="feature-icon">📝</span><span class="feature-copy"><strong>Экзамены</strong><small>${passedExamCount()} из 12 модулей · финальная аттестация</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="grammar"><span class="feature-icon">🧠</span><span class="feature-copy"><strong>Грамматика</strong><small>${lessons.reduce((sum, lesson) => sum + lesson.grammar.length, 0)} тем с примерами</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="writing"><span class="feature-icon">✍️</span><span class="feature-copy"><strong>Лаборатория письма</strong><small>${writingDoneCount()} из ${writingTasks.length} заданий выполнено</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="culture"><span class="feature-icon">🏛</span><span class="feature-copy"><strong>Культурный гид</strong><small>${cultureGuide.length} тем о жизни в Египте</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="certificate"><span class="feature-icon">🏆</span><span class="feature-copy"><strong>Сертификат</strong><small>${certificateEligibility().eligible ? "Готов к печати" : "Условия и прогресс"}</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="settings"><span class="feature-icon">🏅</span><span class="feature-copy"><strong>Достижения</strong><small>${state.achievements.length} из ${achievementDefs.length} открыто</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><div><p class="section-kicker">Практика и материалы</p><h2>Всё для живого языка</h2><p>Слушайте, повторяйте, записывайте голос и открывайте учебник</p></div><button class="soft-button" type="button" data-route="library">Библиотека</button></div>
      <div class="feature-grid">
        <button class="card feature-card" type="button" data-route="library"><span class="feature-icon">🎧</span><span class="feature-copy"><strong>Аудиокурс</strong><small>${audioTotalCount} файлов · уроки, слова, алфавит и фразы</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="verbs"><span class="feature-icon">🧩</span><span class="feature-copy"><strong>Лаборатория глаголов</strong><small>${verbLibrary.length} глаголов · 5 времён · ${learnedVerbs} освоено</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="phrases"><span class="feature-icon">💬</span><span class="feature-copy"><strong>Разговорник</strong><small>${allPhrases().length} готовых фраз по ситуациям</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="colors"><span class="feature-icon">🎨</span><span class="feature-copy"><strong>Цвета · الألوان</strong><small>${colorLesson.colors.length} цветов, женские формы и фразы</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="reference"><span class="feature-icon">📐</span><span class="feature-copy"><strong>Шпаргалка</strong><small>Местоимения, предлоги, числа и времена</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="recordings"><span class="feature-icon">🎙</span><span class="feature-copy"><strong>Мои записи</strong><small>${recordingCount ? `${recordingCount} записей своего голоса` : "Записывайте фразы и сравнивайте"}</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><div><p class="section-kicker">Видео</p><h2>Визуальные уроки</h2><p>Короткие повторения ключевых ситуаций</p></div><button class="soft-button" type="button" data-route="media">Все видео</button></div>
      <div class="media-grid">${mediaCards}</div>
    </section>`;
}

function courseView() {
  return `
    <header class="page-head"><div><p class="eyebrow">Учебная программа</p><h1>Курс по модулям</h1><p>${lessons.length} уроков · ${courseMeta.levels} · ${courseMeta.studyWeeks} недель · ${audioTotalCount} аудиофайлов</p></div><div class="lesson-actions"><button class="soft-button" type="button" data-route="programs">🎓 Программы</button><button class="soft-button" type="button" data-route="exams">📝 Экзамены</button></div></header>
    <div class="lesson-actions compact-actions"><button class="soft-button" type="button" data-route="grammar">🧠 Грамматика</button><button class="soft-button" type="button" data-route="culture">🏛 Культура</button><button class="soft-button" type="button" data-route="writing">✍️ Письмо</button><button class="soft-button" type="button" data-route="verbs">🧩 Глаголы</button><button class="soft-button" type="button" data-route="phrases">💬 Разговорник</button><button class="soft-button" type="button" data-route="reference">📐 Шпаргалка</button><button class="soft-button" type="button" data-route="colors">🎨 Цвета</button><button class="soft-button" type="button" data-route="library">🎧 Аудио и PDF</button><button class="soft-button" type="button" data-route="certificate">🏆 Сертификат</button><button class="soft-button" type="button" data-route="recordings">🎙 Мои записи</button></div>
    <section class="section course-modules">
      <div class="section-head"><div><p class="section-kicker">12 модулей</p><h2>Программа обучения</h2><p>Каждый модуль — три урока, аудио, PDF-глава и экзамен</p></div><span class="chip">${completedCount()} из ${lessons.length} уроков</span></div>
      <div class="module-grid">${modules.map(moduleCard).join("")}</div>
    </section>
    <section class="section">
      <div class="section-head"><div><p class="section-kicker">Расписание</p><h2>План на 16 недель</h2><p>Оптимальный ритм — три учебных дня и один день повторения в неделю</p></div></div>
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
  const pdfInfo = modulePdfMap[module.id];
  const firstTrack = lessonAudio(items[0]?.id);
  return `
    <button class="soft-button back-button" type="button" data-route="course">← К модулям</button>
    <section class="module-banner section" style="--module-color:${module.color}">
      <div class="module-banner-copy">
        <p class="eyebrow">Модуль ${module.id} · ${escapeHtml(module.level)}</p>
        <h1>${escapeHtml(module.title)}</h1>
        <p class="arabic-display" lang="ar">${escapeHtml(module.ar)}</p>
        <p>${done} из ${items.length} уроков завершено · ${audioLibrary.filter((track) => track.module === module.id).length} аудиофайлов</p>
        <div class="module-actions">
          ${firstTrack ? `<button class="primary-button" type="button" data-play-audio="${firstTrack.id}">▶ Аудио модуля</button>` : ""}
          ${pdfInfo ? `<button class="soft-button" type="button" data-open-pdf="${pdfInfo.pdf}" data-pdf-title="Модуль ${module.id} · ${escapeHtml(pdfInfo.title)}">📖 PDF модуля</button>` : ""}
          <button class="soft-button" type="button" data-route="library">🎧 Библиотека</button>
          <button class="soft-button" type="button" data-start-exam="${module.id}">📝 Экзамен модуля</button>
        </div>
      </div>
      <img src="${module.image}" alt="">
    </section>
    <div class="lesson-list">
      ${items.map((lesson, index) => {
        const complete = state.completed.includes(lesson.id);
        const track = lessonAudio(lesson.id);
        return `<button class="lesson-row ${complete ? "completed" : ""}" type="button" data-open-lesson="${lesson.id}">
          <span class="lesson-number">${index + 1}</span>
          <span><h3>${escapeHtml(lesson.title)}</h3><p><span class="arabic" lang="ar">${escapeHtml(lesson.arTitle)}</span> · ${lesson.minutes} мин.${track ? " · 🎧 аудио" : ""}</p></span>
          <span class="lesson-status" aria-label="${complete ? "Завершено" : "Не завершено"}">${complete ? "✓" : "›"}</span>
        </button>`;
      }).join("")}
    </div>`;
}

function speakButton(text, label = "Прослушать", wordKey = "") {
  const hasFile = !!wordAudioFor(text, wordKey);
  const keyAttr = wordKey ? ` data-word-key="${escapeHtml(wordKey)}"` : "";
  return `<button class="speak-button${hasFile ? " has-file" : ""}" type="button" data-say="${escapeHtml(text)}"${keyAttr} aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">🔊</button>`;
}

function recordButton(text, label = "Записать свой голос") {
  return `<button class="record-button" type="button" data-record-say="${escapeHtml(text)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">🎙</button>`;
}

function audioActions(text, label = "Прослушать", wordKey = "") {
  return `<span class="audio-actions">${speakButton(text, label, wordKey)}${recordButton(text)}</span>`;
}

function lessonView(lessonId) {
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return notFoundView();
  const module = modules.find((item) => item.id === lesson.module);
  const complete = state.completed.includes(lesson.id);
  const track = lessonAudio(lesson.id);
  const chapter = lessonPdf(lesson.id);
  state.lastLesson = lesson.id;
  saveState();

  const vocabulary = lesson.vocabulary.map((item, index) => `
    <article class="vocab-item">
      <div>
        <div class="vocab-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>
        ${state.showTranscription ? `<div class="vocab-tr">${escapeHtml(item.tr)}</div>` : ""}
        <div class="vocab-ru">${escapeHtml(item.ru)}</div>
        ${item.note ? `<div class="vocab-note">${escapeHtml(item.note)}</div>` : ""}
      </div>
      ${audioActions(item.ar, "Прослушать", `${lesson.id}:${index + 1}`)}
    </article>`).join("");

  const grammarBlocks = lesson.grammar.map((item) => `
    <section class="grammar-block">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.explanation)}</p>
      <div class="example-list">
        ${item.examples.map((ex) => `<div class="example-row"><span class="arabic" lang="ar">${escapeHtml(ex.ar)}</span><small>${escapeHtml(ex.tr)}</small><div>${escapeHtml(ex.ru)}</div>${audioActions(ex.ar)}</div>`).join("")}
      </div>
    </section>`).join("");

  const dialogue = lesson.dialogue.map((item) => `
    <div class="dialogue-line">
      <span class="avatar" aria-hidden="true">${escapeHtml(item.speaker.trim().slice(0, 1).toUpperCase())}</span>
      <div class="bubble"><strong>${escapeHtml(item.speaker)}</strong><div class="arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<div class="transcription">${escapeHtml(item.tr)}</div>` : ""}<p>${escapeHtml(item.ru)}</p></div>
      ${audioActions(item.ar, `Прослушать реплику ${item.speaker}`)}
    </div>`).join("");

  return `
    <button class="soft-button back-button" type="button" data-open-module="${module.id}">← Модуль ${module.id}</button>
    <section class="lesson-hero section" style="--module-color:${module.color}">
      <p class="eyebrow">Урок ${lesson.order} · ${escapeHtml(lesson.level)}</p>
      <h1>${escapeHtml(lesson.title)}</h1>
      <div class="arabic-display" lang="ar">${escapeHtml(lesson.arTitle)}</div>
      <div class="lesson-meta"><span class="chip">${lesson.minutes} минут</span><span class="chip">${lesson.vocabulary.length} слов и фраз</span><span class="chip">Диалог</span><span class="chip">Тест</span>${track ? `<span class="chip">🎧 Аудиофайл урока</span>` : ""}<span class="chip">🗣 Слова озвучены</span></div>
    </section>

    ${track || chapter ? `<section class="lesson-audio-card">
      <div><strong>🎧 Аудиоматериалы урока</strong><small>${track ? "Полная запись урока в MP3" : "PDF-глава учебника"}${chapter ? " · PDF учебника" : ""}</small></div>
      <div class="lesson-actions">
        ${track ? `<button class="primary-button" type="button" data-play-audio="${track.id}">▶ Слушать урок</button>` : ""}
        ${chapter ? `<button class="soft-button" type="button" data-open-pdf="${chapter}" data-pdf-title="${escapeHtml(`Урок ${lesson.order} · ${lesson.title}`)}">📖 Открыть PDF</button>` : ""}
      </div>
    </section>` : ""}

    ${lesson.id === colorLesson.lessonId ? `<section class="lesson-audio-card color-callout">
      <div><strong>🎨 Цвета · الألوان</strong><small>${colorLesson.colors.length} цветов, женские формы, грамматика и фразы для магазина</small></div>
      <div class="lesson-actions"><button class="primary-button" type="button" data-route="colors">Открыть материал «Цвета»</button></div>
    </section>` : ""}

    <div class="lesson-layout">
      <div class="lesson-content">
        <section class="lesson-section"><h2>Цели урока</h2><ul class="goal-list">${lesson.goals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join("")}</ul></section>
        <section class="lesson-section"><div class="section-head"><div><h2>Слова и фразы</h2><p>Нажмите 🔊, чтобы услышать слово, или включите весь список подряд</p></div><button class="soft-button" type="button" data-play-word-list="${lesson.id}">▶ Все слова</button></div><div class="vocab-list">${vocabulary}</div></section>
        <section class="lesson-section"><h2>Грамматика без перегруза</h2>${grammarBlocks}</section>
        <section class="lesson-section"><h2>Живой диалог</h2><div class="dialogue">${dialogue}</div></section>
        <section class="lesson-section"><h2>Контекст и культура</h2><p class="culture-note">${escapeHtml(lesson.culture)}</p></section>
        <section class="lesson-section"><h2>Закрепление</h2><p>Пройдите короткий тест по словам этого урока или проверьте понимание на слух. Ответ показывается сразу, а вопросы меняются при повторе.</p>${[4, 5, 6, 7].includes(lesson.module) ? `<p class="muted" style="margin-top:.5rem">Для уроков о глаголах здесь же тренируется спряжение, а в лаборатории доступны все времена.</p>` : ""}<div class="lesson-actions"><button class="primary-button" type="button" data-lesson-quiz="${lesson.id}">Начать тест</button><button class="soft-button" type="button" data-start-exam="${lesson.module}">📝 Экзамен модуля</button><button class="primary-button" type="button" data-lesson-listen="${lesson.id}">Аудирование</button>${[4, 5, 6, 7].includes(lesson.module) ? `<button class="primary-button" type="button" data-lesson-drill="${lesson.id}">Спряжение</button><button class="soft-button" type="button" data-route="verbs">Все глаголы</button>` : ""}<button class="primary-button complete-button ${complete ? "completed" : ""}" type="button" data-toggle-complete="${lesson.id}">${complete ? "✓ Урок завершён" : "Отметить завершённым"}</button></div>${[4, 5, 6, 7].includes(lesson.module) ? `<div id="lessonDrill">${drillView(true)}</div>` : ""}</section>
      </div>
      <aside class="card">
        <h3>Как пройти урок</h3>
        <p class="muted">1. Прослушайте каждую фразу.<br>2. Повторите её три раза.<br>3. Запишите свой голос и сравните.<br>4. Разыграйте обе роли диалога.</p>
        <div class="lesson-actions"><button class="soft-button" type="button" data-record-say="${escapeHtml(lesson.vocabulary[0]?.ar || lesson.arTitle)}">🎙 Записать себя</button><button class="soft-button" type="button" data-practice-lesson="${lesson.id}">Карточки урока</button></div>
      </aside>
    </div>`;
}

function practiceView(mode = state.practiceMode) {
  state.practiceMode = mode;
  saveState();
  const modeButtons = `<div class="practice-controls mode-scroll"><button class="${mode === "smart" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="smart">Умное повторение</button><button class="${mode === "cards" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="cards">Карточки</button><button class="${mode === "quiz" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="quiz">Общий тест</button><button class="${mode === "drill" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="drill">Глаголы</button><button class="${mode === "listen" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="listen">Аудирование</button><button class="${mode === "phrases" ? "primary-button" : "soft-button"}" type="button" data-practice-mode="phrases">Разговорник</button></div>`;
  let body = "";
  if (mode === "quiz") body = quizView(null);
  else if (mode === "phrases") body = phrasebookView(true);
  else if (mode === "drill") body = drillView(true);
  else if (mode === "listen") body = listeningView(true);
  else if (mode === "smart") body = smartReviewView();
  else body = flashcardView();
  return `<header class="page-head"><div><p class="eyebrow">Активное повторение</p><h1>Практика</h1><p>${dueCount()} слов к повторению · серия ${activeStreak()} дн. · уровень ${levelInfo().level}</p></div></header>${modeButtons}<section class="section">${body}</section>`;
}

function allVocab() {
  return lessons.flatMap((lesson) => lesson.vocabulary.map((item) => ({ ...item, lessonId: lesson.id, lessonTitle: lesson.title })));
}

function flashcardView() {
  const deck = allVocab();
  const index = ((state.flashcardIndex % deck.length) + deck.length) % deck.length;
  const item = deck[index];
  const flipped = state.flashcardFlipped;
  const stat = wordStat(item);
  return `<div class="flashcard-wrap">
    <div class="flashcard" role="button" tabindex="0" data-flip-card aria-label="Перевернуть карточку">
      ${flipped ? `<div><div class="back-ru">${escapeHtml(item.ru)}</div><div class="front-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<div class="front-tr">${escapeHtml(item.tr)}</div>` : ""}</div>` : `<div><div class="front-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<div class="front-tr">${escapeHtml(item.tr)}</div>` : ""}</div>`}
      <span class="flashcard-hint">Нажмите, чтобы ${flipped ? "скрыть" : "показать"} ответ · ${index + 1}/${deck.length}${stat.seen ? ` · повторений: ${stat.seen}` : ""}</span>
    </div>
    <div class="practice-controls"><button class="soft-button" type="button" data-card-step="-1">← Назад</button>${audioActions(item.ar)}<button class="soft-button" type="button" data-card-shuffle>Перемешать</button><button class="primary-button" type="button" data-card-step="1">Дальше →</button></div>
    ${flipped ? `<div class="rating-row"><span>Насколько уверенно?</span><div class="practice-controls"><button class="soft-button danger-soft" type="button" data-card-rate="again">Не знаю</button><button class="soft-button" type="button" data-card-rate="good">Помню</button><button class="primary-button" type="button" data-card-rate="easy">Легко</button></div></div>` : `<p class="muted" style="text-align:center">Переверните карточку и оцените себя — интервал повтора подстроится.</p>`}
  </div>`;
}

function smartReviewView() {
  const pool = reviewPool(40);
  const item = pool[0] || allVocab()[0];
  const key = vocabKey(item);
  if (reviewKey !== key) {
    reviewKey = key;
    reviewRevealed = false;
  }
  const stat = wordStat(item);
  const due = dueCount();
  const goal = Number(state.dailyGoal) || 20;
  const today = Number(state.todayReviews) || 0;
  const goalPercent = Math.min(100, percent(today, goal));
  return `<div class="smart-review">
    <div class="card daily-card">
      <div class="daily-top"><div><p class="eyebrow">Умное повторение</p><h2>${due ? `${due} слов ждут` : "Свободная тренировка"}</h2></div><span class="daily-badge">${today}/${goal}</span></div>
      <span class="progress-track big-track"><span class="progress-fill" style="width:${goalPercent}%"></span></span>
      <p class="muted">Правильные ответы увеличивают интервал, ошибки возвращают слово уже через 10 минут.</p>
    </div>
    <div class="card quiz-card">
      <p class="eyebrow">${escapeHtml(item.lessonTitle || "Словарь")} · ${stat.right} ✓ / ${stat.wrong} ✗</p>
      <div class="quiz-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>
      ${state.showTranscription ? `<p class="vocab-tr">${escapeHtml(item.tr)}</p>` : ""}
      ${reviewRevealed
        ? `<div class="smart-answer"><strong>${escapeHtml(item.ru)}</strong>${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}</div><div class="rating-row"><span>Как запомнилось?</span><div class="practice-controls"><button class="soft-button danger-soft" type="button" data-review-rate="again">Ещё раз</button><button class="soft-button" type="button" data-review-rate="good">Помню</button><button class="primary-button" type="button" data-review-rate="easy">Легко</button></div></div>`
        : `<div class="lesson-actions centered-actions"><button class="primary-button" type="button" data-review-reveal>Показать перевод</button>${audioActions(item.ar)}</div>`}
    </div>
  </div>`;
}

function buildQuiz(lessonId = null, count = 10, direction = "ar") {
  const lesson = lessonId ? lessons.find((item) => item.id === lessonId) : null;
  const source = lesson ? lesson.vocabulary.map((item) => ({ ...item, lessonId: lesson.id, lessonTitle: lesson.title })) : allVocab();
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
  return `<div class="card"><h2>Фразы первой необходимости</h2><p class="muted">Сохраните этот раздел офлайн и потренируйте произношение заранее.</p><div class="vocab-list">${survivalPhrases.map((item) => `<article class="vocab-item"><div><div class="vocab-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<div class="vocab-tr">${escapeHtml(item.tr)}</div>` : ""}<div>${escapeHtml(item.ru)}</div></div>${audioActions(item.ar)}</article>`).join("")}</div></div>`;
}

function verbCard(verb) {
  const stat = verbStat(verb.id);
  const learned = stat.right >= 3;
  return `<button class="card verb-card ${learned ? "learned" : ""}" type="button" data-open-verb="${verb.id}" data-verb-search="${escapeHtml(`${verb.ar} ${verb.tr} ${verb.ru} ${verb.root} ${verb.pattern}`.toLocaleLowerCase("ru"))}">
    <span class="verb-card-top"><span class="verb-card-ar arabic" lang="ar">${escapeHtml(verb.ar)}</span><span class="verb-level">${escapeHtml(verb.level)}</span></span>
    <span class="verb-card-tr">${escapeHtml(verb.tr)}</span>
    <span class="verb-card-ru">${escapeHtml(verb.ru)}</span>
    <span class="verb-card-meta"><span>${escapeHtml(verb.root)}</span><span>${escapeHtml(verb.pattern)}</span></span>
    <span class="verb-card-score">${learned ? "✓ освоено" : `${stat.right} ✓ / ${stat.wrong} ✗`}</span>
  </button>`;
}

function verbsView() {
  const filters = [["all", "Все"], ["A1", "A1"], ["A2", "A2"], ["learned", "Освоенные"]];
  const list = verbLibrary.filter((verb) => {
    if (verbFilter === "learned") return verbStat(verb.id).right >= 3;
    if (verbFilter === "A1" || verbFilter === "A2") return verb.level === verbFilter;
    return true;
  });
  const mastered = Object.values(state.verbStats).filter((item) => item.right >= 3).length;
  return `<header class="page-head"><div><p class="eyebrow">Новый раздел</p><h1>Лаборатория глаголов</h1><p>${verbLibrary.length} глаголов · 5 времён · ${mastered} освоено</p></div><button class="soft-button" type="button" data-practice-mode="drill">Тренажёр</button></header>
    <div class="card verb-toolbar">
      <input id="verbSearch" type="search" autocomplete="off" placeholder="Найти глагол: писать, katab, шرب…">
      <div class="filter-row">${filters.map(([id, label]) => `<button class="${verbFilter === id ? "primary-button" : "soft-button"}" type="button" data-verb-filter="${id}">${label}</button>`).join("")}</div>
    </div>
    <div class="verb-grid" id="verbGrid">${list.map(verbCard).join("") || `<div class="empty-state">Пока нет глаголов в этом фильтре. Потренируйтесь, чтобы отметить освоенные.</div>`}</div>`;
}

function verbDetailView(verbId) {
  const verb = verbLibrary.find((item) => item.id === verbId);
  if (!verb) return notFoundView();
  const forms = verb.forms[verbTense] || verb.forms.present;
  const tenseInfo = verbTenses.find((item) => item.id === verbTense) || verbTenses[0];
  const stat = verbStat(verb.id);
  const mastery = Math.min(100, percent(stat.right, 3));
  return `<button class="soft-button back-button" type="button" data-route="verbs">← Все глаголы</button>
    <section class="lesson-hero verb-hero" style="--module-color:#00838F">
      <p class="eyebrow">Глагол · ${escapeHtml(verb.level)} · корень ${escapeHtml(verb.root)}</p>
      <h1><span class="arabic" lang="ar">${escapeHtml(verb.ar)}</span> <span class="verb-hero-tr">${escapeHtml(verb.tr)}</span></h1>
      <p class="hero-copy">${escapeHtml(verb.ru)}</p>
      <div class="lesson-meta"><span class="chip">${escapeHtml(verb.pattern)}</span><span class="chip">${stat.right} ✓ / ${stat.wrong} ✗</span></div>
      <div class="lesson-actions"><button class="primary-button" type="button" data-drill-verb="${verb.id}">Тренировать этот глагол</button>${speakButton(verb.ar, "Прослушать глагол")}</div>
    </section>
    <section class="lesson-section">
      <div class="section-head"><div><h2>Спряжение</h2><p>${escapeHtml(tenseInfo.hint)}</p></div><span class="chip">${escapeHtml(tenseInfo.title)}</span></div>
      <div class="tense-tabs">${verbTenses.map((item) => `<button class="${item.id === verbTense ? "active" : ""}" type="button" data-verb-tense="${item.id}">${escapeHtml(item.title)}</button>`).join("")}</div>
      <div class="plan-table conj-table"><table><thead><tr><th>Лицо</th><th>Арабский</th><th>Транскрипция</th><th></th></tr></thead><tbody>
        ${forms.map((form) => `<tr><td>${escapeHtml(form.person)}</td><td class="arabic" lang="ar">${escapeHtml(form.ar)}</td><td class="vocab-tr">${escapeHtml(form.tr)}</td><td>${speakButton(form.ar)}</td></tr>`).join("")}
      </tbody></table></div>
      <div class="mastery-row"><span>Освоение</span><span class="progress-track"><span class="progress-fill" style="width:${mastery}%"></span></span><small>${stat.right >= 3 ? "✓ закреплено" : "3 верных ответа"}</small></div>
    </section>
    ${verb.note ? `<section class="lesson-section"><h2>Подсказка</h2><p>${escapeHtml(verb.note)}</p></section>` : ""}
    <section class="lesson-section"><h2>Пример</h2><div class="example-row"><span class="arabic" lang="ar">${escapeHtml(verb.example.ar)}</span><small>${escapeHtml(verb.example.tr)}</small><div>${escapeHtml(verb.example.ru)}</div></div></section>`;
}

function phraseItem(item) {
  const favorite = state.favorites.includes(item.ar);
  return `<article class="vocab-item phrase-item">
    <div>
      <div class="vocab-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>
      ${state.showTranscription ? `<div class="vocab-tr">${escapeHtml(item.tr)}</div>` : ""}
      <div class="vocab-ru">${escapeHtml(item.ru)}</div>
    </div>
    <div class="phrase-actions">${audioActions(item.ar)}<button class="fav-button ${favorite ? "active" : ""}" type="button" data-fav-phrase="${escapeHtml(item.ar)}" aria-label="${favorite ? "Убрать из избранного" : "В избранное"}" title="${favorite ? "Убрать из избранного" : "В избранное"}">${favorite ? "★" : "☆"}</button></div>
  </article>`;
}

function phrasebookView(embedded = false) {
  if (!phrasebook.some((category) => category.id === state.phraseCategory)) state.phraseCategory = phrasebook[0].id;
  const active = phrasebook.find((category) => category.id === state.phraseCategory) || phrasebook[0];
  const items = active.id === "favorites" ? favoritePhrases() : active.phrases;
  const body = `<div class="phrasebook">
    <div class="phrase-categories">${phrasebook.map((category) => `<button class="${category.id === active.id ? "primary-button" : "soft-button"}" type="button" data-phrase-category="${category.id}"><span aria-hidden="true">${category.icon}</span> ${escapeHtml(category.title)}${category.id === "favorites" ? ` (${state.favorites.length})` : ""}</button>`).join("")}</div>
    <div class="section-head"><div><h2>${escapeHtml(active.icon)} ${escapeHtml(active.title)}</h2><p>${items.length ? `${items.length} фраз · нажмите ★, чтобы сохранить` : "Сохраняйте нужные фразы звёздочкой"}</p></div><button class="soft-button" type="button" data-random-phrase>🔀 Случайная фраза</button></div>
    <div class="vocab-list">${items.map(phraseItem).join("") || `<div class="empty-state">В избранном пока пусто. Откройте любую категорию и нажмите ★ у нужной фразы.</div>`}</div>
  </div>`;
  if (embedded) return body;
  return `<header class="page-head"><div><p class="eyebrow">Быстрая помощь</p><h1>Разговорник</h1><p>${allPhrases().length} фраз для реальных ситуаций · работает офлайн</p></div><button class="soft-button" type="button" data-route="reference">Шпаргалка</button></header>${body}`;
}

function referenceView() {
  const cell = (value) => {
    const arabic = /[\u0600-\u06FF]/.test(value);
    return `<td${arabic ? ` class="arabic ref-arabic" lang="ar"` : ""}>${escapeHtml(value)}</td>`;
  };
  return `<header class="page-head"><div><p class="eyebrow">Быстрый справочник</p><h1>Шпаргалка</h1><p>Местоимения, суффиксы, вопросы, предлоги и формулы времён</p></div><div class="lesson-actions"><button class="soft-button" type="button" data-route="grammar">🧠 Грамматика</button><button class="soft-button" type="button" data-route="culture">🏛 Культура</button><button class="soft-button" type="button" data-route="colors">🎨 Цвета</button><button class="soft-button" type="button" data-route="phrases">Разговорник</button></div></header>
    ${quickReference.map((section) => `<section class="lesson-section ref-section"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.intro)}</p><div class="plan-table"><table><thead><tr>${section.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${section.rows.map((row) => `<tr>${row.map(cell).join("")}</tr>`).join("")}</tbody></table></div></section>`).join("")}`;
}

function buildDrill(verbId = null, tense = drillTense) {
  const verb = (verbId && verbLibrary.find((item) => item.id === verbId)) || verbLibrary[Math.floor(Math.random() * verbLibrary.length)];
  const chosenTense = tense === "all" || !verb.forms[tense] ? verbTenses[Math.floor(Math.random() * verbTenses.length)].id : tense;
  const forms = verb.forms[chosenTense];
  const uniqueForms = forms.filter((form, index) => forms.findIndex((entry) => entry.ar === form.ar) === index);
  const correct = uniqueForms[Math.floor(Math.random() * uniqueForms.length)];
  const distractors = shuffle(uniqueForms.filter((form) => form.ar !== correct.ar)).slice(0, 3);
  const options = shuffle([correct, ...distractors]);
  return { verb, tense: chosenTense, correct, options, answered: false, selected: null };
}

function drillTenseTabs(current) {
  return `<div class="tense-tabs">${verbTenses.map((item) => `<button class="${item.id === current ? "active" : ""}" type="button" data-drill-tense="${item.id}">${escapeHtml(item.title)}</button>`).join("")}</div>`;
}

function drillView(embedded = false) {
  if (!drillState) drillState = buildDrill();
  const { verb, correct, options, answered, selected, tense } = drillState;
  const tenseInfo = verbTenses.find((item) => item.id === tense) || verbTenses[0];
  const stat = verbStat(verb.id);
  const body = `<div class="card quiz-card">
    <div class="drill-head">
      <p class="eyebrow">Спряжение · ${escapeHtml(verb.ru)} · ${stat.right} ✓ / ${stat.wrong} ✗</p>
      <button class="link-button" type="button" data-open-verb="${verb.id}">${escapeHtml(verb.ar)} →</button>
    </div>
    ${drillTenseTabs(tense)}
    <p class="muted tense-hint">${escapeHtml(tenseInfo.hint)}</p>
    <div class="quiz-prompt">${escapeHtml(correct.person)} — выберите форму<br><span class="drill-verb">${escapeHtml(verb.ar)} · ${escapeHtml(verb.tr)}</span></div>
    <div class="choice-grid">
      ${options.map((form) => {
        let className = "choice-button";
        if (answered && form.ar === correct.ar) className += " correct";
        else if (answered && form.ar === selected) className += " wrong";
        return `<button class="${className}" type="button" data-drill-choice="${escapeHtml(form.ar)}" ${answered ? "disabled" : ""}><span class="arabic" lang="ar">${escapeHtml(form.ar)}</span>${state.showTranscription ? `<small class="vocab-tr">${escapeHtml(form.tr)}</small>` : ""}</button>`;
      }).join("")}
    </div>
    <div class="quiz-feedback">${answered ? (selected === correct.ar ? "✓ Верно" : `Правильный ответ: <span class="arabic" lang="ar">${escapeHtml(correct.ar)}</span>${state.showTranscription ? ` <small class="vocab-tr">${escapeHtml(correct.tr)}</small>` : ""}`) : ""}</div>
    ${answered ? `<div class="lesson-actions"><button class="primary-button" type="button" data-next-drill>Следующий глагол</button>${speakButton(correct.ar)}</div>` : ""}
  </div>`;
  if (embedded) return body;
  return `<section class="section"><h2>Лаборатория глаголов</h2><p class="muted">Выберите время, лицо и проверьте форму. Всего в базе ${verbLibrary.length} глаголов.</p>${body}</section>`;
}

function buildListening(lessonId = null) {
  const lesson = lessonId ? lessons.find((item) => item.id === lessonId) : null;
  const scope = lesson ? lesson.vocabulary.map((item) => ({ ...item, lessonId: lesson.id, lessonTitle: lesson.title })) : allVocab();
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
  if (play) setTimeout(() => playPhrase(listenState.item.ar, { openDialog: false }), 150);
}

function refreshListen() {
  const [route, lessonId] = getRoute();
  if (route === "practice") {
    main.innerHTML = practiceView("listen");
    setTimeout(() => playPhrase(listenState.item.ar, { openDialog: false }), 150);
    return;
  }
  renderListen(lessonId || listenState.lessonId, true);
}

function mediaCard(media) {
  return `<button class="card media-card" type="button" data-open-media="${media.id}"><div class="media-thumb"><img src="${media.poster}" alt="" loading="lazy"><span class="play-mark" aria-hidden="true">▶</span></div><div class="media-copy"><h3>${escapeHtml(media.title)}</h3><p>${escapeHtml(media.subtitle)}</p></div></button>`;
}

function mediaView() {
  return `<header class="page-head"><div><p class="eyebrow">Визуальное повторение</p><h1>Видео</h1><p>Короткие озвученные сцены с субтитрами. Для тренировки произношения используйте кнопку звука в уроках.</p></div><button class="soft-button" type="button" data-route="library">🎧 Аудио и PDF</button></header><div class="media-grid">${mediaLessons.map(mediaCard).join("")}</div>`;
}

function audioRow(track) {
  const playing = currentAudioTrack?.id === track.id;
  return `<button class="audio-row ${playing ? "playing" : ""}" type="button" data-play-audio="${track.id}" data-audio-id="${track.id}">
    <span class="audio-row-play" aria-hidden="true">${playing && !audioPlayer.paused ? "⏸" : "▶"}</span>
    <span class="audio-row-info"><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.subtitle)}</small></span>
    <span class="audio-row-meta"><span class="source-badge">${track.kind === "intro" ? "Введение" : `Модуль ${track.module}`}</span><span class="track-duration">MP3</span></span>
  </button>`;
}

function wordAudioRow(item, lessonId, index) {
  return `<article class="word-audio-row">
    <div class="word-audio-main">
      <strong class="arabic" lang="ar">${escapeHtml(item.ar)}</strong>
      <small>${state.showTranscription ? `<span dir="ltr">${escapeHtml(item.tr)}</span> · ` : ""}${escapeHtml(item.ru)}</small>
    </div>
    <button class="speak-button has-file" type="button" data-say="${escapeHtml(item.ar)}" data-word-key="${lessonId}:${index}" aria-label="Прослушать слово" title="Прослушать слово">🔊</button>
  </article>`;
}

function wordAudioSet(lesson) {
  const rows = lesson.vocabulary.map((item, index) => wordAudioRow(item, lesson.id, index + 1)).join("");
  return `<details class="word-audio-set">
    <summary>
      <span class="word-audio-summary-main">
        <strong>Урок ${String(lesson.order).padStart(2, "0")} · ${escapeHtml(lesson.title)}</strong>
        <small>${escapeHtml(lesson.arTitle)} · ${escapeHtml(lesson.level)} · ${lesson.vocabulary.length} слов и фраз</small>
      </span>
      <span class="chip">${lesson.vocabulary.length} MP3</span>
    </summary>
    <div class="word-audio-body">
      <button class="soft-button" type="button" data-play-word-list="${lesson.id}">▶ Прослушать все слова</button>
      <div class="word-audio-list">${rows}</div>
    </div>
  </details>`;
}

function wordsAudioBody() {
  return `<div class="section-head"><div><h2>Слова с аудио</h2><p>${wordAudioUniqueCount} уникальных слов · ${wordAudioCount} записанных клипов · каждый урок можно слушать целиком</p></div><span class="chip">${wordAudioCount} MP3</span></div>
    ${modules.map((module) => {
      const moduleLessons = lessons.filter((lesson) => lesson.module === module.id);
      const moduleWords = moduleLessons.reduce((sum, lesson) => sum + lesson.vocabulary.length, 0);
      return `<section class="word-audio-module">
        <div class="audio-group-head"><h3>Модуль ${module.id} · ${escapeHtml(module.title)}</h3><span>${moduleWords} слов · ${moduleLessons.length} уроков</span></div>
        ${moduleLessons.map(wordAudioSet).join("")}
      </section>`;
    }).join("")}`;
}

function pdfCard(item) {
  return `<article class="pdf-card">
    <span class="pdf-cover" aria-hidden="true">📖</span>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.subtitle || "")}</p>
    ${item.ar ? `<p class="arabic" lang="ar">${escapeHtml(item.ar)}</p>` : ""}
    <div class="pdf-card-actions">
      ${item.pdf ? `<button class="primary-button" type="button" data-open-pdf="${item.pdf}" data-pdf-title="${escapeHtml(item.title)}">Открыть PDF</button>` : ""}
      ${item.audio ? `<button class="soft-button" type="button" data-play-audio="${item.audio}">▶ Аудио</button>` : ""}
      ${item.lessonId ? `<button class="soft-button" type="button" data-open-lesson="${item.lessonId}">Урок</button>` : ""}
    </div>
  </article>`;
}

function libraryView() {
  const tab = state.libraryTab || "audio";
  const tabs = [["audio", "🎧 Аудиокурс"], ["words", "🗣 Слова"], ["text", "📖 Учебник PDF"], ["colors", "🎨 Цвета"], ["video", "🎬 Видео"]];
  let body = "";
  if (tab === "colors") {
    body = colorsBody();
  } else if (tab === "words") {
    body = wordsAudioBody();
  } else if (tab === "text") {
    body = `
      <div class="section-head"><div><h2>Введение и алфавит</h2><p>Бесплатные материалы для старта</p></div></div>
      <div class="library-grid">${textbookFrontMatter.map((item) => pdfCard({ ...item, audio: item.audio ? `front-${item.id}` : "" })).join("")}</div>
      ${textbookParts.map((part) => {
        const units = textbookUnits.filter((unit) => part.modules.includes(unit.module));
        return `<section class="section">
          <div class="section-head"><div><h2>${escapeHtml(part.title)} · ${escapeHtml(part.subtitle)}</h2><p>Модули ${part.modules.join(", ")} · ${units.length} глав</p></div><span class="chip">${escapeHtml(textbookMeta.levels)}</span></div>
          <div class="library-grid">${units.map((unit) => {
            const first = lessonAudio(unit.lessons[0]?.id);
            return pdfCard({ title: `Модуль ${unit.module} · ${unit.title}`, subtitle: `${unit.lessons.length} уроков · ${unit.level}`, ar: unit.ar, pdf: unit.chapter, audio: first?.id, lessonId: unit.lessons[0]?.id });
          }).join("")}</div>
        </section>`;
      }).join("")}`;
  } else if (tab === "video") {
    body = `<div class="section-head"><div><h2>Видеоуроки</h2><p>Короткие сцены с русскими субтитрами</p></div><span class="chip">${mediaLessons.length} видео</span></div><div class="media-grid">${mediaLessons.map(mediaCard).join("")}</div>`;
  } else {
    const groups = new Map();
    audioLibrary.forEach((track) => {
      if (!groups.has(track.group)) groups.set(track.group, []);
      groups.get(track.group).push(track);
    });
    body = `<div class="section-head"><div><h2>Аудиокурс</h2><p>${audioLibrary.length} записанных файлов · работают офлайн · можно слушать целиком или по урокам</p></div><button class="soft-button" type="button" data-play-audio="${audioLibrary[0]?.id || ""}">▶ Начать</button></div>
      ${[...groups].map(([group, tracks]) => `<section class="audio-group">
        <div class="audio-group-head"><h3>${escapeHtml(group)}</h3><span>${tracks.length} файл${tracks.length === 1 ? "" : "ов"}</span></div>
        <div class="audio-list">${tracks.map(audioRow).join("")}</div>
      </section>`).join("")}`;
  }
  return `<header class="page-head"><div><p class="eyebrow">Аудио, учебник и видео</p><h1>Библиотека</h1><p>${audioTotalCount} аудиофайлов · ${wordAudioUniqueCount} слов · ${textbookPdfCount} PDF-глав · ${colorLesson.colors.length} цветов · ${mediaLessons.length} видео · всё доступно офлайн после загрузки</p></div><button class="soft-button" type="button" data-route="recordings">🎙 Мои записи</button></header>
    <div class="library-tabs">${tabs.map(([id, label]) => `<button class="${tab === id ? "primary-button" : "soft-button"}" type="button" data-library-tab="${id}">${label}</button>`).join("")}</div>
    ${body}`;
}

function recordingsView() {
  return `<header class="page-head"><div><p class="eyebrow">Ваш голос</p><h1>Мои аудиозаписи</h1><p>Записи хранятся на этом устройстве и работают без интернета</p></div><div class="lesson-actions"><button class="soft-button" type="button" data-route="library">🎧 В библиотеку</button><button class="soft-button danger-soft" type="button" data-clear-recordings>Очистить все</button></div></header>
    <section class="section lesson-section">
      <div id="recordingsList" class="recordings-list"><div class="empty-state">Загружаем записи…</div></div>
    </section>`;
}

async function loadRecordingsView() {
  const container = document.querySelector("#recordingsList");
  if (!container) return;
  const records = await listRecordings();
  if (!records.length) {
    container.innerHTML = `<div class="empty-state"><h3>Записей пока нет</h3><p>Откройте урок или разговорник и нажмите 🎙 рядом с фразой. Можно записать голос с микрофона или загрузить готовый аудиофайл.</p><button class="primary-button" type="button" data-route="course">Перейти к урокам</button></div>`;
    return;
  }
  container.innerHTML = records.map((record) => {
    const date = new Date(record.updated || Date.now());
    return `<article class="recording-row">
      <div><strong class="arabic" lang="ar">${escapeHtml(record.key)}</strong><small>${escapeHtml(record.ru || "Своя запись")} · ${Math.max(1, Math.round((record.size || 0) / 1024))} КБ · ${date.toLocaleDateString("ru-RU")}</small></div>
      <div class="recording-row-actions">
        <button class="speak-button" type="button" data-say="${escapeHtml(record.key)}" aria-label="Прослушать запись" title="Прослушать запись">🔊</button>
        <button class="record-button" type="button" data-record-say="${escapeHtml(record.key)}" aria-label="Перезаписать" title="Перезаписать">🎙</button>
        <button class="soft-button danger-soft" type="button" data-delete-recording="${escapeHtml(record.key)}" aria-label="Удалить запись" title="Удалить">🗑</button>
      </div>
    </article>`;
  }).join("");
  refreshRecordingBadges();
}

function colorCard(item) {
  return `<article class="color-card">
    <span class="color-chip" style="--chip-color:${item.hex}" aria-hidden="true"></span>
    <div class="color-card-head">
      <div>
        <div class="color-card-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>
        ${state.showTranscription ? `<div class="color-card-tr">${escapeHtml(item.tr)}</div>` : ""}
        <div class="color-card-ru">${escapeHtml(item.ru)}</div>
      </div>
      ${audioActions(item.ar, `Прослушать цвет: ${item.ru}`)}
    </div>
    ${item.fem ? `<div class="color-card-fem">Женская форма: <span class="arabic" lang="ar">${escapeHtml(item.fem)}</span>${state.showTranscription && item.femTr ? ` · <small>${escapeHtml(item.femTr)}</small>` : ""}</div>` : ""}
  </article>`;
}

function colorsBody() {
  const linkedLesson = lessons.find((item) => item.id === colorLesson.lessonId);
  const grammar = colorLesson.grammar.map((item) => `
    <section class="grammar-block">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.text)}</p>
      <div class="example-list">
        ${item.examples.map((ex) => `<div class="example-row"><span class="arabic" lang="ar">${escapeHtml(ex.ar)}</span>${state.showTranscription ? `<small>${escapeHtml(ex.tr)}</small>` : ""}<div>${escapeHtml(ex.ru)}</div>${audioActions(ex.ar)}</div>`).join("")}
      </div>
    </section>`).join("");
  const phrases = colorLesson.phrases.map((item) => `
    <article class="vocab-item">
      <div>
        <div class="vocab-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>
        ${state.showTranscription ? `<div class="vocab-tr">${escapeHtml(item.tr)}</div>` : ""}
        <div class="vocab-ru">${escapeHtml(item.ru)}</div>
      </div>
      ${audioActions(item.ar)}
    </article>`).join("");
  return `
    <section class="section lesson-section">
      <div class="section-head"><div><h2>Палитра цветов · لوحة الألوان</h2><p>${colorLesson.colors.length} цветов с произношением и женской формой</p></div><span class="chip">Модуль 9${linkedLesson ? ` · урок ${linkedLesson.order}` : ""}</span></div>
      <div class="color-grid">${colorLesson.colors.map(colorCard).join("")}</div>
    </section>
    <section class="section lesson-section">
      <h2>Грамматика цвета</h2>
      <p class="muted">Как поставить цвет после существительного и согласовать его в роде.</p>
      ${grammar}
    </section>
    <section class="section lesson-section">
      <h2>Фразы про цвет и покупки</h2>
      <div class="vocab-list">${phrases}</div>
    </section>
    <section class="section lesson-section">
      <h2>Связанный урок курса</h2>
      <p>Тема «Цвета» — часть урока «${escapeHtml(linkedLesson?.title || "Одежда размер и цвет")}». Там вы найдёте одежду, размеры и диалог в магазине.</p>
      <div class="lesson-actions">
        ${linkedLesson ? `<button class="primary-button" type="button" data-open-lesson="${linkedLesson.id}">📖 Открыть урок ${linkedLesson.order}</button>` : ""}
        <button class="soft-button" type="button" data-route="practice">🃏 Карточки практики</button>
        <button class="soft-button" type="button" data-open-palette>🎨 Сменить палитру</button>
      </div>
    </section>`;
}

function colorsView() {
  const linkedLesson = lessons.find((item) => item.id === colorLesson.lessonId);
  return `<header class="page-head">
    <div><p class="eyebrow">Материал курса · Модуль 9 · Цвета</p><h1>${escapeHtml(colorLesson.title)} · <span class="arabic" lang="ar">${escapeHtml(colorLesson.arTitle)}</span></h1><p>${escapeHtml(colorLesson.subtitle)} · ${escapeHtml(colorLesson.arSubtitle)}</p></div>
    <div class="lesson-actions">${linkedLesson ? `<button class="soft-button" type="button" data-open-lesson="${linkedLesson.id}">📖 Урок ${linkedLesson.order}</button>` : ""}<button class="soft-button" type="button" data-open-palette>🎨 Палитра</button></div>
  </header>
  <section class="section lesson-section"><p>${escapeHtml(colorLesson.intro)}</p></section>
  ${colorsBody()}`;
}

function programProgress(program) {
  if (program.kind === "modules") {
    const done = completedCount();
    return { done, total: lessons.length, label: `${done} из ${lessons.length} уроков`, percent: percent(done, lessons.length) };
  }
  if (program.kind === "writing") {
    const done = writingDoneCount();
    return { done, total: writingTasks.length, label: `${done} из ${writingTasks.length} заданий`, percent: percent(done, writingTasks.length) };
  }
  if (program.kind === "grammar") {
    const mastered = Object.values(state.verbStats).filter((item) => item.right >= 3).length;
    return { done: mastered, total: verbLibrary.length, label: `${mastered} из ${verbLibrary.length} глаголов освоено`, percent: percent(mastered, verbLibrary.length) };
  }
  if (program.kind === "speaking") {
    return { done: null, total: null, label: `${program.phraseGroups.length} тем · ${allPhrases().length} фраз` };
  }
  if (program.kind === "audio") {
    const plays = Number(state.audioPlays) || 0;
    return { done: Math.min(plays, audioTotalCount), total: audioTotalCount, label: `${plays} запусков · ${audioTotalCount} аудиофайлов`, percent: percent(Math.min(plays, audioTotalCount), audioTotalCount) };
  }
  return { done: 0, total: 1, label: "", percent: 0 };
}

function programCard(program) {
  const progress = programProgress(program);
  return `<button class="card program-card" type="button" data-open-program="${program.id}" style="--program-color:${program.color}">
    <span class="program-card-top"><span class="program-icon">${program.icon}</span><span class="chip">${escapeHtml(program.level)}</span></span>
    <strong class="program-title">${escapeHtml(program.title)}</strong>
    <span class="program-ar arabic" lang="ar">${escapeHtml(program.ar)}</span>
    <small class="program-desc">${escapeHtml(program.description)}</small>
    <span class="program-facts"><span>${program.weeks} недель</span><span>${program.hours} ч</span><span>${program.lessons} ${program.kind === "speaking" ? "тем" : "ед."}</span></span>
    ${progress.percent !== undefined ? `<span class="progress-track"><span class="progress-fill" style="width:${progress.percent}%"></span></span>` : ""}
    <span class="program-progress-label">${escapeHtml(progress.label)}</span>
    <span class="program-open">Открыть программу →</span>
  </button>`;
}

function programsView() {
  const status = certificateEligibility();
  return `<header class="page-head">
    <div><p class="eyebrow">Академия Masri RU</p><h1>Полные курсы</h1><p>${learningPrograms.length} программы · ${lessons.length} уроков · ${verbLibrary.length} глаголов · ${audioTotalCount} аудио · ${textbookPdfCount} PDF</p></div>
    <div class="lesson-actions"><button class="soft-button" type="button" data-route="exams">📝 Экзамены</button><button class="soft-button" type="button" data-route="certificate">🏆 Сертификат</button></div>
  </header>
  <section class="section">
    <div class="program-grid">${learningPrograms.map(programCard).join("")}</div>
  </section>
  <section class="section lesson-section">
    <h2>Как устроена академия</h2>
    <div class="academy-steps">
      <article><strong>1</strong><div><h3>Выберите программу</h3><p>Основной курс, разговорная практика, грамматика, письмо или аудиокурс.</p></div></article>
      <article><strong>2</strong><div><h3>Проходите уроки</h3><p>Слушайте файлы, повторяйте фразы, записывайте голос и открывайте PDF.</p></div></article>
      <article><strong>3</strong><div><h3>Сдавайте экзамены</h3><p>После каждого модуля — тест из ${examMeta.moduleQuestions} вопросов, в конце — итоговый экзамен.</p></div></article>
      <article><strong>4</strong><div><h3>Получите сертификат</h3><p>${status.eligible ? "Все условия выполнены — сертификат готов к печати." : "Сертификат открывается после уроков, 12 экзаменов и практики письма."}</p></div></article>
    </div>
  </section>`;
}

function programView(programId) {
  const program = learningPrograms.find((item) => item.id === programId);
  if (!program) return notFoundView();
  const progress = programProgress(program);
  let curriculum = "";
  if (program.kind === "modules") {
    curriculum = `<div class="module-grid">${program.modules.map((id) => modules.find((module) => module.id === id)).filter(Boolean).map(moduleCard).join("")}</div>`;
  } else if (program.kind === "speaking") {
    curriculum = `<div class="program-topic-grid">${program.phraseGroups.map((id) => {
      const group = phrasebook.find((item) => item.id === id);
      if (!group) return "";
      return `<article class="card program-topic-card"><span class="program-topic-icon">${group.icon}</span><h3>${escapeHtml(group.title)}</h3><p>${group.phrases.length} готовых фраз · ${escapeHtml(group.id)}</p><button class="soft-button" type="button" data-program-phrase="${group.id}">Открыть тему →</button></article>`;
    }).join("")}</div>`;
  } else if (program.kind === "grammar") {
    curriculum = `<div class="program-topic-list">${program.modules.map((id) => {
      const module = modules.find((item) => item.id === id);
      const grammarCount = moduleLessons(id).reduce((sum, lesson) => sum + lesson.grammar.length, 0);
      return `<button class="program-topic-row" type="button" data-open-grammar="${id}"><span class="program-topic-num">${id}</span><span><strong>${escapeHtml(module?.title || `Модуль ${id}`)}</strong><small>${grammarCount} грамматических тем · ${moduleLessons(id).length} урока</small></span><span>→</span></button>`;
    }).join("")}</div>`;
  } else if (program.kind === "writing") {
    curriculum = `<div class="section lesson-section"><h2>Правила письма</h2><div class="writing-tips">${writingTips.map((tip) => `<article class="writing-tip"><strong>${escapeHtml(tip.title)}</strong><p>${escapeHtml(tip.text)}</p></article>`).join("")}</div><div class="lesson-actions"><button class="primary-button" type="button" data-route="writing">Открыть лабораторию письма</button></div></div>
      <div class="section lesson-section"><h2>Слова для практики</h2><div class="writing-word-cloud">${writingTasks.slice(0, 12).map((task) => `<span class="writing-word arabic" lang="ar">${escapeHtml(task.ar)}</span>`).join("")}</div></div>`;
  } else if (program.kind === "audio") {
    const groups = new Map();
    audioLibrary.forEach((track) => {
      if (!groups.has(track.group)) groups.set(track.group, []);
      groups.get(track.group).push(track);
    });
    curriculum = `<div class="program-topic-list">${[...groups].map(([group, tracks]) => `<article class="program-audio-row"><div><strong>${escapeHtml(group)}</strong><small>${tracks.length} аудио · PDF и уроки внутри</small></div><div class="lesson-actions"><button class="soft-button" type="button" data-play-audio="${tracks[0].id}">▶ Слушать</button></div></article>`).join("")}</div>`;
  }
  return `<button class="soft-button back-button" type="button" data-route="programs">← Все программы</button>
    <section class="lesson-hero program-hero" style="--module-color:${program.color}">
      <p class="eyebrow">Программа · ${escapeHtml(program.level)}</p>
      <h1>${program.icon} ${escapeHtml(program.title)}</h1>
      <div class="arabic-display" lang="ar">${escapeHtml(program.ar)}</div>
      <p>${escapeHtml(program.description)}</p>
      <div class="lesson-meta"><span class="chip">${program.weeks} недель</span><span class="chip">${program.hours} часов</span><span class="chip">${program.lessons} ${program.kind === "speaking" ? "тем" : "единиц"}</span><span class="chip">${escapeHtml(progress.label)}</span></div>
    </section>
    <div class="lesson-actions program-actions">
      ${program.kind === "modules" ? `<button class="primary-button" type="button" data-route="course">▶ Продолжить курс</button>` : ""}
      <button class="soft-button" type="button" data-route="exams">📝 Экзамены программы</button>
      <button class="soft-button" type="button" data-route="certificate">🏆 Сертификат</button>
    </div>
    <section class="section lesson-section">
      <h2>Что вы освоите</h2>
      <ul class="goal-list">${program.outcomes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <span class="progress-track big-track"><span class="progress-fill" style="width:${progress.percent || 0}%"></span></span>
      <p class="muted">${escapeHtml(progress.label)}</p>
    </section>
    ${curriculum}`;
}

function examsView() {
  const passed = passedExamCount();
  const totalModules = moduleExamIds().length;
  return `<header class="page-head">
    <div><p class="eyebrow">Академия · Проверка знаний</p><h1>Экзамены</h1><p>${totalModules} модульных экзаменов по ${examMeta.moduleQuestions} вопросов и финальный экзамен на ${examMeta.finalQuestions} вопросов</p></div>
    <button class="soft-button" type="button" data-route="programs">🎓 Программы</button>
  </header>
  <section class="section lesson-section">
    <div class="section-head"><div><h2>Прогресс аттестации</h2><p>Минимальный порог — ${examMeta.passPercent}% правильных ответов</p></div><span class="chip">${passed} из ${totalModules} сдано</span></div>
    <span class="progress-track big-track"><span class="progress-fill" style="width:${percent(passed, totalModules)}%"></span></span>
    <div class="lesson-actions" style="margin-top:.8rem"><button class="soft-button" type="button" data-route="certificate">Проверить сертификат</button><button class="soft-button" type="button" data-route="course">Повторить уроки</button></div>
  </section>
  <div class="exam-grid">${modules.map((module) => {
    const examId = `module-${module.id}`;
    const record = state.examScores?.[examId];
    const isPassed = examPassed(examId);
    const best = Number(record?.best) || 0;
    return `<article class="card exam-card ${isPassed ? "passed" : ""}">
      <div class="exam-card-top"><span class="exam-icon">${isPassed ? "✓" : "📝"}</span><span class="chip">Модуль ${module.id}</span></div>
      <h3>${escapeHtml(module.title)}</h3>
      <span class="arabic" lang="ar">${escapeHtml(module.ar)}</span>
      <p>${moduleLessons(module.id).length} урока · ${examTotal(examId)} вопросов</p>
      <div class="exam-score">${record ? `Лучший результат: ${best}/${examTotal(examId)}` : "Ещё не сдан"}</div>
      <button class="${isPassed ? "soft-button" : "primary-button"}" type="button" data-start-exam="${module.id}">${isPassed ? "Пройти снова" : "Начать экзамен"}</button>
    </article>`;
  }).join("")}</div>
  <section class="section lesson-section final-exam-card">
    <div><p class="eyebrow">Финальная аттестация</p><h2>${examPassed("final") ? "✓ Итоговый экзамен сдан" : "Итоговый экзамен курса"}</h2><p>${examMeta.finalQuestions} вопросов по всем 12 модулям · ${examPassed("final") ? `Лучший результат: ${state.examScores.final.best}/${examTotal("final")}` : "Рекомендуется после модульных экзаменов"}</p></div>
    <button class="${examPassed("final") ? "soft-button" : "primary-button"}" type="button" data-start-exam="final">${examPassed("final") ? "Пройти снова" : "Начать финальный экзамен"}</button>
  </section>`;
}

function buildExam(moduleId = null) {
  const examId = moduleId ? `module-${moduleId}` : "final";
  const sourceLessons = moduleId ? lessons.filter((lesson) => lesson.module === Number(moduleId)) : lessons;
  const pool = sourceLessons.flatMap((lesson) => lesson.vocabulary.map((item) => ({ ...item, lessonId: lesson.id, lessonTitle: lesson.title })));
  const count = Math.min(moduleId ? examMeta.moduleQuestions : examMeta.finalQuestions, pool.length);
  const selected = shuffle([...pool]).slice(0, count);
  const globalMeanings = [...new Set(allVocab().map((item) => item.ru))];
  const globalArabic = [...new Set(allVocab().map((item) => item.ar))];
  const questions = selected.map((item) => {
    const direction = Math.random() < .5 ? "ar" : "ru";
    const answerPool = direction === "ru" ? globalArabic : globalMeanings;
    const answer = direction === "ru" ? item.ar : item.ru;
    const distractors = shuffle(answerPool.filter((value) => value !== answer)).slice(0, 3);
    return { item, direction, answer, options: shuffle([...new Set([answer, ...distractors])]) };
  });
  return { examId, moduleId: moduleId ? Number(moduleId) : null, questions, index: 0, score: 0, answered: false, selected: null, finished: false, saved: false };
}

function examView() {
  if (!examState) return examsView();
  const examTitle = examState.examId === "final" ? "Итоговый экзамен" : `Экзамен · Модуль ${examState.moduleId}`;
  const total = examState.questions.length;
  if (examState.finished) {
    const passed = examState.score >= examPassScore(examState.examId);
    return `<button class="soft-button back-button" type="button" data-exam-exit>← Все экзамены</button>
      <section class="section"><div class="card quiz-card exam-result">
        <p class="eyebrow">${escapeHtml(examTitle)} · результат</p>
        <h2>${examState.score} из ${total}</h2>
        <p>${passed ? "✓ Экзамен сдан. Результат сохранён в прогрессе." : `Пока недостаточно: нужно ${examPassScore(examState.examId)} правильных ответов. Повторите уроки модуля и попробуйте снова.`}</p>
        <div class="lesson-actions">
          <button class="primary-button" type="button" data-exam-restart="${examState.moduleId ?? "final"}">Пройти снова</button>
          <button class="soft-button" type="button" data-exam-exit>Все экзамены</button>
          ${passed ? `<button class="soft-button" type="button" data-route="certificate">🏆 Сертификат</button>` : ""}
        </div>
      </div></section>`;
  }
  const question = examState.questions[examState.index];
  const { item, answer, direction, options } = question;
  const readingArabic = direction === "ru";
  const optionButtons = options.map((option) => {
    let className = "choice-button";
    if (examState.answered && option === answer) className += " correct";
    else if (examState.answered && option === examState.selected) className += " wrong";
    const label = readingArabic ? `<span class="arabic" lang="ar">${escapeHtml(option)}</span>` : escapeHtml(option);
    return `<button class="${className}" type="button" data-exam-choice="${escapeHtml(option)}" ${examState.answered ? "disabled" : ""}>${label}</button>`;
  }).join("");
  return `<button class="soft-button back-button" type="button" data-exam-exit>← Все экзамены</button>
    <section class="section"><div class="card quiz-card">
      <div class="section-head"><div><p class="eyebrow">${escapeHtml(examTitle)} · вопрос ${examState.index + 1} из ${total}</p><h2>${Math.round((examState.score / total) * 100)}% верных</h2></div><span class="chip">${examMeta.passPercent}% для сдачи</span></div>
      <span class="progress-track big-track"><span class="progress-fill" style="width:${percent(examState.index, total)}%"></span></span>
      <div class="quiz-prompt">${readingArabic ? "Выберите арабскую запись" : "Выберите правильный перевод"}</div>
      ${readingArabic ? `<div class="quiz-ru">${escapeHtml(item.ru)}</div>` : `<div class="quiz-ar arabic" lang="ar">${escapeHtml(item.ar)}</div>${state.showTranscription ? `<p class="vocab-tr">${escapeHtml(item.tr)}</p>` : ""}`}
      <div class="choice-grid">${optionButtons}</div>
      <div class="quiz-feedback">${examState.answered ? (examState.selected === answer ? "✓ Верно" : `Правильный ответ: ${readingArabic ? `<span class="arabic" lang="ar">${escapeHtml(answer)}</span>` : escapeHtml(answer)}`) : ""}</div>
      ${examState.answered ? `<button class="primary-button" type="button" data-exam-next>${examState.index + 1 === total ? "Показать результат" : "Следующий вопрос"}</button>` : ""}
      <p class="muted small">Вопрос по материалу: ${escapeHtml(item.lessonTitle || "курс")}. Экзамен можно проходить повторно.</p>
    </div></section>`;
}

function saveExamResult() {
  if (!examState || examState.saved) return;
  examState.saved = true;
  const id = examState.examId;
  const total = examState.questions.length;
  const score = examState.score;
  const previous = state.examScores[id] || {};
  state.examScores[id] = {
    best: Math.max(Number(previous.best) || 0, score),
    total,
    attempts: (Number(previous.attempts) || 0) + 1,
    date: dayKey(),
  };
  if (score >= examPassScore(id)) {
    touchStreak();
    awardXp(score * 4 + (id === "final" ? 100 : 20));
    state.perfectQuiz = state.perfectQuiz || score === total;
    showToast(id === "final" ? "Итоговый экзамен сдан!" : "Модульный экзамен сдан!");
  } else {
    showToast(`Нужно ${examPassScore(id)} из ${total}. Повторите материал и попробуйте снова.`);
  }
  saveState();
  checkAchievements();
}

function grammarView() {
  const selected = state.grammarModule || "all";
  const visibleModules = selected === "all" ? modules : modules.filter((module) => String(module.id) === String(selected));
  const topicCount = modules.reduce((sum, module) => sum + moduleLessons(module.id).reduce((inner, lesson) => inner + lesson.grammar.length, 0), 0);
  const exampleCount = modules.reduce((sum, module) => sum + moduleLessons(module.id).reduce((inner, lesson) => inner + lesson.grammar.reduce((x, block) => x + block.examples.length, 0), 0), 0);
  return `<header class="page-head">
    <div><p class="eyebrow">Полный грамматический справочник</p><h1>Грамматика</h1><p>${topicCount} тем · ${exampleCount} примеров · 12 модулей · связь с уроками и глаголами</p></div>
    <div class="lesson-actions"><button class="soft-button" type="button" data-route="reference">📐 Шпаргалка</button><button class="soft-button" type="button" data-route="verbs">🧩 Глаголы</button></div>
  </header>
  <div class="card grammar-toolbar">
    <input id="grammarSearch" type="search" autocomplete="off" placeholder="Найти тему: время, вопрос, отрицание…">
    <div class="filter-row"><button class="${selected === "all" ? "primary-button" : "soft-button"}" type="button" data-grammar-filter="all">Все модули</button>${modules.map((module) => `<button class="${String(selected) === String(module.id) ? "primary-button" : "soft-button"}" type="button" data-grammar-filter="${module.id}">${module.id}</button>`).join("")}</div>
  </div>
  ${visibleModules.map((module) => {
    const items = moduleLessons(module.id);
    return `<section class="section lesson-section grammar-topic">
      <div class="section-head"><div><h2>Модуль ${module.id} · ${escapeHtml(module.title)}</h2><p>${items.reduce((sum, lesson) => sum + lesson.grammar.length, 0)} тем · ${escapeHtml(module.level)}</p></div><button class="soft-button" type="button" data-open-module="${module.id}">Уроки →</button></div>
      ${items.map((lesson) => lesson.grammar.map((block) => `<section class="grammar-block" data-grammar-text="${escapeHtml(`${block.title} ${block.explanation} ${block.examples.map((ex) => `${ex.ar} ${ex.tr} ${ex.ru}`).join(" ")}`.toLocaleLowerCase("ru"))}">
        <h3>${escapeHtml(block.title)}</h3>
        <p>${escapeHtml(block.explanation)}</p>
        <div class="example-list">${block.examples.map((ex) => `<div class="example-row"><span class="arabic" lang="ar">${escapeHtml(ex.ar)}</span>${state.showTranscription ? `<small>${escapeHtml(ex.tr)}</small>` : ""}<div>${escapeHtml(ex.ru)}</div>${audioActions(ex.ar)}</div>`).join("")}</div>
      </section>`).join("")).join("")}
    </section>`;
  }).join("")}`;
}

function writingView() {
  const done = writingDoneCount();
  return `<header class="page-head">
    <div><p class="eyebrow">Чтение и письмо · практика</p><h1>Лаборатория письма</h1><p>${done} из ${writingTasks.length} заданий выполнено · алфавит, набор и проверка</p></div>
    <div class="lesson-actions"><button class="soft-button" type="button" data-route="reference">Алфавит</button><button class="soft-button" type="button" data-route="certificate">🏆 Сертификат</button></div>
  </header>
  <section class="section lesson-section">
    <h2>Как писать по-арабски</h2>
    <div class="writing-tips">${writingTips.map((tip) => `<article class="writing-tip"><strong>${escapeHtml(tip.title)}</strong><p>${escapeHtml(tip.text)}</p></article>`).join("")}</div>
    <span class="progress-track big-track"><span class="progress-fill" style="width:${percent(done, writingTasks.length)}%"></span></span>
  </section>
  <section class="section lesson-section">
    <h2>Алфавит и чтение</h2>
    <div class="plan-table"><table><thead><tr><th>Буква</th><th>Название</th><th>Звук</th><th>Пример</th><th>Значение</th></tr></thead><tbody>${alphabetGuide.map((row) => `<tr><td class="arabic" lang="ar" style="font-size:1.4rem;font-weight:800">${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}</td></tr>`).join("")}</tbody></table></div>
  </section>
  <section class="section lesson-section">
    <h2>Практика набора</h2>
    <p class="muted">Посмотрите на слово, закройте глаза, наберите его в поле и проверьте. Регистр и огласовки не важны.</p>
    <div class="writing-grid">${writingTasks.map((task) => {
      const isDone = state.writingDone.includes(task.id);
      return `<article class="writing-task ${isDone ? "done" : ""}">
        <div class="writing-prompt"><span class="arabic" lang="ar">${escapeHtml(task.ar)}</span><small>${escapeHtml(task.tr)} · ${escapeHtml(task.ru)} · ${escapeHtml(task.level)}</small></div>
        ${isDone ? `<div class="writing-done">✓ Задание выполнено</div>` : `<div class="writing-input-row"><input class="writing-input" dir="rtl" lang="ar" data-writing-input="${task.id}" autocomplete="off" placeholder="اكتب هنا…"><button class="primary-button" type="button" data-writing-check="${task.id}">Проверить</button></div><div class="writing-feedback" data-writing-feedback="${task.id}"></div>`}
      </article>`;
    }).join("")}</div>
  </section>`;
}

function cultureView() {
  return `<header class="page-head">
    <div><p class="eyebrow">Египет в деталях</p><h1>Культурный гид</h1><p>${cultureGuide.length} тем о общении, еде, времени, деньгах, здоровье и безопасности</p></div>
    <div class="lesson-actions"><button class="soft-button" type="button" data-route="phrases">💬 Фразы</button><button class="soft-button" type="button" data-route="course">📚 Курс</button></div>
  </header>
  <div class="culture-grid">${cultureGuide.map((item) => `<article class="card culture-card">
    <div class="culture-card-top"><span class="chip">Модуль ${item.module}</span><span class="arabic" lang="ar">${escapeHtml(item.ar)}</span></div>
    <h2>${escapeHtml(item.title)}</h2>
    <p class="muted">${escapeHtml(item.summary)}</p>
    <p>${escapeHtml(item.body)}</p>
    <h3>Что важно знать</h3>
    <ul class="culture-tips">${item.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
    <h3>Полезные фразы</h3>
    <div class="vocab-list">${item.phrases.map((phrase) => `<article class="vocab-item"><div><div class="vocab-ar arabic" lang="ar">${escapeHtml(phrase.ar)}</div>${state.showTranscription ? `<div class="vocab-tr">${escapeHtml(phrase.tr)}</div>` : ""}<div class="vocab-ru">${escapeHtml(phrase.ru)}</div></div>${audioActions(phrase.ar)}</article>`).join("")}</div>
    <button class="soft-button" type="button" data-open-module="${item.module}">Открыть модуль ${item.module} →</button>
  </article>`).join("")}</div>`;
}

function certificateView() {
  const status = certificateEligibility();
  const name = state.learnerName || "Имя ученика";
  const date = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  if (!status.eligible) {
    return `<header class="page-head"><div><p class="eyebrow">Итог обучения</p><h1>Сертификат</h1><p>Выполните все условия — и сертификат откроется автоматически</p></div><button class="soft-button" type="button" data-route="exams">📝 Экзамены</button></header>
      <section class="section lesson-section"><h2>Условия получения</h2><div class="certificate-checklist">
        <div class="${status.lessonsDone >= lessons.length ? "done" : ""}"><span>${status.lessonsDone >= lessons.length ? "✓" : "○"}</span><div><strong>Завершить все уроки</strong><small>${status.lessonsDone} из ${lessons.length}</small></div><button class="soft-button" type="button" data-route="course">К урокам</button></div>
        <div class="${status.examsDone >= moduleExamIds().length ? "done" : ""}"><span>${status.examsDone >= moduleExamIds().length ? "✓" : "○"}</span><div><strong>Сдать 12 модульных экзаменов</strong><small>${status.examsDone} из ${moduleExamIds().length} · порог ${examMeta.passPercent}%</small></div><button class="soft-button" type="button" data-route="exams">К экзаменам</button></div>
        <div class="${status.finalDone ? "done" : ""}"><span>${status.finalDone ? "✓" : "○"}</span><div><strong>Сдать итоговый экзамен</strong><small>${examMeta.finalQuestions} вопросов по всему курсу</small></div><button class="soft-button" type="button" data-route="exams">Финальный тест</button></div>
        <div class="${status.writingDone >= 10 ? "done" : ""}"><span>${status.writingDone >= 10 ? "✓" : "○"}</span><div><strong>Выполнить 10 заданий письма</strong><small>${status.writingDone} из ${writingTasks.length} заданий</small></div><button class="soft-button" type="button" data-route="writing">К письму</button></div>
      </div></section>`;
  }
  return `<header class="page-head"><div><p class="eyebrow">Итог обучения</p><h1>Ваш сертификат</h1><p>Можно распечатать или сохранить в PDF через печать браузера</p></div></header>
    <article class="certificate" id="certificate">
      <div class="certificate-frame">
        <p class="eyebrow">Masri RU · Египетский арабский</p>
        <h1>СЕРТИФИКАТ</h1>
        <p class="certificate-lead">подтверждает, что</p>
        <input id="certificateName" class="certificate-name-input" value="${escapeHtml(state.learnerName)}" placeholder="Введите имя" aria-label="Имя для сертификата">
        <p class="certificate-lead">успешно завершил(а) полный курс египетского арабского<br><strong>${escapeHtml(courseMeta.subtitle)}</strong></p>
        <div class="certificate-stats"><span>${lessons.length} уроков</span><span>${moduleExamIds().length} экзаменов</span><span>${writingDoneCount()} заданий письма</span><span>${verbLibrary.length} глаголов</span></div>
        <div class="certificate-footer"><span>${escapeHtml(courseMeta.levels)} · ${escapeHtml(courseMeta.dialect)}</span><span>${date}</span></div>
        <p class="certificate-name-preview">${escapeHtml(name)}</p>
      </div>
    </article>
    <div class="lesson-actions certificate-actions"><button class="primary-button" type="button" data-print-certificate>🖨 Распечатать сертификат</button><button class="soft-button" type="button" data-route="exams">📝 Мои экзамены</button><button class="soft-button" type="button" data-route="programs">🎓 Программы</button></div>`;
}

function activityChart() {
  const days = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(Date.now() - offset * 86400000);
    const key = dayKey(date);
    days.push({ date, key, xp: Number(state.history[key]?.xp) || 0, audio: Number(state.history[key]?.audio) || 0 });
  }
  const max = Math.max(20, ...days.map((day) => day.xp));
  const total = days.reduce((sum, day) => sum + day.xp, 0);
  return `<div class="activity-chart">
    <div class="activity-bars">${days.map((day) => `<div class="activity-bar ${day.key === dayKey() ? "today" : ""}" title="${day.date.toLocaleDateString("ru-RU")} · ${day.xp} XP · ${day.audio} аудио"><i style="height:${Math.max(4, Math.round((day.xp / max) * 100))}%"></i><b>${["вс", "пн", "вт", "ср", "чт", "пт", "сб"][day.date.getDay()]}</b></div>`).join("")}</div>
    <div class="activity-meta"><span class="stat-pill">${total} XP за 14 дней</span><span class="stat-pill">🎧 ${state.audioPlays || 0} запусков аудио</span><span class="stat-pill">🎙 ${state.recordingsMade || 0} своих записей</span><span class="stat-pill">📖 ${state.pdfOpens || 0} PDF</span></div>
  </div>`;
}

function settingsView() {
  return `<header class="page-head"><div><p class="eyebrow">Приложение</p><h1>Настройки и справка</h1><p>Изменения сохраняются только на этом устройстве</p></div><button class="soft-button" type="button" data-open-palette>🎨 Палитра</button></header>

    <section class="section lesson-section">
      <div class="section-head"><div><h2>Цвета и оформление</h2><p>8 акцентов с названиями на русском и арабском · светлый, тёмный и системный режим</p></div><span class="chip">${escapeHtml(accents.find((item) => item.id === state.accent)?.name || "Средиземный")} · <span class="arabic" lang="ar">${escapeHtml(accents.find((item) => item.id === state.accent)?.ar || "أزرق متوسط")}</span></span></div>
      <div id="settingsPalette" class="palette-grid">${paletteMarkup()}</div>
      <label class="setting-row"><span><strong>Режим</strong><small>Светлая, тёмная или системная тема</small></span><select id="themeSelect"><option value="system" ${state.theme === "system" ? "selected" : ""}>Системная</option><option value="light" ${state.theme === "light" ? "selected" : ""}>Светлая</option><option value="dark" ${state.theme === "dark" ? "selected" : ""}>Тёмная</option></select></label>
    </section>

    <section class="section lesson-section">
      <div class="section-head"><div><h2>Аудио и произношение</h2><p>Файлы курса, ваши записи и системный голос</p></div><span class="chip">${audioTotalCount} MP3</span></div>
      <div class="settings-list">
        <label class="setting-row"><span><strong>Источник звука</strong><small>Файлы и записи в первую очередь, системный голос как запасной вариант</small></span><select id="audioModeSelect"><option value="auto" ${state.audioMode === "auto" ? "selected" : ""}>Файлы + системный голос</option><option value="files" ${state.audioMode === "files" ? "selected" : ""}>Только файлы и записи</option><option value="tts" ${state.audioMode === "tts" ? "selected" : ""}>Только системный голос</option></select></label>
        <label class="setting-row"><span><strong>Автовоспроизведение карточек</strong><small>Автоматически включать аудио при переходе к следующей карточке</small></span><span class="switch"><input id="autoplayCardsToggle" type="checkbox" ${state.autoplayCards ? "checked" : ""}><span></span></span></label>
        <label class="setting-row"><span><strong>Скорость системного голоса</strong><small>Используется только когда нет аудиофайла или записи</small></span><select id="speechRateSelect"><option value="0.68" ${Number(state.speechRate) === .68 ? "selected" : ""}>Медленно</option><option value="0.82" ${Number(state.speechRate) === .82 ? "selected" : ""}>Учебная</option><option value="1" ${Number(state.speechRate) === 1 ? "selected" : ""}>Обычно</option></select></label>
        <label class="setting-row"><span><strong>Скорость аудиофайлов</strong><small>Можно менять и кнопкой в плеере</small></span><select id="audioRateSelect"><option value="0.75" ${Number(state.audioRate) === .75 ? "selected" : ""}>0.75×</option><option value="1" ${Number(state.audioRate) === 1 ? "selected" : ""}>1×</option><option value="1.15" ${Number(state.audioRate) === 1.15 ? "selected" : ""}>1.15×</option><option value="1.3" ${Number(state.audioRate) === 1.3 ? "selected" : ""}>1.3×</option></select></label>
        <div class="setting-row"><span><strong>Мои записи</strong><small>${state.recordingsMade || 0} записей создано · хранятся в браузере</small></span><button class="soft-button" type="button" data-route="recordings">Открыть</button></div>
      </div>
    </section>

    <section class="section lesson-section">
      <div class="section-head"><div><h2>Обучение</h2><p>Транскрипция и ежедневная цель</p></div></div>
      <div class="settings-list">
        <label class="setting-row"><span><strong>Показывать транскрипцию</strong><small>Латинская запись египетского произношения</small></span><span class="switch"><input id="transcriptionToggle" type="checkbox" ${state.showTranscription ? "checked" : ""}><span></span></span></label>
        <label class="setting-row"><span><strong>Цель дня</strong><small>Сколько повторений слов выполнять ежедневно</small></span><select id="dailyGoalSelect"><option value="10" ${Number(state.dailyGoal) === 10 ? "selected" : ""}>10</option><option value="20" ${Number(state.dailyGoal) === 20 ? "selected" : ""}>20</option><option value="30" ${Number(state.dailyGoal) === 30 ? "selected" : ""}>30</option><option value="50" ${Number(state.dailyGoal) === 50 ? "selected" : ""}>50</option></select></label>
      </div>
    </section>

    <section class="section lesson-section">
      <div class="section-head"><div><h2>Активность</h2><p>Последние 14 дней · ${state.xp || 0} XP всего</p></div><span class="chip">Серия ${activeStreak()} дн.</span></div>
      ${activityChart()}
    </section>

    <section class="section lesson-section" id="achievements">
      <div class="section-head"><div><h2>Достижения</h2><p>${state.achievements.length} из ${achievementDefs.length} открыто · ${state.xp || 0} XP</p></div><span class="chip">Уровень ${levelInfo().level}</span></div>
      <span class="progress-track big-track"><span class="progress-fill" style="width:${levelInfo().percent}%"></span></span>
      <div class="achievement-grid">${achievementDefs.map((item) => `<article class="achievement ${state.achievements.includes(item.id) ? "unlocked" : ""}"><span class="achievement-icon">${state.achievements.includes(item.id) ? item.icon : "🔒"}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.desc)}</small></article>`).join("")}</div>
    </section>

    <section class="section lesson-section">
      <div class="section-head"><div><h2>Резервная копия</h2><p>Сохраните прогресс в файл или перенесите на другое устройство</p></div></div>
      <div class="lesson-actions"><button class="primary-button" type="button" data-export-backup>⬇ Скачать прогресс</button><button class="soft-button" type="button" data-import-backup>⬆ Загрузить прогресс</button><button class="soft-button" type="button" data-route="recordings">🎙 Мои записи</button></div>
      <div class="settings-list" style="margin-top:.8rem">
        <div class="setting-row"><span><strong>Сбросить статистику слов</strong><small>Интервалы повторения, XP и серия будут очищены, уроки останутся</small></span><button class="soft-button" type="button" data-reset-stats>Очистить</button></div>
        <div class="setting-row"><span><strong>Сбросить весь прогресс</strong><small>Уроки, статистика, избранное и достижения будут удалены</small></span><button class="soft-button" type="button" data-reset-progress>Сбросить</button></div>
      </div>
    </section>

    <section class="section lesson-section">
      <div class="section-head"><div><h2>Инструменты</h2><p>Дополнительные разделы работают без интернета</p></div></div>
      <div class="feature-grid">
        <button class="card feature-card" type="button" data-route="library"><span class="feature-icon">🎧</span><span class="feature-copy"><strong>Аудио и учебник</strong><small>${audioTotalCount} MP3 и ${textbookPdfCount} PDF</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="verbs"><span class="feature-icon">🧩</span><span class="feature-copy"><strong>Лаборатория глаголов</strong><small>${verbLibrary.length} глаголов и 5 времён</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="phrases"><span class="feature-icon">💬</span><span class="feature-copy"><strong>Разговорник</strong><small>${allPhrases().length} фраз и избранное</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="reference"><span class="feature-icon">📐</span><span class="feature-copy"><strong>Шпаргалка</strong><small>Грамматика в таблицах</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="colors"><span class="feature-icon">🎨</span><span class="feature-copy"><strong>Цвета · الألوان</strong><small>${colorLesson.colors.length} цветов, женские формы и грамматика</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="programs"><span class="feature-icon">🎓</span><span class="feature-copy"><strong>Полные курсы</strong><small>${learningPrograms.length} программы обучения</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="exams"><span class="feature-icon">📝</span><span class="feature-copy"><strong>Экзамены</strong><small>${passedExamCount()} из ${moduleExamIds().length} модулей сдано</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="grammar"><span class="feature-icon">🧠</span><span class="feature-copy"><strong>Грамматика</strong><small>Полный справочник по модулям</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="writing"><span class="feature-icon">✍️</span><span class="feature-copy"><strong>Письмо</strong><small>${writingDoneCount()} из ${writingTasks.length} заданий</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="culture"><span class="feature-icon">🏛</span><span class="feature-copy"><strong>Культурный гид</strong><small>${cultureGuide.length} тем о жизни в Египте</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-route="certificate"><span class="feature-icon">🏆</span><span class="feature-copy"><strong>Сертификат</strong><small>${certificateEligibility().eligible ? "Готов к печати" : "Условия и прогресс"}</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
        <button class="card feature-card" type="button" data-open-palette><span class="feature-icon">🎛</span><span class="feature-copy"><strong>Оформление</strong><small>8 акцентов, светлый и тёмный режим</small></span><span class="feature-arrow" aria-hidden="true">→</span></button>
      </div>
    </section>

    <section class="section lesson-section"><h2>Как читать транскрипцию</h2><div class="plan-table"><table><thead><tr><th>Знак</th><th>Как произнести</th><th>Пример</th></tr></thead><tbody>${transcriptionGuide.map((row) => `<tr><td><strong>${escapeHtml(row[0])}</strong></td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="section lesson-section"><h2>Арабский алфавит</h2><p>Буквы пишутся справа налево и меняют вид в зависимости от позиции. Буквы ا د ذ ر ز و не соединяются со следующей буквой слева. В таблице дано каирское разговорное произношение.</p><div class="plan-table"><table><thead><tr><th>Буква</th><th>Название</th><th>Звук</th><th>Пример</th><th>Значение</th></tr></thead><tbody>${alphabetGuide.map((row) => `<tr><td class="arabic" lang="ar" style="font-size:1.4rem;font-weight:800">${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="section lesson-section"><h2>Правильная тренировка</h2><ol class="goal-list"><li>Сначала слушайте целый аудиофайл урока, не читая транскрипцию.</li><li>Повторяйте одновременно с голосом, затем самостоятельно.</li><li>Записывайте себя кнопкой 🎙 и сравнивайте с записью курса.</li><li>Используйте новые фразы в коротких личных примерах.</li></ol><p class="muted">Аудиофайлы курса — основной источник произношения. Системный голос ar-EG включается только как запасной вариант и зависит от устройства.</p></section>
    <section class="section lesson-section"><h2>О разработчике</h2><p>Нашли ошибку, хотите новую тему или свой пример в курсе — напишите, отвечу удобным способом.</p><div class="contact-links"><a class="contact-link" href="https://wa.me/971561101262" target="_blank" rel="noopener"><span>WhatsApp</span><span dir="ltr">+971 56 110 1262</span></a><a class="contact-link" href="https://t.me/mourssi2700" target="_blank" rel="noopener"><span>Telegram</span><span dir="ltr">@mourssi2700</span></a></div></section>`;
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
  else if (route === "verbs") main.innerHTML = verbsView();
  else if (route === "verb") main.innerHTML = verbDetailView(value);
  else if (route === "phrases") main.innerHTML = phrasebookView();
  else if (route === "reference") main.innerHTML = referenceView();
  else if (route === "practice") main.innerHTML = practiceView();
  else if (route === "media") main.innerHTML = mediaView();
  else if (route === "library") main.innerHTML = libraryView();
  else if (route === "colors") main.innerHTML = colorsView();
  else if (route === "programs") main.innerHTML = programsView();
  else if (route === "program") main.innerHTML = programView(value);
  else if (route === "exams") main.innerHTML = examsView();
  else if (route === "exam") main.innerHTML = examView();
  else if (route === "grammar") main.innerHTML = grammarView();
  else if (route === "writing") main.innerHTML = writingView();
  else if (route === "culture") main.innerHTML = cultureView();
  else if (route === "certificate") main.innerHTML = certificateView();
  else if (route === "recordings") main.innerHTML = recordingsView();
  else if (route === "settings") main.innerHTML = settingsView();
  else main.innerHTML = notFoundView();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  if (route === "recordings") loadRecordingsView();
  refreshRecordingBadges();
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
  if (!audioPlayer.paused) audioPlayer.pause();
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-EG";
  utterance.rate = Number(state.speechRate) || .82;
  const voices = speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === "ar-eg") || voices.find((voice) => voice.lang.toLowerCase().startsWith("ar")) || null;
  speechSynthesis.speak(utterance);
  state.audioPlays = (Number(state.audioPlays) || 0) + 1;
  bumpHistory("audio", 1);
  saveState();
  checkAchievements();
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
    searchResults.innerHTML = `<div class="empty-state">
      <strong>Ищите по всему курсу</strong>
      <p>Уроки · слова · курсы · грамматика · экзамены · культура · цвета · аудио · PDF</p>
      <p class="small muted">${lessons.length} уроков · ${allPhrases().length} фраз · ${learningPrograms.length} программ · ${verbLibrary.length} глаголов · ${colorLesson.colors.length} цветов · ${audioTotalCount} аудиофайлов</p>
      <p class="small"><span class="keyboard-hint"><kbd>Ctrl</kbd>+<kbd>K</kbd> или <kbd>/</kbd> — открыть поиск</span></p>
    </div>`;
    return;
  }
  const found = [];
  lessons.forEach((lesson) => {
    const lessonHit = `${lesson.title} ${lesson.arTitle} ${lesson.level}`.toLocaleLowerCase("ru").includes(needle);
    if (lessonHit) found.push({ group: "Уроки", type: "Урок", lessonId: lesson.id, ar: lesson.arTitle, ru: lesson.title, tr: `Урок ${lesson.order} · ${lesson.vocabulary.length} слов` });
    lesson.vocabulary.forEach((item) => {
      if (`${item.ar} ${item.tr} ${item.ru} ${item.note || ""}`.toLocaleLowerCase("ru").includes(needle)) found.push({ group: "Слова урока", type: "Слово", lessonId: lesson.id, ...item });
    });
  });
  allPhrases().forEach((item) => {
    if (`${item.ar} ${item.tr} ${item.ru}`.toLocaleLowerCase("ru").includes(needle)) found.push({ group: "Разговорник", type: "Фраза", phrase: item.ar, category: item.categoryId, ar: item.ar, ru: item.ru, tr: item.tr });
  });
  verbLibrary.forEach((verb) => {
    if (`${verb.ar} ${verb.tr} ${verb.ru} ${verb.root} ${verb.pattern}`.toLocaleLowerCase("ru").includes(needle)) found.push({ group: "Глаголы", type: "Глагол", verbId: verb.id, ar: verb.ar, ru: verb.ru, tr: verb.tr });
  });
  if (`${colorLesson.title} ${colorLesson.arTitle} ${colorLesson.subtitle} ${colorLesson.arSubtitle} цвета цвет colours colors الألوان لون`.toLocaleLowerCase("ru").includes(needle)) {
    found.push({ group: "Цвета", type: "Материал курса", searchRoute: "colors", ar: colorLesson.arTitle, ru: `${colorLesson.title} · ${colorLesson.colors.length} цветов`, tr: colorLesson.subtitle });
  }
  colorLesson.colors.forEach((color) => {
    if (`${color.ar} ${color.tr} ${color.ru} ${color.fem || ""} ${color.femTr || ""} цвет`.toLocaleLowerCase("ru").includes(needle)) {
      found.push({ group: "Цвета", type: "Цвет", searchRoute: "colors", ar: color.ar, ru: color.ru, tr: color.fem ? `${color.tr} · ж. ${color.femTr}` : color.tr });
    }
  });
  colorLesson.phrases.forEach((item) => {
    if (`${item.ar} ${item.tr} ${item.ru}`.toLocaleLowerCase("ru").includes(needle)) found.push({ group: "Цвета", type: "Фраза о цвете", searchRoute: "colors", ar: item.ar, ru: item.ru, tr: item.tr });
  });
  learningPrograms.forEach((program) => {
    if (`${program.title} ${program.ar} ${program.description} ${program.level} программа курс`.toLocaleLowerCase("ru").includes(needle)) {
      found.push({ group: "Курсы", type: "Программа", searchRoute: `program/${program.id}`, ar: program.ar, ru: program.title, tr: `${program.level} · ${program.weeks} недель · ${program.hours} ч` });
    }
  });
  cultureGuide.forEach((item) => {
    if (`${item.title} ${item.ar} ${item.summary} ${item.body} ${item.tips.join(" ")} культура этикет`.toLocaleLowerCase("ru").includes(needle)) {
      found.push({ group: "Культурный гид", type: "Культура", searchRoute: "culture", ar: item.ar, ru: item.title, tr: item.summary });
    }
  });
  writingTasks.forEach((task) => {
    if (`${task.ar} ${task.tr} ${task.ru} письмо набор`.toLocaleLowerCase("ru").includes(needle)) {
      found.push({ group: "Практика письма", type: "Письмо", searchRoute: "writing", ar: task.ar, ru: task.ru, tr: `${task.tr} · ${task.level}` });
    }
  });
  if (`грамматика правила справочник таблицы`.toLocaleLowerCase("ru").includes(needle)) {
    const grammarCount = lessons.reduce((sum, lesson) => sum + lesson.grammar.length, 0);
    found.push({ group: "Грамматика", type: "Справочник", searchRoute: "grammar", ar: "القواعد", ru: `Грамматика · ${grammarCount} тем`, tr: "Все модули, примеры и таблицы" });
  }
  if (`экзамен тест аттестация проверка`.toLocaleLowerCase("ru").includes(needle)) {
    found.push({ group: "Экзамены", type: "Аттестация", searchRoute: "exams", ar: "الامتحانات", ru: "Экзамены курса", tr: "12 модульных и финальный экзамен" });
  }
  if (`сертификат диплом`.toLocaleLowerCase("ru").includes(needle)) {
    found.push({ group: "Сертификат", type: "Итог", searchRoute: "certificate", ar: "الشهادة", ru: "Сертификат курса", tr: certificateEligibility().eligible ? "Готов к печати" : "Проверьте условия" });
  }
  audioLibrary.forEach((track) => {
    if (`${track.title} ${track.subtitle} ${track.ar || ""} ${track.group}`.toLocaleLowerCase("ru").includes(needle)) found.push({ group: "Аудио", type: "Аудио", audioId: track.id, ar: track.ar || "", ru: track.title, tr: track.subtitle });
  });
  textbookUnits.forEach((unit) => {
    if (`${unit.title} ${unit.ar} ${unit.level} Модуль ${unit.module}`.toLocaleLowerCase("ru").includes(needle)) found.push({ group: "Учебник PDF", type: "PDF", pdf: unit.chapter, title: `Модуль ${unit.module} · ${unit.title}`, ar: unit.ar, ru: unit.title, tr: `${unit.lessons.length} уроков · ${unit.level}` });
  });
  textbookFrontMatter.forEach((item) => {
    if (`${item.title} ${item.subtitle} ${item.pdf ? "pdf" : ""} ${item.audio ? "аудио" : ""}`.toLocaleLowerCase("ru").includes(needle)) found.push({ group: "Учебник PDF", type: item.pdf ? "PDF" : "Аудио", pdf: item.pdf || "", audioId: item.audio ? `front-${item.id}` : "", title: item.title, ar: "", ru: item.title, tr: item.subtitle });
  });

  if (!found.length) {
    searchResults.innerHTML = `<div class="empty-state">Ничего не найдено. Попробуйте арабское слово, транскрипцию или русский перевод.</div>`;
    return;
  }
  let lastGroup = "";
  searchResults.innerHTML = found.slice(0, 90).map((item) => {
    let attrs = `data-search-open="${item.lessonId || ""}"`;
    if (item.searchRoute) attrs = `data-search-route="${item.searchRoute}"`;
    else if (item.phrase) attrs = `data-search-phrase="${escapeHtml(item.phrase)}" data-search-category="${escapeHtml(item.category)}"`;
    else if (item.verbId) attrs = `data-search-verb="${item.verbId}"`;
    else if (item.pdf) attrs = `data-search-pdf="${item.pdf}" data-pdf-title="${escapeHtml(item.title)}"`;
    else if (item.audioId) attrs = `data-search-audio="${item.audioId}"`;
    const groupLabel = item.group !== lastGroup ? `<div class="search-group-label">${escapeHtml(item.group)}</div>` : "";
    lastGroup = item.group;
    return `${groupLabel}<button class="search-result" type="button" ${attrs}>
      <span class="search-type">${escapeHtml(item.type)}</span>${item.ar ? `<span class="arabic" lang="ar">${escapeHtml(item.ar)}</span> · ` : ""}<strong class="search-title">${escapeHtml(item.ru)}</strong><small>${escapeHtml(item.tr || "")}</small>
    </button>`;
  }).join("") + `<div class="search-group-label">Найдено: ${found.length}</div>`;
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, [data-flip-card]");
  if (!target) return;
  if (target.dataset.route) routeTo(target.dataset.route);
  else if (target.dataset.openModule) routeTo(`module/${target.dataset.openModule}`);
  else if (target.dataset.openLesson) routeTo(`lesson/${target.dataset.openLesson}`);
  else if (target.dataset.openVerb) routeTo(`verb/${target.dataset.openVerb}`);
  else if (target.dataset.openProgram) routeTo(`program/${target.dataset.openProgram}`);
  else if (target.dataset.openGrammar) {
    state.grammarModule = target.dataset.openGrammar;
    saveState();
    routeTo("grammar");
  }
  else if (target.dataset.programPhrase) {
    state.phraseCategory = target.dataset.programPhrase;
    saveState();
    routeTo("phrases");
  }
  else if (target.dataset.startExam) {
    examState = buildExam(target.dataset.startExam === "final" ? null : target.dataset.startExam);
    routeTo("exam");
    if (getRoute()[0] === "exam") main.innerHTML = examView();
  }
  else if (target.dataset.examChoice) {
    if (examState?.answered) return;
    examState.selected = target.dataset.examChoice;
    examState.answered = true;
    const correct = examState.selected === examState.questions[examState.index].answer;
    if (correct) examState.score += 1;
    touchStreak();
    recordReviewActivity();
    awardXp(correct ? 10 : 3);
    saveState();
    main.innerHTML = examView();
  }
  else if (target.hasAttribute("data-exam-next")) {
    if (!examState) return;
    if (examState.index + 1 >= examState.questions.length) {
      examState.finished = true;
      saveExamResult();
    } else {
      examState.index += 1;
      examState.answered = false;
      examState.selected = null;
    }
    main.innerHTML = examView();
  }
  else if (target.dataset.examRestart) {
    examState = buildExam(target.dataset.examRestart === "final" ? null : target.dataset.examRestart);
    main.innerHTML = examView();
  }
  else if (target.hasAttribute("data-exam-exit")) {
    examState = null;
    routeTo("exams");
    if (getRoute()[0] === "exams") main.innerHTML = examsView();
  }
  else if (target.dataset.grammarFilter) {
    state.grammarModule = target.dataset.grammarFilter;
    saveState();
    main.innerHTML = grammarView();
  }
  else if (target.dataset.writingCheck) {
    const id = target.dataset.writingCheck;
    const task = writingTasks.find((item) => item.id === id);
    const input = document.querySelector(`[data-writing-input="${id}"]`);
    const feedback = document.querySelector(`[data-writing-feedback="${id}"]`);
    const correct = !!task && normalizeArabic(input?.value || "") === normalizeArabic(task.ar);
    if (feedback) feedback.textContent = correct ? "✓ Верно! Задание засчитано." : `Пока не совпало. Проверьте слово: ${task?.ar || ""}`;
    if (correct && !state.writingDone.includes(id)) {
      state.writingDone.push(id);
      awardXp(10);
      saveState();
      checkAchievements();
      setTimeout(() => { if (getRoute()[0] === "writing") main.innerHTML = writingView(); }, 400);
    }
  }
  else if (target.hasAttribute("data-print-certificate")) {
    window.print?.();
  }
  else if (target.dataset.say) playPhrase(target.dataset.say, { wordKey: target.dataset.wordKey || "" });
  else if (target.dataset.recordSay) openAudioDialog(target.dataset.recordSay);
  else if (target.dataset.openMedia) openMedia(target.dataset.openMedia);
  else if (target.dataset.playAudio) {
    const id = target.dataset.playAudio;
    if (currentAudioTrack?.id === id) {
      if (audioPlayer.paused) audioPlayer.play().catch(() => showToast("Не удалось запустить аудиофайл"));
      else audioPlayer.pause();
      updateAudioDock();
    } else {
      playTrackById(id);
    }
  } else if (target.dataset.playWordList) {
    playWordList(target.dataset.playWordList);
  } else if (target.dataset.openPdf) {
    openPdf(target.dataset.openPdf, target.dataset.pdfTitle || "");
  } else if (target.hasAttribute("data-open-palette")) {
    renderPaletteChoices();
    paletteDialog.showModal();
  } else if (target.dataset.libraryTab) {
    state.libraryTab = target.dataset.libraryTab;
    saveState();
    main.innerHTML = libraryView();
    window.scrollTo(0, 0);
  } else if (target.dataset.accentChoice) {
    state.accent = target.dataset.accentChoice;
    saveState();
    setTheme();
    showToast(`Палитра: ${accents.find((item) => item.id === state.accent)?.name || ""}`);
  } else if (target.dataset.themeChoice) {
    state.theme = target.dataset.themeChoice;
    saveState();
    setTheme();
  } else if (target.dataset.surfaceChoice) {
    state.surface = target.dataset.surfaceChoice;
    saveState();
    setTheme();
  } else if (target.hasAttribute("data-random-phrase")) {
    const pool = allPhrases();
    const item = pool[Math.floor(Math.random() * pool.length)];
    if (item) {
      showToast(`${item.ar} — ${item.ru}`);
      playPhrase(item.ar);
    }
  } else if (target.dataset.deleteRecording) {
    deleteRecording(target.dataset.deleteRecording).then(() => {
      loadRecordingsView();
      refreshRecordingBadges();
      showToast("Запись удалена");
    });
  } else if (target.hasAttribute("data-clear-recordings")) {
    if (confirm("Удалить все ваши аудиозаписи с этого устройства?")) {
      clearRecordings().then(() => {
        state.recordingsMade = 0;
        saveState();
        loadRecordingsView();
        refreshRecordingBadges();
        showToast("Все записи удалены");
      });
    }
  } else if (target.hasAttribute("data-export-backup")) {
    exportBackup();
  } else if (target.hasAttribute("data-import-backup")) {
    backupInput.click();
  } else if (target.dataset.toggleComplete) {
    const id = target.dataset.toggleComplete;
    const adding = !state.completed.includes(id);
    state.completed = adding ? [...state.completed, id] : state.completed.filter((item) => item !== id);
    saveState();
    if (adding) {
      touchStreak();
      awardXp(40);
      showToast("Урок завершён! +40 XP");
    }
    renderRoute();
    if (!adding) showToast("Отметка снята");
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
    reviewRevealed = false;
    reviewKey = "";
    main.innerHTML = practiceView(target.dataset.practiceMode);
    if (target.dataset.practiceMode === "listen" && listenState) setTimeout(() => playPhrase(listenState.item.ar, { openDialog: false }), 150);
    if (target.dataset.practiceMode === "cards") maybeAutoplayCard();
    if (target.dataset.practiceMode === "smart") reviewRevealed = false;
  } else if (target.hasAttribute("data-flip-card")) {
    state.flashcardFlipped = !state.flashcardFlipped;
    saveState();
    main.innerHTML = practiceView("cards");
  } else if (target.dataset.cardStep) {
    state.flashcardIndex += Number(target.dataset.cardStep);
    state.flashcardFlipped = false;
    saveState();
    main.innerHTML = practiceView("cards");
    maybeAutoplayCard();
  } else if (target.hasAttribute("data-card-shuffle")) {
    state.flashcardIndex = Math.floor(Math.random() * allVocab().length);
    state.flashcardFlipped = false;
    saveState();
    main.innerHTML = practiceView("cards");
    maybeAutoplayCard();
  } else if (target.dataset.cardRate) {
    const deck = allVocab();
    const index = ((state.flashcardIndex % deck.length) + deck.length) % deck.length;
    rateWord(deck[index], target.dataset.cardRate);
    state.flashcardFlipped = false;
    state.flashcardIndex += 1;
    saveState();
    main.innerHTML = practiceView("cards");
    maybeAutoplayCard();
    showToast(target.dataset.cardRate === "again" ? "Будет повторено через 10 минут" : "Интервал повтора увеличен");
  } else if (target.hasAttribute("data-review-reveal")) {
    reviewRevealed = true;
    const [route] = getRoute();
    if (route === "practice") main.innerHTML = practiceView("smart");
    else main.innerHTML = practiceView("smart");
  } else if (target.dataset.reviewRate) {
    const pool = reviewPool(40);
    const item = pool[0] || allVocab()[0];
    rateWord(item, target.dataset.reviewRate);
    reviewRevealed = false;
    reviewKey = "";
    const [route] = getRoute();
    if (route === "practice") main.innerHTML = practiceView("smart");
    else main.innerHTML = practiceView("smart");
    showToast(target.dataset.reviewRate === "again" ? "Слово вернётся для повтора" : "Повтор запланирован");
  } else if (target.dataset.lessonQuiz) {
    quizState = buildQuiz(target.dataset.lessonQuiz, 8);
    main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${target.dataset.lessonQuiz}">← Вернуться к уроку</button><section class="section">${quizView(target.dataset.lessonQuiz)}</section>`;
  } else if (target.dataset.quizChoice) {
    if (quizState?.answered) return;
    quizState.selected = target.dataset.quizChoice;
    quizState.answered = true;
    const correct = quizState.selected === quizState.questions[quizState.index].answer;
    if (correct) quizState.score += 1;
    touchStreak();
    recordReviewActivity();
    awardXp(correct ? 8 : 3);
    saveState();
    const [route] = getRoute();
    if (route === "practice") main.innerHTML = practiceView("quiz");
    else main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${quizState.lessonId}">← Вернуться к уроку</button><section class="section">${quizView(quizState.lessonId)}</section>`;
  } else if (target.hasAttribute("data-next-question")) {
    if (quizState.index + 1 >= quizState.questions.length) {
      quizState.finished = true;
      if (quizState.score === quizState.questions.length) {
        state.perfectQuiz = true;
        saveState();
        checkAchievements();
      }
    }
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
    drillState = buildDrill();
    const anchor = document.querySelector("#lessonDrill");
    if (anchor) {
      anchor.innerHTML = drillView(true);
    } else {
      main.innerHTML = `<button class="soft-button back-button" type="button" data-open-lesson="${target.dataset.lessonDrill}">← Вернуться к уроку</button>${drillView(true)}`;
    }
  } else if (target.dataset.drillVerb) {
    drillState = buildDrill(target.dataset.drillVerb, "all");
    routeTo("practice");
    main.innerHTML = practiceView("drill");
  } else if (target.dataset.verbFilter) {
    verbFilter = target.dataset.verbFilter;
    if (getRoute()[0] === "verbs") main.innerHTML = verbsView();
  } else if (target.dataset.verbTense) {
    verbTense = target.dataset.verbTense;
    if (getRoute()[0] === "verb") main.innerHTML = verbDetailView(getRoute()[1]);
  } else if (target.dataset.drillTense) {
    if (drillState) drillState = buildDrill(drillState.verb.id, target.dataset.drillTense);
    refreshDrill();
  } else if (target.dataset.phraseCategory) {
    state.phraseCategory = target.dataset.phraseCategory;
    if (getRoute()[0] === "phrases") main.innerHTML = phrasebookView();
  } else if (target.dataset.favPhrase) {
    toggleFavorite(target.dataset.favPhrase);
    const route = getRoute()[0];
    if (route === "phrases") main.innerHTML = phrasebookView();
    else if (route === "practice") main.innerHTML = practiceView("phrases");
  } else if (target.dataset.lessonListen) {
    listenState = buildListening(target.dataset.lessonListen);
    renderListen(target.dataset.lessonListen, true);
  } else if (target.dataset.listenPlay) {
    playPhrase(target.dataset.listenPlay, { openDialog: false });
  } else if (target.dataset.listenChoice) {
    if (listenState?.answered) return;
    listenState.selected = target.dataset.listenChoice;
    listenState.answered = true;
    touchStreak();
    recordReviewActivity();
    state.listenPlays = (Number(state.listenPlays) || 0) + 1;
    awardXp(target.dataset.listenChoice === listenState.item.ru ? 6 : 2);
    saveState();
    refreshListen();
  } else if (target.hasAttribute("data-next-listen")) {
    listenState = buildListening(listenState?.lessonId ?? null);
    refreshListen();
  } else if (target.dataset.drillChoice) {
    if (!drillState?.answered) {
      drillState.selected = target.dataset.drillChoice;
      drillState.answered = true;
      recordVerb(drillState.verb.id, target.dataset.drillChoice === drillState.correct.ar);
      refreshDrill();
    }
  } else if (target.hasAttribute("data-next-drill")) {
    drillState = buildDrill(drillState?.verb.id, drillState?.tense || drillTense);
    refreshDrill();
  } else if (target.hasAttribute("data-reset-stats")) {
    if (confirm("Очистить статистику слов, глаголов, XP и серию? Уроки останутся.")) {
      state.wordStats = {};
      state.verbStats = {};
      state.xp = 0;
      state.streak = 0;
      state.bestStreak = 0;
      state.todayDate = "";
      state.lastActive = "";
      state.todayXp = 0;
      state.todayReviews = 0;
      state.totalReviews = 0;
      state.perfectQuiz = false;
      state.achievements = [];
      state.audioPlays = 0;
      state.listenPlays = 0;
      state.pdfOpens = 0;
      state.history = {};
      saveState();
      renderRoute();
      showToast("Статистика очищена");
    }
  } else if (target.hasAttribute("data-reset-progress")) {
    if (confirm("Сбросить весь учебный прогресс на этом устройстве?")) {
      const preferences = {
        theme: state.theme,
        accent: state.accent,
        surface: state.surface,
        audioMode: state.audioMode,
        audioRate: state.audioRate,
        audioLoop: state.audioLoop,
        autoplayCards: state.autoplayCards,
        speechRate: state.speechRate,
        showTranscription: state.showTranscription,
        dailyGoal: state.dailyGoal,
      };
      state = { ...defaultState, ...preferences };
      saveState();
      renderRoute();
      showToast("Прогресс сброшен");
    }
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || "") || !!target?.isContentEditable;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchDialog.showModal();
    searchInput.value = "";
    updateSearch("");
    setTimeout(() => searchInput.focus(), 80);
  } else if (event.key === "/" && !typing && !searchDialog.open) {
    event.preventDefault();
    searchDialog.showModal();
    searchInput.value = "";
    updateSearch("");
    setTimeout(() => searchInput.focus(), 80);
  }
  if ((event.key === "Enter" || event.key === " ") && target?.hasAttribute?.("data-flip-card")) {
    event.preventDefault();
    target.click();
  }
  if (event.key === "Enter" && target?.dataset?.writingInput) {
    event.preventDefault();
    document.querySelector(`[data-writing-check="${target.dataset.writingInput}"]`)?.click();
  }
  if ((event.key === "Enter" || event.key === " ") && target?.id === "verbSearch") {
    event.preventDefault();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "verbSearch") {
    const query = event.target.value.trim().toLocaleLowerCase("ru");
    document.querySelectorAll(".verb-card").forEach((card) => {
      const hay = card.dataset.verbSearch || "";
      card.classList.toggle("hidden", query.length > 0 && !hay.includes(query));
    });
  } else if (event.target.id === "grammarSearch") {
    const query = event.target.value.trim().toLocaleLowerCase("ru");
    document.querySelectorAll(".grammar-block").forEach((block) => {
      const hay = block.dataset.grammarText || "";
      block.classList.toggle("hidden", query.length > 0 && !hay.includes(query));
    });
  } else if (event.target.id === "certificateName") {
    state.learnerName = event.target.value;
    saveState();
    const preview = document.querySelector(".certificate-name-preview");
    if (preview) preview.textContent = event.target.value.trim() || "Имя ученика";
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
  } else if (event.target.id === "audioModeSelect") {
    state.audioMode = event.target.value;
    saveState();
    showToast("Источник звука обновлён");
  } else if (event.target.id === "audioRateSelect") {
    state.audioRate = Number(event.target.value);
    audioPlayer.playbackRate = Number(state.audioRate) || 1;
    saveState();
    updateAudioDock();
  } else if (event.target.id === "autoplayCardsToggle") {
    state.autoplayCards = event.target.checked;
    saveState();
  } else if (event.target.id === "dailyGoalSelect") {
    state.dailyGoal = Number(event.target.value);
    saveState();
    showToast("Цель дня обновлена");
  }
});

document.querySelector("#brandButton").addEventListener("click", () => routeTo("home"));
libraryButton.addEventListener("click", () => routeTo("library"));
paletteButton.addEventListener("click", () => {
  renderPaletteChoices();
  paletteDialog.showModal();
});
document.querySelector("#searchButton").addEventListener("click", () => {
  searchDialog.showModal();
  searchInput.value = "";
  updateSearch("");
  setTimeout(() => searchInput.focus(), 80);
});
searchInput.addEventListener("input", () => updateSearch(searchInput.value));
searchResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-search-open], [data-search-phrase], [data-search-verb], [data-search-audio], [data-search-pdf], [data-search-route]");
  if (!button) return;
  if (button.dataset.searchRoute) {
    searchDialog.close();
    routeTo(button.dataset.searchRoute);
  } else if (button.dataset.searchPhrase) {
    if (button.dataset.searchCategory) state.phraseCategory = button.dataset.searchCategory;
    saveState();
    searchDialog.close();
    routeTo("phrases");
  } else if (button.dataset.searchVerb) {
    searchDialog.close();
    routeTo(`verb/${button.dataset.searchVerb}`);
  } else if (button.dataset.searchAudio) {
    searchDialog.close();
    playTrackById(button.dataset.searchAudio);
  } else if (button.dataset.searchPdf) {
    searchDialog.close();
    openPdf(button.dataset.searchPdf, button.dataset.pdfTitle || "");
  } else {
    searchDialog.close();
    routeTo(`lesson/${button.dataset.searchOpen}`);
  }
});
mediaDialog.addEventListener("close", () => { lessonVideo.pause(); lessonVideo.removeAttribute("src"); lessonVideo.load(); });

audioToggle.addEventListener("click", () => {
  if (!currentAudioTrack) return;
  if (audioPlayer.paused) audioPlayer.play().catch(() => showToast("Не удалось запустить аудиофайл"));
  else audioPlayer.pause();
  updateAudioDock();
});
audioPrev.addEventListener("click", () => playAdjacentTrack(-1));
audioNext.addEventListener("click", () => playAdjacentTrack(1));
audioClose.addEventListener("click", closeAudioPlayer);
audioSeek.addEventListener("input", () => {
  if (!audioPlayer.duration) return;
  audioPlayer.currentTime = (Number(audioSeek.value) / 1000) * audioPlayer.duration;
});
audioRateButton.addEventListener("click", () => {
  const rates = [0.75, 1, 1.15, 1.3];
  const index = rates.indexOf(Number(state.audioRate));
  state.audioRate = rates[(index + 1) % rates.length];
  audioPlayer.playbackRate = state.audioRate;
  saveState();
  updateAudioDock();
  showToast(`Скорость: ${state.audioRate}×`);
});
audioLoopButton.addEventListener("click", () => {
  state.audioLoop = !state.audioLoop;
  audioPlayer.loop = state.audioLoop;
  saveState();
  updateAudioDock();
});
audioPlayer.addEventListener("play", updateAudioDock);
audioPlayer.addEventListener("pause", updateAudioDock);
audioPlayer.addEventListener("timeupdate", updateAudioDock);
audioPlayer.addEventListener("loadedmetadata", updateAudioDock);
audioPlayer.addEventListener("ended", updateAudioDock);
audioPlayer.addEventListener("error", () => {
  if (currentAudioTrack) showToast("Не удалось воспроизвести аудиофайл");
});

audioPlayPhrase.addEventListener("click", () => {
  if (audioDialogText) playPhrase(audioDialogText);
});
audioRecordPhrase.addEventListener("click", () => {
  if (isRecording) stopRecording();
  else startRecording();
});
audioUploadPhrase.addEventListener("click", () => audioFileInput.click());
audioDeletePhrase.addEventListener("click", async () => {
  if (!audioDialogText) return;
  await deleteRecording(audioDialogText);
  showToast("Запись удалена");
  await refreshAudioDialogStatus();
});
audioTtsPhrase.addEventListener("click", () => {
  if (audioDialogText) speakArabic(audioDialogText);
});
audioFileInput.addEventListener("change", async () => {
  const file = audioFileInput.files?.[0];
  audioFileInput.value = "";
  if (!file) return;
  const looksAudio = file.type.startsWith("audio/") || /\.(mp3|m4a|aac|ogg|oga|wav|webm|flac|opus)$/i.test(file.name || "");
  if (!looksAudio) {
    showToast("Выберите аудиофайл: mp3, m4a, ogg или wav");
    return;
  }
  await saveAudioBlob(file, "upload");
});
audioDialog.addEventListener("close", () => {
  if (isRecording) stopRecording();
  audioDialogText = "";
});
pdfDialog.addEventListener("close", () => {
  pdfFrame.removeAttribute("src");
  pdfOpenLink.href = "#";
});
backupInput.addEventListener("change", async () => {
  const file = backupInput.files?.[0];
  backupInput.value = "";
  if (file) await importBackup(file);
});

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
touchStreak();
checkAchievements();
if (!location.hash) history.replaceState(null, "", "#/home");
renderRoute();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
