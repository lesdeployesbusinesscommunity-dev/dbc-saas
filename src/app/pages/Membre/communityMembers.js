// Local Imports
import { getMemberStore, subscribeMemberStore } from "./memberStore";
import { coinsRanks, toCommunityMember } from "./accountData";

// ----------------------------------------------------------------------
// Annuaire des membres de la communauté, partagé par toutes les pages de
// l'espace membre qui parlent des MÊMES personnes : "Classement DBC Coins"
// (Coins/CoinsLeaderboard.jsx) et "Mon Réseau" (Reseau/). Une seule source
// pour leur niveau, leurs Coins et leur statut, pour qu'un chiffre ne diffère
// jamais d'une page à l'autre. Il vient du classement renvoyé par
// GET /espace-membre (voir memberStore.js) et contient aussi le membre
// connecté ("isMe").
//
// Le tableau reste LE MÊME objet (son contenu est remplacé quand les données
// changent), pour que les modules qui l'importent lisent toujours la liste à
// jour.
export const communityMembers = [];

function sync() {
  const { space } = getMemberStore();
  const ranks = coinsRanks(space);
  const next = (space?.coins.leaderboard ?? []).map((card) => ({
    ...toCommunityMember(card, ranks[card.id]),
    coinsThisMonth: card.coinsThisMonth,
    isMe: card.isMe,
  }));
  communityMembers.splice(0, communityMembers.length, ...next);
}

sync();
subscribeMemberStore(sync);

// Couleur brute par niveau DBC, en plus des classes Tailwind déjà établies
// (Simulateur/data.js : textClass/borderClass/bgTintClass) : un avatar ou
// une barre dont la largeur est calculée a besoin d'un hex direct en style
// inline, pas d'une classe Tailwind littérale — même raison que
// "CATEGORY_COLORS" dans Dashboard/MonthlyActivityChart.jsx. Valeurs
// recopiées à l'identique de Simulateur/data.js : à garder synchronisées
// si ces couleurs changent là-bas.
export const LEVEL_HEX = {
  starter: "#52A2DF",
  batisseur: "#EE7115",
  batisseurPro: "#7C3AED",
  performer: "#CA8A04",
  performerPro: "#16A34A",
  stratege: "#E11D48",
  elite: "#4F46E5",
  legende: "#B45309",
};

export function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
