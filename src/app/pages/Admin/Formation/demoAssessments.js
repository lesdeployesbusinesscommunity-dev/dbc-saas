// ----------------------------------------------------------------------
// Contenus de DÉMONSTRATION des formations : quiz de pré-requis, supports
// PDF et quiz de validation, ajoutés au catalogue par "withDemoAssessments"
// (voir mockData.js). Seules quelques formations en ont, pour montrer le
// rendu côté membre et côté admin ; les autres n'en ont pas encore (l'admin
// en ajoute depuis la fiche de la formation). À remplacer par les vrais
// contenus (stockés côté serveur) sans changer leur forme — voir
// Membre/Formation/quizUtils.js pour la forme d'un quiz.
//
// Les PDF sont de petits fichiers de démonstration du dossier /public.
//
// Chaque formation a, en plus des vidéos de ses chapitres, UN support PDF
// qui regroupe tous les chapitres ("coursePdf") ; les chapitres peuvent en
// plus avoir leurs propres PDF.
//
// Forme : { [idFormation]: { coursePdf?: { id, title, url }, prerequisiteQuiz?,
// chapters: { [indexChapitre]: { documents?: [{ id, title, url }],
// quizzes?: [quiz] } } } }
const demoAssessments = {
  // Fondamentaux DBC (Starter) : formation d'entrée, sans pré-requis.
  f1: {
    coursePdf: {
      id: "f1-course-pdf",
      title: "Fondamentaux DBC — tous les chapitres",
      url: "/formation-support-fondamentaux.pdf",
    },
    chapters: {
      0: {
        documents: [
          { id: "f1-doc-1", title: "Guide — La vision et les piliers de la DBC", url: "/formation-guide-dbc.pdf" },
        ],
        quizzes: [
          {
            id: "f1-quiz-1",
            title: "Quiz de validation — Histoire et vision",
            passingScore: 70,
            questions: [
              {
                id: "q1",
                text: "Que signifie DBC ?",
                options: [
                  { id: "a", text: "Les Déployés Business Community" },
                  { id: "b", text: "Digital Business Center" },
                  { id: "c", text: "Diaspora Banking Company" },
                ],
                correct: ["a"],
              },
              {
                id: "q2",
                text: "Quelles missions la DBC poursuit-elle auprès des entrepreneurs africains ? (plusieurs réponses)",
                options: [
                  { id: "a", text: "Les équiper" },
                  { id: "b", text: "Les connecter" },
                  { id: "c", text: "Les financer" },
                  { id: "d", text: "Racheter leurs entreprises" },
                ],
                correct: ["a", "b", "c"],
              },
            ],
          },
        ],
      },
      1: {
        documents: [
          { id: "f1-doc-2", title: "Fiche — Les niveaux et leurs cagnottes", url: "/formation-guide-niveaux.pdf" },
        ],
        quizzes: [
          {
            id: "f1-quiz-2",
            title: "Quiz de validation — Le système de niveaux",
            passingScore: 50,
            questions: [
              {
                id: "q1",
                text: "Combien de niveaux compte le système de la DBC ?",
                options: [
                  { id: "a", text: "4" },
                  { id: "b", text: "8" },
                  { id: "c", text: "12" },
                ],
                correct: ["b"],
              },
              {
                id: "q2",
                text: "Combien de tours compte un cycle de tontine annuel ?",
                options: [
                  { id: "a", text: "6" },
                  { id: "b", text: "12" },
                  { id: "c", text: "24" },
                ],
                correct: ["b"],
              },
            ],
          },
        ],
      },
    },
  },

  // Vente & Négociation (Bâtisseur) : demande des bases en vente, d'où le
  // quiz de pré-requis à réussir avant d'ouvrir la formation.
  f4: {
    coursePdf: {
      id: "f4-course-pdf",
      title: "Vente & Négociation — tous les chapitres",
      url: "/formation-support-vente.pdf",
    },
    prerequisiteQuiz: {
      id: "f4-prereq",
      title: "Quiz de pré-requis — Les bases de la vente",
      passingScore: 60,
      questions: [
        {
          id: "q1",
          text: "Quelle est la première étape d'une vente réussie ?",
          options: [
            { id: "a", text: "Annoncer le prix" },
            { id: "b", text: "Écouter et comprendre le besoin du client" },
            { id: "c", text: "Conclure rapidement" },
          ],
          correct: ["b"],
        },
        {
          id: "q2",
          text: "Un prospect est :",
          options: [
            { id: "a", text: "Une personne qui a déjà acheté" },
            { id: "b", text: "Une personne susceptible de devenir client" },
            { id: "c", text: "Un concurrent" },
          ],
          correct: ["b"],
        },
        {
          id: "q3",
          text: "Que fait-on face à une objection du client ? (plusieurs réponses)",
          options: [
            { id: "a", text: "On l'écoute jusqu'au bout" },
            { id: "b", text: "On reformule pour vérifier qu'on a compris" },
            { id: "c", text: "On change de sujet" },
          ],
          correct: ["a", "b"],
        },
      ],
    },
    chapters: {
      0: {
        documents: [
          { id: "f4-doc-1", title: "Support — Les étapes de la vente", url: "/formation-guide-vente.pdf" },
        ],
        quizzes: [
          {
            id: "f4-quiz-1",
            title: "Quiz de validation — Préparer sa vente",
            passingScore: 70,
            questions: [
              {
                id: "q1",
                text: "Préparer un rendez-vous de vente, c'est d'abord :",
                options: [
                  { id: "a", text: "Connaître son client et son besoin" },
                  { id: "b", text: "Baisser son prix à l'avance" },
                  { id: "c", text: "Éviter de poser des questions" },
                ],
                correct: ["a"],
              },
            ],
          },
        ],
      },
    },
  },
};

// Renvoie une copie du catalogue (niveau -> formations) où les formations
// de "demoAssessments" ont leurs PDF, quiz de validation et quiz de
// pré-requis.
export function withDemoAssessments(trainingsByLevel) {
  return Object.fromEntries(
    Object.entries(trainingsByLevel).map(([levelKey, trainings]) => [
      levelKey,
      trainings.map((training) => {
        const extra = demoAssessments[training.id];
        if (!extra) return training;
        return {
          ...training,
          coursePdf: extra.coursePdf ?? null,
          prerequisiteQuiz: extra.prerequisiteQuiz ?? null,
          objectives: {
            ...training.objectives,
            chapters: training.objectives.chapters.map((chapter, index) => ({
              ...chapter,
              documents: extra.chapters?.[index]?.documents ?? [],
              quizzes: extra.chapters?.[index]?.quizzes ?? [],
            })),
          },
        };
      }),
    ]),
  );
}
