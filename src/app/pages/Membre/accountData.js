// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { levelKeyFromCode } from "utils/levelCodes";
import { getMemberStore } from "./memberStore";

// ----------------------------------------------------------------------
// Les données PROPRES au compte connecté — son historique de Coins, son
// activité, son réseau, son MLM — mises dans la forme que les pages de
// l'espace membre lisent depuis le début (voir Coins/mockData.js,
// Mlm/mockData.js, Reseau/mockData.js, Dashboard/RecentActivity.jsx...).
// Elles viennent de GET /espace-membre (voir memberStore.js) : chaque compte
// voit les siennes, jamais des données de démonstration.

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const STATUS_BY_ACCOUNT_STATUS = { actif: "actif", en_attente: "attente", suspendu: "desactive" };

const DAY_MS = 24 * 60 * 60 * 1000;

// "Il y a X jours / semaines" : le format attendu par Dashboard/RecentActivity.jsx.
function elapsed(date) {
  const days = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / DAY_MS));
  return days < 7 ? { timeUnit: "days", timeCount: days } : { timeUnit: "weeks", timeCount: Math.round(days / 7) };
}

const startOfMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Une personne telle que la décrivent "Mon Réseau", le classement et la fiche
// "CV" (mêmes champs que l'ancien annuaire de démonstration).
export function toCommunityMember(card, rank) {
  return {
    id: card.id,
    name: card.name,
    role: card.isAdmin ? "Administrateur" : "Membre",
    levelKey: levelKeyFromCode(card.levelCode),
    sector: card.profession ?? "",
    coins: card.coins,
    status: STATUS_BY_ACCOUNT_STATUS[card.status] ?? "actif",
    city: card.city ?? "",
    memberSinceYear: card.memberSince ? new Date(card.memberSince).getFullYear() : null,
    phone: card.phoneNumber ?? "",
    photo: card.photoUrl ?? null,
    matricule: card.membershipNumber,
    ...(rank != null ? { rank } : {}),
  };
}

// Rang GLOBAL de chacun au classement des Coins (tous niveaux, depuis le
// début), "à la compétition" : deux ex aequo ont le même rang.
export function coinsRanks(space) {
  const board = space?.coins.leaderboard ?? [];
  return Object.fromEntries(board.map((entry) => [entry.id, 1 + board.filter((other) => other.coins > entry.coins).length]));
}

function buildCoinsHistory(space) {
  const groups = [];
  space.coins.history.forEach((entry) => {
    const date = new Date(entry.at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, month: MONTHS_FR[date.getMonth()], year: date.getFullYear(), entries: [] };
      groups.push(group);
    }
    group.entries.push({ id: entry.id, label: entry.label, category: entry.category, amount: entry.amount, at: entry.at });
  });
  return groups;
}

function buildActivity(space) {
  const thisMonth = space.coins.history.filter((entry) => entry.amount > 0 && new Date(entry.at) >= startOfMonth());
  const labelsOf = (category) => thisMonth.filter((entry) => entry.category === category).map((entry) => entry.label);
  return {
    recent: space.activity.recent.map((item) => ({
      id: item.id,
      kind: item.kind,
      params: item.name ? { name: item.name } : item.kind === "cotisation" ? { month: MONTHS_FR[new Date(item.at).getMonth()] } : undefined,
      ...elapsed(item.at),
    })),
    categoryCoins: space.activity.monthlyCoinsByCategory,
    names: {
      tontine: labelsOf("tontine"),
      parrainage: space.activity.monthlyNames.parrainage,
      formations: space.activity.monthlyNames.formations,
      challenges: labelsOf("challenges"),
    },
    badges: space.activity.badges,
  };
}

function buildNetwork(space) {
  const ranks = coinsRanks(space);
  const member = (card) => toCommunityMember(card, ranks[card.id]);
  const toNode = (node) => ({
    member: member(node.member),
    relation: node.relation,
    ...(node.parentName ? { parentName: node.parentName } : {}),
    children: node.children.map(toNode),
  });
  const referralTree = space.network.tree.map(toNode);
  const sponsorChain = space.network.sponsorChain.map((entry) => ({ member: member(entry.member), relation: entry.relation }));
  const count = (nodes) => nodes.reduce((sum, node) => sum + 1 + count(node.children), 0);

  return {
    sponsorChain,
    sponsor: sponsorChain.find((entry) => entry.relation === "sponsor")?.member ?? null,
    referralTree,
    shown: count(referralTree),
    alerts: space.network.alerts.map((alert) => ({ id: alert.id, member: member(alert.member), kind: alert.kind, days: alert.days })),
    total: space.network.totalNetwork,
  };
}

function buildMlm(space) {
  const { mlm, network } = space;
  return {
    stats: {
      directReferrals: network.directReferrals,
      networkLevels: network.depth,
      totalNetwork: network.totalNetwork,
      personalVolume: mlm.personalVolume,
      monthlyCommissions: mlm.monthlyCommissions,
    },
    pack: mlm.pack
      ? {
          name: mlm.pack.name,
          price: mlm.pack.price,
          pv: mlm.pack.pv,
          eligibleLevelKey: levelKeyFromCode(mlm.pack.requiredLevelCode),
        }
      : { name: "", price: 0, pv: 0, eligibleLevelKey: null },
    network: mlm.network.map((entry) => ({
      id: entry.memberId,
      name: entry.name,
      type: entry.type,
      levelPosition: levels.findIndex((level) => level.key === levelKeyFromCode(entry.levelCode)) + 1,
      commission: entry.commission,
    })),
  };
}

const EMPTY = {
  coinsHistory: [],
  activity: { recent: [], categoryCoins: { tontine: [], parrainage: [], formations: [], challenges: [] }, names: {}, badges: [] },
  trainingStartProgress: {},
  mlm: {
    stats: { directReferrals: 0, networkLevels: 0, totalNetwork: 0, personalVolume: 0, monthlyCommissions: 0 },
    pack: { name: "", price: 0, pv: 0, eligibleLevelKey: null },
    network: [],
  },
  network: { sponsorChain: [], sponsor: null, referralTree: [], shown: 0, alerts: [], total: 0 },
};

// Recalculé seulement quand les données changent (même objet entre deux
// lectures, pour les pages qui le comparent ou le mémorisent).
let cache = { version: -1, value: EMPTY };

// Les données du compte connecté, dans la forme des pages. Avant le premier
// chargement (ne devrait pas arriver : MembreLayout attend les données),
// des listes vides plutôt que des données inventées.
export function getAccountOverrides() {
  const { space, version } = getMemberStore();
  if (!space) return EMPTY;
  if (cache.version !== version) {
    cache = {
      version,
      value: {
        coinsHistory: buildCoinsHistory(space),
        activity: buildActivity(space),
        trainingStartProgress: {},
        mlm: buildMlm(space),
        network: buildNetwork(space),
      },
    };
  }
  return cache.value;
}
