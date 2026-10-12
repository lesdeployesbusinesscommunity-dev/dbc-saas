// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { recommencerFormation, repondrePrerequis, repondreQuizLecon, terminerLecon } from "api/formations";
import { accountStorageKey, subscribeMember } from "../currentMember";
import { getMemberStore, refreshTrainingProgress, subscribeMemberStore } from "../memberStore";

// ----------------------------------------------------------------------
// Avancement du membre dans ses formations. Il est tenu par le SERVEUR
// (GET /formations/ma-progression, voir memberStore.js) : leçons terminées,
// quiz tentés, quiz de pré-requis, formation terminée. Une vidéo regardée ou
// un PDF ouvert est envoyé tout de suite (POST /formations/lecons/:id/suivre)
// et compté aussitôt à l'écran ; les quiz sont corrigés par le serveur.
//
// Seule la position de lecture des vidéos (reprendre où on s'était arrêté)
// reste dans le navigateur, une par compte : c'est un confort, pas un acquis.
//
// Les fonctions gardent la forme qu'attendaient les pages : un état par
// formation { watched, positions, lastLessonId, updatedAt, quizzes, prereq }.

const POSITIONS_KEY = "dbc-membre-formation-positions-v1";

function loadPositions() {
  try {
    return JSON.parse(window.localStorage.getItem(accountStorageKey(POSITIONS_KEY)) ?? "{}");
  } catch {
    return {};
  }
}

let positions = loadPositions();
// Leçons envoyées au serveur mais pas encore relues : affichées comme vues tout de suite.
let pendingWatched = {};
const listeners = new Set();
let localVersion = 0;

function emit() {
  localVersion += 1;
  listeners.forEach((listener) => listener());
}

subscribeMember(() => {
  positions = loadPositions();
  pendingWatched = {};
  emit();
});
subscribeMemberStore(() => listeners.forEach((listener) => listener()));

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ----------------------------------------------------------------------
// État dérivé (mémorisé tant que rien ne change).
let cache = { key: "", state: {}, rewards: {} };

function derive() {
  const { trainingProgress, version } = getMemberStore();
  const key = `${version}:${localVersion}`;
  if (cache.key === key) return cache;

  const state = {};
  const rewards = {};
  trainingProgress.forEach((entry) => {
    const watched = new Set([...entry.completedLessonIds, ...(pendingWatched[entry.trainingId] ?? [])]);
    state[entry.trainingId] = {
      watched: [...watched],
      positions: positions[entry.trainingId] ?? {},
      lastLessonId: entry.lastLessonId,
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt).getTime() : 0,
      quizzes: entry.quizzes,
      prereq: entry.prerequisite,
    };
    if (entry.completedAt) {
      rewards[entry.trainingId] = { at: new Date(entry.completedAt).getTime(), certificateCode: entry.certificateCode };
    }
  });
  // Formations pas encore commencées côté serveur mais avec une leçon en cours d'envoi.
  Object.entries(pendingWatched).forEach(([courseId, ids]) => {
    if (!state[courseId]) {
      state[courseId] = { watched: [...ids], positions: positions[courseId] ?? {}, lastLessonId: ids[ids.length - 1], updatedAt: Date.now(), quizzes: {} };
    }
  });
  Object.entries(positions).forEach(([courseId, coursePositions]) => {
    if (!state[courseId]) {
      state[courseId] = { watched: [], positions: coursePositions, lastLessonId: null, updatedAt: 0, quizzes: {} };
    }
  });

  cache = { key, state, rewards };
  return cache;
}

export function getProgressState() {
  return derive().state;
}

export function useProgressState() {
  return useSyncExternalStore(subscribe, getProgressState, getProgressState);
}

// Formations terminées : { [idFormation]: { at, certificateCode } }.
export function getRewards() {
  return derive().rewards;
}

export function useRewards() {
  return useSyncExternalStore(subscribe, getRewards, getRewards);
}

// La formation a-t-elle déjà été terminée (ses Coins crédités par le serveur) ?
export function isCourseRewarded(course, rewardsState = getRewards()) {
  return Boolean(rewardsState[course.id]);
}

