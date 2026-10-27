// ----------------------------------------------------------------------
// Les RÈGLES de la relance automatique d'une cotisation de tontine en retard :
// une échelle en 5 niveaux (qui intervient, et quand) et une grille de
// pénalités. Aucune dépendance : ce fichier ne fait que des calculs, pour
// qu'on puisse le brancher tel quel sur le backend.
//
// Le retard se compte en jours depuis la date d'échéance (J+1 = le lendemain).
// Les textes du règlement donnent des bornes qui se touchent (J+4 à J+7 puis
// J+7 à J+15, etc.) : on les sépare ainsi, de façon à rester d'accord avec la
// grille des pénalités (J+1 à J+7, J+8 à J+15, J+16 à J+30, au-delà de J+30) :
//   Niveau 1  J+1  à J+3   relance automatique (SMS + WhatsApp, J+1 puis J+3)
//   Niveau 2  J+4  à J+7   Community Manager Financier local
//   Niveau 3  J+8  à J+15  mentor-parrain
//   Niveau 4  J+16 à J+21  caution solidaire du Mastermind Circle
//   Niveau 5  J+22 à J+30  Fonds de Réserve DBC
//   Au-delà de J+30        défaut grave : procédure formelle et médiation
export const STAGES = [
  { level: 1, from: 1, to: 3 },
  { level: 2, from: 4, to: 7 },
  { level: 3, from: 8, to: 15 },
  { level: 4, from: 16, to: 21 },
  { level: 5, from: 22, to: 30 },
];

export const FORMAL_FROM = 31;
export const REPEAT_FROM = 3; // 3e retard et suivants

// Niveau en cours pour un retard de "daysLate" jours (0 = pas en retard). Au-delà
// de J+30, on reste au niveau 5 : c'est la procédure formelle qui s'y ajoute.
export function stageOf(daysLate) {
  if (!(daysLate > 0)) return 0;
  return STAGES.find((stage) => daysLate >= stage.from && daysLate <= stage.to)?.level ?? 5;
}

// La pénalité, en part de la cotisation mensuelle, et ses suites :
//   J+1 à J+7    20 %  rappel automatique uniquement
//   J+8 à J+15   30 %  intervention du CM et du mentor
//   J+16 à J+30  40 %  caution solidaire activée
//   au-delà      50 %  + suspension des droits, Fonds de Réserve et médiation
//   récidive     80 %  + exclusion temporaire, Comité de Gouvernance saisi
// "occurrences" : le nombre de retards du membre dans ce cycle, celui-ci compris.
export const PENALTY_BANDS = [
  { key: "short", from: 1, to: 7, rate: 0.2 },
  { key: "medium", from: 8, to: 15, rate: 0.3 },
  { key: "long", from: 16, to: 30, rate: 0.4 },
  { key: "severe", from: FORMAL_FROM, to: null, rate: 0.5 },
];
export const REPEAT_RATE = 0.8;

export function penaltyOf(daysLate, occurrences = 1) {
  if (!(daysLate > 0)) return null;
  if (occurrences >= REPEAT_FROM) {
    return { band: "repeat", rate: REPEAT_RATE, suspension: false, exclusion: true, governance: true };
  }
  const band = PENALTY_BANDS.find((entry) => daysLate >= entry.from && (entry.to === null || daysLate <= entry.to));
  return {
    band: band.key,
    rate: band.rate,
    suspension: band.key === "severe",
    exclusion: false,
    governance: false,
  };
}

// Les étapes que le retard a déjà atteintes, dans l'ordre. "auto" = envoyée par
// le système sans personne ; "task" = quelqu'un doit agir (elle reste "à faire"
// dans le suivi jusqu'à ce qu'on la marque faite).
export function stepsFor(daysLate, occurrences = 1) {
  const steps = [];
  const add = (id, level, from, kind) => daysLate >= from && steps.push({ id, level, kind });
  add("reminder1", 1, 1, "auto");
  add("reminder2", 1, 3, "auto");
  add("cm", 2, 4, "task");
  add("mentor", 3, 8, "auto");
  add("caution", 4, 16, "auto");
  add("reserve", 5, 22, "task");
  add("formal", 5, FORMAL_FROM, "task");
  if (daysLate > 0 && occurrences >= REPEAT_FROM) steps.push({ id: "governance", level: 5, kind: "task" });
  return steps;
}

// Les deux rappels automatiques du niveau 1 ne servent plus une fois le niveau 2
// engagé : le 1er a sa place de J+1 à J+3, le 2e de J+3 à J+7. Un rappel qui
// n'est plus de saison n'est pas envoyé après coup.
export function isStillTimely(stepId, daysLate) {
  if (stepId === "reminder1") return daysLate <= 3;
  if (stepId === "reminder2") return daysLate <= 7;
  return true;
}

// Ce que chacun des autres membres du groupe ajoute pour couvrir la cotisation
// d'un membre défaillant (niveau 4) : un 35e de la cotisation dans un groupe de
// 36, arrondi à l'unité supérieure.
export const sharePerMember = (cotisation, groupSize) =>
  Math.ceil(cotisation / Math.max(1, groupSize - 1));
