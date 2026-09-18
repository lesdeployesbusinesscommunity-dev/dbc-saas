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
// carte (voir TrainingCard.jsx). "objectives" alimente la fiche détaillée
// ouverte au clic sur une carte (voir TrainingDetailsModal.jsx) :
// "global" = objectifs généraux de la formation, "chapters" = un
// objectif par chapitre, "outcomes" = ce que le membre saura faire à
// l'issue de la formation.
//
// "initial" (plutôt que "trainingsByLevel" directement) car Formation/
// index.jsx en garde maintenant sa propre copie en état local, pour que
// "Ajouter une formation" (voir AddTrainingModal.jsx) puisse l'enrichir
// sans toucher ce fichier — comme pour initialMembersByLevel ailleurs
// dans l'admin.
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
          },
          {
            title: "Chapitre 2 — Le système de niveaux",
            objectives: [
              "Distinguer les 8 niveaux et leurs cagnottes",
              "Comprendre la logique de progression",
            ],
          },
          {
            title: "Chapitre 3 — Cotisations et tontine",
            objectives: [
              "Suivre le cycle des 12 tours",
              "Utiliser le tableau de bord membre",
            ],
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
          },
          {
            title: "Chapitre 2 — Argumentaire",
            objectives: [
              "Présenter la valeur de la DBC en 2 minutes",
              "Répondre aux objections courantes",
            ],
          },
          {
            title: "Chapitre 3 — Closing",
            objectives: [
              "Accompagner l'inscription jusqu'au bout",
              "Assurer le suivi post-inscription",
            ],
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
          },
          {
            title: "Chapitre 2 — Communiquer et motiver",
            objectives: [
              "Donner un feedback constructif",
              "Animer une réunion d'équipe",
            ],
          },
          {
            title: "Chapitre 3 — Déléguer et faire grandir",
            objectives: [
              "Répartir les responsabilités selon les forces de chacun",
              "Accompagner la montée en niveau de ses filleuls",
            ],
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
          },
          {
            title: "Chapitre 2 — Gestion des objections complexes",
            objectives: [
              "Désamorcer le scepticisme",
              "Rassurer sur la sécurité financière",
            ],
          },
          {
            title: "Chapitre 3 — Fidélisation",
            objectives: [
              "Maintenir le lien après l'inscription",
              "Encourager la progression de niveau",
            ],
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
          },
          {
            title: "Chapitre 2 — Prise de décision",
            objectives: [
              "Participer à une décision collégiale",
              "Respecter les principes de transparence",
            ],
          },
          {
            title: "Chapitre 3 — Redevabilité",
            objectives: [
              "Rendre compte de ses responsabilités",
              "Assurer un suivi rigoureux des engagements",
            ],
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
          },
          {
            title: "Chapitre 2 — Réseaux sociaux",
            objectives: [
              "Optimiser un profil professionnel",
              "Utiliser les formats les plus engageants",
            ],
          },
          {
            title: "Chapitre 3 — Mesure et optimisation",
            objectives: [
              "Suivre les indicateurs clés de performance",
              "Ajuster sa stratégie selon les résultats",
            ],
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
          },
          {
            title: "Chapitre 2 — Planification",
            objectives: [
              "Établir un plan de trésorerie personnel",
              "Anticiper les échéances de tontine",
            ],
          },
          {
            title: "Chapitre 3 — Investissement",
            objectives: [
              "Identifier des opportunités de réinvestissement",
              "Évaluer le risque d'un projet",
            ],
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
          },
          {
            title: "Chapitre 2 — Techniques de coaching",
            objectives: [
              "Poser des questions puissantes",
              "Accompagner sans imposer",
            ],
          },
          {
            title: "Chapitre 3 — Accompagnement du réseau",
            objectives: [
              "Structurer un plan de développement pour un filleul",
              "Célébrer les progrès de son équipe",
            ],
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
          },
          {
            title: "Chapitre 2 — Implantation",
            objectives: [
              "Structurer le lancement d'une antenne diaspora",
              "Recruter et former les premiers relais locaux",
            ],
          },
          {
            title: "Chapitre 3 — Pilotage à distance",
            objectives: [
              "Mettre en place un suivi à distance efficace",
              "Coordonner plusieurs antennes internationales",
            ],
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
