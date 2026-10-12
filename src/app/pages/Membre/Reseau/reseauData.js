// Import Dependencies
import { levels } from "app/pages/Simulateur/data";
import { currentMember } from "../currentMember";
import { getMlmStats, getNetworkMembers } from "../Mlm/mlmData";
import { getAccountOverrides } from "../accountData";

// ----------------------------------------------------------------------
// Données de "Mon Réseau", tirées de l'arbre de parrainage réel (voir
// memberStore.js), sans changer la forme que les composants attendent. Les
// personnes sont décrites comme dans le classement des Coins
// (../communityMembers.js) : mêmes noms, mêmes niveaux, mêmes Coins.

// Les parrains au-dessus du membre, du plus haut vers le plus proche.
export function getSponsorChain() {
  return getAccountOverrides().network.sponsorChain;
}

// Les filleuls en arbre : chaque nœud a ses propres "children".
export function getReferralTree() {
  return getAccountOverrides().network.referralTree;
}

function countNodes(nodes) {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

export function getNetworkSummary() {
  const stats = getMlmStats();
  return {
    sponsor: getAccountOverrides().network.sponsor,
    directReferrals: stats.directReferrals,
    totalNetwork: stats.totalNetwork,
    shown: countNodes(getReferralTree()),
  };
}

// Tout le réseau à plat (parrains d'abord, puis filleuls en parcourant
// l'arbre de haut en bas) pour la vue "Liste" : mêmes nœuds que l'arbre,
// avec le nom du parrain direct pour les filleuls indirects.
export function getNetworkList() {
  const flatten = (nodes) => nodes.flatMap((node) => [node, ...flatten(node.children)]);
  return [...getSponsorChain(), ...flatten(getReferralTree())];
}

// "Activité du réseau" : ce qui demande une action du membre — les filleuls
// en retard sur leur cotisation de tontine ("days" = jours depuis l'échéance
// non payée la plus ancienne). "upToDate" = les filleuls de l'arbre moins
// ceux qui ont une alerte.
export function getNetworkActivity() {
  const { alerts, total } = getAccountOverrides().network;
  return { alerts, total, upToDate: total - alerts.length };
}

// "Gains de mon réseau" : deux systèmes SÉPARÉS, comme partout ailleurs
// dans l'espace membre — les gains de parrainage (currentMember.
// referralEarnings, déjà sur le Dashboard) et les commissions Longrich du
// mois (Mon MLM). Les "top" sont les 3 filleuls qui ont le plus rapporté.
export function getNetworkEarnings() {
  const top = getNetworkMembers()
    .filter((member) => member.commission > 0)
    .sort((a, b) => b.commission - a.commission)
    .slice(0, 3)
    .map((member) => ({
      id: member.id,
      name: member.name,
      levelKey: levels[member.levelPosition - 1]?.key,
      commission: member.commission,
    }));

  return {
    referralEarnings: currentMember.referralEarnings,
    mlmCommissions: getMlmStats().monthlyCommissions,
    top,
  };
}
