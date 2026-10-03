// ----------------------------------------------------------------------
// Données de démonstration pour "Gestion des formations". Comme pour le
// reste de l'admin, tout est en local en attendant les vrais endpoints
// (voir Formation/index.jsx).
//
// Indexé par la même "key" que dans Simulateur/data.js (mêmes 8 niveaux),
// pour rester cohérent avec Finance, Gouvernance, etc. Les noms de
// formation reprennent volontairement ceux déjà vus dans le parcours des
// membres (voir Admin/Membres/mockData.js : trainingsCompleted /
// trainingInProgress — "Fondamentaux DBC", "Leadership", "Techniques de
// vente", "Gouvernance associative") pour rester le même catalogue plutôt
// que d'inventer une liste séparée, puis complète avec les formations
// propres aux niveaux plus avancés.
//
// "poster" réutilise en attendant de vraies affiches, les mêmes visuels
// déjà présents dans /public (thème "Former") qu'ailleurs dans l'admin.
// "progress" (0-100) alimente la barre d'avancement en bas de chaque
// carte (voir TrainingCard.jsx) — UNIQUEMENT tant qu'aucune vidéo n'a
// encore été ajoutée à un chapitre de cette formation (voir
// getTrainingProgress ci-dessous). "objectives" alimente la fiche
// détaillée ouverte au clic sur une carte (voir TrainingDetailsModal.jsx) :
// "global" = objectifs généraux de la formation, "chapters" = un
// objectif par chapitre, "outcomes" = ce que le membre saura faire à
// l'issue de la formation.
//
// "videos" (par chapitre, vide au départ dans ce catalogue de démo) :
// chaque vidéo importée depuis la fiche détaillée (voir
// TrainingDetailsModal.jsx) y est ajoutée à la position choisie par
// l'admin, sous la forme { id, title, url, watched }. Tant qu'il n'existe
// aucun vrai endpoint d'upload, "url" pointe vers un fichier local
// (URL.createObjectURL) valable uniquement pour la session en cours — voir
// Formation/index.jsx (handleAddVideo).
//
// "initial" (plutôt que "trainingsByLevel" directement) car Formation/
// index.jsx en garde maintenant sa propre copie en état local, pour que
// "Ajouter une formation" (voir AddTrainingModal.jsx) et l'ajout de
// vidéos puissent l'enrichir sans toucher ce fichier — comme pour
// initialMembersByLevel ailleurs dans l'admin.
export const initialTrainingsByLevel = {
  starter: [
    {
      id: "f1",
      name: "Fondamentaux DBC",
      poster: "/former.jpg",
      trainer: "Aïcha Konaté",
      startDate: "2026-08-10",
      duration: "3 semaines",
      progress: 100,
      objectives: {
        global: [
          "Comprendre la mission et les valeurs de la DBC",
          "Maîtriser le fonctionnement du système de tontine par niveau",
          "Se familiariser avec les outils et la plateforme",
        ],
        chapters: [
          {
            title: "Chapitre 1 — Histoire et vision de la DBC",
            objectives: [
              "Retracer la genèse du mouvement",
              "Identifier les 4 piliers de la gouvernance",
            ],
            videos: [],
          },
          {
            title: "Chapitre 2 — Le système de niveaux",
            objectives: [
              "Distinguer les 8 niveaux et leurs cagnottes",
              "Comprendre la logique de progression",
            ],
            videos: [],
          },
          {
            title: "Chapitre 3 — Cotisations et tontine",
            objectives: [
              "Suivre le cycle des 12 tours",
              "Utiliser le tableau de bord membre",
            ],
            videos: [],
          },
        ],
        outcomes: [
          "Expliquer le fonctionnement de la DBC à un nouveau membre",
          "Suivre sa cotisation et sa cagnotte en autonomie",
          "Se situer dans le parcours de progression des niveaux",
        ],
      },
    },
    {
      id: "f2",
      name: "Techniques de vente",
      poster: "/former 2.jpg",
      trainer: "Grace Owusu",
      startDate: "2026-09-01",
      duration: "4 semaines",
      progress: 60,
      objectives: {
        global: [
          "Développer une approche commerciale structurée",
          "Convertir un prospect en membre actif",
        ],
        chapters: [
          {
            title: "Chapitre 1 — Prospection",
            objectives: [
              "Identifier des profils de prospects pertinents",
              "Construire un premier contact efficace",
            ],
            videos: [],
          },
          {
            title: "Chapitre 2 — Argumentaire",
            objectives: [
              "Présenter la valeur de la DBC en 2 minutes",
              "Répondre aux objections courantes",
            ],
            videos: [],
          },
          {
            title: "Chapitre 3 — Closing",
            objectives: [
              "Accompagner l'inscription jusqu'au bout",
              "Assurer le suivi post-inscription",
            ],
            videos: [],
          },
        ],
        outcomes: [
          "Mener un rendez-vous de présentation de A à Z",
          "Traiter les objections les plus fréquentes",
          "Finaliser une inscription de nouveau membre",
        ],
      },
    },
  ],
  batisseur: [
    {
      id: "f3",
      name: "Leadership",
      poster: "/former.jpg",
      trainer: "David Mbeki",
      startDate: "2026-08-20",
      duration: "5 semaines",
      progress: 80,
      objectives: {
        global: [
          "Développer une posture de leader au sein de son réseau",
          "Mobiliser et fédérer une équipe de filleuls",
        ],
        chapters: [
          {
            title: "Chapitre 1 — Se connaître comme leader",
            objectives: [
              "Identifier son style de leadership",
              "Clarifier sa vision personnelle",
            ],
            videos: [],
          },
          {
            title: "Chapitre 2 — Communiquer et motiver",
            objectives: [
              "Donner un feedback constructif",
              "Animer une réunion d'équipe",
            ],
            videos: [],
          },
          {
            title: "Chapitre 3 — Déléguer et faire grandir",
            objectives: [
              "Répartir les responsabilités selon les forces de chacun",
              "Accompagner la montée en niveau de ses filleuls",
            ],
            videos: [],
          },
        ],
        outcomes: [
          "Animer une équipe de filleuls avec assurance",
          "Donner un feedback qui fait progresser",
          "Déléguer efficacement les tâches clés",
        ],
      },
    },
    {
      id: "f4",
      name: "Vente & Négociation",
      poster: "/former 2.jpg",
      trainer: "Junior Kabongo",
      startDate: "2026-09-10",
      duration: "4 semaines",
      progress: 20,
      objectives: {
        global: [
          "Maîtriser les techniques de négociation avancées",
          "Renforcer la fidélisation des membres recrutés",
        ],
        chapters: [
          {
            title: "Chapitre 1 — Négociation gagnant-gagnant",
            objectives: [
              "Préparer une négociation en amont",
              "Trouver un terrain d'accord équilibré",
            ],
            videos: [],
          },
          {
            title: "Chapitre 2 — Gestion des objections complexes",
            objectives: [
              "Désamorcer le scepticisme",
              "Rassurer sur la sécurité financière",
            ],
            videos: [],
          },
          {
            title: "Chapitre 3 — Fidélisation",
            objectives: [
              "Maintenir le lien après l'inscription",
              "Encourager la progression de niveau",
            ],
            videos: [],
          },
        ],
        outcomes: [
          "Conduire une négociation structurée",
          "Rassurer un prospect hésitant",
          "Fidéliser un membre sur la durée",
        ],
      },
    },
  ],
  batisseurPro: [
    {
      id: "f5",
      name: "Gouvernance associative",
      poster: "/former.jpg",
      trainer: "Fatou Ndiaye",
      startDate: "2026-09-05",
      duration: "6 semaines",
      progress: 45,
      objectives: {
        global: [
          "Comprendre les principes de gouvernance d'une organisation associative",
          "Contribuer activement à la vie des instances DBC",
        ],
        chapters: [
          {
            title: "Chapitre 1 — Structures et instances",
            objectives: [
              "Distinguer les 4 pôles de la gouvernance DBC",
              "Comprendre le rôle de chaque instance",
            ],
            videos: [],
          },
          {
            title: "Chapitre 2 — Prise de décision",
            objectives: [
              "Participer à une décision collégiale",
              "Respecter les principes de transparence",
            ],
            videos: [],
          },
          {
            title: "Chapitre 3 — Redevabilité",
            objectives: [
              "Rendre compte de ses responsabilités",
              "Assurer un suivi rigoureux des engagements",
            ],
            videos: [],
          },
        ],
        outcomes: [
          "Situer son rôle dans la gouvernance DBC",
          "Participer activement aux décisions de son antenne",
          "Rendre compte de ses responsabilités avec rigueur",
        ],
      },
    },
  ],
  performer: [
    {
      id: "f6",
      name: "Marketing Digital",
      poster: "/former 2.jpg",
      trainer: "Grace Owusu",
      startDate: "2026-09-15",
      duration: "5 semaines",
      progress: 10,
      objectives: {
        global: [
          "Construire une présence digitale professionnelle",
          "Générer des leads qualifiés via les réseaux sociaux",
        ],
        chapters: [
          {
            title: "Chapitre 1 — Stratégie de contenu",
            objectives: [
              "Définir une ligne éditoriale claire",
              "Planifier un calendrier de publication",
            ],
            videos: [],
          },
          {
            title: "Chapitre 2 — Réseaux sociaux",
            objectives: [
              "Optimiser un profil professionnel",
              "Utiliser les formats les plus engageants",
            ],
            videos: [],
          },
          {
            title: "Chapitre 3 — Mesure et optimisation",
            objectives: [
              "Suivre les indicateurs clés de performance",
              "Ajuster sa stratégie selon les résultats",
            ],
            videos: [],
          },
        ],
        outcomes: [
          "Publier un contenu qui génère de l'engagement",
          "Générer des leads qualifiés en ligne",
          "Analyser ses performances digitales",
        ],
      },
    },
  ],
  performerPro: [
    {
      id: "f7",
      name: "Gestion financière avancée",
      poster: "/former.jpg",
      trainer: "Awa Traoré",
      startDate: "2026-09-20",
      duration: "6 semaines",
      progress: 0,
      objectives: {
        global: [
          "Maîtriser la lecture des indicateurs financiers de son réseau",
          "Optimiser la gestion de sa cagnotte et de ses investissements",
        ],
        chapters: [
          {
            title: "Chapitre 1 — Lecture financière",
            objectives: [
              "Analyser un tableau de bord financier",
              "Interpréter les cycles de cotisation",
            ],
            videos: [],
          },
          {
            title: "Chapitre 2 — Planification",
            objectives: [
              "Établir un plan de trésorerie personnel",
              "Anticiper les échéances de tontine",
            ],
            videos: [],
          },
          {
            title: "Chapitre 3 — Investissement",
            objectives: [
              "Identifier des opportunités de réinvestissement",
              "Évaluer le risque d'un projet",
            ],
            videos: [],
          },
        ],
        outcomes: [
          "Lire et interpréter un tableau de bord financier",
          "Planifier sa trésorerie sur un cycle complet",
          "Évaluer une opportunité d'investissement",
        ],
      },
    },
  ],
  stratege: [
    {
      id: "f8",
      name: "Développement personnel & coaching",
      poster: "/former 2.jpg",
      trainer: "Awa Traoré",
      startDate: "2026-08-25",
      duration: "8 semaines",
      progress: 70,
      objectives: {
        global: [
          "Renforcer sa posture de coach auprès des membres de son réseau",
          "Développer une intelligence émotionnelle au service du collectif",
        ],
        chapters: [
          {
            title: "Chapitre 1 — Connaissance de soi",
            objectives: [
              "Identifier ses forces et axes de progrès",
              "Clarifier ses valeurs personnelles",
            ],
            videos: [],
          },
          {
            title: "Chapitre 2 — Techniques de coaching",
            objectives: [
              "Poser des questions puissantes",
              "Accompagner sans imposer",
            ],
            videos: [],
          },
          {
            title: "Chapitre 3 — Accompagnement du réseau",
            objectives: [
              "Structurer un plan de développement pour un filleul",
              "Célébrer les progrès de son équipe",
            ],
            videos: [],
          },
        ],
        outcomes: [
          "Mener une session de coaching structurée",
          "Accompagner un membre dans son plan de progression",
          "Cultiver un climat de confiance dans son équipe",
        ],
      },
    },
  ],
  elite: [
    {
      id: "f9",
      name: "Stratégie & Expansion Diaspora",
      poster: "/former.jpg",
      trainer: "Aïcha Konaté",
      startDate: "2026-09-01",
      duration: "8 semaines",
      progress: 55,
      objectives: {
        global: [
          "Élaborer une stratégie d'expansion vers de nouvelles antennes",
          "Structurer l'implantation de la DBC au sein de la diaspora",
        ],
        chapters: [
          {
            title: "Chapitre 1 — Diagnostic et opportunités",
            objectives: [
              "Cartographier les zones à fort potentiel",
              "Évaluer la faisabilité d'une nouvelle antenne",
            ],
            videos: [],
          },
          {
            title: "Chapitre 2 — Implantation",
            objectives: [
              "Structurer le lancement d'une antenne diaspora",
              "Recruter et former les premiers relais locaux",
            ],
            videos: [],
          },
          {
            title: "Chapitre 3 — Pilotage à distance",
            objectives: [
              "Mettre en place un suivi à distance efficace",
              "Coordonner plusieurs antennes internationales",
            ],
            videos: [],
          },
        ],
        outcomes: [
          "Construire un plan d'expansion structuré",
          "Lancer une nouvelle antenne diaspora",
          "Piloter plusieurs antennes à distance",
        ],
      },
    },
  ],
  // Personne n'a encore atteint ce niveau (voir le Conseil des Légendes,
  // toujours vide dans Gestion de la gouvernance) — pas de formation à
  // programmer tant qu'il n'y a personne pour la suivre.
  legende: [],
};

// Avancement d'une formation, calculé à partir des vidéos regardées dans
// ses chapitres plutôt que codé en dur, dès qu'il en existe au moins une —
// c'est la logique demandée : "en fonction des vidéos que tu regardes ça
// définit le pourcentage d'avancement". Tant qu'aucune vidéo n'a encore été
// importée dans un chapitre (tout le catalogue de démo actuel), on retombe
// sur l'ancien nombre statique "progress" pour ne pas afficher 0% à tort
// sur des formations existantes qui n'ont simplement pas encore de vidéos.
export function getTrainingProgress(training) {
  const allVideos = (training.objectives?.chapters ?? []).flatMap(
    (chapter) => chapter.videos ?? [],
  );
  if (allVideos.length === 0) return training.progress ?? 0;
  const watchedCount = allVideos.filter((video) => video.watched).length;
  return Math.round((watchedCount / allVideos.length) * 100);
}
