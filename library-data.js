import {
  textbookMeta,
  textbookParts,
  textbookFrontMatter,
  textbookUnits,
} from "./textbook-data.js";

export { textbookMeta, textbookParts, textbookFrontMatter, textbookUnits };

export const lessonAudioMap = {};
export const lessonTextbookMap = {};
export const moduleTextbookMap = {};

textbookUnits.forEach((unit) => {
  moduleTextbookMap[unit.module] = unit;
  unit.lessons.forEach((lesson) => {
    lessonAudioMap[lesson.id] = lesson.audio;
    lessonTextbookMap[lesson.id] = { ...lesson, module: unit.module, moduleTitle: unit.title, level: unit.level, pdf: unit.chapter };
  });
});

const frontMatterTracks = textbookFrontMatter
  .filter((item) => item.audio)
  .map((item) => ({
    id: `front-${item.id}`,
    title: item.title,
    subtitle: item.subtitle,
    src: item.audio,
    group: "Введение",
    kind: "intro",
    pdf: item.pdf || "",
    level: textbookMeta.levels,
  }));

const lessonTracks = textbookUnits.flatMap((unit) =>
  unit.lessons.map((lesson) => ({
    id: `audio-${lesson.id}`,
    lessonId: lesson.id,
    title: `${String(lesson.order).padStart(2, "0")}. ${lesson.title}`,
    subtitle: `${lesson.arTitle} · ${unit.title}`,
    ar: lesson.arTitle,
    src: lesson.audio,
    group: `Модуль ${unit.module} · ${unit.title}`,
    module: unit.module,
    level: unit.level,
    kind: "lesson",
    pdf: unit.chapter,
  })),
);

export const audioLibrary = [...frontMatterTracks, ...lessonTracks];
export const audioById = Object.fromEntries(audioLibrary.map((track) => [track.id, track]));

export const modulePdfMap = Object.fromEntries(
  textbookUnits.map((unit) => [unit.module, { pdf: unit.chapter, title: unit.title, ar: unit.ar, level: unit.level }]),
);

export function lessonAudio(lessonId) {
  return audioById[`audio-${lessonId}`] || null;
}

export function lessonPdf(lessonId) {
  return lessonTextbookMap[lessonId]?.pdf || "";
}

export function moduleAudioCount(moduleId) {
  return audioLibrary.filter((track) => track.module === Number(moduleId)).length;
}

export const textbookPdfCount =
  textbookFrontMatter.filter((item) => item.pdf).length +
  textbookUnits.filter((unit) => unit.chapter).length;
