// Import Dependencies
import { initialTrainingsByLevel } from "app/pages/Admin/Formation/mockData";
import { levels } from "app/pages/Simulateur/data";
import { trainingDomains } from "./domains";

// ----------------------------------------------------------------------
// Catalogue de formations côté MEMBRE. Il part du même catalogue que
// "Gestion des formations" côté admin (Admin/Formation/mockData.js — mêmes
// formations, mêmes formateurs, mêmes chapitres, classées par niveau)
// plutôt que d'une liste séparée : une formation créée par l'admin
// apparaît ici, dans le bon niveau.
//
// Ce que ce fichier ajoute :
// - le DOMAINE de chaque formation (voir domains.js) ;
// - les LEÇONS : une leçon vidéo par objectif de chapitre (les chapitres
//   admin ont 2 objectifs chacun). Aucune vraie vidéo n'existe encore côté
//   catalogue (les "videos" de chaque chapitre sont vides ; l'import admin
//   ne vit que le temps de la session), donc chaque leçon pointe vers une
//   VIDÉO DE DÉMONSTRATION de 20 secondes (public/formation-demo.webm).
//   Quand les vraies vidéos seront stockées (backend), "url" viendra
//   d'elles, une par leçon, sans changer le reste de l'interface.
const DEMO_VIDEO_URL = "/formation-demo.webm";

// Avancement de DÉPART du membre quand il diffère du "progress" du
// catalogue admin (qui est une donnée d'admin, pas celle de CE membre).
// "Vente & Négociation" repart de 0 pour que la page montre aussi une
// formation encore à commencer (bouton "Commencer la formation"). À
// supprimer avec le vrai suivi par membre côté serveur.
const memberStartProgress = { f4: 0 };

// Coins gagnés en terminant une formation : plus le niveau est élevé,
// plus la formation rapporte (20 au premier niveau, +10 par niveau). Donnée
// de démonstration — à remplacer par la valeur définie par l'admin sur
// chaque formation quand elle existera côté backend.
function coinsRewardFor(levelKey) {
  const index = Math.max(0, levels.findIndex((level) => level.key === levelKey));
  return 20 + index * 10;
}

function buildCourse(training, levelKey) {
  const chapters = (training.objectives?.chapters ?? []).map((chapter, chapterIndex) => ({
    id: `${training.id}-c${chapterIndex + 1}`,
    title: chapter.title,
    lessons: (chapter.objectives ?? []).map((objective, lessonIndex) => ({
      id: `${training.id}-c${chapterIndex + 1}-l${lessonIndex + 1}`,
      title: objective,
      url: DEMO_VIDEO_URL,
    })),
  }));

  return {
    id: training.id,
    name: training.name,
    poster: training.poster,
    trainer: training.trainer,
    startDate: training.startDate,
    duration: training.duration,
    levelKey,
    coinsReward: coinsRewardFor(levelKey),
    domainKey: trainingDomains[training.id] ?? "fondamentaux",
    baseProgress: memberStartProgress[training.id] ?? training.progress ?? 0,
    objectives: training.objectives?.global ?? [],
    outcomes: training.objectives?.outcomes ?? [],
    chapters,
    lessons: chapters.flatMap((chapter) => chapter.lessons),
  };
}

// Les formations d'UN niveau : la page Formation change quand le membre
// change de niveau (voir MemberLevelContext).
export function getCourseCatalog(levelKey) {
  return (initialTrainingsByLevel[levelKey] ?? []).map((training) =>
    buildCourse(training, levelKey),
  );
}

// Une formation par son id, tous niveaux confondus (page de cours).
export function getCourseById(courseId) {
  for (const level of levels) {
    const training = (initialTrainingsByLevel[level.key] ?? []).find(
      (entry) => entry.id === courseId,
    );
    if (training) return buildCourse(training, level.key);
  }
  return null;
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

// Fourchette de Coins que rapportent les formations du catalogue
// (min/max) : alimente la ligne "Terminer une formation" de "Comment
// gagner des Coins" (Coins/mockData.js), pour qu'elle ne puisse pas se
// contredire avec les montants affichés sur les formations.
export function getFormationRewardRange() {
  const amounts = levels.flatMap((level) =>
    getCourseCatalog(level.key).map((course) => course.coinsReward),
  );
  return amounts.length ? { min: Math.min(...amounts), max: Math.max(...amounts) } : { min: 0, max: 0 };
}
