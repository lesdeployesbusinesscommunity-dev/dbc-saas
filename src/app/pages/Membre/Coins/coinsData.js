// Import Dependencies
import { currentMember } from "../currentMember";
import { getAccountOverrides } from "../accountData";
import { communityMembers } from "../communityMembers";
import { getMemberStore } from "../memberStore";
import { levelKeyFromCode } from "utils/levelCodes";

// ----------------------------------------------------------------------
// Données de "DBC Coins", tirées de GET /espace-membre (voir memberStore.js) :
// solde, historique, classement de la communauté et barème des gains viennent
// du registre de Coins et du catalogue d'actions du serveur. Les fonctions
// gardent la forme que les composants de cette page attendent.
//
// Le solde est celui du serveur (il inclut déjà les Coins gagnés en
// terminant des formations) : la bannière, l'historique, le classement et le
// Dashboard le lisent tous ici.
export function getMemberCoins() {
  return currentMember.coins ?? 0;
}

export function getCoinsStats() {
  return {
    balance: getMemberCoins(),
    communityRank: getCommunityRanks().me,
  };
}

// "Comment gagner des Coins" : le barème défini côté serveur — Coins par mois
// des niveaux où le membre cotise (cotisation à jour), puis les actions du
// catalogue (parrainage, formation terminée, challenge mensuel). "category"
// sert à réutiliser la même couleur/icône que le donut du Dashboard.
export function getCoinsWays() {
  const rules = getMemberStore().space?.coins.earningRules ?? { actions: [], levels: [] };
  const coinsOf = (code) => rules.actions.find((action) => action.code === code)?.coins;

  const levelWays = (currentMember.levelKeys ?? []).map((levelKey) => ({
    id: `way-${levelKey}`,
    category: "tontine",
    levelKey,
    amount: rules.levels.find((level) => levelKeyFromCode(level.levelCode) === levelKey)?.coinsPerMonth ?? 0,
  }));
  const formation = coinsOf("formation_completee");

  return [
    ...levelWays,
    ...(coinsOf("parrainage_membre_actif_niv3plus") != null
      ? [{ id: "way-parrainage", category: "parrainage", amount: coinsOf("parrainage_membre_actif_niv3plus") }]
      : []),
    ...(formation != null ? [{ id: "way-formations", category: "formations", amountMin: formation, amountMax: formation }] : []),
    ...(coinsOf("challenge_mensuel_reussi") != null
      ? [{ id: "way-challenges", category: "challenges", amount: coinsOf("challenge_mensuel_reussi") }]
      : []),
  ];
}

// Historique complet des Coins, groupé par mois, du plus récent au plus
// ancien (la somme retombe sur le solde : chaque Coin du solde est expliqué).
export function getCoinsHistory() {
  return getAccountOverrides().coinsHistory.map((group) => ({ ...group, entries: [...group.entries] }));
}

// ----------------------------------------------------------------------
// "Classement DBC Coins" : les membres de la communauté ET le membre
// connecté ("isMe"), classés par Coins — même annuaire que "Mon Réseau"
// (../communityMembers.js). Classement "à la compétition" : deux ex aequo
// ont le même rang. Le niveau affiché est le niveau d'adhésion de chacun.
function getLeaderboardPool() {
  return communityMembers.map((member) => (member.isMe ? { ...member, id: "me", name: currentMember.name } : member));
}

function rankBy(entries, metric) {
  const sorted = [...entries].sort((a, b) => b[metric] - a[metric]);
  return sorted.map((entry) => ({
    ...entry,
    value: entry[metric],
    rank: 1 + sorted.filter((other) => other[metric] > entry[metric]).length,
  }));
}

// "period" : "all" (Coins depuis le début) ou "month" (ce mois-ci).
// "levelKey" : "all" ou un niveau. Le rang renvoyé est celui DANS la liste
// filtrée affichée.
export function getLeaderboard({ period = "all", levelKey = "all" } = {}) {
  const pool = getLeaderboardPool();
  const filtered = levelKey === "all" ? pool : pool.filter((entry) => entry.levelKey === levelKey);
  return rankBy(filtered, period === "month" ? "coinsThisMonth" : "coins");
}

// Niveaux réellement présents dans le classement (jamais de choix de filtre
// qui mène à une liste vide).
export function getLeaderboardLevelKeys() {
  const present = new Set(getLeaderboardPool().map((entry) => entry.levelKey));
  return [...present];
}

// Rang GLOBAL (Coins depuis le début, tous niveaux) de chacun, par id —
// utilisé par la bannière, par les fiches CV et par "Mon Réseau".
export function getCommunityRanks() {
  return Object.fromEntries(rankBy(getLeaderboardPool(), "coins").map((e) => [e.id, e.rank]));
}

// Prochain objectif du membre : la personne juste au-dessus de lui (celle
// qui a le moins de Coins parmi ceux qui en ont plus que lui). "null" s'il
// est déjà en tête. "challengeCount" donne un ordre de grandeur concret à
// partir du challenge mensuel du barème.
export function getNextRankTarget() {
  const ranked = rankBy(getLeaderboardPool(), "coins");
  const me = ranked.find((entry) => entry.isMe) ?? { coins: getMemberCoins(), rank: ranked.length + 1 };
  const above = ranked.filter((entry) => entry.coins > me.coins);
  const target = above.length ? above.reduce((a, b) => (b.coins < a.coins ? b : a)) : null;
  const challengeAmount = getCoinsWays().find((way) => way.category === "challenges")?.amount ?? 0;

  return {
    rank: me.rank,
    total: ranked.length,
    myCoins: me.coins,
    target,
    missing: target ? target.coins - me.coins : 0,
    percent: target ? Math.round((me.coins / target.coins) * 100) : 100,
    challengeAmount,
    challengeCount: target && challengeAmount > 0 ? Math.ceil((target.coins - me.coins) / challengeAmount) : 0,
  };
}

// "Utiliser mes Coins" : récompenses proposées en échange de Coins. Chaque
// échange part en demande à l'équipe DBC (voir CoinsRewards.jsx), qui la
// valide et débite les Coins. Les textes sont dans i18n
// ("membre.coins.rewards.items.<id>").
export function getCoinsRewards() {
  return [
    { id: "goodies", cost: 100 },
    { id: "discount", cost: 150 },
    { id: "training", cost: 200 },
    { id: "club", cost: 300 },
    { id: "coaching", cost: 500 },
  ];
}

// Coins gagnés par mois, du plus ancien au plus récent, avec le cumul —
// calculé à partir de l'historique ci-dessus.
export function getCoinsMonthly() {
  let cumulative = 0;
  return [...getCoinsHistory()]
    .reverse()
    .map((group) => {
      const total = group.entries.reduce((sum, entry) => sum + entry.amount, 0);
      cumulative += total;
      return { month: group.month, total, cumulative };
    });
}
