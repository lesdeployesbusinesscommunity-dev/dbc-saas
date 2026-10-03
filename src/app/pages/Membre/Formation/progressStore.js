// Import Dependencies
import { useSyncExternalStore } from "react";

// ----------------------------------------------------------------------
// Avancement du membre dans ses formations : quelles leçons (vidéos) il a
// terminées et où il s'est arrêté dans chacune. C'est ce qui fait monter
// le pourcentage au fil du visionnage — la page Formation, la page de cours
// ET le Dashboard (voir Dashboard/mockData.js) lisent ce même magasin, donc
// ne peuvent pas se contredire.
//
// Pas de backend pour l'instant : l'état est gardé dans le navigateur
// (localStorage, protégé par try/catch — il peut être absent ou bloqué)
// et partagé entre composants via useSyncExternalStore. À remplacer par de
// vrais appels API (progression enregistrée côté serveur, par membre)
// sans changer ce que ces fonctions renvoient.
//
// Forme : { [idFormation]: { watched: [idLeçon], positions: { [idLeçon]:
// secondes }, lastLessonId, updatedAt } }.
//
// Tant qu'un membre n'a RIEN fait dans une formation (pas d'entrée), son
// avancement de départ est repris du catalogue ("baseProgress", le
// "progress" statique de l'admin) : on considère les premières leçons
// comme déjà vues, pour que le Dashboard n'affiche pas 0 % sur des
// formations déjà commencées.
const STORAGE_KEY = "dbc-membre-formation-progress-v1";

// Coins gagnés en terminant des formations : { [idFormation]: { coins,
// at } }. Gardés À PART de la progression (autre clé) : "Recommencer la
// formation" remet la progression à zéro mais ne retire JAMAIS des Coins
// déjà gagnés, et une formation ne rapporte ses Coins qu'une seule fois.
const REWARDS_KEY = "dbc-membre-formation-rewards-v1";

function load(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage indisponible : l'état reste valable pour cette session
  }
}

let state = load(STORAGE_KEY);
let rewards = load(REWARDS_KEY);
const listeners = new Set();

function setState(next, nextRewards = rewards) {
  state = next;
  save(STORAGE_KEY, state);
  if (nextRewards !== rewards) {
    rewards = nextRewards;
    save(REWARDS_KEY, rewards);
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getProgressState() {
  return state;
}

export function useProgressState() {
  return useSyncExternalStore(subscribe, getProgressState, getProgressState);
}

// Coins de formation. Une formation déjà TERMINÉE au départ (avancement
// de départ à 100 %, voir "baseProgress") est considérée comme déjà
// comptée dans le solde de départ du membre (currentMember.coins) : elle
// n'est pas re-créditée, même après "Recommencer".
export function getRewards() {
  return rewards;
}

export function useRewards() {
  return useSyncExternalStore(subscribe, getRewards, getRewards);
}

export function isCourseRewarded(course, rewardsState = rewards) {
  return Boolean(rewardsState[course.id]) || course.baseProgress >= 100;
}

// Total des Coins gagnés dans l'app via les formations (s'ajoute au solde
// de départ : voir Coins/mockData.js "getMemberCoins").
export function getFormationCoinsEarned(rewardsState = rewards) {
  return Object.values(rewardsState).reduce((sum, entry) => sum + (entry.coins ?? 0), 0);
}

function seededWatchedIds(course) {
  const count = Math.round((course.baseProgress / 100) * course.lessons.length);
  return course.lessons.slice(0, count).map((lesson) => lesson.id);
}

function entryFor(course) {
  return (
    state[course.id] ?? {
      watched: seededWatchedIds(course),
      positions: {},
      lastLessonId: null,
      updatedAt: 0,
    }
  );
}

export function markLessonWatched(course, lessonId) {
  const entry = entryFor(course);
  if (entry.watched.includes(lessonId)) return;
  const watched = [...entry.watched, lessonId];
  const nextState = {
    ...state,
    [course.id]: { ...entry, watched, lastLessonId: lessonId, updatedAt: Date.now() },
  };

  // Dernière leçon terminée : la formation est finie, on crédite ses Coins
  // (une seule fois — voir "isCourseRewarded").
  const finished = course.lessons.every((lesson) => watched.includes(lesson.id));
  if (finished && !isCourseRewarded(course)) {
    setState(nextState, {
      ...rewards,
      [course.id]: { coins: course.coinsReward, at: Date.now() },
    });
    return;
  }
  setState(nextState);
}

export function saveLessonPosition(course, lessonId, seconds) {
  const entry = entryFor(course);
  setState({
    ...state,
    [course.id]: {
      ...entry,
      positions: { ...entry.positions, [lessonId]: Math.max(0, Math.floor(seconds)) },
      lastLessonId: lessonId,
      updatedAt: Date.now(),
    },
  });
}

// "Recommencer" : tout remettre à zéro (et non retomber sur l'avancement
// de départ du catalogue).
export function resetCourse(course) {
  setState({
    ...state,
    [course.id]: { watched: [], positions: {}, lastLessonId: null, updatedAt: Date.now() },
  });
}

// Tout ce que l'interface a besoin de savoir sur l'avancement d'une
// formation : leçons vues, pourcentage, statut, et la leçon à reprendre
// (celle où le membre s'est arrêté si elle n'est pas terminée, sinon la
// première non terminée, sinon la toute première).
export function getCourseProgress(course, progressState = state) {
  const entry = progressState[course.id];
  const watchedIds = new Set(entry ? entry.watched : seededWatchedIds(course));
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
    updatedAt: entry?.updatedAt ?? 0,
  };
}
