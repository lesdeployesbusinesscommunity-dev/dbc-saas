// Import Dependencies
import { currentMember } from "../currentMember";
import { levels } from "app/pages/Simulateur/data";
import { communityMembers } from "../communityMembers";
import { getCourseById, getFormationRewardRange } from "../Formation/mockData";
import { getRewards, getFormationCoinsEarned } from "../Formation/progressStore";

// ----------------------------------------------------------------------
// Données de démonstration pour "DBC Coins" — à remplacer par de vrais
// appels API une fois l'intégration backend faite, sans changer la forme
// de ce que ces fonctions renvoient.
//
// "balance" vient de "currentMember.coins" (déjà affiché sur la carte de
// profil du Dashboard, voir Dashboard/ProfileSummaryCard.jsx) plutôt que
// d'un chiffre propre à cette page : une seule source pour le solde de
// Coins. "communityRank" n'est plus un nombre écrit en dur : c'est la
// vraie place du membre dans le classement ci-dessous (voir
// "getCommunityRanks"), pour que la bannière et le classement ne puissent
// plus se contredire.
//
// Le solde = le solde de départ (currentMember.coins) + les Coins gagnés
// dans l'app en terminant des formations (Formation/progressStore.js) :
// la bannière, l'historique, le classement et le Dashboard le lisent tous
// ici.
export function getMemberCoins() {
  return currentMember.coins + getFormationCoinsEarned();
}

export function getCoinsStats() {
  return {
    balance: getMemberCoins(),
    communityRank: getCommunityRanks().me,
  };
}

// "Comment gagner des Coins" : les 3 premières lignes (cotisation à jour)
// reprennent le "Coins/mois" déjà écrit dans les avantages de chaque
// niveau (voir i18n : "simulateur.levels.<key>.advantages" — Starter n'en
// a pas, Bâtisseur donne "50 Coins/mois", Bâtisseur Pro "100 Coins/mois"),
// pas des chiffres inventés ici. Les 3 lignes suivantes reprennent les
// montants déjà utilisés sur le Dashboard (voir
// Dashboard/MonthlyActivityChart.jsx : "CATEGORY_COINS" — parrainage 30,
// formations 20 à 30 selon la formation, challenge mensuel 75), pour que
// les deux pages racontent toujours la même histoire. "category" sert à
// réutiliser la même couleur/icône que ce donut (tontine/parrainage/
// formations/challenges).
export function getCoinsWays() {
  const formationRange = getFormationRewardRange();
  return [
    { id: "way-starter", category: "tontine", levelKey: "starter", amount: 0 },
    { id: "way-batisseur", category: "tontine", levelKey: "batisseur", amount: 50 },
    { id: "way-batisseurPro", category: "tontine", levelKey: "batisseurPro", amount: 100 },
    { id: "way-parrainage", category: "parrainage", amount: 30 },
    { id: "way-formations", category: "formations", amountMin: formationRange.min, amountMax: formationRange.max },
    { id: "way-challenges", category: "challenges", amount: 75 },
  ];
}

// Historique complet des Coins déjà gagnés, groupé par mois, dont la
// somme est volontairement égale à "currentMember.coins" (320) : le
// membre voit d'où vient chaque Coin de son solde actuel, pas juste un
// total qui tombe du ciel. Le mois en cours ("juillet", même mois que le
// donut du Dashboard) reprend EXACTEMENT les mêmes entrées/montants que
// "Dashboard/MonthlyActivityChart.jsx" (175 Coins) ; les mois précédents
// ("juin", 145 Coins) sont une invention de démonstration pour compléter
// les 320 — à remplacer par le vrai historique une fois le journal
// d'activité branché au backend, personne n'a de vraie donnée pour les
// mois passés à ce stade.
export function getCoinsHistory() {
  // Formations terminées dans l'app : ajoutées en tête du mois en cours,
  // la plus récente d'abord.
  const earned = Object.entries(getRewards())
    .sort(([, a], [, b]) => b.at - a.at)
    .map(([courseId, reward]) => ({
      id: `reward-${courseId}`,
      label: `Formation : ${getCourseById(courseId)?.name ?? courseId}`,
      category: "formations",
      amount: reward.coins,
    }));

  return [
    {
      month: "Juillet",
      entries: [
        ...earned,
        { id: "h1", label: "Cotisation Tontine Juillet", category: "tontine", amount: 20 },
        { id: "h2", label: "Parrainage de Patrick Essono", category: "parrainage", amount: 30 },
        { id: "h3", label: "Formation : Techniques de vente", category: "formations", amount: 30 },
        { id: "h4", label: "Formation : École des Affaires Niv.3", category: "formations", amount: 20 },
        { id: "h5", label: "Challenge mensuel", category: "challenges", amount: 75 },
      ],
    },
    {
      month: "Juin",
      entries: [
        { id: "h6", label: "Cotisation Tontine Juin", category: "tontine", amount: 20 },
        { id: "h7", label: "Challenge mensuel", category: "challenges", amount: 75 },
        { id: "h8", label: "Formation : Leadership Academy", category: "formations", amount: 50 },
      ],
    },
  ];
}