// ----------------------------------------------------------------------
// Actions

// Vidéo regardée jusqu'au bout ou PDF ouvert : la leçon est terminée. Un quiz
// ne passe pas par ici (voir submitLessonQuiz).
export function markLessonWatched(course, lessonId) {
  const lesson = course.lessons.find((entry) => entry.id === lessonId);
  if (!lesson || lesson.type === "quiz") return;
  if ((getProgressState()[course.id]?.watched ?? []).includes(lessonId)) return;

  pendingWatched = { ...pendingWatched, [course.id]: [...(pendingWatched[course.id] ?? []), lessonId] };
  emit();
  terminerLecon(lessonId)
    .then((result) => refreshTrainingProgress({ trainingCompleted: result.trainingCompleted }))
    .catch(() => {})
    .finally(() => {
      pendingWatched = {
        ...pendingWatched,
        [course.id]: (pendingWatched[course.id] ?? []).filter((id) => id !== lessonId),
      };
      emit();
    });
}

// Réponses à un quiz de chapitre : corrigées par le serveur, qui enregistre
// la tentative ; renvoie le résultat attendu par QuizPlayer.jsx.
export async function submitLessonQuiz(course, lessonId, answers) {
  const result = await repondreQuizLecon(lessonId, answers);
  await refreshTrainingProgress({ trainingCompleted: result.trainingCompleted });
  return result;
}

export function isPrerequisitePassed(course, progressState = getProgressState()) {
  if (!course.prerequisiteQuiz) return true;
  return Boolean(progressState[course.id]?.prereq?.passed);
}

// Réponses au quiz de pré-requis : corrigées et enregistrées par le serveur.
export async function submitPrerequisite(course, answers) {
  const result = await repondrePrerequis(course.id, answers);
  await refreshTrainingProgress();
  return result;
}

// Position de lecture d'une vidéo (secondes), pour la reprendre plus tard.
export function saveLessonPosition(course, lessonId, seconds) {
  positions = {
    ...positions,
    [course.id]: { ...(positions[course.id] ?? {}), [lessonId]: Math.max(0, Math.floor(seconds)) },
  };
  try {
    window.localStorage.setItem(accountStorageKey(POSITIONS_KEY), JSON.stringify(positions));
  } catch {
    // stockage indisponible : la position reste valable pour cette session
  }
  emit();
}

// "Recommencer la formation" : l'avancement repart de zéro (le certificat et
// les Coins déjà obtenus restent acquis).
export function resetCourse(course) {
  positions = { ...positions, [course.id]: {} };
  try {
    window.localStorage.setItem(accountStorageKey(POSITIONS_KEY), JSON.stringify(positions));
  } catch {
    // voir saveLessonPosition
  }
  emit();
  return recommencerFormation(course.id).then(() => refreshTrainingProgress());
}

// Tout ce que l'interface a besoin de savoir sur l'avancement d'une
// formation : leçons vues, pourcentage, statut, et la leçon à reprendre
// (celle où le membre s'est arrêté si elle n'est pas terminée, sinon la
// première non terminée, sinon la toute première).
export function getCourseProgress(course, progressState = getProgressState()) {
  const entry = progressState[course.id];
  const watchedIds = new Set(entry?.watched ?? []);
  const total = course.lessons.length;
  const watched = course.lessons.filter((lesson) => watchedIds.has(lesson.id)).length;
  const percent = total === 0 ? 0 : Math.round((watched / total) * 100);

  const lastLesson = course.lessons.find((lesson) => lesson.id === entry?.lastLessonId);
  const firstUnwatched = course.lessons.find((lesson) => !watchedIds.has(lesson.id));
  const resumeLesson =
    lastLesson && !watchedIds.has(lastLesson.id)
      ? lastLesson
      : (firstUnwatched ?? course.lessons[0] ?? null);

  return {
    watchedIds,
    watched,
    total,
    percent,
    status: percent >= 100 ? "completed" : watched > 0 ? "inProgress" : "notStarted",
    resumeLesson,
    positions: entry?.positions ?? {},
    quizzes: entry?.quizzes ?? {},
    updatedAt: entry?.updatedAt ?? 0,
  };
}
