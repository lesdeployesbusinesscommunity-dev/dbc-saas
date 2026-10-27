// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import {
  getCotisationTracking,
  getTontineCycle,
  getTontineGroup,
} from "app/pages/Membre/Tontine/mockData";
import { GROUP_SIZE, PER_TOUR, TOTAL_TOURS, demoPersonAt } from "app/pages/Membre/Tontine/tontineModel";
import { getContributionDay } from "app/pages/Admin/Parametres/platformSettings";
import { getMembersState, listMembers } from "../Membres/membersStore";
import { getPayoutDate, getTontineLedger } from "./tontineLedger";

// ----------------------------------------------------------------------
// Données de démonstration pour "Gestion des tontines" — à remplacer par de
// vrais appels API (groupes, membres, cotisations, versements) une fois le
// backend branché, sans changer la FORME de ce que "getGroups" renvoie.
//
// Un groupe de tontine réunit 36 personnes sur un cycle de 12 mois : chaque
// mois, 3 personnes reçoivent la cagnotte (voir Membre/Tontine/tontineModel.js).
// Un niveau DBC peut compter PLUSIEURS groupes (Groupe A, B, C...). Chaque
// groupe suit son propre cycle de 12 tours : il a ses membres, son ordre de
// passage et ses 3 bénéficiaires du mois. Les groupes d'un même niveau ont
// démarré à des dates différentes, donc ils sont à des tours différents.
//
// Le Groupe A de "starter" et de "batisseur" est celui que voit le membre de
// démonstration dans son espace (Membre/Tontine/mockData.js) : on le relit
// directement de là, pour qu'une seule source dise qui a payé quoi. Les
// autres groupes sont des données de démonstration propres à l'admin.
//
// Les chiffres collent à ceux de "Gestion financière" (Finance/mockData.js) :
// le niveau Starter compte 4 groupes de 36 + 8 membres pas encore placés, etc.
// L'admin peut créer un groupe avec des membres en attente (voir
// CreateGroupModal.jsx).
//
// Les cotisations ne sont JAMAIS validées par l'admin : un membre est "payé"
// dès que son paiement est arrivé (le backend le confirmera). Ici, ce sont
// simplement les données de démonstration.
export { GROUP_SIZE, PER_TOUR, TOTAL_TOURS };

// "offset" : nombre de mois écoulés depuis le démarrage du cycle (0 = le tour
// 1 est CE mois-ci ; -1 = le groupe démarre le mois prochain ; 12 ou plus =
// cycle terminé). "unpaid" : positions (dans l'ordre de passage, de 0 à 35)
// des membres qui n'ont pas encore cotisé ce mois-ci. "missed" : [position,
// n° de tour] des cotisations manquées auparavant.
const GROUP_SPECS = {
  starter: [
    { fromMemberSpace: true },
    { offset: 3, unpaid: [1, 4, 13, 22], missed: [[4, 2], [30, 3]] },
    { offset: 9, unpaid: [], missed: [[0, 5], [21, 8]] },
    { offset: 1, unpaid: [2, 19], missed: [] },
  ],
  batisseur: [
    { fromMemberSpace: true },
    { offset: 4, unpaid: [0, 3, 5, 11, 28], missed: [[3, 2], [5, 3], [17, 4]] },
    { offset: 0, unpaid: [], missed: [] },
  ],
  batisseurPro: [
    { offset: 8, unpaid: [2, 30], missed: [[2, 4]] },
    { offset: 2, unpaid: [], missed: [] },
  ],
  performer: [{ offset: 5, unpaid: [1], missed: [] }],
  performerPro: [{ offset: 10, unpaid: [], missed: [] }],
};

