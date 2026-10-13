// Local Imports
import { financesParNiveau } from "api/espaceAdmin";
import { levelKeyFromCode } from "utils/levelCodes";

// ----------------------------------------------------------------------
// Chiffres de "Gestion financière", niveau par niveau, calculés par le
// serveur à partir de la tontine (GET /espace-admin/finances). Indexés par
// la même "key" que dans Simulateur/data.js (mêmes 8 niveaux).
//
// "currentTour"/"totalTours" : mois atteint par la plus ancienne vague en
// cours du niveau, sur un cycle de 12 mois (0 si aucune vague en cours).

const EMPTY_FINANCE = {
  currentPot: 0,
  totalCollected: 0,
  toursCompleted: 0,
  contributionsReceived: 0,
  contributionsExpected: 0,
  currentTour: 0,
  totalTours: 12,
  memberCount: 0,
};

export async function loadFinanceByLevel() {
  const entries = await financesParNiveau();
  return Object.fromEntries(entries.map(({ levelCode, ...finance }) => [levelKeyFromCode(levelCode), finance]));
}

export function getFinanceForLevel(financeByLevel, levelKey) {
  return financeByLevel[levelKey] ?? EMPTY_FINANCE;
}
