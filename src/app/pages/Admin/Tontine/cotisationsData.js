// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { getContributionDay } from "app/pages/Admin/Parametres/platformSettings";

// ----------------------------------------------------------------------
// Le "Suivi des cotisations" de l'admin : qui a cotisé ce mois-ci et qui ne l'a
// pas fait, groupe par groupe — et aussi pour les membres SANS groupe, qui
// cotisent déjà alors qu'ils n'ont pas encore d'ordre de passage.
//
// Une "section" = un groupe en cours, ou les membres sans groupe d'un niveau :
//   { key, kind: "group" | "waiting", levelKey, letter?, tour?, totalTours?,
//     cotisation, members: [Member], size, paid, late, awaiting,
//     collected, expected, lateAmount }
// Un "Member" : { id, name, city, history: [bool], firstMonth (dayjs),
//   state: "paid" | "late" | "awaiting", daysLate, missed, paidCount }
// "history" : un booléen par mois depuis le premier mois cotisé (le dernier
// est le mois en cours).

const MAX_HISTORY = 12;

// Un petit code stable par membre, pour que les données de démonstration des
// membres sans groupe ne changent pas d'un affichage à l'autre.
const hashOf = (value) => {
  let hash = 0;
  for (const char of String(value)) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return hash;
};

const countMembers = (members, state) => members.filter((member) => member.state === state).length;

function finishSection(base, members) {
  const paid = countMembers(members, "paid");
  const late = countMembers(members, "late");
  const awaiting = countMembers(members, "awaiting");
  return {
    ...base,
    members,
    size: members.length,
    paid,
    late,
    awaiting,
    collected: paid * base.cotisation,
    expected: members.length * base.cotisation,
    lateAmount: late * base.cotisation,
  };
}

// Les membres d'un groupe en cours : l'historique vient du groupe (un booléen
// par tour déjà entamé). Un tour pas encore payé mais pas encore échu est
// "à payer", pas "en retard".
function groupSection(group) {
  const members = group.members.map((member) => {
    const state = member.paidThisMonth ? "paid" : member.isLate ? "late" : "awaiting";
    return {
      id: member.id,
      name: member.name,
      city: member.city,
      history: member.history,
      firstMonth: group.startMonth,
      state,
      daysLate: member.daysLate,
      missed: Math.max(0, member.missedCount - (state === "awaiting" ? 1 : 0)),
      paidCount: member.paidCount,
    };
  });
  return finishSection(
    {
      key: group.id,
      kind: "group",
      levelKey: group.levelKey,
      letter: group.letter,
      groupId: group.id,
      tour: group.tour,
      totalTours: group.totalTours,
      cotisation: group.cotisation,
    },
    members,
  );
}

// Les membres sans groupe : ils cotisent chaque mois depuis leur arrivée (au
// plus les 12 derniers mois affichés). Données de démonstration, en attendant
// le backend : la plupart sont à jour, quelques-uns ont manqué un mois.
function waitingSection(entry, today, dueDay) {
  const level = levels.find((item) => item.key === entry.levelKey);
  const lateDays = today.date() > dueDay ? today.date() - dueDay : 0;
  const members = entry.members.map((member) => {
    const joined = today.startOf("day").subtract(member.waitingDays ?? 0, "day");
    const monthsSince = Math.min(MAX_HISTORY, today.startOf("month").diff(joined.startOf("month"), "month") + 1);
    const code = hashOf(member.id);
    const history = Array.from({ length: monthsSince }, (_unused, index) => {
      const isCurrent = index === monthsSince - 1;
      if (isCurrent) return code % 6 !== 0;
      if (monthsSince > 2 && index === 1) return code % 4 !== 1;
      return true;
    });
    const paidThisMonth = history[history.length - 1];
    const state = paidThisMonth ? "paid" : lateDays > 0 ? "late" : "awaiting";
    const missed = history.filter((paid) => !paid).length - (state === "awaiting" ? 1 : 0);
    return {
      id: member.id,
      name: member.name,
      city: member.city,
      history,
      firstMonth: today.startOf("month").subtract(monthsSince - 1, "month"),
      state,
      daysLate: state === "late" ? lateDays : 0,
      missed: Math.max(0, missed),
      paidCount: history.filter(Boolean).length,
    };
  });
  return finishSection(
    { key: `wait-${entry.levelKey}`, kind: "waiting", levelKey: entry.levelKey, cotisation: level?.cotisation ?? 0 },
    members,
  );
}

// Les groupes en cours (un cycle terminé ou pas encore démarré ne cotise pas ce
// mois-ci), puis les membres sans groupe, dans l'ordre des niveaux.
export function buildCotisationSections(groups, waitingByLevel, today = dayjs()) {
  const dueDay = getContributionDay();
  const levelOrder = new Map(levels.map((level, index) => [level.key, index]));
  const fromGroups = groups.filter((group) => group.status === "running").map(groupSection);
  const fromWaiting = waitingByLevel.map((entry) => waitingSection(entry, today, dueDay));
  return [...fromGroups, ...fromWaiting].sort(
    (a, b) =>
      levelOrder.get(a.levelKey) - levelOrder.get(b.levelKey) ||
      Number(a.kind === "waiting") - Number(b.kind === "waiting") ||
      String(a.letter ?? "").localeCompare(String(b.letter ?? "")),
  );
}

export function summarizeSections(sections) {
  const sum = (key, filter = () => true) =>
    sections.filter(filter).reduce((total, section) => total + section[key], 0);
  const isWaiting = (section) => section.kind === "waiting";
  return {
    size: sum("size"),
    paid: sum("paid"),
    late: sum("late"),
    awaiting: sum("awaiting"),
    collected: sum("collected"),
    expected: sum("expected"),
    lateAmount: sum("lateAmount"),
    waitingSize: sum("size", isWaiting),
    waitingLate: sum("late", isWaiting),
    waitingPaid: sum("paid", isWaiting),
  };
}
