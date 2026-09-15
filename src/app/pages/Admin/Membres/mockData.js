// Local Imports
import { levels } from "app/pages/Simulateur/data";

// ----------------------------------------------------------------------
// Données de démonstration pour "Gestion des membres". Comme pour le
// dashboard, l'intégration API de cette section est mise de côté pour
// l'instant : tout est géré en local (ajout/mise à jour/désactivation ne
// survivent pas à un rechargement de page) en attendant les vrais
// endpoints.

// "Niveau 1", "Niveau 2"... dans l'ordre de "levels". Le nom complet d'un
// niveau (ex: "DBC Starter") n'est plus dupliqué ici : chaque composant le
// lit via t(`simulateur.levels.${key}.name`) — même source de vérité (et
// mêmes traductions FR/EN) que la page Simulateur.
export const levelNumbers = Object.fromEntries(
  levels.map((level, index) => [level.key, index + 1]),
);

// "label"/"description" sont désormais des clés de traduction (pas du
// texte brut) — chaque composant qui les affiche appelle t(labelKey) via
// react-i18next, pour rester FR/EN comme le reste du site.
export const statusOptions = [
  { value: "attente", labelKey: "admin.membres.status.pending" },
  { value: "actif", labelKey: "admin.membres.status.active" },
  { value: "desactive", labelKey: "admin.membres.status.disabled" },
];

export const filterOptions = [
  { value: "aucun", labelKey: "admin.membres.filters.none" },
  { value: "date", labelKey: "admin.membres.filters.date" },
  { value: "recent", labelKey: "admin.membres.filters.recent" },
  { value: "ville", labelKey: "admin.membres.filters.city" },
  { value: "pays", labelKey: "admin.membres.filters.country" },
];

// Awards affichés sur la fiche "Voir" d'un membre (member.awards contient
// les clés qu'il détient). "cotisation" = toujours à jour sur ses
// cotisations tontine, "parrainage" = a invité le plus de nouveaux
// membres ce mois-ci, "formation" = participe le plus aux formations.
export const awardDefinitions = {
  cotisation: {
    labelKey: "admin.membres.awards.cotisation.label",
    descriptionKey: "admin.membres.awards.cotisation.description",
  },
  parrainage: {
    labelKey: "admin.membres.awards.parrainage.label",
    descriptionKey: "admin.membres.awards.parrainage.description",
  },
  formation: {
    labelKey: "admin.membres.awards.formation.label",
    descriptionKey: "admin.membres.awards.formation.description",
  },
};

