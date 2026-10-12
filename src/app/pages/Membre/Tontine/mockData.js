// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { currentMember } from "../currentMember";
import { levels } from "app/pages/Simulateur/data";
import { getContributionDay } from "app/pages/Admin/Parametres/platformSettings";

// ----------------------------------------------------------------------
// Données de démonstration pour "Ma Tontine" — à remplacer par de vrais
// appels API (groupe réel, historique des cotisations, tours déjà
// distribués...) une fois l'intégration backend faite, sans changer la
// forme de ce que ces fonctions renvoient.
//
// "getMyMemberId" (plus bas) retrouve l'entrée du membre connecté dans ce
// groupe par son nom — ce qui suppose qu'il y figure à CHAQUE niveau
// auquel il cotise (corrigé ici : il ne figurait avant que dans le
// groupe "batisseur" (tb-3), pas "starter", ce qui aurait empêché
// "Mon prochain versement" et "C'est votre tour dans X mois" de
// fonctionner sur ce niveau — remplace maintenant "ts-3").
//
// Groupe de tontine par niveau, dans l'ORDRE DE PASSAGE (qui reçoit la
// cagnotte à quel tour du cycle annuel) — même groupe que celui utilisé
// pour la cotisation du mois sur le Dashboard (voir
// Dashboard/mockData.js, qui réutilise "getTontineGroup" ci-dessous
// plutôt que de garder sa propre liste séparée). Le membre connecté
// figure dans le groupe de chaque niveau auquel il cotise (voir
// "levelKeys" dans currentMember.js).
//
// Tous les membres d'un même niveau cotisent le MÊME montant chaque
// mois — celui du niveau (voir Simulateur/data.js : "cotisation"), pas un
// montant propre à chacun. "paid" a été retiré d'ici : le statut "a payé
// ce mois-ci" vient maintenant de l'historique de cotisation ci-dessous
// (son dernier tour), pour ne garder qu'une seule source de vérité.
// La place du membre connecté ("isMe") : voir "mySlot" ci-dessous. Elle lit
// son nom et sa ville directement dans currentMember : s'il modifie son
// profil dans Paramètres, la tontine l'affiche et le retrouve sous son
// nouveau nom, sans rechargement. Chaque compte a sa propre place (repérée
// par son matricule) : l'administrateur, quand il passe en mode membre, se
// retrouve à SA place dans le groupe Starter, et le membre de démonstration
// à la sienne — l'autre apparaît alors comme n'importe quel membre.
function mySlot(id, matricule, fallbackName, fallbackCity) {
  return {
    id,
    matricule,
    get isMe() {
      return currentMember.matricule === matricule;
    },
    get name() {
      return this.isMe ? currentMember.name : fallbackName;
    },
    get city() {
      return this.isMe ? currentMember.city : fallbackCity;
    },
  };
}

const tontineMembersByLevel = {
  starter: [
    mySlot("ts-1", "DBC-1-0001", "Hubert Wakap", "Douala, Cameroun"),
    { id: "ts-2", name: "Marie Atangana", city: "Yaoundé, Cameroun" },
    mySlot("ts-3", "DBC-1-0042", "Thierry Mbida", "Douala, Cameroun"),
    { id: "ts-4", name: "Céleste Mbida", city: "Douala, Cameroun" },
    { id: "ts-5", name: "Patrick Essono", city: "Yaoundé, Cameroun" },
    { id: "ts-6", name: "Diane Fouda", city: "Garoua, Cameroun" },
  ],
  batisseur: [
    { id: "tb-1", name: "Samuel Okafor", city: "Lagos, Nigéria" },
    { id: "tb-2", name: "Kwame Asante", city: "Kumasi, Ghana" },
    mySlot("tb-3", "DBC-1-0042", "Thierry Mbida", "Douala, Cameroun"),
    { id: "tb-4", name: "Amara Chukwu", city: "Abuja, Nigéria" },
    { id: "tb-5", name: "Fatou Diallo", city: "Dakar, Sénégal" },
    { id: "tb-6", name: "Ibrahim Touré", city: "Abidjan, Côte d'Ivoire" },
  ],
};

// Historique de cotisation, tour par tour, par membre — "true" = cotisé,
// "false" = pas encore cotisé à ce tour. Quelques trous volontaires
// (Patrick Essono, Kwame Asante) pour illustrer un membre en retard dans
// le suivi (voir CotisationTracking.jsx). Donnée de démonstration : les
// vrais montants/mois viendront du backend, seule la FORME (un booléen
// par tour déjà entamé) restera la même.
const paidHistoryByLevel = {
  starter: {
    "ts-1": [true, true, true, true, true, true, true],
    "ts-2": [true, true, true, true, true, true, true],
    "ts-3": [true, true, true, true, true, true, false],
    "ts-4": [true, true, true, true, true, true, true],
    "ts-5": [true, true, true, false, true, false, false],
    "ts-6": [true, true, true, true, true, true, true],
  },
  batisseur: {
    "tb-1": [true, true, true, true, true, true, true],
    "tb-2": [true, false, true, true, false, true, false],
    "tb-3": [true, true, true, true, true, true, true],
    "tb-4": [true, true, true, true, true, true, true],
    "tb-5": [true, true, false, true, true, true, true],
    "tb-6": [true, true, true, false, true, true, true],
  },
};

