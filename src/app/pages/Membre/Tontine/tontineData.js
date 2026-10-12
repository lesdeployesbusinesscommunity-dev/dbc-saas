// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { getMemberStore } from "../memberStore";

// ----------------------------------------------------------------------
// Données de "Ma Tontine", tirées de GET /tontine/ma-tontine pour chaque
// niveau du membre (voir memberStore.js), sans changer la forme que les
// composants attendent.
//
// Fonctionnement réel (règles DBC) : une VAGUE réunit 11 membres au plus d'un
// même niveau. Le 1er mois de chaque membre revient à DBC ; ensuite, dès que
// la caisse couvre la cagnotte, le plus ancien de la vague qui n'a pas encore
// "bouffé" la reçoit. Le cycle affiché suit les mois de la vague : les mois
// passés montrent qui a réellement reçu la cagnotte, les mois à venir une
// projection (si chacun paie à l'heure).

const view = (levelKey) => getMemberStore().tontineByLevel[levelKey] ?? null;
const waveOf = (levelKey) => view(levelKey)?.wave ?? null;

// L'état de ma participation à ce niveau : vague en cours, liste d'attente,
// ou rien encore (le membre peut alors rejoindre la vague la plus récente).
export function getWaveState(levelKey) {
  const current = view(levelKey);
  return {
    levelCode: current?.levelCode ?? null,
    wave: current?.wave ?? null,
    waitingList: current?.waitingList ?? null,
    hasPastWaves: (current?.pastWaves.length ?? 0) > 0,
  };
}

// Suivi des cotisations de tout le groupe : une case par cotisation déjà due
// depuis l'entrée de chacun dans la vague ("true" = payée).
export function getCotisationTracking(levelKey) {
  const wave = waveOf(levelKey);
  if (!wave) return [];
  return wave.members.map((member) => {
    const paidCount = member.history.filter(Boolean).length;
    return {
      id: member.memberId,
      name: member.name,
      cotisation: wave.monthlyContribution,
      history: member.history,
      paidCount,
      totalTours: member.contributionsDue,
      isUpToDate: !member.late,
    };
  });
}

// Le groupe, dans l'ordre de passage (ancienneté dans la vague), avec "a payé
// ce qu'il devait à ce jour" ou non.
export function getTontineGroup(levelKey) {
  const wave = waveOf(levelKey);
  if (!wave) return [];
  return wave.members.map((member) => ({
    id: member.memberId,
    name: member.name,
    city: member.city ?? "",
    status: member.late ? "unpaid" : "paid",
  }));
}

// Cagnotte reçue par le bénéficiaire : celle du niveau consulté.
export function getMonthlyCagnotte(levelKey) {
  return view(levelKey)?.payoutAmount ?? levels.find((l) => l.key === levelKey)?.cagnotte ?? 0;
}

// Les mois de la vague, avec qui reçoit la cagnotte chaque mois ("closed" =
// passé, "current" = ce mois-ci, "upcoming" = à venir, projeté). Le 1er mois
// revient à DBC ; un mois sans bénéficiaire (la caisse se remplit) est
// marqué "—".
export function getTontineCycle(levelKey) {
  const wave = waveOf(levelKey);
  if (!wave) return [];
  const nameOf = (memberId) => wave.members.find((member) => member.memberId === memberId)?.name ?? "";

  return wave.calendar.map((month) => {
    const beneficiaries = month.beneficiaryMemberIds;
    return {
      tour: month.month,
      memberId: beneficiaries[0] ?? null,
      memberIds: beneficiaries,
      memberName: beneficiaries.length
        ? beneficiaries.map(nameOf).join(" & ")
        : month.forDbc
          ? "DBC"
          : "—",
      month: dayjs(month.startsOn),
      status: month.status,
      projected: month.projected,
      forDbc: month.forDbc,
    };
  });
}

// Vrai quand le membre a terminé une vague à ce niveau (cagnotte reçue et 12
// cotisations payées) et n'en a pas encore rejoint une nouvelle : il doit
// choisir la suite (voir NextStepButton.jsx).
export function isCycleComplete(levelKey) {
  const state = getWaveState(levelKey);
  return !state.wave && !state.waitingList && state.hasPastWaves;
}

// Le mois en cours de la vague (bannière "Cagnotte du mois") ; à défaut, le
// dernier mois connu.
export function getCurrentTour(levelKey) {
  const cycle = getTontineCycle(levelKey);
  return cycle.find((t) => t.status === "current") ?? cycle[cycle.length - 1] ?? null;
}

// "Mon prochain versement" : ce que je dépose (cotisation + frais de
// retrait), ma prochaine échéance, et si je suis en retard à ce niveau.
export function getMyNextPayment(levelKey) {
  const wave = waveOf(levelKey);
  const level = levels.find((l) => l.key === levelKey);
  if (!wave) {
    return { amount: view(levelKey)?.monthlyContribution ?? level?.cotisation ?? 0, dueDate: dayjs(), isLate: false };
  }
  return {
    amount: wave.nextDepositAmount,
    dueDate: wave.nextDueDate ? dayjs(wave.nextDueDate) : dayjs(),
    isLate: wave.late,
    allPaid: !wave.nextDueDate,
  };
}

// "C'est votre tour dans X mois" : le mois où la cagnotte me revient (réel
// si c'est passé, projeté sinon) et sa distance au mois en cours
// ("monthsAway" : 0 = ce mois-ci, >0 = dans X mois, <0 = déjà passé).
export function getMyNextTurn(levelKey) {
  const wave = waveOf(levelKey);
  const me = wave?.members.find((member) => member.isMe);
  const current = getCurrentTour(levelKey);
  if (!me || !current) return null;

  const myTour = getTontineCycle(levelKey).find((tour) => tour.memberIds.includes(me.memberId));
  if (!myTour) return null;
  return {
    tour: myTour.tour,
    month: myTour.month,
    status: myTour.status,
    monthsAway: myTour.tour - current.tour,
  };
}

// Mes vagues déjà terminées à ce niveau (section "Historique des cycles
// précédents").
export function getCycleHistory(levelKey) {
  return (view(levelKey)?.pastWaves ?? []).map((past) => ({
    cycleLabel: `${dayjs(past.startedAt).year()} · vague n°${past.number}`,
    totalTours: past.membersCount,
    myTour: past.myRank,
    amountReceived: past.receivedPayoutAt ? past.payoutAmount : 0,
  }));
}
