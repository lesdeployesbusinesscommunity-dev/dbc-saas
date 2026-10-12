// Import Dependencies
import { communityMembers } from "../communityMembers";
import { getCommunityRanks } from "../Coins/mockData";
import { levels } from "app/pages/Simulateur/data";
import { currentMember } from "../currentMember";
import { getMlmStats, getNetworkMembers } from "../Mlm/mockData";
import { getAccountOverrides } from "../accountData";

// ----------------------------------------------------------------------
// Données de démonstration pour "Mon Réseau" — à remplacer par de vrais
// appels API une fois l'intégration backend faite, sans changer la forme
// de ce que ces fonctions renvoient.
//
// Les personnes viennent de l'annuaire partagé (../communityMembers.js) :
// ce sont les MÊMES que dans "Classement DBC Coins" et "Mon MLM" (voir
// Mlm/mockData.js : "getNetworkMembers"). Marie, Jean et Patrick y sont
// déjà "filleuls directs" et Diane/Armand "filleuls indirects" — on garde
// exactement cette répartition ici.
//
// DEUX choses sont des hypothèses de démonstration, pas des données
// fournies, à corriger dès qu'on connaît la vraie filiation :
// - le PARRAIN du membre connecté (Céleste Mbida) et le parrain de
//   celui-ci (Hubert Wakap, fondateur) ;
// - QUI a parrainé les deux filleuls indirects : Diane Fouda sous Marie
//   Atangana, Armand Beti sous Jean Nkodo.
// "Armand Beti" n'est pas dans l'annuaire fourni (il apparaît seulement
// dans "Mon réseau" du MLM) : son profil ci-dessous est entièrement
// inventé.
const byId = Object.fromEntries(communityMembers.map((member) => [member.id, member]));

const armandBeti = {
  id: "armand",
  name: "Armand Beti",
  role: "Membre",
  levelKey: "batisseurPro",
  sector: "Transport & Logistique",
  coins: 90,
  status: "actif",
  city: "Douala",
  memberSinceYear: 2024,
  phone: "+237000000007", // numéro volontairement invalide, voir communityMembers.js
};

// Rang dans le classement des Coins (voir Coins/mockData.js :
// "getCommunityRanks", rang global), pour la fiche CV : seulement pour les
// personnes qui y figurent (Armand, non).
function withRank(member) {
  const rank = getCommunityRanks()[member.id];
  return rank == null ? member : { ...member, rank };
}

// Les parrains au-dessus du membre, du plus haut vers le plus proche.
export function getSponsorChain() {
  const own = getAccountOverrides();
  if (own) return own.network.sponsorChain;
  return [
    { member: withRank(byId.hubert), relation: "sponsorOfSponsor" },
    { member: withRank(byId.celeste), relation: "sponsor" },
  ];
}

// Les filleuls en arbre : chaque nœud a ses propres "children".
export function getReferralTree() {
  const own = getAccountOverrides();
  if (own) return own.network.referralTree;
  return [
    {
      member: withRank(byId.marie),
      relation: "direct",
      children: [{ member: withRank(byId.diane), relation: "indirect", parentName: byId.marie.name, children: [] }],
    },
    {
      member: withRank(byId.jean),
      relation: "direct",
      children: [{ member: armandBeti, relation: "indirect", parentName: byId.jean.name, children: [] }],
    },
    { member: withRank(byId.patrick), relation: "direct", children: [] },
  ];
}

function countNodes(nodes) {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

// "totalNetwork" vient de Mon MLM (12) : l'arbre n'en montre qu'un
// échantillon ("shown"), comme la liste de Mon MLM.
export function getNetworkSummary() {
  const stats = getMlmStats();
  const own = getAccountOverrides();
  return {
    sponsor: own ? own.network.sponsor : byId.celeste,
    directReferrals: stats.directReferrals,
    totalNetwork: stats.totalNetwork,
    shown: countNodes(getReferralTree()),
  };
}

// Tout le réseau à plat (parrains d'abord, puis filleuls en parcourant
// l'arbre de haut en bas) pour la vue "Liste" : même nœuds que l'arbre,
// avec le nom du parrain direct pour les filleuls indirects.
export function getNetworkList() {
  const flatten = (nodes) => nodes.flatMap((node) => [node, ...flatten(node.children)]);
  return [...getSponsorChain(), ...flatten(getReferralTree())];
}

// "Activité du réseau" : ce qui demande une action du membre. DONNÉES DE
// DÉMONSTRATION inventées (aucun suivi réel des cotisations des filleuls
// pour l'instant) : Jean Nkodo n'a pas réglé sa cotisation du mois, et
// l'inscription de Diane Fouda (statut "en attente", voir
// communityMembers.js) n'est pas encore validée. "days" est un nombre de
// jours, formaté par le composant. "upToDate" = les filleuls affichés dans
// l'arbre moins ceux qui ont une alerte.
export function getNetworkActivity() {
  const own = getAccountOverrides();
  if (own) {
    const { alerts, total } = own.network;
    return { alerts, total, upToDate: total - alerts.length };
  }
  const alerts = [
    { id: "alert-jean", member: byId.jean, kind: "latePayment", days: 5 },
    { id: "alert-diane", member: byId.diane, kind: "pending", days: 12 },
  ];
  const total = countNodes(getReferralTree());
  return { alerts, total, upToDate: total - alerts.length };
}

// "Gains de mon réseau" : deux systèmes SÉPARÉS, comme partout ailleurs
// dans l'espace membre — les gains de parrainage DBC (currentMember.
// referralEarnings, déjà sur le Dashboard) et les commissions Longrich du
// mois (Mon MLM, voir Mlm/mockData.js : "getMlmStats"). Les "top"
// reprennent les commissions Longrich par filleul de "Mon réseau" du MLM
// (mêmes noms, mêmes montants, mêmes niveaux) : ce ne sont que les 3
// premiers de l'échantillon affiché, pas le détail des 12 membres.
export function getNetworkEarnings() {
  const top = getNetworkMembers()
    .filter((member) => member.commission > 0)
    .sort((a, b) => b.commission - a.commission)
    .slice(0, 3)
    .map((member) => ({
      id: member.id,
      name: member.name,
      levelKey: levels[member.levelPosition - 1].key,
      commission: member.commission,
    }));

  return {
    referralEarnings: currentMember.referralEarnings,
    mlmCommissions: getMlmStats().monthlyCommissions,
    top,
  };
}