// Complète (ou raccourcit) un historique jusqu'à "length" tours : au-delà
// des quelques mois de démonstration ci-dessus, on considère les tours
// suivants cotisés par défaut plutôt que de laisser l'affichage casser
// une fois le tour en cours plus avancé que les données d'exemple.
function resolvePaidHistory(pattern, length) {
  if (length <= pattern.length) return pattern.slice(0, length);
  return [...pattern, ...Array(length - pattern.length).fill(true)];
}

export function getCotisationTracking(levelKey) {
  const level = levels.find((l) => l.key === levelKey);
  const currentTour = getCurrentTour(levelKey);
  const toursElapsed = currentTour?.tour ?? 0;
  const members = tontineMembersByLevel[levelKey] ?? [];
  const patternsById = paidHistoryByLevel[levelKey] ?? {};

  return members.map((member) => {
    const history = resolvePaidHistory(patternsById[member.id] ?? [], toursElapsed);
    const paidCount = history.filter(Boolean).length;
    return {
      id: member.id,
      name: member.name,
      cotisation: level?.cotisation ?? 0,
      history,
      paidCount,
      totalTours: toursElapsed,
      isUpToDate: paidCount === toursElapsed,
    };
  });
}

export function getTontineGroup(levelKey) {
  const members = tontineMembersByLevel[levelKey] ?? [];
  const tracking = getCotisationTracking(levelKey);
  const trackingById = Object.fromEntries(tracking.map((t) => [t.id, t]));

  return members.map(({ id, name, city }) => {
    const history = trackingById[id]?.history ?? [];
    const paidThisTour = history.length > 0 ? history[history.length - 1] : false;
    return { id, name, city, status: paidThisTour ? "paid" : "unpaid" };
  });
}

// Cagnotte distribuée au bénéficiaire du tour : celle du niveau consulté
// (voir Simulateur/data.js — la même valeur affichée sur la page
// Simulateur/le tableau comparatif), pas un montant inventé à part.
export function getMonthlyCagnotte(levelKey) {
  const level = levels.find((l) => l.key === levelKey);
  return level?.cagnotte ?? 0;
}

// Décalage (en mois) entre le départ du cycle affiché et aujourd'hui, par
// niveau. "starter" reste à mi-cycle (tour 7 "en cours", comme avant) ;
// "batisseur" est volontairement calé pour que ses 12 tours soient déjà
// tous clôturés — pour pouvoir montrer/tester le bouton "Choisir la
// suite" (voir NextStepButton.jsx, actif seulement quand un cycle est
// entièrement terminé) sans attendre un an. En changeant de niveau
// depuis le badge (voir components/LevelSwitcherBadge.jsx), on voit donc
// les deux cas de figure : un cycle en cours, et un cycle terminé.
const CYCLE_OFFSET_MONTHS_BY_LEVEL = {
  starter: 6,
  batisseur: 12,
};

function getCycleStart(levelKey) {
  const offsetMonths = CYCLE_OFFSET_MONTHS_BY_LEVEL[levelKey] ?? 6;
  return dayjs().startOf("month").subtract(offsetMonths, "month");
}

function getTourStatus(month) {
  const now = dayjs();
  if (month.isSame(now, "month")) return "current";
  return month.isBefore(now, "month") ? "closed" : "upcoming";
}

// Les 12 tours du cycle annuel pour le niveau consulté : qui reçoit la
// cagnotte, quel mois, et où ce tour en est ("closed" = déjà distribué,
// "current" = ce mois-ci, "upcoming" = pas encore atteint).
export function getTontineCycle(levelKey) {
  const members = tontineMembersByLevel[levelKey] ?? [];
  if (members.length === 0) return [];

  const cycleStart = getCycleStart(levelKey);

  return Array.from({ length: 12 }, (_, i) => {
    const month = cycleStart.add(i, "month");
    const member = members[i % members.length];
    return {
      tour: i + 1,
      memberId: member.id,
      memberName: member.name,
      month,
      status: getTourStatus(month),
    };
  });
}

// Vrai une fois que les 12 tours affichés sont tous clôturés — le cycle
// de ce niveau est terminé, le membre doit choisir la suite (voir
// NextStepButton.jsx).
export function isCycleComplete(levelKey) {
  const cycle = getTontineCycle(levelKey);
  return cycle.length > 0 && cycle.every((tour) => tour.status === "closed");
}

