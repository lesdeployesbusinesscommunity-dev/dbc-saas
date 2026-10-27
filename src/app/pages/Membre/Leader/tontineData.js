// Import Dependencies
import dayjs from "dayjs";
import { useMemo } from "react";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { getGroups } from "app/pages/Admin/Tontine/mockData";
import { useTontineLedger } from "app/pages/Admin/Tontine/tontineLedger";
import { inCities, useLeaderProfile } from "./leaderAccess";

// ----------------------------------------------------------------------
// L'évolution des TONTINES DE L'ANTENNE, pour l'onglet "Tontine" du leader.
// On part des groupes de tontine de la plateforme (Gestion des tontines, côté
// admin) et on ne garde, dans chaque groupe, les membres qui habitent dans les
// villes de l'antenne. Un groupe réunit 36 personnes sur 12 mois, avec 3
// bénéficiaires par mois : l'antenne n'en a donc que quelques-uns dans chaque
// groupe.

const MONTHS_BEFORE = 5;
const MONTHS_AFTER = 6;

// Les groupes (en cours, à démarrer ou terminés) où l'antenne a des membres,
// avec pour chacun l'état de ses membres. Rien n'est renvoyé pour un leader
// sans antenne.
export function buildAntenneTontine(leader, groups) {
  if (!leader) return null;

  const rows = groups
    .map((group) => {
      const members = group.members
        .filter((member) => inCities(member.city, leader.cities))
        .map((member) => {
          const nextTour = group.schedule.find(
            (slot) => slot.status !== "closed" && slot.members.some((entry) => entry.id === member.id),
          );
          const ownTour = group.schedule.find((slot) => slot.members.some((entry) => entry.id === member.id));
          // Le tour en cours, pas encore payé mais pas encore échu, n'est pas un retard.
          const overdue = Math.max(0, member.missedCount - (member.isAwaiting ? 1 : 0));
          const beneficiary = group.beneficiaries.find((entry) => entry.id === member.id) ?? null;
          return {
            id: member.id,
            name: member.name,
            city: member.city,
            paidThisMonth: member.paidThisMonth,
            isLate: member.isLate,
            isAwaiting: member.isAwaiting,
            overdue,
            isBeneficiary: member.isBeneficiary,
            payoutDate: beneficiary?.payoutDate ?? null,
            receivedTours: member.receivedTours,
            turn: ownTour ? { tour: ownTour.tour, month: ownTour.month, status: ownTour.status } : null,
            nextMonth: nextTour?.month ?? null,
            history: member.history,
          };
        });
      return { group, members };
    })
    .filter((row) => row.members.length > 0);

  const running = rows.filter((row) => row.group.status === "running");
  const levelOf = (key) => levels.find((level) => level.key === key);

  const monthlyMembers = running.flatMap((row) => row.members);
  const paid = monthlyMembers.filter((member) => member.paidThisMonth === true).length;
  const late = running.flatMap((row) => row.members.filter((member) => member.isLate || member.overdue > 0));
  const beneficiaries = running.flatMap((row) =>
    row.members
      .filter((member) => member.isBeneficiary)
      .map((member) => ({ member, group: row.group, amount: levelOf(row.group.levelKey)?.cagnotte ?? 0 })),
  );
  const lateAmount = running.reduce(
    (sum, row) =>
      sum + row.members.reduce((inner, member) => inner + member.overdue * (levelOf(row.group.levelKey)?.cotisation ?? 0), 0),
    0,
  );

  // Cotisations payées par mois (les 6 derniers mois, le mois en cours compris)
  // et bénéficiaires de l'antenne par mois, sur la fenêtre autour d'aujourd'hui.
  const first = dayjs().startOf("month").subtract(MONTHS_BEFORE, "month");
  const months = Array.from({ length: MONTHS_BEFORE + MONTHS_AFTER + 1 }, (_, i) => first.add(i, "month"));
  const timeline = months.map((month) => {
    let due = 0;
    let paidCount = 0;
    let receiving = 0;
    let receivingAmount = 0;
    rows.forEach((row) => {
      const index = month.diff(row.group.startMonth, "month");
      row.members.forEach((member) => {
        if (index >= 0 && index < member.history.length) {
          due += 1;
          if (member.history[index]) paidCount += 1;
        }
        if (member.turn && member.turn.month.isSame(month, "month")) {
          receiving += 1;
          receivingAmount += levelOf(row.group.levelKey)?.cagnotte ?? 0;
        }
      });
    });
    return {
      month,
      key: month.format("YYYY-MM"),
      isCurrent: month.isSame(dayjs(), "month"),
      isPast: month.isBefore(dayjs(), "month"),
      due,
      paid: paidCount,
      percent: due > 0 ? Math.round((paidCount / due) * 100) : null,
      receiving,
      receivingAmount,
    };
  });

  const peopleKeys = new Set(rows.flatMap((row) => row.members.map((member) => `${member.name}|${member.city}`)));

  return {
    rows,
    timeline,
    totals: {
      groups: rows.length,
      groupsRunning: running.length,
      people: peopleKeys.size,
      seats: rows.reduce((sum, row) => sum + row.members.length, 0),
      paid,
      expected: monthlyMembers.length,
      percent: monthlyMembers.length > 0 ? Math.round((paid / monthlyMembers.length) * 100) : 0,
      late: late.length,
      lateAmount,
      beneficiaries,
      beneficiariesAmount: beneficiaries.reduce((sum, entry) => sum + entry.amount, 0),
      paidOut: beneficiaries.filter((entry) => entry.member.payoutDate).length,
    },
  };
}

export function useAntenneTontine() {
  const leader = useLeaderProfile();
  const ledger = useTontineLedger();
  return useMemo(() => buildAntenneTontine(leader, getGroups(ledger)), [leader, ledger]);
}
