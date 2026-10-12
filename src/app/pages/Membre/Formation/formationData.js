// Import Dependencies
import { levels } from "app/pages/Simulateur/data";
import { levelKeyFromCode } from "utils/levelCodes";
import { trainingDomains } from "./domains";
import { getMemberStore } from "../memberStore";

// ----------------------------------------------------------------------
// Catalogue de formations côté MEMBRE, tiré de GET /formations (voir
// memberStore.js) : les formations créées dans "Gestion des formations" côté
// admin, classées par niveau requis.
//
// Une formation (un "course") a des CHAPITRES ; chaque chapitre contient, dans
// l'ordre, ses vidéos, puis ses supports PDF (téléchargeables), puis ses quiz
// de validation. Tous sont des "leçons" (course.lessons) avec un "type" —
// "video", "pdf" ou "quiz" — pour que l'avancement, la reprise et la liste
// des chapitres les traitent de la même façon. Les quiz arrivent SANS les
// bonnes réponses : le serveur corrige (voir QuizPlayer.jsx).
//
// En plus, une formation peut avoir UN support PDF qui regroupe tous les
// chapitres (course.coursePdf : document de référence, ne compte pas dans
// l'avancement) et un quiz de pré-requis (course.prerequisiteQuiz), à réussir
// avant d'en ouvrir le contenu.

const DEFAULT_POSTER = "/former.jpg";

// Coins gagnés en terminant une formation : ceux fixés par l'admin sur la
// formation, sinon le barème "formation terminée" du serveur.
function defaultFormationCoins() {
  return getMemberStore().space?.coins.earningRules.actions.find((a) => a.code === "formation_completee")?.coins ?? 0;
}

function buildCourse(training) {
  const levelKey = levelKeyFromCode(training.levelCode);
  const chapters = training.chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    objectives: chapter.objectives,
    lessons: [
      ...chapter.videos.map((video) => ({ id: video.id, type: "video", title: video.title, url: video.url })),
      ...chapter.documents.map((document) => ({ id: document.id, type: "pdf", title: document.title, url: document.url })),
      ...chapter.quizzes.map((quiz) => ({ id: quiz.id, type: "quiz", title: quiz.title, quiz })),
    ],
  }));

  return {
    id: training.id,
    name: training.name,
    poster: training.poster || DEFAULT_POSTER,
    trainer: training.trainer ?? "",
    startDate: training.startDate ?? "",
    duration: training.duration ?? "",
    levelKey,
    coinsReward: training.coinsReward ?? defaultFormationCoins(),
    domainKey: training.domainKey ?? trainingDomains[training.id] ?? "fondamentaux",
    // L'avancement vient du serveur (voir progressStore.js), pas d'une valeur de départ.
    baseProgress: 0,
    objectives: training.objectives,
    outcomes: training.outcomes,
    prerequisiteQuiz: training.prerequisiteQuiz,
    coursePdf: training.coursePdf ? { id: `${training.id}-course-pdf`, ...training.coursePdf } : null,
    chapters,
    lessons: chapters.flatMap((chapter) => chapter.lessons),
  };
}

// Recalculé seulement quand les données changent.
let cache = { version: -1, courses: [] };

function allCourses() {
  const { trainings, version } = getMemberStore();
  if (cache.version !== version) {
    cache = { version, courses: trainings.map(buildCourse) };
  }
  return cache.courses;
}

// Les formations d'UN niveau : la page Formation change quand le membre
// change de niveau (voir MemberLevelContext).
export function getCourseCatalog(levelKey) {
  return allCourses().filter((course) => course.levelKey === levelKey);
}

// Une formation par son id, tous niveaux confondus (page de cours).
export function getCourseById(courseId) {
  return allCourses().find((course) => course.id === courseId) ?? null;
}

// Les formations des niveaux auxquels le membre NE cotise PAS encore,
// groupées par niveau (dans l'ordre des niveaux, sans les niveaux sans
// formation) : la page les montre verrouillées, pour donner envie de
// monter en niveau (voir LockedTrainings.jsx).
export function getLockedCatalog(ownedLevelKeys) {
  return levels
    .filter((level) => !ownedLevelKeys.includes(level.key))
    .map((level) => ({ levelKey: level.key, courses: getCourseCatalog(level.key) }))
    .filter((group) => group.courses.length > 0);
}

// Fourchette de Coins que rapportent les formations du catalogue (min/max).
export function getFormationRewardRange() {
  const amounts = allCourses().map((course) => course.coinsReward);
  return amounts.length ? { min: Math.min(...amounts), max: Math.max(...amounts) } : { min: 0, max: 0 };
}