// Le tour en cours (pour la bannière "Cagnotte du mois"). Si le cycle est
// entièrement clôturé (aucun tour "current"), on retombe sur le DERNIER
// tour plutôt que le premier : c'est la référence la plus pertinente une
// fois le cycle terminé (voir CagnotteHero.jsx, qui affiche alors un état
// "cycle terminé" plutôt qu'un tour "en cours" qui n'existe plus).
export function getCurrentTour(levelKey) {
  const cycle = getTontineCycle(levelKey);
  return cycle.find((t) => t.status === "current") ?? cycle[cycle.length - 1] ?? null;
}

// Retrouve l'entrée du membre connecté dans le groupe de ce niveau (voir
// la note en haut de fichier) — "null" si jamais absent, pour que les
// fonctions ci-dessous se dégradent proprement plutôt que planter.
function getMyMemberId(levelKey) {
  const members = tontineMembersByLevel[levelKey] ?? [];
  return members.find((m) => m.isMe)?.id ?? null;
}

// Jour du mois où la cotisation est due, pour tous les niveaux : celui choisi
// par l'admin dans Paramètres > Tontine (voir
// Admin/Parametres/platformSettings.js — le 5 par défaut), relu à chaque
// appel.
const getPaymentDueDay = () => getContributionDay();

// Résumé de "mon" prochain versement pour la carte "Mon prochain
// versement" (voir MyTontineStatus.jsx) : montant (celui du niveau),
// prochaine échéance (le 5 du mois courant, ou du mois prochain si on a
// dépassé le 5), et si je suis en retard sur ce niveau (dérivé de
// "getCotisationTracking" - "isUpToDate" - pour garder une seule source
// de vérité sur qui a payé quoi).
export function getMyNextPayment(levelKey) {
  const level = levels.find((l) => l.key === levelKey);
  const myId = getMyMemberId(levelKey);
  const tracking = getCotisationTracking(levelKey);
  const mine = tracking.find((m) => m.id === myId);

  const now = dayjs();
  const dueDay = getPaymentDueDay();
  const dueThisMonth = now.date(dueDay);
  const dueDate = now.date() > dueDay ? dueThisMonth.add(1, "month") : dueThisMonth;

  return {
    amount: level?.cotisation ?? 0,
    dueDate,
    isLate: mine ? !mine.isUpToDate : false,
  };
}

// "C'est votre tour dans X mois" : retrouve le tour du cycle qui revient
// au membre connecté et sa position par rapport au tour en cours
// ("monthsAway" : 0 = ce mois-ci, >0 = dans X mois, <0 = déjà passé).
// "null" si le membre n'est pas dans ce groupe (ne devrait plus arriver
// depuis le correctif ci-dessus, mais on reste défensif).
//
// Avec 6 membres sur un cycle de 12 tours, CHAQUE membre revient deux
// fois (ex: tours 3 ET 9) — prendre le premier trouvé dans l'ordre du
// cycle aurait presque toujours renvoyé l'occurrence la plus ANCIENNE
// (donc "déjà passée"), même quand une occurrence à venir existe plus
// loin dans le même cycle (constaté en testant : le tour 3, déjà passé,
// masquait le tour 9, encore à venir). On choisit donc, par ordre de
// préférence : l'occurrence "en cours" s'il y en a une, sinon la plus
// proche "à venir", et seulement à défaut la plus récente déjà close.
export function getMyNextTurn(levelKey) {
  const myId = getMyMemberId(levelKey);
  if (!myId) return null;

  const cycle = getTontineCycle(levelKey);
  const myTours = cycle.filter((t) => t.memberId === myId);
  const current = getCurrentTour(levelKey);
  if (myTours.length === 0 || !current) return null;

  const myTour =
    myTours.find((t) => t.status === "current") ??
    myTours.find((t) => t.status === "upcoming") ??
    myTours[myTours.length - 1];

  return {
    tour: myTour.tour,
    month: myTour.month,
    status: myTour.status,
    monthsAway: myTour.tour - current.tour,
  };
}

// Cycles précédents déjà clôturés à ce niveau, pour la section
// "Historique des cycles précédents" (voir CycleHistory.jsx). Donnée de
// démonstration : un seul cycle antérieur pour "batisseur" (pour avoir
// quelque chose à montrer autre que l'état vide), aucun pour "starter"
// puisque c'est la première tontine du membre à ce niveau — à remplacer
// par le vrai historique une fois le backend branché.
const CYCLE_HISTORY_BY_LEVEL = {
  starter: [],
  batisseur: [{ cycleLabel: "2024", totalTours: 12, myTour: 5 }],
};

export function getCycleHistory(levelKey) {
  const level = levels.find((l) => l.key === levelKey);
  const history = CYCLE_HISTORY_BY_LEVEL[levelKey] ?? [];
  return history.map((entry) => ({ ...entry, amountReceived: level?.cagnotte ?? 0 }));
}