// ----------------------------------------------------------------------
// "Classement DBC Coins" : les membres de la communauté ET le membre
// connecté ("isMe"), classés par Coins. Les personnes, leur niveau et
// leurs Coins viennent de l'annuaire partagé (../communityMembers.js), le
// même que pour "Mon Réseau" : ce sont les MÊMES personnes d'une page à
// l'autre. Marie Atangana a exactement 320 Coins, comme le membre connecté
// (coïncidence des données fournies) : ils sont à égalité, donc au même
// rang (classement "à la compétition" : deux 3es, puis un 5e).
//
// Le niveau affiché pour le membre connecté est le plus HAUT de ses
// niveaux (il en a trois, voir currentMember.js : "levelKeys"). Ses Coins
// "ce mois-ci" sont le total du mois en cours de l'historique plus bas
// ("getCoinsHistory", premier mois), pas un chiffre à part.
function getHighestLevelKey(levelKeys) {
  return levelKeys.reduce((best, key) =>
    levels.findIndex((l) => l.key === key) > levels.findIndex((l) => l.key === best) ? key : best,
  );
}

function getLeaderboardPool() {
  const currentMonth = getCoinsHistory()[0];
  const me = {
    id: "me",
    name: currentMember.name,
    role: currentMember.role,
    levelKey: getHighestLevelKey(currentMember.levelKeys),
    coins: getMemberCoins(),
    coinsThisMonth: currentMonth.entries.reduce((sum, entry) => sum + entry.amount, 0),
    status: "actif",
    isMe: true,
  };
  return [...communityMembers, me];
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

// Niveaux réellement présents dans le classement, dans l'ordre de
// Simulateur/data.js : alimente le filtre par niveau (jamais de choix qui
// mène à une liste vide).
export function getLeaderboardLevelKeys() {
  const present = new Set(getLeaderboardPool().map((entry) => entry.levelKey));
  return levels.filter((level) => present.has(level.key)).map((level) => level.key);
}

// Rang GLOBAL (Coins depuis le début, tous niveaux) de chacun, par id —
// utilisé par la bannière, par les fiches CV et par "Mon Réseau".
export function getCommunityRanks() {
  return Object.fromEntries(rankBy(getLeaderboardPool(), "coins").map((e) => [e.id, e.rank]));
}

// Prochain objectif du membre : la personne juste au-dessus de lui (celle
// qui a le moins de Coins parmi ceux qui en ont plus que lui). "null" s'il
// est déjà en tête. "challengeCount" donne un ordre de grandeur concret à
// partir du "Challenge mensuel" du tableau "Comment gagner des Coins".
export function getNextRankTarget() {
  const ranked = rankBy(getLeaderboardPool(), "coins");
  const me = ranked.find((entry) => entry.isMe);
  const above = ranked.filter((entry) => entry.coins > me.coins);
  const target = above.length ? above.reduce((a, b) => (b.coins < a.coins ? b : a)) : null;
  const challengeAmount = getCoinsWays().find((way) => way.category === "challenges").amount;

  return {
    rank: me.rank,
    total: ranked.length,
    myCoins: me.coins,
    target,
    missing: target ? target.coins - me.coins : 0,
    percent: target ? Math.round((me.coins / target.coins) * 100) : 100,
    challengeAmount,
    challengeCount: target ? Math.ceil((target.coins - me.coins) / challengeAmount) : 0,
  };
}

// "Utiliser mes Coins" : récompenses de DÉMONSTRATION (aucune liste
// fournie) avec un coût en Coins — à remplacer par le vrai catalogue.
// Les textes sont dans i18n ("membre.coins.rewards.items.<id>"). Les coûts
// sont choisis pour qu'avec 320 Coins certaines soient accessibles et une
// ne le soit pas encore (l'état "il te manque X Coins").
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
// calculé à partir de l'historique ci-dessus (jamais un chiffre à part),
// donc le graphique grandit tout seul quand l'historique reçoit un mois.
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
