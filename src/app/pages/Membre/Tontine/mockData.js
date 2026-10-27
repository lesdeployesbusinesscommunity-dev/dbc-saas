// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { currentMember } from "../currentMember";
import { levels } from "app/pages/Simulateur/data";
import { getContributionDay } from "app/pages/Admin/Parametres/platformSettings";
import { GROUP_SIZE, PER_TOUR, TOTAL_TOURS, demoPersonAt } from "./tontineModel";

// ----------------------------------------------------------------------
// Données de démonstration pour "Ma Tontine" — à remplacer par de vrais
// appels API (groupe réel, historique des cotisations, tours déjà
// distribués...) une fois l'intégration backend faite, sans changer la
// forme de ce que ces fonctions renvoient.
//
// "getMyMemberId" (plus bas) retrouve l'entrée du membre connecté dans ce
// groupe par son matricule — ce qui suppose qu'il y figure à CHAQUE niveau
// auquel il cotise (Thierry Mbida est dans les groupes "starter" et
// "batisseur").
//
// Groupe de tontine par niveau, dans l'ORDRE DE PASSAGE (qui reçoit la
// cagnotte à quel tour du cycle annuel). Un groupe réunit 36 personnes sur
// 12 mois : 3 personnes reçoivent la cagnotte chaque mois, donc les 3
// premières du groupe au tour 1, les 3 suivantes au tour 2, etc. (voir
// tontineModel.js). C'est le même groupe que celui utilisé
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

// Le groupe d'un niveau : 36 places dans l'ordre de passage. "fixed" donne
// les personnes connues de l'application à leur position (0 à 35) ; les
// autres places sont remplies avec des noms de démonstration, à partir de
// l'indice "firstIndex" (voir tontineModel.js).
function buildGroup(prefix, fixed, firstIndex) {
  let next = firstIndex;
  return Array.from({ length: GROUP_SIZE }, (_, position) => {
    const id = `${prefix}-${position + 1}`;
    const known = fixed[position];
    if (known) return typeof known === "function" ? known(id) : { id, ...known };
    const person = demoPersonAt(next);
    next += 1;
    return { id, name: person.name, city: person.city };
  });
}

// Starter : le tour 7 est en cours, donc les places 19 à 21 (tour 7) reçoivent
// ce mois-ci — dont l'administrateur (place 20). Thierry Mbida reçoit au tour 9.
// Bâtisseur : cycle terminé ; Thierry y a reçu au tour 5.
const tontineMembersByLevel = {
  starter: buildGroup(
    "ts",
    {
      4: { name: "Marie Atangana", city: "Yaoundé, Cameroun" },
      5: { name: "Patrick Essono", city: "Yaoundé, Cameroun" },
      10: { name: "Céleste Mbida", city: "Douala, Cameroun" },
      19: (id) => mySlot(id, "DBC-1-0001", "Hubert Wakap", "Douala, Cameroun"),
      26: (id) => mySlot(id, "DBC-1-0042", "Thierry Mbida", "Douala, Cameroun"),
      30: { name: "Diane Fouda", city: "Garoua, Cameroun" },
    },
    500,
  ),
  batisseur: buildGroup(
    "tb",
    {
      2: { name: "Samuel Okafor", city: "Lagos, Nigéria" },
      7: { name: "Kwame Asante", city: "Kumasi, Ghana" },
      13: (id) => mySlot(id, "DBC-1-0042", "Thierry Mbida", "Douala, Cameroun"),
      15: { name: "Amara Chukwu", city: "Abuja, Nigéria" },
      22: { name: "Fatou Diallo", city: "Dakar, Sénégal" },
      29: { name: "Ibrahim Touré", city: "Abidjan, Côte d'Ivoire" },
    },
    540,
  ),
};

// Historique de cotisation, tour par tour, par membre — "true" = cotisé,
// "false" = pas encore cotisé à ce tour. Quelques trous volontaires
// (Patrick Essono, Kwame Asante) pour illustrer un membre en retard dans
// le suivi (voir CotisationTracking.jsx). Donnée de démonstration : les
// vrais montants/mois viendront du backend, seule la FORME (un booléen
// par tour déjà entamé) restera la même.
const PAID_6_THEN_UNPAID = [true, true, true, true, true, true, false];

const paidHistoryByLevel = {
  starter: {
    "ts-9": PAID_6_THEN_UNPAID,
    "ts-6": [true, true, true, false, true, false, false],
    "ts-27": PAID_6_THEN_UNPAID,
    "ts-34": PAID_6_THEN_UNPAID,
  },
  batisseur: {
    "tb-8": [true, false, true, true, false, true, false],
    "tb-23": [true, true, false, true, true, true, true],
    "tb-30": [true, true, true, false, true, true, true],
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
// cagnotte (3 personnes par tour), quel mois, et où ce tour en est
// ("closed" = déjà distribué, "current" = ce mois-ci, "upcoming" = pas
// encore atteint). "members" : les bénéficiaires du tour, { id, name, city }.
export function getTontineCycle(levelKey) {
  const members = tontineMembersByLevel[levelKey] ?? [];
  if (members.length === 0) return [];

  const cycleStart = getCycleStart(levelKey);

  return Array.from({ length: TOTAL_TOURS }, (_, i) => {
    const month = cycleStart.add(i, "month");
    const beneficiaries = members
      .slice(i * PER_TOUR, (i + 1) * PER_TOUR)
      .map(({ id, name, city }) => ({ id, name, city }));
    return {
      tour: i + 1,
      members: beneficiaries,
      memberIds: beneficiaries.map((member) => member.id),
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
// Chaque membre reçoit la cagnotte UNE seule fois par cycle (36 membres,
// 12 tours, 3 bénéficiaires par tour). "null" si le membre n'est pas dans
// ce groupe, pour se dégrader proprement plutôt que planter.
export function getMyNextTurn(levelKey) {
  const myId = getMyMemberId(levelKey);
  if (!myId) return null;

  const cycle = getTontineCycle(levelKey);
  const myTour = cycle.find((t) => t.memberIds.includes(myId));
  const current = getCurrentTour(levelKey);
  if (!myTour || !current) return null;

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
  batisseur: [{ cycleLabel: "2024", totalTours: TOTAL_TOURS, myTour: 5 }],
};

export function getCycleHistory(levelKey) {
  const level = levels.find((l) => l.key === levelKey);
  const history = CYCLE_HISTORY_BY_LEVEL[levelKey] ?? [];
  return history.map((entry) => ({ ...entry, amountReceived: level?.cagnotte ?? 0 }));
}
