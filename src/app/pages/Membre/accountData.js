// Import Dependencies
import { initialMembersByLevel } from "app/pages/Admin/Membres/mockData";
import { levels } from "app/pages/Simulateur/data";

// Local Imports
import { getAccountKey } from "./currentMember";

// ----------------------------------------------------------------------
// Données de démonstration PROPRES à l'administrateur quand il passe en
// "mode membre". Un administrateur est d'abord un membre : il a SA page
// membre — son historique de Coins, son réseau de filleuls, ses formations —
// et non celle du membre de démonstration (Thierry Mbida). Ses données
// viennent de sa fiche dans Gestion des membres (Admin/Membres/mockData.js :
// mêmes filleuls, mêmes Coins, mêmes formations terminées), pour qu'une seule
// source dise qui il est.
//
// "getAccountOverrides()" renvoie ces données pour le compte de
// l'administrateur, et "null" pour le membre de démonstration : chaque page
// garde alors EXACTEMENT ses données d'origine (voir Coins/mockData.js,
// Mlm/mockData.js, Reseau/mockData.js...). Placeholder en attendant le
// backend : chaque compte aura alors ses propres données renvoyées par l'API.

const ADMIN_MATRICULE = "DBC-1-0001";

const records = Object.entries(initialMembersByLevel).flatMap(([levelKey, list]) =>
  list.map((member) => ({ ...member, levelKey })),
);

// Un membre de l'admin → la forme utilisée par "Mon Réseau" (voir
// communityMembers.js). Le numéro est VOLONTAIREMENT invalide (+237 000...) :
// un clic sur "Appeler" / "WhatsApp" pendant la démonstration ne joint jamais
// une vraie personne.
function toNetworkMember(record, index) {
  return {
    id: record.id,
    name: record.name,
    role: record.role,
    levelKey: record.levelKey,
    sector: record.domain,
    coins: record.coins,
    status: record.status,
    city: record.city,
    memberSinceYear: Number(String(record.joinedAt).slice(0, 4)),
    phone: `+2370000${String(100 + index)}`,
  };
}

// Ses filleuls directs (parrainés par lui) et, dessous, leurs propres
// filleuls — tels que l'admin les voit dans Gestion des membres.
function buildReferralTree() {
  const directs = records.filter((member) => member.sponsorMatricule === ADMIN_MATRICULE);
  let index = 0;
  return directs.map((direct) => ({
    member: toNetworkMember(direct, index++),
    relation: "direct",
    children: records
      .filter((member) => member.sponsorMatricule === direct.matricule)
      .map((child) => ({
        member: toNetworkMember(child, index++),
        relation: "indirect",
        parentName: direct.name,
        children: [],
      })),
  }));
}

const daysSince = (isoDate) => Math.max(1, Math.round((Date.now() - new Date(isoDate).getTime()) / 86400000));

const referralTree = buildReferralTree();
const flatNetwork = (nodes) => nodes.flatMap((node) => [node, ...flatNetwork(node.children)]);
const networkNodes = flatNetwork(referralTree);

const adminOverrides = {
  // Historique des Coins, du mois le plus récent au plus ancien. La somme est
  // complétée automatiquement jusqu'à son solde (voir Coins/mockData.js).
  coinsHistory: [
    {
      month: "Juillet",
      entries: [
        { id: "h1", label: "Cotisation Tontine Juillet", category: "tontine", amount: 20 },
        { id: "h2", label: "Parrainage de Grace Owusu", category: "parrainage", amount: 30 },
        { id: "h3", label: "Formation : Techniques de vente", category: "formations", amount: 30 },
        { id: "h5", label: "Challenge mensuel", category: "challenges", amount: 75 },
      ],
    },
    {
      month: "Juin",
      entries: [
        { id: "h6", label: "Cotisation Tontine Juin", category: "tontine", amount: 20 },
        { id: "h7", label: "Challenge mensuel", category: "challenges", amount: 75 },
        { id: "h8", label: "Formation : Fondamentaux DBC", category: "formations", amount: 20 },
        { id: "h9", label: "Parrainage de Samuel Okafor", category: "parrainage", amount: 30 },
      ],
    },
  ],

  // Dashboard : "Activités récentes", donut "ce que vous avez fait le plus ce
  // mois-ci" et badges obtenus.
  activity: {
    recent: [
      { id: "a1", kind: "cotisation", timeUnit: "days", timeCount: 3 },
      { id: "a2", kind: "parrainage", params: { name: "Grace Owusu" }, timeUnit: "weeks", timeCount: 1 },
      { id: "a3", kind: "coins", timeUnit: "weeks", timeCount: 2 },
      { id: "a4", kind: "formation", params: { name: "Techniques de vente" }, timeUnit: "weeks", timeCount: 3 },
    ],
    categoryCoins: { tontine: [20], parrainage: [30], formations: [30], challenges: [75] },
    // Noms insérés dans les phrases du détail (parrainage / formations).
    names: { parrainage: ["Grace Owusu"], formations: ["Techniques de vente"] },
    badges: ["formation", "cotisation", "parrainage"],
  },

  // Formations : l'admin a terminé les deux formations du niveau Starter (voir
  // sa fiche : "Fondamentaux DBC" et "Techniques de vente") — il n'a donc
  // aucune formation "en cours".
  trainingStartProgress: { f1: 100, f2: 100 },

  // "Mon MLM" / "Mon Réseau". Il cotise au niveau Starter seulement : pas de
  // pack Longrich, donc pas de commission MLM — ses gains sont ceux de son
  // parrainage DBC (450 000 F, voir Dashboard).
  mlm: {
    stats: {
      directReferrals: referralTree.length,
      networkLevels: 2,
      totalNetwork: networkNodes.length,
      personalVolume: 0,
      monthlyCommissions: 0,
    },
    pack: { name: "", price: 0, pv: 0, eligibleLevelKey: null },
    network: networkNodes.map(({ member, relation }, index) => ({
      id: `net-${index + 1}`,
      name: member.name,
      type: relation,
      levelPosition: levels.findIndex((level) => level.key === member.levelKey) + 1,
      commission: 0,
    })),
  },
  network: {
    // Le fondateur n'a pas de parrain.
    sponsorChain: [],
    sponsor: null,
    referralTree,
    shown: networkNodes.length,
    // Les inscriptions encore "en attente" de ses filleuls.
    alerts: networkNodes
      .filter(({ member }) => member.status === "attente")
      .map(({ member }) => ({
        id: `alert-${member.id}`,
        member,
        kind: "pending",
        days: daysSince(records.find((record) => record.id === member.id).joinedAt),
      })),
    total: networkNodes.length,
  },
};

// Les données propres au compte affiché, ou "null" pour le membre de
// démonstration (il garde les données d'origine de chaque page).
export function getAccountOverrides() {
  return getAccountKey() === "admin" ? adminOverrides : null;
}
