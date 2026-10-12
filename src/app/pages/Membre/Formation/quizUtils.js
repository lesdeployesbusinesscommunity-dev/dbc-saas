// ----------------------------------------------------------------------
// Les quiz d'une formation, côté membre ET admin (l'éditeur de l'admin,
// Admin/Formation/QuizEditor.jsx, produit exactement cette forme).
//
//   quiz = {
//     id, title,
//     passingScore,            // pourcentage de bonnes réponses exigé (0-100)
//     questions: [{
//       id, text,
//       options: [{ id, text }],
//       correct: [optionId],   // 1 id = réponse unique, plusieurs = à cocher
//     }],
//   }
//
// Deux sortes de quiz existent :
// - le quiz de PRÉ-REQUIS, au tout début d'une formation
//   (training.prerequisiteQuiz) : il vérifie que le membre a les bases ; il
//   doit être réussi pour ouvrir le contenu de la formation ;
// - les quiz de VALIDATION, dans un chapitre (chapter.quizzes) : un quiz
//   réussi compte comme une étape terminée de la formation.
export const DEFAULT_PASSING_SCORE = 70;

export const isMultipleChoice = (question) => question.correct.length > 1;

// Corrige un quiz. "answers" : { [questionId]: [optionId, ...] }. Une
// question est juste quand les options cochées sont EXACTEMENT les bonnes
// (ni une de moins, ni une de plus).
export function scoreQuiz(quiz, answers) {
  const results = {};
  let correctCount = 0;
  quiz.questions.forEach((question) => {
    const given = [...(answers[question.id] ?? [])].sort();
    const expected = [...question.correct].sort();
    const ok = given.length === expected.length && given.every((id, index) => id === expected[index]);
    results[question.id] = ok;
    if (ok) correctCount += 1;
  });
  const total = quiz.questions.length;
  const percent = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  return {
    results,
    correctCount,
    total,
    percent,
    passed: total > 0 && percent >= (quiz.passingScore ?? DEFAULT_PASSING_SCORE),
  };
}

// Un quiz est publiable si chaque question a un énoncé, au moins deux
// options remplies et au moins une bonne réponse. Utilisé par l'éditeur
// admin pour activer/désactiver "Enregistrer".
export function isQuizValid(quiz) {
  if (!quiz.title.trim() || quiz.questions.length === 0) return false;
  return quiz.questions.every((question) => {
    const filled = question.options.filter((option) => option.text.trim());
    return (
      question.text.trim() &&
      filled.length >= 2 &&
      question.correct.some((id) => filled.some((option) => option.id === id))
    );
  });
}

// Nettoie un quiz avant de l'enregistrer : retire les options vides (et
// les bonnes réponses qui pointaient dessus) et les espaces superflus.
export function cleanQuiz(quiz) {
  return {
    ...quiz,
    title: quiz.title.trim(),
    passingScore: Math.min(100, Math.max(1, Number(quiz.passingScore) || DEFAULT_PASSING_SCORE)),
    questions: quiz.questions.map((question) => {
      const options = question.options
        .map((option) => ({ ...option, text: option.text.trim() }))
        .filter((option) => option.text);
      return {
        ...question,
        text: question.text.trim(),
        options,
        correct: question.correct.filter((id) => options.some((option) => option.id === id)),
      };
    }),
  };
}

export function newQuestion() {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  return {
    id: `q-${stamp}`,
    text: "",
    options: ["a", "b", "c", "d"].map((letter) => ({ id: `${letter}`, text: "" })),
    correct: [],
  };
}

export function newQuiz() {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  return { id: `quiz-${stamp}`, title: "", passingScore: DEFAULT_PASSING_SCORE, questions: [newQuestion()] };
}