// Bottin de membres par niveau — placeholder en attendant le backend.
// "matricule" suit le format "DBC-<niveau>-<n°>" pour rester lisible.
export const initialMembersByLevel = {
  starter: [
    {
      id: "m1",
      matricule: "DBC-1-0001",
      name: "Hubert Wakap",
      role: "Membre",
      domain: "Fondateur & CEO · Coach Consultant · Conférencier",
      coins: 840,
      status: "actif",
      city: "Douala",
      country: "Cameroun",
      sponsorName: null,
      sponsorMatricule: null,
      nextTontineDate: "2026-09-05",
      contributed: 3200000,
      trainingsCompleted: ["Fondamentaux DBC", "Leadership", "Techniques de vente"],
      trainingInProgress: null,
      sponsoredMembers: [
        { name: "Grace Owusu", matricule: "DBC-1-0002", city: "Accra" },
        { name: "Samuel Okafor", matricule: "DBC-2-0001", city: "Lagos" },
      ],
      referralEarnings: 450000,
      awards: ["cotisation", "parrainage", "formation"],
      joinedAt: "2026-06-12",
    },
    {
      id: "m2",
      matricule: "DBC-1-0002",
      name: "Grace Owusu",
      role: "Membre",
      domain: "Consultante Marketing",
      coins: 120,
      status: "attente",
      city: "Accra",
      country: "Ghana",
      sponsorName: "Hubert Wakap",
      sponsorMatricule: "DBC-1-0001",
      nextTontineDate: "2026-09-12",
      contributed: 60000,
      trainingsCompleted: ["Fondamentaux DBC"],
      trainingInProgress: "Techniques de vente",
      sponsoredMembers: [],
      referralEarnings: 0,
      awards: [],
      joinedAt: "2026-08-30",
    },
    {
      id: "m5",
      matricule: "DBC-1-0003",
      name: "Nadège Mbarga",
      role: "Membre",
      domain: "Coach bien-être",
      coins: 300,
      status: "actif",
      city: "Yaoundé",
      country: "Cameroun",
      sponsorName: "Grace Owusu",
      sponsorMatricule: "DBC-1-0002",
      nextTontineDate: "2026-09-18",
      contributed: 150000,
      trainingsCompleted: ["Fondamentaux DBC"],
      trainingInProgress: "Leadership",
      sponsoredMembers: [],
      referralEarnings: 0,
      awards: [],
      joinedAt: "2026-07-05",
    },
  ],
  batisseur: [
    {
      id: "m3",
      matricule: "DBC-2-0001",
      name: "Samuel Okafor",
      role: "Ambassadeur",
      domain: "Formateur en leadership",
      coins: 2150,
      status: "actif",
      city: "Lagos",
      country: "Nigéria",
      sponsorName: "Hubert Wakap",
      sponsorMatricule: "DBC-1-0001",
      nextTontineDate: "2026-09-20",
      contributed: 980000,
      trainingsCompleted: ["Fondamentaux DBC", "Leadership"],
      trainingInProgress: "Gouvernance associative",
      sponsoredMembers: [{ name: "Aïcha Konaté", matricule: "DBC-7-0001", city: "Bamako" }],
      referralEarnings: 120000,
      awards: ["formation"],
      joinedAt: "2026-04-02",
    },
    {
      id: "m6",
      matricule: "DBC-2-0002",
      name: "Kwame Asante",
      role: "Membre",
      domain: "Agent immobilier",
      coins: 780,
      status: "attente",
      city: "Kumasi",
      country: "Ghana",
      sponsorName: "Samuel Okafor",
      sponsorMatricule: "DBC-2-0001",
      nextTontineDate: "2026-09-25",
      contributed: 95000,
      trainingsCompleted: [],
      trainingInProgress: "Fondamentaux DBC",
      sponsoredMembers: [],
      referralEarnings: 0,
      awards: [],
      joinedAt: "2026-08-14",
    },
  ],
  batisseurPro: [
    {
      id: "m7",
      matricule: "DBC-3-0001",
      name: "Fatou Ndiaye",
      role: "Ambassadrice",
      domain: "Consultante RH",
      coins: 1450,
      status: "actif",
      city: "Dakar",
      country: "Sénégal",
      sponsorName: null,
      sponsorMatricule: null,
      nextTontineDate: "2026-09-08",
      contributed: 620000,
      trainingsCompleted: ["Fondamentaux DBC", "Leadership"],
      trainingInProgress: null,
      sponsoredMembers: [],
      referralEarnings: 0,
      awards: [],
      joinedAt: "2026-03-22",
    },
  ],
  performer: [
    {
      id: "m8",
      matricule: "DBC-4-0001",
      name: "Chidi Eze",
      role: "Ambassadeur",
      domain: "Formateur en vente",
      coins: 3200,
      status: "actif",
      city: "Abuja",
      country: "Nigéria",
      sponsorName: "Fatou Ndiaye",
      sponsorMatricule: "DBC-3-0001",
      nextTontineDate: "2026-09-30",
      contributed: 1250000,
      trainingsCompleted: ["Fondamentaux DBC", "Leadership", "Techniques de vente"],
      trainingInProgress: "Gouvernance associative",
      sponsoredMembers: [],
      referralEarnings: 60000,
      awards: ["formation"],
      joinedAt: "2026-02-10",
    },
  ],
  performerPro: [],
  stratege: [
    {
      id: "m9",
      matricule: "DBC-6-0001",
      name: "Awa Traoré",
      role: "Ambassadrice",
      domain: "Coach en développement personnel",
      coins: 5400,
      status: "actif",
      city: "Bamako",
      country: "Mali",
      sponsorName: null,
      sponsorMatricule: null,
      nextTontineDate: "2026-09-14",
      contributed: 2100000,
      trainingsCompleted: ["Fondamentaux DBC", "Leadership", "Gouvernance associative"],
      trainingInProgress: null,
      sponsoredMembers: [],
      referralEarnings: 0,
      awards: ["cotisation"],
      joinedAt: "2026-01-30",
    },
  ],
  elite: [
    {
      id: "m4",
      matricule: "DBC-7-0001",
      name: "Aïcha Konaté",
      role: "Ambassadrice",
      domain: "Formatrice · Coach en gouvernance",
      coins: 9600,
      status: "actif",
      city: "Bamako",
      country: "Mali",
      sponsorName: "Samuel Okafor",
      sponsorMatricule: "DBC-2-0001",
      nextTontineDate: "2026-10-01",
      contributed: 4100000,
      trainingsCompleted: [
        "Fondamentaux DBC",
        "Leadership",
        "Gouvernance associative",
        "Techniques de vente",
      ],
      trainingInProgress: null,
      sponsoredMembers: [],
      referralEarnings: 0,
      awards: ["cotisation"],
      joinedAt: "2026-01-18",
    },
  ],
  legende: [],
};
