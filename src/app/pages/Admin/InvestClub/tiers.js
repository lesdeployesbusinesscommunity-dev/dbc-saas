// Local Imports
import { levels } from "app/pages/Simulateur/data";

// ----------------------------------------------------------------------
// Les 4 niveaux du DBC Invest Club. Ils s'ouvrent au fil des niveaux DBC,
// comme l'indiquent les avantages de chaque niveau (voir la page Simulateur) :
//   Invest Club Niv.1 -> DBC Bâtisseur
//   Invest Club Niv.2 -> DBC Performer
//   Invest Club Niv.3 -> DBC Stratège
//   Invest Club Niv.4 -> DBC Légende
// Chaque niveau DBC "inclut" les précédents : un Bâtisseur Pro garde donc
// l'Invest Club Niv.1, un Performer Pro garde le Niv.2, etc.
export const investTiers = [
  { tier: 1, levelKey: "batisseur", color: "#52A2DF" },
  { tier: 2, levelKey: "performer", color: "#16A34A" },
  { tier: 3, levelKey: "stratege", color: "#7C3AED" },
  { tier: 4, levelKey: "legende", color: "#EE7115" },
];

const levelIndex = (levelKey) => levels.findIndex((level) => level.key === levelKey);

// Niveau d'Invest Club auquel un membre a droit selon son niveau DBC
// (0 = pas encore d'accès, c'est le cas du niveau Starter).
export function clubTierOf(levelKey) {
  const index = levelIndex(levelKey);
  return investTiers.filter((entry) => levelIndex(entry.levelKey) <= index).length;
}
