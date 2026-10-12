// Local Imports
import { getAccountOverrides } from "../accountData";

// ----------------------------------------------------------------------
// Données de démonstration pour "Mon MLM" (partenariat Longrich) — à
// remplacer par de vrais appels API une fois l'intégration backend faite,
// sans changer la forme de ce que ces fonctions renvoient.
//
// Système séparé des niveaux DBC/tontine (voir Simulateur/data.js et
// currentMember.js : "levelKeys") : un membre possède un pack Longrich
// (celui-ci donne accès à des paliers de commission), et ce pack est
// rattaché à un niveau DBC pour l'éligibilité ("eligibleLevelKey"
// ci-dessous) — pas forcément un niveau auquel le membre cotise déjà pour
// sa tontine. Donnée d'exemple fournie telle quelle (Pack Elite, éligible
// "elite") : currentMember.levelKeys ne contient actuellement que
// "starter" et "batisseur", pas "elite" — à confirmer/ajuster une fois le
// vrai lien entre pack Longrich et niveau DBC précisé.
export function getMlmStats() {
  const own = getAccountOverrides();
  if (own) return { ...own.mlm.stats };
  return {
    directReferrals: 3,
    networkLevels: 3,
    totalNetwork: 12,
    personalVolume: 240,
    monthlyCommissions: 180000,
  };
}

export function getMyPack() {
  const own = getAccountOverrides();
  if (own) return { ...own.mlm.pack };
  return {
    name: "Pack Elite",
    price: 800000,
    pv: 720,
    eligibleLevelKey: "elite",
  };
}

// Les 6 packs Longrich, du plus accessible au plus prestigieux. Chaque
// pack est rattaché à un niveau DBC ("levelKey", voir Simulateur/data.js :
// "levels") pour réutiliser sa couleur/icône déjà établie dans toute
// l'app, même si le prix affiché ici n'est pas celui de la cotisation
// tontine de ce niveau (deux systèmes séparés, voir le commentaire en
// tête de ce fichier). "gainType" distingue le premier palier, qui ne
// donne droit qu'aux gains de parrainage direct, des cinq suivants, qui
// débloquent aussi les gains de performance sur le réseau.
export function getLongrichPacks() {
  return [
    { levelKey: "batisseurPro", price: 24000, pv: 4, gainType: "referral" },
    { levelKey: "performer", price: 90000, pv: 60, gainType: "performance" },
    { levelKey: "performerPro", price: 150000, pv: 120, gainType: "performance" },
    { levelKey: "stratege", price: 330000, pv: 240, gainType: "performance" },
    { levelKey: "elite", price: 800000, pv: 720, gainType: "performance" },
    { levelKey: "legende", price: 1800000, pv: 1680, gainType: "performance" },
  ];
}

// "Mon réseau" : les filleuls du membre, parrainés directement ("direct",
// niveau 1) ou via un de ses filleuls ("indirect", niveau 2 ou plus) —
// voir getMlmStats() ci-dessus : "directReferrals" (3) correspond
// exactement au nombre de "direct" ci-dessous, "totalNetwork" (12) est
// plus large que les 5 entrées listées ici, qui ne sont qu'un échantillon
// de démonstration (le reste viendra paginé une fois le backend branché).
// "levelPosition" est le rang (1 à 8) du niveau DBC de CE filleul dans ce
// système Longrich — pas forcément le même niveau que celui auquel il
// cotise pour sa tontine — et sert uniquement à reprendre la couleur/
// icône déjà établie pour ce rang (voir Simulateur/data.js : "levels",
// rang = position dans le tableau + 1). On ne connaît pas, à ce stade, le
// lien précis "qui a parrainé qui" parmi les filleuls indirects : cette
// donnée de démo les regroupe par profondeur (direct/indirect) sans
// inventer cette filiation.
export function getNetworkMembers() {
  const own = getAccountOverrides();
  if (own) return own.mlm.network.map((member) => ({ ...member }));
  return [
    { id: "net-1", name: "Marie Atangana", type: "direct", levelPosition: 5, commission: 15000 },
    { id: "net-2", name: "Jean Nkodo", type: "direct", levelPosition: 4, commission: 10000 },
    { id: "net-3", name: "Patrick Essono", type: "direct", levelPosition: 3, commission: 5000 },
    { id: "net-4", name: "Diane Fouda", type: "indirect", levelPosition: 2, commission: 2000 },
    { id: "net-5", name: "Armand Beti", type: "indirect", levelPosition: 3, commission: 5000 },
  ];
}