// Membres du niveau qui n'ont pas encore de mois de passage (données de
// démonstration). Le niveau Starter en compte assez pour essayer de placer
// des membres ou d'ouvrir un groupe.
const WAITING_COUNT_BY_LEVEL = {
  starter: 8,
  batisseur: 3,
  batisseurPro: 2,
  performer: 3,
  performerPro: 0,
  stratege: 4,
  elite: 2,
  legende: 0,
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const monthStart = (offsetMonths = 0) => dayjs().startOf("month").subtract(offsetMonths, "month");

function tourStatus(month) {
  const now = dayjs();
  if (month.isSame(now, "month")) return "current";
  return month.isBefore(now, "month") ? "closed" : "upcoming";
}

// Un groupe "brut" (avant d'y appliquer le registre des paiements) : ses
// membres dans l'ordre de passage, avec l'historique de cotisation tour par
// tour (true = cotisé), et le mois de démarrage du cycle. "perTour" : le
// nombre de bénéficiaires par mois (3 ; 1 pour un ancien groupe enregistré
// avant la règle des 36 personnes).
function buildBaseGroups(ledger) {
  let personCounter = 0;
  const groups = [];

  levels.forEach((level) => {
    (GROUP_SPECS[level.key] ?? []).forEach((spec, groupIndex) => {
      const letter = LETTERS[groupIndex];
      const id = `${level.key}-${letter}`;

      if (spec.fromMemberSpace) {
        const tracking = getCotisationTracking(level.key);
        const cities = Object.fromEntries(getTontineGroup(level.key).map((m) => [m.id, m.city]));
        const cycle = getTontineCycle(level.key);
        groups.push({
          id,
          levelKey: level.key,
          letter,
          fromMemberSpace: true,
          perTour: PER_TOUR,
          startMonth: cycle[0]?.month ?? monthStart(0),
          members: tracking.map((m) => ({
            id: m.id,
            name: m.name,
            city: cities[m.id] ?? "",
            history: [...m.history],
          })),
        });
        return;
      }

      const toursElapsed = spec.offset < 0 ? 0 : Math.min(TOTAL_TOURS, spec.offset + 1);
      const members = Array.from({ length: GROUP_SIZE }, (_, position) => {
        const person = demoPersonAt(personCounter);
        personCounter += 1;
        const history = Array.from({ length: toursElapsed }, (_unused, tourIndex) => {
          const isCurrent = tourIndex === toursElapsed - 1;
          if (isCurrent && spec.unpaid.includes(position)) return false;
          return !spec.missed.some(([who, tourNumber]) => who === position && tourNumber - 1 === tourIndex);
        });
        return { id: `${id}-${position + 1}`, name: person.name, city: person.city, history };
      });

      groups.push({
        id,
        levelKey: level.key,
        letter,
        fromMemberSpace: false,
        perTour: PER_TOUR,
        startMonth: monthStart(spec.offset),
        members,
      });
    });
  });

  // Les groupes créés par l'admin : leurs membres viennent de la liste
  // d'attente. Avant le mois de départ ils n'ont aucun historique ; une fois
  // démarrés, les tours passés sont comptés payés et celui du mois en cours
  // attend ses paiements.
  ledger.groups.forEach((record) => {
    const startMonth = dayjs(record.startMonth).startOf("month");
    const offset = monthStart(0).diff(startMonth, "month");
    // "capacity" : le nombre de places du groupe. Un groupe enregistré avant
    // cette règle n'en a pas : il garde son ancien cycle de 12 mois, un
    // bénéficiaire par mois.
    const slotted = Number.isInteger(record.capacity);
    const perTour = record.perTour ?? 1;
    const capacity = slotted ? record.capacity : TOTAL_TOURS;
    const totalTours = slotted ? Math.ceil(capacity / perTour) : TOTAL_TOURS;
    const toursElapsed = offset < 0 ? 0 : Math.min(totalTours, offset + 1);
    groups.push({
      id: record.id,
      levelKey: record.levelKey,
      letter: record.letter,
      fromMemberSpace: false,
      slotted,
      perTour,
      capacity,
      startMonth,
      members: (slotted ? [...record.members].sort((a, b) => String(a.month).localeCompare(String(b.month))) : record.members).map(
        (member) => ({
          ...member,
          history: Array.from({ length: toursElapsed }, (_unused, i) => i < toursElapsed - 1),
        }),
      ),
    });
  });

  const order = (key) => levels.findIndex((level) => level.key === key);
  return groups.sort((a, b) => order(a.levelKey) - order(b.levelKey) || a.letter.localeCompare(b.letter));
}

// Complète un groupe brut : calcule tout ce que la page affiche (bénéficiaires du mois, cotisations
// reçues, retards, versement des cagnottes...).
function deriveGroup(base, ledger, today) {
  const level = levels.find((l) => l.key === base.levelKey);
  const cotisation = level?.cotisation ?? 0;
  const size = base.members.length;
  const dueDay = getContributionDay();
  const dueDate = today.date(dueDay);

  const perTour = base.perTour ?? 1;
  const totalTours = base.slotted ? Math.ceil(base.capacity / perTour) : TOTAL_TOURS;
  const schedule = Array.from({ length: totalTours }, (_, i) => {
    const month = base.startMonth.add(i, "month");
    // Groupe à places : les membres qui ont CE mois-là (jusqu'à "perTour"). Un
    // mois sans membre est libre. Groupe de démonstration : les membres passent
    // par paquets de "perTour", chacun une seule fois par cycle.
    const picked = base.slotted
      ? base.members.filter((m) => m.month === month.format("YYYY-MM")).slice(0, perTour)
      : Array.from({ length: perTour }, (_unused, k) => base.members[(i * perTour + k) % size]);
    const tourMembers = picked.filter((member, index) => member && picked.findIndex((other) => other?.id === member.id) === index);
    return {
      tour: i + 1,
      month,
      members: tourMembers.map((member) => ({ id: member.id, name: member.name })),
      memberNames: tourMembers.map((member) => member.name).join(", "),
      free: tourMembers.length === 0,
      // Places encore libres ce mois-là (seulement pour un groupe à places).
      openSlots: base.slotted ? perTour - tourMembers.length : 0,
      status: tourStatus(month),
    };
  });

  const current = schedule.find((entry) => entry.status === "current") ?? null;
  const status = current ? "running" : schedule[0].status === "upcoming" ? "pending" : "complete";
  const tour = current ? current.tour : status === "complete" ? totalTours : 0;
  const lateDays = today.date() > dueDay ? today.date() - dueDay : 0;

  // Les mois qui ont encore au moins une place libre : ceux du mois en cours et à venir.
  const freeSlots = schedule.filter((entry) => entry.openSlots > 0 && entry.status !== "closed");

  const members = base.members.map((member, position) => {
    const history = [...member.history];
    const paidThisMonth = status === "running" ? Boolean(history[tour - 1]) : null;
    const toursElapsed = history.length;
    const paidCount = history.filter(Boolean).length;
    const receivedTours = schedule
      .filter((entry) => entry.status === "closed" && entry.members.some((m) => m.id === member.id))
      .map((entry) => entry.tour);
    const isLate = status === "running" && paidThisMonth === false && lateDays > 0;

    return {
      id: member.id,
      position: position + 1,
      name: member.name,
      city: member.city,
      history,
      toursElapsed,
      paidCount,
      missedCount: toursElapsed - paidCount,
      paidThisMonth,
      isLate,
      isAwaiting: status === "running" && paidThisMonth === false && !isLate,
      daysLate: isLate ? lateDays : 0,
      month: member.month ?? null,
      isBeneficiary: current ? current.members.some((m) => m.id === member.id) : false,
      receivedTours,
    };
  });

  const paidMembers = members.filter((m) => m.paidThisMonth === true);
  const lateMembers = members.filter((m) => m.isLate);
  const awaitingMembers = members.filter((m) => m.isAwaiting);
  const allPaid = status === "running" && paidMembers.length === size;

  // Les bénéficiaires du mois (jusqu'à 3), chacun avec l'état de SON versement :
  // la cagnotte d'un bénéficiaire se verse séparément des deux autres, et seulement
  // quand toutes les cotisations du groupe sont rentrées.
  const beneficiaries = (current?.members ?? [])
    .map((entry) => members.find((member) => member.id === entry.id))
    .filter(Boolean)
    .map((member) => {
      const payoutDate = getPayoutDate(base.id, tour, member.id, ledger);
      return { ...member, payoutDate, payoutReady: allPaid && !payoutDate };
    });

  return {
    id: base.id,
    levelKey: base.levelKey,
    letter: base.letter,
    fromMemberSpace: base.fromMemberSpace,
    status,
    tour,
    totalTours,
    perTour,
    capacity: base.slotted ? base.capacity : null,
    freeSlots,
    startMonth: base.startMonth,
    endMonth: base.startMonth.add(totalTours - 1, "month"),
    dueDate,
    schedule,
    members,
    beneficiaries,
    cotisation,
    size,
    paidCount: paidMembers.length,
    lateMembers,
    awaitingMembers,
    collected: paidMembers.length * cotisation,
    expected: status === "running" ? size * cotisation : 0,
    lateAmount: lateMembers.length * cotisation,
    // "amount" : la cagnotte de CHAQUE bénéficiaire ; "total" : celle des
    // bénéficiaires du mois ensemble.
    payout: {
      amount: level?.cagnotte ?? 0,
      count: beneficiaries.length,
      total: (level?.cagnotte ?? 0) * beneficiaries.length,
      done: beneficiaries.filter((member) => member.payoutDate).length,
      ready: beneficiaries.filter((member) => member.payoutReady).length,
      missing: status === "running" ? size - paidMembers.length : 0,
    },
  };
}

// Tous les groupes de tous les niveaux, avec leur état ACTUEL. "ledger" :
// un instantané du registre de l'admin (voir useTontineLedger) — la page le
// passe pour se recalculer dès qu'un versement est noté ou un groupe créé.
export function getGroups(ledger = getTontineLedger()) {
  const today = dayjs();
  return buildBaseGroups(ledger).map((base) => deriveGroup(base, ledger, today));
}

// Les membres de chaque niveau qui n'ont pas encore de mois de passage. Ils
// n'ont PAS à attendre d'être nombreux : l'administration les place tout de
// suite sur un mois libre d'un groupe ouvert, ou ouvre un groupe pour eux.
// Ceux qu'elle a déjà placés n'y figurent plus.
export function getWaitingByLevel(ledger = getTontineLedger(), membersSnapshot = getMembersState()) {
  const placed = new Set(ledger.groups.flatMap((group) => group.members.map((member) => member.id)));
  // Les membres créés dans "Gestion des membres" (identifiant "m-…") et pas encore
  // placés attendent eux aussi un mois de passage — dès leur création.
  const created = listMembers(membersSnapshot).filter(
    (member) => String(member.id).startsWith("m-") && member.status !== "desactive" && !placed.has(member.id),
  );
  let counter = 400;
  return levels
    .map((level) => {
      const count = WAITING_COUNT_BY_LEVEL[level.key] ?? 0;
      const demo = Array.from({ length: count }, (_, i) => {
        const person = demoPersonAt(counter);
        counter += 1;
        return {
          id: `${level.key}-wait-${i + 1}`,
          name: person.name,
          city: person.city,
          waitingDays: 6 + ((counter * 5) % 40),
        };
      }).filter((member) => !placed.has(member.id));
      const real = created
        .filter((member) => member.levelKey === level.key)
        .map((member) => ({
          id: member.id,
          name: member.name,
          city: member.city ?? "",
          waitingDays: Math.max(0, dayjs().startOf("day").diff(dayjs(member.joinedAt), "day")),
        }));
      return { levelKey: level.key, members: [...real, ...demo] };
    })
    .filter((entry) => entry.members.length > 0);
}

// La lettre du prochain groupe d'un niveau ("C" s'il en a déjà deux).
export function nextGroupLetter(groups, levelKey) {
  return LETTERS[groups.filter((group) => group.levelKey === levelKey).length];
}

// Chiffres d'ensemble d'une liste de groupes (déjà filtrée par niveau si
// besoin) : tout ce que montrent les cartes du haut de page. Chaque groupe en
// cours compte jusqu'à 3 bénéficiaires, donc "beneficiariesCount" et les
// versements se comptent par PERSONNE, pas par groupe.
export function summarizeGroups(groups) {
  const running = groups.filter((g) => g.status === "running");
  const lateMembers = running.flatMap((g) =>
    g.lateMembers.map((member) => ({ group: g, member, amount: g.cotisation })),
  );

  return {
    groupsTotal: groups.length,
    groupsRunning: running.length,
    groupsComplete: groups.filter((g) => g.status === "complete").length,
    groupsPending: groups.filter((g) => g.status === "pending").length,
    contributionsPaid: running.reduce((sum, g) => sum + g.paidCount, 0),
    contributionsExpected: running.reduce((sum, g) => sum + g.size, 0),
    amountCollected: running.reduce((sum, g) => sum + g.collected, 0),
    amountExpected: running.reduce((sum, g) => sum + g.expected, 0),
    beneficiariesCount: running.reduce((sum, g) => sum + g.payout.count, 0),
    payoutsTotal: running.reduce((sum, g) => sum + g.payout.total, 0),
    payoutsDone: running.reduce((sum, g) => sum + g.payout.done, 0),
    payoutsReady: running.reduce((sum, g) => sum + g.payout.ready, 0),
    lateCount: lateMembers.length,
    lateAmount: lateMembers.reduce((sum, entry) => sum + entry.amount, 0),
    lateGroups: new Set(lateMembers.map((entry) => entry.group.id)).size,
    lateMembers,
  };
}

// "Marie Atangana" -> "Marie A." (pour les cases étroites du planning).
export function shortName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// L'état d'un groupe en un mot : en retard, en attente de cotisations, à
// jour, cycle terminé ou pas encore démarré. Le retard prime sur l'attente :
// c'est ce que l'admin doit voir en premier.
export function getGroupHealth(group) {
  if (group.status === "complete") return "complete";
  if (group.status === "pending") return "pending";
  if (group.lateMembers.length > 0) return "late";
  if (group.awaitingMembers.length > 0) return "awaiting";
  return "ok";
}
