// ----------------------------------------------------------------------
// Données de démonstration pour "Gestion financière". Comme pour les
// autres sections admin, tout est géré en local en attendant les vrais
// endpoints — voir Finance/index.jsx.
//
// Chaque entrée est indexée par la même "key" que dans Simulateur/data.js
// (même 8 niveaux, même ordre), pour rester cohérent avec le reste du
// site (Gestion des membres, Simulateur de revenus, tableau comparatif).
//
// "currentTour"/"totalTours" (l'avancement du cycle, ex: "Tour 7/12")
// est commun à tous les niveaux : c'est le cycle mensuel global de la
// DBC, pas quelque chose de propre à un niveau. Tout le reste (cagnotte,
// total collecté, cotisations du mois, nombre de membres) varie selon le
// niveau sélectionné.
//
// "legende" reste à zéro — cohérent avec le Conseil des Légendes, encore
// vide dans Gestion de la gouvernance (personne n'a encore atteint ce
// niveau).
const CURRENT_TOUR = 7;
const TOTAL_TOURS = 12;

export const financeByLevel = {
  starter: {
    currentPot: 1555000,
    totalCollected: 12250000,
    toursCompleted: 8,
    contributionsReceived: 5,
    contributionsExpected: 6,
    currentTour: CURRENT_TOUR,
    totalTours: TOTAL_TOURS,
    memberCount: 32,
  },
  batisseur: {
    currentPot: 2040000,
    totalCollected: 14280000,
    toursCompleted: 7,
    contributionsReceived: 4,
    contributionsExpected: 5,
    currentTour: CURRENT_TOUR,
    totalTours: TOTAL_TOURS,
    memberCount: 21,
  },
  batisseurPro: {
    currentPot: 4080000,
    totalCollected: 24480000,
    toursCompleted: 6,
    contributionsReceived: 3,
    contributionsExpected: 4,
    currentTour: CURRENT_TOUR,
    totalTours: TOTAL_TOURS,
    memberCount: 14,
  },
  performer: {
    currentPot: 8740000,
    totalCollected: 43700000,
    toursCompleted: 5,
    contributionsReceived: 2,
    contributionsExpected: 3,
    currentTour: CURRENT_TOUR,
    totalTours: TOTAL_TOURS,
    memberCount: 9,
  },
  performerPro: {
    currentPot: 9620000,
    totalCollected: 38480000,
    toursCompleted: 4,
    contributionsReceived: 2,
    contributionsExpected: 2,
    currentTour: CURRENT_TOUR,
    totalTours: TOTAL_TOURS,
    memberCount: 6,
  },
  stratege: {
    currentPot: 13600000,
    totalCollected: 40800000,
    toursCompleted: 3,
    contributionsReceived: 1,
    contributionsExpected: 2,
    currentTour: CURRENT_TOUR,
    totalTours: TOTAL_TOURS,
    memberCount: 4,
  },
  elite: {
    currentPot: 17500000,
    totalCollected: 35000000,
    toursCompleted: 2,
    contributionsReceived: 1,
    contributionsExpected: 1,
    currentTour: CURRENT_TOUR,
    totalTours: TOTAL_TOURS,
    memberCount: 2,
  },
  legende: {
    currentPot: 0,
    totalCollected: 0,
    toursCompleted: 0,
    contributionsReceived: 0,
    contributionsExpected: 0,
    currentTour: CURRENT_TOUR,
    totalTours: TOTAL_TOURS,
    memberCount: 0,
  },
};

export function getFinanceForLevel(levelKey) {
  return financeByLevel[levelKey] ?? financeByLevel.starter;
}
