// Local Imports
import { LEVEL_CODE_BY_KEY, levelKeyFromCode } from "utils/levelCodes";

// ----------------------------------------------------------------------
// Passage entre la forme d'une formation dans "Gestion des formations"
// (celle que les composants de cette page manipulent depuis le début :
// { name, poster, trainer, startDate, duration, objectives: { global,
// chapters, outcomes }, coursePdf, prerequisiteQuiz }) et celle de l'API
// (GET /formations/admin/catalogue, POST et PUT /formations).
//
// "watched" sur une vidéo est le repère de RELECTURE de l'admin (il coche les
// vidéos qu'il a vérifiées) : il reste dans la page, il n'est pas enregistré.

const DEFAULT_POSTER = "/former.jpg";

const quizFromApi = (quiz) =>
  quiz && {
    id: quiz.id,
    title: quiz.title,
    passingScore: quiz.passingScore,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      text: question.text,
      options: question.options.map((option) => ({ id: option.id, text: option.text })),
      correct: question.correct ?? [],
    })),
  };

const quizToApi = (quiz) =>
  quiz && {
    id: quiz.id,
    title: quiz.title,
    passingScore: quiz.passingScore,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      text: question.text,
      options: question.options.map((option) => ({ id: option.id, text: option.text })),
      correct: question.correct,
    })),
  };

const fileItem = ({ id, title, url }) => ({ id, title, url });

// Formation de l'API -> forme de la page, avec son niveau.
export function trainingFromApi(training) {
  return {
    levelKey: levelKeyFromCode(training.levelCode),
    training: {
      id: training.id,
      name: training.name,
      poster: training.poster || DEFAULT_POSTER,
      trainer: training.trainer ?? "",
      startDate: training.startDate ?? "",
      duration: training.duration ?? "",
      coinsReward: training.coinsReward,
      domainKey: training.domainKey,
      objectives: {
        global: training.objectives,
        chapters: training.chapters.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          objectives: chapter.objectives,
          videos: chapter.videos.map((video) => ({ ...fileItem(video), watched: false })),
          documents: chapter.documents.map(fileItem),
          quizzes: chapter.quizzes.map(quizFromApi),
        })),
        outcomes: training.outcomes,
      },
      coursePdf: training.coursePdf ? { id: `${training.id}-course-pdf`, ...training.coursePdf } : null,
      prerequisiteQuiz: quizFromApi(training.prerequisiteQuiz),
    },
  };
}

// Formations de l'API -> { [cléNiveau]: [formations] } (forme de la page).
export function groupByLevel(trainings) {
  return trainings.map(trainingFromApi).reduce((byLevel, { levelKey, training }) => {
    byLevel[levelKey] = [...(byLevel[levelKey] ?? []), training];
    return byLevel;
  }, {});
}

// Forme de la page -> corps de POST / PUT /formations.
export function trainingToApi(levelKey, training) {
  const objectives = training.objectives ?? {};
  // L'affiche par défaut est une image de la page, pas un fichier envoyé.
  const poster = training.poster && training.poster !== DEFAULT_POSTER ? training.poster : undefined;
  return {
    name: training.name,
    levelCode: LEVEL_CODE_BY_KEY[levelKey] ?? levelKey,
    trainer: training.trainer || undefined,
    poster,
    startDate: training.startDate || undefined,
    duration: training.duration || undefined,
    domainKey: training.domainKey || undefined,
    coinsReward: training.coinsReward ?? undefined,
    objectives: objectives.global ?? [],
    outcomes: objectives.outcomes ?? [],
    coursePdf: training.coursePdf ? { title: training.coursePdf.title, url: training.coursePdf.url } : null,
    prerequisiteQuiz: quizToApi(training.prerequisiteQuiz) ?? null,
    chapters: (objectives.chapters ?? []).map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      objectives: chapter.objectives ?? [],
      videos: (chapter.videos ?? []).map(fileItem),
      documents: (chapter.documents ?? []).map(fileItem),
      quizzes: (chapter.quizzes ?? []).map(quizToApi),
    })),
  };
}

// Avancement de RELECTURE d'une formation par l'admin : la part des vidéos
// qu'il a marquées comme vues (0 tant qu'il n'y a pas de vidéo).
export function getTrainingProgress(training) {
  const allVideos = (training.objectives?.chapters ?? []).flatMap((chapter) => chapter.videos ?? []);
  if (allVideos.length === 0) return 0;
  const watchedCount = allVideos.filter((video) => video.watched).length;
  return Math.round((watchedCount / allVideos.length) * 100);
}
